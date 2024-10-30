"use client";

import { useState } from 'react';
import { ScrapeForm } from '@/components/scrape-form';
import { ContentViewer } from '@/components/content-viewer';
import { Navbar } from '@/components/navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [activeTab, setActiveTab] = useState('scrape');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scrape">Scrape Content</TabsTrigger>
            <TabsTrigger value="viewer">Content Viewer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scrape" className="space-y-4">
            <ScrapeForm />
          </TabsContent>
          
          <TabsContent value="viewer" className="space-y-4">
            <ContentViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}