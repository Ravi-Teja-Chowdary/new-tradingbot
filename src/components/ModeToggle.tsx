import { motion } from 'framer-motion';
import type { Mode } from '../types';

interface Props {
  value: Mode;
  onChange: (m: Mode) => void;
}

export function ModeToggle({ value, onChange }: Props) {
  const options: { id: Mode; label: string; sub: string }[] = [
    { id: 'spot', label: 'Spot', sub: 'BUY · SELL · HOLD' },
    { id: 'futures', label: 'Futures', sub: 'LONG · SHORT · Leverage' }
  ];

  return (
    <div className="relative inline-flex items-center gap-1 rounded-full glass-strong p-1">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          >
            {active && (
              <motion.div
                layoutId="mode-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-accent to-accent-alt shadow-glow"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative ${active ? 'text-white' : 'text-white/60 hover:text-white/90'}`}>
              <span className="font-semibold">{o.label}</span>
              <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">{o.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
