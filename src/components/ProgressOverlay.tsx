import { motion, AnimatePresence } from 'framer-motion';
import type { ProgressEvent } from '../types';
import { CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react';

const STAGES: { id: ProgressEvent['stage']; label: string }[] = [
  { id: 'saving-charts', label: 'Reading chart screenshots' },
  { id: 'fetching-news', label: 'Fetching latest Bitcoin news' },
  { id: 'consulting-claude', label: 'Consulting Claude Opus' },
  { id: 'composing-signal', label: 'Composing signal' }
];

interface Props {
  open: boolean;
  current: ProgressEvent | null;
  error: string | null;
}

export function ProgressOverlay({ open, current, error }: Props) {
  const currentIdx = current ? STAGES.findIndex((s) => s.id === current.stage) : -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="glass-strong w-[460px] p-6"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-1">
              {error ? 'Analysis failed' : 'Analyzing market'}
            </div>
            <div className="text-lg font-semibold mb-5">
              {error ? 'Something went wrong' : 'Cross-referencing 4 timeframes…'}
            </div>

            <ul className="space-y-2.5">
              {STAGES.map((s, i) => {
                const done = currentIdx > i || current?.stage === 'done';
                const active = currentIdx === i && !error;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 size={18} className="text-accent-alt" />
                    ) : active ? (
                      <Loader2 size={18} className="animate-spin text-accent" />
                    ) : (
                      <Circle size={18} className="text-white/25" />
                    )}
                    <span
                      className={`text-sm ${
                        done ? 'text-white/80' : active ? 'text-white' : 'text-white/40'
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {error && (
              <div className="mt-5 flex gap-2 rounded-lg border border-accent-warm/30 bg-accent-warm/10 p-3 text-sm text-accent-warm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            {!error && current?.message && (
              <div className="mt-5 text-xs text-white/55">{current.message}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
