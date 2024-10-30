"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useScraper } from "@/hooks/use-scraper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  selector: z.string().min(1, 'CSS selector is required'),
});

type FormValues = z.infer<typeof formSchema>;

export function ScrapeForm() {
  const { scrapeContent, progress } = useScraper();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      selector: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await scrapeContent(values.url, values.selector);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selector"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CSS Selector</FormLabel>
                <FormControl>
                  <Input
                    placeholder="article, .content, #main"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {progress.status !== 'idle' && (
            <div className="space-y-2">
              <Progress value={progress.progress} />
              <p className="text-sm text-muted-foreground">
                {progress.status === 'error' ? (
                  <span className="text-destructive">{progress.error}</span>
                ) : (
                  `${progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}...`
                )}
              </p>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Scraping...' : 'Start Scraping'}
          </Button>
        </form>
      </Form>
    </Card>
  );
}