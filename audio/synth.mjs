// Small deterministic DSP kit for the procedural score (pure Node, no installs, no samples).
// Everything is rendered offline into Float32 stereo buffers at 48 kHz.
export const SR = 48000;
export const TAU = Math.PI * 2;

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const dbToLin = (db) => Math.pow(10, db / 20);
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function stereo(seconds) { const n = Math.ceil(seconds * SR); return [new Float32Array(n), new Float32Array(n)]; }
const panGains = (pan) => [Math.cos((pan + 1) * Math.PI / 4), Math.sin((pan + 1) * Math.PI / 4)];

// RBJ biquad, applied in place to a Float32Array (or a slice range)
export function biquad(x, type, f, q = 0.707, gainDb = 0, from = 0, to = x.length) {
  const w = TAU * f / SR, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
  else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = from; i < to; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; x[i] = v; }
  return x;
}

// envelope: attack, hold to dur, release; shapes are raised-cosine
export function env(i, n, a, r) {
  const t = i, A = Math.max(1, a), R = Math.max(1, r);
  if (t < A) return 0.5 - 0.5 * Math.cos(Math.PI * t / A);
  if (t > n - R) return Math.max(0, 0.5 - 0.5 * Math.cos(Math.PI * (n - t) / R));
  return 1;
}

// one oscillator voice into a stereo buffer
export function tone(buf, t0, dur, { f, f1 = null, type = 'sine', amp = 0.1, a = 0.01, r = 0.1, pan = 0, vib = 0, vibF = 5, ph = 0, curve = null }) {
  const [L, R] = buf, i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  const [gl, gr] = panGains(pan);
  let phase = ph;
  for (let i = 0; i < n; i++) {
    const k = i0 + i; if (k < 0 || k >= L.length) continue;
    const fr = (f1 == null ? f : f * Math.pow(f1 / f, i / n)) * (1 + vib * Math.sin(TAU * vibF * i / SR));
    phase += TAU * fr / SR;
    let s;
    if (type === 'sine') s = Math.sin(phase);
    else if (type === 'tri') { const p = (phase / TAU) % 1; s = 4 * Math.abs(p - 0.5) - 1; }
    else { const p = (phase / TAU) % 1; s = 2 * p - 1; }           // saw (naive; always filtered after)
    const e = env(i, n, a * SR, r * SR) * (curve ? curve(i / n) : 1) * amp;
    L[k] += s * e * gl; R[k] += s * e * gr;
  }
}

// FM bell (Chowning): carrier c, modulator ratio, index decays with the amplitude
export function bell(buf, t0, { f, ratio = 1.4, index = 3, decay = 2.5, amp = 0.08, pan = 0 }) {
  const [L, R] = buf, i0 = Math.round(t0 * SR), n = Math.round(decay * 2.2 * SR);
  const [gl, gr] = panGains(pan);
  for (let i = 0; i < n; i++) {
    const k = i0 + i; if (k < 0 || k >= L.length) continue;
    const tt = i / SR, e = Math.exp(-tt / (decay * 0.45)) * Math.min(1, i / (0.004 * SR));
    const s = Math.sin(TAU * f * tt + index * e * Math.sin(TAU * f * ratio * tt));
    L[k] += s * e * amp * gl; R[k] += s * e * amp * gr;
  }
}

// filtered noise burst (ticks, whooshes, swishes); bp sweep from f0 to f1
export function noise(buf, t0, dur, { f0 = 3000, f1 = null, q = 1.2, amp = 0.05, a = 0.001, r = 0.004, pan = 0, seed = 1, type = 'bp', panTo = null }) {
  const n = Math.round(dur * SR), i0 = Math.round(t0 * SR);
  if (n <= 0) return;
  const R0 = rng(seed), x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = R0() * 2 - 1;
  if (f1 == null) biquad(x, type, f0, q);
  else {                                                           // sweep in 32-sample blocks
    const B = 256;
    let st = null;
    for (let b = 0; b < n; b += B) {
      const fr = f0 * Math.pow(f1 / f0, b / n);
      // a fresh biquad per block keeps it simple; state carried by overlapping a few samples is not needed for noise
      biquad(x, type, fr, q, 0, b, Math.min(n, b + B));
    }
  }
  const [L, R] = buf;
  for (let i = 0; i < n; i++) {
    const k = i0 + i; if (k < 0 || k >= L.length) continue;
    const p = panTo == null ? pan : pan + (panTo - pan) * (i / n);
    const [gl, gr] = panGains(p);
    const e = env(i, n, a * SR, r * SR) * amp;
    L[k] += x[i] * e * gl; R[k] += x[i] * e * gr;
  }
}

// Freeverb-style reverb (8 combs + 4 allpasses per channel), returns a wet stereo buffer
export function reverb([L, R], { room = 0.86, damp = 0.35, wet = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(d => Math.round(d * SR / 44100));
  const aps = [556, 441, 341, 225].map(d => Math.round(d * SR / 44100));
  const out = [new Float32Array(L.length), new Float32Array(L.length)];
  [L, R].forEach((x, ch) => {
    const spread = ch ? Math.round(23 * SR / 44100) : 0;
    const y = out[ch];
    for (const d0 of combs) {
      const d = d0 + spread, line = new Float32Array(d); let idx = 0, lp = 0;
      for (let i = 0; i < x.length; i++) {
        const o = line[idx]; lp = o * (1 - damp) + lp * damp;
        line[idx] = x[i] * 0.015 + lp * room; idx = (idx + 1) % d; y[i] += o;
      }
    }
    for (const d0 of aps) {
      const d = d0 + spread, line = new Float32Array(d); let idx = 0;
      for (let i = 0; i < y.length; i++) { const b = line[idx], v = y[i]; y[i] = -v + b; line[idx] = v + b * 0.5; idx = (idx + 1) % d; }
    }
    for (let i = 0; i < y.length; i++) y[i] *= wet;
  });
  return out;
}

export function mixInto(dst, src, g = 1) { for (let c = 0; c < 2; c++) { const d = dst[c], s = src[c]; for (let i = 0; i < Math.min(d.length, s.length); i++) d[i] += s[i] * g; } }

export function writeWav(path, chans, fs, sr = SR) {
  const n = chans[0].length, nc = chans.length, data = Buffer.alloc(n * nc * 4);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) data.writeFloatLE(chans[c][i], (i * nc + c) * 4);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(3, 20); h.writeUInt16LE(nc, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * nc * 4, 28); h.writeUInt16LE(nc * 4, 32); h.writeUInt16LE(32, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path, Buffer.concat([h, data]));
}
export function readWav(fs, path) {
  const b = fs.readFileSync(path);
  let p = 12, fmt = null, data = null;
  while (p < b.length - 8) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(p + 8), ch: b.readUInt16LE(p + 10), rate: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === 'data') data = b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size % 2);
  }
  const bps = fmt.bits / 8, n = Math.floor(data.length / (fmt.ch * bps));
  const out = Array.from({ length: fmt.ch }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) for (let c = 0; c < fmt.ch; c++) {
    const o = (i * fmt.ch + c) * bps;
    out[c][i] = fmt.format === 3 ? data.readFloatLE(o) : fmt.bits === 16 ? data.readInt16LE(o) / 32768 : data.readInt32LE(o) / 2147483648;
  }
  return { ch: out, rate: fmt.rate };
}
