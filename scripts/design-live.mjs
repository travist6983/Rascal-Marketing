#!/usr/bin/env node
/**
 * Runs Impeccable's browser detector against the real rendered page.
 *
 *   npm run design:live
 *
 * The static scan (`npm run design`) only reads source files. Most of the
 * useful rules — contrast, leading, occlusion, content hidden at rest — need a
 * live render, so this boots the local server and points the detector at it.
 *
 * Requires puppeteer, which Impeccable loads for URL scanning but does not
 * bundle:  npm i -D puppeteer
 * If Chromium is already on the machine, skip its download and point at it:
 *   PUPPETEER_SKIP_DOWNLOAD=true npm i -D puppeteer
 *   PUPPETEER_EXECUTABLE_PATH=/path/to/chromium npm run design:live
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 4319;
const url = `http://localhost:${port}/`;

const server = spawn(process.execPath, [join(root, 'scripts/serve.mjs')], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore'
});

const stop = () => { try { server.kill(); } catch { /* already gone */ } };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });

// Wait for the server rather than guessing at a sleep.
const deadline = Date.now() + 10_000;
for (;;) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
    if (res.ok) break;
  } catch { /* not up yet */ }
  if (Date.now() > deadline) {
    stop();
    console.error(`could not reach ${url}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 200));
}

const detect = spawn(
  'npx',
  ['--yes', 'impeccable@3.5.0', 'detect', ...process.argv.slice(2), url],
  {
    cwd: root,
    stdio: 'inherit',
    // Impeccable adds --no-sandbox when CI is set, which Chromium needs when
    // the process happens to be running as root (containers, CI images).
    env: { ...process.env, CI: process.env.CI ?? '1' }
  }
);

detect.on('exit', (code) => { stop(); process.exit(code ?? 0); });
