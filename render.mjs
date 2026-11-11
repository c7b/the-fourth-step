#!/usr/bin/env node
/**
 * Render a page frame by frame in headless Chrome (puppeteer-core) and encode it with ffmpeg.
 * Blender frames load on demand, so renderAt(t) is awaited.
 *
 *   node render.mjs --page film.html --out out/the-fourth-step.mp4 [--w 1920] [--fps 30] [--workers 3]
 *        [--from <s>] [--to <s>] [--qs "a=b"] [--crf 16]
 *   node render.mjs --page s1.html --vertical --out out/short-1.mp4
 *   node render.mjs --page film.html --stills 12.5,40,61.2 --dir out/stills [--w 1920]
 *
 * Video: the frame range is cut into chunks (CHUNK frames); each worker renders a chunk to JPEG
 * frames piped straight into ffmpeg (libx264 High, CRF 16, yuv420p, BT.709); finished chunks are
 * kept, so a crashed render resumes where it stopped. Then the chunks are concatenated (no re-encode).
 * Frames are pure functions of t: frame i is rendered at t = i / fps.
 * The output is picture only; the sound is mixed in audio/ and muxed with audio/mux.mjs.
 * If renders/ holds no Blender frames, the page draws its 2D stand-ins (?no3d=1); --3d forces the 3D path.
 */
import { spawn } from "child_process";
import { pathToFileURL } from "url";
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from "fs";
import path from "path";
import { puppeteer as findPuppeteer, chrome } from "./tools/browser.mjs";

const puppeteer = findPuppeteer();
const CHROME = chrome();

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const here = path.dirname(new URL(import.meta.url).pathname);
const page = path.resolve(here, opt("--page", "film.html"));
const vertical = args.includes("--vertical");
const outW = +opt("--w", vertical ? 1080 : 1920);
const outH = vertical ? Math.round((outW * 1920) / 1080) : Math.round((outW * 1080) / 1920);
const fps = +opt("--fps", 30);
const workers = Math.min(3, +opt("--workers", 3));
// no Blender frames in renders/ -> the 2D stand-ins (see README: blender/render-all.sh)
const has3d = args.includes("--3d") || (() => { const R = path.join(here, "renders");
  try { return readdirSync(R).some((d) => existsSync(path.join(R, d, "0001.png"))); } catch { return false; } })();
const qs = [opt("--qs", ""), has3d ? "" : "no3d=1"].filter(Boolean).join("&");
if (!has3d) console.log("renders/ has no Blender frames: drawing the 2D stand-ins (no3d=1)");
const CHUNK = +opt("--chunk", 150);
const quality = +opt("--q", 92);
const crf = opt("--crf", "16");

async function openPage(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: outW, height: outH, deviceScaleFactor: 1 });
  p.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
  p.on("console", (m) => { if (m.type() === "error") console.error("console:", m.text()); });
  await p.goto(`${pathToFileURL(page).href}?w=${outW}${qs ? "&" + qs : ""}`);
  await p.waitForFunction(() => document.title.startsWith("ready"), { timeout: 120000 });
  return p;
}
const launch = () => puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ["--allow-file-access-from-files", "--hide-scrollbars", "--force-device-scale-factor=1", "--disable-gpu", "--mute-audio"] });
async function grab(p, t) {
  const b64 = await p.evaluate(async (tt, q) => { await window.renderAt(tt); return document.getElementById("c").toDataURL("image/jpeg", q).slice(23); }, t, quality / 100);
  return Buffer.from(b64, "base64");
}

const stills = opt("--stills", null);
if (stills) {
  const outDir = path.resolve(opt("--dir", path.join(here, "out", "stills")));
  mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const p = await openPage(browser);
  for (const s of stills.split(",")) {
    const t = +s;
    const t0 = Date.now();
    const png = await p.evaluate(async (tt) => { await window.renderAt(tt); return document.getElementById("c").toDataURL("image/png").slice(22); }, t);
    const f = path.join(outDir, `${opt("--prefix", "s")}-${t.toFixed(2).padStart(7, "0")}.png`);
    writeFileSync(f, Buffer.from(png, "base64"));
    console.log(`${f}  ${Date.now() - t0}ms`);
  }
  await browser.close();
  process.exit(0);
}

const out = path.resolve(opt("--out", path.join(here, "out", path.basename(page).replace(/\.html$/, ".mp4"))));
const chunkDir = out.replace(/\.mp4$/, ".chunks");
mkdirSync(chunkDir, { recursive: true });
// total frames: from the page (window.total) unless --to given
const browser0 = await launch();
const p0 = await openPage(browser0);
const total = await p0.evaluate(() => window.total);
await browser0.close();
const from = Math.round(+opt("--from", 0) * fps), to = Math.min(Math.round(+opt("--to", total) * fps), Math.round(total * fps));
const chunks = [];
for (let a = from; a < to; a += CHUNK) chunks.push([a, Math.min(to, a + CHUNK)]);
const name = ([a, b]) => path.join(chunkDir, `c${String(a).padStart(6, "0")}-${String(b).padStart(6, "0")}.mp4`);
const todo = chunks.filter((c) => !existsSync(name(c)));
console.log(`${path.basename(page)} ${outW}x${outH} @${fps}fps · frames ${from}-${to} · ${chunks.length} chunks (${todo.length} to render) · ${workers} workers`);

const started = Date.now();
let done = 0;
async function worker(id) {
  const browser = await launch();
  let p = await openPage(browser);
  while (todo.length) {
    const c = todo.shift();
    const tmp = name(c).replace(/\.mp4$/, ".part.mp4");
    const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-preset", "medium", "-crf", crf, "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv", "-g", String(fps * 2), tmp], { stdio: ["pipe", "inherit", "inherit"] });
    for (let i = c[0]; i < c[1]; i++) {
      const jpg = await grab(p, i / fps);
      if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    ff.stdin.end();
    const code = await new Promise((r) => ff.on("close", r));
    if (code !== 0) throw new Error(`ffmpeg failed on chunk ${c}`);
    renameSync(tmp, name(c));
    done += c[1] - c[0];
    const el = (Date.now() - started) / 1000;
    const remaining = todo.reduce((n, x) => n + x[1] - x[0], 0);
    console.log(`[w${id}] chunk ${c[0]}-${c[1]} · ${(done / el).toFixed(2)} fps · ~${Math.round(remaining / (done / el) / 60)} min left`);
  }
  await browser.close();
}
await Promise.all(Array.from({ length: Math.min(workers, todo.length || 1) }, (_, i) => worker(i + 1)));
// concat (no re-encode)
const list = path.join(chunkDir, "list.txt");
writeFileSync(list, chunks.map((c) => `file '${name(c)}'`).join("\n") + "\n");
await new Promise((res, rej) => {
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out], { stdio: "inherit" });
  ff.on("close", (c) => (c === 0 ? res() : rej(new Error("concat failed"))));
});
console.log(`→ ${out} (${((Date.now() - started) / 60000).toFixed(1)} min)`);
