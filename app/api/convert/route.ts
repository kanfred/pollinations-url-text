import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromHtml, isValidUrl } from '@/lib/extract';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Fetch the webpage (server-side, user's bandwidth)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URL-to-Markdown Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const extractedText = extractTextFromHtml(html);

    // Return both raw HTML and extracted text - HTML needed for image extraction
    return NextResponse.json({
      success: true,
      html,
      extractedText,
      originalUrl: url,
      originalLength: extractedText.length
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'OK' });
}
