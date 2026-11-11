'use strict';
// v3 core: timeline lookups (work/v3/timeline-*.js → window.TL), shot sequencing, and the shot-to-shot transformations.
// There is no cross-dissolve path at all: a transition is geometry (a growing/shrinking shape, a push through an object,
// a vertical camera push, a sweeping band). Each frame is a pure function of t.
const Q = new URLSearchParams(location.search);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
const beat = id => { const b = TL.beats.find(x => x.id === id); if (!b) throw new Error('no beat ' + id); return b; };
// absolute time of a spoken word: wt('B07', "isn't.", { n: 1, edge: 'start', off: 0 })
function wt(id, word, o = {}) {
  const { n = 1, edge = 'start', off = 0 } = o, b = beat(id), target = norm(word);
  let seen = 0;
  for (const w of b.words || []) if (norm(w.text) === target && ++seen === n) return (edge === 'end' ? w.end : w.start) + off;
  throw new Error(`word "${word}" #${n} not in ${id}`);
}
// cue list for a phrase spoken in a beat: the start time of each word, in order (for V3.words({ cues }))
function phrase(id, words, after = -Infinity) {
  const b = beat(id), out = []; let i = 0; while (i < b.words.length && b.words[i].start < after) i++;
  for (const w of words.split(' ')) { const tgt = norm(w); while (i < b.words.length && norm(b.words[i].text) !== tgt) i++;
    if (i >= b.words.length) throw new Error(`phrase word "${w}" not found in ${id}`); out.push(b.words[i].start); i++; }
  return out;
}
const bs = id => beat(id).start, be = id => beat(id).end;

// ---- sequencing ----------------------------------------------------------------------------------
// SHOTS: [{ id, a, b, draw(ctx, t) }]  TRANS: [{ t0, t1, from: shotId, to: shotId, kind, ...params }]
let SHOTS = [], TRANS = [];
const shot = id => SHOTS.find(s => s.id === id);
function drawShot(ctx, s, t) { ctx.save(); s.draw(ctx, t); ctx.restore(); }
function frame(ctx, t) {
  const tr = TRANS.find(x => t >= x.t0 && t < x.t1);
  if (tr) { const k = V3.clamp((t - tr.t0) / (tr.t1 - tr.t0)); TX[tr.kind](ctx, t, k, shot(tr.from), shot(tr.to), tr); }
  else { const s = SHOTS.find(x => t >= x.a && t < x.b) || SHOTS[SHOTS.length - 1]; drawShot(ctx, s, t); }
  V3.grain(ctx, t, 0.045);
}
// interpolate rects [x, y, w, h, r]
const lerpRect = (A, B, e) => A.map((v, i) => V3.lerp(v, B[i] ?? 0, e));
const resolve = (r, t) => (typeof r === 'function' ? r(t) : r);
// the transformations (DIRECTION.md §7)
const TX = {
  // the next shot floods out of an object in this shot: a shape grows from `from` (rect or circle) to the frame, filled with
  // the next shot's field colour; the next shot eases in inside it (0.93 → 1). Optional hairline on the growing edge.
  flood(ctx, t, k, A, B, o) {
    drawShot(ctx, A, t);
    const e = V3.expoInOut(k), f = resolve(o.rect, t), full = [-60, -60, V3.W + 120, V3.H + 120, 0], r = lerpRect(f, full, e);
    ctx.save(); ctx.beginPath();
    if (o.circle) { const cx = f[0] + f[2] / 2, cy = f[1] + f[3] / 2, R0 = Math.max(f[2], f[3]) / 2, R1 = Math.hypot(Math.max(cx, V3.W - cx), Math.max(cy, V3.H - cy)) + 20;
      ctx.arc(cx, cy, V3.lerp(R0, R1, e), 0, Math.PI * 2); }
    else ctx.roundRect(r[0], r[1], r[2], r[3], Math.max(0, r[4]));
    ctx.clip(); V3.fill(ctx, o.color);
    if (o.grow) V3.camera(ctx, { zoom: V3.lerp(0.12, 1, e) }, () => drawShot(ctx, B, t));   // the next shot grows out of the centre with the circle (v5)
    else if (k > 0.1) V3.camera(ctx, { zoom: V3.lerp(0.93, 1, V3.quartOut(V3.prog(k, 0.1, 1))) }, () => drawShot(ctx, B, t));
    ctx.restore();
    if (o.edge) { ctx.save(); ctx.strokeStyle = o.edge; ctx.lineWidth = 2; ctx.globalAlpha = 1 - e; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], Math.max(0, r[4])); ctx.stroke(); ctx.restore(); }
  },
  // the reverse: this shot shrinks into an object of the next shot (the next shot is drawn whole underneath)
  contract(ctx, t, k, A, B, o) {
    drawShot(ctx, B, t);
    const e = V3.expoInOut(k), to = resolve(o.rect, t), full = [-60, -60, V3.W + 120, V3.H + 120, 0], r = lerpRect(full, to, e);
    if (k >= 1) return;
    ctx.save(); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], Math.max(0, r[4])); ctx.clip();
    if (o.solid) V3.fill(ctx, o.solid); else drawShot(ctx, A, t);
    if (o.solid && k < 0.35) { ctx.save(); ctx.globalAlpha = 1; drawShot(ctx, A, t); ctx.restore(); }
    ctx.restore();
  },
  // a vertical camera push: this shot leaves upward as the next one rises from below (one direction, one curve)
  rise(ctx, t, k, A, B, o) {
    const e = V3.expoInOut(k), H = V3.H;
    ctx.save(); ctx.translate(0, -e * H); drawShot(ctx, A, t); ctx.restore();
    ctx.save(); ctx.translate(0, (1 - e) * H); drawShot(ctx, B, t); ctx.restore();
  },
  // a band of the brand's Glitch Gradient sweeps left to right: behind its trailing edge is the next shot
  sweep(ctx, t, k, A, B, o) {
    const e = V3.cubicInOut(k), W = V3.W, H = V3.H, bw = o.band || 420, x = V3.lerp(-bw, W + 40, e);
    drawShot(ctx, A, t);
    ctx.save(); ctx.beginPath(); ctx.rect(-10, -10, x + 10, H + 20); ctx.clip(); drawShot(ctx, B, t); ctx.restore();
    const g = ctx.createLinearGradient(x, 0, x + bw, 0); V3.C.glitch.forEach(([s, c]) => g.addColorStop(s, c));
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(x, -10, bw, H + 20); ctx.restore();
  },
  // camera pushes straight into a screen rect until it is the frame; the next shot starts on that colour (handled by the shots)
  through(ctx, t, k, A, B, o) { if (k < (o.cut ?? 0.999)) drawShot(ctx, A, t); else drawShot(ctx, B, t); },
};

// ---- stage ---------------------------------------------------------------------------------------
async function run({ w = 1920, h = 1080, prep, shots, trans }) {
  V3.minMono(30);   // every mono label >= 30 logical px: 30 at 1080p, 20 at 720p (phone legibility)
  V3.stage({ w, h, total: TL.total, prep: async () => { if (prep) await prep(); SHOTS = shots(); TRANS = trans(); window.EVENTS = (window.EVENTS_FN ? window.EVENTS_FN() : []); },
    draw: (ctx, t) => frame(ctx, t) });
}
