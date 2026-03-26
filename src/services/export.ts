import { getAllSavedArticleBodies } from '@/services/db'
import { useFeedStore } from '@/stores/feed'
import { useLibraryStore } from '@/stores/library'
import { useProfileStore } from '@/stores/profile'

export async function exportAppData(): Promise<void> {
  const profileStore = useProfileStore()
  const feedStore = useFeedStore()
  const libraryStore = useLibraryStore()
  const savedBodies = await getAllSavedArticleBodies()

  const payload = {
    exportedAt: new Date().toISOString(),
    profile: profileStore.$state,
    feed: feedStore.$state,
    library: libraryStore.$state,
    savedBodies,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `infinity-scroll-export-${Date.now()}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
