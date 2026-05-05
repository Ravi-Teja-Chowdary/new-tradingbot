import { motion } from 'framer-motion';
import { Newspaper, ExternalLink } from 'lucide-react';
import type { NewsItem } from '../types';

interface Props {
  items: NewsItem[];
}

export function NewsPanel({ items }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Newspaper size={16} className="text-accent-alt" />
        <h3 className="text-sm uppercase tracking-[0.2em] text-white/60">News context</h3>
        <span className="ml-auto text-xs text-white/40">{items.length} items</span>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-white/40">No recent news available (or NEWSAPI_KEY not set).</div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-auto pr-1">
          {items.map((n, i) => (
            <li key={i} className="rounded-lg bg-white/[0.03] border border-white/10 p-3 hover:bg-white/[0.05] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-medium text-white/90 leading-snug">{n.title}</div>
                <button
                  onClick={() => window.btc.openExternal(n.url)}
                  className="shrink-0 text-white/40 hover:text-white/80"
                  aria-label="Open article"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
              <div className="mt-1 text-xs text-white/45">
                {n.source} · {n.publishedAt ? new Date(n.publishedAt).toLocaleString() : ''}
              </div>
              {n.description && (
                <div className="mt-1.5 text-xs text-white/60 line-clamp-2">{n.description}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
