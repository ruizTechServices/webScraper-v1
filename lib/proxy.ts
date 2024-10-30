"use client";

import { z } from 'zod';
import * as cheerio from 'cheerio';

const scrapeSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  selector: z.string().min(1, 'CSS selector is required'),
});

export async function proxyFetch(url: string, selector: string) {
  try {
    const { url: validUrl, selector: validSelector } = scrapeSchema.parse({ url, selector });

    // Use a CORS proxy service for client-side requests
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(validUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let elements;
    try {
      elements = $(validSelector);
    } catch (error) {
      throw new Error('Invalid CSS selector');
    }

    if (elements.length === 0) {
      throw new Error('No elements found matching the provided selector');
    }

    const content = elements
      .map((_, element) => ({
        content: $(element).html()?.trim() || '',
        text: $(element).text()?.trim() || '',
        timestamp: new Date().toISOString(),
      }))
      .get()
      .filter(item => item.content || item.text);

    if (content.length === 0) {
      throw new Error('Selected elements contain no content');
    }

    return content;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    throw error;
  }
}