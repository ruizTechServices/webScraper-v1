'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useScrapedContent } from '@/hooks/use-scraped-content'

export function ContentViewer() {
  const { content, loading } = useScrapedContent()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  const flatContent = content.flatMap((item) => 
    item.content.map((c, index) => ({
      ...c,
      url: item.url,
      id: `${item.url}-${index}`
    }))
  )

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const exportContent = () => {
    try {
      const dataStr = JSON.stringify(content, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
      const exportFileDefaultName = 'scraped-content.json'

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      toast.success('Content exported successfully!')
    } catch (error) {
      toast.error('Failed to export content')
    }
  }

  if (loading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </Card>
    )
  }

  if (!flatContent.length) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No content available</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button onClick={exportContent} variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
      </div>
      
      <Card className="p-4 sm:p-6">
        <ScrollArea className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] pr-2 sm:pr-4">
          <div className="space-y-4">
            {flatContent.map((item) => (
              <Collapsible
                key={item.id}
                open={openItems[item.id]}
                onOpenChange={() => toggleItem(item.id)}
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    From: {item.url}
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {openItems[item.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-4">
                  <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                    <div className="overflow-x-auto">
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}