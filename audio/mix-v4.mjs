#!/usr/bin/env node
/**
 * The mix, by measurement:
 *
 *   node audio/mix-v4.mjs [--piece long|s1|s2|s3] [--sep 20]
 *
 * 1. Voice: audio/vo/vo-<piece>.mp3 (or .wav), already processed and placed on the timeline (dual mono).
 * 2. Music (out/audio/<piece>/music.wav, from music-track.mjs or music-v4.mjs) ducks under every line
 *    (from the word timings) and comes back up only across gaps of 1.2 s or more.
 * 3. The music's level is set so that over every line it sits --sep LU (default 20) under the voice
 *    (BS.1770 over the line), and the loudest SFX event (out/audio/<piece>/sfx.wav) sits >= 8 LU under the voice.
 * 4. Writes out/audio/<piece>/{vo,music,sfx}.stem.wav, mix.wav and mix-check.json.
 * Any missing stem is silence; with no voice, the levels are set against a -14.1 LUFS reference voice.
 * Mastering to -14 LUFS / <= -1.5 dBTP happens on the encoded file (audio/mux.mjs).
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { readWav, SR, writeWav } from './synth.mjs';
import { loadTL, OUT, VO } from './tl4.mjs';

const args = process.argv.slice(2);
const piece = args.includes('--piece') ? args[args.indexOf('--piece') + 1] : 'long';
const went = false;
const TL = loadTL(piece);
const voice = { name: 'George (audio/vo/vo-' + piece + ')' };
const dir = join(OUT, piece);
const N = Math.ceil(TL.total * SR);
const ff = (a) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...a], { encoding: 'utf8', maxBuffer: 1 << 27 }); if (r.status !== 0) throw new Error(r.stderr.slice(-2000)); return r.stderr; };
const lin = (db) => Math.pow(10, db / 20);
// decode any audio file to 48 kHz float stereo with ffmpeg (null if the file is missing)
const decode = (f) => { if (!fs.existsSync(f)) return null;
  const r = spawnSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error('could not decode ' + f);
  const x = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4), n = x.length / 2, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = x[2 * i]; R[i] = x[2 * i + 1]; } return [L, R]; };
const stem = (name) => { const f = join(dir, name); if (fs.existsSync(f)) return readWav(fs, f).ch; console.log(`  no ${name} in out/audio/${piece}/: silent`); return [new Float32Array(N), new Float32Array(N)]; };
// the voice is one placed, processed track; dual mono, so channel 0 is the voice
// ---- 2. VO stem + duck envelope ------------------------------------------------------------------
const vo = new Float32Array(N);
const voSrc = [`vo-${piece}.wav`, `vo-${piece}.mp3`].map((f) => join(VO, f)).find((f) => fs.existsSync(f));
const hasVo = !!voSrc;
if (hasVo) { const v = decode(voSrc)[0]; for (let i = 0; i < Math.min(N, v.length); i++) vo[i] = v[i]; }
else console.log(`  no voice in audio/vo/: mixing music and SFX only`);
const VO_REF = -14.1;   // the voice's integrated loudness in the published mix, used when there is no voice
const lines = [];
for (const b of TL.beats) if (b.words && b.words.length) lines.push({ key: b.vo || b.id, start: b.words[0].start, end: b.words.at(-1).end });
const DUCK_DB = 8, PRE = 0.3, POST = 0.6, GAP = 1.2;   // v6: under speech 28 LU down, in the gaps it lifts to ~20 LU under the voice
const wins = [];
for (const l of lines) {
  const w = [l.start - PRE, l.end + POST];
  if (wins.length && w[0] - wins.at(-1)[1] < GAP - PRE - POST) wins.at(-1)[1] = w[1]; else wins.push(w);
}
const duck = new Float32Array(N).fill(1);
const dl = lin(-DUCK_DB);
for (const [a, b] of wins) {
  const A = 0.35, Rl = 0.9;
  for (let i = Math.max(0, Math.round((a - A) * SR)); i < Math.min(N, Math.round((b + Rl) * SR)); i++) {
    const t = i / SR;
    const k = t < a ? (t - (a - A)) / A : t > b ? 1 - (t - b) / Rl : 1;
    const g = 1 - (1 - dl) * (0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, k))));
    duck[i] = Math.min(duck[i], g);
  }
}

// ---- 3. loudness (BS.1770, 48 kHz) and levels by measurement -------------------------------------
const SHELF = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [1, -1.69065929318241, 0.73248077421585] };
const HP = { b: [1.0, -2.0, 1.0], a: [1, -1.99004745483398, 0.99007225036621] };
function kw(x) {
  const run = (inp, { b, a }) => { const y = new Float64Array(inp.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < inp.length; i++) { const v = b[0] * inp[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2; x2 = x1; x1 = inp[i]; y2 = y1; y1 = v; y[i] = v; } return y; };
  return run(run(x, SHELF), HP);
}
function blocks(chans) {                    // momentary mean square, 400 ms blocks, 100 ms hop, summed over channels
  const k = chans.map(kw), blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR), n = Math.max(1, Math.floor((N - blk) / hop) + 1), z = new Float64Array(n);
  for (const c of k) { const pre = new Float64Array(c.length + 1); for (let i = 0; i < c.length; i++) pre[i + 1] = pre[i] + c[i] * c[i]; for (let j = 0; j < n; j++) z[j] += (pre[Math.min(c.length, j * hop + blk)] - pre[j * hop]) / blk; }
  return z;
}
const L = (z) => (z > 0 ? -0.691 + 10 * Math.log10(z) : -Infinity);
const integ = (z, a = 0, b = z.length) => { const g1 = []; for (let k = Math.max(0, a); k < Math.min(z.length, b); k++) if (L(z[k]) > -70) g1.push(z[k]); if (!g1.length) return -Infinity; const rel = L(g1.reduce((s, v) => s + v, 0) / g1.length) - 10; const g2 = g1.filter((v) => L(v) > rel); return L(g2.reduce((s, v) => s + v, 0) / g2.length); };
const energy = (z, a, b) => { let s = 0, n = 0; for (let k = Math.max(0, a); k < Math.min(z.length, b); k++) (s += z[k]), n++; return n ? L(s / n) : -Infinity; };
const bi = (t) => Math.round(t * 10);

fs.mkdirSync(dir, { recursive: true });
const [mL, mR] = stem('music.wav'), [sL, sR] = stem('sfx.wav');
const ducked = [new Float32Array(N), new Float32Array(N)];
for (let i = 0; i < N; i++) { ducked[0][i] = (mL[i] || 0) * duck[i]; ducked[1][i] = (mR[i] || 0) * duck[i]; }
const zVo = blocks([vo, vo]), zMu = blocks(ducked), zSfx = blocks([sL.subarray(0, N), sR.subarray(0, N)]);
const voI = hasVo ? integ(zVo) : VO_REF, voLine = (a, b) => (hasVo ? integ(zVo, a, b) : VO_REF);
const TARGET_SEP = args.includes('--sep') ? +args[args.indexOf('--sep') + 1] : 20;   // v6b: owner found 28 LU "inaudible": +8 dB → 20 LU under every line (ducked), ~12 LU under in the gaps
let need = -Infinity;
for (const l of lines) {
  const a = bi(l.start), b = Math.max(a + 1, bi(l.end) - 3);
  need = Math.max(need, energy(zMu, a, b) - (voLine(a, b) - TARGET_SEP));
}
const musicGainDb = Number.isFinite(need) ? -need : 0;                                    // brings the closest line to TARGET_SEP
// sfx: the loudest SFX event >= 8 LU under the voice (contract >= 6); keystrokes ride along
let sfxMax = -Infinity; for (let k = 0; k < zSfx.length; k++) sfxMax = Math.max(sfxMax, L(zSfx[k]));
const SFX_V6_DB = 1.2;   // v6: every SFX +15% amplitude (x1.15) relative to the v5 mix
const sfxGainDb = Number.isFinite(sfxMax) ? Math.min(0, voI - 8 - sfxMax) + SFX_V6_DB : 0;

// ---- 4. sum, check, write -----------------------------------------------------------------------------
const gm = lin(musicGainDb), gs = lin(sfxGainDb);
const mix = [new Float32Array(N), new Float32Array(N)], mus = [new Float32Array(N), new Float32Array(N)], sf = [new Float32Array(N), new Float32Array(N)];
for (let i = 0; i < N; i++) for (let c = 0; c < 2; c++) {
  mus[c][i] = ducked[c][i] * gm; sf[c][i] = (c ? sR[i] || 0 : sL[i] || 0) * gs;
  mix[c][i] = vo[i] + mus[c][i] + sf[c][i];
}
const zM2 = blocks(mus), zS2 = blocks(sf);
const report = { piece, went, voice: voice.name, musicGainDb: +musicGainDb.toFixed(2), sfxGainDb: +sfxGainDb.toFixed(2), duckDb: DUCK_DB, integrated: { vo: +voI.toFixed(1), music: +integ(zM2).toFixed(1), sfx: +integ(zS2).toFixed(1), mixPreMaster: +integ(blocks(mix)).toFixed(1) }, lines: [] };
for (const l of lines) {
  const a = bi(l.start), b = Math.max(a + 1, bi(l.end) - 3);
  const v = voLine(a, b), m = energy(zM2, a, b);
  report.lines.push({ key: l.key, from: +l.start.toFixed(2), to: +l.end.toFixed(2), vo: +v.toFixed(1), music: +m.toFixed(1), separation: +(v - m).toFixed(1) });
}
const seps = [];
for (const l of lines) for (let k = bi(l.start); k + 4 <= bi(l.end); k++) { const v = L(zVo[k]); if (v > voI - 15) seps.push({ t: k / 10, sep: v - L(zM2[k]) }); }
seps.sort((x, y) => x.sep - y.sep);
let sMax = -Infinity, sAt = 0; for (let k = 0; k < zS2.length; k++) if (L(zS2[k]) > sMax) (sMax = L(zS2[k])), (sAt = k / 10);
report.momentary = { worst: seps[0] && { at: seps[0].t, sep: +seps[0].sep.toFixed(1) }, p5: seps.length ? +seps[Math.floor(seps.length * 0.05)].sep.toFixed(1) : null };
report.sfx = { loudestMomentary: +sMax.toFixed(1), at: sAt, underVoice: +(voI - sMax).toFixed(1) };
report.minSeparation = Math.min(...report.lines.map((l) => l.separation));
report.pass = { musicUnder18: report.minSeparation >= 18, musicUnder20: report.minSeparation >= 20, sfxUnder6: report.sfx.underVoice >= 6 };
const tag = went ? '-went' : '';
writeWav(join(dir, `mix${tag}.wav`), mix, fs);
writeWav(join(dir, `vo${tag}.stem.wav`), [vo, vo], fs);
writeWav(join(dir, 'music.stem.wav'), mus, fs);
writeWav(join(dir, 'sfx.stem.wav'), sf, fs);
fs.writeFileSync(join(dir, `mix-check${tag}.json`), JSON.stringify(report, null, 1) + '\n');
console.log(`[v4 ${piece}${tag}] voice ${report.integrated.vo} LUFS · music ${report.integrated.music} (gain ${report.musicGainDb} dB) · sfx ${report.integrated.sfx} (gain ${report.sfxGainDb} dB) · mix ${report.integrated.mixPreMaster}`);
console.log(`  separation per line: min ${report.minSeparation} LU · momentary worst ${report.momentary.worst?.sep} at ${report.momentary.worst?.at}s, p5 ${report.momentary.p5} · sfx loudest ${report.sfx.underVoice} LU under the voice · pass ${JSON.stringify(report.pass)}`);
