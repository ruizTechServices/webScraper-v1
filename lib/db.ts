import Dexie, { Table } from 'dexie';

export interface ScrapedContent {
  id?: number;
  url: string;
  content: Array<{
    content: string;
    text: string;
    timestamp: string;
  }>;
  timestamp: Date;
}

export class WebScraperDatabase extends Dexie {
  scrapedContent!: Table<ScrapedContent>;

  constructor() {
    super('WebScraperDatabase');
    this.version(1).stores({
      scrapedContent: '++id, url, timestamp',
    });
  }
}

export const db = new WebScraperDatabase();