// Where every sound effect goes (v4). Times come from the same word cues the picture animates on (acts/*.js, shorts.js).
// Names are unique parts of the candidate file names in audio/sfx/cand/ (see audio/SFX-USED.md for the full list).
const CLING = 'Rod-Resonance', METALHIT = 'Hammer-Hit-Light-Metal', LOWHIT = 'Small-Hit-Drum-Deep', HARDHIT = 'Hard-Hit-Hard-Impact',
  ROCK = 'Heavy-Single-Rocks', DRYHIT = 'Dry-Break-Impact', BASS = 'Low-Metal-Impact', COIN = 'Stack-of-Coins', BEEP = 'Treadmill-Parameter-Button',
  CLICK = 'COMCam-Short-Click', CLICK2 = 'COMCam-Very-Short-Click', MCLICK = 'Pre-Shifted-Very-Short-Metal-Click', SHUTTER = 'Single-Click-Shutter',
  MECH = 'MECHGear-Camera-Shutter-Movement', LOCK = 'Spaceship-Door-Locking', TORCH = 'Quick-Torch-Whoosh', SERVO = 'Old-Robot-Servo-Motor-4',
  W_FLOOD = 'Deep-Filtered-Cloudy', W_RL = 'Deep-Filtered-Right-to-Left', W_LR = 'Windy-Left-to-Right', W_SOFT = 'Soft-White-Noise', W_DARK = 'Deep-Soft-Dark-Whip',
  W_SPIN = 'Medium-Whoosh-Dark-Filtered', RISER = 'Reverse-Crash', WHIP = (n) => `Short-Whoosh-${n}.wav`, GLITCH = (n) => `Glitch-${n}.wav`;
const ev = (t, s, db, what, o = {}) => ({ t, s, db, what, ...o });
const flood = (t, what, db = -15) => ev(t, W_FLOOD, db, what, { at: 'peak', len: 1.5, fade: 0.5 });

