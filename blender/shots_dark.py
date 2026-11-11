"""Dark-world (private / Tari) alpha shots: L14a_tower_build, L14b_tower_orbit, L16_template_idle,
L13_glass_note (+ L13_glass_note_hold), L18_view_key.
Blender -b -P shots_dark.py -- --shot L14a_tower_build [--preview 1]
"""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Euler
import studio as S
import objects as O
from shotlib import Shot

shot = S.opts(dict(shot='L14a_tower_build'))['shot']
FPS = 30
MPP = S.UNIT / 300.0
FR = {'L14a_tower_build': 150, 'L14b_tower_orbit': 960, 'L16_template_idle': 480, 'L13_glass_note': 126,
      'L13_glass_note_hold': 1, 'L18_view_key': 210}
DESC = {
    'L14a_tower_build': 'Animated Tari tower: the glossy black Minotari base rises into frame from below, then the '
                        'violet Ootle voxels drop in and click into place in a fast cascade. Camera = L14b frame 1.',
    'L14b_tower_orbit': 'Slow orbit, one direction, 18 deg with a slight push (most of it in the first 5 s, then a '
                        'creep); the crown voxels keep a gentle height wave. Frame 1 = L14a end pose.',
    'L16_template_idle': 'The violet frosted-glass template module, lime indicator glowing; 360 deg turntable in 16 s.',
    'L13_glass_note': 'Face-on frosted-glass banknote pane (2.2:1), 900 px wide at hold, centred (960, 600): rises '
                      'from below (0.8 s), holds with one light sweep, exits upward (0.6 s).',
    'L13_glass_note_hold': 'The L13 hold pose as a single still (no glint).',
    'L18_view_key': 'Cloud-aluminium key with a lime tab slides in from the left to (300, 560), settles at a slight '
                    'angle, then idles 4 s with a slow one-way turn.',
}
N = FR[shot]
if shot == 'L14b_tower_orbit' and S.opts(dict(preview=0))['preview']:
    N = 540          # the draft covers the first 18 s (the AD uses ~14 s); finals render all 960 frames
loop = shot == 'L16_template_idle'
sh = Shot(shot, N, 'dark', alpha=True, loop=loop, desc=DESC[shot])
sh.glare = shot in ('L14a_tower_build', 'L14b_tower_orbit', 'L16_template_idle')
sc = bpy.context.scene


def finish(rig, subjects, target, scale=1.0):
    S.light_rig('dark', target=target, scale=scale)
    S.lensing_plate('dark', rig, dist_behind=1.5 * scale)
    S.light_link(subjects)


