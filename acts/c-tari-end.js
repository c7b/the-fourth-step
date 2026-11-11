'use strict';
// Shots 10–16: 04 Tari, two layers, stealth / view key / one-way door, how it runs (B27A), why it matters, coda, end card.
// ---------------------------------------------------------------- 10 · 04 Tari (B22)
function shot10(ctx, t) {
  const a = bs('B22'); fieldInk(ctx, {});
  const shrink = V3.expoInOut(V3.prog(t, wt('B22', "That's") - 0.3, wt('B22', 'Tari.') - 0.05)), bh = V3.lerp(300, 6, shrink), by = 570 - bh / 2;
  const off0 = Math.max(wt('B22', 'Tari.') + 0.7, bs('B23') - 1.25), off1 = bs('B23') - 0.5, tv = V3.expoInOut(V3.prog(t, off0, off1)), half = 960 * (1 - tv);
  const g = ctx.createLinearGradient(0, 0, 1920, 0); C.glitch.forEach(([s, c]) => g.addColorStop(s, c)); ctx.fillStyle = g; if (tv < 1) ctx.fillRect(960 - half, by, 2 * half, bh);
  const dot = 1 - V3.prog(t, off1, off1 + 0.15); if (tv >= 1 && dot > 0) { ctx.fillStyle = C.cloud; ctx.beginPath(); ctx.arc(960, 570, 6 * dot, 0, Math.PI * 2); ctx.fill(); }
  const z = 1 + 0.02 * V3.approach(t - a, 3);
  V3.camera(ctx, { zoom: z }, () => {
    V3.words(ctx, '04', t, { x: 960, y: 830, size: 760, color: C.cloud, cues: [wt('B22', 'Step')], leave: wt('B22', "That's") - 0.45 });
    V3.words(ctx, '04 · tari', t, { x: 960, y: 950, size: 30, fam: 'mono', color: C.cloud, cues: [wt('B22', 'four'), wt('B22', 'four') + 0.1, wt('B22', 'four') + 0.2], leave: wt('B22', "That's") - 0.4 });
  });
  V3.words(ctx, 'PROGRAMS ON A PRIVATE NETWORK.', t, { x: 960, y: 200, size: 120, color: C.cloud, cues: [wt('B22', 'programs'), wt('B22', 'on'), wt('B22', 'a'), wt('B22', 'private'), wt('B22', 'network.')], leave: wt('B22', "That's") - 0.35 });
  // the logo, exactly as the kit gives it, rises through a mask on "Tari."
  const e = V3.quartOut(V3.prog(t, wt('B22', 'Tari.') - 0.1, wt('B22', 'Tari.') + 0.8)), LH = 150;
  if (e > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 470 - LH / 2 - 10, 1920, LH + 20); ctx.clip(); V3.logo(ctx, V3.IMG.logo, 960, 470 + (1 - e) * (LH + 20), LH); ctx.restore(); }
}

