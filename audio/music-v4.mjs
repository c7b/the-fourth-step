#!/usr/bin/env node
/**
 * v4 music: owner note 18, "super simple, quiet, in the background". One soft pad (sine + two detuned triangles, low-passed,
 * slow breathing), one chord per act, changing on the picture's act boundaries; it drops out for "lights out" (B15)
 * and lifts to D major on the lime flood. No drums, no melody, no risers (the SFX carry the hits).
 *   node audio/music-v4.mjs [--piece long|s1|s2|s3] → out/audio/<piece>/music.wav
 */
import fs from 'node:fs';
import { join } from 'node:path';
import { biquad, mtof, reverb, SR, stereo, TAU, tone, writeWav } from './synth.mjs';
import { helpers, loadTL, OUT } from './tl4.mjs';

const args = process.argv.slice(2), piece = args.includes('--piece') ? args[args.indexOf('--piece') + 1] : 'long';
const TL = loadTL(piece), H = helpers(TL), DUR = TL.total + 1, music = stereo(DUR);
function pad(buf, t0, t1, notes, { amp = 0.035, a = 2.2, r = 2.4, lp = 1100 } = {}) {
  const dur = t1 - t0; if (dur <= 0.2) return;
  const n = Math.round(dur * SR), tmp = [new Float32Array(n), new Float32Array(n)];
  notes.forEach((m, i) => { const f = mtof(m), pan = (i / Math.max(1, notes.length - 1) - 0.5) * 0.8;
    tone(tmp, 0, dur, { f, type: 'sine', amp, a, r, pan });
    tone(tmp, 0, dur, { f: f * 1.003, type: 'tri', amp: amp * 0.3, a: a * 1.2, r, pan: -pan * 0.7, vib: 0.0015, vibF: 0.2 + i * 0.07 });
    tone(tmp, 0, dur, { f: f * 0.997, type: 'tri', amp: amp * 0.3, a: a * 1.3, r, pan: pan * 0.5, vib: 0.0012, vibF: 0.17 + i * 0.05 }); });
  for (const ch of tmp) biquad(ch, 'lp', lp, 0.6);
  for (let i = 0; i < n; i++) { const g = 1 + 0.06 * Math.sin(TAU * 0.09 * (i / SR)); tmp[0][i] *= g; tmp[1][i] *= g; }
  const i0 = Math.round(t0 * SR);
  for (let c = 0; c < 2; c++) for (let i = 0; i < n && i0 + i < buf[c].length; i++) if (i0 + i >= 0) buf[c][i0 + i] += tmp[c][i];
}
const CH = { Dm: [38, 45, 53, 57], Fmaj7: [41, 48, 57, 64], Bb: [46, 53, 58, 62], Dm7: [38, 45, 60, 65], Gm: [43, 50, 58, 62], Bbmaj7: [46, 53, 57, 62], F9: [41, 48, 60, 67], D: [38, 45, 54, 57, 62], Dsus: [38, 45, 52, 57, 62] };
const X = 1.6;   // chord overlap (s): each section fades in under the last one's tail
let secs;
if (piece === 'long') {
  const { bs, be, wt } = H, land = Math.max(2.6, wt('B03', 'This') - 1.0);
  secs = [[land - 0.4, bs('B04'), CH.Dm, { lp: 900 }], [bs('B04'), bs('B09'), CH.Fmaj7], [bs('B09'), bs('B13'), CH.Bb], [bs('B13'), bs('B15') + 0.3, CH.Dm7, { lp: 800, r: 0.9 }],
    [be('B15') - 0.6, bs('B22'), CH.Gm, { lp: 850, a: 3.0 }], [bs('B22'), bs('B25'), CH.Bbmaj7, { lp: 1300 }], [bs('B25'), bs('B29'), CH.F9, { lp: 1200 }],
    [bs('B29'), wt('B29', 'ask') - 0.3, CH.Dm, { lp: 900 }], [wt('B29', 'ask') - 0.3, bs('B32'), CH.D, { lp: 1500, a: 0.9 }], [bs('B32'), TL.total, CH.Dsus, { lp: 1300, r: 3.0 }]];
} else {
  const ids = TL.beats.map((b) => b.id), first = TL.beats[0].start, last = TL.total, mid = TL.beats[Math.floor(ids.length / 2)].start;
  const darkAt = { s1: 'S1E', s2: 'S2D', s3: 'S3D' }[piece], tariAt = { s1: 'S1F', s2: 'S2E', s3: 'S3F' }[piece];
  secs = [[first, H.bs(darkAt), piece === 's2' ? CH.Dm7 : CH.Fmaj7], [H.bs(darkAt), H.bs(tariAt), piece === 's2' ? CH.Gm : CH.Gm, { lp: 850 }], [H.bs(tariAt), last, CH.D, { lp: 1400 }]];
  void mid;
}
for (const [a, b, notes, o = {}] of secs) pad(music, Math.max(0, a - (o.a ?? 2.2) * 0.4), Math.min(DUR, b + X), notes, o);
// a light room on the pad only
const wet = reverb([Float32Array.from(music[0]), Float32Array.from(music[1])], { room: 0.82, damp: 0.5, wet: 1 });
for (let c = 0; c < 2; c++) for (let i = 0; i < music[c].length; i++) music[c][i] = music[c][i] * 0.8 + wet[c][i] * 0.25;
// fade the tail to silence at the end
const fe = Math.round(2.5 * SR), N = Math.round(TL.total * SR); for (let c = 0; c < 2; c++) for (let i = 0; i < music[c].length; i++) { if (i >= N) music[c][i] = 0; else if (i > N - fe) music[c][i] *= (N - i) / fe; }
fs.mkdirSync(join(OUT, piece), { recursive: true });
writeWav(join(OUT, piece, 'music.wav'), music, fs);
fs.writeFileSync(join(OUT, piece, 'music-source.txt'), 'synth pad (audio/music-v4.mjs)\n');
console.log(`[music ${piece}] ${secs.length} sections, ${TL.total.toFixed(1)} s`);
