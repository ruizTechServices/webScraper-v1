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

export interface ContentItem {
  content: string
  text: string
  timestamp: string
}

export class WebScraperDatabase extends Dexie {
  scrapedContent!: Table<ScrapedContent>

  constructor() {
    super('WebScraperDatabase')
    this.version(1).stores({
      scrapedContent: '++id, url, timestamp'
    })
  }

  async addContent(url: string, newContent: Array<{ content: string; text: string }>): Promise<number> {
    try {
      const timestamp = new Date()
      const contentWithTimestamp = newContent.map(item => ({
        ...item,
        timestamp: timestamp.toISOString()
      }))

      const existing = await this.scrapedContent.where('url').equals(url).first()

      if (existing) {
        await this.scrapedContent.where('url').equals(url).modify(item => {
          item.content = [...item.content, ...contentWithTimestamp]
          item.timestamp = timestamp
        })
        return existing.id as number
      } else {
        const id = await this.scrapedContent.add({
          url,
          content: contentWithTimestamp,
          timestamp
        })
        return typeof id === 'number' ? id : parseInt(id, 10)
      }
    } catch (error) {
      console.error('Failed to add content:', error)
      throw new Error('Failed to add content to database')
    }
  }

  async deleteContentItem(compositeId: string): Promise<void> {
    try {
      const [url, _, contentIndex] = compositeId.split('-')
      const index = parseInt(contentIndex, 10)
      
      if (!url || isNaN(index)) {
        throw new Error('Invalid content identifier')
      }

      const item = await this.scrapedContent.where('url').equals(url).first()
      
      if (!item) {
        throw new Error(`Content not found for URL: ${url}`)
      }

      if (index < 0 || index >= item.content.length) {
        throw new Error(`Invalid content index: ${index}`)
      }

      const newContent = [...item.content]
      newContent.splice(index, 1)

      if (newContent.length === 0) {
        await this.scrapedContent.where('url').equals(url).delete()
      } else {
        await this.scrapedContent.where('url').equals(url).modify({
          content: newContent,
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
      throw error
    }
  }

  async updateContentItem(compositeId: string, newContent: string): Promise<void> {
    try {
      const [url, _, contentIndex] = compositeId.split('-')
      const index = parseInt(contentIndex, 10)
      
      if (!url || isNaN(index)) {
        throw new Error('Invalid content identifier')
      }

      const item = await this.scrapedContent.where('url').equals(url).first()
      
      if (!item) {
        throw new Error(`Content not found for URL: ${url}`)
      }

      if (index < 0 || index >= item.content.length) {
        throw new Error(`Invalid content index: ${index}`)
      }

      const updatedContent = [...item.content]
      updatedContent[index] = {
        ...updatedContent[index],
        content: newContent,
        timestamp: new Date().toISOString()
      }

      await this.scrapedContent.where('url').equals(url).modify({
        content: updatedContent,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Failed to update content:', error)
      throw error
    }
  }

  async getAllContent(): Promise<ScrapedContent[]> {
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

  async clearAllContent(): Promise<void> {
    try {
      await this.scrapedContent.clear()
    } catch (error) {
      console.error('Failed to clear content:', error)
      throw new Error('Failed to clear database')
    }
  }
}

export const db = new WebScraperDatabase()