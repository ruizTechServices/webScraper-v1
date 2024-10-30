'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Pencil, 
  Trash2, 
  X, 
  Check 
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useScrapedContent } from '@/hooks/use-scraped-content'

export function ContentViewer() {
  const { content, loading, updateContent, deleteContent } = useScrapedContent()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editContent, setEditContent] = React.useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null)

  const flatContent = content.flatMap((item, itemIndex) => 
    item.content.map((c, contentIndex) => ({
      ...c,
      url: item.url,
      id: `${item.url}-${itemIndex}-${contentIndex}`
    }))
  )

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const startEditing = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  const saveEdit = async (id: string) => {
    try {
      await updateContent(id, editContent)
      setEditingId(null)
      setEditContent('')
      toast.success('Content updated successfully')
    } catch (error) {
      toast.error('Failed to update content')
    }
  }

  const confirmDelete = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      await deleteContent(itemToDelete)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Content deleted successfully')
    } catch (error) {
      toast.error('Failed to delete content')
    }
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
                  <div className="text-xs sm:text-sm text-muted-foreground break-words flex-1 mr-4">
                    From: {item.url}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(item.id, item.content)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit content</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDelete(item.id)
                      }}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete content</span>
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {openItems[item.id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle content</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="mt-4">
                  {editingId === item.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(item.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                      <div className="overflow-x-auto">
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                          {item.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}