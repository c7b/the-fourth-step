// Finds puppeteer-core and a Chrome binary, so render.mjs runs without hard-coded paths.
//   puppeteer-core: ./node_modules (npm install), else a copy already in the npx cache.
//   Chrome: $CHROME, else the newest Chrome for Testing in ~/.cache/puppeteer, else a system Chrome/Chromium.
import { createRequire } from 'module';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import os from 'os';

const require = createRequire(import.meta.url);

export function puppeteer() {
  try { return require('puppeteer-core'); } catch {}
  const npx = path.join(os.homedir(), '.npm/_npx');
  const dir = existsSync(npx) && readdirSync(npx).map((d) => path.join(npx, d, 'node_modules/puppeteer-core')).find(existsSync);
  if (dir) return require(dir);
  throw new Error('puppeteer-core not found: run `npm install` in this folder');
}

export function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const subs = ['chrome-linux64/chrome', 'chrome-win64/chrome.exe',
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'];
  const cache = path.join(os.homedir(), '.cache/puppeteer/chrome');
  if (existsSync(cache)) {
    const versions = readdirSync(cache).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const v of versions) for (const s of subs) { const p = path.join(cache, v, s); if (existsSync(p)) return p; }
  }
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']) if (existsSync(p)) return p;
  throw new Error('Chrome not found: set CHROME=/path/to/chrome');
}
