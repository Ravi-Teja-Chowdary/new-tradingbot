import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeCheck, KeyRound } from 'lucide-react';
import type {
  AnalyzeResult,
  ChartUpload,
  Mode,
  ProgressEvent,
  Timeframe
} from './types';
import { ChartDropzone } from './components/ChartDropzone';
import { ModeToggle } from './components/ModeToggle';
import { AnalyzeButton } from './components/AnalyzeButton';
import { ProgressOverlay } from './components/ProgressOverlay';
import { SignalCard } from './components/SignalCard';
import { NewsPanel } from './components/NewsPanel';

const TIMEFRAMES: Timeframe[] = ['5m', '15m', '30m', '1h'];

export default function App() {
  const [mode, setMode] = useState<Mode>('futures');
  const [charts, setCharts] = useState<Record<Timeframe, ChartUpload | null>>({
    '5m': null, '15m': null, '30m': null, '1h': null
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [env, setEnv] = useState<{ hasNewsKey: boolean; model: string; hasCustomCliPath: boolean } | null>(null);

  useEffect(() => {
    const off = window.btc.onProgress(setProgress);
    window.btc.envStatus().then(setEnv);
    return () => off();
  }, []);

  const allReady = useMemo(() => TIMEFRAMES.every((tf) => charts[tf]), [charts]);

  async function handleAnalyze() {
    if (!allReady || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress({ stage: 'starting', message: 'Starting…' });
    const list = TIMEFRAMES.map((tf) => charts[tf]!).map((c) => c);
    const res = await window.btc.analyze({ mode, charts: list });
    if (res.ok) {
      setResult(res.result);
      setProgress({ stage: 'done', message: 'Done' });
      setTimeout(() => setBusy(false), 350);
    } else {
      const msg = res.error.message + (res.error.hint ? `\n\nHint: ${res.error.hint}` : '');
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Title bar drag region (frameless on mac) */}
      <div className="h-9 w-full" style={{ ['WebkitAppRegion' as any]: 'drag' }} />

      <div className="flex-1 px-6 md:px-10 pb-12 max-w-[1400px] w-full mx-auto">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-accent to-accent-alt p-2 shadow-glow">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                <span className="gradient-text">BTC Signal</span>
                <span className="text-white/70"> · Multi-Timeframe</span>
              </h1>
              <p className="text-xs text-white/50">
                Drop 4 TradingView screenshots — Claude Opus reads them, blends in live news, returns a signal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle value={mode} onChange={setMode} />
          </div>
        </header>

        {/* Status strip */}
        {env && (
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1">
              <BadgeCheck size={13} className="text-accent-alt" /> Model: <span className="font-mono text-white/85">{env.model}</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 ${env.hasNewsKey ? '' : 'text-amber-300'}`}>
              <KeyRound size={13} /> NewsAPI: {env.hasNewsKey ? 'configured' : 'missing — add NEWSAPI_KEY to .env'}
            </span>
          </div>
        )}

        {/* Chart grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIMEFRAMES.map((tf) => (
            <ChartDropzone
              key={tf}
              timeframe={tf}
              value={charts[tf]}
              onChange={(c) => setCharts((s) => ({ ...s, [tf]: c }))}
            />
          ))}
        </section>

        {/* Action row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-white/55">
            {Object.values(charts).filter(Boolean).length} / 4 charts ready
            {!allReady && <span className="ml-2 text-white/35">— upload all 4 timeframes to enable analysis.</span>}
          </div>
          <AnalyzeButton enabled={allReady} busy={busy} onClick={handleAnalyze} />
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 grid lg:grid-cols-3 gap-5"
            >
              <div className="lg:col-span-2">
                <SignalCard signal={result.signal} modelUsed={result.modelUsed} generatedAt={result.generatedAt} />
              </div>
              <NewsPanel items={result.news} />
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-10 text-center text-[11px] text-white/35">
          BTC Signal Tool — local-only · uses your Claude Code subscription · not financial advice.
        </footer>
      </div>

      <ProgressOverlay open={busy} current={progress} error={error} />
    </div>
  );
}
