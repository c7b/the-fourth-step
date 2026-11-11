"""White-world (public) alpha shots over the AD's Cloud field, contact shadow in the alpha (shadow catcher):
L04_coin_roll, L05_bank_in, L05_bank_out, L06_steel_cube_white, L09_module_idle, L10_module_coin,
L08_app_exchange, L08_app_loan, L08_app_game, L08_app_savings.
Blender -b -P shots_white.py -- --shot L05_bank_in [--preview 1]

Scale rule: every object is sized for the same camera distance as the hero cube (0.20 m = 300 px at ~2.1 m,
so 1 px ~ 0.67 mm), which keeps the one key light's shadow identical across shots.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Euler
import studio as S
import objects as O
from shotlib import Shot

shot = S.opts(dict(shot='L05_bank_in'))['shot']
FPS = 30
MPP = S.UNIT / 300.0            # metres per px at the hero distance

FR = {'L04_coin_roll': 96, 'L05_bank_in': 84, 'L05_bank_out': 84, 'L06_steel_cube_white': 240,
      'L09_module_idle': 480, 'L10_module_coin': 150, 'L08_app_exchange': 480, 'L08_app_loan': 480,
      'L08_app_game': 480, 'L08_app_savings': 480}
DESC = {
    'L04_coin_roll': 'A plain gold coin standing on edge rolls left to right (x 720 -> 1200, y 560), stops upright '
                     'slightly turned to camera.',
    'L05_bank_in': 'A classical white-stone bank (pediment, four columns, steps, heavy door) drops in from above and '
                   'lands with weight, no bounce. ~470 px tall, centred (960, 520).',
    'L05_bank_out': 'From L05_bank_in end pose, the bank sinks straight down through the floor until gone; its '
                    'shadow shrinks with it.',
    'L06_steel_cube_white': 'Seamless loop: brushed-steel cube (same size as the lime cube) yaws 90 deg in 8 s.',
    'L09_module_idle': 'Azure anodised program module, 360 deg turntable in 16 s (loops). ~340 px wide, centre (960, 560).',
    'L10_module_coin': 'A coin rolls into the input port, the keys press in sequence and the indicator glows lime, '
                       'a coin rolls out of the output port to the right edge.',
    'L08_app_exchange': 'Ethereum app "exchange": gold + silver coin on the blue base, ringed by two curved arrows; '
                        'the coins swap places twice per loop. 360 deg in 16 s.',
    'L08_app_loan': 'Ethereum app "loan": a short stack of gold coins next to an hourglass on the blue base. 360 deg in 16 s.',
    'L08_app_game': 'Ethereum app "game": blue anodised controller with lime buttons on the blue base. 360 deg in 16 s.',
    'L08_app_savings': 'Ethereum app "savings": blue anodised piggy bank, a gold coin half in its slot, on the blue base. '
                       '360 deg in 16 s.',
}
N = FR[shot]
sh = Shot(shot, N, 'white', alpha=True, loop=shot in ('L06_steel_cube_white', 'L09_module_idle') or shot.startswith('L08'),
          desc=DESC[shot])
sc = bpy.context.scene


def stage(target, el=12.0):
    rig = S.Rig(target=target, dist=2.13, az=0.0, el=el)
    return rig


CATCHER = {'L05_bank_in': 1.3, 'L05_bank_out': 1.3, 'L04_coin_roll': 1.1, 'L06_steel_cube_white': 0.8,
           'L09_module_idle': 0.9, 'L10_module_coin': 2.4}   # metres; apps 0.7 (default)


def finish_stage(rig, subjects, target):
    S.light_rig('white', target=target, neg_fill=False)   # the black card would darken the catcher (fake AO)
    # the catcher only needs to hold the contact shadow (key at 50 deg: shadow ~0.84 x height); every catcher pixel
    # costs full sampling, so keep it ~4-5x the object
    S.floor('white', size=CATCHER.get(shot, 0.7), catcher=True)
    S.lensing_plate('white', rig, dist_behind=1.2)
    S.light_link(subjects, floor_lit=True)


def x_for_px(rig, px, y=0.0, z=0.0, lo=-3.0, hi=3.0):
    """World x whose projection lands on screen x = px (full-size px)."""
    k = sh.pct / 100.0
    for _ in range(50):
        m = (lo + hi) / 2
        if S.project(Vector((m, y, z)))[0] / k < px:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


# =============================================================================== bank
if shot in ('L05_bank_in', 'L05_bank_out'):
    bank = O.make('bank', scale=470 * MPP / 4.72)
    mover = S.empty('MOVER', (0, 0, 0))
    bank.parent = mover
    bank.rotation_euler = (0, 0, math.radians(-22))
    Hb = 4.72 * bank.scale[0]
    rig = stage((0, 0, Hb / 2), el=10.0)
    sh.fit(rig, [bank], px_h=470, cx=960, cy=520)
    finish_stage(rig, [mover], (0, 0, Hb / 2))
    # a holdout floor under the catcher hides the part of the bank below z = 0 (it sinks "through" the floor)
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -0.0005))
    ho = bpy.context.active_object
    ho.name = 'HOLDOUT'
    ho.is_holdout = True
    if shot == 'L05_bank_in':
        F0, LAND = 31, 45                      # fall 14 f (gravity), then settle
        z0 = Hb * 2.1                          # starts fully above the frame
        def pose(f, t):
            if f <= F0:
                z = z0
            elif f <= LAND:
                u = (f - F0) / (LAND - F0)
                z = z0 * (1 - u * u)           # QUAD ease-in: accelerating fall
            else:
                u = (f - LAND) / FPS           # heavy settle: a 0.6% sink and recover, no bounce
                z = -0.006 * Hb * math.exp(-9 * u) * math.sin(math.pi * min(1.0, u / 0.25))
            mover.location = (0, 0, z)
        S.bake([mover], range(1, N + 1), pose)
        # no far-cast shadow from a bank hanging above the frame: hidden in the lead-in, shadow only near the floor
        meshes = [c for c in bank.children_recursive if c.type == 'MESH']
        for f in range(1, N + 1):
            sc.frame_set(f)
            mover.hide_render = f < F0
            mover.keyframe_insert('hide_render', frame=f)
            cast = mover.location.z < 0.45 * Hb
            for mo in meshes:
                mo.hide_render = f < F0
                mo.keyframe_insert('hide_render', frame=f)
                mo.visible_shadow = cast
                mo.keyframe_insert('visible_shadow', frame=f)
        sh.hold(1, F0 - 1)
        sh.hold(LAND + 10, N)
        sh.event('land', LAND)
        sh.extra['handoff'] = 'end pose = L05_bank_out frame 1'
    else:
        F0, GONE = 31, 55
        def pose(f, t):
            u = S.prog(f, F0, GONE)
            mover.location = (0, 0, -Hb * 1.08 * u ** 3)    # accelerates down (QUART-like ease-in)
        S.bake([mover], range(1, N + 1), pose)
        sh.hold(1, F0)
        sh.hold(GONE, N)
        sh.event('sink_start', F0)
        sh.event('gone', GONE)
    sh.anchor('bank_centre', lambda: mover.matrix_world.translation + Vector((0, 0, Hb / 2)))
    sh.anchor('bank_top', lambda: mover.matrix_world.translation + Vector((0, 0, Hb)))

# =============================================================================== coin roll
elif shot == 'L04_coin_roll':
    D = 110 * MPP                          # coin diameter
    r = D / 2
    cam_t = (0, 0, 0.1)
    rig = stage(cam_t, el=12.0)
    # the hero-cube camera: fitted on a 0.2 m cube at the origin -> body (960, 520)
    tmp = O.make('you_cube')
    sh.fit(rig, [tmp], px_h=300, cx=960, cy=520)
    bpy.data.objects.remove(tmp.children[0], do_unlink=True)
    bpy.data.objects.remove(tmp, do_unlink=True)
    # depth: put the coin row slightly in front of the cube plane so y_px = 560 for the coin centre
    yrow = 0.0
    lo_, hi_ = -0.8, 0.8
    k = sh.pct / 100.0
    for _ in range(50):
        m = (lo_ + hi_) / 2
        if S.project(Vector((0, m, r)))[1] / k > 560:
            lo_ = m
        else:
            hi_ = m
    yrow = (lo_ + hi_) / 2
    x0 = x_for_px(rig, 720, yrow, r)
    x1 = x_for_px(rig, 1200, yrow, r)
    mover = S.empty('MOVER', (x0, yrow, r))
    roll = S.empty('ROLL', (0, 0, 0), mover)
    c = O.coin(0.5, 0.12, 'gold', 'COIN', upright=True)
    c.scale = (D,) * 3
    c.parent = roll
    c.location = (0, -0.06 * D, -r)       # centre the disc on the pivot (builder disc: y 0..0.12)
    F0, F1, F2 = 31, 61, 70                 # roll 31-61, turn + settle to 70
    dist = x1 - x0
    def pose(f, t):
        u = S.prog(f, F0, F1)
        s = 1 - (1 - u) ** 2.4               # pushed, then rolls out against friction
        x = x0 + dist * s
        ang = (x - x0) / r                   # no slip
        turn = S.cubic_in_out(S.prog(f, F1 - 6, F2))
        uu = max(0.0, (f - F1) / FPS)
        wob = 3.0 * math.exp(-8 * uu) * math.sin(2 * math.pi * uu / 0.28) if f > F1 else 0.0
        mover.location = (x, yrow, r)
        mover.rotation_euler = Euler((math.radians(wob), 0, math.radians(-22 * turn)), 'XYZ')
        roll.rotation_euler = (0, ang, 0)
    S.bake([mover, roll], range(1, N + 1), pose)
    finish_stage(rig, [mover], (0, 0, 0.1))
    sh.hold(1, F0 - 1)
    sh.hold(F2 + 8, N)
    sh.event('start', F0)
    sh.event('stop', F1)
    sh.anchor('coin_centre', lambda: mover.matrix_world.translation.copy())

# =============================================================================== steel cube loop
elif shot == 'L06_steel_cube_white':
    SIZE = S.UNIT
    mover = S.empty('MOVER', (0, 0, SIZE / 2))
    cube = O.make('steel_cube')
    cube.parent = mover
    cube.location = (0, 0, -SIZE / 2)
    mover.rotation_euler = (0, 0, math.radians(30))
    rig = stage((0, 0, SIZE / 2), el=12.0)
    sh.fit(rig, [cube], px_h=300, cx=960, cy=520)
    finish_stage(rig, [mover], (0, 0, SIZE / 2))
    S.bake([mover], range(1, N + 2), lambda f, t: setattr(mover, 'rotation_euler', (0, 0, math.radians(30 + 90.0 * (f - 1) / N))))
    sh.anchor('cube_centre', lambda: mover.matrix_world.translation.copy())

# =============================================================================== module + apps (turntables)
elif shot in ('L09_module_idle', 'L10_module_coin') or shot.startswith('L08'):
    if shot.startswith('L08'):
        kind = 'eth_' + shot.split('_')[-1]
        sc_ = 240 * MPP / 2.6                    # base diameter 2.6 units -> ~240 px
        obj = O.make(kind, scale=sc_)
        YAW0, px_w, cy = -20.0, 240, 540
    else:
        sc_ = 340 * MPP / 2.0
        obj = O.make('azure_module', scale=sc_)
        YAW0, px_w, cy = 25.0, 340, 560     # the input port (left end) faces the camera: the coin is seen going in
    turn = S.empty('TURN', (0, 0, 0))
    obj.parent = turn
    turn.rotation_euler = (0, 0, math.radians(YAW0))
    lo, hi, _ = S.bbox([obj])
    hz = (hi.z + lo.z) / 2
    rig = stage((0, 0, hz), el=20.0)
    # fit on the frame-1 pose by WIDTH (the shot list gives widths for these)
    k = sh.pct / 100.0
    _, _, pts = S.bbox([obj])
    a, b = 0.05, 50.0
    for _ in range(50):
        m = (a + b) / 2
        rig.set(dist=m)
        pp = [S.project(p) for p in pts]
        if (max(p[0] for p in pp) - min(p[0] for p in pp)) / k > px_w:
            a = m
        else:
            b = m
    rig.set(dist=(a + b) / 2)
    sh.centre_on(rig, pts, 960, cy)
    finish_stage(rig, [turn], (0, 0, hz))
    if shot == 'L10_module_coin':
        # keys press, indicator glows, a coin rolls in (left port) and out (right port)
        led = S.mat('lime_led')
        p = next(n for n in led.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        es = p.inputs['Emission Strength']
        keys = sorted([c for c in obj.children if '_key' in c.name], key=lambda o: o.location.x)
        D = 0.26 * sc_                         # the coin fits the port (hole r 0.14, centre z 0.2)
        rc = D / 2
        mod_h = 0.62 * sc_
        # module-local frame: ports on +-X at the port height; the coin travels along the module's local X
        port_z = 0.48 * 0.62 * sc_
        cin = S.empty('COIN_IN', (0, 0, 0), turn)
        cout = S.empty('COIN_OUT', (0, 0, 0), turn)
        coins = []
        for holder in (cin, cout):
            roll = S.empty(holder.name + '_roll', (0, 0, 0), holder)
            c = O.coin(0.5, 0.12, 'gold', holder.name + '_c', upright=True)
            c.scale = (D,) * 3
            c.parent = roll
            c.location = (0, -0.06 * D, -rc)
            coins.append(roll)
        half = 1.0 * sc_
        T_IN0, T_IN1, T_RUN0, T_RUN1, T_OUT0, T_OUT1 = 1.0, 1.8, 1.8, 2.8, 2.8, 4.0   # seconds (1 s lead handle)
        def pose(f, t):
            # coin in: from far left to inside the left port (local x from -half-0.9 to -half+0.05)
            u = S.prog(t, T_IN0, T_IN1)
            s = 1 - (1 - u) ** 2
            xin = S.lerp(-half - 0.75, -half + rc * 1.6, s)        # ends fully inside the body
            cin.location = (xin, 0, rc)
            coins[0].rotation_euler = (0, (xin + half) / rc, 0)
            # keys: press in sequence
            for i, kobj in enumerate(keys):
                t0 = T_RUN0 + 0.15 + i * 0.22
                d = math.sin(math.pi * S.prog(t, t0, t0 + 0.2))
                kobj.location.z = 0.62 + 0.012 - 0.05 * d
            # coin out: from inside the right port to beyond the right edge
            u2 = S.prog(t, T_OUT0, T_OUT1)
            s2 = u2 ** 1.6
            xout = S.lerp(half - rc * 0.2, half + 0.85, s2)
            cout.location = (xout, 0, rc)
            coins[1].rotation_euler = (0, (xout - half) / rc, 0)
        objs = [cin, cout, coins[0], coins[1]] + keys
        S.bake(objs, range(1, N + 1), pose)
        in_meshes = [m for m in cin.children_recursive if m.type == 'MESH']
        out_meshes = [m for m in cout.children_recursive if m.type == 'MESH']
        for f in range(1, N + 1):
            t = f / FPS
            for m in in_meshes:          # hide_render must be keyed on the meshes (an empty doesn't hide children)
                m.hide_render = t > T_IN1 + 0.05
                m.keyframe_insert('hide_render', frame=f)
            for m in out_meshes:
                m.hide_render = t < T_OUT0
                m.keyframe_insert('hide_render', frame=f)
            es.default_value = S.lerp(1.0, 9.0, S.expo_out(S.prog(t, T_RUN0 + 0.6, T_RUN0 + 1.0)))
            es.keyframe_insert('default_value', frame=f)
        sh.hold(1, int(T_IN0 * FPS) - 1)
        sh.event('in', int(T_IN0 * FPS))
        sh.event('run', int(T_RUN0 * FPS))
        sh.event('out', int(T_OUT0 * FPS))
        sh.event('coin_gone', int(T_OUT1 * FPS))
        sh.hold(int(T_OUT1 * FPS) + 1, N)
        sh.extra['note'] = 'module pose = L09_module_idle frame 1; ports moved low on the sides so a coin fits'
    else:
        swap = None
        if shot == 'L08_app_exchange':
            toks = [c for c in obj.children if c.name.endswith(('_tokA', '_tokB'))]
            swap = S.empty('SWAP', (0, 0, 0), obj)
            for tkn in toks:
                tkn.parent = swap
        def pose(f, t):
            turn.rotation_euler = (0, 0, math.radians(YAW0 + 360.0 * (f - 1) / N))
            if swap is not None:     # two swaps per loop (180 deg each): seamless
                k1 = S.cubic_in_out(S.prog(t, 4.0, 5.1))
                k2 = S.cubic_in_out(S.prog(t, 12.0, 13.1))
                swap.rotation_euler = (0, 0, math.pi * (k1 + k2))
        S.bake([turn] + ([swap] if swap else []), range(1, N + 2), pose)
        if swap is not None:
            sh.event('swap1', 120)
            sh.event('swap2', 360)
    top_z = hi.z
    sh.anchor('object_centre', lambda: Vector((0, 0, hz)))
    sh.anchor('object_top', lambda: Vector((0, 0, top_z)))
    sh.anchor('object_bottom', lambda: Vector((0, 0, lo.z)))

sh.run()
