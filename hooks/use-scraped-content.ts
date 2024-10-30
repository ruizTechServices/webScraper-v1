'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ScrapedContent, type ContentItem } from '@/lib/db'
import { toast } from 'sonner'

interface UseScrapedContentReturn {
  content: ScrapedContent[]
  loading: boolean
  error: Error | null
  addContent: (url: string, content: Array<{ content: string; text: string }>) => Promise<number>
  updateContent: (id: string, newContent: string) => Promise<void>
  deleteContent: (id: string) => Promise<void>
  clearAllContent: () => Promise<void>
}

export function useScrapedContent(): UseScrapedContentReturn {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const content = useLiveQuery(
    async () => {
      try {
        const results = await db.getAllContent()
        return results
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch content'))
        return []
      }
    },
    [],
    []
  )

  useEffect(() => {
    if (content !== undefined) {
      setLoading(false)
    }
  }, [content])

  const addContent = useCallback(async (
    url: string,
    newContent: Array<{ content: string; text: string }>
  ): Promise<number> => {
    try {
      const id = await db.addContent(url, newContent)
      toast.success('Content added successfully')
      // Ensure we return a number
      return typeof id === 'number' ? id : parseInt(id as string, 10)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  const updateContent = useCallback(async (id: string, newContent: string) => {
    try {
      await db.updateContentItem(id, newContent)
      toast.success('Content updated successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  const deleteContent = useCallback(async (id: string) => {
    try {
      await db.deleteContentItem(id)
      toast.success('Content deleted successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  const clearAllContent = useCallback(async () => {
    try {
      await db.clearAllContent()
      toast.success('All content cleared successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  return {
    content: content || [],
    loading,
    error,
    addContent,
    updateContent,
    deleteContent,
    clearAllContent,
  }
}