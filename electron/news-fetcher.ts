import axios from 'axios';
import type { NewsItem } from './shared/types.js';

const ENDPOINT = 'https://newsapi.org/v2/everything';

export async function fetchBitcoinNews(apiKey: string, limit = 12): Promise<NewsItem[]> {
  const fromIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await axios.get(ENDPOINT, {
    params: {
      q: '(bitcoin OR BTC OR crypto) AND (price OR market OR ETF OR rate OR fed OR sec OR regulation)',
      language: 'en',
      sortBy: 'publishedAt',
      from: fromIso,
      pageSize: limit,
      apiKey
    },
    timeout: 15000
  });

  if (data.status !== 'ok' || !Array.isArray(data.articles)) {
    throw new Error(`NewsAPI error: ${data.message ?? 'unknown'}`);
  }

  return (data.articles as any[]).slice(0, limit).map((a) => ({
    title: a.title ?? '',
    description: a.description ?? null,
    source: a.source?.name ?? 'unknown',
    publishedAt: a.publishedAt ?? '',
    url: a.url ?? ''
  }));
}

export function summarizeNewsForPrompt(news: NewsItem[]): string {
  if (news.length === 0) return '(no recent news available)';
  return news
    .map((n, i) => {
      const ts = n.publishedAt ? new Date(n.publishedAt).toISOString() : '';
      const desc = n.description ? ` — ${n.description}` : '';
      return `${i + 1}. [${ts}] ${n.source}: ${n.title}${desc}`;
    })
    .join('\n');
}
