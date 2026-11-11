'use strict';
// The three Shorts (1080x1920). The spoken words are the giant type: burned-in captions, chunked by phrase, each word sliding
// up on its own spoken time. Objects live in the lower band. Safe zones kept clear of text: top 220, bottom 420, and the right
// 150 px below mid-height. Every change is a light change or a shape/camera transform (no dissolves).
const { C } = V3;
const SAFE = { top: 220, bottom: 1500, right: 930, x: 80 };
const OBJ_Y = 1190;                                            // centre of the object band
// ---------------------------------------------------------------- captions
function chunks(maxChars = 13, maxLines = 3) {
  const words = TL.beats.flatMap(b => (b.words || []).map(w => ({ ...w, beat: b.id }))), out = [];
  let cur = null;
  const lines = ws => { const L = [[]]; let n = 0; for (const w of ws) { const len = w.text.length; if (n && n + 1 + len > maxChars) { L.push([]); n = 0; } L[L.length - 1].push(w); n += (n ? 1 : 0) + len; } return L; };
  for (const w of words) {
    if (!cur) cur = { words: [] };
    cur.words.push(w);
    const end = /[.?!:]$/.test(w.text) || (/[,;]$/.test(w.text) && cur.words.length >= 2), L = lines(cur.words);
    if (end || L.length > maxLines) {
      if (L.length > maxLines) { const last = cur.words.pop(); out.push(cur); cur = { words: [last] }; if (end) { out.push(cur); cur = null; } }
      else { out.push(cur); cur = null; }
    }
  }
  if (cur) out.push(cur);
  out.forEach((c, i) => { c.lines = lines(c.words); c.t0 = c.words[0].start; c.t1 = out[i + 1] ? out[i + 1].words[0].start : TL.total + 1; });
  return out;
}
let CAP = null;
// draw the active caption chunk: left aligned, display caps; colour per time; hi: { WORD: colour }
function captions(ctx, t, { color = C.ink, size = 150, y = 300, hi = {}, style, until = Infinity } = {}) {
  CAP = CAP || chunks();
  for (const c of CAP) {
    if (c.t0 >= until - 0.01) continue;
    if (t < c.t0 - 0.1 || t > c.t1 + 0.5) continue;
    if (c.t1 > until) c.t1 = until + 0.15;
    const st = style ? style(t, c) : {}, col = st.color || color;
    c.lines.forEach((ln, li) => { const s = ln.map(w => w.text.toUpperCase()).join(' ');
      V3.words(ctx, s, t, { x: SAFE.x, y: y + size * 0.8 + li * size * 0.88, size: st.size || size, align: 'left', color: col, cues: ln.map(w => w.start - 0.04), dur: 0.42, leave: c.t1 - 0.22,
        colors: ln.map(w => hi[w.text.toUpperCase().replace(/[^A-Z’'-]/g, '')] || col) }); });
  }
}
// ---------------------------------------------------------------- shared vertical pieces
function wallCamV(t, k0, k1) { const k = V3.approach(t - k0, 1.6); const c = V3.orbit([0, -6, 0], 1180 + 520 * k + 10 * Math.max(0, t - k1), (12 + 16 * k) * Math.PI / 180, 0, 2000); c.cx = 540; c.cy = OBJ_Y; return c; }
const RINGV = { N: 16, R: 430, cam: { y: 380, z: 1500, f: 1150, lookY: -40 } };
// the Blender vertical ring: the form clip from tForm (15 blocks rise, the fast spin), then the seamless loop; tForm = null: the loop only
function ringV3(ctx, t, tForm) { const F = 'S01_ring_v_form', L = 'S01_ring_v_loop'; if (!R3.has(L)) return false;
  if (tForm != null && R3.has(F)) { const end = tForm + (R3.MAN[F].frames - 31) / 30; if (t < end) return R3.full(ctx, R3.clip(F, t, tForm)); return R3.full(ctx, R3.loop(L, t, end)); }
  return R3.full(ctx, R3.loop(L, t, 0)); }
function ringV(ctx, t, { appear = 1, cx = 540, cy = OBJ_Y, angle = 0, wake = 1 } = {}) {
  const og = orangeGlass();
  const c = RINGV.cam, pitch = Math.atan2(c.y - c.lookY, c.z), focus = c.z - RINGV.R;
  const P = (x, y, z) => { const dy = y - c.y, dz = z - c.z, yy = dy * Math.cos(pitch) - dz * Math.sin(pitch), zz = dy * Math.sin(pitch) + dz * Math.cos(pitch), d = -zz, k = c.f / d; return { x: cx + x * k, y: cy - yy * k, k, d }; };
  const items = [];
  for (let i = 0; i < RINGV.N; i++) { const ap = i === 0 ? 1 : V3.expoOut(V3.prog(appear, (i - 1) / 15 * 0.7, (i - 1) / 15 * 0.7 + 0.3)); if (ap <= 0) continue;
    const a = angle + i * Math.PI * 2 / RINGV.N; items.push({ i, ap, p: P(Math.sin(a) * RINGV.R, -(1 - ap) * 500, Math.cos(a) * RINGV.R) }); }
  items.sort((A2, B2) => B2.p.d - A2.p.d);
  for (const it of items) { const h = 230 * it.p.k, blur = Math.min(9, Math.abs(it.p.d - focus) * 0.012), dim = V3.clamp(1.15 - (it.p.d - focus) / 1300, 0.35, 1);
    V3.sprite(ctx, og, it.p.x, it.p.y - h * 0.08, h, { blur, alpha: dim * V3.clamp(it.ap * 1.5) * wake }); }
}
function frameSafe(ctx) { if (!Q.has('safe')) return; ctx.save(); ctx.fillStyle = 'rgba(254,44,63,0.2)'; ctx.fillRect(0, 0, 1080, SAFE.top); ctx.fillRect(0, SAFE.bottom, 1080, 420); ctx.fillRect(SAFE.right, 960, 150, 540); ctx.restore(); }

// ---------------------------------------------------------------- S1 · the Blender wall in 9:16 (v5)
// L20 is 16:9. Before "That's Bitcoin" its face-on frame 1 sits in a band that fits the width (our plate fills it, the lines
// readable); on "That's Bitcoin" the camera pull-back plays and the band widens to 1:1 (the centre 1080 px of the wall). Band
// edges are feathered into the cloud field, so it reads as the same white world.
function s1Wall3(ctx, t, id, tc) {
  fieldCloud(ctx, { w: 1080, h: 1920 });
  const f = t < tc ? 1 : Math.min(R3.MAN[id].frames, 1 + 30 + Math.floor((t - tc) * 30)), widen = V3.expoInOut(V3.prog(t, tc, tc + 1.4));
  const k = V3.lerp(1080 / 1920, 1, widen), cy = V3.lerp(OBJ_Y - 40, OBJ_Y - 60, widen), creep = 1 + 0.004 * Math.max(0, t - (tc + 7));
  const S = k * creep, map = ([x, y]) => [540 + (x - 960) * S, cy + (y - 540) * S], bh = 1080 * S, by = cy - bh / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(0, by, 1080, bh); ctx.clip(); R3.at(ctx, R3.frame(id, f), 540, cy, S, { sx: 960, sy: 540 }); ctx.restore();
  const fe = 130; ['top', 'bot'].forEach(e => { const y0 = e === 'top' ? by : by + bh - fe, g = ctx.createLinearGradient(0, y0, 0, y0 + fe);
    g.addColorStop(e === 'top' ? 0 : 1, 'rgba(236,238,255,1)'); g.addColorStop(e === 'top' ? 1 : 0, 'rgba(236,238,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, y0, 1080, fe); });
  // your pharmacy, your rent, your salary: marked on the face-on plate (texture coords → its corners in frame 1)
  if (t < tc + 0.6) { const cn = ['plate_tl', 'plate_tr', 'plate_br', 'plate_bl'].map(n => R3.anchor(id, n, 1) || [960, 540]);
    const T2S = (tx, ty) => { const u = tx / 2488, v = ty / 1606, tp = [V3.lerp(cn[0][0], cn[1][0], u), V3.lerp(cn[0][1], cn[1][1], u)], bt = [V3.lerp(cn[3][0], cn[2][0], u), V3.lerp(cn[3][1], cn[2][1], u)]; return map([V3.lerp(tp[0], bt[0], v), V3.lerp(tp[1], bt[1], v)]); };
    const out = 1 - V3.prog(t, tc, tc + 0.5);
    [['pharmacy.', 1], ['rent.', 2], ['salary.', 4]].forEach(([w, li]) => { const kk = V3.expoOut(V3.prog(t, wt('S1B', w), wt('S1B', w) + 0.35)) * out; if (kk <= 0) return;
      const ly = Statement.TEX.LINE(li), q = [T2S(150, ly - 120), T2S(150 + (Statement.TEX.R - 110) * kk, ly - 120), T2S(150 + (Statement.TEX.R - 110) * kk, ly + 40), T2S(150, ly + 40)];
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); ctx.restore(); youMark(ctx, q[0][0] - 30, q[0][1] + 6, 20); }); }
  // one payment tied to your name unravels the rest: the hops run plate to plate on the wall's own anchors
  const h0 = wt('S1C', 'one'); let prev = map(R3.anchor(id, 'plate_c3_r2', f) || [960, 540]);
  [[4, 2], [4, 1], [5, 1], [5, 2], [2, 3], [2, 1]].forEach(([i, j], n) => { const kk = V3.expoOut(V3.prog(t, h0 + n * 0.35, h0 + n * 0.35 + 0.3)); if (kk <= 0) return;
    const pa = R3.anchor(id, `plate_c${i}_r${j}`, f); if (!pa) return; const p = map(pa);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(V3.lerp(prev[0], p[0], kk), V3.lerp(prev[1], p[1], kk)); ctx.stroke(); ctx.restore(); if (kk > 0.95) youMark(ctx, p[0] - 10, p[1] - 10, 20); prev = p; });
}

// ---------------------------------------------------------------- S1 · The board
function s1(ctx, t) {
  const tc = wt('S1C', "That's"), td = bs('S1E') - 0.2, tm = bs('S1E'), tf = bs('S1F');
  const dark = V3.cubicInOut(V3.prog(t, td, td + 1.0));
  // the white wall and your plate; the camera pulls back on "That's Bitcoin" and keeps turning one way
  const W3 = R3.has('L20_ledger_wall_engraved') ? 'L20_ledger_wall_engraved' : R3.has('L19a_plate_wall') ? 'L19a_plate_wall' : null;
  if (dark < 1 && W3) {   // v5: the Blender wall, shown through a feathered band (the plate fits the width, then the band widens to 1:1 as the camera pulls back)
    s1Wall3(ctx, t, W3, tc);
    V3.label(ctx, 'dr. daniel kim · 36c3 · 2019', SAFE.x, 880, { size: 24, color: C.ink, alpha: V3.prog(t, bs('S1D') + 0.2, bs('S1D') + 0.5) * (1 - V3.prog(t, bs('S1E') - 0.3, bs('S1E'))) });
    dimTo(ctx, dark);
  } else if (dark < 1) {
    const cam = wallCamV(t, tc, tc);
    Statement.draw(ctx, A.ST, cam, { dof: 0.02 });
    const hz = ctx.createLinearGradient(0, 160, 0, 930); hz.addColorStop(0, 'rgba(236,238,255,0.94)'); hz.addColorStop(0.75, 'rgba(236,238,255,0.82)'); hz.addColorStop(1, 'rgba(236,238,255,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, 1080, 930);
    // your pharmacy, your rent, your salary: those lines get marked on the plate
    [['pharmacy.', 1], ['rent.', 2], ['salary.', 4]].forEach(([w, li]) => { const k = V3.expoOut(V3.prog(t, wt('S1B', w), wt('S1B', w) + 0.35)); if (k <= 0) return;
      const ly = Statement.TEX.LINE(li), q = [[150, ly - 120], [150 + (Statement.TEX.R - 110) * k, ly - 120], [150 + (Statement.TEX.R - 110) * k, ly + 40], [150, ly + 40]].map(([x, y]) => V3.proj(cam, ...Statement.texToWorld(A.ST, x, y)));
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); youMark(ctx, q[0].x - 30, q[0].y + 6, 20); });
    // one payment tied to your name unravels the rest
    const h0 = wt('S1C', 'one'); let prev = V3.proj(cam, 0, 0, 3);
    [[4, 2], [4, 1], [5, 1], [2, 3], [2, 1], [1, 2]].forEach(([i, j], n) => { const k = V3.expoOut(V3.prog(t, h0 + n * 0.35, h0 + n * 0.35 + 0.3)); if (k <= 0) return;
      const [X, Y] = Statement.plateCentre(i, j), p = V3.proj(cam, X, Y, 0); if (!p || !prev) return;
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(V3.lerp(prev.x, p.x, k), V3.lerp(prev.y, p.y, k)); ctx.stroke(); ctx.restore(); if (k > 0.95) youMark(ctx, p.x - 10, p.y - 10, 20); prev = p; });
    V3.label(ctx, 'dr. daniel kim · 36c3 · 2019', SAFE.x, 880, { size: 24, color: C.ink, alpha: V3.prog(t, bs('S1D') + 0.2, bs('S1D') + 0.5) * (1 - V3.prog(t, bs('S1E') - 0.3, bs('S1E'))) });
    dimTo(ctx, dark);
  }
  // the lights go out: Monero's glass ring; then Tari's violet template
  if (dark > 0) {
    if (dark >= 1) V3.fill(ctx, C.ink);
    const ap = V3.prog(t, tm + 0.2, tm + 1.6), tari = V3.expoInOut(V3.prog(t, tf - 0.2, tf + 0.8));
    ctx.save(); ctx.globalAlpha = dark; ctx.translate(0, -tari * 1700); if (!ringV3(ctx, t, tm - 0.6)) ringV(ctx, t, { appear: ap, angle: 0.15 * Math.max(0, t - tm) }); ctx.restore();
    ['hidden sender', 'hidden amount', 'one-time address'].forEach((s, i) => { const w = ['sender,', 'amount,', 'addresses.'][i], k = V3.expoOut(V3.prog(t, wt('S1E', w), wt('S1E', w) + 0.35)) * (1 - tari);
      V3.chip(ctx, s, SAFE.x, 820 + i * 62, { size: 30, bg: MONERO, fg: C.ink, k }); });
    if (tari > 0) { V3.keyLight(ctx, { x: 540, y: 600, r: 900, col: '129,59,245', a: 0.25 * tari }); templateObj(ctx, t, 540, OBJ_Y + (1 - tari) * 900, 420, { t0: tf });
      V3.chip(ctx, 'the ootle · tari', 540, OBJ_Y + 200, { size: 30, bg: C.purple, fg: C.cloud, align: 'center', k: V3.expoOut(V3.prog(t, wt('S1F', 'Ootle.'), wt('S1F', 'Ootle.') + 0.4)) }); }
  }
  captions(ctx, t, { style: tt => ({ color: tt < td + 0.5 ? C.ink : C.cloud }), hi: { PUBLIC: C.red, FOREVER: C.red, TARI: C.purple, OOTLE: C.purple } });
  frameSafe(ctx);
}

// ---------------------------------------------------------------- S2 · Flagged for where you were born
function s2(ctx, t) {
  const tD = bs('S2D'), tE = bs('S2E'), tL = wt('S2E', 'permissionless,');
  const dark = V3.cubicInOut(V3.prog(t, tD + 0.2, tD + 1.6));
  V3.fill(ctx, C.red); V3.keyLight(ctx, { x: 300, y: 200, r: 1500, col: '255,210,210', a: 0.16 });
  V3.stripes(ctx, 0, 0, 1080, 40, { period: 32, fg: C.ink, phase: t * 40 });
  // FLAGGED behind the cube (the hook); later the hop chain; the rows of the review
  const z = 1 + 0.04 * V3.approach(t, 3);
  V3.camera(ctx, { zoom: z, y: (OBJ_Y - 540) * 0 }, () => {
    V3.words(ctx, 'FLAGGED', t, { x: 540, y: OBJ_Y + 80, size: 330, color: C.ink, cues: [wt('S2A', 'flagged')], dur: 0.5, leave: bs('S2B') + 0.2 });
    V3.words(ctx, 'SCORED.', t, { x: 540, y: OBJ_Y + 80, size: 330, color: C.ink, cues: [wt('S2B', 'score')], leave: bs('S2C') - 0.3 });
    const cs = V3.expoInOut(V3.prog(t, wt('S2C', 'Sell'), wt('S2C', 't-shirt') + 0.3)), cx = V3.lerp(540, 250, cs);
    youCube(ctx, t, cx, V3.lerp(885, OBJ_Y, cs), V3.lerp(240, 150, cs), { shadow: { color: 'rgba(40,0,10,0.55)', blur: 22, x: 22, y: 30 } });
    if (cs > 0) { const ck = V3.expoOut(V3.prog(t, wt('S2C', 'customer,'), wt('S2C', 'customer,') + 0.5)), sx = V3.lerp(1250, 560, ck);
      const chain = [[660, 1050], [740, 1290], [830, 1110]], hop = V3.prog(t, wt('S2C', 'decides'), wt('S2C', 'wallet.'));
      const scx = V3.lerp(1130, -70, V3.cubicInOut(V3.prog(t, wt('S2C', 'software') - 0.1, wt('S2C', 'wallet.') + 0.2)));
      let px = sx, py = OBJ_Y; chain.forEach(([x, y], i) => { const k = V3.expoOut(V3.prog(hop, i * 0.25, i * 0.25 + 0.3)); if (k <= 0) return; ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.setLineDash([2, 10]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(V3.lerp(px, x, k), V3.lerp(py, y, k)); ctx.stroke(); ctx.restore(); ctx.fillStyle = scx < x ? C.ink : C.ink; ctx.fillRect(x - 14, y - 14, 28, 28); if (scx < x) { ctx.strokeStyle = C.cloud; ctx.lineWidth = 3; ctx.strokeRect(x - 14, y - 14, 28, 28); } px = x; py = y; });
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + 90, OBJ_Y); ctx.lineTo(sx - 70, OBJ_Y); ctx.stroke(); ctx.restore();
      if (ck > 0) steelCube(ctx, t, sx, OBJ_Y, 120);
      const cl = V3.expoOut(V3.prog(t, wt('S2C', 'closed.'), wt('S2C', 'closed.') + 0.4)); if (cl > 0) V3.chip(ctx, 'account closed', SAFE.x, OBJ_Y - 150, { size: 26, bg: C.ink, fg: C.red, k: cl }); }
  });
  // the review rows: passport, place of birth (under US rules, a review you have to clear)
  if (t > wt('S2B', 'passport') - 0.1 && t < bs('S2C') + 0.2) [['passport', wt('S2B', 'passport')], ['place of birth', wt('S2B', 'birthplace')], ['burden of proof', wt('S2B', 'yourself.')]].forEach(([k, tt], i) => { if (t < tt) return;
    const y = 1344 + i * 41; V3.monoFont(ctx, 30, 500); V3.text(ctx, k, SAFE.x, y, { color: C.ink }); const kk = V3.expoOut(V3.prog(t, tt, tt + 0.35)); ctx.fillStyle = C.ink; ctx.fillRect(SAFE.x + 360, y - 26, 300 * kk, 34); });
  { const a = wt('S2C', 'software') - 0.1, b = wt('S2C', 'wallet.') + 0.2, sc = V3.prog(t, a, b); if (sc > 0 && sc < 1) scanner(ctx, V3.lerp(1130, -70, V3.cubicInOut(sc)), { w: 1080, h: 1920 }); }
  V3.stripes(ctx, 0, SAFE.bottom - 22, 1080, 22, { period: 32, fg: C.ink, phase: t * 40 });
  V3.label(ctx, 'dr. daniel kim · 36c3 · 2019', SAFE.x, 900, { size: 24, color: C.cloud, alpha: V3.prog(t, wt('S2D', 'Kim'), wt('S2D', 'Kim') + 0.3) * (1 - V3.prog(t, tE - 0.3, tE)) });
  // the lights dim (red sinks to ink); you stay lit, alone; then you frost over into glass (private), then the frame becomes Tari's and finally yours (lime)
  dimTo(ctx, dark);
  if (dark > 0) { const fr = V3.prog(t, wt('S2E', 'Privacy') - 0.2, wt('S2E', 'crime.') + 0.3), cxx = 300 * z + 540 * (1 - z), h = 150 * z;
    youCube(ctx, t, 540, (OBJ_Y - 960) * z + 960, h, {});
    void fr; }
  const vio = V3.expoInOut(V3.prog(t, wt('S2E', 'Tari') - 0.3, wt('S2E', 'Tari') + 0.6));
  if (vio > 0) { ctx.save(); ctx.beginPath(); ctx.arc(540, OBJ_Y, V3.lerp(20, 2300, vio), 0, Math.PI * 2); ctx.clip(); fieldInk(ctx, { w: 1080, h: 1920, pool: [540, OBJ_Y + 200], spill: '129,59,245', spillA: 0.14 }); V3.keyLight(ctx, { x: 540, y: 600, r: 1000, col: '129,59,245', a: 0.3 }); templateObj(ctx, t, 540, OBJ_Y, 400, { t0: wt('S2E', 'Tari') }); ctx.restore(); }
  const lime = V3.expoInOut(V3.prog(t, tL - 0.35, tL + 0.45));
  if (lime > 0) { ctx.save(); ctx.beginPath(); ctx.arc(540, OBJ_Y, V3.lerp(10, 2300, lime), 0, Math.PI * 2); ctx.clip(); V3.fill(ctx, C.green); ctx.restore(); }
  if (dark < 1 && t < tD + 1.2) V3.chip(ctx, 'risk: high · you', SAFE.x, 262, { size: 30, bg: C.ink, fg: C.red, k: V3.expoOut(V3.prog(t, 0.1, 0.4)) });
  captions(ctx, t, { until: tL, style: tt => ({ color: tt < tD + 0.8 ? C.ink : C.cloud }), hi: { TARI: C.purple } });
  const zl = 1 + 0.035 * V3.prog(t, tL, TL.total); ctx.save(); ctx.translate(540, 500); ctx.scale(zl, zl); ctx.translate(-540, -500);
  [['PERMISSIONLESS,', 'permissionless,'], ['PROGRAMMABLE,', 'programmable,', 2], ['PRIVATE.', 'private.']].forEach(([l, w, n], i) =>
    V3.words(ctx, l, t, { x: SAFE.x, y: 300 + 150 * 0.8 + i * 150 * 0.88, size: 150, align: 'left', color: C.ink, cues: [wt('S2E', w, { n: n || 1 }) - 0.04], dur: 0.42 }));
  ctx.restore();
  frameSafe(ctx);
}

// ---------------------------------------------------------------- S3 · Money with no memory (v4 hook: Kim, 36C3, 31:44)
function s3(ctx, t) {
  const tC = bs('S3C'), tD = bs('S3D'), tE = bs('S3E'), tF = bs('S3F');
  fieldInk(ctx, { w: 1080, h: 1920, pool: [540, OBJ_Y + 160], spill: '150,156,190', spillA: 0.12 });
  // the ring holds under the hook (formed, slow), steps aside for the banknote, comes back as the decoys (they rise on "decoys")
  const noteIn = V3.expoOut(V3.prog(t, wt('S3C', 'banknote') - 0.2, wt('S3C', 'with') + 0.2)), noteOut = V3.expoInOut(V3.prog(t, wt('S3D', 'Your') - 0.3, wt('S3D', 'payment') + 0.3));
  const ringOut = V3.expoInOut(V3.prog(t, tC - 0.3, tC + 0.5)), ringBack = V3.expoInOut(V3.prog(t, wt('S3D', 'Your') - 0.2, wt('S3D', 'decoys,')));
  const tem = V3.expoInOut(V3.prog(t, tF - 0.2, tF + 0.8));
  ctx.save(); ctx.translate(0, -tem * 1700 + ringOut * (1 - ringBack) * 1100);
  if (!ringV3(ctx, t, t < tC ? null : wt('S3D', 'Your') - 0.4)) ringV(ctx, t, { appear: t < tC ? 1 : V3.clamp(ringBack), angle: 0.12 * t + (t > wt('S3D', 'decoys,') ? 6 * V3.approach(t - wt('S3D', 'decoys,'), 0.9) : 0), wake: 1 });
  ctx.restore();
  if (noteIn > 0 && noteOut < 1) { const ny = V3.lerp(1800, OBJ_Y, noteIn) - noteOut * 1300; if (R3.has('L13_glass_note_hold')) R3.at(ctx, R3.frame('L13_glass_note_hold', 1), 540, ny, 0.98, { sx: 960, sy: 600 }); else obj(ctx, 'note', 540, ny, 360, {});
    ['owner 1 · 2016', 'owner 2 · 2018', 'owner 3 · 2021', 'owner 4 · 2023', 'owner 5 · 2025'].forEach((o, i) => { const k = V3.prog(t, wt('S3C', 'owner') + i * 0.12, wt('S3C', 'owner') + i * 0.12 + 0.2), wp = V3.prog(t, wt('S3D', 'wipes') + (4 - i) * 0.1, wt('S3D', 'wipes') + (4 - i) * 0.1 + 0.25); if (k <= 0 || wp >= 1) return;
      const yy = ny - 110 + i * 54; ctx.save(); ctx.beginPath(); ctx.rect(270 + 540 * wp, yy - 34, 560, 48); ctx.clip(); V3.monoFont(ctx, 36, 500); ctx.shadowColor = 'rgba(4,7,35,0.9)'; ctx.shadowBlur = 8; V3.text(ctx, o, 270, yy, { color: C.cloud, alpha: k }); ctx.restore(); }); }
  const mk = V3.expoOut(V3.prog(t, wt('S3E', 'Monero'), wt('S3E', 'apps.'))) * (1 - tem);
  if (mk > 0) { moduleObj(ctx, t, V3.lerp(-200, 300, mk), 845, 110); V3.chip(ctx, 'apps: not here', V3.lerp(-200, 300, mk), 950, { size: 30, bg: C.azure, fg: C.cloud, align: 'center', k: V3.prog(t, wt('S3E', 'apps.'), wt('S3E', 'apps.') + 0.3) }); }
  if (tem > 0) { V3.keyLight(ctx, { x: 540, y: 600, r: 900, col: '129,59,245', a: 0.25 * tem }); templateObj(ctx, t, 540, OBJ_Y + (1 - tem) * 900, 420, { t0: tF });
    V3.chip(ctx, 'apps with their own rules', 540, OBJ_Y + 210, { size: 30, bg: C.purple, fg: C.cloud, align: 'center', k: V3.expoOut(V3.prog(t, wt('S3F', 'rules,'), wt('S3F', 'rules,') + 0.4)) });
    V3.chip(ctx, 'money hidden by design', 540, OBJ_Y + 274, { size: 30, bg: C.cloud, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('S3F', 'hidden'), wt('S3F', 'hidden') + 0.4)) }); }
  V3.chip(ctx, 'dr. daniel kim · 36c3 · 2019', SAFE.x, 262, { size: 30, bg: C.cloud, fg: C.ink, k: V3.expoOut(V3.prog(t, wt('S3B', 'Dr.'), wt('S3B', 'Dr.') + 0.4)) * (1 - V3.prog(t, tC - 0.3, tC)) });
  // the hook is a quote: open and close marks frame it while it plays
  const qk = V3.expoOut(V3.prog(t, 0.05, 0.4)) * (1 - V3.prog(t, bs('S3B') - 0.2, bs('S3B') + 0.1));
  if (qk > 0) { V3.display(ctx, 220); ctx.save(); ctx.globalAlpha = qk; ctx.fillStyle = C.green; ctx.fillText('“', SAFE.x - 6, 300); ctx.restore(); }
  captions(ctx, t, { color: C.cloud, hi: { "TARI'S": C.purple, TARI: C.purple, OOTLE: C.purple, MEMORY: MONERO, MONERO: MONERO } });
  frameSafe(ctx);
}
