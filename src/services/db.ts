import { deleteDB, openDB, type DBSchema } from 'idb'

import type { ArticleDetail } from '@/types/models'

const DB_NAME = 'infinity-scroll-db'
const DB_VERSION = 1

export interface FeedBodyRecord {
  id: string
  body: string
  generatedAt: string
}

export interface SavedArticleBodyRecord {
  id: string
  detail: ArticleDetail
  text: string
}

interface InfinityScrollDb extends DBSchema {
  feedBodies: {
    key: string
    value: FeedBodyRecord
  }
  articleDetails: {
    key: string
    value: ArticleDetail
  }
  savedArticleBodies: {
    key: string
    value: SavedArticleBodyRecord
  }
}

let dbPromise: ReturnType<typeof openDB<InfinityScrollDb>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<InfinityScrollDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('feedBodies')) {
          db.createObjectStore('feedBodies', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('articleDetails')) {
          db.createObjectStore('articleDetails', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('savedArticleBodies')) {
          db.createObjectStore('savedArticleBodies', { keyPath: 'id' })
        }
      },
    })
  }

  return dbPromise
}

export async function putFeedBody(record: FeedBodyRecord): Promise<void> {
  const db = await getDb()
  await db.put('feedBodies', record)
}

export async function getFeedBody(id: string): Promise<FeedBodyRecord | undefined> {
  const db = await getDb()
  return db.get('feedBodies', id)
}

export async function putArticleDetail(detail: ArticleDetail): Promise<void> {
  const db = await getDb()
  await db.put('articleDetails', detail)
}

export async function getArticleDetail(id: string): Promise<ArticleDetail | undefined> {
  const db = await getDb()
  return db.get('articleDetails', id)
}

export async function putSavedArticleBody(record: SavedArticleBodyRecord): Promise<void> {
  const db = await getDb()
  await db.put('savedArticleBodies', record)
}

export async function getSavedArticleBody(id: string): Promise<SavedArticleBodyRecord | undefined> {
  const db = await getDb()
  return db.get('savedArticleBodies', id)
}

export async function getAllSavedArticleBodies(): Promise<SavedArticleBodyRecord[]> {
  const db = await getDb()
  return db.getAll('savedArticleBodies')
}

export async function clearDatabase(): Promise<void> {
  dbPromise = null
  await deleteDB(DB_NAME)
}