// ---------------------------------------------------------------- 11 · two layers (B23–B24)
const TOWER = { w: 3548, h: 1996, crownTop: 425, crownBottom: 1277, cx: (1071 + 2477) / 2, s: 0.40 };
const TOWER3 = { build: 'L14a_tower_build', orbit: 'L14b_tower_orbit' };
const towerXY = () => [960 - TOWER.cx * TOWER.s, 272 - TOWER.crownTop * TOWER.s];
const has3Tower = () => R3.has(TOWER3.build) && R3.has(TOWER3.orbit);
const crownRect = () => { if (has3Tower()) return [640, 270, 640, 360, 0]; const [x, y] = towerXY(); return [x + 1071 * TOWER.s, y + TOWER.crownTop * TOWER.s, 1406 * TOWER.s, (TOWER.crownBottom - TOWER.crownTop) * TOWER.s, 0]; };
const towerZoom = t => 1 + 0.035 * V3.approach(t - bs('B23'), 2.4) + 0.003 * (t - bs('B23'));
const towerBuildA = () => bs('B23') + 0.3, towerOrbitA = () => towerBuildA() + 3.0;
// label anchors: [right of the crown (x, y), left of the base (x, y)] in shot space
function towerAnchors(t) {
  if (has3Tower()) { const id = TOWER3.orbit, f = Math.max(1, 1 + Math.floor((t - towerOrbitA()) * 30));
    const cr = R3.anchor(id, 'crown_right_edge', f) || [1300, 550], bl = R3.anchor(id, 'base_left_edge', f) || [640, 1060]; return { xR: cr[0] + 10, crownMidY: Math.min(cr[1], 560), xL: bl[0] - 10, baseY: Math.min(bl[1], 780) }; }
  const [x, y] = towerXY(), s = TOWER.s; return { xR: x + 2477 * s - 40, crownMidY: y + (TOWER.crownTop + TOWER.crownBottom) / 2 * s, xL: x + 1071 * s + 40, baseY: y + (TOWER.crownBottom + 260) * s };
}
function shot11(ctx, t) {
  const a = bs('B23'), z = towerZoom(t);
  fieldInk(ctx, { pool: [960, 900], spill: '129,59,245', spillA: 0.16 });
  V3.camera(ctx, { zoom: z }, () => {
    V3.keyLight(ctx, { x: 520, y: -260, r: 1400, col: '129,59,245', a: 0.18 });
    if (has3Tower()) {   // the Blender tower: it builds itself (base up, violet crown clicks in), then a slow one-way orbit with a living crown
      // 1:1 handoff (owner note 3:52): L14a to the end of its action (frame 121 = its end pose), then L14b from ITS frame 1 (the same pose)
      const img = t < towerOrbitA() ? R3.clip(TOWER3.build, t, towerBuildA()) : R3.frame(TOWER3.orbit, 1 + Math.floor((t - towerOrbitA()) * 30));
      R3.full(ctx, img);
    } else {
      const [x, y] = towerXY(), s = TOWER.s;
      ctx.drawImage(V3.IMG.tower, x, y, TOWER.w * s, TOWER.h * s);
      const fo = ctx.createLinearGradient(0, y + 1500 * s, 0, y + TOWER.h * s); fo.addColorStop(0, 'rgba(4,7,35,0)'); fo.addColorStop(1, 'rgba(4,7,35,1)'); ctx.fillStyle = fo; ctx.fillRect(0, y + 1500 * s, 1920, (TOWER.h - 1500) * s + 200);
    }
    V3.words(ctx, 'TWO LAYERS.', t, { x: 960, y: has3Tower() ? 236 : 292, size: 220, color: C.cloud, cues: [wt('B23', 'two'), wt('B23', 'layers.')] });   // final: above the crown, drawn over it
    const { xR, crownMidY, xL, baseY } = towerAnchors(t);
    // the base layer (left) and the Ootle (right): one name and one plain chip each (owner: fewer terms at once)
    const tBase = cueAny('B23', ['base'], a + 2.5), tXtm = cueAny('B23', ['XTM.'], a + 4), tMin = cueAny('B23', ['Miners', 'mined'], a + 5.5), tXmr = cueAny('B23', ['Monero'], a + 7.5);
    const tOot = cueAny('B24', ['Ootle,'], bs('B24') + 0.8), tApps = cueAny('B24', ['apps.', 'programs.'], bs('B24') + 2.5);
    const la = V3.expoOut(V3.prog(t, tOot, tOot + 0.5)), lb = V3.expoOut(V3.prog(t, tBase, tBase + 0.5));
    ctx.save(); ctx.strokeStyle = C.cloud; ctx.lineWidth = 2;
    if (la > 0) { ctx.globalAlpha = la; ctx.beginPath(); ctx.moveTo(xR, crownMidY); ctx.lineTo(xR + 150 * la, crownMidY); ctx.stroke(); }
    if (lb > 0 && !has3Tower()) { ctx.globalAlpha = lb; ctx.beginPath(); ctx.moveTo(xL, baseY); ctx.lineTo(xL - 150 * lb, baseY); ctx.stroke(); } ctx.restore();
    if (has3Tower()) {   // the Blender tower is wide: both labels live in the right column, the crown's up top, the base's below it
      const rx = 1320, by = 770, bxR = 1265;
      ctx.save(); ctx.strokeStyle = C.cloud; ctx.lineWidth = 2; if (lb > 0) { ctx.globalAlpha = lb; ctx.beginPath(); ctx.moveTo(bxR, by - 20); ctx.lineTo(V3.lerp(bxR, rx - 20, lb), by - 20); ctx.stroke(); } ctx.restore();
      V3.words(ctx, 'OOTLE', t, { x: rx, y: crownMidY - 18, size: 56, fam: 'wide', color: C.cloud, align: 'left', cues: [tOot] });
      V3.chip(ctx, 'the layer for apps', rx, crownMidY + 40, { size: 30, bg: C.purple, fg: C.cloud, k: V3.expoOut(V3.prog(t, tApps, tApps + 0.4)) });
      V3.words(ctx, 'BASE LAYER', t, { x: rx, y: by, size: 56, fam: 'wide', color: C.cloud, align: 'left', cues: [tBase, tBase + 0.2] });
      V3.chip(ctx, 'coin: xtm', rx, by + 58, { size: 30, bg: C.yellow, fg: C.ink, k: V3.expoOut(V3.prog(t, tXtm, tXtm + 0.4)) });
      V3.label(ctx, 'kept safe by miners', rx, by + 120, { size: 30, color: C.frost, alpha: V3.prog(t, tMin, tMin + 0.3) });
      const mk3 = V3.expoOut(V3.prog(t, tXmr, tXmr + 0.6)); if (mk3 > 0) { moneroBlock(ctx, t, rx + 26, by + 175, 56 * mk3); V3.label(ctx, 'same miners as monero', rx + 66, by + 186, { size: 30, color: C.frost, alpha: V3.prog(t, tXmr + 0.3, tXmr + 0.6) }); }
      return;
    }
    const rx = xR + 170, lx = xL - 170;
    V3.words(ctx, 'OOTLE', t, { x: rx, y: crownMidY - 18, size: 56, fam: 'wide', color: C.cloud, align: 'left', cues: [tOot] });
    V3.chip(ctx, 'the layer for apps', rx, crownMidY + 40, { size: 30, bg: C.purple, fg: C.cloud, k: V3.expoOut(V3.prog(t, tApps, tApps + 0.4)) });
    V3.words(ctx, 'BASE LAYER', t, { x: lx, y: baseY - 18, size: 56, fam: 'wide', color: C.cloud, align: 'right', cues: [tBase, tBase + 0.2] });
    V3.chip(ctx, 'coin: xtm', lx, baseY + 40, { size: 30, bg: C.yellow, fg: C.ink, align: 'right', k: V3.expoOut(V3.prog(t, tXtm, tXtm + 0.4)) });
    V3.label(ctx, 'kept safe by miners', lx, baseY + 104, { size: 30, color: C.frost, align: 'right', alpha: V3.prog(t, tMin, tMin + 0.3) });
    // the same miners secure both: a small Monero block linked to the base
    const mk = V3.expoOut(V3.prog(t, tXmr, tXmr + 0.6));
    if (mk > 0) { const gx = xL - 40, gy = Math.min(baseY + 165, 950); ctx.save(); ctx.strokeStyle = MONERO; ctx.setLineDash([2, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + 60, gy - 10); ctx.lineTo(V3.lerp(gx + 60, xL - 10, mk), V3.lerp(gy - 10, baseY + 30, mk)); ctx.stroke(); ctx.restore();
      moneroBlock(ctx, t, gx, gy, 80 * mk); V3.label(ctx, 'same miners as monero', gx - 70, gy + 12, { size: 30, color: C.frost, align: 'right', alpha: V3.prog(t, tXmr + 0.3, tXmr + 0.6) }); }
  });
  V3.tracker(ctx, { step: 4, lit: [true, true, true], cols: [C.purple, C.purple, C.purple], fg: C.cloud, y: 1046 });
  V3.vignette(ctx, 0.45);
}

// ---------------------------------------------------------------- 12 · stealth, view key, the one-way door (B25–B27)
const stealthCam = t => { const lt = Math.max(0, t - bs('B25')), c = V3.orbit([0, 0, 0], 1150 - 120 * V3.approach(lt, 4), (24 - 6 * V3.approach(lt, 6)) * Math.PI / 180, 0, 2000); c.cy = 560; return c; };
// the Blender plate on dark (L19b): the statement face, the values-hidden face and the all-hidden face, same camera
function plate19() { const ids = Object.keys(R3.MAN).filter(k => k.startsWith('L19b_plate_dark_')), f = w => ids.find(k => k.includes(w));
  const st = f('statement'), vh = f('values'), ah = ids.find(k => /all/.test(k)); return st && vh && ah ? { st, vh, ah } : null; }
const TARIBLOCK = [1240, 410, 260, 260, 0];
// v6: the burn mark. One position for both glyphs; it enters the door on "burn" and comes out the far side as Tari right away
const BURN = { y: 540, s: 210, x0: 420, x1: 1370 };
const burnMarkX = t => V3.lerp(BURN.x0, BURN.x1, V3.cubicInOut(V3.prog(t, wt('B27', 'burn') + 0.1, wt('B27', 'XTM') + 1.1)));
// the official glyphs, no tiles: XTM = the lime gem (brand/XTM.svg without its background rect), Tari = the white gem (Tari-White@2x, cropped to the mark)
function glyph(ctx, which, cx, cy, h) { if (which === 'xtm') { const w = h * 1372 / 1416; ctx.drawImage(V3.IMG.xtmGlyph, 316, 292, 1372, 1416, cx - w / 2, cy - h / 2, w, h); }
  else { const w = h * 1252 / 1272; ctx.drawImage(V3.IMG.tariMark, 0, 0, 1252, 1272, cx - w / 2, cy - h / 2, w, h); } }
// the TARI tile: violet square, the official white gem mark from Tari-White@2x (cropped to the mark, unaltered), placed where the XTM icon has its gem
function tariTile(ctx, x, y, s = 260) { ctx.fillStyle = C.purple; ctx.fillRect(x, y, s, s); const gh = s * 0.708, gw = gh * 1252 / 1272; ctx.drawImage(V3.IMG.tariMark, 0, 0, 1252, 1272, x + s * 0.5 - gw / 2, y + s * 0.146, gw, gh); }
const burnZoom = t => 1 + 0.006 * Math.max(0, t - bs('B27'));
function shot12(ctx, t) {
  const a = bs('B25'); fieldInk(ctx, { pool: [960, 820] }); V3.keyLight(ctx, { x: 500, y: -200, r: 1400, col: '129,59,245', a: 0.16 });
  const pan = V3.expoInOut(V3.prog(t, bs('B27') + 0.15, wt('B27', 'burn') - 0.1)), off = -pan * 2000;
  if (pan < 1) {
    ctx.save(); ctx.translate(off, 0);
    // the plate: Blender L19b (one render per face texture, same camera) when all three faces exist, else the 2D plate
    const P19 = plate19(), h1 = cueAny('B25', ['amount', 'hidden,'], bs('B25') + 4), h2 = hasWord('B25', 'owner,') ? wt('B25', 'owner,') : hasWord('B25', 'owner') ? wt('B25', 'owner') : cueAny('B25', ['hidden,'], h1 + 1.5, 2);
    const see = wt('B26', 'see,'), ok = V3.cubicInOut(V3.prog(t, see - 0.1, see + 0.5));
    let q;
    if (P19) {
      const f = 1 + (R3.MAN[P19.st].frames - 1) * V3.clamp((t - bs('B25')) / (bs('B27') + 0.6 - bs('B25')));
      const cn = ['plate_tl', 'plate_tr', 'plate_br', 'plate_bl'].map(n => R3.anchor(P19.st, n, f) || [960, 540]);
      q = cn.map(([x, y]) => ({ x, y }));
      const T2S = (tx, ty) => { const u = tx / 2488, v = ty / 1606, top = [V3.lerp(cn[0][0], cn[1][0], u), V3.lerp(cn[0][1], cn[1][1], u)], bot = [V3.lerp(cn[3][0], cn[2][0], u), V3.lerp(cn[3][1], cn[2][1], u)]; return { x: V3.lerp(top[0], bot[0], v), y: V3.lerp(top[1], bot[1], v) }; };
      const quad = (pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
      ctx.save(); ctx.filter = `blur(${24 * V3.S}px)`; ctx.globalAlpha = 0.7; ctx.fillStyle = '#000'; quad(q.map(p => ({ x: p.x + 30, y: p.y + 40 }))); ctx.fill(); ctx.restore();
      const face = id => R3.frame(id, f), stage = t < h1 ? 0 : t < h2 ? 1 : 2, ids = [P19.st, P19.vh, P19.ah];
      const wk = stage === 0 ? 0 : V3.cubicInOut(V3.prog(t, stage === 1 ? h1 : h2, (stage === 1 ? h1 : h2) + 0.6));
      R3.full(ctx, face(ids[Math.max(0, stage - (wk < 1 ? 1 : 0))]));
      if (stage > 0 && wk < 1) { ctx.save(); quad([T2S(0, 0), T2S(2488 * wk, 0), T2S(2488 * wk, 1606), T2S(0, 1606)]); ctx.clip(); R3.full(ctx, face(ids[stage])); ctx.restore(); }
      if (ok > 0) { const ly = Statement.TEX.LINE(1), qd = [T2S(150, ly - 140), T2S(150 + (Statement.TEX.R + 60 - 150) * ok, ly - 140), T2S(150 + (Statement.TEX.R + 60 - 150) * ok, ly + 50), T2S(150, ly + 50)];
        ctx.save(); quad(qd); ctx.clip(); R3.full(ctx, face(P19.st)); ctx.restore();
        ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 3; quad(qd); ctx.stroke(); ctx.restore(); }
    } else {
    const cam = stealthCam(t); q = Statement.corners(A.ST, cam);
    ctx.save(); ctx.filter = `blur(${24 * V3.S}px)`; ctx.globalAlpha = 0.7; ctx.fillStyle = '#000'; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x + 30, p.y + 40) : ctx.moveTo(p.x + 30, p.y + 40))); ctx.fill(); ctx.restore();
    let base = A.ST.plateTex, wipe = null;
    if (t >= h1 && t < h1 + 0.6) wipe = { tex: A.plateValuesHidden, k: V3.cubicInOut(V3.prog(t, h1, h1 + 0.6)) };
    else if (t >= h1 + 0.6 && t < h2) base = A.plateValuesHidden;
    else if (t >= h2 && t < h2 + 0.6) { base = A.plateValuesHidden; wipe = { tex: A.plateAllHidden, k: V3.cubicInOut(V3.prog(t, h2, h2 + 0.6)) }; }
    else if (t >= h2 + 0.6) base = A.plateAllHidden;
    Statement.plateOnly(ctx, A.ST, cam, { plateTex: base, wipe });
    if (ok > 0) { const ly = Statement.TEX.LINE(1), qd = [[150, ly - 140], [150 + (Statement.TEX.R + 60 - 150) * ok, ly - 140], [150 + (Statement.TEX.R + 60 - 150) * ok, ly + 50], [150, ly + 50]].map(([tx, ty]) => V3.proj(cam, ...Statement.texToWorld(A.ST, tx, ty)));
      ctx.save(); ctx.beginPath(); qd.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.clip(); Statement.plateOnly(ctx, A.ST, cam, {}); ctx.restore();
      ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); qd.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); ctx.restore(); }
    }
    const xs = q.map(p => p.x), ys = q.map(p => p.y), top = Math.min(...ys), right = Math.max(...xs), left = Math.min(...xs), bottom = Math.max(...ys);
    V3.chip(ctx, 'every payment · one-time address', 960, bottom + 70, { size: 34, bg: C.purple, fg: C.cloud, align: 'center', k: V3.expoOut(V3.prog(t, wt('B25', 'one-time'), wt('B25', 'one-time') + 0.4)) * (1 - V3.prog(t, wt('B25', 'check') - 0.3, wt('B25', 'check'))) });
    V3.chip(ctx, 'the network still checks it ✓', 960, bottom + 70, { size: 34, bg: C.green, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('B25', 'check'), wt('B25', 'check') + 0.4)) * (1 - V3.prog(t, bs('B26') - 0.2, bs('B26') + 0.2)) });
    [['all hidden', 'choose', C.purple, C.cloud], ['amount hidden', 'private', C.steel, C.cloud], ['all public', 'asset', C.cloud, C.ink]].forEach(([s, w, bg, fg], i) =>
      V3.chip(ctx, s, 520 + i * 440, 955, { size: 34, bg, fg, align: 'center', k: V3.expoOut(V3.prog(t, wt('B26', w), wt('B26', w) + 0.35)) }));
    const kIn = V3.expoOut(V3.prog(t, wt('B26', 'view'), wt('B26', 'key', { n: 1 }) + 0.4)), kTo = V3.expoInOut(V3.prog(t, wt('B26', 'accountant:') - 0.3, wt('B26', 'accountant:') + 0.6));
    const K3 = 'L18_view_key';
    if (R3.has(K3) && t > wt('B26', 'view') - 1.2) { const sc = R3.anchor(K3, 'key_centre', R3.evf(K3, 'settled', 67)) || [300, 560], dx = V3.lerp(0, left - 120 - sc[0], kTo), dy = V3.lerp(0, top + 150 - sc[1], kTo);
      R3.at(ctx, R3.clip(K3, t, wt('B26', 'view')), 960 + dx, 540 + dy, 1, { sx: 960, sy: 540 });
      V3.chip(ctx, 'view key · read-only', Math.max(40, sc[0] + dx - 100), sc[1] + dy + 110, { size: 34, bg: C.cloud, fg: C.ink, align: 'left', k: V3.expoOut(V3.prog(t, wt('B26', 'read-only'), wt('B26', 'read-only') + 0.3)) * (1 - V3.prog(kTo, 0, 0.3)) }); }
    else if (kIn > 0) { const kx = V3.lerp(V3.lerp(-300, 260, kIn), left - 120, kTo), ky = V3.lerp(560, top + 150, kTo); obj(ctx, 'key', kx, ky, 120, {});
      V3.chip(ctx, 'view key · read-only', Math.max(40, kx - 100), ky + 100, { size: 34, bg: C.cloud, fg: C.ink, align: 'left', k: V3.expoOut(V3.prog(t, wt('B26', 'read-only'), wt('B26', 'read-only') + 0.3)) * (1 - V3.prog(kTo, 0, 0.3)) }); }
    V3.chip(ctx, 'accountant: can see · can’t spend', 960, bottom + 64, { size: 34, bg: C.green, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('B26', "can't"), wt('B26', "can't") + 0.35)) });
    ctx.restore();
  }
  { const h0 = cueAny('B25', ['hidden', 'stealth'], bs('B25') + 2), d0 = cueAny('B25', ['design.', 'design:'], h0 + 0.6);
    V3.words(ctx, 'HIDDEN BY DESIGN.', t, { x: 960, y: 190, size: 150, color: C.cloud, cues: [h0, (h0 + d0) / 2, d0], leave: wt('B25', 'without') - 0.45 }); }
  V3.words(ctx, 'HIDDEN. STILL CHECKED.', t, { x: 960, y: 190, size: 150, color: C.cloud, cues: [wt('B25', 'without'), wt('B25', 'seeing'), wt('B25', 'numbers.')], leave: bs('B27') - 0.1 });
  // B27: burn XTM, claim TARI, one way: the XTM tile slides into the door; TARI comes out the other side (one direction)
  if (pan > 0) {
    const bz = burnZoom(t); ctx.save(); ctx.translate(960, 540); ctx.scale(bz, bz); ctx.translate(-960, -540);
    // v6 (owner): one mark travels THROUGH the door and changes as it crosses: the lime XTM glyph on the left becomes the
    // white Tari glyph on the right, at the same moment. Official glyphs only, no tiles. No "no way back" marker.
    const doorX = 960, gx = burnMarkX(t), lv = V3.cubicInOut(V3.prog(t, bs('B27A') - 0.75, bs('B27A') - 0.1));
    ctx.save(); ctx.globalAlpha = V3.clamp(pan * 1.5); ctx.translate(-lv * 1400, 0);
    ctx.fillStyle = C.purple; ctx.fillRect(doorX - 3, 330, 6, 420); V3.label(ctx, 'base layer', doorX - 30, 800, { size: 30, color: C.frost, align: 'right' }); V3.label(ctx, 'ootle', doorX + 30, 800, { size: 30, color: C.frost });
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, doorX - 3, 1080); ctx.clip(); glyph(ctx, 'xtm', V3.lerp(V3.lerp(2400, 420, pan), gx, V3.prog(t, wt('B27', 'burn') - 0.01, wt('B27', 'burn'))), BURN.y, BURN.s); ctx.restore();
    V3.chip(ctx, 'burn xtm', 550, 360, { size: 34, bg: C.yellow, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('B27', 'burn'), wt('B27', 'burn') + 0.4)) });
    if (gx > doorX - BURN.s / 2) { ctx.save(); ctx.translate(lv * 1400, 0); ctx.beginPath(); ctx.rect(doorX + 3, 0, 1920, 1080); ctx.clip(); glyph(ctx, 'tari', gx, BURN.y, BURN.s); ctx.restore(); }
    const cl = V3.expoOut(V3.prog(t, wt('B27', 'claim'), wt('B27', 'claim') + 0.4)); if (cl > 0) V3.chip(ctx, 'get tari', 1370, 360, { size: 34, bg: C.purple, fg: C.cloud, align: 'center', k: cl });
    V3.label(ctx, 'minus a small fee', 1370, 720, { size: 30, color: C.frost, align: 'center', alpha: V3.prog(t, wt('B27', 'fee.'), wt('B27', 'fee.') + 0.3) });
    ctx.restore();
    ctx.restore();
    V3.words(ctx, 'A ONE-WAY DOOR.', t, { x: 960, y: 230, size: 150, color: C.cloud, cues: phrase('B27', 'A one-way door.', wt('B27', 'fee.')), leave: bs('B27A') - 0.7 });
  }
  V3.tracker(ctx, { step: 4, lit: [true, true, true], cols: [C.purple, C.purple, C.purple], fg: C.cloud, y: 1046 });
}

