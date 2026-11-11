'use strict';
// Shared assets and object helpers for the v3 film and Shorts.
const A = {};
const SPR = {   // keyed sprites: plate, crop [sx, sy, sw, sh] centred on the object's body, body height / crop height, background ref
  you: { img: 'you', crop: [559, 331, 410, 362], body: 312 / 362, bg: [1, 1, 18], lo: 16, hi: 70 },
  glass: { img: 'gcube', crop: [520, 265, 506, 470], body: 430 / 470, bg: [1, 2, 22], lo: 12, hi: 60 },
  gmod: { img: 'gmod', crop: [400, 330, 720, 520], body: 0.8, bg: [1, 2, 19], lo: 10, hi: 55 },
  azmod: { img: 'az', crop: [420, 300, 840, 520], body: 0.62, bg: [247, 246, 252], lo: 8, hi: 40 },
  steel: { img: 'steel', crop: [520, 330, 540, 420], body: 0.8, bg: [250, 250, 253], lo: 8, hi: 40 },
  coin: { img: 'coin', crop: [580, 350, 470, 470], body: 0.85, bg: [249, 247, 253], lo: 8, hi: 40 },
  bank: { img: 'bank', crop: [560, 100, 560, 840], body: 0.94, bg: [244, 243, 248], lo: 8, hi: 40 },
  note: { img: 'note', crop: [360, 280, 810, 450], body: 0.92, bg: [1, 2, 17], lo: 12, hi: 60 },
  key: { img: 'vkey', crop: [440, 290, 640, 420], body: 0.9, bg: [3, 4, 23], lo: 12, hi: 60 },
};
async function loadAssets() {
  const P = 'plates/raw/';
  await Promise.all([
    V3.img('term', P + 'terminal.png'), V3.img('you', P + 'you-cube.png'), V3.img('gcube', P + 'glass-cube.png'), V3.img('gmod', P + 'glass-module.png'),
    V3.img('az', P + 'azure-module.png'), V3.img('steel', P + 'steel-cube.png'), V3.img('coin', P + 'gold-coin.png'), V3.img('bank', P + 'bank-block.png'),
    V3.img('note', P + 'glass-note.png'), V3.img('vkey', P + 'view-key.png'), V3.img('plate', P + 'statement-plate.png'), V3.img('wall', P + 'ledger-wall.png'),
    V3.img('tower', 'brand/Tari-Tower-Dark-Mode.png'), V3.img('coins', 'brand/TariCoins.png'), V3.img('logo', 'brand/Tari-White.svg'), V3.img('xtm', 'brand/XTM.png'), V3.img('tariMark', 'brand/Tari-White@2x.png'), V3.img('xtmGlyph', 'brand/XTM-glyph.svg'),
  ]);
  for (const [k, s] of Object.entries(SPR)) A[k] = V3.key(V3.IMG[s.img], { bg: s.bg, lo: s.lo, hi: s.hi, crop: s.crop });
  A.ST = await Statement.build();
  const all = [true, true, true, true, true];
  A.plateValuesHidden = Statement.plateTexture({ redact: all });
  A.plateAllHidden = Statement.plateTexture({ redact: all, names: all });
}
// draw a keyed sprite so its BODY (the object, not the crop) is `bodyH` tall, centred on (cx, cy)
function obj(ctx, name, cx, cy, bodyH, o = {}) { const s = SPR[name]; return V3.sprite(ctx, A[name], cx, cy, bodyH / s.body, o); }
const SHADOW = { color: 'rgba(4,7,35,0.32)', blur: 18, x: 22, y: 28 };      // key light upper left -> shadow lower right
// a lime square mark with an ink outline (how "you" shows on the white world, where lime text would vanish)
function youMark(ctx, x, y, s = 22) { ctx.save(); ctx.fillStyle = V3.C.green; ctx.fillRect(x, y, s, s); ctx.strokeStyle = V3.C.ink; ctx.lineWidth = 3; ctx.strokeRect(x, y, s, s); ctx.restore(); }
// light dimming (a lighting change, not a dissolve): ink over everything
function dimTo(ctx, k, col = '4,7,35') { if (k <= 0) return; ctx.save(); ctx.fillStyle = `rgba(${col},${V3.clamp(k)})`; ctx.fillRect(-10, -10, V3.W + 20, V3.H + 20); ctx.restore(); }
// the brand-violet / white light panel that sweeps across behind giant type (wipes in from the left, out to the right)
function lightPanel(ctx, t, tin, tout, { y = 250, h = 580, col = 'rgba(236,238,255,0.9)' } = {}) {
  const a = V3.expoOut(V3.prog(t, tin, tin + 0.55)), b = V3.expoInOut(V3.prog(t, tout, tout + 0.55)); if (a <= 0 || b >= 1) return;
  const x0 = V3.W * b, x1 = V3.W * a; ctx.save(); ctx.fillStyle = col; ctx.fillRect(x0, y, x1 - x0, h); ctx.restore();
}
// typing blocks register themselves for the keystroke cue pass (window.TYPED)
window.TYPED = window.TYPED || {};
function typedCue(key, t0, cps, n, size) { if (Q.has('cues')) window.TYPED[key] = { t0, cps, n, size }; }

