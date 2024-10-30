"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useScrapedContent() {
  const [loading, setLoading] = useState(true);
  
  const content = useLiveQuery(
    async () => {
      const results = await db.scrapedContent
        .orderBy('timestamp')
        .reverse()
        .toArray();
      return results;
    },
    [],
    []
  );

  useEffect(() => {
    if (content !== undefined) {
      setLoading(false);
    }
  }, [content]);

  return {
    content: content || [],
    loading,
  };
}