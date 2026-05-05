import { contextBridge, ipcRenderer } from 'electron';
import type {
  AnalyzeRequest,
  AnalyzeResult,
  AnalyzeError,
  ProgressEvent
} from './shared/types.js';

const api = {
  analyze: (req: AnalyzeRequest) =>
    ipcRenderer.invoke('analyze', req) as Promise<
      { ok: true; result: AnalyzeResult } | { ok: false; error: AnalyzeError }
    >,
  onProgress: (cb: (e: ProgressEvent) => void) => {
    const handler = (_evt: unknown, e: ProgressEvent) => cb(e);
    ipcRenderer.on('analyze:progress', handler);
    return () => ipcRenderer.removeListener('analyze:progress', handler);
  },
  envStatus: () =>
    ipcRenderer.invoke('env:status') as Promise<{
      hasNewsKey: boolean;
      model: string;
      hasCustomCliPath: boolean;
    }>,
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
};

contextBridge.exposeInMainWorld('btc', api);

export type BtcApi = typeof api;
