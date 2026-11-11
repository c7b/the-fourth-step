'use strict';
// Shots 07–09: 02 Ethereum (B09–B12), the flag (B13–B15), 03 Monero (B16–B21).
// ---------------------------------------------------------------- 07 · 02 Ethereum (+ B12, the t-shirt shop and the hop chain)
const ETH = { you: [960, 600], mods: [['exchange', 520, 470, 'exchanges,'], ['loan', 1400, 470, 'loans,'], ['game', 660, 820, 'games'], ['savings', 1260, 820, 'savings']] };
const CHAIN = [[1290, 420], [1420, 570], [1530, 400], [1620, 620]];      // the customer's coins' history; the last wallet gets flagged (v6: all inside the frame, 170 px margin)
const YOU_B12_X = 640, CUST_X = 1160;   // v6: once the apps have left, you slide left so the customer, the hops and FLAGGED fit
const yourTag = () => [YOU_B12_X - 212, ETH.you[1] - 170, 424, 52, 4];   // v6: the whole "you · t-shirt shop" label turns red; the flag act floods out of it
const ethZoom = t => 1 + 0.02 * V3.approach(t - bs('B09'), 6) + 0.0022 * Math.max(0, t - bs('B09'));
function shot07(ctx, t) {
  const a = bs('B09'), z = ethZoom(t);
  fieldCloud(ctx);
  V3.camera(ctx, { zoom: z }, () => {
    V3.keyLight(ctx, { x: 300, y: -300, r: 1600, col: '255,255,255', a: 0.5 });
    V3.reg(ctx, { pitch: 120, size: 8, color: C.ink, alpha: 0.12, lw: 2, ox: -(t - a) * 14, oy: 60, x0: 0, x1: 1920, y0: 40, y1: 1000 });
    V3.words(ctx, '02', t, { x: 960, y: 820 - 22 * Math.max(0, t - wt('B09', 'Step')), size: 760, color: C.ink, cues: [wt('B09', 'Step')], leave: wt('B09', 'What') - 0.5 });
    V3.words(ctx, 'ethereum · 2015', t, { x: 960, y: 940 - 22 * Math.max(0, t - wt('B09', 'Step')), size: 30, fam: 'mono', color: C.ink, cues: [wt('B09', 'Ethereum,'), wt('B09', '2015.'), wt('B09', '2015.') + 0.1], leave: wt('B09', 'What') - 0.4 });
    const gone = V3.expoInOut(V3.prog(t, wt('B12', 'gets'), wt('B12', 'personal.') + 0.3)), off = -gone * 1500;   // the other apps leave left (one way)
    const slideL = V3.expoInOut(V3.prog(t, wt('B12', 'gets'), wt('B12', 'personal.') + 0.3)), ux = V3.lerp(ETH.you[0], YOU_B12_X, slideL), uy = ETH.you[1], rise = V3.expoOut(V3.prog(t, wt('B09', 'What'), wt('B09', 'notebook') + 0.2));
    // B12 state shared by the layers below (back to front: the line, the coin, the module, the customer)
    const ck = V3.expoOut(V3.prog(t, wt('B12', 'customer'), wt('B12', 'pays'))), cx = V3.lerp(2200, CUST_X, ck);
    const scan = V3.prog(t, wt('B12', 'Software') - 0.1, wt('B12', 'dots.') + 0.2), ssx = V3.lerp(1990, -70, V3.cubicInOut(scan)), sx = (ssx - 960) / z + 960, youTagged = scan > 0 && sx < ux + 40;
    // public lines from you to every app; on B11 they get labelled
    const lk = V3.expoOut(V3.prog(t, wt('B10', 'top.') - 0.4, wt('B10', 'top.') + 0.3));
    ETH.mods.forEach(([name, x, y, cue], i) => { const k = V3.expoOut(V3.prog(t, wt('B10', cue), wt('B10', cue) + 0.45)); if (k <= 0) return;
      const xx = x + off, yy = y + (1 - k) * 600;
      const lr = lk * (1 - V3.clamp(gone * 1.6)); if (lr > 0) { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.setLineDash([2, 9]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(V3.lerp(ux, x + off * 0.3, lr), V3.lerp(uy, yy, lr)); ctx.stroke(); ctx.restore(); }
      appObj(ctx, t, name, xx, yy, 1.25, { t0: a + i * 1.7 }); V3.chip(ctx, name, xx, yy - (R3.has('L08_app_' + name) ? 80 : 95), { size: 20, bg: C.azure, fg: C.cloud, align: 'center', k }); });
    const labels = [['you > loan', wt('B11', 'paid.'), 1], ['you > exchange', wt('B11', 'apps'), 0], ['employer > you', wt('B11', 'deal'), 3]];
    labels.forEach(([s2, tt, mi]) => { const k = V3.expoOut(V3.prog(t, tt, tt + 0.35)); if (k > 0 && gone < 1) { const [, x, y] = ETH.mods[mi]; V3.chip(ctx, s2, x + off, y + 92, { size: 18, bg: C.ink, fg: C.cloud, align: 'center', k }); } });
    // B12: the customer's payment rolls right to left and goes BEHIND the module, so it visibly disappears into it (owner note 1:57)
    if (ck > 0) { const youRed = scan > 0 && sx < cx + 10;   // the line customer ↔ you: behind the coin (owner note v5)
      ctx.save(); ctx.strokeStyle = youRed ? C.red : C.steel; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ux + 215, uy); ctx.lineTo(cx - 90, uy); ctx.stroke(); ctx.restore(); }
    { const pay = V3.prog(t, wt('B12', 'pays'), wt('B12', 'you.', { n: 2 }) + 0.5);   // linear: the coin is in view across the whole gap
      if (pay > 0 && pay < 1) { const px2 = V3.lerp(cx, ux, pay), C4 = R3.has('L22d_stage_coin') ? 'L22d_stage_coin' : 'L04_coin_roll';
        if (R3.has(C4)) { const f0 = R3.evf(C4, 'start', 31), f1 = R3.evf(C4, 'stop', 61), fr = f0 + (f1 - f0) * pay, ce = R3.anchor(C4, 'coin_centre', fr) || [960, 560];
          ctx.save(); ctx.translate(px2, uy - 10); ctx.scale(-0.6, 0.6); R3.at(ctx, R3.frame(C4, fr), 0, 0, 1, { sx: ce[0], sy: ce[1] }); ctx.restore(); }
        else obj(ctx, 'coin', px2, uy - 10, 60, {}); } }
    if (rise > 0) {
      const has10 = R3.has('L10_module_coin') && R3.has('L09_module_idle'), tPut = wt('B09', 'Put'), tIn = wt('B09', 'in,'), tRun = wt('B09', 'rules'), tOut = wt('B09', 'no'), end10 = tOut + (150 - 84) / 30;
      if (has10 && t > tIn - 1.0 && t < end10) R3.at(ctx, R3.warp('L10_module_coin', t, [[tIn - 1.0, 1], [tIn - 0.2, R3.evf('L10_module_coin', 'in', 30)], [tRun, R3.evf('L10_module_coin', 'run', 54)], [tOut + 0.2, R3.evf('L10_module_coin', 'out', 84)]]), ux, uy + (1 - rise) * 700, 1, { sx: 960, sy: 553 });
      else moduleObj(ctx, t, ux, uy + (1 - rise) * 700, 170, { shadow: SHADOW, still: has10 && t <= tIn - 1.0, t0: end10 });
      const shop = V3.prog(t, wt('B12', 't-shirts.'), wt('B12', 't-shirts.') + 0.4);
      V3.chip(ctx, shop > 0 ? 'you · t-shirt shop' : 'you', ux, uy - 130, { size: 22, bg: youTagged ? C.red : C.ink, fg: youTagged ? C.cloud : C.green, align: 'center', k: rise });
      V3.chip(ctx, 'smart contract', ux, uy + 175, { size: 22, bg: C.azure, fg: C.cloud, align: 'center', k: V3.expoOut(V3.prog(t, wt('B09', 'programs?'), wt('B09', 'programs?') + 0.4)) });
      if (t < wt('B10', 'People')) V3.label(ctx, 'money in · the rules run · no clerk', ux, uy + 228, { size: 20, color: C.ink, align: 'center', alpha: V3.prog(t, wt('B09', 'Put'), wt('B09', 'Put') + 0.3) * (1 - V3.prog(t, wt('B10', 'People') - 0.3, wt('B10', 'People'))) });
      // money in, the rules run, money out
      const ci = V3.expoOut(V3.prog(t, wt('B09', 'Put'), wt('B09', 'in,'))), co = V3.expoInOut(V3.prog(t, wt('B09', 'no'), wt('B09', 'them.') + 0.4));
      if (!R3.has('L10_module_coin') && ci > 0 && co < 1 && t < wt('B09', 'them.') + 0.5) { const x = co > 0 ? V3.lerp(ux + 150, 2050, co) : V3.lerp(-100, ux - 150, ci); obj(ctx, 'coin', x, uy + 20, 70, {}); }
      const glow = V3.prog(t, wt('B09', 'rules'), wt('B09', 'rules') + 0.2) * (1 - V3.prog(t, wt('B09', 'own,'), wt('B09', 'own,') + 0.4));
      if (glow > 0 && !R3.has('L10_module_coin')) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(ux - 60, uy - 30, 0, ux - 60, uy - 30, 120); g.addColorStop(0, V3.rgba(C.green, 0.6 * glow)); g.addColorStop(1, 'rgba(201,235,0,0)'); ctx.fillStyle = g; ctx.fillRect(ux - 200, uy - 170, 300, 300); ctx.restore(); }
    }
    // B12: a customer pays you; their coins' history runs back to a wallet someone flagged; the software connects the dots
    if (ck > 0) {
      const chainK = CHAIN.map((_, i) => V3.expoOut(V3.prog(t, wt('B12', 'their') + i * 0.45, wt('B12', 'their') + i * 0.45 + 0.35)));
      let px = cx, py = uy;
      CHAIN.forEach(([x, y], i) => { if (chainK[i] <= 0) return; const red = scan > 0 && sx < x;
        ctx.save(); ctx.strokeStyle = red ? C.red : C.steel; ctx.lineWidth = 3; ctx.setLineDash([2, 9]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(V3.lerp(px, x, chainK[i]), V3.lerp(py, y, chainK[i])); ctx.stroke(); ctx.restore();
        const fl = (i === CHAIN.length - 1 && t > wt('B12', 'flagged.')) || red; ctx.fillStyle = fl ? C.red : C.steel; ctx.fillRect(x - 13, y - 13, 26, 26);
        if (i === CHAIN.length - 1 && t > wt('B12', 'flagged.')) V3.chip(ctx, 'flagged', x, y - 34, { size: 18, bg: C.red, fg: C.cloud, align: 'center' });
        px = x; py = y; });
      steelCube(ctx, t, cx, uy, 130); V3.chip(ctx, 'customer', cx, uy + 120, { size: 20, bg: C.ink, fg: C.cloud, align: 'center', k: ck });
      // (the payment coin is drawn before the module: see payCoin)
      // (v6: no red tag square; the "you · t-shirt shop" label itself turns red as the scanner reaches you)
    }
  });
  { const sc = V3.prog(t, cueAny('B12', 'Software', bs('B12') + 12) - 0.1, cueAny('B12', 'dots.', bs('B12') + 14.3) + 0.2); if (sc > 0 && sc < 1) scanner(ctx, V3.lerp(1990, -70, V3.cubicInOut(sc))); }
  V3.words(ctx, 'PROGRAMMABLE. STILL PUBLIC.', t, { x: 960, y: 230, size: 150, color: C.ink, cues: [wt('B11', 'programs'), wt('B11', 'same'), wt('B11', 'public')], leave: wt('B12', 'Here\'s') - 0.3 });
  const pl = V3.prog(t, wt('B10', 'programmed.'), wt('B10', 'programmed.') + 0.4);
  V3.tracker(ctx, { step: 2, lit: [true, pl > 0 ? V3.expoOut(pl) : false, false], cols: [C.yellow, C.azure, C.steel], fg: C.ink, y: 1046 });
}