// ---------------------------------------------------------------- v4 additions
// a word cue that survives the v4 re-script: the first of several candidate words found in the beat, else a fallback time
function cueAny(id, words, fallback, n = 1) { for (const w of [].concat(words)) { try { return wt(id, w, { n }); } catch (e) {} } return typeof fallback === 'function' ? fallback() : fallback; }
const hasBeat = id => TL.beats.some(b => b.id === id);
const bsOr = (id, f) => hasBeat(id) ? bs(id) : f;
// THE scanner (owner note 3): one full-height line crossing the whole screen, a soft trailing glow and a faint scanned field.
// No text: the motion says "scanning". Used identically in B12 and B29 (and Short 2).
const SCAN_COL = '254,44,63';
function scanner(ctx, x, { dir = -1, color = SCAN_COL, glow = 0.30, field = 0.06, w = V3.W, h = V3.H, x0 = 0, x1 = w } = {}) {
  if (x < -60 || x > w + 60) return;
  ctx.save();
  const gw = 220, g = ctx.createLinearGradient(x, 0, x - dir * gw, 0); g.addColorStop(0, `rgba(${color},${glow})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.fillRect(Math.min(x, x - dir * gw), 0, gw, h);
  ctx.fillStyle = `rgba(${color},${field})`; if (dir < 0) ctx.fillRect(x, 0, x1 - x, h); else ctx.fillRect(x0, 0, x - x0, h);
  ctx.fillStyle = `rgb(${color})`; ctx.fillRect(x - 2, 0, 4, h);
  for (let y = 30; y < h; y += 60) ctx.fillRect(x - 12, y - 1, 24, 3);
  ctx.fillRect(x - 3, 0, 6, 26); ctx.fillRect(x - 3, h - 26, 6, 26);
  ctx.restore();
}
// Monero orange tint for the 2D fallback of the glass blocks (the Blender ring replaces it)
const MONERO = '#AEB3C6';          // v5: Monero = hidden = neutral frosted glass (owner: orange read as "flagged, bad"); chip bg, ink text
let _orange = null;
function orangeGlass() { return A.glass; }   // v5: the 2D stand-in for the neutral frosted Monero block is the plain glass sprite
// draw the lime "you" cube: Blender loop if present (body 300 px at render (960, 520)), else the v3 sprite
function youCube(ctx, t, cx, cy, bodyH, { white = false, t0 = 0, shadow } = {}) {
  const id = white ? 'L03_cube_idle_white' : 'L02_cube_idle_ink', img = R3.loop(id, t, t0);
  if (R3.has(id)) return R3.at(ctx, img, cx, cy, bodyH / 300, { sx: 958, sy: CUBE3_CY });
  return obj(ctx, 'you', cx, cy, bodyH, { shadow: white ? SHADOW : shadow });
}
const MONERO_DEEP = '#4A4E66';                     // the 03 numeral behind the block: steel, deep (the v3 step-colour sequence)
// the azure program module (Ethereum's smart contract): Blender L09_module_idle (about 340 px wide at render 960,560) else the v3 sprite
function moduleObj(ctx, t, cx, cy, bodyH, { t0 = 0, shadow, still = false } = {}) {
  const id = 'L09_module_idle'; if (R3.has(id)) return R3.at(ctx, (still ? R3.frame(id, 1) : R3.loop(id, t, t0)), cx, cy, bodyH / 170, { sx: 960, sy: 553 });
  return obj(ctx, 'azmod', cx, cy, bodyH, { shadow });
}
// a Monero block (frosted orange): Blender L17_monero_block_idle (body 300 at render 960,540) else the tinted glass sprite
function moneroBlock(ctx, t, cx, cy, bodyH, { t0 = 0 } = {}) {
  const id = 'L17_monero_block_idle'; if (R3.has(id)) return R3.at(ctx, R3.loop(id, t, t0), cx, cy, bodyH / 300, { sx: 958, sy: 534 });
  return V3.sprite(ctx, orangeGlass(), cx, cy, bodyH / SPR.glass.body, {});
}
const hasWord = (id, w, n = 1) => { try { wt(id, w, { n }); return true; } catch (e) { return false; } };
// ---------------------------------------------------------------- the two worlds (style bible §7), shared with the Blender renders
// PRIVATE: ink, one key upper-left, a horizon-less glossy floor (a faint lifted band low in frame) and a soft pool under the subject.
// PUBLIC: cloud gallery wall, key upper-left (brighter), falling off to the lower right. Both are what the 3D's lensing plates bend.
function fieldInk(ctx, { pool = [960, 700], poolR = 900, spill = null, spillA = 0.14, key = 0.05, w = V3.W, h = V3.H } = {}) {
  ctx.fillStyle = V3.C.ink; ctx.fillRect(0, 0, w, h);
  const fl = ctx.createLinearGradient(0, h * 0.45, 0, h); fl.addColorStop(0, 'rgba(18,24,64,0)'); fl.addColorStop(0.55, 'rgba(18,24,64,0.30)'); fl.addColorStop(1, 'rgba(10,14,44,0.10)');
  ctx.fillStyle = fl; ctx.fillRect(0, h * 0.45, w, h * 0.55);
  ctx.save(); ctx.translate(pool[0], pool[1]); ctx.scale(1, 0.32); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, poolR); g.addColorStop(0, 'rgba(40,48,110,0.28)'); g.addColorStop(1, 'rgba(40,48,110,0)'); ctx.fillStyle = g; ctx.fillRect(-poolR, -poolR, 2 * poolR, 2 * poolR); ctx.restore();
  if (spill) { ctx.save(); ctx.translate(pool[0], pool[1]); ctx.scale(1, 0.3); const s = ctx.createRadialGradient(0, 0, 0, 0, 0, poolR * 0.55); s.addColorStop(0, `rgba(${spill},${spillA})`); s.addColorStop(1, `rgba(${spill},0)`); ctx.fillStyle = s; ctx.fillRect(-poolR, -poolR, 2 * poolR, 2 * poolR); ctx.restore(); }
  const k = ctx.createRadialGradient(w * 0.22, -h * 0.25, 0, w * 0.22, -h * 0.25, w * 0.85); k.addColorStop(0, `rgba(236,238,255,${key})`); k.addColorStop(1, 'rgba(236,238,255,0)'); ctx.fillStyle = k; ctx.fillRect(0, 0, w, h);
}
function fieldCloud(ctx, { w = V3.W, h = V3.H } = {}) {
  ctx.fillStyle = V3.C.cloud; ctx.fillRect(0, 0, w, h);
  const k = ctx.createRadialGradient(w * 0.2, -h * 0.2, 0, w * 0.2, -h * 0.2, w * 1.1); k.addColorStop(0, 'rgba(255,255,255,0.75)'); k.addColorStop(0.6, 'rgba(255,255,255,0.15)'); k.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = k; ctx.fillRect(0, 0, w, h);
  const d = ctx.createLinearGradient(w * 0.3, h * 0.3, w, h); d.addColorStop(0, 'rgba(120,124,170,0)'); d.addColorStop(1, 'rgba(120,124,170,0.10)'); ctx.fillStyle = d; ctx.fillRect(0, 0, w, h);
}
// the steel cube (stranger / customer): Blender L06 (body 300 at render 960,520) else the v3 sprite
function steelCube(ctx, t, cx, cy, bodyH, { t0 = 0 } = {}) {
  const id = 'L06_steel_cube_white'; if (R3.has(id)) return R3.at(ctx, R3.loop(id, t, t0), cx, cy, bodyH / 300, { sx: 958, sy: CUBE3_CY });
  return obj(ctx, 'steel', cx, cy, bodyH, { shadow: SHADOW });
}
// the violet glass app module (Tari template): Blender L16 (about 420 px wide at render 960,545) else the v3 sprite
function templateObj(ctx, t, cx, cy, w, { t0 = 0 } = {}) {   // the violet glass app module: Blender L16 (about 420 px wide at render 960,545)
  const id = 'L16_template_idle'; if (R3.has(id)) return R3.at(ctx, R3.loop(id, t, t0), cx, cy, w / 420, { sx: 960, sy: 536 });
  return obj(ctx, 'gmod', cx, cy, w * 0.62, {});
}
const CUBE3_CY = 513.8;   // the Blender cube's body centre in its 1920 frame (L01 end pose = L02 = L03 = L12 = L11a front block)
// an Ethereum app (Blender L08_app_*: about 200 px wide at render 962,522) else the v3 module sprite
function appObj(ctx, t, name, cx, cy, s = 1, { t0 = 0 } = {}) { const id = 'L08_app_' + name;
  if (R3.has(id)) return R3.at(ctx, R3.loop(id, t, t0), cx, cy, s, { sx: 962, sy: 522 }); return obj(ctx, 'azmod', cx, cy, 120 * s, { shadow: SHADOW }); }
