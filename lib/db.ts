import Dexie, { Table, IndexableType } from 'dexie'

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

  private parseCompositeId(compositeId: string): { url: string; index: number } {
    const lastHyphenIndex = compositeId.lastIndexOf('-')
    if (lastHyphenIndex === -1) {
      throw new Error('Invalid content identifier format')
    }

    const secondLastHyphenIndex = compositeId.lastIndexOf('-', lastHyphenIndex - 1)
    if (secondLastHyphenIndex === -1) {
      throw new Error('Invalid content identifier format')
    }

    const url = compositeId.substring(0, secondLastHyphenIndex)
    const contentIndex = parseInt(compositeId.substring(lastHyphenIndex + 1), 10)

    if (!url || isNaN(contentIndex)) {
      throw new Error('Invalid content identifier format')
    }

    return { url, index: contentIndex }
  }

  async addContent(url: string, newContent: Array<{ content: string; text: string }>): Promise<number> {
    try {
      if (!url || !newContent.length) {
        throw new Error('Invalid content: URL and content are required')
      }

      const timestamp = new Date()
      const contentWithTimestamp = newContent.map(item => ({
        ...item,
        timestamp: timestamp.toISOString()
      }))

      const existing = await this.scrapedContent.where('url').equals(url).first()

      if (existing) {
        if (!existing.id) {
          throw new Error('Invalid database state: existing record has no ID')
        }
        await this.scrapedContent.where('url').equals(url).modify(item => {
          item.content = [...item.content, ...contentWithTimestamp]
          item.timestamp = timestamp
        })
        return existing.id
      } else {
        const id = await this.scrapedContent.add({
          url,
          content: contentWithTimestamp,
          timestamp
        })

        if (!id) {
          throw new Error('Failed to generate database ID')
        }

        if (typeof id === 'number') {
          return id
        } else if (typeof id === 'string') {
          const numId = parseInt(id, 10)
          if (isNaN(numId)) {
            throw new Error('Failed to parse database ID')
          }
          return numId
        } else {
          throw new Error('Unexpected ID type returned from database')
        }
      }
    } catch (error) {
      console.error('Failed to add content:', error)
      throw error instanceof Error ? error : new Error('Failed to add content to database')
    }
  }

  async deleteContentItem(compositeId: string): Promise<void> {
    try {
      if (!compositeId) {
        throw new Error('Content identifier is required')
      }

      const { url, index } = this.parseCompositeId(compositeId)
      const item = await this.scrapedContent.where('url').equals(url).first()
      
      if (!item) {
        throw new Error(`Content not found for URL: ${url}`)
      }

      if (index < 0 || index >= item.content.length) {
        throw new Error(`Invalid content index: ${index}. Must be between 0 and ${item.content.length - 1}`)
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
      throw error instanceof Error ? error : new Error('Failed to delete content from database')
    }
  }

  async updateContentItem(compositeId: string, newContent: string): Promise<void> {
    try {
      if (!compositeId || typeof newContent !== 'string') {
        throw new Error('Content identifier and new content are required')
      }

      const { url, index } = this.parseCompositeId(compositeId)
      const item = await this.scrapedContent.where('url').equals(url).first()
      
      if (!item) {
        throw new Error(`Content not found for URL: ${url}`)
      }

      if (index < 0 || index >= item.content.length) {
        throw new Error(`Invalid content index: ${index}. Must be between 0 and ${item.content.length - 1}`)
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
      throw error instanceof Error ? error : new Error('Failed to update content in database')
    }
  }

  async getAllContent(): Promise<ScrapedContent[]> {
    try {
      const content = await this.scrapedContent
        .orderBy('timestamp')
        .reverse()
        .toArray()

      return content || []
    } catch (error) {
      console.error('Failed to get content:', error)
      throw error instanceof Error ? error : new Error('Failed to retrieve content from database')
    }
  }

  async clearAllContent(): Promise<void> {
    try {
      await this.scrapedContent.clear()
    } catch (error) {
      console.error('Failed to clear content:', error)
      throw error instanceof Error ? error : new Error('Failed to clear database')
    }
  }
}

export const db = new WebScraperDatabase()