// ---------------------------------------------------------------- 08 · the flag (B13–B15)
const FLAGCUBE = { cx: 960, cy: 540, h: 258 }, FLAGSIDE = { cx: 1450, cy: 330 };
const flagZoom = t => 1 + 0.05 * V3.approach(t - bs('B13'), 2.5) + 0.004 * (t - bs('B13'));
// the automated risk review: one solid ink card (the same element comes back in B29, "remember the flag?")
const REVIEW = { x: 72, y: 96, w: 1000, rowH: 50, pad: 28 };
const REVIEW_ROWS = [['ledger', 'one hop from a flagged wallet'], ['account', 'closed · funds frozen'], ['passport', 'high-risk list'], ['place of birth', 'high-risk list'], ['burden of proof', 'on you']];
const reviewH = () => REVIEW.pad * 2 + 46 + REVIEW_ROWS.length * REVIEW.rowH;
// draw the card: rowT[i] = when row i types in (or null), cover(i) = 0..1 violet cover over row i's value, scan(i) = 0..1 red flash
function reviewCard(ctx, t, { x = REVIEW.x, y = REVIEW.y, k = 1, rowT = [], cover, scan, key = 'flag' } = {}) {
  if (k <= 0) return; const { w, rowH, pad } = REVIEW, h = reviewH();
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.shadowColor = 'rgba(4,7,35,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetX = 18; ctx.shadowOffsetY = 24; ctx.fillStyle = C.ink; ctx.fillRect(0, 0, w, h * k); ctx.restore();
  ctx.beginPath(); ctx.rect(0, 0, w, h * k); ctx.clip();
  V3.label(ctx, 'risk review · automated', pad, pad + 26, { size: 30, color: C.frost });
  ctx.fillStyle = C.red; ctx.fillRect(w - pad - 14, pad + 4, 14, 14);
  REVIEW_ROWS.forEach(([k2, v], i) => { const t0 = rowT[i]; if (t0 == null || t < t0) return; const yy = pad + 46 + (i + 1) * rowH - 12;
    V3.monoFont(ctx, 30, 500); V3.text(ctx, k2, pad, yy, { color: C.cloud });
    V3.leader(ctx, pad + 300, pad + 382, yy - 9, { color: C.steel, r: 2, gap: 12 });
    const vx = pad + 400; typedCue(key + '|row' + i, t0 + 0.1, 45, v.length, 30);
    const sc = scan ? scan(i) : 0;
    if (sc > 0) { V3.monoFont(ctx, 30, 500); ctx.fillStyle = V3.rgba(C.red, sc); ctx.fillRect(vx - 10, yy - 31, V3.measure(ctx, v, 30 * 0.02) + 20, 42); }
    V3.typed(ctx, v, vx, yy, t, t0 + 0.1, 45, { size: 30, color: sc > 0.5 ? C.cloud : '#FF6A76', cursor: false });
    const cv = cover ? cover(i) : 0; if (cv > 0) { V3.monoFont(ctx, 30, 500); const tw = V3.measure(ctx, v, 30 * 0.02) + 24; ctx.fillStyle = C.purple; ctx.fillRect(vx - 12, yy - 31, tw * cv, 42); } });
  ctx.restore();
}
function shot08(ctx, t) {
  const a = bs('B13'), z = flagZoom(t), dark = V3.cubicInOut(V3.prog(t, bs('B15') + 0.15, bs('B15') + 2.0));
  // "guilty until proven innocent": everything behind it moves out of the way (owner note 5): the card leaves left, the chip right
  const tg = cueAny('B14', 'guilty', be('B14') - 3), clear = V3.expoInOut(V3.prog(t, tg - 0.9, tg - 0.1));
  V3.camera(ctx, { zoom: z }, () => {
    V3.fill(ctx, C.red); V3.keyLight(ctx, { x: 420, y: -200, r: 1500, col: '255,210,210', a: 0.16 });
    V3.words(ctx, 'FLAGGED', t, { x: 960, y: 1000, size: 470, color: C.ink, cues: [wt('B13', 'software,')], dur: 0.7, track: -2, leave: bs('B14') + 0.2 });
    V3.words(ctx, 'SCORED.', t, { x: 960, y: 1000, size: 470, color: C.ink, cues: [wt('B14', 'scored.')], dur: 0.7, track: -2, leave: tg - 1.0 });
    const k = V3.expoOut(V3.prog(t, wt('B13', 'hop'), wt('B13', 'hop') + 0.5)), side = V3.expoInOut(V3.prog(t, wt('B13', 'To') - 0.2, wt('B13', 'To') + 0.6)) * (1 - clear);
    const fx = V3.lerp(FLAGCUBE.cx, FLAGSIDE.cx, side), fy = V3.lerp(FLAGCUBE.cy, FLAGSIDE.cy, side);
    if (k > 0 && clear < 1) { ctx.save(); ctx.translate(clear * 900, 0); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(FLAGSIDE.cx, FLAGSIDE.cy + 150); ctx.lineTo(FLAGSIDE.cx, FLAGSIDE.cy + 150 + 60 * k); ctx.stroke();
      V3.chip(ctx, 'risk: high · you', FLAGSIDE.cx, FLAGSIDE.cy + 262, { size: 34, bg: C.ink, fg: C.red, align: 'center', k: V3.expoOut(V3.prog(t, wt('B13', 'hop') + 0.3, wt('B13', 'away.') + 0.4)) }); ctx.restore(); }
    if (dark <= 0) youCube(ctx, t, fx, fy, FLAGCUBE.h, { t0: bs('B15') + 0.15 - 40, shadow: { color: 'rgba(40,0,10,0.55)', blur: 26, x: 26, y: 34 } });
  });
  // the review card (solid, never under the giant words' ink): rows type in on their words
  const rowT = [wt('B13', 'away.'), wt('B13', 'closed,'), wt('B14', "passport's"), wt('B14', 'born,'), cueAny('B14', ['prove', 'guilty'], tg)];
  const ck = V3.expoOut(V3.prog(t, wt('B13', 'To'), wt('B13', 'To') + 0.5));
  reviewCard(ctx, t, { x: REVIEW.x - clear * 1300, k: ck, rowT });
  // the line, framed around the cube: above and below it, so it hides nothing
  V3.words(ctx, 'GUILTY UNTIL', t, { x: 960, y: 330, size: 250, color: C.ink, t0: tg, stagger: 0.08, leave: bs('B15') + 0.1 });
  V3.words(ctx, 'PROVEN INNOCENT.', t, { x: 960, y: 930, size: 250, color: C.ink, t0: cueAny('B14', 'prove', tg + 1.1), stagger: 0.08, leave: bs('B15') + 0.15 });
  const ph = t * 40;
  V3.stripes(ctx, 0, 0, 1920, 46 * (1 - clear * 0.6), { period: 34, fg: C.ink, phase: ph }); V3.stripes(ctx, 0, 1034 - 0 * clear, 1920, 22, { period: 34, fg: C.ink, phase: ph });
  V3.words(ctx, 'a guess, not proof.', t, { x: REVIEW.x + 24, y: 560, size: 54, fam: 'sans', weight: 600, color: C.ink, align: 'left', cues: phrase('B13', 'a guess, not proof.'), leave: wt('B13', 'It') - 0.5 });
  const qc = phrase('B13', 'It had nothing to do with anything that the person in question did.');
  V3.words(ctx, ['“it had nothing to do with anything', 'that the person in question did.”'], t, { x: REVIEW.x + 24, y: 540, size: 38, fam: 'sans', weight: 600, color: C.ink, align: 'left', cues: qc, leave: bs('B14') + 0.3 });
  V3.label(ctx, 'kim · 36c3', REVIEW.x + 24, 640, { size: 30, color: C.ink, align: 'left', alpha: V3.prog(t, wt('B13', 'did.'), wt('B13', 'did.') + 0.3) * (1 - V3.prog(t, bs('B14') + 0.3, bs('B14') + 0.6)) });
  V3.vignette(ctx, 0.35, '120,0,20');
  // B15: the key light dims; red sinks to ink; the cube alone stays lit, eases to the ring's front-block pose and turns Monero orange
  dimTo(ctx, dark);
  if (dark > 0) flagCubeB15(ctx, t, z);
}
// the cube during B15: from the flag pose to L11a's frame-1 pose (body 300 at 960,520); the lime turns frosted orange top-down
function flagCubeB15(ctx, t, z) {
  const mv = V3.cubicInOut(V3.prog(t, bs('B15') + 0.2, be('B15') - 0.4)), h = V3.lerp(FLAGCUBE.h * z, 300, mv), cy = V3.lerp(FLAGCUBE.cy, CUBE3_CY, mv), cx = V3.lerp(960, 958, mv);
  const tf = be('B15') - 1.4, id = 'L12_cube_to_monero';
  if (R3.has(id)) { R3.at(ctx, R3.clip(id, t, tf), cx, cy, h / 300, { sx: 958, sy: CUBE3_CY }); return; }
  youCube(ctx, t, cx, cy, h, { t0: bs('B15') + 0.15 - 40 });
  const fr = V3.prog(t, tf, tf + 1.2);
  if (fr > 0) { const s = SPR.glass, hh = h / s.body, y0 = cy - hh / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0 - 40, 1920, (hh + 80) * V3.cubicInOut(fr)); ctx.clip(); V3.fill(ctx, C.ink); monero2D(ctx, 960, cy, h); ctx.restore(); }
}
// a Monero block, 2D fallback: the glass sprite tinted orange (the Blender block replaces it)
function monero2D(ctx, cx, cy, bodyH, o = {}) { const s = SPR.glass; return V3.sprite(ctx, orangeGlass(), cx, cy, bodyH / s.body, o); }

