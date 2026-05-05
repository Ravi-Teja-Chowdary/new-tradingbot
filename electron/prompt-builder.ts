import type { Mode, NewsItem } from './shared/types.js';
import { summarizeNewsForPrompt } from './news-fetcher.js';

export interface PromptInputs {
  mode: Mode;
  imagePaths: { timeframe: string; path: string }[];
  news: NewsItem[];
}

const SPOT_SCHEMA = `{
  "mode": "spot",
  "action": "BUY" | "SELL" | "HOLD",
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": <integer 0-100>,
  "entry": <number or "market">,
  "stop_loss": <number>,
  "target": <number>,
  "time_validity": "<e.g. 'next 4 hours' or 'until next 1h close'>",
  "key_levels": { "support": [<numbers>], "resistance": [<numbers>] },
  "reasoning": "<2-4 sentence summary of WHY based on the four charts>",
  "news_impact": { "sentiment": "bullish"|"bearish"|"neutral", "summary": "<short>" },
  "multi_timeframe_alignment": "<one paragraph: how 5m / 15m / 30m / 1h agree or diverge>",
  "invalidation_conditions": "<what would invalidate this setup>",
  "risk_warning": "<one short sentence>"
}`;

const FUTURES_SCHEMA = `{
  "mode": "futures",
  "position": "LONG" | "SHORT" | "NO_TRADE",
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": <integer 0-100>,
  "leverage_suggestion": "<e.g. '3x-5x isolated'>",
  "entry": <number or "market">,
  "stop_loss": <number>,
  "tp1": <number>,
  "tp2": <number>,
  "tp3": <number>,
  "risk_reward_ratio": "<e.g. '1:2.5 to TP2'>",
  "time_validity": "<e.g. 'next 2-6 hours'>",
  "key_levels": { "support": [<numbers>], "resistance": [<numbers>] },
  "reasoning": "<2-4 sentence summary of WHY based on the four charts>",
  "news_impact": { "sentiment": "bullish"|"bearish"|"neutral", "summary": "<short>" },
  "multi_timeframe_alignment": "<one paragraph: how 5m / 15m / 30m / 1h agree or diverge>",
  "invalidation_conditions": "<what would invalidate this setup>",
  "risk_warning": "<one short sentence about leverage and risk>"
}`;

export function buildPrompt({ mode, imagePaths, news }: PromptInputs): string {
  const schema = mode === 'spot' ? SPOT_SCHEMA : FUTURES_SCHEMA;
  const imagesBlock = imagePaths
    .map((c) => `- ${c.timeframe} chart: ${c.path}`)
    .join('\n');

  const newsBlock = summarizeNewsForPrompt(news);
  const nowIso = new Date().toISOString();

  return `You are an elite Bitcoin technical analyst and trading-signal generator.

I am giving you FOUR TradingView screenshots of BTC/USD across multiple timeframes and a snapshot of the latest crypto-relevant news. Your job is to read the candles visually (candlestick patterns, structure, swing highs/lows, support/resistance, trendlines, volume if visible, indicators if visible), align the timeframes, weigh the news sentiment, and produce ONE high-conviction trading signal.

CURRENT TIME (UTC): ${nowIso}
ANALYSIS MODE: ${mode.toUpperCase()}

CHARTS (please open and analyze each image file from disk):
${imagesBlock}

LATEST BITCOIN NEWS (last 24h):
${newsBlock}

INSTRUCTIONS:
1. Visually analyze EACH timeframe (5m, 15m, 30m, 1h). Identify trend, structure, candlestick patterns, key S/R levels, and any indicators visible.
2. Establish multi-timeframe alignment: agreement = higher confidence; divergence = lower confidence or NO_TRADE.
3. Weigh the news sentiment. Strong bearish news against a bullish setup should reduce confidence and may flip to NO_TRADE.
4. Produce concrete numeric levels (entry, stop loss, targets) based on what you actually see in the charts. If exact prices are not legible, give your best estimate using visible price labels and clearly state the assumption in "reasoning".
5. Be honest. If the setup is not clean, return ${mode === 'spot' ? '"action": "HOLD"' : '"position": "NO_TRADE"'} with low confidence rather than forcing a trade.
6. Confidence scale: 0-39 = avoid, 40-59 = weak, 60-74 = decent, 75-89 = strong, 90-100 = exceptional.

OUTPUT FORMAT — respond with ONLY a single JSON object matching this schema, no prose, no markdown fences:
${schema}
`;
}