# =============================================================================== Tari tower
if shot in ('L14a_tower_build', 'L14b_tower_orbit'):
    U = 640 * MPP / (5 * 0.525 * math.sqrt(2))      # crown diagonal = 640 px
    root, blacks, violets = O.tower(n=5, levels=12, c=0.5, gap=0.025)
    root.scale = (U, U, U)
    root.rotation_euler = (0, 0, math.radians(45))   # corner to camera (the brand kit's tower)
    top = root['top'] * U
    obj = {o.name: o for o in root.children}
    rest = {nm: Vector(obj[nm].location) for nm in [b[0] for b in blacks] + [v[0] for v in violets]}
    crown_c = Vector((0, 0, top + 0.6 * 0.5 * U))
    rig = S.Rig(target=crown_c, dist=2.13, az=0.0, el=28.0, fstop=4.0)
    # framing on the crown: 640 px wide, crown top at y ~270
    vio = [obj[v[0]] for v in violets]
    k = sh.pct / 100.0
    _, _, pts = S.bbox(vio)
    a, b = 0.05, 50.0
    for _ in range(50):
        m = (a + b) / 2
        rig.set(dist=m)
        pp = [S.project(p) for p in pts]
        if (max(p[0] for p in pp) - min(p[0] for p in pp)) / k > 640:
            a = m
        else:
            b = m
    rig.set(dist=(a + b) / 2)
    pp = [S.project(p) for p in pts]
    top_px = min(p[1] for p in pp) / k
    cx_px = (min(p[0] for p in pp) + max(p[0] for p in pp)) / 2 / k
    big = max(sh.W, sh.H)
    rig.cam.data.shift_x += (cx_px - 960) / (big / k)
    rig.cam.data.shift_y -= (top_px - 270) / (big / k)
    bpy.context.view_layer.update()
    cam0 = dict(az=rig.az, dist=rig.dist)
    finish(rig, [root], tuple(crown_c * 0.6), scale=1.4)
    rnd = random.Random(11)
    # crown cascade order: from the far corner toward the camera, rows by (i + j), a little jitter
    vorder = sorted(violets, key=lambda v: (-(v[1] + v[2]) + rnd.uniform(-0.6, 0.6)))
    BASE0, BASE1 = 1.0, 2.0                          # base rises (s)
    C0, CD = 1.75, 1.15                              # crown cascade start, spread
    drop = 0.45                                      # m above rest (starts above the frame top)
    land_t = {}
    for n_, v in enumerate(vorder):
        land_t[v[0]] = C0 + CD * (n_ / (len(vorder) - 1)) ** 1.6 + 0.3

    def crown_wave(t, v):
        amp = 0.0045 / U * S.prog(t, 1.0, 3.0)        # ~3 px, faded in
        ph = 0.55 * (v[1] + v[2])
        return amp * math.sin(2 * math.pi * (t / 6.0) - ph)

    def pose(f, t):
        if shot == 'L14a_tower_build':
            kb = S.expo_out(S.prog(t, BASE0, BASE1))
            lift = S.lerp(-1.1 / U, 0.0, kb)          # builder units
            for nm, i, j, kk in blacks:
                o = obj[nm]
                o.location = rest[nm] + Vector((0, 0, lift))
            for nm, i, j, dz in violets:
                o = obj[nm]
                tl = land_t[nm]
                tf = tl - 0.3
                if t <= tf:
                    z = drop / U
                elif t <= tl:
                    u = (t - tf) / 0.3
                    z = drop / U * (1 - u * u)        # QUAD ease-in fall
                else:
                    uu = t - tl                       # the click: one tiny rebound, damped
                    z = 0.012 * math.exp(-14 * uu) * abs(math.sin(math.pi * min(1.0, uu / 0.12))) * (uu < 0.12)
                o.location = rest[nm] + Vector((0, 0, z))
        else:
            for nm, i, j, dz in violets:
                obj[nm].location = rest[nm] + Vector((0, 0, crown_wave(t, (nm, i, j))))
            # orbit 18 deg one way + a 4% push, fast then slow, from frame 31; static from frame 931
            T = 30.0
            u = min(max(0.0, t - 1.0), T)
            kk = (1 - math.exp(-u / 2.2)) / (1 - math.exp(-T / 2.2))
            rig.set(az=cam0['az'] + 18.0 * kk, dist=cam0['dist'] * (1 - 0.04 * kk))
    animated = [obj[b[0]] for b in blacks] + vio if shot == 'L14a_tower_build' else vio + [rig.pivot, rig.cam]
    S.bake(animated, range(1, N + 1), pose)
    if shot == 'L14a_tower_build':
        sh.hold(1, int(BASE0 * FPS) - 1)
        last = max(land_t.values())
        sh.event('base_up', int(BASE1 * FPS))
        sh.event('crown_first', int(min(land_t.values()) * FPS))
        sh.event('crown_done', int(last * FPS))
        sh.hold(int((last + 0.25) * FPS), N)
        sh.extra['handoff'] = 'end pose = L14b_tower_orbit frame 1'
    else:
        sh.event('orbit_start', 31)
        sh.event('orbit_mostly_done', 31 + 150)
        sh.event('orbit_end', min(930, N))
        if N < 960:
            sh.extra['draft_note'] = 'draft covers frames 1-540 of the 960-frame shot (the orbit curve is identical)'
    corner = lambda i, j, z: root.matrix_world @ Vector(((i - 2) * 0.525, (j - 2) * 0.525, z))
    sh.anchor('crown_centre', lambda: root.matrix_world @ Vector((0, 0, root['top'] + 0.5)))
    sh.anchor('crown_right_edge', lambda: corner(2.5, -2.5, root['top'] + 0.5))
    sh.anchor('base_mid', lambda: root.matrix_world @ Vector((0, 0, root['top'] - 3.0)))
    sh.anchor('base_left_edge', lambda: corner(-2.5, 2.5, root['top'] - 3.0))
    sh.extra['layers'] = 'type can go BEHIND this alpha (the crown occludes it)'

