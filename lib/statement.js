'use strict';
// Shared world pieces: the public ledger wall (ledger-wall plate, every plate engraved) and your statement plate
// (statement-plate close-up, engraved). One engraving routine (engraveStatement) draws in plate-texture space, so the
// face-on close-up (shot 04) and the plate on the wall (shots 05, 06, 12, thumbnail, S1) match exactly.
const Statement = (() => {
  const { C } = V3;
  const CROP = [150, 0, 1680, 940], SX = [199, 421, 638, 860, 1084, 1309, 1534, 1760], SY = [143, 286, 434, 581, 727, 875];
  const PLATE_SRC = [350, 130, 1244, 803], U = 2, TS = 2, MX = (SX[3] + SX[4]) / 2, MY = (SY[2] + SY[3]) / 2;
  const LINES = [['to: stranger', '0.0500'], ['to: pharmacy', '0.0040'], ['to: landlord', '0.1800'], ['to: clinic', '0.0120'], ['from: employer', '1.2000']];
  const TEX = { L: 190, T0: 300, R: PLATE_SRC[2] * 2 - 190, LINE: (i) => 300 + 170 + i * 200 };   // texture px (2x the photo's plate)
  // engrave in texture space. o.reveal(i, part) -> 0..1 wipe for line i ('k' key, 'v' value); o.redact[i]: bar over value;
  // o.names[i]: bar over the name after "to:"/"from:"; o.bar: colour of the bars (violet = Tari)
  function engraveStatement(q, o = {}) {
    const { L, T0, R } = TEX, rv = o.reveal || (() => 1), bar = o.bar || C.purple;
    const hk = rv(-1, 'h');
    if (hk > 0) { q.save(); q.beginPath(); q.rect(0, 0, L + (R - L) * hk + 40, T0 + 40); q.clip();
      V3.engrave(q, 'STATEMENT · OCTOBER', L, T0 - 60, { size: 74, depth: 3, track: 74 * 0.16 });
      q.fillStyle = C.green; q.fillRect(R - 66, T0 - 122, 66, 66); q.strokeStyle = 'rgba(4,7,35,0.85)'; q.lineWidth = 5; q.strokeRect(R - 66, T0 - 122, 66, 66);
      V3.engrave(q, 'you', R - 92, T0 - 60, { size: 74, align: 'right', depth: 3 });
      q.fillStyle = 'rgba(20,24,50,0.35)'; q.fillRect(L, T0 - 14, (R - L), 5); q.restore(); }
    LINES.forEach(([k, v], i) => { const y = TEX.LINE(i), kk = rv(i, 'k'), kv = rv(i, 'v');
      if (kk > 0) { q.save(); q.beginPath(); q.rect(L - 20, y - 130, (R - L) * 0.62 * kk + 20, 170); q.clip();
        V3.engrave(q, k, L, y, { size: 112, depth: 3.4 });
        q.globalCompositeOperation = 'multiply'; V3.leader(q, L + 112 * 0.62 * (k.length + 1), R - (o.redact && o.redact[i] ? 470 : 112 * 0.62 * 7), y - 32, { color: '#3a3f5c', r: 5, gap: 30, alpha: 0.7 }); q.restore();
        if (o.names && o.names[i]) { const nx = L + 112 * 0.62 * (k.indexOf(':') + 2); q.fillStyle = bar; q.fillRect(nx, y - 96, 112 * 0.62 * (k.length - k.indexOf(':') - 2) + 20, 118); } }
      if (kv > 0) { q.save(); q.beginPath(); q.rect(R - 470, y - 130, 470 * kv, 170); q.clip();
        if (o.redact && o.redact[i]) { q.fillStyle = bar; q.fillRect(R - 440, y - 96, 440, 118); }
        else V3.engrave(q, v, R, y, { size: 112, depth: 3.4, align: 'right' });
        q.restore(); } });
  }
  let WALLTEX = null;
  function wallTexture() {
    if (WALLTEX) return WALLTEX;
    const [cx, cy, cw, ch] = CROP, wc = V3.canvas(cw * TS, ch * TS), g = wc.getContext('2d');
    g.drawImage(V3.IMG.wall, cx, cy, cw, ch, 0, 0, cw * TS, ch * TS); g.scale(TS, TS); g.translate(-cx, -cy);
    const r = V3.rng(11), who = ['to: grocer', 'to: school', 'from: client', 'to: gym', 'to: rent', 'from: refund', 'to: clinic', 'to: bar', 'from: wages', 'to: donor'];
    for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) { if (i === 3 && j === 2) continue;
      for (let l = 0; l < 6; l++) { const k = who[Math.floor(r() * who.length)], v = (r() * 2).toFixed(4);
        V3.engrave(g, k, SX[i] + 18, SY[j] + 30 + l * 16, { size: 7, depth: 0.5, ink: 'rgba(30,34,60,0.55)', lip: 'rgba(255,255,255,0.6)' });
        V3.engrave(g, v, SX[i + 1] - 18, SY[j] + 30 + l * 16, { size: 7, depth: 0.5, align: 'right', ink: 'rgba(30,34,60,0.55)', lip: 'rgba(255,255,255,0.6)' }); } }
    return (WALLTEX = wc);
  }
  function plateTexture(o = {}) {
    const [px, py, pw, ph] = PLATE_SRC, pc = V3.canvas(pw * 2, ph * 2), q = pc.getContext('2d');
    q.drawImage(V3.IMG.plate, px, py, pw, ph, 0, 0, pw * 2, ph * 2); engraveStatement(q, o); return pc;
  }
  async function build(o = {}) {
    await Promise.all([V3.img('wall', 'plates/raw/ledger-wall.png'), V3.img('plate', 'plates/raw/statement-plate.png')]);
    const [cx, cy, cw, ch] = CROP, [, , pw, ph] = PLATE_SRC, yw = (SX[4] - SX[3] + 6) * U, yh = yw * ph / pw;
    return { wallTex: wallTexture(), plateTex: plateTexture(o), WALL: { X0: (cx - MX) * U, Y0: (MY - cy) * U, Ww: cw * U, Wh: ch * U, Z: 0 }, YOU: { X0: -yw / 2, Y0: yh / 2, Ww: yw, Wh: yh, Z: 3 } };
  }
  // world position of the centre of wall plate (i, j) (for hop links), and of a line on your plate
  const plateCentre = (i, j) => [((SX[i] + SX[i + 1]) / 2 - MX) * U, (MY - (SY[j] + SY[j + 1]) / 2) * U, 0];
  function draw(ctx, S, cam, { dof = 0.016, bg = '#E4E5EA', plateTex, wipe } = {}) {
    if (V3.dry) return;
    const L = V3.layer('wall'), g = L.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, V3.W, V3.H);
    V3.plane(g, S.wallTex, cam, { ...S.WALL, du: 3 }); V3.plane(g, plateTex || S.plateTex, cam, { ...S.YOU, du: 3 });
    if (wipe) V3.plane(g, wipe.tex, cam, { ...S.YOU, du: 3, uMax: wipe.k });
    const tab = []; for (let X = S.WALL.X0; X <= S.WALL.X0 + S.WALL.Ww; X += 20) { const p = V3.proj(cam, X, 0, 0); if (p) tab.push([p.x, p.d]); }
    const fp = V3.proj(cam, 0, 0, 0), focus = fp ? fp.d : 1000, dAt = sx => { let b = tab[0]; for (const e of tab) if (Math.abs(e[0] - sx) < Math.abs(b[0] - sx)) b = e; return b ? b[1] : focus; };
    V3.dofBands(ctx, L, sx => Math.min(12, Math.abs(dAt(sx) - focus) * dof), { bands: 32 });
  }
  function plateOnly(ctx, S, cam, { plateTex, wipe } = {}) { V3.plane(ctx, plateTex || S.plateTex, cam, { ...S.YOU, du: 2 }); if (wipe) V3.plane(ctx, wipe.tex, cam, { ...S.YOU, du: 2, uMax: wipe.k }); }
  function corners(S, cam) { const Y = S.YOU; return [[Y.X0, Y.Y0], [Y.X0 + Y.Ww, Y.Y0], [Y.X0 + Y.Ww, Y.Y0 - Y.Wh], [Y.X0, Y.Y0 - Y.Wh]].map(([x, y]) => V3.proj(cam, x, y, Y.Z)); }
  // texture px -> world point on your plate (for chips and line clips)
  function texToWorld(S, tx, ty) { const Y = S.YOU, tw = PLATE_SRC[2] * 2, th = PLATE_SRC[3] * 2; return [Y.X0 + tx / tw * Y.Ww, Y.Y0 - ty / th * Y.Wh, Y.Z]; }
  return { build, draw, plateOnly, corners, plateTexture, engraveStatement, plateCentre, texToWorld, LINES, TEX, PLATE_SRC };
})();
