import Dexie, { Table } from 'dexie'

export interface ScrapedContent {
  id?: number
  url: string
  content: Array<{
    content: string
    text: string
    timestamp: string
  }>
  timestamp: Date
}

export class WebScraperDatabase extends Dexie {
  scrapedContent!: Table<ScrapedContent>

  constructor() {
    super('WebScraperDatabase')
    this.version(1).stores({
      scrapedContent: '++id, url, timestamp'
    })
  }

  async addContent(url: string, newContent: Array<{ content: string; text: string }>) {
    try {
      const timestamp = new Date()
      const contentWithTimestamp = newContent.map(item => ({
        ...item,
        timestamp: timestamp.toISOString()
      }))

      const existing = await this.scrapedContent.where('url').equals(url).first()

      if (existing) {
        // Update existing record
        await this.scrapedContent.where('url').equals(url).modify(item => {
          item.content = [...item.content, ...contentWithTimestamp]
          item.timestamp = timestamp
        })
        return existing.id
      } else {
        // Add new record
        return await this.scrapedContent.add({
          url,
          content: contentWithTimestamp,
          timestamp
        })
      }
    } catch (error) {
      console.error('Failed to add content:', error)
      throw new Error('Failed to add content to database')
    }
  }

  async deleteContent(url: string, contentIndex: number) {
    try {
      const item = await this.scrapedContent.where('url').equals(url).first()
      
      if (!item) {
        throw new Error('Content not found')
      }

      const newContent = [...item.content]
      newContent.splice(contentIndex, 1)

      if (newContent.length === 0) {
        // If no content left, delete the entire record
        await this.scrapedContent.where('url').equals(url).delete()
      } else {
        // Update with remaining content
        await this.scrapedContent.where('url').equals(url).modify({
          content: newContent,
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
      throw new Error('Failed to delete content from database')
    }
  }

  async updateContent(url: string, contentIndex: number, newContent: string) {
    try {
      const item = await this.scrapedContent.where('url').equals(url).first()
      
      if (!item) {
        throw new Error('Content not found')
      }

      const updatedContent = [...item.content]
      updatedContent[contentIndex] = {
        ...updatedContent[contentIndex],
        content: newContent,
        timestamp: new Date().toISOString()
      }

      await this.scrapedContent.where('url').equals(url).modify({
        content: updatedContent,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Failed to update content:', error)
      throw new Error('Failed to update content in database')
    }
  }

  async getAllContent() {
    try {
      return await this.scrapedContent
        .orderBy('timestamp')
        .reverse()
        .toArray()
    } catch (error) {
      console.error('Failed to get content:', error)
      throw new Error('Failed to retrieve content from database')
    }
  }

  async clearAllContent() {
    try {
      await this.scrapedContent.clear()
    } catch (error) {
      console.error('Failed to clear content:', error)
      throw new Error('Failed to clear database')
    }
  }
}

export const db = new WebScraperDatabase()