import type { ChartUpload, Timeframe } from '../types';

export async function fileToChartUpload(
  file: File,
  timeframe: Timeframe
): Promise<ChartUpload> {
  const buf = await file.arrayBuffer();
  return {
    timeframe,
    base64: arrayBufferToBase64(buf),
    fileName: file.name,
    mimeType: file.type || 'image/png'
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk))
    );
  }
  return btoa(binary);
}

export function dataUrl(c: ChartUpload): string {
  return `data:${c.mimeType};base64,${c.base64}`;
}
