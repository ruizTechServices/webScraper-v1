'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ScrapedContent } from '@/lib/db'
import { toast } from 'sonner'

interface UseScrapedContentReturn {
  content: ScrapedContent[]
  loading: boolean
  error: Error | null
  addContent: (url: string, content: Array<{ content: string; text: string }>) => Promise<number | undefined>
  updateContent: (url: string, contentIndex: number, newContent: string) => Promise<void>
  deleteContent: (url: string, contentIndex: number) => Promise<void>
  clearAllContent: () => Promise<void>
}

export function useScrapedContent(): UseScrapedContentReturn {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch content with live updates
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

  // Update loading state when content changes
  useEffect(() => {
    if (content !== undefined) {
      setLoading(false)
    }
  }, [content])

  // Add new content
  const addContent = useCallback(async (
    url: string,
    newContent: Array<{ content: string; text: string }>
  ) => {
    try {
      const id = await db.addContent(url, newContent)
      toast.success('Content added successfully')
      return id
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  // Update existing content
  const updateContent = useCallback(async (
    url: string,
    contentIndex: number,
    newContent: string
  ) => {
    try {
      await db.updateContent(url, contentIndex, newContent)
      toast.success('Content updated successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  // Delete content
  const deleteContent = useCallback(async (
    url: string,
    contentIndex: number
  ) => {
    try {
      await db.deleteContent(url, contentIndex)
      toast.success('Content deleted successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete content')
      toast.error(error.message)
      setError(error)
      throw error
    }
  }, [])

  // Clear all content
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