# BTC Signal — Multi-Timeframe Analyzer

A beautiful, fluidic desktop app that turns four TradingView screenshots
(5m / 15m / 30m / 1h) into one high-conviction Bitcoin trading signal.

It uses **Claude Opus** (via your **Claude Code CLI** — no API key required) to
read the candlestick patterns visually, blends in the latest **NewsAPI**
Bitcoin headlines, and outputs a structured signal with entry, stop loss,
target(s), confidence, multi-timeframe alignment notes, news impact, and
invalidation conditions.

> ⚠️ **Disclaimer.** Signals are AI-generated. This is **not** financial advice.
> Crypto trading is high-risk; you can lose your capital. Trade at your own risk.

---

## Features

- 🪟 **4 drag-and-drop windows** for 5m, 15m, 30m, 1h screenshots
- 🧠 **Claude Opus 4.7** visually analyses every chart (multi-timeframe alignment)
- 📰 **NewsAPI** bias mixed into the signal (last 24h Bitcoin headlines)
- 🔁 **Spot or Futures** mode (toggle): BUY/SELL/HOLD or LONG/SHORT with leverage,
  entry, SL, TP1/TP2/TP3, and risk-reward ratio
- 🔐 **No API key for Claude** — runs the `claude` CLI as a subprocess and
  authenticates with your existing Claude Pro/Max subscription
- 🌌 Fluidic dark/glassmorphism UI with Framer Motion animations
- 💾 Local-only — your screenshots are saved to a temp folder on your machine
  and referenced by file path; nothing is uploaded except to Anthropic
  (via your Claude subscription) and NewsAPI (text-only request)

---

## Prerequisites

1. **Node.js 20 or newer** — https://nodejs.org
2. **Claude Code CLI** — https://claude.com/claude-code
   - Install per the official docs.
   - Run `claude /login` once and complete the browser auth.
   - Verify it works: `claude --version`
   - On Windows, make sure `claude` is on your PATH (or use `CLAUDE_CLI_PATH`
     in `.env` to point at the executable directly).
3. **NewsAPI key** — https://newsapi.org (free tier is enough, 100 req/day)

---

## Setup

```powershell
# 1. Install dependencies
npm install

# 2. Create your .env from the template
Copy-Item .env.example .env
notepad .env       # paste your NEWSAPI_KEY
```

`.env` options:

| Variable          | Required | Purpose                                                      |
| ----------------- | -------- | ------------------------------------------------------------ |
| `NEWSAPI_KEY`     | Yes      | Your https://newsapi.org key                                 |
| `CLAUDE_MODEL`    | No       | Override the model. Default: `claude-opus-4-7`               |
| `CLAUDE_CLI_PATH` | No       | Absolute path to `claude` if it isn't on your PATH           |

---

## Run

### Development (hot-reload)
```powershell
npm run dev
```

### Build & launch the production bundle
```powershell
npm run build
npm run start
```

### Package a distributable installer (optional)
```powershell
npm run dist
```

---

## How to take the chart screenshots (TradingView)

For best results follow this checklist for **each of the 4 timeframes**:

1. Open TradingView → BTC/USD (or BTC/USDT on your preferred exchange).
2. Set the timeframe (5m, 15m, 30m, or 1h).
3. Apply your normal indicator template (EMAs / volume / RSI etc.).
4. Make sure the **price scale on the right is visible** — Claude needs to read
   actual prices to suggest realistic entry/SL/TP levels.
5. Make sure the **last few hundred candles** are in view so structure is clear.
6. Take a screenshot:
   - Windows: `Win + Shift + S` → drag → save / copy
   - Or use TradingView's built-in: **Camera icon → "Save chart image"**.
7. Save the file (PNG/JPG/WebP) somewhere convenient.

Repeat for all four timeframes. The clearer the chart, the better the signal.

---

## Using the app

1. Launch the app (`npm run dev` or `npm run start`).
2. Pick **Spot** or **Futures** in the top-right toggle.
3. **Drag-and-drop** each screenshot into its matching window:
   - Top-left → 5m
   - Top-right → 15m
   - Bottom-left → 30m
   - Bottom-right → 1h
   You can also click any window to open a file picker.
4. Once all 4 charts are loaded, the **"Generate Signal"** button activates.
5. Click it. The progress overlay shows:
   - Reading chart screenshots
   - Fetching latest Bitcoin news
   - Consulting Claude Opus
   - Composing signal