# =============================================================================== template turntable
elif shot == 'L16_template_idle':
    s_ = 420 * MPP / 2.0
    mod = O.make('violet_module', scale=s_)
    turn = S.empty('TURN', (0, 0, 0))
    mod.parent = turn
    YAW0 = -25.0
    turn.rotation_euler = (0, 0, math.radians(YAW0))
    lo, hi, pts = S.bbox([mod])
    hz = (lo.z + hi.z) / 2
    rig = S.Rig(target=(0, 0, hz), dist=2.13, az=0.0, el=20.0)
    k = sh.pct / 100.0
    a, b = 0.05, 50.0
    for _ in range(50):
        m = (a + b) / 2
        rig.set(dist=m)
        pp = [S.project(p) for p in pts]
        if (max(p[0] for p in pp) - min(p[0] for p in pp)) / k > 420:
            a = m
        else:
            b = m
    rig.set(dist=(a + b) / 2)
    sh.centre_on(rig, pts, 960, 545)
    finish(rig, [turn], (0, 0, hz))
    S.bake([turn], range(1, N + 2), lambda f, t: setattr(turn, 'rotation_euler',
                                                         (0, 0, math.radians(YAW0 + 360.0 * (f - 1) / N))))
    sh.anchor('object_centre', lambda: Vector((0, 0, hz)))
    sh.anchor('object_top', lambda: Vector((0, 0, hi.z)))

# =============================================================================== glass note
elif shot in ('L13_glass_note', 'L13_glass_note_hold'):
    s_ = 900 * MPP / 2.2
    note = O.make('glass_note', scale=s_)
    mover = S.empty('MOVER', (0, 0, 0))
    note.parent = mover
    Hn = 1.0 * s_
    rig = S.Rig(target=(0, 0, Hn / 2), dist=2.13, az=0.0, el=0.0, fstop=4.0)
    # fit: 900 px wide, centre (960, 600)
    k = sh.pct / 100.0
    _, _, pts = S.bbox([note])
    a, b = 0.05, 50.0
    for _ in range(50):
        m = (a + b) / 2
        rig.set(dist=m)
        pp = [S.project(p) for p in pts]
        if (max(p[0] for p in pp) - min(p[0] for p in pp)) / k > 900:
            a = m
        else:
            b = m
    rig.set(dist=(a + b) / 2)
    sh.centre_on(rig, pts, 960, 600)
    finish(rig, [mover], (0, 0, Hn / 2))
    # the glint: a reflection-only strip card that slides across once during the hold
    gl = bpy.data.lights.new('GLINT', 'AREA')
    gl.shape = 'RECTANGLE'
    gl.size, gl.size_y = 0.05, 1.2
    gl.energy = 0.0 if shot == 'L13_glass_note_hold' else 6.0
    gl.use_shadow = False
    glo = bpy.data.objects.new('GLINT', gl)
    sc.collection.objects.link(glo)
    glo.visible_camera = False
    glo.visible_diffuse = False
    glo.light_linking.receiver_collection = bpy.data.collections['LIT']
    cam_pos = rig.world_pos()
    R0, R1, X0, X1, X2 = 31, 55, 79, 96, 0
    y_hold = 0.0
    z_low = -Hn * 2.4
    z_high = Hn * 3.2

    def pose(f, t):
        if f <= R0:
            z = z_low
        elif f <= R1:
            z = S.lerp(z_low, 0.0, S.expo_out(S.prog(f, R0, R1)))
        elif f <= X0:
            z = 0.0
        else:
            u = S.prog(f, X0, X1)
            z = S.lerp(0.0, z_high, u ** 3)          # accelerates out (QUART-like ease-in)
        mover.location = (0, y_hold, z)
        # glint card: sweeps left -> right in front of the pane (its reflection crosses the glass)
        g = S.cubic_in_out(S.prog(f, 46, 84))
        glo.location = (S.lerp(-0.9, 0.9, g), -0.9, Hn / 2 + 0.5)
        glo.rotation_euler = (Vector((0, 0, Hn / 2)) - glo.location).to_track_quat('-Z', 'Y').to_euler()
    if shot == 'L13_glass_note_hold':
        pose(60, 2.0)
    else:
        S.bake([mover, glo], range(1, N + 1), pose)
        sh.hold(1, R0)
        sh.hold(X1 + 1, N)
        sh.event('rise_start', R0)
        sh.event('hold_start', R1)
        sh.event('exit_start', X0)
        sh.event('gone', X1)
    w2 = 1.1 * s_
    for nm, (x, z) in dict(corner_tl=(-1, 1), corner_tr=(1, 1), corner_br=(1, 0), corner_bl=(-1, 0)).items():
        sh.anchor(nm, (lambda x=x, z=z: mover.matrix_world @ Vector((x * w2, -0.02 * s_, z * Hn))))
    sh.anchor('pane_centre', lambda: mover.matrix_world @ Vector((0, 0, Hn / 2)))
    sh.samples = dict(pane_centre=(55 if shot == 'L13_glass_note' else 1, 960, 600), pane_left=(55 if shot == 'L13_glass_note' else 1, 700, 600))

