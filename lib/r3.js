'use strict';
// R3: frame-indexed Blender image sequences inside a deterministic renderAt(t).
// Manifests come from renders-index.js (window.R3MAN = { id: manifest }), written by tools/renders-index.mjs from the
// Blender scripts' renders/<id>/<id>.json files. Frames are loaded on demand: the stage runs the frame once on a 1x1
// canvas in "collect" mode (every R3 call records the frames it needs and returns null), loads them, then draws for real.
// Shot ids are the contract with the Blender agent (research/direction-v4/SHOTLIST-3D.md). Missing shot -> null -> 2D fallback.
const R3 = (() => {
  const BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/lib\/r3\.js.*$/, '') : '../';
  // ?no3d=1: ignore the manifest, so every shot draws its 2D stand-in (render.mjs sets it when renders/ is empty)
  const MAN = new URLSearchParams(location.search).has('no3d') ? {} : (window.R3MAN || {}), cache = new Map(), FPS = 30;
  let collecting = null, tick = 0;
  const has = id => !!MAN[id];
  const pad = n => String(n).padStart(4, '0');
  const dir = id => MAN[id].dir || `renders/${id}`;
  function frame(id, idx) {
    if (!has(id)) return null;
    const m = MAN[id], i = Math.max(1, Math.min(m.frames, Math.round(idx))), key = `${dir(id)}/${pad(i)}.png`;
    const pk = n => m.passes && m.passes[n] ? `${dir(id)}/${m.passes[n].replace('####', pad(i))}` : null;   // optional glare / shadow passes
    if (collecting) { collecting.set(key, m.k || 1); for (const n of ['glare', 'shadow', 'refl']) { const k2 = pk(n); if (k2) collecting.set(k2, m.k || 1); } return null; }
    const e = cache.get(key); if (e) { e.used = tick; for (const n of ['glare', 'shadow', 'refl']) { const k2 = pk(n), e2 = k2 && cache.get(k2); e.img['__' + n] = e2 ? e2.img : null; if (e2) e2.used = tick; } return e.img; }
    return null;
  }
  // an action clip with 1 s handles: the action starts at frame 1 + handle*fps; tAction = the time the action should start
  const clip = (id, t, tAction, handle = 1) => frame(id, 1 + handle * FPS + Math.floor((t - tAction) * FPS));
  // a seamless loop, starting at t0
  const loop = (id, t, t0 = 0) => has(id) ? frame(id, 1 + (((Math.floor((t - t0) * FPS)) % MAN[id].frames) + MAN[id].frames) % MAN[id].frames) : null;
  // a long move mapped onto [t0, t1] (clamped at the ends)
  const span = (id, t, t0, t1, handle = 0) => has(id) ? frame(id, 1 + handle * FPS + (MAN[id].frames - 1 - 2 * handle * FPS) * Math.max(0, Math.min(1, (t - t0) / (t1 - t0)))) : null;
  // a clip retimed through keys [[t, frame], ...] (piecewise linear, clamped): events land on the voice's words
  function warp(id, t, keys) { if (!has(id)) return null; const k = keys.filter(x => x[1] != null).sort((a, b) => a[0] - b[0]); if (!k.length) return frame(id, 1);
    if (t <= k[0][0]) return frame(id, k[0][1]); for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return frame(id, k[i][1] + (k[i + 1][1] - k[i][1]) * (t - k[i][0]) / Math.max(1e-6, k[i + 1][0] - k[i][0]));
    return frame(id, k.at(-1)[1] + (t - k.at(-1)[0]) * FPS); }
  const evf = (id, name, fallback) => has(id) && MAN[id].events && MAN[id].events[name] != null ? MAN[id].events[name] : fallback;
  // an event frame (from the manifest) as an action-relative time in seconds, e.g. ev('L01_cube_jump', 'land') -> seconds after frame 1
  const ev = (id, name, fallback) => has(id) && MAN[id].events && MAN[id].events[name] != null ? (MAN[id].events[name] - 1) / FPS : fallback;
  // anchor position at a frame index (linear between listed frames); returns [x, y] in the render's px space
  function anchor(id, name, idx) { const a = has(id) && MAN[id].anchors && MAN[id].anchors[name]; if (!a || !a.length) return null;
    const K = MAN[id].k || 1, sc = p => [p[0] * K, p[1] * K];
    for (let k = 0; k < a.length - 1; k++) if (idx >= a[k][0] && idx <= a[k + 1][0]) { const u = (idx - a[k][0]) / Math.max(1, a[k + 1][0] - a[k][0]); return sc([a[k][1] + (a[k + 1][1] - a[k][1]) * u, a[k][2] + (a[k + 1][2] - a[k][2]) * u]); }
    return idx < a[0][0] ? sc([a[0][1], a[0][2]]) : sc([a.at(-1)[1], a.at(-1)[2]]); }
  function begin() { collecting = new Map(); }
  async function end() {
    const need = collecting; collecting = null; tick++;
    await Promise.all([...need.keys()].filter(k => !cache.has(k)).map(k => { const img = new Image(); img.__k = need.get(k); img.src = BASE + k; return img.decode().then(() => cache.set(k, { img, used: tick })).catch(() => console.error('R3 frame missing: ' + k)); }));
    for (const k of need.keys()) { const e = cache.get(k); if (e) e.used = tick; }
    if (cache.size > 48) for (const [k, e] of cache) if (e.used < tick - 1) cache.delete(k);
  }
  // draw a full-frame render (opaque or alpha) scaled to the stage
  // the beauty with its passes: the coloured shadow multiplies the field first, the glow screens on top
  function blit(ctx, img, x, y, w, h) {
    if (img.__shadow) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(img.__shadow, x, y, w, h); ctx.restore(); }
    if (img.__refl) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(img.__refl, x, y, w, h); ctx.restore(); }
    ctx.drawImage(img, x, y, w, h);
    if (img.__glare) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(img.__glare, x, y, w, h); ctx.restore(); }
  }
  function full(ctx, img, { alpha = 1 } = {}) { if (!img) return false; ctx.save(); ctx.globalAlpha *= alpha; blit(ctx, img, 0, 0, V3.W, V3.H); ctx.restore(); return true; }
  // draw an alpha sprite render positioned so that render px (sx, sy) lands at stage (x, y), scaled by s
  function at(ctx, img, x, y, s = 1, { sx = 960, sy = 540, alpha = 1 } = {}) { if (!img) return false; ctx.save(); ctx.globalAlpha *= alpha; const k = img.__k || 1; blit(ctx, img, x - sx * s, y - sy * s, img.naturalWidth * k * s, img.naturalHeight * k * s); ctx.restore(); return true; }
  return { has, frame, clip, loop, span, warp, evf, ev, anchor, begin, end, full, at, MAN, FPS };
})();
