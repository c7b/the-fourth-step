'use strict';
// v4 timeline adapter. With the v4 voice timeline (work/v4/timeline-*.js, no B01/B02/B19/B31) it only records the title slot.
// With the v3 timeline (the interim, until work/v4/READY) it applies the owner's cuts so the picture can be built now:
//   B01–B02 (terminal + old title) removed, a 3 s title slot T00 before B03; B19 (the noobs quote) removed; B31 (the coda) removed.
// window.TLCUTS lists the cuts in source time ({ at, dur }), so the audio pass can cut the v3 VO the same way.
(() => {
  const TL = window.TL, T00 = 3.0, cuts = [];
  const shiftAfter = (t, d) => { for (const b of TL.beats) { const sh = o => { if (o.start >= t) o.start -= d; if (o.end > t) o.end -= d; };
    sh(b); if (b.voStart != null) { if (b.voStart >= t) b.voStart -= d; if (b.voEnd > t) b.voEnd -= d; } for (const w of b.words || []) sh(w); } TL.total -= d; };
  const drop = id => { const i = TL.beats.findIndex(b => b.id === id); if (i < 0) return; const b = TL.beats[i], d = b.end - b.start;
    TL.beats.splice(i, 1); cuts.push({ id, at: b.start, dur: d }); shiftAfter(b.end, d); };
  if (TL.beats.some(b => b.id === 'B01')) {
    const b3 = TL.beats.find(b => b.id === 'B03'), d = b3.start - T00;
    TL.beats = TL.beats.filter(b => b.id !== 'B01' && b.id !== 'B02'); cuts.push({ id: 'B01-B02', at: 0, dur: d }); shiftAfter(0, d);
    TL.beats.unshift({ id: 'T00', start: 0, end: T00 });
    // B19 and B31 (source times are recorded after the opening shift, so add d back for the audio pass)
    for (const id of ['B19', 'B31']) { const n = cuts.length; drop(id); if (cuts.length > n) { const c = cuts.at(-1); c.at += d + cuts.slice(1, -1).reduce((s, x) => s + x.dur, 0); } }
    TL.version = 'v3-cut';
  } else if (!TL.beats.some(b => b.id === 'T00')) {
    const first = TL.beats[0]; TL.beats.unshift({ id: 'T00', start: 0, end: first.start });
  }
  window.TLCUTS = cuts;
})();