# =============================================================================== view key
elif shot == 'L18_view_key':
    s_ = 380 * MPP / 2.2
    key = O.make('view_key', scale=s_)
    mover = S.empty('MOVER', (0, 0, 0))
    spin = S.empty('SPIN', (0, 0, 0), mover)
    key.parent = spin
    # tilted back 35 deg from flat-to-camera: the face catches the key light and the top card (cloud metal reads
    # light on ink) while the silhouette (bow ring, shaft, bit) still reads
    key.rotation_euler = (math.radians(35), 0, 0)
    key.location = (-0.1 * s_, 0, 0)                     # centre the key's length on the pivot
    rig = S.Rig(target=(0, 0, 0), dist=2.13, az=0.0, el=20.0)
    # frame: fixed hero distance; position the rest pose at screen (300, 560)
    rig.set(dist=2.13)
    k = sh.pct / 100.0
    big = max(sh.W, sh.H)
    for _ in range(4):
        p = S.project(Vector((0, 0, 0)))
        rig.cam.data.shift_x += (p[0] / k - 300) / (big / k)
        rig.cam.data.shift_y -= (p[1] / k - 560) / (big / k)
        bpy.context.view_layer.update()
    finish(rig, [mover], (0, 0, 0))
    X_OFF = -0.9
    S0, S1 = 31, 55

    def pose(f, t):
        u = S.prog(f, S0, S1)
        x = S.lerp(X_OFF, 0.0, S.expo_out(u))
        uu = max(0.0, (f - S1) / FPS)
        wob = (3.0 * math.exp(-7 * uu) * math.sin(2 * math.pi * uu / 0.32)) if f > S1 else 8.0 * (1 - S.expo_out(u))
        idle = 9.0 * S.prog(f, 91, N + 1)                    # slow one-way turn, 4 s
        mover.location = (x, 0, 0)
        spin.rotation_euler = (0, 0, math.radians(-14 + wob + idle))   # settles at a slight angle
    S.bake([mover, spin], range(1, N + 1), pose)
    sh.hold(1, S0 - 1)
    sh.event('slide_start', S0)
    sh.event('settled', S1 + 12)
    sh.event('idle_start', 91)
    sh.anchor('key_centre', lambda: mover.matrix_world.translation.copy())
    sh.anchor('key_bow', lambda: key.matrix_world @ Vector((-0.9, 0, 0.05)))
    sh.anchor('key_tip', lambda: key.matrix_world @ Vector((0.85, 0, 0.05)))

sh.run()
