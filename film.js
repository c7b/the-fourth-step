'use strict';
// The long form, v4: the title card (T00) and the cube's jump, shots 03–14 on the voice timeline, then straight to the end card
// (the coda terminal is cut, owner note 14). Every shot change is a transformation (DIRECTION.md §7), never a dissolve.
const scr = (r, z) => [(r[0] - 960) * z + 960, (r[1] - 540) * z + 540, r[2] * z, r[3] * z, r[4] || 0];   // shot-space rect -> frame under a centre zoom
const endA = () => bsOr('B32', be('B30') + 0.6);
TL.total = Math.min(TL.total, endA() + 6.5);
run({
  prep: loadAssets,
  shots: () => [
    { id: 'T', a: 0, b: cubeSettle(), draw: shotT },
    { id: '03', a: cubeSettle(), b: bs('B04'), draw: shot03 },
    { id: '04', a: bs('B04'), b: bs('B06'), draw: shot04 },
    { id: '05', a: bs('B06'), b: bs('B07'), draw: shot05 },
    { id: '06', a: bs('B07'), b: bs('B09'), draw: shot06 },
    { id: '07', a: bs('B09'), b: bs('B13'), draw: shot07 },
    { id: '08', a: bs('B13'), b: bs('B16'), draw: shot08 },
    { id: '09', a: bs('B16'), b: bs('B22'), draw: shot09 },
    { id: '10', a: bs('B22'), b: bs('B23'), draw: shot10 },
    { id: '11', a: bs('B23'), b: bs('B25'), draw: shot11 },
    { id: '12', a: bs('B25'), b: bs('B27A'), draw: shot12 },
    { id: '13', a: bs('B27A'), b: bs('B29'), draw: shot13 },
    { id: '14', a: bs('B29'), b: endA(), draw: shot14 },
    { id: '16', a: endA(), b: TL.total + 1, draw: shot16 },
  ],
  trans: () => [
    { from: '03', to: '04', kind: 'flood', circle: true, color: C.cloud, t0: bs('B04') - 0.25, t1: bs('B04') + 0.75, rect: t => cubeRect(cubeH3(t)) },
    { from: '06', to: '07', kind: 'flood', color: C.cloud, t0: bs('B09') - 0.7, t1: bs('B09') + 0.3, rect: t => yourPlateRect(t), edge: C.ink },
    { from: '07', to: '08', kind: 'flood', circle: true, color: C.red, t0: bs('B13') - 0.42, t1: bs('B13') + 0.68, rect: t => scr(yourTag(), ethZoom(t)) },
    { from: '09', to: '10', kind: 'sweep', t0: bs('B22') - 0.5, t1: bs('B22') + 0.65 },
    { from: '10', to: '11', kind: 'rise', t0: bs('B23') - 0.35, t1: bs('B23') + 0.85 },
    { from: '11', to: '12', kind: 'flood', circle: true, color: C.ink, t0: bs('B25') - 0.4, t1: bs('B25') + 0.7, rect: [940, 520, 40, 40, 0], grow: true },
    { from: '13', to: '14', kind: 'flood', color: C.ink, t0: bs('B29') - 0.45, t1: bs('B29') + 0.65, rect: t => scr(flagBand(), 1) },
    { from: '14', to: '16', kind: 'contract', solid: C.green, t0: endA() - 0.05, t1: endA() + 0.75, rect: t => endChipRect() },
  ],
});
