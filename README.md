# Pollinations URL to Text

Convert any webpage to clean markdown text using AI.

## Features

- URL to Markdown conversion
- Multiple AI models support (Gemini, GPT, Claude, Qwen, Kimi)
- BYOK: Your API key stays in your browser
- i18n: English & Traditional Chinese
- No database required

## Architecture

```
User Browser → Server (fetch HTML) → Extract Text → Pollinations API → Markdown Output
                    ↓
            API key never touches server
```

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy

[![Deploy with Vercel](https://vercel.com/new/clone?repository-url=https://github.com/kanfred/pollinations-url-text)](https://vercel.com/new/clone?repository-url=https://github.com/kanfred/pollinations-url-text)

Zero configuration required.

## Environment Variables

None required. This is a BYOK (Bring Your Own Key) architecture.

## Supported Models

| Model | Description |
|-------|-------------|
| gemini-fast | Gemini Fast (default) |
| openai | OpenAI |
| openai-fast | OpenAI Fast |
| qwen-vision | Qwen Vision |
| claude-fast | Claude Fast |
| kimi | Kimi |
| gemini-search | Gemini Search |

## Limitations

- Supports static HTML pages only
- JavaScript-rendered pages may not work correctly
- API timeout: 60 seconds

## License

MIT
