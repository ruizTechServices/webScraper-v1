"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { toast } from "sonner";
import { proxyFetch } from "@/lib/proxy";

interface ScrapingProgress {
  status: 'idle' | 'fetching' | 'processing' | 'storing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export function useScraper() {
  const [progress, setProgress] = useState<ScrapingProgress>({
    status: 'idle',
    progress: 0,
  });

  const updateProgress = (status: ScrapingProgress['status'], progressValue: number, error?: string) => {
    setProgress({ status, progress: progressValue, error });
  };

  const validateInput = (url: string, selector: string) => {
    if (!url) throw new Error('URL is required');
    if (!selector) throw new Error('CSS selector is required');
    
    try {
      new URL(url);
    } catch {
      throw new Error('Please enter a valid URL');
    }
  };

  const scrapeContent = async (url: string, selector: string) => {
    try {
      validateInput(url, selector);
      
      updateProgress('fetching', 10);
      
      const content = await proxyFetch(url, selector);

      updateProgress('processing', 40);

      updateProgress('storing', 70);

      // Store in IndexedDB
      await db.scrapedContent.add({
        url,
        content,
        timestamp: new Date(),
      });

      updateProgress('complete', 100);
      toast.success('Content scraped successfully!');
      
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to scrape content';
      updateProgress('error', 0, errorMessage);
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    scrapeContent,
    progress,
  };
}