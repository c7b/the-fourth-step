#!/usr/bin/env node
/**
 * The swappable music stem. The mix reads out/audio/<piece>/music.wav; this fills that slot from any audio file you pick
 * (music-v4.mjs fills it with the synth pad instead). The track is decoded to 48 kHz stereo, looped with a 3 s crossfade if it
 * is shorter than the piece, trimmed, faded in (1.5 s) and out (3 s) to the piece's end. Level and ducking are the mix's job
 * (mix-v4.mjs keeps it 26 LU under every line and ducks it under the voice).
 *   node audio/music-track.mjs --piece long --track audio/tracks/pulso-suave.m4a [--start 12.5] [--fadein 1.5] [--fadeout 3]
 *   node audio/music-v4.mjs --piece long        # back to the synth pad
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { SR, writeWav } from './synth.mjs';
import { loadTL, OUT } from './tl4.mjs';

const a = process.argv.slice(2), opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const piece = opt('--piece', 'long'), track = opt('--track'), start = +opt('--start', 0), fin = +opt('--fadein', 1.5), fout = +opt('--fadeout', 3);
if (!track || !fs.existsSync(track)) { console.error('need --track <existing audio file>'); process.exit(1); }
const TL = loadTL(piece), N = Math.round(TL.total * SR);
// behind the voice (v6): high-pass 60 Hz, a broad cut in the 1–4 kHz presence band, a gentle low-pass at 7 kHz. No metadata is carried.
const EQ = a.includes('--flat') ? 'anull' : 'highpass=f=60:p=2,equalizer=f=2000:t=o:w=1.6:g=-5,lowpass=f=7000:p=1';
const raw = spawnSync('ffmpeg', ['-nostdin', '-v', 'error', '-ss', String(start), '-i', track, '-map_metadata', '-1', '-af', EQ, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 }).stdout;
const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4), M = x.length / 2;
if (!M) { console.error('could not decode ' + track); process.exit(1); }
const out = [new Float32Array(N + SR), new Float32Array(N + SR)], XF = Math.round(3 * SR);
let pos = 0;
while (pos < N) {   // lay copies end to end, each crossfading 3 s into the next (a loop only if the song is shorter than the piece)
  for (let i = 0; i < M && pos + i < out[0].length; i++) { const kIn = pos === 0 ? 1 : Math.min(1, i / XF), kOut = M - i < XF && pos + M < N ? (M - i) / XF : 1, g = kIn * kOut;
    out[0][pos + i] += x[2 * i] * g; out[1][pos + i] += x[2 * i + 1] * g; }
  pos += Math.max(SR, M - XF);
}
const FI = Math.round(fin * SR), FO = Math.round(fout * SR);
for (let c = 0; c < 2; c++) for (let i = 0; i < out[c].length; i++) { let g = 1; if (i < FI) g *= i / FI; if (i > N - FO) g *= Math.max(0, (N - i) / FO); out[c][i] *= g; }
fs.mkdirSync(join(OUT, piece), { recursive: true });
writeWav(join(OUT, piece, 'music.wav'), out, fs);
fs.writeFileSync(join(OUT, piece, 'music-source.txt'), `track: ${track.split('/').pop()}\nstart: ${start}\neq: ${EQ}\n`);
console.log(`[music ${piece}] stem from ${track.split('/').pop()} (${(M / SR).toFixed(1)} s source, ${TL.total.toFixed(1)} s piece)`);
