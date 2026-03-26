import type { FeedItem, TopicPreference } from '@/types/models'
import { slugify } from '@/utils/id'

function upsertPreference(
  preferences: TopicPreference[],
  label: string,
  delta: number,
  timestamp: string,
): TopicPreference[] {
  const key = slugify(label)
  const existing = preferences.find((entry) => entry.key === key)

  if (existing) {
    existing.score = Math.max(0, existing.score + delta)
    existing.lastLikedAt = timestamp
    existing.label = label
    return preferences
  }

  preferences.push({
    key,
    label,
    score: Math.max(0, delta),
    lastLikedAt: timestamp,
  })

  return preferences
}

export function usePersonalization() {
  function applyLikeSignal(
    existingPreferences: TopicPreference[],
    item: FeedItem,
    liked: boolean,
  ): TopicPreference[] {
    const next = existingPreferences.map((entry) => ({ ...entry }))
    const delta = liked ? 1.4 : -1
    const timestamp = new Date().toISOString()

    upsertPreference(next, item.topic, delta, timestamp)
    item.subtopics.forEach((subtopic) => {
      upsertPreference(next, subtopic, liked ? 0.8 : -0.5, timestamp)
    })

    return next
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 24)
  }

  function preferenceDigest(preferences: TopicPreference[], limit = 5): string {
    if (!preferences.length) {
      return 'No strong preference signal yet. Keep the feed exploratory.'
    }

    return preferences
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map((entry) => `${entry.label} (${entry.score.toFixed(1)})`)
      .join(', ')
  }

  return {
    applyLikeSignal,
    preferenceDigest,
  }
}