// ---------------------------------------------------------------- 13 · how it runs, for a 7-year-old (B27A v4) and "it's not magic" (B28)
// One idea at a time (owner: fewer terms at once): an app with its own rules (like Ethereum) whose money stays hidden (like Monero);
// teams of computers check the work, each team keeps one piece of the records; anyone can see money moved, not how much or whose.
const APPMOD = [960, 545];
const frac = (id, f) => bs(id) + f * (be(id) - bs(id));
function shot13(ctx, t) {
  const a = bs('B27A'); fieldInk(ctx, { pool: [960, 820], spill: '129,59,245', spillA: 0.10 * V3.prog(t, a, a + 1.2) });
  const T = { app: cueAny('B27A', ['app'], frac('B27A', 0.03)), rules: cueAny('B27A', ['rules,'], frac('B27A', 0.12)), eth: cueAny('B27A', ['Ethereum,'], frac('B27A', 0.2)),
    xmr: cueAny('B27A', ['Monero.'], frac('B27A', 0.4)), teams: cueAny('B27A', ['Teams'], frac('B27A', 0.45)), piece: cueAny('B27A', ['piece'], frac('B27A', 0.65)),
    anyone: cueAny('B27A', ['Anyone'], frac('B27A', 0.75)), much: cueAny('B27A', ['much'], frac('B27A', 0.88)), whose: cueAny('B27A', ['whose.'], frac('B27A', 0.94)) };
  const z = 1 + 0.025 * V3.approach(t - a, 3) + 0.002 * (t - a);
  V3.camera(ctx, { zoom: z }, () => {
    V3.keyLight(ctx, { x: 520, y: -200, r: 1400, col: '129,59,245', a: 0.16 });
    // the violet field condenses into the app (field -> object), then the app module is revealed top-down in its place
    const cond = V3.expoInOut(V3.prog(t, a, a + 0.8)), mw = 420, mh = 260, mr = [APPMOD[0] - mw / 2, APPMOD[1] - mh / 2, mw, mh, 12];
    const up = V3.expoInOut(V3.prog(t, T.teams - 0.2, T.teams + 0.6)), out = V3.expoInOut(V3.prog(t, T.anyone - 0.4, T.anyone + 0.3));
    const has21 = R3.has('L21_validator_teams'), my = has21 ? V3.lerp(APPMOD[1], -320, up) : V3.lerp(APPMOD[1], 330, up) - out * 900, ms = V3.lerp(1, 0.55, up);
    if (cond < 1) { // v6: no tile, no flash: the white Tari glyph itself travels from the door to the centre and grows
      const r0 = scr([BURN.x1 - BURN.s / 2, BURN.y - BURN.s / 2, BURN.s, BURN.s, 0], burnZoom(a)), r = lerpRect(r0, [APPMOD[0] - mh / 2, APPMOD[1] - mh / 2, mh, mh, 0], cond);
      glyph(ctx, 'tari', r[0] + r[2] / 2, r[1] + r[3] / 2, r[3]); }
    else { const wk = V3.prog(t, a + 0.8, a + 1.15), wy = wk < 1 ? mr[1] - 40 + (mh + 80) * wk : 1e4;
      ctx.save(); if (wk < 1) { ctx.beginPath(); ctx.rect(0, 0, V3.W, wy); ctx.clip(); } templateObj(ctx, t, APPMOD[0], my, mw * ms, { t0: a }); ctx.restore();
      if (wk < 1) { ctx.save(); ctx.beginPath(); ctx.rect(0, wy, V3.W, V3.H); ctx.clip(); glyph(ctx, 'tari', APPMOD[0], APPMOD[1], mh); ctx.restore(); } }
    const appK = V3.expoOut(V3.prog(t, T.app, T.app + 0.4)) * (1 - up);
    V3.chip(ctx, 'an app on the ootle', 960, APPMOD[1] + 200, { size: 34, bg: C.purple, fg: C.cloud, align: 'center', k: appK });
    V3.label(ctx, 'runs by its own rules', 960, APPMOD[1] + 268, { size: 30, color: C.frost, align: 'center', alpha: V3.prog(t, T.rules, T.rules + 0.3) * (1 - up) });
    // like Ethereum (left) · like Monero (right): the two roads, one each side, then they leave the way they came
    const k1 = V3.expoOut(V3.prog(t, T.eth - 0.1, T.eth + 0.5)), k2 = V3.expoOut(V3.prog(t, T.xmr - 0.1, T.xmr + 0.5)), gone = V3.expoInOut(V3.prog(t, T.teams - 0.3, T.teams + 0.4));
    if (k1 > 0 && gone < 1) { const x = V3.lerp(-300, 330, k1) - gone * 900; moduleObj(ctx, t, x, 545, 150);
      V3.label(ctx, 'like ethereum', x, 420, { size: 30, color: C.cloud, align: 'center', alpha: k1 }); V3.chip(ctx, 'own rules', x, 700, { size: 30, bg: C.azure, fg: C.cloud, align: 'center', k: k1 }); }
    if (k2 > 0 && gone < 1) { const x = V3.lerp(2220, 1590, k2) + gone * 900; moneroBlock(ctx, t, x, 545, 170);
      V3.label(ctx, 'like monero', x, 420, { size: 30, color: C.cloud, align: 'center', alpha: k2 }); V3.chip(ctx, 'money hidden', x, 700, { size: 30, bg: MONERO, fg: C.ink, align: 'center', k: k2 }); }
    // teams of computers: four pieces of the records rise; each has its team (a ring of dots) that lights up as it checks
    // teams of computers: the Blender shot (L21) rises in from below and leaves upward; else the 2D pieces
    if (has21 && t > T.teams - 0.4 && t < T.anyone + 0.35) { const inK = V3.expoInOut(V3.prog(t, T.teams - 0.35, T.teams + 0.35)), outK = V3.expoInOut(V3.prog(t, T.anyone - 0.45, T.anyone + 0.25));
      ctx.save(); ctx.translate(0, (1 - inK) * 1100 - outK * 1100); R3.full(ctx, R3.clip('L21_validator_teams', t, T.teams - 0.1)); ctx.restore(); }
    const tk = has21 ? 0 : V3.expoOut(V3.prog(t, T.teams, T.teams + 0.7)) - V3.expoInOut(V3.prog(t, T.anyone - 0.4, T.anyone + 0.3));
    if (tk > 0) for (let i = 0; i < 4; i++) { const w = 300, h = 210, x = 960 - 2 * w - 45 + i * (w + 30), y = 520 + (1 - tk) * 700 + i * 0;
      ctx.fillStyle = C.purple; ctx.fillRect(x, y, w, h);
      V3.monoFont(ctx, 30, 500); ctx.fillStyle = 'rgba(236,238,255,0.55)'; for (let r = 0; r < 3; r++) ctx.fillRect(x + 36, y + 64 + r * 40, (w - 72) * (0.5 + 0.5 * V3.rng(i * 7 + r)()), 8);
      const ck = V3.prog(t, T.teams + 0.6 + i * 0.18, T.teams + 1.2 + i * 0.18);
      for (let d = 0; d < 10; d++) { const an = d / 10 * Math.PI * 2 - Math.PI / 2, on = ck * 10 > d; ctx.fillStyle = on ? C.green : 'rgba(236,238,255,0.35)';
        ctx.beginPath(); ctx.arc(x + w / 2 + Math.cos(an) * (w / 2 + 26), y + h / 2 + Math.sin(an) * (h / 2 + 26), 6, 0, Math.PI * 2); ctx.fill(); }
      if (t > T.piece) V3.label(ctx, `piece ${i + 1}`, x + w / 2, y + h + 76, { size: 30, color: C.frost, align: 'center', alpha: V3.prog(t, T.piece + i * 0.1, T.piece + i * 0.1 + 0.3) * tk }); }
    // anyone can see that money moved, but not how much or whose
    const sk = V3.expoOut(V3.prog(t, T.anyone, T.anyone + 0.5)) * (1 - V3.prog(t, bs('B28') + 0.6, bs('B28') + 1.0));
    if (sk > 0) { const y = 560 + (1 - sk) * 300;
      V3.chip(ctx, 'money moved ✓', 400, y, { size: 40, bg: C.green, fg: C.ink, align: 'center', k: sk });
      [['how much', T.much, 960], ['whose', T.whose, 1490]].forEach(([s, tt, x]) => { const kk = V3.expoOut(V3.prog(t, tt, tt + 0.35));
        V3.label(ctx, s, x, y - 70, { size: 30, color: C.frost, align: 'center', alpha: sk * V3.clamp(kk * 2) }); ctx.fillStyle = C.purple; ctx.fillRect(x - 200 * kk, y - 44, 400 * kk, 56); });
      V3.label(ctx, 'anyone can see', 400, y - 70, { size: 30, color: C.frost, align: 'center', alpha: sk }); }
    // B28: the fee prints plainly (fees are public)
    const fk = cueAny('B28', ['Fees'], bs('B28') + 1.5); if (t > fk) { typedCue('b28|fee', fk, 30, 24, 34); V3.typed(ctx, 'fee ······ 0.0021 public', 960 - 290, 700, t, fk, 30, { size: 34, color: C.cloud, cursor: false }); }
  });
  V3.label(ctx, 'how it runs', 96, 96, { size: 30, color: C.frost, alpha: V3.prog(t, a + 0.3, a + 0.6) * (1 - V3.prog(t, bs('B28') - 0.3, bs('B28'))) });
  V3.words(ctx, 'PROGRAMS + PRIVACY.', t, { x: 960, y: 238, size: 170, colors: [C.cloud, C.purple, C.cloud], cues: [T.eth, (T.eth + T.xmr) / 2, T.xmr], leave: T.teams - 0.45 });
  V3.words(ctx, 'TEAMS CHECK THE WORK.', t, { x: 960, y: 238, size: 150, color: C.cloud, t0: T.teams + 0.1, stagger: 0.09, leave: T.anyone - 0.45 });
  V3.words(ctx, 'IT MOVED. THAT’S ALL.', t, { x: 960, y: 238, size: 170, color: C.cloud, t0: T.anyone + 0.2, stagger: 0.12, leave: bs('B28') + 0.1 });
  V3.words(ctx, 'NOT MAGIC.', t, { x: 960, y: 238, size: 186, color: C.cloud, cues: phrase('B28', 'not magic.'), leave: wt('B28', 'Privacy') - 0.45 });
  V3.chip(ctx, 'public stays public', 960, 790, { size: 34, bg: C.cloud, fg: C.ink, align: 'center', k: V3.expoOut(V3.prog(t, wt('B28', 'stays'), wt('B28', 'stays') + 0.4)) * (1 - V3.prog(t, wt('B28', 'Privacy') - 0.3, wt('B28', 'Privacy'))) });
  V3.words(ctx, 'PRIVACY IS A CHOICE.', t, { x: 960, y: 238, size: 186, color: C.cloud, cues: phrase('B28', 'Privacy is a choice,') });
  V3.chip(ctx, 'tari builds it into the foundations', 960, 330, { size: 34, bg: C.purple, fg: C.cloud, align: 'center', k: V3.expoOut(V3.prog(t, wt('B28', 'builds'), wt('B28', 'builds') + 0.4)) });
  V3.tracker(ctx, { step: 4, lit: [true, true, true], cols: [C.purple, C.purple, C.purple], fg: C.cloud, y: 1046 });
}
const flagBand = () => [960 - 330, 280, 660, 64, 0];   // the "foundations" chip: the next shot (ink) floods out of it