// ---------------------------------------------------------------- 09 · 03 Monero (B16–B21)
const RING = { N: 16, R: 560, H: 205, cam: { y: 430, z: 1700, f: 1250, lookY: -40 }, focus: 1700 - 560 };
function ringProject(x, y, z) {
  const c = RING.cam, pitch = Math.atan2(c.y - c.lookY, c.z), dy = y - c.y, dz = z - c.z;
  const yy = dy * Math.cos(pitch) - dz * Math.sin(pitch), zz = dy * Math.sin(pitch) + dz * Math.cos(pitch), d = -zz, k = c.f / d;
  return { x: 960 + x * k, y: 640 - yy * k, k, d };
}
// ring angle: still while you are alone, a fast spin on "nobody can tell which one is you" (fast, then slow for longer), then a slow drift
const ringAngle = t => { const s0 = wt('B17', 'nobody'), c0 = wt('B17', 'crowd'); return (t > s0 ? 7.2 * V3.approach(t - s0, 0.9) : 0) + 0.06 * Math.max(0, t - c0); };
const frontPos = () => ringProject(0, 0, RING.R);
function ring(ctx, t, { appear = 1, lit = [], wake = 1 } = {}) {
  const a0 = ringAngle(t), items = [];
  for (let i = 0; i < RING.N; i++) { const ap = i === 0 ? 1 : V3.expoOut(V3.prog(appear, (i - 1) / 15 * 0.7, (i - 1) / 15 * 0.7 + 0.3)); if (ap <= 0) continue;
    const a = a0 + i * Math.PI * 2 / RING.N; items.push({ i, ap, p: ringProject(Math.sin(a) * RING.R, -(1 - ap) * 500, Math.cos(a) * RING.R), r: ringProject(Math.sin(a) * RING.R, -230, Math.cos(a) * RING.R) }); }
  items.sort((A2, B2) => B2.p.d - A2.p.d);
  const og = orangeGlass();
  for (const it of items) { const h = RING.H * it.p.k, blur = Math.min(9, Math.abs(it.p.d - RING.focus) * 0.011), dim = V3.clamp(1.15 - (it.p.d - RING.focus) / 1500, 0.35, 1);
    ctx.save(); ctx.globalAlpha = 0.08 * dim * it.ap * wake; ctx.translate(it.r.x, it.r.y + h * 0.18); ctx.scale(1, -0.6); if (blur + 3 > 0.3) ctx.filter = `blur(${(blur + 3) * V3.S}px)`;
    ctx.drawImage(og, -h * og.width / og.height / 2, -h / 2, h * og.width / og.height, h); ctx.restore();
    const li = lit.find(l => l.i === it.i); if (li && li.k > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(it.p.x, it.p.y + h * 0.3, 0, it.p.x, it.p.y + h * 0.3, h * 1.1); g.addColorStop(0, `rgba(236,238,255,${0.35 * li.k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(it.p.x - h * 1.2, it.p.y - h, h * 2.4, h * 2.6); ctx.restore(); }
    V3.sprite(ctx, og, it.p.x, it.p.y - h * 0.08, h, { blur, alpha: dim * V3.clamp(it.ap * 1.5) });
    it.screen = { x: it.p.x, y: it.p.y - h * 0.6 }; }
  return items;
}
// the Blender ring (L11a then L11b), retimed so its events land on the words: pull back on "crowd", the fast spin on "nobody"
const RING3 = { form: 'L11a_ring_form', loop: 'L11b_ring_loop' };
function ringEndT() { const id = RING3.form; return Math.max(wt('B17', 'nobody'), wt('B17', 'crowd') + 1.2) + (R3.MAN[id].frames - R3.evf(id, 'spin', 165)) / 30; }
function ring3D(ctx, t) {
  const id = RING3.form, c0 = wt('B17', 'crowd'), s0 = wt('B17', 'nobody');
  const pb = R3.evf(id, 'pullback_start', 60), cr = R3.evf(id, 'crowd', 69), sp = R3.evf(id, 'spin', 165);
  // frames 1..pb play natively from the cut (the floor reflection fades in there, owner note 2:44), hold, then pull back on "crowd"
  const b16 = bs('B16'), hold0 = b16 + (pb - 1) / 30;
  if (t < ringEndT()) return R3.full(ctx, R3.warp(id, t, [[b16, 1], [hold0, pb], [Math.max(hold0, c0 - 0.1 - (cr - pb) / 30), pb], [c0 - 0.1, cr], [Math.max(s0, c0 + 1.2), sp]]));
  return R3.full(ctx, R3.loop(RING3.loop, t, ringEndT()));
}
// B21: the split, 0 → 1 between "So" and "programmable"
const splitK = t => V3.expoInOut(V3.prog(t, wt('B21', 'Monero') - 0.1, wt('B21', 'apps.') + 0.2));   // v6: the ring moves aside AS the module enters (owner)
const SPLIT = { s: 0.56, x: 1440, y: 660 }, RC = [954, 745];   // the ring's centre and scale on the right half; RC = the blocks' centre in the render
let RINGOFF = null;
function shot09(ctx, t) {
  const a = bs('B16'); if (R3.has(RING3.form) && R3.has(RING3.loop)) V3.fill(ctx, '#040723'); else fieldInk(ctx, { pool: [960, 760], spill: '150,156,190', spillA: 0.12 });   // v6: flat ink = the ring render's own background, so the split has no seam
  const has3 = R3.has(RING3.form) && R3.has(RING3.loop);
  const sp = splitK(t);
  if (has3) { if (sp <= 0) ring3D(ctx, t);
    else { const sc = V3.lerp(1, SPLIT.s, sp), cxr = V3.lerp(RC[0], SPLIT.x, sp), cyr = V3.lerp(RC[1], SPLIT.y, sp);
      if (R3.has('L11b_ring_loop_alpha') && t >= ringEndT()) {   // the alpha ring (+ its floor reflections, screened) scales cleanly over the field
        R3.at(ctx, R3.loop('L11b_ring_loop_alpha', t, ringEndT()), cxr, cyr, sc, { sx: RC[0], sy: RC[1] }); }
      else { // the opaque frame, feathered with an ellipse that stays inside the frame (no edge line), over the same flat ink
        const ow = 1200, oh = 675, k = ow / V3.W; RINGOFF = RINGOFF || V3.canvas(ow, oh); const g = RINGOFF.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, ow, oh);
        g.save(); g.scale(k, k); ring3D(g, t); g.restore();
        g.globalCompositeOperation = 'destination-in'; g.save(); g.translate(RC[0] * k, RC[1] * k); g.scale(1, 0.56); const rx = 600 * k, mg = g.createRadialGradient(0, 0, 0, 0, 0, rx); mg.addColorStop(0, 'rgba(0,0,0,1)'); mg.addColorStop(0.8, 'rgba(0,0,0,1)'); mg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = mg; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); g.globalCompositeOperation = 'source-over';
        ctx.drawImage(RINGOFF, cxr - RC[0] * sc, cyr - RC[1] * sc, V3.W * sc, V3.H * sc); } } }
  // 2:45 (owner, v6): the floor reflection is revealed by a wipe from the block's base downward, so nothing pops at the cut
  if (has3 && t < a + 1.6) { const wb = V3.expoInOut(V3.prog(t, a + 0.05, a + 1.4)), y0 = 672, yw = V3.lerp(y0, 1140, wb), fe = 70;
    ctx.save(); ctx.fillStyle = '#040723'; ctx.fillRect(0, yw + fe, V3.W, V3.H - yw); const g2 = ctx.createLinearGradient(0, yw, 0, yw + fe); g2.addColorStop(0, 'rgba(4,7,35,0)'); g2.addColorStop(1, 'rgba(4,7,35,1)'); ctx.fillStyle = g2; ctx.fillRect(0, yw, V3.W, fe); ctx.restore(); }
  { V3.display(ctx, 1100); const m0 = ctx.measureText('0'), base = 540 + m0.actualBoundingBoxAscent / 2;   // like 01: the block sits in the zero's counter
    ctx.save(); if (has3) ctx.globalCompositeOperation = 'lighten';
    V3.words(ctx, '03', t, { x: 960 - m0.width / 2, y: base, size: 1100, align: 'left', color: MONERO_DEEP, cues: [wt('B16', '2014,')], leave: wt('B16', 'Monero') + 0.8, track: -6 }); ctx.restore(); }
  let Z = 1, tx = 0, ty = 0, items = [];
  if (!has3) {
    // camera: starts close on the one block (the same size and place as the flag cube's end pose), pulls back to the ring on "crowd"
    const fp = frontPos(), h0 = RING.H * fp.k * SPR.glass.body, Z0 = 300 / h0;
    const pull = V3.approach(t - wt('B17', 'crowd') + 0.6, 1.3); Z = t < wt('B17', 'crowd') - 0.6 ? Z0 : V3.lerp(Z0, 1, pull);
    const fy = fp.y - RING.H * fp.k * 0.08; tx = V3.lerp(960 - fp.x, 0, (Z0 - Z) / (Z0 - 1)); ty = V3.lerp(520 - fy, 0, (Z0 - Z) / (Z0 - 1));
    const pool = ringProject(0, -110, 0), wake = V3.cubicInOut(V3.prog(t, a, a + 1.6));
    ctx.save(); if (sp > 0) { ctx.translate(V3.lerp(0, SPLIT.x - 960, sp), V3.lerp(0, SPLIT.y - 600, sp)); ctx.translate(960, 600); ctx.scale(V3.lerp(1, SPLIT.s, sp), V3.lerp(1, SPLIT.s, sp)); ctx.translate(-960, -600); }
    ctx.translate(960, 540); ctx.scale(Z, Z); ctx.translate(-960 + tx, -540 + ty);
    ctx.save(); ctx.translate(pool.x, pool.y); ctx.scale(1, 0.26); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 900); g.addColorStop(0, `rgba(150,156,190,${0.16 * wake})`); g.addColorStop(0.55, `rgba(150,156,190,${0.05 * wake})`); g.addColorStop(1, 'rgba(150,156,190,0)'); ctx.fillStyle = g; ctx.fillRect(-1000, -1000, 2000, 2000); ctx.restore();
    const appear = V3.prog(t, wt('B17', 'crowd') - 0.3, wt('B17', 'decoys,') + 0.6);
    const lit = [[1, 'shop'], [15, 'nurse'], [2, 'person']].map(([i, w]) => ({ i, k: V3.expoOut(V3.prog(t, wt('B20', w), wt('B20', w) + 0.4)) * (1 - V3.prog(t, be('B20') - 0.2, be('B20') + 0.3)) }));
    items = ring(ctx, t, { appear, lit, wake });
    ctx.restore();
  }
  // B16: 03 · Monero · 2014 rises behind; "private by default"
  V3.words(ctx, 'monero · 2014', t, { x: 960, y: 360, size: 30, fam: 'mono', color: C.frost, cues: [wt('B16', 'Monero'), wt('B16', 'Monero') + 0.1, wt('B16', 'Monero') + 0.2], leave: wt('B16', 'make') - 0.3 });
  V3.words(ctx, 'PRIVATE BY DEFAULT.', t, { x: 960, y: 250, size: 170, color: C.cloud, cues: [wt('B16', 'private,'), wt('B16', 'by'), wt('B16', 'default.')], leave: be('B16') + 0.3 });
  // B17: one of these is you; the amount; the one-time address
  V3.chip(ctx, 'one of these is you', 960, 978, { size: 30, align: 'center', bg: MONERO, fg: C.ink, k: V3.expoOut(V3.prog(t, wt('B17', 'you.', { n: 2 }), wt('B17', 'you.', { n: 2 }) + 0.4)) * (1 - V3.prog(t, bs('B18'), bs('B18') + 0.3)) });
  const ka = V3.expoOut(V3.prog(t, wt('B17', 'hidden.'), wt('B17', 'hidden.') + 0.4)) * (1 - V3.prog(t, bs('B18') - 0.2, bs('B18') + 0.2));
  if (ka > 0) { V3.chip(ctx, 'amount', 760, 260, { size: 30, bg: C.steel, fg: C.cloud, align: 'right', k: ka }); ctx.fillStyle = C.steel; ctx.fillRect(776, 222, 220 * ka, 44); }
  const kd = V3.prog(t, wt('B17', 'fresh,'), wt('B17', 'address.') + 0.6);
  if (kd > 0 && t < bs('B18') + 0.2) { V3.label(ctx, 'receiver · one-time address', 1060, 235, { size: 30, color: C.frost }); const r = V3.rng(Math.floor(t * 12)); let s = ''; for (let i = 0; i < 18; i++) s += '0123456789abcdef'[Math.floor(r() * 16)];
    V3.monoFont(ctx, 34, 500); V3.text(ctx, s.slice(0, Math.floor(18 * Math.min(1, kd * 2))), 1060, 290, { color: C.cloud, alpha: 1 - V3.prog(kd, 0.7, 1) }); }
  // B18: the glass banknote rises in front, its owner list is wiped; it keeps rising and leaves (owner note 10: big, high contrast, held)
  glassNote(ctx, t);
  V3.words(ctx, 'MONEY WITH NO MEMORY.', t, { x: 960, y: 220, size: 160, color: C.cloud, cues: phrase('B18', 'money with no memory.'), leave: be('B18') - 0.2 });
  // B20: the objection, and the answer
  V3.label(ctx, 'objection', 960, 150, { size: 30, color: C.steel, align: 'center', alpha: V3.prog(t, wt('B20', "Isn't"), wt('B20', "Isn't") + 0.3) * (1 - V3.prog(t, be('B20') - 0.3, be('B20'))) });
  V3.words(ctx, 'Isn’t privacy just for criminals?', t, { x: 960, y: 220, size: 52, fam: 'sans', weight: 600, color: C.frost, cues: phrase('B20', "Isn't privacy just for criminals?"), leave: be('B20') - 0.4 });
  V3.words(ctx, 'NO.', t, { x: 960, y: 470, size: 230, color: C.cloud, cues: [wt('B20', 'No.')], leave: wt('B20', 'shop') - 0.45 });
  // the three people: one row of chips (never on top of each other, owner note 3:25), each with a leader down to its block
  if (t > wt('B20', 'shop') - 0.2 && t < be('B20') + 0.2) {
    const who = [[1, 'shop owner', 'shop', 540], [15, 'nurse', 'nurse,', 960], [2, 'sending money home', 'person', 1380]];
    who.forEach(([i, s2, w, fx]) => { const kk = V3.expoOut(V3.prog(t, wt('B20', w), wt('B20', w) + 0.35)) * (1 - V3.prog(t, be('B20') - 0.3, be('B20')));
      if (kk <= 0) return;
      let p = null;
      if (has3) { const an = { 1: 'block_front_left', 15: 'front_block', 2: 'block_front_right' }[i]; p = R3.anchor(RING3.loop, an, 1); if (p) p = [p[0], p[1] - 70]; }
      else { const it = items.find(x => x.i === i); if (it && it.screen) p = [(it.screen.x - 960) * Z + 960 + tx * Z, (it.screen.y - 540) * Z + 540 + ty * Z]; }
      if (p) { ctx.save(); ctx.strokeStyle = V3.rgba(C.cloud, 0.8 * kk); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, 416); ctx.lineTo(V3.lerp(fx, p[0], kk), V3.lerp(416, p[1], kk)); ctx.stroke(); ctx.fillStyle = C.cloud; if (kk > 0.95) { ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
      V3.chip(ctx, s2, fx, 400, { size: 34, bg: C.cloud, fg: C.ink, align: 'center', k: kk }); }); }
  // B21: a program module drifts in from the left and stops at the ring: it doesn't fit. Then the two roads split apart:
  // programmable on the left, private on the right, the ring shrinking to make room (owner note 3:33)
  const mk = splitK(t);   // v6: the module enters exactly as the ring moves aside (same curve), so they never overlap
  if (mk > 0) { const mx = V3.lerp(-300, 480, mk), my = 660, mh = V3.lerp(180, 230, mk);
    moduleObj(ctx, t, mx, my, mh); V3.chip(ctx, 'programs: not here', mx, 820, { size: 30, bg: C.azure, fg: C.cloud, align: 'center', k: V3.prog(t, wt('B21', 'apps.'), wt('B21', 'apps.') + 0.3) * (1 - V3.prog(t, wt('B21', 'So') - 0.3, wt('B21', 'So'))) }); }
  V3.words(ctx, 'ONE PROGRAMMABLE.', t, { x: 480, y: 330, size: 104, color: C.cloud, t0: wt('B21', 'programmable,'), stagger: 0.08 });
  V3.words(ctx, 'ONE PRIVATE.', t, { x: 1440, y: 330, size: 104, color: C.cloud, t0: wt('B21', 'private.', { n: 2 }), stagger: 0.08 });
  const pk = V3.prog(t, wt('B16', 'default.'), wt('B16', 'default.') + 0.4);
  V3.tracker(ctx, { alpha: V3.cubicInOut(V3.prog(t, a, a + 1.6)), step: 3, lit: [true, true, pk > 0 ? V3.expoOut(pk) : false], cols: [C.yellow, C.azure, C.steel], fg: C.cloud, y: 1046 });
  V3.vignette(ctx, 0.5);
}
// B18: the glass banknote (Blender L13_glass_note, face-on, 900 px wide at (960, 600) on hold; else the 2D sprite)
const OWNERS = ['owner 1 · 2016', 'owner 2 · 2018', 'owner 3 · 2019', 'owner 4 · 2021', 'owner 5 · 2023', 'owner 6 · 2025'];
function glassNote(ctx, t) {
  const t0 = wt('B18', 'banknote') - 0.35, tw = wt('B18', 'wipes'), tOut = be('B18') - 0.5;
  const nIn = V3.expoOut(V3.prog(t, t0, t0 + 0.8)), nOut = V3.expoInOut(V3.prog(t, tOut, tOut + 0.9)); if (nIn <= 0 || nOut >= 1) return;
  const id = 'L13_glass_note', ny = V3.lerp(1500, 600, nIn) - nOut * 1400;
  if (R3.has(id)) { const hold = R3.has(id + '_hold') ? id + '_hold' : null;
    const img = t < t0 + 0.8 ? R3.clip(id, t, t0) : t < tOut ? (hold ? R3.frame(hold, 1) : R3.frame(id, 1 + 30 + 24)) : R3.clip(id, t, tOut - 1.4);
    R3.full(ctx, img); }
  else obj(ctx, 'note', 960, ny, 400, {});
  // the owner list, written on the glass: two columns, 36 px, cloud on the glass with an ink edge; wiped right to left on "wipes"
  OWNERS.forEach((o, i) => { const tl = wt('B18', 'owner') + i * 0.14, k = V3.expoOut(V3.prog(t, tl, tl + 0.25)), wipe = V3.cubicInOut(V3.prog(t, tw + (5 - i) * 0.08, tw + (5 - i) * 0.08 + 0.3)); if (k <= 0 || wipe >= 1) return;
    const big = R3.has('L13_glass_note'), fz = big ? 42 : 36, col = i < 3 ? 0 : 1, row = i % 3, xx = 960 + (col ? (big ? 50 : 40) : (big ? -410 : -380)), yy = ny - (big ? 78 : 70) + row * (big ? 76 : 66);
    ctx.save(); ctx.beginPath(); ctx.rect(xx + 400 * wipe, yy - 46, 420, 62); ctx.clip(); V3.monoFont(ctx, fz, 500);
    ctx.shadowColor = 'rgba(4,7,35,0.9)'; ctx.shadowBlur = 8; V3.text(ctx, o, xx, yy, { color: C.cloud, alpha: k }); ctx.restore(); });
  V3.chip(ctx, 'back of the note: every past owner', 960, ny - 230, { size: 34, bg: C.cloud, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('B18', 'owner') - 0.3, wt('B18', 'owner') + 0.2)) * (1 - V3.prog(t, tw + 0.5, tw + 0.8)) });
}
