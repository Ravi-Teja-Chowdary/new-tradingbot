import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { analyze } from './analyzer.js';
import type { AnalyzeRequest, ProgressEvent } from './shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from the project root (works in dev and packaged builds).
const envCandidates = [
  path.join(process.cwd(), '.env'),
  path.join(app.getAppPath(), '.env'),
  path.join(path.dirname(app.getAppPath()), '.env')
];
for (const p of envCandidates) {
  const r = dotenv.config({ path: p, override: false });
  if (!r.error) break;
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 1100,
    minHeight: 740,
    backgroundColor: '#07070d',
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

ipcMain.handle('analyze', async (event, req: AnalyzeRequest) => {
  const send = (e: ProgressEvent) => {
    event.sender.send('analyze:progress', e);
  };
  try {
    const env = {
      NEWSAPI_KEY: process.env.NEWSAPI_KEY,
      CLAUDE_MODEL: process.env.CLAUDE_MODEL,
      CLAUDE_CLI_PATH: process.env.CLAUDE_CLI_PATH
    };
    const result = await analyze(req, env, send);
    return { ok: true as const, result };
  } catch (err: any) {
    send({ stage: 'error', message: err?.message ?? 'Unknown error' });
    return {
      ok: false as const,
      error: {
        code: err?.code ?? 'UNKNOWN',
        message: err?.message ?? 'Unknown error',
        hint: hintFor(err?.code)
      }
    };
  }
});

ipcMain.handle('open-external', async (_evt, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle('env:status', () => ({
  hasNewsKey: Boolean(process.env.NEWSAPI_KEY?.trim()),
  model: process.env.CLAUDE_MODEL?.trim() || 'claude-opus-4-7',
  hasCustomCliPath: Boolean(process.env.CLAUDE_CLI_PATH?.trim())
}));

function hintFor(code?: string): string | undefined {
  switch (code) {
    case 'CLAUDE_NOT_FOUND':
      return "Install Claude Code (https://claude.com/claude-code), run `claude /login`, then restart this app. If it's installed at a custom path, set CLAUDE_CLI_PATH in .env.";
    case 'CLAUDE_PARSE_FAILED':
      return 'Claude returned non-JSON output. Try again, or check that your model supports vision (Opus / Sonnet).';
    case 'NEWSAPI_FAILED':
      return 'Check your NEWSAPI_KEY in .env and your internet connection.';
    case 'NO_NEWSAPI_KEY':
      return 'Add NEWSAPI_KEY to your .env file.';
    default:
      return undefined;
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