// ---------------------------------------------------------------- 14 · why it matters (B29–B30)
// "Remember the flag?": the same review card and the same scanner as the flag act. Pass 1 reads your history (rows flash red);
// on "private" every value is covered completely; pass 2 finds nothing, and NOTHING TO READ holds until the lime flood.
const NOTHING = [960 - 250, 700, 500, 70, 0];
const RV2 = { x: (1920 - 1000) / 2, y: 290 };
function shot14(ctx, t) {
  const a = bs('B29'); fieldInk(ctx, { pool: [960, 760] }); V3.keyLight(ctx, { x: 520, y: -200, r: 1400, col: '129,59,245', a: 0.16 });
  const z = 1 + 0.03 * V3.approach(t - a, 3);
  const tf = wt('B29', 'flag?'), p1a = wt('B29', 'software') - 0.15, p1b = wt('B29', 'history.') + 0.1, hide0 = wt('B29', 'private') - 0.15;
  const p2a = wt('B29', 'network,') - 0.05, p2b = p2a + 1.05, flood0 = wt('B29', 'itself') - 0.25, flood1 = wt('B29', 'ask') - 0.05;
  const sx1 = V3.lerp(1990, -70, V3.cubicInOut(V3.prog(t, p1a, p1b))), sx2 = V3.lerp(1990, -70, V3.cubicInOut(V3.prog(t, p2a, p2b)));
  const vx = RV2.x + REVIEW.pad + 400;   // where the values start (card space + card x)
  V3.camera(ctx, { zoom: z }, () => {
    const rowT = REVIEW_ROWS.map((_, i) => tf - 0.1 + i * 0.12);
    reviewCard(ctx, t, { x: RV2.x, y: RV2.y, k: V3.expoOut(V3.prog(t, tf - 0.5, tf)), rowT, key: 'why',
      scan: i => (t > p1a && t < p1b + 0.6 && sx1 < vx + 300) ? 1 - V3.prog(t, p1b, p1b + 0.6) : 0,
      cover: i => V3.expoOut(V3.prog(t, hide0 + i * 0.08, hide0 + i * 0.08 + 0.3)) });
    const nk = t > p2a && sx2 < RV2.x ? V3.expoOut(V3.prog(t, p2a + 0.6, p2a + 0.95)) : 0;
    V3.chip(ctx, 'nothing to read', 960, NOTHING[1] + 50, { size: 48, bg: C.green, fg: C.ink, align: 'center', k: nk });
    V3.words(ctx, 'REMEMBER THE FLAG?', t, { x: 960, y: 200, size: 150, color: C.cloud, cues: phrase('B29', 'Remember the flag?'), leave: wt('B29', 'On') - 0.3 });
    V3.words(ctx, 'NO BOARD TO READ.', t, { x: 960, y: 200, size: 150, color: C.cloud, cues: [wt('B29', 'no'), wt('B29', 'board'), wt('B29', 'to', { n: 1 }), wt('B29', 'read.', { n: 2 })] });
  });
  if (t > p1a && t < p1b) scanner(ctx, sx1); if (t > p2a && t < p2b) scanner(ctx, sx2);
  V3.tracker(ctx, { step: 4, lit: [true, true, true], cols: [C.purple, C.purple, C.purple], fg: C.cloud, y: 1046 });
  // the frame becomes yours: lime floods out of the "nothing to read" chip, then the three words stack
  const fl = V3.prog(t, flood0, flood1);
  if (fl > 0) { const e = V3.expoInOut(fl), cx = 960, cy = NOTHING[1] + 34, R = V3.lerp(40, 2300, e);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); V3.fill(ctx, C.green); V3.keyLight(ctx, { x: 360, y: -240, r: 1500, col: '255,255,235', a: 0.18 });
    const z2 = 1 + 0.03 * V3.approach(t - wt('B29', 'ask'), 2.4);
    V3.camera(ctx, { zoom: z2 }, () => {
      [['PERMISSIONLESS.', wt('B29', 'ask')], ['PROGRAMMABLE.', wt('B29', 'approve')], ['PRIVATE.', wt('B29', 'business')]].forEach(([l, tt], i) =>
        V3.words(ctx, l, t, { x: 960, y: 342 + i * 280 * 0.84, size: 280, color: C.ink, t0: tt, stagger: 0.05 })); });
    V3.label(ctx, 'why it matters', 96, 96, { size: 30, color: C.ink });
    V3.words(ctx, 'your business stays yours.', t, { x: 1824, y: 104, size: 34, fam: 'sans', weight: 600, color: C.ink, align: 'right', cues: phrase('B29', 'Your business stays yours.', wt('B29', 'you.')), leave: be('B29') - 0.2 });
    V3.words(ctx, 'step four starts now.', t, { x: 1824, y: 104, size: 34, fam: 'sans', weight: 600, color: C.ink, align: 'right', cues: phrase('B30', 'Step four starts now.') });
    V3.tracker(ctx, { step: 4, lit: [true, true, true], cols: [C.ink, C.ink, C.ink], fg: C.ink, y: 1046 });
    ctx.restore(); }
}

