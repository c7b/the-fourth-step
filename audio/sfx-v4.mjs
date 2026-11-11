#!/usr/bin/env node
/**
 * v4 sound design from the samples in audio/sfx/ (no synthesis). Each event places one short sample:
 *   { t, s: <file-name part>, db, pan, len (s, trimmed with a fade), at: 'onset' | 'peak' (what lands on t), from (s into the file) }
 * Every event is tied to the picture's own cue (the voice timeline words the page animates on).
 *   node audio/sfx-v4.mjs [--piece long|s1|s2|s3] → out/audio/<piece>/sfx.wav (+ sfx-events.json, the used-where list)
 */
import fs from 'node:fs';
import { join } from 'node:path';
import { SR, writeWav } from './synth.mjs';
import { helpers, loadTL, OUT, sample } from './tl4.mjs';
import { EVENTS } from './sfx-events-v4.mjs';

const args = process.argv.slice(2), piece = args.includes('--piece') ? args[args.indexOf('--piece') + 1] : 'long';
const TL = loadTL(piece), H = helpers(TL), N = Math.ceil((TL.total + 1) * SR), out = [new Float32Array(N), new Float32Array(N)];
const evs = EVENTS[piece](H, TL).filter((e) => e && Number.isFinite(e.t)).sort((a, b) => a.t - b.t);
const used = [], missing = new Set();
for (const e of evs) {
  const sm = sample(e.s); if (!sm) { missing.add(e.s); continue; }
  const from = Math.round((e.from || 0) * SR), len = Math.min(sm.n - from, Math.round((e.len ?? 1.2) * SR));
  const off = e.at === 'peak' ? Math.round(sm.peakAt * SR) - from : 0, i0 = Math.round(e.t * SR) - off;
  const g = Math.pow(10, (e.db ?? -12) / 20) / Math.max(0.3, sm.peak), pan = e.pan || 0, gl = g * Math.min(1, 1 - pan), gr = g * Math.min(1, 1 + pan);
  const fadeIn = Math.round(0.004 * SR), fadeOut = Math.min(Math.round((e.fade ?? 0.12) * SR), len);
  for (let i = 0; i < len; i++) { const j = i0 + i; if (j < 0 || j >= N) continue;
    const k = Math.min(1, i / fadeIn) * Math.min(1, (len - i) / fadeOut);
    out[0][j] += sm.ch[0][from + i] * gl * k; out[1][j] += sm.ch[1][from + i] * gr * k; }
  used.push({ t: +e.t.toFixed(3), what: e.what, file: sm.file, db: e.db ?? -12, len: +(len / SR).toFixed(2) });
}
fs.mkdirSync(join(OUT, piece), { recursive: true });
writeWav(join(OUT, piece, 'sfx.wav'), out, fs);
fs.writeFileSync(join(OUT, piece, 'sfx-events.json'), JSON.stringify(used, null, 1) + '\n');
const files = [...new Set(used.map((u) => u.file))];
console.log(`[sfx ${piece}] ${used.length} events from ${files.length} files`);
if (missing.size) console.log(`  ${missing.size} sounds not in audio/sfx/ (their events are silent): ${[...missing].join(', ')}`);
