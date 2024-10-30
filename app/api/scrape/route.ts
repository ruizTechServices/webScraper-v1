//app\api\scrape\route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const scrapeSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  selector: z.string().min(1, 'CSS selector is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, selector } = scrapeSchema.parse(body);

    // Validate URL protocol
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS protocols are supported' },
        { status: 400 }
      );
    }

    // Fetch the HTML page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 0 },
    });

    // Handle HTTP response errors
    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status} - ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} - ${response.statusText}` },
        { status: response.status }
      );
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      return NextResponse.json(
        { error: 'URL must point to an HTML page' },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let elements;
    try {
      elements = $(selector);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid CSS selector' },
        { status: 400 }
      );
    }

    if (elements.length === 0) {
      return NextResponse.json(
        { error: 'No elements found matching the provided selector' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: 'Selected elements contain no content' },
        { status: 404 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Scraping error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while scraping the content' },
      { status: 500 }
    );
  }
}