// ---------------------------------------------------------------- 16 · end card (owner note 14: straight to it after "Step four starts now.")
// The lime frame contracts into the "04 tari" step chip of the card; the card is already composed; the logo rises, tari.com types.
const END = { y: 400, size: 30, gap: 14, steps: ['01 bitcoin', '02 ethereum', '03 monero', '04 tari'] };
function endSteps(ctx) { V3.monoFont(ctx, END.size, 500); const ws = END.steps.map(s => V3.measure(ctx, s.toUpperCase(), END.size * 0.12) + 28), tot = ws.reduce((x, y) => x + y, 0) + 3 * END.gap; let x = 960 - tot / 2; return ws.map(w => { const r = [x, END.y - END.size - 9 * 0.6, w, END.size + 18]; x += w + END.gap; return r; }); }
let _endRect = null;
function endChipRect() { if (!_endRect) { const c = V3.canvas(8, 8).getContext('2d'); _endRect = endSteps(c)[3]; } return [_endRect[0], _endRect[1] + 6, _endRect[2], _endRect[3], 0]; }
function shot16(ctx, t) {
  const a = endA(); fieldInk(ctx, { pool: [960, 760] });
  const rs = endSteps(ctx);
  END.steps.forEach((s, i) => { const on = i === 3, al = on ? 1 : V3.expoOut(V3.prog(t, a + 0.35 + (2 - i) * 0.08, a + 0.75 + (2 - i) * 0.08)); const b = V3.chip(ctx, s, rs[i][0], END.y, { size: END.size, bg: on ? C.green : 'rgba(0,0,0,0)', fg: on ? C.ink : C.frost, k: al });
    if (!on && al > 0) { ctx.save(); ctx.globalAlpha = al * 0.7; ctx.strokeStyle = MONERO_STEP[i] || C.steel; ctx.lineWidth = 1.5; ctx.strokeRect(b.x + 0.75, END.y - b.h + 9 * 0.6 + 0.75, b.w - 1.5, b.h - 1.5); ctx.restore(); } });
  const e = V3.quartOut(V3.prog(t, a + 0.5, a + 1.3)), LH = 132;
  if (e > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 540 - LH / 2 - 10, 1920, LH + 20); ctx.clip(); V3.logo(ctx, V3.IMG.logo, 960, 540 + (1 - e) * (LH + 20), LH); ctx.restore(); }
  V3.words(ctx, 'tari.com', t, { x: 960, y: 700, size: 40, fam: 'mono', weight: 500, color: C.cloud, t0: a + 1.2 });
  V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.10, oy: 60 + (t - a) * 6, x0: 60, x1: 420 }); V3.reg(ctx, { pitch: 120, size: 7, alpha: 0.10, oy: 60 + (t - a) * 6, x0: 1500, x1: 1860 });
}
const MONERO_STEP = [C.steel, C.steel, C.steel];
