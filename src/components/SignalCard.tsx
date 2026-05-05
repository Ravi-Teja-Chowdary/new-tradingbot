import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Signal } from '../types';
import { ConfidenceGauge } from './ConfidenceGauge';

interface Props {
  signal: Signal;
  modelUsed: string;
  generatedAt: string;
}

export function SignalCard({ signal, modelUsed, generatedAt }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  const headline = getHeadline(signal);
  const tone = headline.tone;
  const toneColor =
    tone === 'long' ? 'text-emerald-400' :
    tone === 'short' ? 'text-rose-400' :
    'text-amber-300';
  const toneBg =
    tone === 'long' ? 'from-emerald-500/20' :
    tone === 'short' ? 'from-rose-500/20' :
    'from-amber-500/15';

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={`relative glass-strong overflow-hidden bg-gradient-to-br ${toneBg} to-transparent`}
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              {tone === 'long' ? <TrendingUp size={28} className="text-emerald-400" /> :
               tone === 'short' ? <TrendingDown size={28} className="text-rose-400" /> :
               <Minus size={28} className="text-amber-300" />}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/55">{signal.mode} signal</div>
              <div className={`text-3xl md:text-4xl font-bold ${toneColor}`}>{headline.title}</div>
              <div className="text-sm text-white/55 mt-1">
                {signal.time_validity} · {new Date(generatedAt).toLocaleString()} · {modelUsed}
              </div>
            </div>
          </div>
          <ConfidenceGauge value={signal.confidence} />
        </div>

        {/* Levels */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Entry" value={fmt(signal.entry)} accent="text-white" />
          <Stat label="Stop loss" value={fmt(signal.stop_loss)} accent="text-rose-300" />
          {signal.mode === 'spot' ? (
            <>
              <Stat label="Target" value={fmt(signal.target)} accent="text-emerald-300" />
              <Stat label="News bias" value={signal.news_impact.sentiment.toUpperCase()} accent={biasColor(signal.news_impact.sentiment)} />
            </>
          ) : (
            <>
              <Stat label="TP1 / TP2 / TP3" value={`${fmt(signal.tp1)} / ${fmt(signal.tp2)} / ${fmt(signal.tp3)}`} accent="text-emerald-300" />
              <Stat label="Leverage" value={signal.leverage_suggestion} accent="text-accent-alt" />
            </>
          )}
        </div>

        {signal.mode === 'futures' && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="R:R" value={signal.risk_reward_ratio} accent="text-white" />
            <Stat label="News bias" value={signal.news_impact.sentiment.toUpperCase()} accent={biasColor(signal.news_impact.sentiment)} />
            <Stat label="Direction" value={signal.direction.toUpperCase()} accent={biasColor(signal.direction)} />
            <Stat label="Confidence" value={`${signal.confidence}/100`} accent="text-white" />
          </div>
        )}

        {/* Reasoning */}
        <div className="mt-7 grid md:grid-cols-2 gap-5">
          <Block title="Reasoning" body={signal.reasoning} />
          <Block title="Multi-timeframe alignment" body={signal.multi_timeframe_alignment} />
          <Block title="News impact" body={signal.news_impact.summary} />
          <Block title="Invalidation" body={signal.invalidation_conditions} />
        </div>

        {/* Key levels */}
        <div className="mt-5 grid md:grid-cols-2 gap-5">
          <LevelList title="Support" items={signal.key_levels.support} color="text-emerald-300" />
          <LevelList title="Resistance" items={signal.key_levels.resistance} color="text-rose-300" />
        </div>

        {/* Risk warning */}
        <div className="mt-7 flex gap-2 rounded-xl border border-accent-warm/30 bg-accent-warm/5 p-3 text-sm text-accent-warm/90">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{signal.risk_warning} <span className="opacity-70">— AI-generated signal. Not financial advice. Do your own research; trade at your own risk.</span></span>
        </div>

        <button
          onClick={() => setShowRaw((v) => !v)}
          className="mt-4 inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70"
        >
          <ChevronDown size={14} className={`transition-transform ${showRaw ? 'rotate-180' : ''}`} />
          {showRaw ? 'Hide' : 'Show'} raw model output
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-white/45">{label}</div>
      <div className={`mt-1 font-mono text-lg ${accent ?? 'text-white'}`}>{value}</div>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/45 mb-1.5">{title}</div>
      <div className="text-sm leading-relaxed text-white/85">{body}</div>
    </div>
  );
}

function LevelList({ title, items, color }: { title: string; items: (number | string)[]; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/45 mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-sm text-white/40">—</span>}
        {items.map((it, i) => (
          <span key={i} className={`font-mono text-sm rounded-md bg-white/5 px-2 py-1 ${color}`}>{fmt(it)}</span>
        ))}
      </div>
    </div>
  );
}

function getHeadline(s: Signal): { title: string; tone: 'long' | 'short' | 'flat' } {
  if (s.mode === 'spot') {
    if (s.action === 'BUY') return { title: 'BUY', tone: 'long' };
    if (s.action === 'SELL') return { title: 'SELL', tone: 'short' };
    return { title: 'HOLD', tone: 'flat' };
  }
  if (s.position === 'LONG') return { title: 'LONG', tone: 'long' };
  if (s.position === 'SHORT') return { title: 'SHORT', tone: 'short' };
  return { title: 'NO TRADE', tone: 'flat' };
}

function biasColor(b: string): string {
  if (b === 'bullish') return 'text-emerald-300';
  if (b === 'bearish') return 'text-rose-300';
  return 'text-amber-300';
}

function fmt(v: number | string): string {
  if (typeof v === 'number') {
    return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(v);
}
