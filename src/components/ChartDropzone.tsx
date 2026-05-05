import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import type { ChartUpload, Timeframe } from '../types';
import { dataUrl, fileToChartUpload } from '../lib/image';

interface Props {
  timeframe: Timeframe;
  value: ChartUpload | null;
  onChange: (c: ChartUpload | null) => void;
  accentClass?: string;
}

const labels: Record<Timeframe, string> = {
  '5m': '5-Minute',
  '15m': '15-Minute',
  '30m': '30-Minute',
  '1h': '1-Hour'
};

export function ChartDropzone({ timeframe, value, onChange, accentClass }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
    multiple: false,
    onDrop: async (files) => {
      if (files[0]) onChange(await fileToChartUpload(files[0], timeframe));
    }
  });

  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative glass overflow-hidden ${accentClass ?? ''}`}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent shadow-glow" />
          <span className="text-xs uppercase tracking-[0.18em] text-white/60">
            {labels[timeframe]} timeframe
          </span>
        </div>
        <span className="font-mono text-xs text-white/40">{timeframe}</span>
      </div>

      <div
        {...getRootProps()}
        className={`relative m-3 mt-2 h-56 rounded-xl border border-dashed transition-colors duration-200 cursor-pointer
          ${isDragActive ? 'border-accent bg-accent/5' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]'}
        `}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={dataUrl(value)}
                alt={`${timeframe} chart`}
                className="h-full w-full object-contain rounded-xl bg-black/30"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/80 p-1.5 backdrop-blur"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur">
                {value.fileName}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50"
            >
              <motion.div
                animate={{ y: isDragActive ? -4 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="rounded-full bg-white/5 p-3"
              >
                {isDragActive ? <Upload size={22} /> : <ImageIcon size={22} />}
              </motion.div>
              <div className="text-sm">
                {isDragActive ? 'Drop chart here…' : 'Drop or click to upload'}
              </div>
              <div className="text-[11px] text-white/35">PNG · JPG · WebP</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
