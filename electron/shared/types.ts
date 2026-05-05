// Shared types between the renderer and the Electron main process.

export type Timeframe = '5m' | '15m' | '30m' | '1h';
export type Mode = 'spot' | 'futures';

export interface ChartUpload {
  timeframe: Timeframe;
  base64: string;
  fileName: string;
  mimeType: string;
}

export interface AnalyzeRequest {
  mode: Mode;
  charts: ChartUpload[];
}

export interface NewsItem {
  title: string;
  description: string | null;
  source: string;
  publishedAt: string;
  url: string;
}

export type ProgressStage =
  | 'starting'
  | 'saving-charts'
  | 'fetching-news'
  | 'consulting-claude'
  | 'composing-signal'
  | 'done'
  | 'error';

export interface ProgressEvent {
  stage: ProgressStage;
  message: string;
}

export interface SignalCommon {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entry: number | string;
  stop_loss: number | string;
  time_validity: string;
  key_levels: { support: (number | string)[]; resistance: (number | string)[] };
  reasoning: string;
  news_impact: { sentiment: 'bullish' | 'bearish' | 'neutral'; summary: string };
  multi_timeframe_alignment: string;
  invalidation_conditions: string;
  risk_warning: string;
}

export interface SpotSignal extends SignalCommon {
  mode: 'spot';
  action: 'BUY' | 'SELL' | 'HOLD';
  target: number | string;
}

export interface FuturesSignal extends SignalCommon {
  mode: 'futures';
  position: 'LONG' | 'SHORT' | 'NO_TRADE';
  leverage_suggestion: string;
  tp1: number | string;
  tp2: number | string;
  tp3: number | string;
  risk_reward_ratio: string;
}

export type Signal = SpotSignal | FuturesSignal;

export interface AnalyzeResult {
  signal: Signal;
  news: NewsItem[];
  rawClaudeOutput?: string;
  modelUsed: string;
  generatedAt: string;
}

export interface AnalyzeError {
  code:
    | 'NO_NEWSAPI_KEY'
    | 'NEWSAPI_FAILED'
    | 'CLAUDE_NOT_FOUND'
    | 'CLAUDE_FAILED'
    | 'CLAUDE_PARSE_FAILED'
    | 'UNKNOWN';
  message: string;
  hint?: string;
}
