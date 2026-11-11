// Timeline lookups for Node (same rules as core.js in the page). Reads timeline/timeline-<piece>.json; audio goes to out/audio/<piece>/.
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const WORK = join(HERE, '..', 'timeline');
export const OUT = join(HERE, '..', 'out', 'audio');
export const VO = join(HERE, 'vo');
export const SFX = join(HERE, 'sfx');   // the sound effects listed in SFX-USED.md
export function loadTL(name) { return JSON.parse(readFileSync(join(WORK, `timeline-${name}.json`), 'utf8')); }
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
export function helpers(TL) {
  const beat = (id) => { const b = TL.beats.find((x) => x.id === id); if (!b) throw new Error('no beat ' + id); return b; };
  const wt = (id, word, { n = 1, edge = 'start', off = 0 } = {}) => { let seen = 0;
    for (const w of beat(id).words || []) if (norm(w.text) === norm(word) && ++seen === n) return (edge === 'end' ? w.end : w.start) + off;
    throw new Error(`word "${word}" #${n} not in ${id}`); };
  return { beat, wt, bs: (id) => beat(id).start, be: (id) => beat(id).end };
}
// load a sound effect (decoded to 48 kHz stereo) by a unique part of its file name; null if it isn't in audio/sfx/
const cache = new Map();
export function sample(part) {
  if (cache.has(part)) return cache.get(part);
  let files = []; try { files = readdirSync(SFX); } catch {}
  const f = files.filter((x) => x.includes(part)); if (f.length > 1) throw new Error(`sample "${part}": ${f.length} matches`);
  if (!f.length) { cache.set(part, null); return null; }
  const raw = spawnSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', join(SFX, f[0]), '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'], { maxBuffer: 1 << 28 }).stdout;
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4), n = x.length / 2, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = x[2 * i]; R[i] = x[2 * i + 1]; }
  let pk = 0, at = 0; for (let i = 0; i < n; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (v > pk) { pk = v; at = i; } }
  const s = { file: f[0], ch: [L, R], n, peak: pk, peakAt: at / 48000 }; cache.set(part, s); return s;
}
