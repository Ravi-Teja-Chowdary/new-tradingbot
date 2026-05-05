import { spawn } from 'node:child_process';
import { z } from 'zod';
import type { Mode, Signal } from './shared/types.js';

const baseSchema = z.object({
  direction: z.enum(['bullish', 'bearish', 'neutral']),
  confidence: z.coerce.number().min(0).max(100),
  entry: z.union([z.number(), z.string()]),
  stop_loss: z.union([z.number(), z.string()]),
  time_validity: z.string(),
  key_levels: z.object({
    support: z.array(z.union([z.number(), z.string()])).default([]),
    resistance: z.array(z.union([z.number(), z.string()])).default([])
  }),
  reasoning: z.string(),
  news_impact: z.object({
    sentiment: z.enum(['bullish', 'bearish', 'neutral']),
    summary: z.string()
  }),
  multi_timeframe_alignment: z.string(),
  invalidation_conditions: z.string(),
  risk_warning: z.string().default('AI-generated signal. Not financial advice.')
});

const spotSchema = baseSchema.extend({
  mode: z.literal('spot').default('spot'),
  action: z.enum(['BUY', 'SELL', 'HOLD']),
  target: z.union([z.number(), z.string()])
});

const futuresSchema = baseSchema.extend({
  mode: z.literal('futures').default('futures'),
  position: z.enum(['LONG', 'SHORT', 'NO_TRADE']),
  leverage_suggestion: z.string(),
  tp1: z.union([z.number(), z.string()]),
  tp2: z.union([z.number(), z.string()]),
  tp3: z.union([z.number(), z.string()]),
  risk_reward_ratio: z.string()
});

export interface ClaudeRunOptions {
  prompt: string;
  mode: Mode;
  model: string;
  cliPath?: string;
  timeoutMs?: number;
}

export interface ClaudeRunResult {
  signal: Signal;
  raw: string;
}

export async function runClaude(opts: ClaudeRunOptions): Promise<ClaudeRunResult> {
  const exe = opts.cliPath?.trim() || 'claude';
  const args = ['-p', '--model', opts.model, '--output-format', 'text'];

  const raw = await spawnCollect(exe, args, opts.prompt, opts.timeoutMs ?? 180_000);
  const json = extractJson(raw);
  const parsed = opts.mode === 'spot' ? spotSchema.parse(json) : futuresSchema.parse(json);
  return { signal: parsed as Signal, raw };
}

function spawnCollect(
  exe: string,
  args: string[],
  stdin: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let proc;
    try {
      proc = spawn(exe, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });
    } catch (err: any) {
      const e: any = new Error(`Failed to spawn Claude CLI ('${exe}'): ${err.message}`);
      e.code = 'CLAUDE_NOT_FOUND';
      return reject(e);
    }

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { proc.kill('SIGKILL'); } catch {}
      const e: any = new Error(`Claude CLI timed out after ${timeoutMs}ms`);
      e.code = 'CLAUDE_FAILED';
      reject(e);
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const e: any = new Error(
        err.code === 'ENOENT'
          ? `Claude CLI not found. Install Claude Code and ensure 'claude' is on PATH, or set CLAUDE_CLI_PATH in .env.`
          : `Claude CLI error: ${err.message}`
      );
      e.code = err.code === 'ENOENT' ? 'CLAUDE_NOT_FOUND' : 'CLAUDE_FAILED';
      reject(e);
    });

    proc.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        const e: any = new Error(
          `Claude CLI exited with code ${code}.\nstderr:\n${stderr || '(empty)'}\nstdout:\n${stdout.slice(0, 500)}`
        );
        e.code = 'CLAUDE_FAILED';
        return reject(e);
      }
      resolve(stdout);
    });

    proc.stdin.end(stdin);
  });
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Try direct parse first.
  try { return JSON.parse(trimmed); } catch {}

  // Strip ```json ... ``` fences.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // Greedy: first { ... last }.
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try { return JSON.parse(slice); } catch {}
  }

  const e: any = new Error('Could not parse JSON from Claude output.');
  e.code = 'CLAUDE_PARSE_FAILED';
  e.raw = text;
  throw e;
}
