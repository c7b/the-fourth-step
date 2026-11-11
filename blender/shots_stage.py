"""v5 · the shared bank stage (0:15-0:27, B04): one camera, each element its own full-frame RGBA layer at 1:1,
so the AD places every layer at 0,0 and spacing/depth are already right (AD spec 2026-11-08).
  L22a_stage_lime_idle   lime cube, seamless 240-frame loop (90 deg yaw), body ~190 px, centre (420, 560)
  L22b_stage_steel_idle  steel cube, same loop, centre (1500, 560)
  L22c_stage_bank_in     the bank drops in and lands (centre (960, 520), ~470 px tall); event land
  L22c_stage_bank_out    from the landed pose it sinks through the floor; events sink_start, gone
  L22d_stage_coin        real coin (~110 px) waits beside the lime cube (x ~600, clear of the bank and its shadow),
                         then rolls to x ~1335 in 1.2 s, angle = distance / radius (no slip); events start, stop
Blender -b -P shots_stage.py -- --shot L22d_stage_coin [--preview 1]
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Euler
import studio as S
import objects as O
from shotlib import Shot

shot = S.opts(dict(shot='L22d_stage_coin'))['shot']
FPS = 30
CUBE = S.UNIT                      # 0.20 m
PX_CUBE = 190.0
FR = {'L22a_stage_lime_idle': 240, 'L22b_stage_steel_idle': 240, 'L22c_stage_bank_in': 84,
      'L22c_stage_bank_out': 84, 'L22d_stage_coin': 108}
DESC = {
    'L22a_stage_lime_idle': 'Stage layer: the lime "you" cube idles (90 deg yaw seamless loop), centre (420, 560), body ~190 px, '
                            'contact shadow in the alpha.',
    'L22b_stage_steel_idle': 'Stage layer: the steel "stranger" cube idles (90 deg yaw seamless loop), centre (1500, 560).',
    'L22c_stage_bank_in': 'Stage layer: the bank drops in from above and lands with weight (centre (960, 520), ~470 px).',
    'L22c_stage_bank_out': 'Stage layer: from the landed pose the bank sinks straight down through the floor until gone.',
    'L22d_stage_coin': 'Stage layer: a plain gold coin waits beside the lime cube (clear of the bank and its shadow), then '
                       'rolls to the steel cube in 1.2 s with rotation = distance / radius, stops upright.',
}
N = FR[shot]
loop = shot in ('L22a_stage_lime_idle', 'L22b_stage_steel_idle')
sh = Shot(shot, N, 'white', alpha=True, loop=loop, desc=DESC[shot])
sh.every = 10
sc = bpy.context.scene
k = sh.pct / 100.0

# ------------------------------------------------------------------ the one stage camera
# fitted so a 0.20 m cube at the origin is 190 px tall and centred (960, 560): every layer shares it
rig = S.Rig(target=(0, 0, CUBE / 2), dist=3.4, az=0.0, el=12.0)
probe = O.make('you_cube')
sh.fit(rig, [probe], px_h=PX_CUBE, cx=960, cy=560)
for c in list(probe.children_recursive) + [probe]:
    bpy.data.objects.remove(c, do_unlink=True)


def x_at(px, y=0.0, z=CUBE / 2):
    lo, hi = -3.0, 3.0
    for _ in range(50):
        m = (lo + hi) / 2
        if S.project(Vector((m, y, z)))[0] / k < px:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


def catcher(cx, cy, sx, sy):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, cy, 0))
    f = bpy.context.active_object
    f.name = 'FLOOR'
    f.scale = (sx, sy, 1)
    S.assign(f, 'floor_white')
    f.is_shadow_catcher = True
    return f


def stage_lights(target):
    S.light_rig('white', target=target, scale=2.0, neg_fill=False)   # wide stage: same key angle across it


subject = None
if shot in ('L22a_stage_lime_idle', 'L22b_stage_steel_idle'):
    kind, px = ('you_cube', 420) if shot.startswith('L22a') else ('steel_cube', 1500)
    x = x_at(px)
    mover = S.empty('MOVER', (x, 0, CUBE / 2))
    cube = O.make(kind)
    cube.parent = mover
    cube.location = (0, 0, -CUBE / 2)
    S.bake([mover], range(0, N + 2), lambda f, t: setattr(mover, 'rotation_euler', (0, 0, math.radians(30 + 90.0 * (f - 1) / N))))
    stage_lights((0, 0, CUBE / 2))
    catcher(x + 0.12, -0.12, 0.9, 0.9)
    S.lensing_plate('white', rig, dist_behind=1.2)
    subject = mover
    sh.anchor('cube_centre', lambda: mover.matrix_world.translation.copy())
    sh.anchor('cube_top', lambda: mover.matrix_world @ Vector((0, 0, CUBE / 2)))

elif shot.startswith('L22c'):
    B_H = 4.72                                      # builder height of the bank
    # solve depth y and scale so the bank is 470 px tall with its centre at (960, 520)
    def place(y):
        lo_s, hi_s = 0.01, 0.4
        for _ in range(40):
            s_ = (lo_s + hi_s) / 2
            h = (S.project(Vector((0, y, 0)))[1] - S.project(Vector((0, y, B_H * s_)))[1]) / k
            if h > 470:
                hi_s = s_
            else:
                lo_s = s_
        s_ = (lo_s + hi_s) / 2
        cy = (S.project(Vector((0, y, 0)))[1] + S.project(Vector((0, y, B_H * s_)))[1]) / 2 / k
        return s_, cy
    lo_y, hi_y = -2.0, 2.0
    for _ in range(40):
        my = (lo_y + hi_y) / 2
        s_, cy = place(my)
        if cy > 520:          # too low on screen -> move it back (further from the camera)
            lo_y = my
        else:
            hi_y = my
    yb = (lo_y + hi_y) / 2
    s_, cy = place(yb)
    bank = O.make('bank', scale=s_)
    mover = S.empty('MOVER', (0, yb, 0))
    bank.parent = mover
    bank.rotation_euler = (0, 0, math.radians(-22))
    Hb = B_H * s_
    stage_lights((0, yb, Hb / 2))
    catcher(0.1, yb - 0.05, 1.3, 1.0)
    S.lensing_plate('white', rig, dist_behind=1.2)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, -0.0005))
    ho = bpy.context.active_object
    ho.name = 'HOLDOUT'
    ho.is_holdout = True
    meshes = [c for c in bank.children_recursive if c.type == 'MESH']
    if shot == 'L22c_stage_bank_in':
        F0, LAND = 31, 45
        z0 = Hb * 2.2
        def pose(f, t):
            if f <= F0:
                z = z0
            elif f <= LAND:
                u = (f - F0) / (LAND - F0)
                z = z0 * (1 - u * u)
            else:
                u = (f - LAND) / FPS
                z = -0.006 * Hb * math.exp(-9 * u) * math.sin(math.pi * min(1.0, u / 0.25))
            mover.location = (0, yb, z)
        S.bake([mover], range(0, N + 2), pose)
        for f in range(1, N + 1):
            sc.frame_set(f)
            for mo in meshes:
                mo.hide_render = f < F0
                mo.keyframe_insert('hide_render', frame=f)
                mo.visible_shadow = mover.location.z < 0.45 * Hb
                mo.keyframe_insert('visible_shadow', frame=f)
        sh.hold(1, F0 - 1)
        sh.hold(LAND + 10, N)
        sh.event('land', LAND)
        sh.extra['handoff'] = 'end pose = L22c_stage_bank_out frame 1'
    else:
        F0, GONE = 31, 55
        def pose(f, t):
            mover.location = (0, yb, -Hb * 1.08 * S.prog(f, F0, GONE) ** 3)
        S.bake([mover], range(0, N + 2), pose)
        sh.hold(1, F0)
        sh.hold(GONE, N)
        sh.event('sink_start', F0)
        sh.event('gone', GONE)
    subject = mover
    sh.anchor('bank_centre', lambda: mover.matrix_world.translation + Vector((0, 0, Hb / 2)))
    sh.anchor('bank_top', lambda: mover.matrix_world.translation + Vector((0, 0, Hb)))
    sh.extra['bank_depth_m'] = round(yb, 4)

else:   # L22d coin
    D = 110.0 / PX_CUBE * CUBE                      # ~0.116 m
    r = D / 2
    x0 = x_at(600, 0.0, r)          # beside the lime cube with a small gap (AD: ~560)
    x1 = x_at(1335, 0.0, r)         # stops just short of the steel cube (AD: ~1370)
    mover = S.empty('MOVER', (x0, 0, r))
    roll = S.empty('ROLL', (0, 0, 0), mover)
    c = O.coin(0.5, 0.12, 'gold', 'COIN', upright=True)
    c.scale = (D,) * 3
    c.parent = roll
    c.location = (0, -0.06 * D, -r)
    F0, F1, F2 = 31, 67, 78                          # wait, roll 1.2 s, settle
    dist = x1 - x0

    def pose(f, t):
        u = S.prog(f, F0, F1)
        s = S.cubic_in_out(u)                         # pushed, rolls, brakes to a stop
        x = x0 + dist * s
        uu = max(0.0, (f - F1) / FPS)
        wob = 2.5 * math.exp(-8 * uu) * math.sin(2 * math.pi * uu / 0.28) if f > F1 else 0.0
        turn = S.cubic_in_out(S.prog(f, F1 - 4, F2))
        mover.location = (x, 0, r)
        mover.rotation_euler = Euler((math.radians(wob), 0, math.radians(-18 * turn)), 'XYZ')
        roll.rotation_euler = (0, (x - x0) / r, 0)   # angle = distance / radius: no slip
    S.bake([mover, roll], range(0, N + 2), pose)
    stage_lights((0, 0, CUBE / 2))
    catcher((x0 + x1) / 2 + 0.05, -0.08, abs(dist) + 0.6, 0.6)
    S.lensing_plate('white', rig, dist_behind=1.2)
    sh.hold(1, F0 - 1)
    sh.hold(F2 + 8, N)
    sh.event('start', F0)
    sh.event('stop', F1)
    subject = mover
    sh.anchor('coin_centre', lambda: mover.matrix_world.translation.copy())

S.light_link([subject], floor_lit=True)
sh.extra['stage'] = 'all L22 layers share one camera: place each at 0,0 at 1:1 (no scaling)'
sh.run()
