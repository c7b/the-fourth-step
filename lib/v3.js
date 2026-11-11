'use strict';
// "The Fourth Step" v3: design system + motion primitives (vanilla Canvas2D, deterministic, seekable).
// Every frame is a pure function of t. No clocks, no Math.random (seeded noise only). Page contract (same as the skill
// and prod/): canvas #c, window.renderAt(t), window.TOTAL, window.ready, window.EVENTS, ?t= for a still, ?w= output width.
// Scenes draw in logical px (1920x1080, or 1080x1920 for Shorts); the stage scales to the output canvas.
const V3 = (() => {
  const BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/lib\/v3\.js.*$/, '') : '../';

  // ---------------- tokens ----------------
  // Tari brand kit, sampled from the PDF's pixels (primaries match the kit's stated hex exactly).
  const C = {
    ink: '#040723', cloud: '#ECEEFF', purple: '#813BF5', green: '#C9EB00',          // primary
    red: '#FE2C3F', azure: '#0939CF', yellow: '#EBC216',                            // secondary accents
    steel: '#67697C', frost: '#D3D7DE', beige: '#F6E6D4', offwhite: '#FBF1E9',     // secondary neutrals
    glitch: [[0, '#DC1529'], [0.45, '#0F36D6'], [1, '#C2F32D']],                    // "Glitch Gradient"
    black: '#000000',
  };
  // Roles: what each colour MEANS in the film (DIRECTION.md section 1).
  const ROLE = {
    void: C.ink, public: C.cloud, you: C.green, tari: C.purple, flag: C.red, program: C.azure, coin: C.yellow,
    hidden: C.steel, paper: C.frost,
  };
  const F = { display: 'V3Display', wide: 'V3Wide', sans: 'V3Sans', mono: 'V3Mono' };
  // Type scale, logical px at 1080p (long form) and 1080x1920 (Shorts).
  const TYPE = {
    long: { numeral: 760, hero: 330, statement: 200, headline: 120, sentence: 56, body: 40, label: 28, micro: 20 },
    short: { numeral: 620, hero: 300, statement: 210, headline: 130, sentence: 62, body: 44, label: 32, micro: 24 },
  };

  // ---------------- math ----------------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
  const expoOut = k => (k = clamp(k)) >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
  const expoInOut = k => { k = clamp(k); if (k === 0 || k === 1) return k; return k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2; };
  const cubicInOut = k => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const cubicOut = k => 1 - Math.pow(1 - clamp(k), 3);
  const quartOut = k => 1 - Math.pow(1 - clamp(k), 4);
  const sine = k => 0.5 - 0.5 * Math.cos(Math.PI * clamp(k));
  // fast-then-slow-for-longer: exponential approach that never stops and never reverses
  const approach = (t, tau) => (t <= 0 ? 0 : 1 - Math.exp(-t / tau));
  // monotone cubic curve through keys [[t, v], ...]: never overshoots, so a move can't wobble backwards (port of tracks.py)
  function curve(keys) {
    const T = keys.map(k => k[0]), V = keys.map(k => k[1]), n = T.length;
    const d = []; for (let i = 0; i < n - 1; i++) d.push((V[i + 1] - V[i]) / (T[i + 1] - T[i]));
    const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i])); m.push(d[n - 2]);
    return t => {
      if (t <= T[0]) return V[0]; if (t >= T[n - 1]) return V[n - 1];
      let i = 0; while (t > T[i + 1]) i++;
      const h = T[i + 1] - T[i], u = (t - T[i]) / h;
      return (2 * u ** 3 - 3 * u ** 2 + 1) * V[i] + (u ** 3 - 2 * u ** 2 + u) * h * m[i] + (-2 * u ** 3 + 3 * u ** 2) * V[i + 1] + (u ** 3 - u ** 2) * h * m[i + 1];
    };
  }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
  const mix = (a, b, k) => { const x = hexRgb(a), y = hexRgb(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], k)).toString(16).padStart(2, '0')).join(''); };

  // ---------------- stage ----------------
  let W = 1920, H = 1080, S = 1; let DRY = false;
  const Q = new URLSearchParams(location.search);
  const IMG = {};
  function img(name, url) { const i = new Image(); i.src = url.startsWith('http') || url.startsWith('/') ? url : BASE + url; IMG[name] = i; return i.decode().then(() => i).catch(() => { console.error('image missing, drawn as empty: ' + url); const c = canvas(1, 1); IMG[name] = c; return c; }); }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  async function fonts() {
    const list = [
      new FontFace(F.display, `url(${BASE}fonts/SofiaSansExtraCondensed-VF.ttf)`, { weight: '1 1000' }),
      new FontFace(F.wide, `url(${BASE}fonts/Archivo-VF.ttf)`, { weight: '100 900', stretch: '62% 125%' }),
      new FontFace(F.sans, `url(${BASE}fonts/Poppins-Regular.ttf)`, { weight: '400' }),
      new FontFace(F.sans, `url(${BASE}fonts/Poppins-Medium.ttf)`, { weight: '500' }),
      new FontFace(F.sans, `url(${BASE}fonts/Poppins-SemiBold.ttf)`, { weight: '600' }),
      new FontFace(F.sans, `url(${BASE}fonts/Poppins-Bold.ttf)`, { weight: '700' }),
      new FontFace(F.mono, `url(${BASE}fonts/DMMono-Regular.ttf)`, { weight: '400' }),
      new FontFace(F.mono, `url(${BASE}fonts/DMMono-Medium.ttf)`, { weight: '500' }),
    ];
    await Promise.all(list.map(f => f.load().then(x => document.fonts.add(x))));
  }
  // stage({ w, h, total, prep, draw(ctx, t), events })
  function stage(o) {
    W = o.w || 1920; H = o.h || 1080;
    const outW = +(Q.get('w') || W); S = outW / W;
    const cv = document.getElementById('c'); cv.width = outW; cv.height = Math.round(H * S);
    const ctx = cv.getContext('2d');
    const dummy = canvas(1, 1).getContext('2d');
    const render = t => { ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H); o.draw(ctx, t); return true; };
    window.TOTAL = o.total; window.total = o.total; window.EVENTS = o.events || [];
    // two passes when R3 is present: a dry pass on a 1x1 canvas collects the Blender frames this t needs, they load, then the real draw
    const renderAsync = async t => { if (typeof R3 !== "undefined") { R3.begin(); DRY = true; try { dummy.setTransform(1, 0, 0, 1, 0, 0); o.draw(dummy, t); } catch (e) { console.error('dry pass: ' + e.message); } DRY = false; await R3.end(); } return render(t); };
    window.ready = (async () => { await fonts(); if (o.prep) await o.prep(); window.renderAt = t => renderAsync(t); await renderAsync(+(Q.get('t') || o.still || 0)); document.title = 'ready'; return true; })();
  }

  // ---------------- drawing helpers ----------------
  const font = (ctx, fam, size, weight = 400, stretch) => { ctx.font = `${weight} ${size}px ${fam}`; ctx.fontStretch = stretch || 'normal'; };
  const display = (ctx, size) => font(ctx, F.display, size, 900);
  const wide = (ctx, size, w = 900) => font(ctx, F.wide, size, w, 'expanded');
  const mono = (ctx, size, w = 500) => font(ctx, F.mono, size, w);
  const sans = (ctx, size, w = 600) => font(ctx, F.sans, size, w);
  function fill(ctx, col) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
  // draw an image to cover the frame, zoomed by `zoom` about focal point (fx, fy) in 0..1 image space, placed at frame centre (+ox, oy)
  function cover(ctx, im, { zoom = 1, fx = 0.5, fy = 0.5, ox = 0, oy = 0, blur = 0, alpha = 1, w = W, h = H, x = 0, y = 0 } = {}) { if (DRY) return;
    if (!im || !im.naturalWidth) return;
    const s = Math.max(w / im.naturalWidth, h / im.naturalHeight) * zoom;
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (blur) ctx.filter = `blur(${blur * S}px)`; ctx.globalAlpha *= alpha;
    ctx.drawImage(im, x + w / 2 + ox - fx * dw, y + h / 2 + oy - fy * dh, dw, dh); ctx.restore();
  }
  // camera: zoom about the frame centre and pan; fn draws the shot in its own frame space
  function camera(ctx, { zoom = 1, x = 0, y = 0, rot = 0 } = {}, fn) {
    ctx.save(); ctx.translate(W / 2 + x, H / 2 + y); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); fn(); ctx.restore();
  }
  // tracked text (canvas letterSpacing) with alignment
  function text(ctx, s, x, y, { align = 'left', base = 'alphabetic', color = C.cloud, track = 0, alpha = 1 } = {}) {
    ctx.save(); ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = track + 'px'; ctx.fillStyle = color; ctx.globalAlpha *= alpha; ctx.fillText(s, x, y); ctx.restore();
  }
  const measure = (ctx, s, track = 0) => { ctx.save(); ctx.letterSpacing = track + 'px'; const m = ctx.measureText(s).width; ctx.restore(); return m; };

  // Words slide up into place one after another, each from behind its own line mask (no bounce, no letter fades).
  // lines: string or array of strings. Returns the block's box. Optional leave: words slide up and out, in order.
  // opts: { x, y (baseline of first line), size, fam ('display'|'sans'|'mono'|'wide'), color, colors (per word), align,
  //         t0, stagger, dur, lead (line height ×), track, leave, upper }
  function words(ctx, lines, t, o = {}) {
    if (o.x == null) o = { ...o, x: W / 2 };
    lines = Array.isArray(lines) ? lines : [lines];
    const size = o.size || 120, lead = o.lead || ((o.fam === 'display' || !o.fam) ? 0.86 : 1.18), align = o.align || 'center';
    const set = () => (o.fam === 'sans' ? sans(ctx, size, o.weight || 600) : o.fam === 'mono' ? mono(ctx, size, o.weight || 500) : o.fam === 'wide' ? wide(ctx, size, o.weight || 900) : display(ctx, size));
    const track = o.track ?? (o.fam === 'display' || !o.fam ? -size * 0.005 : o.fam === 'mono' ? size * 0.02 : -size * 0.03);
    const stagger = o.stagger ?? 0.075, dur = o.dur ?? 0.62, t0 = o.t0 ?? 0;
    let n = 0, box = { x0: Infinity, x1: -Infinity, y0: o.y - size, y1: o.y + (lines.length - 1) * size * lead + size * 0.2 };
    ctx.save(); set();
    lines.forEach((line, li) => {
      const ws = line.split(' '), sp = measure(ctx, ' ', track), wl = ws.map(w => measure(ctx, w, track));
      const total = wl.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
      let x = align === 'center' ? o.x - total / 2 : align === 'right' ? o.x - total : o.x;
      const y = o.y + li * size * lead;
      box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x + total);
      ws.forEach((w, wi) => {
        const a = (o.cues && o.cues[n] != null) ? o.cues[n] : t0 + n * stagger, e = quartOut(prog(t, a, a + dur));
        let off = (1 - e) * size * 1.05;
        if (o.leave != null) { const b = o.leave + n * stagger * 0.6; off -= expoInOutSafe(prog(t, b, b + dur * 0.8)) * size * 1.05; }
        n++;
        if (e > 0 && off > -size * 1.04) {
          ctx.save(); ctx.beginPath(); ctx.rect(x - size * 0.2, y - size * (o.fam === 'display' || !o.fam ? 0.9 : 1.0), wl[wi] + size * 0.4, size * (o.fam === 'display' || !o.fam ? 1.04 : 1.32)); ctx.clip();
          const blurPx = Math.min(6, Math.abs(1 - e) * 10); if (blurPx > 0.4) ctx.filter = `blur(${blurPx * S * 0.5}px)`;
          text(ctx, w, x, y + off, { color: (o.colors && o.colors[n - 1]) || o.color || C.cloud, track });
          ctx.restore();
        }
        x += wl[wi] + sp;
      });
    });
    ctx.restore();
    return box;
  }
  const expoInOutSafe = k => cubicInOut(k);

  // giant stacked display lines (the brand kit's city-list pages): each line slides up after the previous
  function stack(ctx, lines, t, o = {}) {
    const size = o.size || 300, lead = o.lead || 0.84;
    const y0 = o.y ?? (H / 2 - ((lines.length - 1) * size * lead) / 2 + size * 0.36);
    lines.forEach((l, i) => words(ctx, l, t, { ...o, x: o.x ?? W / 2, y: y0 + i * size * lead, size, t0: (o.t0 || 0) + i * (o.lineGap ?? 0.12), stagger: o.stagger ?? 0.05, color: (o.lineColors && o.lineColors[i]) || o.color }));
  }

  let MIN_MONO = 0; const minMono = v => { if (v != null) MIN_MONO = v; return MIN_MONO; };
  // mono caps label, tracked
  function label(ctx, s, x, y, { size = 24, color = C.cloud, align = 'left', alpha = 1, weight = 500, track, floor = true } = {}) {
    if (floor) size = Math.max(size, MIN_MONO); mono(ctx, size, weight); text(ctx, s.toUpperCase(), x, y, { align, color, alpha, track: track ?? size * 0.12 });
  }
  // a solid label bar (Marathon's keyword bars): text on a block, padded
  function chip(ctx, s, x, y, { size = 24, bg = C.green, fg = C.ink, align = 'left', padX = 14, padY = 9, k = 1, upper = true, floor = true } = {}) {
    if (floor) size = Math.max(size, MIN_MONO); mono(ctx, size, 500); const str = upper ? s.toUpperCase() : s, tr = size * 0.1, w = measure(ctx, str, tr) + padX * 2, h = size + padY * 2;
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y - h + padY * 0.6, w * clamp(k), h); ctx.clip();
    ctx.fillStyle = bg; ctx.fillRect(x0, y - h + padY * 0.6, w, h);
    text(ctx, str, x0 + padX, y - padY * 0.2 - size * 0.12, { color: fg, track: tr }); ctx.restore();
    return { x: x0, w, h };
  }
  // diagonal stripes in a rect (identity / hazard / exposure). phase in px slides the pattern (always one direction)
  function stripes(ctx, x, y, w, h, { period = 36, duty = 0.5, angle = -45, fg = C.ink, bg = null, phase = 0, alpha = 1 } = {}) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalAlpha *= alpha;
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(x, y, w, h); }
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle * Math.PI / 180);
    const R = Math.hypot(w, h) / 2 + period; ctx.fillStyle = fg;
    const p0 = ((phase % period) + period) % period;
    for (let u = -R - period + p0; u < R; u += period) ctx.fillRect(u, -R, period * duty, R * 2);
    ctx.restore();
  }
  // "+" registration marks on a grid (the system's own grid made visible)
  function reg(ctx, { pitch = 120, size = 9, color = C.cloud, alpha = 0.22, lw = 1.6, ox = 0, oy = 0, x0 = 0, y0 = 0, x1 = W, y1 = H } = {}) {
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha *= alpha; ctx.lineWidth = lw; ctx.beginPath();
    const sx = x0 + ((ox % pitch) + pitch) % pitch, sy = y0 + ((oy % pitch) + pitch) % pitch;
    for (let x = sx; x <= x1; x += pitch) for (let y = sy; y <= y1; y += pitch) { ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); }
    ctx.stroke(); ctx.restore();
  }
  // corner brackets around a box (frames a subject without boxing it)
  function brackets(ctx, x, y, w, h, { len = 26, lw = 3, color = C.cloud, alpha = 1 } = {}) {
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha *= alpha; ctx.lineWidth = lw; ctx.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([a, b, sx, sy]) => { ctx.moveTo(a + sx * len, b); ctx.lineTo(a, b); ctx.lineTo(a, b + sy * len); });
    ctx.stroke(); ctx.restore();
  }
  // redaction bar: grows left to right (expo), solid block, optional hairline under
  function redact(ctx, x, y, w, h, k, { color = C.ink } = {}) {
    if (k <= 0) return; ctx.save(); ctx.fillStyle = color; ctx.fillRect(x, y, w * expoOut(k), h); ctx.restore();
  }
  // engraved (debossed) text on a lit metal plate, light from the upper left: dark core, bright lower-right lip
  function engrave(ctx, s, x, y, { size = 40, fam = 'mono', weight = 500, align = 'left', depth = 1.6, ink = 'rgba(18,22,44,0.78)', lip = 'rgba(255,255,255,0.85)', track } = {}) {
    if (fam === 'mono') mono(ctx, size, weight); else if (fam === 'display') display(ctx, size); else sans(ctx, size, weight);
    const tr = track ?? (fam === 'mono' ? size * 0.04 : 0);
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    text(ctx, s, x + depth * 0.7, y + depth, { align, color: lip, track: tr });
    ctx.filter = `blur(${0.6 * S}px)`; text(ctx, s, x - depth * 0.3, y - depth * 0.3, { align, color: 'rgba(10,12,30,0.35)', track: tr }); ctx.filter = 'none';
    ctx.globalCompositeOperation = 'multiply'; text(ctx, s, x, y, { align, color: ink, track: tr });
    ctx.restore();
  }
  // mono typing: deterministic characters typed by t at cps, with a block cursor
  function typed(ctx, s, x, y, t, t0, cps, { size = 34, color = C.cloud, cursor = true, cursorColor = C.green, weight = 500, hold = 99, floor = true } = {}) {
    if (floor) size = Math.max(size, MIN_MONO);
    const n = Math.floor(clamp((t - t0) * cps, 0, s.length)); if (t < t0) return 0;
    mono(ctx, size, weight); const shown = s.slice(0, n); text(ctx, shown, x, y, { color, track: size * 0.02 });
    if (cursor && t < t0 + s.length / cps + hold) { const blink = n < s.length || Math.floor((t - t0 - s.length / cps) * 2) % 2 === 0;
      if (blink) { const cw = measure(ctx, 'M', size * 0.02); ctx.fillStyle = cursorColor; ctx.fillRect(x + measure(ctx, shown, size * 0.02) + 2, y - size * 0.82, cw * 0.92, size * 1.0); } }
    return n;
  }
  // dotted leader line between a key and a value (terminal / statement rows)
  function leader(ctx, x0, x1, y, { color = C.steel, alpha = 0.8, gap = 12, r = 2 } = {}) {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha *= alpha; for (let x = x0; x < x1; x += gap) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
  }
  // bottom tracker bar: step index + three cells that fill as the film earns them (MONEY · PROGRAMMABLE · PRIVATE)
  function tracker(ctx, { step = 1, lit = [false, false, false], cols = [C.yellow, C.azure, C.steel], fg = C.cloud, y = H - 58, alpha = 1, k = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const x0 = 96, cellW = 330, gap = 10, names = ['money', 'programmable', 'private'], ch = 44, yy = H - 76;
    label(ctx, `step 0${step} / 04`, x0, yy + 32, { size: 30, color: fg, alpha: 0.9 });
    names.forEach((n, i) => { const x = W - 96 - (3 - i) * (cellW + gap) + gap, on = lit[i];
      ctx.globalAlpha = alpha * clamp(k * 3 - i);
      if (on) { ctx.fillStyle = cols[i]; ctx.fillRect(x, yy, cellW * (on === true ? 1 : on), ch); }
      ctx.strokeStyle = fg; ctx.lineWidth = 1.5; ctx.globalAlpha *= 0.55; ctx.strokeRect(x + 0.75, yy + 0.75, cellW - 1.5, ch - 1.5); ctx.globalAlpha = alpha * clamp(k * 3 - i);
      label(ctx, n, x + 12, yy + 32, { size: 30, color: on ? (cols[i] === C.green || cols[i] === C.yellow || cols[i] === C.cloud ? C.ink : C.cloud) : fg, alpha: on ? 1 : 0.7, track: 30 * 0.06 }); });
    ctx.restore();
  }
  // giant act numeral, rising from behind a mask, with the act name in mono under it
  function numeral(ctx, n, t, { t0 = 0, x = W / 2, y = H / 2 + 270, size = 760, color = C.cloud, name, year, nameColor } = {}) {
    words(ctx, n, t, { x, y, size, color, t0, dur: 0.8 });
    if (name) words(ctx, `${name}`, t, { x, y: y + 92, size: 34, fam: 'mono', color: nameColor || color, t0: t0 + 0.25, track: 34 * 0.3 });
  }
  // shape-morph transition (no dissolves): the outgoing object's rect grows to the frame, flooded with the next
  // shot's field colour, then the next shot eases in (0.93 -> 1) inside it. from: [x, y, w, h, r]; k: 0..1
  function morph(ctx, k, from, nextBg, drawNext, { to = [-40, -40, W + 80, H + 80, 0], circle = false } = {}) {
    if (k <= 0) return; const e = expoInOut(k);
    const r = [0, 1, 2, 3, 4].map(i => lerp(from[i], to[i], e));
    ctx.save(); ctx.beginPath();
    if (circle) { const cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2; ctx.arc(cx, cy, Math.max(r[2], r[3]) / 2, 0, Math.PI * 2); } else ctx.roundRect(r[0], r[1], r[2], r[3], Math.max(0, r[4]));
    ctx.clip(); fill(ctx, nextBg);
    if (k > 0.12 && drawNext) camera(ctx, { zoom: lerp(0.93, 1, quartOut(prog(k, 0.12, 1))) }, () => drawNext(ctx));
    ctx.restore();
  }
  // a frame pushed into a target rect: returns the camera that maps rect -> full frame at k=1 (log-space zoom, no speed spike)
  function pushInto(rect, k) {
    const [x, y, w, h] = rect, zMax = Math.max(W / w, H / h), z = Math.exp(lerp(0, Math.log(zMax), k));
    const cx = x + w / 2, cy = y + h / 2, f = (z - 1) / (zMax - 1 || 1);
    return { zoom: z, x: -(cx - W / 2) * z * f, y: -(cy - H / 2) * z * f };
  }
  // fine deterministic film grain (dither against banding on gradients), seeded per frame
  let _grain = null;
  function grain(ctx, t, amount = 0.05) { if (DRY) return;
    if (!_grain) { _grain = canvas(256, 256); const g = _grain.getContext('2d'), d = g.createImageData(256, 256), r = rng(7);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.floor(r() * 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
    const f = Math.floor(t * 24), r = rng(f * 7919 + 1);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = amount; ctx.globalCompositeOperation = 'overlay';
    const p = ctx.createPattern(_grain, 'repeat'); p.setTransform(new DOMMatrix().translate(Math.floor(r() * 256), Math.floor(r() * 256)));
    ctx.fillStyle = p; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }
  function vignette(ctx, a = 0.5, col = '4,7,35') {
    ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.58);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // a soft key-light pool (one source, upper left by default) for code-drawn fields
  function keyLight(ctx, { x = W * 0.3, y = -H * 0.2, r = W * 0.9, col = '236,238,255', a = 0.10 } = {}) {
    ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // the Tari logo (SVG as given), centred by its visible bounds (the SVG's paths fill its 511x159 viewBox)
  function logo(ctx, im, cx, cy, h, alpha = 1) { if (!im || !im.naturalWidth) return; const w = h * 511 / 159; ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h); ctx.restore(); }
  // draw an image centred at (cx, cy) with height h (keeps aspect); optional crop [sx, sy, sw, sh] in source px
  function place(ctx, im, cx, cy, h, { crop, alpha = 1, blur = 0, comp } = {}) {
    if (!im || !im.naturalWidth) return; const [sx, sy, sw, sh] = crop || [0, 0, im.naturalWidth, im.naturalHeight], w = h * sw / sh;
    ctx.save(); ctx.globalAlpha *= alpha; if (blur) ctx.filter = `blur(${blur * S}px)`; if (comp) ctx.globalCompositeOperation = comp;
    ctx.drawImage(im, sx, sy, sw, sh, cx - w / 2, cy - h / 2, w, h); ctx.restore(); return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  // cut a plate's object out of its flat studio background: alpha = smoothstep(lo, hi, colour distance to bg).
  // crop [sx, sy, sw, sh] in source px. Computed once in prep (deterministic). Returns a canvas.
  function key(im, { bg, lo = 18, hi = 60, crop } = {}) {
    const [sx, sy, sw, sh] = crop || [0, 0, im.naturalWidth, im.naturalHeight];
    const c = canvas(sw, sh), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
    const d = g.getImageData(0, 0, sw, sh), a = d.data, ref = bg || [a[0], a[1], a[2]];
    for (let i = 0; i < a.length; i += 4) { const dist = Math.hypot(a[i] - ref[0], a[i + 1] - ref[1], a[i + 2] - ref[2]); const k = clamp((dist - lo) / (hi - lo)); a[i + 3] = Math.round(255 * k * k * (3 - 2 * k)); }
    g.putImageData(d, 0, 0); return c;
  }
  // draw a canvas/image sprite centred at (cx, cy) with height h
  function sprite(ctx, sp, cx, cy, h, { alpha = 1, blur = 0, comp, shadow } = {}) { if (DRY) return;
    if (!sp) return; const sw = sp.width || sp.naturalWidth, sh = sp.height || sp.naturalHeight, w = h * sw / sh;
    ctx.save(); ctx.globalAlpha *= alpha; if (blur > 0.3) ctx.filter = `blur(${blur * S}px)`; if (comp) ctx.globalCompositeOperation = comp;
    if (shadow) { ctx.shadowColor = shadow.color; ctx.shadowBlur = shadow.blur * S; ctx.shadowOffsetX = shadow.x * S; ctx.shadowOffsetY = shadow.y * S; }
    ctx.drawImage(sp, cx - w / 2, cy - h / 2, w, h); ctx.restore(); return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  // ---------------- 2.5D: a yaw-only camera and textured vertical planes, exact via column strips ----------------
  // cam: { x, y, z (eye), yaw (rad, + looks right), f (focal px), cx, cy }. World: x right, y up, z toward the viewer.
  function proj(cam, X, Y, Z) {
    const dx = X - cam.x, dy = Y - cam.y, dz = Z - cam.z, c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
    const xr = dx * c + dz * s, d = dx * s - dz * c; if (d < 1) return null;
    return { x: (cam.cx ?? W / 2) + cam.f * xr / d, y: (cam.cy ?? H / 2) - cam.f * dy / d, k: cam.f / d, d };
  }
  // camera orbiting a target at distance D, yaw th (0 = square to the wall), eye height offset ey
  function orbit(target, D, th, ey = 0, f = 2000) { return { x: target[0] - D * Math.sin(th), y: target[1] + ey, z: (target[2] || 0) + D * Math.cos(th), yaw: th, f }; }
  // draw a texture (canvas/image) as a vertical plane: world rect left X0, top Y0, width Ww, height Wh, at depth Z.
  // A vertical line on the plane has one depth, so narrow column strips give exact perspective (no WebGL needed).
  function plane(ctx, tex, cam, { X0, Y0, Ww, Wh, Z = 0, du = 3, alpha = 1, uMin = 0, uMax = 1 } = {}) { if (DRY) return;
    const tw = tex.width || tex.naturalWidth, th = tex.height || tex.naturalHeight; ctx.save(); ctx.globalAlpha *= alpha;
    const ua = Math.floor(uMin * tw), ub = Math.ceil(uMax * tw); if (ub <= ua) { ctx.restore(); return; }
    for (let u = ua; u < ub; u += du) {
      const u1 = Math.min(ub, u + du), xa = X0 + u / tw * Ww, xb = X0 + u1 / tw * Ww, xm = (xa + xb) / 2;
      const pa = proj(cam, xa, Y0, Z), pb = proj(cam, xb, Y0, Z), pm = proj(cam, xm, Y0, Z), pm2 = proj(cam, xm, Y0 - Wh, Z);
      if (!pa || !pb || !pm || !pm2) continue; if (pb.x < -10 || pa.x > W + 10) continue;
      ctx.drawImage(tex, u, 0, u1 - u, th, pa.x, pm.y, Math.max(0.5, pb.x - pa.x + 0.7), pm2.y - pm.y);
    }
    ctx.restore();
  }
  // depth of field for a plane seen at an angle: blur grows with |depth - focus|, which is monotonic across screen x.
  // Re-draws `layer` (a full-frame canvas) in vertical bands with increasing blur. blurAt(sx) -> px.
  function dofBands(ctx, layer, blurAt, { bands = 24 } = {}) { if (DRY) return;
    const bw = W / bands; ctx.save();
    for (let i = 0; i < bands; i++) { const x = i * bw, b = blurAt(x + bw / 2);
      ctx.save(); ctx.beginPath(); ctx.rect(x - 0.5, -2, bw + 1, H + 4); ctx.clip();
      if (b > 0.35) ctx.filter = `blur(${b * S}px)`; ctx.drawImage(layer, 0, 0, W, H); ctx.restore(); }
    ctx.restore();
  }
  const _layers = {};
  function layer(name) { const w = Math.round(W * S), h = Math.round(H * S); let c = _layers[name]; if (!c || c.width !== w || c.height !== h) c = _layers[name] = canvas(w, h);
    const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(S, 0, 0, S, 0, 0); g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over'; return c; }

  return {
    key, sprite, proj, orbit, plane, dofBands, layer, get dry() { return DRY; },
    C, ROLE, F, TYPE, get W() { return W; }, get H() { return H; }, get S() { return S; }, IMG, img, canvas, stage,
    clamp, lerp, prog, expoOut, expoInOut, cubicInOut, cubicOut, quartOut, sine, approach, curve, rng, rgba, mix, hexRgb,
    font, display, wide, monoFont: (ctx, s, w) => mono(ctx, s, w), sans, fill, cover, camera, text, measure,
    minMono, words, stack, label, chip, stripes, reg, brackets, redact, engrave, typed, leader, tracker, numeral, morph, pushInto, grain, vignette, keyLight, logo, place,
  };
})();