export const EVENTS = {
  long({ wt, bs, be }) {
    const This = wt('B03', 'This'), land = Math.max(2.6, This - 1.0), E = [];
    const add = (...a) => E.push(ev(...a));
    // T00 · title, the jump, the cling
    add(0.15, WHIP(12), -20, 'title words rise');
    add(land - 0.82, WHIP(7), -20, 'cube jumps in from below');
    E.push(ev(land, CLING, -9, 'the cube lands: the cling', { len: 1.1, fade: 0.6 }));
    // B03 · you, the traces
    add(wt('B03', 'you.'), CLICK, -20, 'chip "you"');
    add(wt('B03', 'paid,') - 0.3, WHIP(4), -22, 'trace in from the left', { pan: -0.5 });
    add(wt('B03', 'pay') - 0.1, WHIP(8), -22, 'trace out to the right', { pan: 0.5 });
    for (let i = 0; i < 4; i++) for (const p of [-1, 1]) add(wt('B03', 'trace.') + i * 0.08 + (p > 0 ? 0.04 : 0), MCLICK, -27, 'trace marks', { pan: p * (0.2 + i * 0.15) });
    E.push(flood(bs('B04') + 0.25, 'flood into the white world (01)'));
    // B04 · Bitcoin: the numeral, the stranger, the bank drops in and sinks, the coin crosses
    add(wt('B04', 'Step'), WHIP(16), -20, '01 rises');
    add(wt('B04', 'two') - 0.1, W_LR, -22, 'stranger slides in', { pan: 0.4, len: 0.6 });
    { const s = wt('B04', 'strangers'), d = wt('B04', 'send'); E.push(ev(s + 0.3 * (d - s), ROCK, -13, 'the bank lands', { at: 'peak', len: 1.4, fade: 0.6 })); }
    add(wt('B04', 'no'), W_DARK, -20, 'the bank sinks away', { len: 1.0 });
    add(wt('B04', 'send') + 0.15, COIN, -22, 'coin appears', { len: 0.5, fade: 0.3 });
    { const rollAt = wt('B04', 'no') + 0.85; add(rollAt, WHIP(4), -24, 'the coin starts to roll (after the bank has sunk)', { pan: -0.3 }); add(rollAt + 1.2, COIN, -21, 'coin arrives at the stranger', { len: 0.7, fade: 0.4 }); }
    add(wt('B04', 'middle.') + 0.05, BEEP, -24, 'tracker: money lit', { len: 0.35 });
    // B05 · the plate rises; B06 public; B07 told / struck; hops; B08 the landing line
    add(wt('B05', 'Instead') + 0.2, W_SOFT, -21, 'camera tilts up to the plate', { len: 1.2, fade: 0.5 });
    add(wt('B05', 'everyone'), SHUTTER, -22, 'statement header engraved');
    add(wt('B06', 'public.'), LOWHIT, -15, 'PUBLIC.', { len: 1.0, fade: 0.5 });
    add(wt('B06', 'Picture'), CLICK, -22, 'brackets on your plate');
    add(wt('B07', 'Early') - 0.1, W_LR, -22, 'light panel wipes in', { len: 0.6 });
    add(wt('B07', "isn't.") - 0.1, GLITCH(3), -18, 'struck through: ANONYMOUSLY');
    for (let i = 0; i < 8; i++) add(wt('B07', 'one') + i * 0.38 + 0.15, MCLICK, -26, 'hop to the next plate', { pan: -0.4 + i * 0.1 });
    add(wt('B08', 'So') - 0.05, W_LR, -22, 'panel wipes in', { len: 0.6 });
    add(wt('B08', 'no'), LOWHIT, -17, 'NO BANK.', { len: 0.8, fade: 0.4 });
    add(wt('B08', 'perfect'), LOWHIT, -18, 'PERFECT MEMORY.', { len: 0.8, fade: 0.4 });
    // B09–B12 · Ethereum
    E.push(flood(bs('B09') - 0.2, 'flood out of your plate (02)'));
    add(wt('B09', 'Step'), WHIP(16), -20, '02 rises');
    add(wt('B09', 'What'), SERVO, -22, 'the smart contract rises', { len: 0.5 });
    add(wt('B09', 'in,') - 0.2, COIN, -22, 'money in (the coin rolls into the port)', { len: 0.5, fade: 0.3 });
    add(wt('B09', 'rules'), BEEP, -22, 'the rules run (indicator)', { len: 0.35 });
    add(wt('B09', 'no') + 0.2, WHIP(21), -22, 'money out (the coin leaves the port)', { pan: 0.5 });
    ['exchanges,', 'loans,', 'games', 'savings'].forEach((w, i) => add(wt('B10', w), SHUTTER, -20, `app appears: ${w.replace(',', '')}`, { pan: [-0.5, 0.5, -0.3, 0.3][i] }));
    add(wt('B10', 'programmed.'), BEEP, -24, 'tracker: programmable lit', { len: 0.35 });
    ['paid.', 'apps', 'deal'].forEach((w) => add(wt('B11', w), CLICK2, -24, 'link labelled'));
    add(wt('B12', 'gets'), W_LR, -22, 'the other apps leave', { pan: -0.5, len: 0.6 });
    add(wt('B12', 'customer'), WHIP(3), -21, 'customer slides in', { pan: 0.5 });
    add(wt('B12', 'pays') + 0.3, COIN, -22, 'customer pays you', { len: 0.6, fade: 0.3 });
    for (let i = 0; i < 4; i++) add(wt('B12', 'their') + i * 0.45, MCLICK, -26, "the coins' history, hop by hop", { pan: 0.3 + i * 0.1 });
    add(wt('B12', 'flagged.'), GLITCH(2), -19, 'wallet flagged');
    { const a = wt('B12', 'Software') - 0.1, b = wt('B12', 'dots.') + 0.2; E.push(ev((a + b) / 2, W_RL, -15, 'THE SCANNER crosses the screen (right to left)', { at: 'peak', len: 0.95, fade: 0.3, pan: 0 })); }
    add(wt('B12', 'dots.') + 0.1, GLITCH(26), -19, 'you get tagged red', { len: 0.45 });
    // B13–B15 · the flag
    E.push(flood(bs('B13') + 0.1, 'red flood out of your tag', -14));
    add(wt('B13', 'software,'), HARDHIT, -14, 'FLAGGED', { len: 1.0, fade: 0.5 });
    add(wt('B13', 'To') - 0.1, MECH, -20, 'review card drops in; cube moves aside', { len: 0.5 });
    add(wt('B13', 'hop') + 0.3, BEEP, -22, 'chip "risk: high"', { len: 0.35 });
    [wt('B13', 'away.'), wt('B13', 'closed,'), wt('B14', "passport's"), wt('B14', 'born,')].forEach((t) => add(t + 0.1, CLICK, -22, 'review row prints'));
    add(wt('B14', 'scored.'), HARDHIT, -15, 'SCORED.', { len: 1.0, fade: 0.5 });
    add(wt('B14', 'guilty') - 0.9, W_LR, -20, 'the card and chip move out of the way', { pan: -0.4, len: 0.7 });
    add(wt('B14', 'guilty'), LOWHIT, -13, 'GUILTY UNTIL', { len: 1.0, fade: 0.4 });
    add(wt('B14', 'prove'), LOWHIT, -14, 'PROVEN INNOCENT.', { len: 1.0, fade: 0.4 });
    E.push(ev(bs('B15') + 0.25, BASS, -14, 'lights out', { at: 'peak', len: 1.6, fade: 0.9 }));
    add(be('B15') - 1.4, W_SOFT, -24, 'the cube frosts over: Monero orange', { len: 1.2, fade: 0.5 });
    // B16–B21 · Monero
    add(wt('B16', '2014,'), WHIP(16), -20, '03 rises');
    for (let i = 0; i < 15; i++) add(wt('B17', 'crowd') - 0.1 + i * 0.07, MCLICK, -27 + (i % 3), 'decoy blocks rise into the ring', { pan: Math.sin(i * 1.7) * 0.6 });
    E.push(ev(wt('B17', 'nobody') + 0.35, W_SPIN, -16, 'the ring spins: which one is you?', { at: 'peak', len: 1.6, fade: 0.6 }));
    add(wt('B17', 'hidden.'), CLICK, -22, 'amount hidden');
    add(wt('B17', 'fresh,'), GLITCH(5), -21, 'one-time address scrambles');
    add(wt('B18', 'banknote') - 0.35, W_SOFT, -21, 'the glass note rises', { len: 1.0, fade: 0.4 });
    add(wt('B18', 'owner') - 0.3, SHUTTER, -22, 'chip "back of the note"');
    add(wt('B18', 'wipes'), W_LR, -18, 'the owner list is wiped', { pan: 0.3, len: 0.6 });
    add(be('B18') - 0.5, WHIP(7), -22, 'the note leaves upward');
    add(wt('B20', 'No.'), LOWHIT, -15, 'NO.', { len: 0.9, fade: 0.4 });
    ['shop', 'nurse,', 'person'].forEach((w, i) => add(wt('B20', w), CLICK, -23, 'chip: ' + ['shop owner', 'nurse', 'sending money home'][i], { pan: [-0.4, 0, 0.4][i] }));
    add(wt('B21', 'Monero'), SERVO, -22, 'the program module drifts in', { pan: -0.5, len: 0.5 });
    add(wt('B21', 'apps.'), GLITCH(1), -20, '"programs: not here"');
    add(wt('B21', 'So') - 0.1, W_LR, -20, 'the two roads split: programmable left, private right', { len: 0.6 });
    // B22–B24 · Tari, two layers
    E.push(ev(bs('B22') + 0.1, W_DARK, -18, 'glitch-gradient sweep', { at: 'peak', len: 1.0 }));
    add(wt('B22', 'Step'), WHIP(16), -20, '04 rises');
    add(wt('B22', 'Tari.') + 0.1, METALHIT, -15, 'the Tari logo rises', { len: 1.0, fade: 0.6 });
    add(bs('B23') - 0.5, MCLICK, -20, 'the line switches off like an old TV (a dot, gone)');
    E.push(ev(bs('B23') + 0.25, W_SOFT, -21, 'camera rises to the tower', { at: 'peak', len: 1.0, fade: 0.4 }));
    add(bs('B23') + 0.3 + 0.9, DRYHIT, -18, 'tower base rises', { at: 'peak', len: 1.2, fade: 0.5 });
    for (let i = 0; i < 10; i++) add(bs('B23') + 0.3 + 1.0 + i * 0.113, MCLICK, -25, 'violet voxels click into the crown (L14a crown_first to crown_done)', { pan: -0.4 + i * 0.08 });
    add(wt('B23', 'base'), CLICK, -22, 'label: base layer');
    add(wt('B23', 'XTM.'), CLICK2, -22, 'chip: coin xtm');
    add(wt('B23', 'Monero'), BEEP, -24, 'Monero block links to the base', { len: 0.35 });
    add(wt('B24', 'Ootle,'), CLICK, -22, 'label: ootle');
    add(wt('B24', 'apps.'), CLICK2, -22, 'chip: the layer for apps');
    // B25–B27 · hidden by design, view key, the one-way door
    E.push(flood(bs('B25') + 0.1, 'ink flood out of the crown'));
    add(wt('B25', 'amount'), WHIP(4), -21, 'values hidden on the plate');
    add(wt('B25', 'owner,'), WHIP(8), -21, 'names hidden on the plate');
    add(wt('B25', 'one-time'), CLICK, -22, 'chip: one-time address');
    add(wt('B25', 'check'), BEEP, -20, 'chip: the network still checks', { len: 0.35 });
    ['choose', 'private', 'asset'].forEach((w, i) => add(wt('B26', w), CLICK, -22, 'chip: ' + ['all hidden', 'amount hidden', 'all public'][i], { pan: [-0.4, 0, 0.4][i] }));
    add(wt('B26', 'view'), WHIP(3), -20, 'view key slides in', { pan: -0.5 });
    add(wt('B26', 'accountant:') + 0.3, MCLICK, -18, 'key meets the plate');
    add(wt('B26', 'see,'), BEEP, -21, 'one line opens, read-only', { len: 0.35 });
    add(bs('B27') + 0.15, W_LR, -21, 'pan to the door', { pan: -0.3, len: 0.6 });
    add(wt('B27', 'burn'), TORCH, -17, 'burn XTM', { len: 0.9, fade: 0.4 });
    add(wt('B27', 'claim') + 0.2, METALHIT, -19, 'TARI comes out the other side', { len: 0.8, fade: 0.5 });
    add(wt('B27', 'one-way'), LOCK, -15, 'the door locks: one way', { len: 0.9, fade: 0.4 });
    // B27A–B28 · how it runs (simple), not magic
    add(bs('B27A') + 0.05, W_SOFT, -21, 'the TARI tile travels to the centre and grows into the app', { len: 0.8, fade: 0.3 });
    add(bs('B27A') + 0.8, MECH, -19, 'the tile is revealed as the app', { len: 0.5 });
    add(wt('B27A', 'rules,'), BEEP, -23, 'runs by its own rules', { len: 0.35 });
    add(wt('B27A', 'Ethereum,') - 0.1, W_LR, -21, 'like Ethereum slides in', { pan: -0.5, len: 0.6 });
    add(wt('B27A', 'Monero.') - 0.1, W_LR, -21, 'like Monero slides in', { pan: 0.5, len: 0.6 });
    add(wt('B27A', 'Teams') - 0.2, W_SOFT, -21, 'the pieces of the records rise', { len: 1.0, fade: 0.4 });
    for (let i = 0; i < 4; i++) add(wt('B27A', 'Teams') + 0.6 + i * 0.18, BEEP, -27, 'a team checks its piece', { len: 0.25, pan: -0.45 + i * 0.3 });
    add(wt('B27A', 'Anyone'), CLICK, -21, 'chip: money moved');
    add(wt('B27A', 'much,'), WHIP(4), -21, 'bar: how much (hidden)');
    add(wt('B27A', 'whose.'), WHIP(8), -21, 'bar: whose (hidden)');
    add(wt('B28', 'Fees'), CLICK2, -22, 'fee line prints');
    add(wt('B28', 'Privacy'), LOWHIT, -16, 'PRIVACY IS A CHOICE.', { len: 0.9, fade: 0.4 });
    // B29–B30 · remember the flag: the same scanner, nothing to read, the lime flood
    E.push(flood(bs('B29') + 0.1, 'ink flood out of the foundations chip'));
    add(wt('B29', 'flag?') - 0.5, MECH, -20, 'the review card again', { len: 0.5 });
    { const a = wt('B29', 'software') - 0.15, b = wt('B29', 'history.') + 0.1; E.push(ev((a + b) / 2, W_RL, -15, 'THE SCANNER, pass 1: reads your history', { at: 'peak', len: 0.95, fade: 0.3 })); add(b - 0.5, GLITCH(2), -21, 'rows flash red'); }
    add(wt('B29', 'private') - 0.1, WHIP(12), -21, 'every value covered');
    { const a = wt('B29', 'network,') - 0.05; E.push(ev(a + 0.52, W_RL, -19, 'THE SCANNER, pass 2: finds nothing', { at: 'peak', len: 0.95, fade: 0.3 })); add(a + 0.62, BEEP, -18, 'NOTHING TO READ', { len: 0.4 }); }
    { const f1 = wt('B29', 'ask') - 0.05; E.push(ev(f1, RISER, -17, 'the lime flood (into PERMISSIONLESS)', { at: 'peak', len: 1.1, fade: 0.2 })); }
    add(wt('B29', 'ask'), LOWHIT, -15, 'PERMISSIONLESS.', { len: 0.8, fade: 0.4 });
    add(wt('B29', 'approve'), LOWHIT, -16, 'PROGRAMMABLE.', { len: 0.8, fade: 0.4 });
    add(wt('B29', 'business'), LOWHIT, -16, 'PRIVATE.', { len: 0.9, fade: 0.4 });
    // B32 · end card
    add(bs('B32') + 0.05, WHIP(21), -20, 'the frame contracts into "04 tari"');
    add(bs('B32') + 0.95, CLING, -14, 'the Tari logo settles', { len: 1.4, fade: 0.9 });
    add(bs('B32') + 1.25, CLICK2, -24, 'tari.com');
    return E;
  },
  s1({ wt, bs }) {
    const E = [], add = (...a) => E.push(ev(...a));
    add(0.1, WHIP(12), -20, 'hook words rise');
    [['pharmacy.', 1], ['rent.', 2], ['salary.', 4]].forEach(([w]) => add(wt('S1B', w), SHUTTER, -20, 'your line gets marked: ' + w.replace('.', '')));
    add(wt('S1B', 'Forever.'), LOWHIT, -16, 'FOREVER.', { len: 0.8, fade: 0.4 });
    add(wt('S1C', "That's") - 0.1, W_SOFT, -21, 'camera pulls back from the wall', { len: 1.0, fade: 0.4 });
    for (let i = 0; i < 6; i++) add(wt('S1C', 'one') + i * 0.35 + 0.15, MCLICK, -25, 'hop to the next plate', { pan: -0.3 + i * 0.12 });
    E.push(ev(bs('S1E') + 0.3, BASS, -15, 'lights out', { at: 'peak', len: 1.4, fade: 0.8 }));
    for (let i = 0; i < 15; i++) add(bs('S1E') + 0.3 + i * 0.07, MCLICK, -27 + (i % 3), 'Monero ring blocks rise', { pan: Math.sin(i * 1.7) * 0.6 });
    ['sender,', 'amount,', 'addresses.'].forEach((w) => add(wt('S1E', w), CLICK, -21, 'chip: ' + w.replace(/[.,]/, '')));
    add(bs('S1F') - 0.1, W_DARK, -18, 'the ring rises away; the Tari app arrives', { len: 1.0 });
    add(wt('S1F', 'Ootle.'), METALHIT, -16, 'chip: the ootle', { len: 1.0, fade: 0.6 });
    return E;
  },
  s2({ wt, bs }) {
    const E = [], add = (...a) => E.push(ev(...a));
    add(wt('S2A', 'flagged'), HARDHIT, -14, 'FLAGGED', { len: 1.0, fade: 0.5 });
    add(0.15, BEEP, -22, 'chip: risk high', { len: 0.35 });
    add(wt('S2B', 'score'), HARDHIT, -15, 'SCORED.', { len: 1.0, fade: 0.5 });
    [['passport', 'passport'], ['birthplace', 'place of birth'], ['yourself.', 'burden of proof']].forEach(([w, n]) => add(wt('S2B', w), CLICK, -21, 'review row: ' + n));
    add(wt('S2C', 'Sell'), W_LR, -21, 'you slide aside', { len: 0.6 });
    add(wt('S2C', 'customer,'), WHIP(3), -20, 'customer slides in', { pan: 0.5 });
    { const a = wt('S2C', 'software') - 0.1, b = wt('S2C', 'wallet.') + 0.2; E.push(ev((a + b) / 2, W_RL, -15, 'THE SCANNER crosses the screen', { at: 'peak', len: 0.95, fade: 0.3 })); }
    add(wt('S2C', 'closed.'), GLITCH(26), -19, 'chip: account closed', { len: 0.45 });
    E.push(ev(bs('S2D') + 0.3, BASS, -15, 'lights dim', { at: 'peak', len: 1.4, fade: 0.8 }));
    E.push(ev(wt('S2E', 'Tari') + 0.1, W_FLOOD, -16, 'violet flood: the Tari app', { at: 'peak', len: 1.4, fade: 0.5 }));
    { const tl = wt('S2E', 'permissionless,'); E.push(ev(tl, RISER, -17, 'the lime flood', { at: 'peak', len: 1.0, fade: 0.2 })); add(tl, LOWHIT, -16, 'PERMISSIONLESS,', { len: 0.8, fade: 0.4 }); }
    add(wt('S2E', 'programmable,', { n: 2 }), LOWHIT, -17, 'PROGRAMMABLE,', { len: 0.8, fade: 0.4 });
    add(wt('S2E', 'private.'), LOWHIT, -17, 'PRIVATE.', { len: 0.9, fade: 0.4 });
    return E;
  },
  s3({ wt, bs }) {
    const E = [], add = (...a) => E.push(ev(...a));
    add(0.1, WHIP(12), -21, 'quote mark and hook words');
    add(wt('S3B', 'Dr.'), CLICK, -21, 'chip: dr. daniel kim');
    add(bs('S3C') - 0.2, W_DARK, -19, 'the ring steps aside', { len: 0.9 });
    add(wt('S3C', 'banknote') - 0.2, W_SOFT, -21, 'the glass note rises', { len: 1.0, fade: 0.4 });
    add(wt('S3C', 'owner'), SHUTTER, -21, 'the owner list prints');
    add(wt('S3D', 'wipes'), W_LR, -17, 'the list is wiped', { len: 0.6 });
    for (let i = 0; i < 15; i++) add(wt('S3D', 'Your') - 0.2 + i * 0.07, MCLICK, -27 + (i % 3), 'decoys rise into the ring', { pan: Math.sin(i * 1.7) * 0.6 });
    E.push(ev(wt('S3D', 'decoys,') + 0.35, W_SPIN, -16, 'the ring spins', { at: 'peak', len: 1.6, fade: 0.6 }));
    add(wt('S3D', 'memory.'), LOWHIT, -17, 'MONEY WITH NO MEMORY.', { len: 0.9, fade: 0.4 });
    add(wt('S3E', 'Monero'), SERVO, -21, 'the app module drifts in', { pan: -0.5, len: 0.5 });
    add(wt('S3E', 'apps.'), GLITCH(1), -20, 'chip: apps not here');
    add(bs('S3F') - 0.1, W_DARK, -18, 'the ring rises away; the Tari app arrives', { len: 1.0 });
    add(wt('S3F', 'rules,'), CLICK, -21, 'chip: apps with their own rules');
    add(wt('S3F', 'hidden'), METALHIT, -17, 'chip: money hidden by design', { len: 1.0, fade: 0.6 });
    return E;
  },
};
