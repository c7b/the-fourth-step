#!/usr/bin/env node
/**
 * Master + mux: the mix goes onto the video at -14 LUFS integrated,
 * true peak <= -1.5 dBTP, measured on the file that ships (after AAC), linear gain only.
 *   node audio/mux.mjs --video v.mp4 --audio mix.wav --out final.mp4 [--abr 320k]
 * 1. loudnorm pass 1 measures; 2. pass 2 with linear=true (LRA target >= measured, so it stays linear);
 * 3. the encoded file is measured again (ebur128); off by > 0.3 LU or TP > -1.5 → corrected, max 3 tries.
 * If the mix is too quiet for linear gain under the TP ceiling, a gain + look-ahead limiter goes first.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, renameSync, existsSync } from "node:fs";
const a = process.argv.slice(2), opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const video = opt("--video"), audio = opt("--audio"), out = opt("--out"), abr = opt("--abr", "320k");
const I = -14, TP = -1.5;
const ff = (args) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 1 << 27 }); if (r.status !== 0) throw new Error(r.stderr.slice(-2500)); return r.stderr; };
const last = (log, re) => [...log.matchAll(re)].at(-1)?.[1];
const measure = (f) => { const log = ff(["-nostats", "-i", f, "-vn", "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]); return { lufs: +last(log, /I:\s+(-?[\d.]+) LUFS/g), lra: +last(log, /LRA:\s+(-?[\d.]+) LU/g), truePeak: +last(log, /Peak:\s+(-?[\d.]+) dBFS/g) }; };
const lnJson = (log) => { const i = log.lastIndexOf("{"); return JSON.parse(log.slice(i, log.indexOf("}", i) + 1)); };
const scan = (f, t, tp) => lnJson(ff(["-nostats", "-i", f, "-af", `loudnorm=I=${t}:TP=${tp}:LRA=11:print_format=json`, "-f", "null", "-"]));
const lin = (db) => Math.pow(10, db / 20).toFixed(6);
let src = audio;
const pre = scan(audio, I, TP);
const needed = I - +pre.input_i;
const report = { video, audio, raw: { I: +pre.input_i, TP: +pre.input_tp, LRA: +pre.input_lra }, tries: [] };
// a mix already near target: one static gain (pure linear), checked after AAC
if (Math.abs(needed) <= 3) {
  ff(["-y", "-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", `volume=${needed.toFixed(2)}dB,alimiter=limit=${lin(TP - 1.3)}:attack=2:release=60:level=0:latency=1`, "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", abr, "-movflags", "+faststart", out]);
  const got = measure(out);
  report.tries.push({ gainDb: +needed.toFixed(2), mode: "static gain + peak limiter", out: got });
  if (Math.abs(got.lufs - I) <= 0.3 && got.truePeak <= TP) {
    report.final = report.tries.at(-1);
    writeFileSync(out.replace(/\.mp4$/, ".master.json"), JSON.stringify(report, null, 1) + "\n");
    console.log(`${out}: ${got.lufs} LUFS, true peak ${got.truePeak} dBTP, LRA ${got.lra} (static gain ${needed.toFixed(2)} dB + peak limiter at ${TP - 1.3} dBFS)`);
    process.exit(0);
  }
}
if (+pre.input_tp + needed > TP - 0.3) {
  src = out.replace(/\.mp4$/, ".prelimit.wav");
  ff(["-y", "-i", audio, "-af", `volume=${needed.toFixed(2)}dB,alimiter=limit=${lin(TP - 0.7)}:attack=3:release=80:level=0:latency=1`, "-ar", "48000", "-c:a", "pcm_f32le", src]);
  report.prelimit = { gainDb: +needed.toFixed(2), ceiling: TP - 0.7 };
}
let target = I, tp = TP;
for (let k = 0; k < 3; k++) {
  const m = scan(src, target, tp);
  const lra = Math.max(11, Math.ceil(+m.input_lra + 1));
  const af = `loudnorm=I=${target}:TP=${tp}:LRA=${lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
  const log = ff(["-y", "-i", video, "-i", src, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", af, "-ar", "48000", "-ac", "2", "-c:a", "aac", "-b:a", abr, "-movflags", "+faststart", out]);
  const applied = lnJson(log), got = measure(out);
  report.tries.push({ target, tp, lra, mode: applied.normalization_type, out: got });
  const missI = got.lufs - I, overTP = got.truePeak - TP;
  if (Math.abs(missI) <= 0.3 && overTP <= 0 && applied.normalization_type === "linear") break;
  target = +(target - missI).toFixed(2);
  if (overTP > 0) tp = +(tp - overTP - 0.2).toFixed(2);
}
if (src !== audio) renameSync(src, src + ".done");
report.final = report.tries.at(-1);
writeFileSync(out.replace(/\.mp4$/, ".master.json"), JSON.stringify(report, null, 1) + "\n");
const f = report.final.out;
console.log(`${out}: ${f.lufs} LUFS, true peak ${f.truePeak} dBTP, LRA ${f.lra} (${report.final.mode}, ${report.tries.length} pass${report.tries.length > 1 ? "es" : ""})`);
