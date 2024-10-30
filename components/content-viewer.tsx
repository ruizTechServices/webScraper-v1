"use client";

import { useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrapedContent } from "@/hooks/use-scraped-content";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { ScrapedContent } from "@/lib/db";

export function ContentViewer() {
  const { content, loading } = useScrapedContent();
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

  const flatContent = content.flatMap((item: ScrapedContent) => 
    item.content.map(c => ({
      ...c,
      url: item.url
    }))
  );

  const virtualizer = useVirtualizer({
    count: flatContent.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 100,
    overscan: 5,
  });

  const exportContent = () => {
    try {
      const dataStr = JSON.stringify(content, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = 'scraped-content.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success('Content exported successfully!');
    } catch (error) {
      toast.error('Failed to export content');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </Card>
    );
  }

  if (!flatContent.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No content available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={exportContent} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>
      
      <Card className="p-6">
        <ScrollArea className="h-[600px] pr-4" ref={setParentRef}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="prose dark:prose-invert max-w-none">
                  <div className="text-sm text-muted-foreground mb-2">
                    From: {flatContent[virtualItem.index].url}
                  </div>
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {flatContent[virtualItem.index].content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}