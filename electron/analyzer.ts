import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  AnalyzeRequest,
  AnalyzeResult,
  ChartUpload,
  ProgressEvent
} from './shared/types.js';
import { fetchBitcoinNews } from './news-fetcher.js';
import { buildPrompt } from './prompt-builder.js';
import { runClaude } from './claude-runner.js';

export type ProgressFn = (e: ProgressEvent) => void;

export async function analyze(
  req: AnalyzeRequest,
  env: { NEWSAPI_KEY?: string; CLAUDE_MODEL?: string; CLAUDE_CLI_PATH?: string },
  onProgress: ProgressFn
): Promise<AnalyzeResult> {
  const model = env.CLAUDE_MODEL?.trim() || 'claude-opus-4-7';

  onProgress({ stage: 'starting', message: 'Preparing analysis…' });

  // 1. Save charts to a temp dir.
  onProgress({ stage: 'saving-charts', message: 'Saving chart screenshots…' });
  const tmpDir = path.join(app.getPath('userData'), 'sessions', `s-${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  const imagePaths = await saveCharts(req.charts, tmpDir);

  // 2. Fetch news (best-effort: empty list if no key).
  let news: AnalyzeResult['news'] = [];
  if (env.NEWSAPI_KEY?.trim()) {
    try {
      onProgress({ stage: 'fetching-news', message: 'Fetching latest Bitcoin news…' });
      news = await fetchBitcoinNews(env.NEWSAPI_KEY.trim());
    } catch (err: any) {
      const e: any = new Error(`NewsAPI failed: ${err.message}`);
      e.code = 'NEWSAPI_FAILED';
      throw e;
    }
  } else {
    onProgress({
      stage: 'fetching-news',
      message: 'NEWSAPI_KEY not set — proceeding without news context.'
    });
  }

  // 3. Build prompt.
  const prompt = buildPrompt({ mode: req.mode, imagePaths, news });

  // 4. Call Claude.
  onProgress({
    stage: 'consulting-claude',
    message: `Consulting Claude (${model}) — analyzing 4 charts + ${news.length} news items…`
  });
  const { signal, raw } = await runClaude({
    prompt,
    mode: req.mode,
    model,
    cliPath: env.CLAUDE_CLI_PATH
  });

  // 5. Compose result.
  onProgress({ stage: 'composing-signal', message: 'Composing final signal…' });
  const result: AnalyzeResult = {
    signal,
    news,
    rawClaudeOutput: raw,
    modelUsed: model,
    generatedAt: new Date().toISOString()
  };

  onProgress({ stage: 'done', message: 'Signal ready.' });
  return result;
}

async function saveCharts(
  charts: ChartUpload[],
  dir: string
): Promise<{ timeframe: string; path: string }[]> {
  const order: ChartUpload['timeframe'][] = ['5m', '15m', '30m', '1h'];
  const sorted = [...charts].sort(
    (a, b) => order.indexOf(a.timeframe) - order.indexOf(b.timeframe)
  );
  const out: { timeframe: string; path: string }[] = [];
  for (const c of sorted) {
    const ext = mimeExt(c.mimeType);
    const filePath = path.join(dir, `chart-${c.timeframe}${ext}`);
    await fs.writeFile(filePath, Buffer.from(c.base64, 'base64'));
    out.push({ timeframe: c.timeframe, path: filePath });
  }
  return out;
}

function mimeExt(mime: string): string {
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  if (mime.includes('webp')) return '.webp';
  return '.png';
}
