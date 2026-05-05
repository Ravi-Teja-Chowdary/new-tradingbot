import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  enabled: boolean;
  busy: boolean;
  onClick: () => void;
}

export function AnalyzeButton({ enabled, busy, onClick }: Props) {
  const disabled = !enabled || busy;
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      animate={enabled && !busy ? { boxShadow: ['0 0 0 rgba(124,92,255,0.0)', '0 0 30px rgba(124,92,255,0.5)', '0 0 0 rgba(124,92,255,0.0)'] } : {}}
      transition={enabled && !busy ? { duration: 2, repeat: Infinity } : {}}
      className={`relative inline-flex items-center gap-2 rounded-full px-7 py-3 font-semibold tracking-wide
        ${disabled
          ? 'bg-white/5 text-white/40 cursor-not-allowed'
          : 'bg-gradient-to-r from-accent via-accent-alt to-accent text-white'
        }`}
    >
      <AnimatePresence mode="wait">
        {busy ? (
          <motion.span key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Analyzing…
          </motion.span>
        ) : (
          <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
            <Sparkles size={18} /> Generate Signal
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
