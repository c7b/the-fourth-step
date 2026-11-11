'use strict';
// Shots 01–06 (and the terminal used again by 15): lookup, title, you, 01 Bitcoin, the public wall, perfect memory.
const { C } = V3;
// ---------------------------------------------------------------- terminal (shots 01 and 15)
const TERM = { SCREEN: [767, 204, 384, 543], CX: 959, CY: 475.5, ZEND: 5.4, SZ: 22 };   // SZ: screen text in device px (x1.42 hold zoom = 31 px on a 1080p frame)
const termZoomHold = lt => 1 + 0.42 * V3.approach(lt, 3.2) + 0.004 * lt;
function termCam(t, o) {
  const lt = t - o.a; let z = termZoomHold(Math.max(0, lt));
  if (o.pushAt != null && t > o.pushAt) { const zs = termZoomHold(o.pushAt - o.a), k = V3.cubicInOut(V3.prog(t, o.pushAt, o.pushEnd)); z = Math.exp(V3.lerp(Math.log(zs), Math.log(TERM.ZEND), k)); }
  const f = TERM.ZEND / (TERM.ZEND - 1);
  return { zoom: z, x: -(TERM.CX - 960) * (z - 1) * f, y: -(TERM.CY - 540) * (z - 1) * f };
}
// the cursor block in frame space at the end of the push (it becomes the lime title block / the end card's start)
const cursorEnd = () => { const w = TERM.SZ * 0.62 * TERM.ZEND, h = TERM.SZ * TERM.ZEND; return [960 - w / 2, 540 - h / 2, w, h, 0]; };
function termScreen(ctx, t, o) {
  const [x, y0, w, h] = TERM.SCREEN, sz = TERM.SZ, lh = 42, px = x + 24;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y0, w, h); ctx.clip();
  const on = o.screenOn ? 1 : V3.expoOut(V3.prog(t, o.a + 0.1, o.a + 0.6)); ctx.fillStyle = V3.rgba(C.ink, on); ctx.fillRect(x, y0, w, h);
  const sc = o.scrollAt != null ? V3.expoInOut(V3.prog(t, o.scrollAt, o.scrollAt + 0.55)) : 0, y = y0 + 62 - sc * 560;
  if (o.screenOn && t < o.cmdAt) { V3.monoFont(ctx, sz, 500); V3.text(ctx, '$', px, y + 96, { color: C.cloud }); ctx.fillStyle = C.green; ctx.fillRect(px + 20, y + 96 - sz * 0.82, sz * 0.62, sz); }
  const cmd = '$ lookup --owner you'; typedCue((o.coda ? 'coda' : 'open') + '|cmd', o.cmdAt, 17, cmd.length, sz);
  V3.typed(ctx, cmd, px, y + 96, t, o.cmdAt, 17, { size: sz, color: C.cloud, cursor: t < o.l0 - 0.1, floor: false });
  o.lines.forEach(([k, v, kind], i) => {
    const t0 = o.l0 + i * o.dt; if (t < t0) return;
    const yy = y + 96 + (i + 1) * lh + 8, a = V3.expoOut(V3.prog(t, t0, t0 + 0.12)), vx = x + w - 24;
    if (i === 0 || kind !== 'ok') typedCue((o.coda ? 'coda' : 'open') + '|line' + i, t0, 1e3, 1, sz);
    V3.monoFont(ctx, sz, 500); V3.text(ctx, k, px, yy, { color: C.frost, alpha: a, track: sz * 0.02 });
    const kw = V3.measure(ctx, k, sz * 0.02);
    if (kind === 'ok') { V3.leader(ctx, px + kw + 10, vx - 34, yy - 5, { color: C.steel, r: 1.4, gap: 9 }); V3.text(ctx, v, vx, yy, { align: 'right', color: C.green, alpha: a }); return; }
    if (kind === 'hid') { const kk = V3.expoOut(V3.prog(t, t0 + 0.08, t0 + 0.4)); ctx.fillStyle = C.purple; ctx.fillRect(vx - 120 * kk, yy - sz * 0.85, 120 * kk, sz * 1.05); V3.leader(ctx, px + kw + 10, vx - 130, yy - 5, { color: C.steel, r: 1.4, gap: 9, alpha: 0.8 * a }); return; }
    const chip = V3.chip(ctx, v, vx, yy + 3, { size: 21, floor: false, padX: 7, align: 'right', bg: kind === 'vis' ? C.green : C.red, fg: kind === 'vis' ? C.ink : C.cloud, padY: 6, k: V3.expoOut(V3.prog(t, t0 + 0.1, t0 + 0.35)) });
    V3.leader(ctx, px + kw + 10, chip.x - 10, yy - 5, { color: C.steel, r: 1.4, gap: 9, alpha: 0.8 * a });
  });
  const tEnd = o.l0 + o.lines.length * o.dt;
  if (t >= tEnd) {   // the prompt waits; after the scroll the cursor sits alone at the screen's centre
    const blink = Math.floor((t - tEnd) * 2) % 2 === 0 || (o.pushAt != null && t > o.pushAt - 0.6);
    if (sc < 1) { const yy = y + 96 + (o.lines.length + 1) * lh + 8; V3.monoFont(ctx, sz, 500); V3.text(ctx, '$', px, yy, { color: C.cloud }); if (blink) { ctx.fillStyle = C.green; ctx.fillRect(px + 20, yy - sz * 0.82, sz * 0.62, sz); } }
    if (sc > 0 && blink && !(o.cursorOffAt != null && t > o.cursorOffAt)) { const cw = sz * 0.62; ctx.fillStyle = C.green; ctx.fillRect(TERM.CX - cw / 2, TERM.CY - sz / 2, cw, sz); }
  }
  ctx.globalAlpha = 0.07; ctx.fillStyle = '#000'; for (let yy = y0; yy < y0 + h; yy += 3) ctx.fillRect(x, yy, w, 1);
  ctx.globalAlpha = 1; const g = ctx.createLinearGradient(x, y0, x + w * 0.7, y0 + h * 0.6);
  g.addColorStop(0, 'rgba(236,238,255,0.10)'); g.addColorStop(0.45, 'rgba(236,238,255,0.03)'); g.addColorStop(0.46, 'rgba(236,238,255,0)'); g.addColorStop(1, 'rgba(236,238,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y0, w, h); ctx.restore();
}
function terminal(ctx, t, o) {
  V3.fill(ctx, C.ink);
  V3.camera(ctx, termCam(t, o), () => {
    V3.cover(ctx, V3.IMG.term, { fy: 0.5 });
    const on = o.screenOn ? 1 : V3.expoOut(V3.prog(t, o.a + 0.1, o.a + 0.6)); ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(TERM.CX, 750, 10, TERM.CX, 750, 260); g.addColorStop(0, `rgba(60,70,140,${0.18 * on})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
    termScreen(ctx, t, o);
  });
  const k = 1 - V3.prog(t, o.pushAt ?? 1e9, (o.pushAt ?? 1e9) + 0.4);
  if (k > 0) { V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.16 * k, oy: 60, x0: 60, x1: 560 }); V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.16 * k, oy: 60, x0: 1380, x1: 1880 }); V3.vignette(ctx, 0.55 * k); }
}
const OPEN_LINES = [['public ledger', 'ok', 'ok'], ['balance', 'VISIBLE', 'vis'], ['every payment', 'VISIBLE', 'vis'], ['who paid you', 'VISIBLE', 'vis'],
  ['who you paid', 'VISIBLE', 'vis'], ['who can look', 'ANYONE', 'bad'], ['kept for', 'FOREVER', 'bad']];
const CODA_LINES = [['the ootle', 'ok', 'ok'], ['balance', '', 'hid'], ['every payment', '', 'hid'], ['who paid you', '', 'hid'], ['who you paid', '', 'hid'], ['network check', 'VALID', 'vis']];

// ---------------------------------------------------------------- 01 · the lookup (B01)
const S01 = { a: 0, cmdAt: 0.5, l0: 2.0, dt: 0.5, lines: OPEN_LINES, scrollAt: 6.5, pushAt: 6.9, pushEnd: 8.2 };
function shot01(ctx, t) { terminal(ctx, t, S01); }

// ---------------------------------------------------------------- 02 · title (B02)
const CUBE = { cx: 960, cy: 520, h0: 300 };                              // the cube's body: centre and starting height
const cubeRect = h => { const w = h * 330 / 312; return [CUBE.cx - w / 2, CUBE.cy - h / 2, w, h, 6]; };
function shot02(ctx, t) {
  const a = bs('B02'), b = bs('B03');
  V3.fill(ctx, C.ink);
  const grow = V3.expoOut(V3.prog(t, a, a + 0.75)), shrink = V3.expoInOut(V3.prog(t, b - 1.05, b - 0.3));
  const r0 = cursorEnd(), r1 = [1180, -10, 760, 1100, 0], r2 = cubeRect(CUBE.h0);
  const r = shrink > 0 ? lerpRect(r1, r2, shrink) : lerpRect(r0, r1, grow);
  const z = 1 + 0.07 * V3.approach(t - a, 4.5) * (1 - shrink);
  V3.camera(ctx, { zoom: z, x: -26 * V3.prog(t, a, b) * (1 - shrink) }, () => {
    V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.14 * grow * (1 - shrink), oy: 60, x0: 60, x1: 1100 });
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], r[4]); ctx.fill();
    V3.words(ctx, 'THE FOURTH', t, { x: 1130, y: 630, size: 250, color: C.cloud, align: 'right', t0: a + 0.45, leave: b - 1.35 });
    ctx.save(); ctx.beginPath(); ctx.roundRect(r[0], r[1], r[2], r[3], r[4]); ctx.clip();
    V3.words(ctx, 'STEP', t, { x: 1550, y: 630, size: 250, color: C.ink, t0: a + 0.65, leave: b - 1.3 }); ctx.restore();
    V3.words(ctx, 'bitcoin · ethereum · monero · tari', t, { x: 1130, y: 760, size: 30, fam: 'mono', color: C.frost, align: 'right', t0: a + 1.0, stagger: 0.06, leave: b - 1.4 });
  });
  // the square becomes the cube: a top-down wipe reveals the real object in the square's place
  const wk = V3.prog(t, b - 0.32, b);
  if (wk > 0) { const rr = cubeRect(CUBE.h0); ctx.save(); ctx.beginPath(); ctx.rect(rr[0] - 80, rr[1] - 60, rr[2] + 160, (rr[3] + 120) * wk); ctx.clip(); V3.fill(ctx, C.ink); obj(ctx, 'you', CUBE.cx, CUBE.cy, CUBE.h0); ctx.restore(); }
}

// ---------------------------------------------------------------- 03 · you (B03)
const cubeH3 = t => CUBE.h0 * (1 - 0.32 * V3.approach(Math.max(0, t - cubeSettle()), 8));
function shot03(ctx, t) {
  const a = cubeSettle();
  fieldInk(ctx, { pool: [960, 690], spill: '199,234,0', spillA: 0.10 }); V3.keyLight(ctx, { x: 700, y: 120, r: 900, col: '201,235,0', a: 0.02 + 0.05 * V3.prog(t, a, a + 14) });
  V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.12, oy: 60 + (t - a) * 9, x0: 60, x1: 560 }); V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.12, oy: 60 + (t - a) * 9, x0: 1380, x1: 1880 });
  const h = cubeH3(t), drift = 0;
  V3.camera(ctx, { x: drift }, () => {
    // traces: a payment comes in from the left ("paid"), one goes out to the right ("pay someone"); they leave marks ("trace")
    const tin = wt('B03', 'paid,'), tout = wt('B03', 'pay'), ttr = wt('B03', 'trace.');
    // the traces run through the cube's centre line, symmetric left and right (owner note 2)
    const lin = V3.expoOut(V3.prog(t, tin - 0.3, tin + 0.4)), lout = V3.expoOut(V3.prog(t, tout - 0.1, tout + 0.6)), ly = CUBE.cy, gap = h * 0.62;
    ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.setLineDash([2, 14]); ctx.lineCap = 'round';
    if (lin > 0) { ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo((CUBE.cx - gap) * lin, ly); ctx.stroke(); }
    if (lout > 0) { ctx.beginPath(); ctx.moveTo(CUBE.cx + gap, ly); ctx.lineTo(CUBE.cx + gap + (1920 - CUBE.cx - gap) * lout, ly); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) { const tt = ttr + i * 0.08 + (side > 0 ? 0.04 : 0), k = V3.expoOut(V3.prog(t, tt, tt + 0.3)); if (k <= 0) continue;
      const x = CUBE.cx + side * (gap + 120 + i * 190); ctx.fillStyle = V3.rgba(C.green, 0.9); ctx.fillRect(x - 7 * k, ly - 7 * k, 14 * k, 14 * k); }
    youCube(ctx, t, CUBE.cx, CUBE.cy, h, { t0: cubeSettle() });
    V3.chip(ctx, 'you', CUBE.cx + h * 0.62, CUBE.cy - h * 0.55, { size: 22, bg: C.green, fg: C.ink, k: V3.expoOut(V3.prog(t, wt('B03', 'you.'), wt('B03', 'you.') + 0.35)) });
  });
  V3.words(ctx, 'WHO GETS TO READ IT?', t, { x: 960, y: 900, size: 150, color: C.cloud, cues: phrase('B03', 'who gets to read it?') });
}

// ---------------------------------------------------------------- 04 · 01 Bitcoin (B04–B05)
const PLATE_C = [972 / 1920, 531.5 / 1088], PLATE_Z = 1.45;               // the close-up: the plate photo, zoomed about the plate's centre
const plateZoom = t => PLATE_Z * (1 + 0.03 * V3.approach(t - (bs('B05') + 1.0), 3));
function plateCloseUp(ctx, t, reveal) {
  const zs = plateZoom(t);
  V3.cover(ctx, V3.IMG.plate, { zoom: zs, fx: PLATE_C[0], fy: PLATE_C[1] });
  ctx.save(); ctx.translate(960 - 622 * zs, 540 - 401.5 * zs); ctx.scale(zs / 2, zs / 2); Statement.engraveStatement(ctx, { reveal }); ctx.restore();
}
function shot04(ctx, t) {
  const a = bs('B04'), tilt = V3.expoInOut(V3.prog(t, wt('B05', 'Instead') + 0.2, wt('B05', 'private'))), up = -tilt * 1150;
  fieldCloud(ctx);
  if (tilt < 1) {
    ctx.save(); ctx.translate(0, up); const zc = 1 + 0.009 * Math.max(0, t - a); ctx.translate(960, 540); ctx.scale(zc, zc); ctx.translate(-960, -540); V3.keyLight(ctx, { x: 300, y: -300, r: 1600, col: '255,255,255', a: 0.5 });
    V3.reg(ctx, { pitch: 120, size: 8, color: C.ink, alpha: 0.13, lw: 2, ox: -(t - a) * 14, oy: 60, x0: 0, x1: 1920, y0: 40, y1: 1000 });
    // the numeral rises behind the cube, its 0's counter around it
    V3.display(ctx, 1100); const m0 = ctx.measureText('0'), asc = m0.actualBoundingBoxAscent, base = CUBE.cy + asc / 2;
    V3.words(ctx, '01', t, { x: 960 - m0.width / 2, y: base, size: 1100, align: 'left', color: C.ink, cues: [wt('B04', 'Step')], leave: wt('B04', 'For') - 0.6, track: -6 });
    // you: from the centre (inside the 0) to the left; the stranger slides in from the right; the bank rises and leaves upward
    // 0:15–0:27 (owner note v4): you further left, the stranger further right, the bank between them; the coin waits beside you
    // while the bank stands, then rolls (a real Blender coin) to the stranger once the bank has sunk, never touching it.
    // Blender stage L22a–d (full-frame layers on one camera) when present, else the separate L03/L06/L05/L04 shots.
    const STG = R3.has('L22a_stage_lime_idle') && R3.has('L22b_stage_steel_idle') && R3.has('L22c_stage_bank_in') && R3.has('L22c_stage_bank_out') && R3.has('L22d_stage_coin');
    const YOU0 = [420, 558], STR0 = [1500, 558], COIN0 = [600, 560], YOU_AT = STG ? 400 : YOU0[0], BANK_DX = STG ? 92 : 0, BANK_S = STG ? 0.88 : 1, BANK_BASE = [960, 877];
    const split = V3.expoInOut(V3.prog(t, wt('B04', 'For') - 0.4, wt('B04', 'two')));
    const yx = V3.lerp(CUBE.cx, YOU_AT, split), yy = V3.lerp(CUBE.cy, YOU0[1], split), yh = V3.lerp(cubeH3(a), 190, split);
    const sk = V3.expoOut(V3.prog(t, wt('B04', 'two'), wt('B04', 'could'))), sx = V3.lerp(2200, STR0[0], sk);
    const bkIn = V3.expoOut(V3.prog(t, wt('B04', 'strangers'), wt('B04', 'send'))), bkOut = V3.expoInOut(V3.prog(t, wt('B04', 'no'), wt('B04', 'middle.') + 0.2));
    const by = V3.lerp(1500, 520, bkIn) - bkOut * 1400;
    const s4 = wt('B04', 'strangers'), bankLand = s4 + 0.3 * (wt('B04', 'send') - s4), tNo = wt('B04', 'no');
    const BIN = STG ? 'L22c_stage_bank_in' : 'L05_bank_in', BOUT = STG ? 'L22c_stage_bank_out' : 'L05_bank_out', COIN = STG ? 'L22d_stage_coin' : 'L04_coin_roll';
    const bankGone = tNo + (R3.evf(BOUT, 'gone', 55) - R3.evf(BOUT, 'sink_start', 31)) / 30, rollAt = bankGone + 0.05;
    if (R3.has(BIN) && R3.has(BOUT)) { if (t > s4 - 1.2 && t < bankGone + 0.5) R3.at(ctx, t < tNo ? R3.clip(BIN, t, bankLand - (R3.ev(BIN, 'land', 1.47) - 1)) : R3.clip(BOUT, t, tNo), BANK_BASE[0] + BANK_DX, BANK_BASE[1], BANK_S, { sx: BANK_BASE[0], sy: BANK_BASE[1] }); }
    else if (bkIn > 0) obj(ctx, 'bank', 960, by, 470, { shadow: SHADOW });
    if (sk > 0) { if (STG) R3.at(ctx, R3.loop('L22b_stage_steel_idle', t, a), sx, STR0[1], 1, { sx: STR0[0], sy: STR0[1] }); else steelCube(ctx, t, sx, 560, 190);
      V3.chip(ctx, 'stranger', sx, 410, { size: 20, bg: C.ink, fg: C.cloud, align: 'center', k: sk }); }
    // the coin: appears beside you on "send", waits, rolls after the bank is gone
    const cIn = V3.expoOut(V3.prog(t, wt('B04', 'send'), wt('B04', 'money'))), cGo = V3.expoInOut(V3.prog(t, rollAt, rollAt + 1.2));   // (L22d: start 31, stop 67)
    if (cIn > 0) { if (R3.has(COIN)) { const ce = (R3.anchor(COIN, 'coin_centre', 1) || [720, 560]), rollK = V3.clamp((t - rollAt) / ((R3.evf(COIN, 'stop', 67) - R3.evf(COIN, 'start', 31)) / 30)), dx = STG ? 35 * (1 - rollK) : COIN0[0] - ce[0];
        ctx.save(); ctx.translate(ce[0] + dx, ce[1]); ctx.scale(cIn, cIn); ctx.translate(-ce[0] - dx, -ce[1]); R3.at(ctx, R3.clip(COIN, t, rollAt), 960 + dx, 540, 1, { sx: 960, sy: 540 }); ctx.restore(); }
      else obj(ctx, 'coin', V3.lerp(COIN0[0], STR0[0] - 140, cGo), 560, 110 * cIn, { shadow: SHADOW }); }
    if (STG) R3.at(ctx, R3.loop('L22a_stage_lime_idle', t, cubeSettle()), yx, yy, yh / 190, { sx: YOU0[0], sy: YOU0[1] }); else youCube(ctx, t, yx, yy, yh, { white: true, t0: cubeSettle() });
    if (split > 0.5) youMark(ctx, yx - 11, yy - yh * 0.5 - 50, 22);
    V3.chip(ctx, 'no bank in the middle', 960, 230, { size: 30, bg: C.yellow, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('B04', 'no'), wt('B04', 'no') + 0.4)) });
    V3.words(ctx, 'bitcoin · 2009', t, { x: 960, y: 940, size: 30, fam: 'mono', color: C.ink, cues: [wt('B04', 'Bitcoin,'), wt('B04', '2009.'), wt('B04', '2009.') + 0.1] });
    ctx.restore();
  }
  if (tilt > 0) {   // the plate rises into the frame as the scene above leaves: one vertical move
    ctx.save(); ctx.translate(0, (1 - tilt) * 1150);
    const hk = wt('B05', 'everyone'), c0 = wt('B05', 'copy'), who = phrase('B05', 'who paid whom,'), how = phrase('B05', 'and how much.');
    const nameT = [c0, who[0], who[1], who[2], who[2] + 0.25], valT = [c0 + 0.35, how[0], how[1], how[2], how[2] + 0.25];
    if (WALL3()) { R3.full(ctx, R3.frame(WALL3(), 1));
      const cn = ['plate_tl', 'plate_tr', 'plate_br', 'plate_bl'].map(n => R3.anchor(WALL3(), n, 1) || [960, 540]);
      const T2S = (tx, ty) => { const u = tx / 2488, v = ty / 1606, tp = [V3.lerp(cn[0][0], cn[1][0], u), V3.lerp(cn[0][1], cn[1][1], u)], bt = [V3.lerp(cn[3][0], cn[2][0], u), V3.lerp(cn[3][1], cn[2][1], u)]; return [V3.lerp(tp[0], bt[0], v), V3.lerp(tp[1], bt[1], v)]; };
      const { L, R, T0 } = Statement.TEX, mark = (x0, x1, y, k) => { if (k <= 0) return; const a2 = T2S(x0, y), b2 = T2S(V3.lerp(x0, x1, k), y); ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); ctx.restore(); };
      const kh = V3.expoOut(V3.prog(t, hk, hk + 0.6)); if (kh > 0) { const p0 = T2S(L - 40, T0 - 150), p1 = T2S(R + 40, T0 + 10); V3.brackets(ctx, p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], { color: C.ink, lw: 4, len: 34, alpha: kh }); }
      Statement.LINES.forEach(([k2], i) => { const y = Statement.TEX.LINE(i) + 34, kn = V3.expoOut(V3.prog(t, nameT[i], nameT[i] + 0.5)), kv = V3.expoOut(V3.prog(t, valT[i], valT[i] + 0.5));
        mark(L, L + 112 * 0.62 * k2.length, y, kn); mark(R - 112 * 0.62 * 6.2, R, y, kv); }); }
    else plateCloseUp(ctx, t, (i, part) => i < 0 ? V3.expoOut(V3.prog(t, hk, hk + 0.6)) : V3.expoOut(V3.prog(t, part === 'k' ? nameT[i] : valT[i], (part === 'k' ? nameT[i] : valT[i]) + 0.5)));
    ctx.restore();
  }
  V3.tracker(ctx, { step: 1, lit: [V3.prog(t, wt('B04', 'middle.'), wt('B04', 'middle.') + 0.4) > 0 ? V3.expoOut(V3.prog(t, wt('B04', 'middle.'), wt('B04', 'middle.') + 0.4)) : false, false, false], fg: C.ink, y: 1046, k: V3.prog(t, a, a + 1), alpha: 1 - V3.clamp(tilt * 3) });
}

// ---------------------------------------------------------------- 05–06 · the public wall, perfect memory (B06–B08)
// one camera for both shots: from the close-up (plate fills the frame) back and round, fast then slow, never reversing
const wallCam = t => {
  const t0 = bs('B06'), lt = Math.max(0, t - t0), zs = plateZoom(t0), D0 = 460 * 2000 / (1244 * zs);
  return V3.orbit([0, 0, 0], D0 + 1050 * V3.approach(lt, 2.0) + 9 * lt, (20 * V3.approach(lt, 2.6) + 0.35 * lt) * Math.PI / 180, 0, 2000);
};
const HOPS = [[4, 2], [4, 1], [5, 1], [5, 2], [6, 3], [5, 3], [2, 3], [2, 1]];
// v5: the Blender wall (L20_ledger_wall_engraved: our plate face-on, 1 s hold, pull-back 6x with a 20 deg orbit; the strangers' plates engraved)
const WALL3 = () => (R3.has('L20_ledger_wall_engraved') ? 'L20_ledger_wall_engraved' : R3.has('L19a_plate_wall') ? 'L19a_plate_wall' : null);
const wallF = t => { const id = WALL3(); return Math.max(1, Math.min(R3.MAN[id].frames, 1 + 30 + Math.floor((t - bs('B06')) * 30))); };
const wallZ = t => 1 + 0.004 * Math.max(0, t - (bs('B06') + 7.0));         // after the move lands, a slow creep keeps it alive
const wallPt = (t, name) => { const p = R3.anchor(WALL3(), name, wallF(t)) || [960, 540], z = wallZ(t); return { x: (p[0] - 960) * z + 960, y: (p[1] - 540) * z + 540 }; };
function wall3(ctx, t) { const z = wallZ(t); V3.camera(ctx, { zoom: z }, () => R3.full(ctx, R3.clip(WALL3(), t, bs('B06')))); }
const ourCorners3 = t => ['plate_tl', 'plate_tr', 'plate_br', 'plate_bl'].map(n => wallPt(t, n));
function wallOverlays(ctx, t, cam) {
  const q = WALL3() ? ourCorners3(t) : Statement.corners(A.ST, cam), xs = q.map(p => p.x), ys = q.map(p => p.y);
  const bx = Math.min(...xs) - 20, by = Math.min(...ys) - 20, bw = Math.max(...xs) - bx + 20, bh = Math.max(...ys) - by + 20;
  const kb = V3.expoOut(V3.prog(t, wt('B06', 'Picture'), wt('B06', 'Picture') + 0.5));
  if (kb > 0) { V3.brackets(ctx, bx, by, bw, bh, { color: C.ink, lw: 4, len: 34, alpha: kb }); V3.chip(ctx, 'you', bx, by - 12, { size: 22, bg: C.ink, fg: C.green, k: kb }); }
  return [bx, by, bw, bh];
}
function shot05(ctx, t) {
  const cam = wallCam(t);
  if (WALL3()) wall3(ctx, t); else Statement.draw(ctx, A.ST, cam, {});
  const hz = ctx.createLinearGradient(0, 0, 0, 330); hz.addColorStop(0, 'rgba(236,238,255,0.86)'); hz.addColorStop(1, 'rgba(236,238,255,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, 1920, 330);
  const hb = ctx.createLinearGradient(0, 1080, 0, 830); hb.addColorStop(0, 'rgba(236,238,255,0.94)'); hb.addColorStop(0.55, 'rgba(236,238,255,0.8)'); hb.addColorStop(1, 'rgba(236,238,255,0)'); ctx.fillStyle = hb; ctx.fillRect(0, 830, 1920, 250);
  wallOverlays(ctx, t, cam);
  V3.words(ctx, 'PUBLIC.', t, { x: 960, y: 205, size: 190, color: C.ink, cues: [wt('B06', 'public.')], leave: wt('B06', 'anyone') - 0.55 });
  V3.words(ctx, 'ANYONE CAN READ IT.', t, { x: 960, y: 205, size: 190, color: C.ink, cues: [wt('B06', 'anyone'), wt('B06', 'walking'), wt('B06', 'walking') + 0.18, wt('B06', 'past.')] });
  const qc = phrase('B06', 'everybody in the world can see who sent what to whom and when.');
  V3.words(ctx, '“everybody in the world can see who sent what to whom and when.”', t, { x: 960, y: 952, size: 34, fam: 'sans', weight: 600, color: C.ink, cues: qc });
  V3.label(ctx, 'dr. daniel kim · 36c3 · leipzig · 2019', 960, 994, { size: 18, color: C.ink, align: 'center', alpha: 0.75 * V3.prog(t, wt('B06', 'Dr.'), wt('B06', 'Dr.') + 0.4) });
  V3.tracker(ctx, { step: 1, lit: [true, false, false], fg: C.ink, y: 1046, alpha: V3.prog(t, bs('B06') + 0.9, bs('B06') + 1.5) });
}
function shot06(ctx, t) {
  const cam = wallCam(t);
  if (WALL3()) wall3(ctx, t); else Statement.draw(ctx, A.ST, cam, {});
  const hz = ctx.createLinearGradient(0, 0, 0, 330); hz.addColorStop(0, 'rgba(236,238,255,0.86)'); hz.addColorStop(1, 'rgba(236,238,255,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, 1920, 330);
  const hb = ctx.createLinearGradient(0, 1080, 0, 860); hb.addColorStop(0, 'rgba(236,238,255,0.94)'); hb.addColorStop(1, 'rgba(236,238,255,0)'); ctx.fillStyle = hb; ctx.fillRect(0, 860, 1920, 220);
  // one payment tied to your name unravels the rest: ink links hop plate to plate, each plate marked
  const h0 = wt('B07', 'one'), hops = [[0, 0]].concat(HOPS);
  let prev = WALL3() ? wallPt(t, 'plate_c3_r2') : V3.proj(cam, 0, 0, 3);
  hops.slice(1).forEach(([i, j], n) => { const t0 = h0 + n * 0.38, k = V3.expoOut(V3.prog(t, t0, t0 + 0.32)); if (k <= 0) return;
    const p = WALL3() ? wallPt(t, `plate_c${i}_r${j}`) : (() => { const [X, Y] = Statement.plateCentre(i, j); return V3.proj(cam, X, Y, 0); })(); if (!p || !prev) return;
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(V3.lerp(prev.x, p.x, k), V3.lerp(prev.y, p.y, k)); ctx.stroke(); ctx.restore();
    if (k > 0.95) youMark(ctx, p.x - 9, p.y - 9, 18);
    prev = p; });
  const bx = wallOverlays(ctx, t, cam);
  // B07: what we were told (2011), struck through on "It isn't."
  const tin = wt('B07', 'Early'), tout = wt('B07', 'Your') - 0.15;
  lightPanel(ctx, t, tin - 0.1, tout, { y: 250, h: 620 });
  if (t > tin - 0.1 && t < tout + 0.8) {
    ctx.save(); const sl = V3.expoInOut(V3.prog(t, tout, tout + 0.55)); ctx.translate(sl * 1920, 0);
    V3.label(ctx, 'what we were told · 2011', 960, 380, { size: 26, color: C.steel, align: 'center', alpha: V3.prog(t, tin, tin + 0.3) });
    V3.words(ctx, ['“PERMANENTLY AND', 'ANONYMOUSLY STORED”'], t, { x: 960, y: 560, size: 170, color: C.ink, t0: wt('B07', 'explainers'), stagger: 0.09 });
    V3.display(ctx, 170); const tr = -170 * 0.005, wA = V3.measure(ctx, 'ANONYMOUSLY', tr), wL = V3.measure(ctx, 'ANONYMOUSLY STORED”', tr), x0 = 960 - wL / 2, yb = 560 + 170 * 0.86;
    const ti = wt('B07', "isn't."); V3.stripes(ctx, x0 - 8, yb - 132, (wA + 16) * V3.expoOut(V3.prog(t, ti - 0.15, ti + 0.35)), 142, { period: 30, fg: C.ink, bg: C.yellow, phase: t * 30 });
    V3.chip(ctx, 'publicly', x0 - 8, yb + 70, { size: 40, bg: C.ink, fg: C.cloud, k: V3.expoOut(V3.prog(t, ti + 0.2, ti + 0.6)) });
    V3.label(ctx, 'weusecoins, "what is bitcoin?" (2011)', 960, 860, { size: 20, color: C.steel, align: 'center', alpha: V3.prog(t, tin + 0.5, tin + 0.9) });
    ctx.restore();
  }
  // B08: script small on purpose; then the landing line
  const ts = wt('B08', 'programming');
  const ks = V3.expoOut(V3.prog(t, ts, ts + 0.4)), kh = V3.expoOut(V3.prog(t, wt('B08', 'hard'), wt('B08', 'hard') + 0.4));
  if (ks > 0 && t < wt('B08', 'So') + 0.2) { V3.chip(ctx, 'script · small on purpose', bx[0] + bx[2] + 24, bx[1] + 60, { size: 22, bg: C.azure, fg: C.cloud, k: ks }); if (kh > 0) V3.chip(ctx, 'hard to build apps on', bx[0] + bx[2] + 24, bx[1] + 108, { size: 22, bg: C.ink, fg: C.cloud, k: kh }); }
  const tl0 = wt('B08', 'So'), tl1 = be('B08') - 1.05;
  lightPanel(ctx, t, tl0, tl1, { y: 250, h: 620 });
  if (t > tl0 && t < tl1 + 0.8) { ctx.save(); ctx.translate(V3.expoInOut(V3.prog(t, tl1, tl1 + 0.55)) * 1920, 0);
    V3.stack(ctx, ['NO BANK.', 'PERFECT MEMORY.'], t, { size: 230, y: 520, lead: 0.86, color: C.ink, cues: undefined, t0: wt('B08', 'no', { n: 1 }), lineGap: wt('B08', 'perfect') - wt('B08', 'no') });
    ctx.restore(); }
  V3.tracker(ctx, { step: 1, lit: [true, false, false], fg: C.ink, y: 1046 });
}
// your plate's on-screen rect at time t (the flood into Ethereum grows from it)
const yourPlateRect = t => { const q = WALL3() ? ourCorners3(t) : Statement.corners(A.ST, wallCam(t)), xs = q.map(p => p.x), ys = q.map(p => p.y); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 4]; };

// the waiting cursor of a terminal shot, in frame space at time t (the lime field of shot 14 contracts into it)
function termCursorRect(t, o) { const c = termCam(t, o), z = c.zoom, sz = TERM.SZ, x = TERM.SCREEN[0] + 24 + 20, y = TERM.SCREEN[1] + 62 + 96 - sz * 0.82;
  const f = p => [(p[0] - 960) * z + 960 + c.x, (p[1] - 540) * z + 540 + c.y]; const [x0, y0] = f([x, y]); return [x0, y0, sz * 0.62 * z, sz * z, 0]; }

// ---------------------------------------------------------------- T · title (v4, owner note 1)
// One centred card, all in #C7EA00: THE FOURTH STEP / bitcoin · ethereum · monero · tari / +. Then the lime cube jumps in and
// lands with the "cling" (Blender L01_cube_jump; 2D fallback: the same arc with the v3 sprite). Ends exactly as shot 03 begins.
const TITLE_COL = '#C7EA00', JUMP = 'L01_cube_jump';
// the cube lands 1.4 s before "This is you" (never before 2.6 s: the title needs its time); the landing is the "cling"
const cubeLand = () => Math.max(2.6, cueAny('B03', ['This'], bs('B03') + 1.4) - 1.0);
const jumpA = () => cubeLand() - (R3.ev(JUMP, 'land', 2.4) - 1);                 // the Blender action's start (1 s handle)
const cubeSettle = () => R3.has(JUMP) ? jumpA() + 2.0 : cubeLand() + 0.3;        // L01's end pose = L02's frame 1: shot 03 takes over here
function cubeJump(ctx, t) {
  if (R3.has(JUMP)) { if (t >= jumpA() - 1) R3.at(ctx, R3.clip(JUMP, t, jumpA()), CUBE.cx, CUBE.cy, 1, { sx: 958, sy: CUBE3_CY }); return; }
  const l = cubeLand(), a = l - 0.8; if (t < a) return;
  const k = V3.clamp((t - a) / 0.8), y = k < 0.62 ? V3.lerp(1360, 455, 1 - Math.pow(1 - k / 0.62, 2)) : V3.lerp(455, CUBE.cy, Math.pow((k - 0.62) / 0.38, 2));
  const sq = t > l ? 1 - 0.04 * Math.sin(V3.clamp((t - l) / 0.3) * Math.PI) : 1;
  ctx.save(); ctx.translate(CUBE.cx, y + CUBE.h0 / 2); ctx.scale(1 / sq, sq); ctx.translate(-CUBE.cx, -(y + CUBE.h0 / 2));
  obj(ctx, 'you', CUBE.cx, y, CUBE.h0); ctx.restore();
}
function shotT(ctx, t) {
  const leave = cubeLand() - 1.1, lk = V3.expoOut(V3.prog(t, 0.2, 0.9)) * (1 - V3.expoInOut(V3.prog(t, leave + 0.1, leave + 0.7)));
  fieldInk(ctx, { pool: [960, 690], spill: '199,234,0', spillA: 0.10 * V3.prog(t, cubeLand() - 0.3, cubeLand()) });
  V3.camera(ctx, { zoom: 1 + 0.025 * V3.approach(t, 3) + 0.003 * t }, () => {
    V3.words(ctx, 'THE FOURTH STEP', t, { x: 960, y: 452, size: 200, color: TITLE_COL, t0: 0.15, stagger: 0.08, leave });
    V3.words(ctx, 'bitcoin · ethereum · monero · tari', t, { x: 960, y: 545, size: 44, fam: 'mono', color: TITLE_COL, t0: 0.5, stagger: 0.05, leave: leave + 0.05 });
    if (lk > 0) { const s = 34 * lk; ctx.save(); ctx.fillStyle = TITLE_COL; ctx.translate(960, 712 - 40 * V3.expoInOut(V3.prog(t, leave + 0.1, leave + 0.7))); ctx.fillRect(-s, -4, 2 * s, 8); ctx.fillRect(-4, -s, 8, 2 * s); ctx.restore(); }
  });
  cubeJump(ctx, t);
}