6. The signal card slides in with:
   - Direction (BUY/SELL/HOLD or LONG/SHORT/NO_TRADE)
   - Animated **confidence gauge** (0–100)
   - **Entry, Stop Loss, Target(s)**, Leverage, R:R (futures)
   - **Reasoning**, multi-timeframe alignment, news impact
   - **Key support/resistance** levels
   - Invalidation conditions and risk warning
7. The right-hand **News Context** panel shows the headlines Claude considered;
   click any to open in your browser.
8. Review, then **make your own decision**. Repeat with new screenshots whenever
   you want a fresh signal.

---

## Confidence scale

| Range  | Meaning      |
| ------ | ------------ |
| 0–39   | Avoid        |
| 40–59  | Weak setup   |
| 60–74  | Decent       |
| 75–89  | Strong       |
| 90–100 | Exceptional  |

When timeframes diverge or news strongly contradicts the technical setup,
Claude will lower confidence — and may return `HOLD` / `NO_TRADE`.

---

## Troubleshooting

**"Claude CLI not found."**
- Make sure `claude` is installed and on your PATH. Test with `claude --version`
  in the same PowerShell where you run the app.
- If it lives at a custom path, set `CLAUDE_CLI_PATH=C:\path\to\claude.cmd`
  (or `.exe`) in `.env`.
- Run `claude /login` once to authenticate.

**"Could not parse JSON from Claude output."**
- Re-run the analysis. Occasionally the model wraps JSON in prose; the app
  retries to extract it but can fail on extreme edge cases.
- Make sure the model selected supports vision (Opus / Sonnet do).

**"NewsAPI failed."**
- Check `NEWSAPI_KEY` in `.env`. The free tier allows 100 requests/day.
- Check your internet connection.

**Window won't open / blank screen.**
- Run `npm run build` then `npm run start` and watch the terminal for errors.
- Delete `node_modules` and `out`, then `npm install` again.

**Screenshots not being read well.**
- Ensure the price scale is visible and candles are large enough to be legible.
- Use PNG instead of heavily-compressed JPG.
- Take the screenshot at 1080p or higher.

---

## Project structure

```
new-trading-bot/
├─ electron/                # Electron main + preload + analyzer
│  ├─ main.ts               # Window, IPC, env loading
│  ├─ preload.ts            # Secure bridge → window.btc
│  ├─ analyzer.ts           # Orchestrates news + Claude
│  ├─ news-fetcher.ts       # NewsAPI client
│  ├─ prompt-builder.ts     # Builds Spot/Futures prompts
│  ├─ claude-runner.ts      # Spawns `claude -p`, parses JSON
│  └─ shared/types.ts
├─ src/                     # React renderer
│  ├─ App.tsx
│  ├─ components/
│  │  ├─ ChartDropzone.tsx
│  │  ├─ ModeToggle.tsx
│  │  ├─ AnalyzeButton.tsx
│  │  ├─ ProgressOverlay.tsx
│  │  ├─ ConfidenceGauge.tsx
│  │  ├─ SignalCard.tsx
│  │  └─ NewsPanel.tsx
│  ├─ lib/image.ts
│  └─ types.ts
├─ .env.example
├─ electron.vite.config.ts
├─ tailwind.config.js
└─ package.json
```

---

## How it works (under the hood)

1. The renderer collects 4 screenshots (base64) + the selected mode and sends
   them over IPC to the Electron main process.
2. Main writes the images to `{userData}/sessions/s-{ts}/chart-{tf}.png`.
3. It calls **NewsAPI** for the last 24h of Bitcoin-relevant headlines.
4. It builds a strict-schema prompt that lists each image's **absolute file
   path** and asks Claude to open them, analyse, and respond with a single
   JSON object.
5. It spawns `claude -p --model <model> --output-format text` and pipes the
   prompt over stdin. Claude reads the images from disk and returns JSON.
6. The JSON is validated with **zod** against the Spot or Futures schema and
   returned to the renderer.
7. The renderer animates the signal card, confidence gauge, and news panel.

---

## Privacy

- Screenshots stay **on your machine**. They're saved locally and the path is
  passed to the `claude` CLI which uploads them to Anthropic via your existing
  subscription (the same as if you'd dragged them into Claude Desktop).
- News requests go to **newsapi.org** with text-only queries — no images.
- No telemetry. No third-party analytics.

---

## Roadmap ideas (not in v1)

- Auto-screenshot via headless browser (Puppeteer)
- Paper-trading log + journaling
- Telegram / Discord push of signals
- Backtesting against historical chart images
- Multi-asset support (ETH, SOL, etc.)

---

Built with ❤️ using Electron, React, TypeScript, TailwindCSS, Framer Motion,
and Claude Opus.
