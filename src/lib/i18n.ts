export const translations = {
  en: {
    title: 'URL to Markdown',
    description: 'Convert any webpage to clean markdown text using AI',
    enterUrl: 'Enter webpage URL',
    urlPlaceholder: 'https://example.com/article',
    convert: 'Convert',
    converting: 'Converting...',
    selectModel: 'Select AI Model',
    apiKeyLabel: 'Your Pollinations API Key',
    apiKeyPlaceholder: 'sk_xxxxxxxx (optional - uses free tier if empty)',
    result: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    error: 'Error',
    invalidUrl: 'Please enter a valid URL',
    fetchError: 'Failed to fetch the webpage',
    disclaimer: 'Disclaimer: Your API key stays in your browser and is never sent to our servers.',
    terms: 'Terms of Service',
    termsContent: 'This service converts webpages to markdown using AI. Users retain ownership of their API keys and are responsible for their usage. This service is provided "as is" without warranty.',
    supportedFormats: 'Supported: Static HTML pages. JavaScript-rendered pages may not work correctly.',
    models: {
      'gemini-fast': 'Gemini Fast (default)',
      'openai': 'OpenAI',
      'openai-fast': 'OpenAI Fast',
      'qwen-vision': 'Qwen Vision',
      'claude-fast': 'Claude Fast',
      'kimi': 'Kimi',
      'gemini-search': 'Gemini Search'
    }
  },
  'zh-TW': {
    title: '網址轉 Markdown',
    description: '使用 AI 將任何網頁轉換為乾淨的 Markdown 文字',
    enterUrl: '輸入網頁網址',
    urlPlaceholder: 'https://example.com/article',
    convert: '轉換',
    converting: '轉換中...',
    selectModel: '選擇 AI 模型',
    apiKeyLabel: '您的 Pollinations API Key',
    apiKeyPlaceholder: 'sk_xxxxxxxx（選填 - 空值使用免費額度）',
    result: '結果',
    copy: '複製',
    copied: '已複製！',
    download: '下載',
    error: '錯誤',
    invalidUrl: '請輸入有效的網址',
    fetchError: '無法獲取網頁',
    disclaimer: '免責聲明：您的 API Key 保留在您的瀏覽器中，不會傳送到我們的伺服器。',
    terms: '服務條款',
    termsContent: '本服務使用 AI 將網頁轉換為 Markdown。用戶保留其 API Key 的所有權，並對其使用負責。本服務按「原樣」提供，無任何保證。',
    supportedFormats: '支援：靜態 HTML 頁面。JavaScript 渲染的頁面可能無法正常運作。',
    models: {
      'gemini-fast': 'Gemini 快速（預設）',
      'openai': 'OpenAI',
      'openai-fast': 'OpenAI 快速',
      'qwen-vision': 'Qwen 視覺',
      'claude-fast': 'Claude 快速',
      'kimi': 'Kimi',
      'gemini-search': 'Gemini 搜尋'
    }
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
