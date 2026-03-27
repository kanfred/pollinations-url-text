'use client';

import { useState, useEffect } from 'react';
import { translations, Language } from '@/lib/i18n';

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
}

const POLLINATIONS_API = 'https://gen.pollinations.ai/v1/chat/completions';

// OAuth App Key - replace with your own from enter.pollinations.ai
const APP_KEY = '';

export default function Home() {
  const [lang, setLang] = useState<Language>('en');
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('gemini-fast');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [imageCount, setImageCount] = useState(0);

  const t = (key: string) => getNestedValue(translations[lang], key);

  useEffect(() => {
    const browserLang = navigator.language;
    if (browserLang.includes('zh')) {
      setLang('zh-TW');
    }
    const savedModel = localStorage.getItem('pollinations_model');
    const savedLang = localStorage.getItem('pollinations_lang');
    const savedKey = localStorage.getItem('pollinations_key');
    if (savedLang) setLang(savedLang as Language);
    if (savedModel) setModel(savedModel);
    if (savedKey) setApiKey(savedKey);
    handleOAuthCallback();
  }, []);

  useEffect(() => {
    if (apiKey && apiKey.startsWith('sk_')) {
      setApiReady(true);
    } else {
      setApiReady(false);
    }
  }, [apiKey]);

  const handleOAuthCallback = () => {
    const hash = window.location.hash;
    if (hash && hash.includes('api_key=')) {
      const params = new URLSearchParams(hash.slice(1));
      const key = params.get('api_key');
      if (key) {
        setApiKey(key);
        localStorage.setItem('pollinations_key', key);
        window.history.replaceState(null, '', window.location.pathname);
        setError('');
      }
    }
  };

  const handleLogin = () => {
    setLoggingIn(true);
    const redirectUrl = window.location.origin + window.location.pathname;
    let authUrl = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
    if (APP_KEY) {
      authUrl += `&app_key=${APP_KEY}`;
    }
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    setApiKey('');
    setApiReady(false);
    localStorage.removeItem('pollinations_key');
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('pollinations_lang', newLang);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    localStorage.setItem('pollinations_model', newModel);
  };

  // Extract image URLs from HTML
  const extractImages = (html: string, baseUrl: string): string[] => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const images: string[] = [];
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      // Handle relative URLs
      if (src.startsWith('/')) {
        try {
          const urlObj = new URL(baseUrl);
          src = urlObj.origin + src;
        } catch {
          continue;
        }
      } else if (!src.startsWith('http')) {
        try {
          const urlObj = new URL(baseUrl);
          src = urlObj.origin + '/' + src;
        } catch {
          continue;
        }
      }
      // Filter out tracking pixels, icons, etc.
      if (src.includes('pixel') || src.includes('track') || src.includes('icon') || src.includes('logo')) {
        continue;
      }
      if (src.match(/\.(gif|svg|webp)(\?|$)/i)) {
        continue;
      }
      images.push(src);
    }
    
    return [...new Set(images)].slice(0, 10); // Max 10 images
  };

  // Describe an image using vision model
  const describeImage = async (imageUrl: string, apiKey: string): Promise<string> => {
    try {
      const response = await fetch(POLLINATIONS_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-vision', // Vision model for image description
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Describe this image briefly in 1-2 sentences. Focus on what\'s important or relevant in the context of a webpage.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          temperature: 0.3
        })
      });
      
      if (!response.ok) return '';
      
      const data = await response.json();
      const description = data.choices?.[0]?.message?.content || '';
      return description.trim();
    } catch {
      return '';
    }
  };

  const handleConvert = async () => {
    if (!url.trim()) {
      setError(t('invalidUrl'));
      return;
    }

    if (!apiKey) {
      setError(lang === 'zh-TW' ? '請先登入 Pollinations' : 'Please login to Pollinations first');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    setImageCount(0);

    try {
      // Step 1: Fetch HTML (server-side)
      const fetchResponse = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const fetchData = await fetchResponse.json();

      if (!fetchResponse.ok) {
        throw new Error(fetchData.error || 'Failed to fetch URL');
      }

      // Step 2: Extract images if enabled
      let imageDescriptions = '';
      if (includeImages) {
        const images = extractImages(fetchData.extractedText, url);
        setImageCount(images.length);
        
        if (images.length > 0) {
          const descriptions: string[] = [];
          for (const img of images) {
            const desc = await describeImage(img, apiKey);
            if (desc) {
              descriptions.push(`![${desc}](${img})\n*${desc}*`);
            }
          }
          
          if (descriptions.length > 0) {
            imageDescriptions = '\n\n## Image Descriptions\n\n' + descriptions.join('\n\n');
          }
        }
      }

      // Step 3: Convert to markdown
      const trimmedText = fetchData.extractedText.slice(0, 15000);

      const prompt = `Convert the following webpage content into clean markdown format. Preserve headings, lists, code blocks, and important formatting. Remove navigation elements, ads, and irrelevant content.

Content:
${trimmedText}
${imageDescriptions}

Respond ONLY with the markdown formatted content.`;

      const aiResponse = await fetch(POLLINATIONS_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI error ${aiResponse.status}: ${errText}`);
      }

      const aiData = await aiResponse.json();
      const markdown = aiData.choices?.[0]?.message?.content || '';

      setResult(markdown);

    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `converted-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(urlObj);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-1">{t('description')}</p>
          </div>
          <div className="flex gap-2 items-center">
            {apiReady ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs hover:bg-red-200"
              >
                {t('logoutBtn')}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="px-3 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600 disabled:bg-green-300"
              >
                {loggingIn ? '...' : t('loginBtn')}
              </button>
            )}
            <button
              onClick={() => handleLangChange('en')}
              className={`px-3 py-1 rounded ${lang === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              EN
            </button>
            <button
              onClick={() => handleLangChange('zh-TW')}
              className={`px-3 py-1 rounded ${lang === 'zh-TW' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              中文
            </button>
          </div>
        </div>

        {/* Login Status */}
        <div className={`rounded-lg p-4 mb-6 ${apiReady ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${apiReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {apiReady ? '✓' : '✗'} {apiReady ? t('loggedIn') : t('notLoggedIn')}
            </span>
            <span className="text-sm text-gray-600">
              {apiReady ? t('loggedInDesc') : t('notLoggedInDesc')}
            </span>
          </div>
          {imageCount > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              {t('imagesExtracted').replace('N', imageCount.toString())}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('enterUrl')}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('urlPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectModel')}
            </label>
            <select
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {(Object.keys(translations[lang].models) as Array<keyof typeof translations.en.models>).map((m) => (
                <option key={m} value={m}>
                  {t(`models.${m}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-gray-700">{t('includeImages')}</span>
            </label>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading || !apiReady}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:bg-blue-300 transition"
          >
            {loading ? (imageCount > 0 ? t('extractingImages') : t('converting')) : t('convert')}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* BYOK Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">{t('byokTitle')}</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {t('byokLine1')}</li>
            <li>• {t('byokLine2')}</li>
            <li>• {t('byokLine3')}</li>
            <li>• {t('byokLine4')}</li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="text-sm text-gray-500 mb-6">
          <p>{t('disclaimer')}</p>
          <p className="mt-1">{t('supportedFormats')}</p>
        </div>

        {/* Terms Toggle */}
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="text-blue-500 text-sm underline mb-4"
        >
          {t('terms')}
        </button>
        {showTerms && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-gray-700">{t('termsContent')}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('result')}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t('copy')}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t('download')}
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
