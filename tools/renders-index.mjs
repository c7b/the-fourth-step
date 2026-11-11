#!/usr/bin/env node
// Index the Blender renders for the page: renders/<id>/<id>.json (+ ####.png) -> renders-index.js
// (window.R3MAN = { id: { ...manifest, frames, width, height, dir, k } }). A draft dir "<id>@960" is used only if the full one is missing.
// k = nominal stage width / render width (1920 for long-form ids, 1080 for Shorts "S*" ids), so draft sizes composite at the right scale.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '..'), R = path.join(root, 'renders');
const out = {}, DONE = existsSync(path.join(R, 'DONE.txt')) ? readFileSync(path.join(R, 'DONE.txt'), 'utf8') : '';
// with a renders/DONE.txt log, only shots listed there are used (--all to override); without one, every rendered shot is
// v5: the Monero shots were re-rendered in neutral frosted glass (owner note on v4); only DONE lines from after the decision count
const SINCE = { L12_cube_to_monero: '2026-11-08T19:55Z', L11a_ring_form: '2026-11-08T19:55Z', L11b_ring_loop: '2026-11-08T19:55Z', S01_ring_v_form: '2026-11-08T19:55Z', S01_ring_v_loop: '2026-11-08T19:55Z', L17_monero_block_idle: '2026-11-08T19:55Z' };
const ALL = process.argv.includes('--all') || !DONE, done = (d) => ALL || DONE.split('\n').some((l) => { if (/PARTIAL/i.test(l) || !(l.split(/[\s|]+/).includes(d) || l.trim() === d)) return false;
  const since = SINCE[d.replace(/@\d+$/, '')]; return !since || (l.slice(0, 17) >= since); });
if (existsSync(R)) for (const d of readdirSync(R).sort()) {
  const full = path.join(R, d); if (!statSync(full).isDirectory() || d.startsWith('_') || !done(d)) continue;
  const id = d.replace(/@\d+$/, ''), draft = d !== id; if (draft && out[id] && !out[id].draft) continue;
  const pngs = readdirSync(full).filter(f => /^\d{4}\.png$/.test(f)).sort(); if (!pngs.length || pngs[0] !== '0001.png') continue;
  let m = {}; for (const f of [`${id}.json`, `${d}.json`]) if (existsSync(path.join(full, f))) { try { m = JSON.parse(readFileSync(path.join(full, f), 'utf8')); } catch {} }
  const w = m.width || (draft ? +d.split('@')[1] : (id.startsWith('S') ? 1080 : 1920));
  out[id] = { ...m, id, frames: Math.min(m.frames || pngs.length, pngs.length), width: w, dir: `renders/${d}`, draft, k: (id.startsWith('S') ? 1080 : 1920) / w };
}
// matched pairs: if either half is still a draft, both halves play their drafts (a draft/final mix cuts visibly)
for (const pair of [['L14a_tower_build', 'L14b_tower_orbit'], ['L11a_ring_form', 'L11b_ring_loop'], ['L05_bank_in', 'L05_bank_out'], ['S01_ring_v_form', 'S01_ring_v_loop'], ['L22c_bank_in', 'L22c_bank_out'], ['L12_cube_to_monero', 'L11a_ring_form']]) {
  if (!pair.every(id => out[id]) || !pair.some(id => out[id].draft)) continue;
  for (const id of pair) if (!out[id].draft) { const d = `${id}@960`, full = path.join(R, d); if (!existsSync(full) || !done(d)) continue;
    let m = {}; for (const f of [`${id}.json`, `${d}.json`]) if (existsSync(path.join(full, f))) { try { m = JSON.parse(readFileSync(path.join(full, f), 'utf8')); } catch {} }
    const n = readdirSync(full).filter(f => /^\d{4}\.png$/.test(f)).length; out[id] = { ...m, id, frames: Math.min(m.frames || n, n), width: 960, dir: `renders/${d}`, draft: true, k: (id.startsWith('S') ? 1080 : 1920) / 960, paired: true }; }
}
if (!Object.keys(out).length) { console.log('no rendered shots in renders/: renders-index.js left as it is'); process.exit(0); }
writeFileSync(path.join(root, 'renders-index.js'), `window.R3MAN = ${JSON.stringify(out)};\n`);
console.log(`${Object.keys(out).length} render shots indexed: ${Object.entries(out).map(([k, v]) => `${k}(${v.frames}${v.draft ? ' draft' : ''})`).join(', ') || 'none yet'}`);
