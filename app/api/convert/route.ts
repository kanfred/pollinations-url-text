import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromHtml, isValidUrl } from '@/lib/extract';

const POLLINATIONS_API = 'https://gen.pollinations.ai/v1/chat/completions';

const MODELS = [
  'gemini-fast',
  'openai',
  'openai-fast',
  'qwen-vision',
  'claude-fast',
  'kimi',
  'gemini-search'
] as const;

type Model = typeof MODELS[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, model = 'gemini-fast', apiKey } = body as {
      url?: string;
      model?: string;
      apiKey?: string;
    };

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Validate model
    const selectedModel = MODELS.includes(model as Model) ? model : 'gemini-fast';

    // Fetch the webpage
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

    // Trim to reasonable length for API (first 15000 chars)
    const trimmedText = extractedText.slice(0, 15000);

    // Build the prompt
    const prompt = `Convert the following webpage content into clean markdown format. Preserve headings, lists, code blocks, and important formatting. Remove navigation elements, ads, and irrelevant content.

Content:
${trimmedText}

Respond ONLY with the markdown formatted content.`;

    // Call Pollinations API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey && apiKey.startsWith('sk_')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const aiResponse = await fetch(POLLINATIONS_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!aiResponse.ok) {
      return NextResponse.json(
        { error: `AI API error: ${aiResponse.status}` },
        { status: aiResponse.status }
      );
    }

    const aiData = await aiResponse.json();
    const markdown = aiData.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      markdown,
      originalUrl: url,
      model: selectedModel,
      originalLength: extractedText.length,
      markdownLength: markdown.length
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
