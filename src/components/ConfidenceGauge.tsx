import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  value: number;
  size?: number;
  label?: string;
}

export function ConfidenceGauge({ value, size = 140, label = 'Confidence' }: Props) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color = v >= 75 ? '#22d3ee' : v >= 60 ? '#7c5cff' : v >= 40 ? '#fbbf24' : '#fb7185';

  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    const from = display;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (v - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={10} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold" style={{ color }}>{display}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
        </div>
      </div>
    </div>
  );
}
