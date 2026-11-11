"""The Monero ring: L11a_ring_form, L11b_ring_loop (1920x1080) and S01_ring_v_form, S01_ring_v_loop (1080x1920).
Blender -b -P shots_ring.py -- --shot L11a_ring_form [--preview 1]

Opaque on ink with the glossy black cyc. 16 identical frosted-orange blocks (yawed 30 deg like the hero cube, so the
front block = L12's end pose), radius 1.04 m: neighbours never overlap on screen; true depth and DOF.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
import studio as S
import objects as O
from shotlib import Shot

shot = S.opts(dict(shot='L11a_ring_form'))['shot']
REFL = bool(S.opts(dict(refl=0))['refl'])     # pass-only run for the *_alpha shot: floor reflections on black
ALPHA = shot.endswith('_alpha')               # v6: L11b_ring_loop_alpha = L11b on a transparent film, blocks only
VERT = shot.startswith('S01')
FORM = shot.replace('_alpha', '').endswith('form')
SIZE = S.UNIT
N_BLOCKS = 16
R = 5.2 * SIZE                      # 1.04 m
YAW0 = 30.0
OMEGA = 22.5 / 3.0                  # loop speed, deg/s (one block step in 3 s)
FPS = 30

if VERT:
    W, H = 1080, 1920
    frames = 300 if FORM else 90
    FORM_FRAMES = 300
    cx, cy0 = 540, 1190
    T_PULL, T_CROWD, T_SPIN, T_END = 1.0, 2.0, 4.5, 8.0          # seconds from frame 1 (handle = first 1 s)
    end_el, end_px_h, end_cy = 28.0, 440, 1190     # ring band y ~970-1410 (top 1000 px and below 1500 stay clear)
else:
    W, H = 1920, 1080
    frames = 360 if FORM else 90
    FORM_FRAMES = 360
    cx, cy0 = 960, 520
    T_PULL, T_CROWD, T_SPIN, T_END = 2.0, 2.3, 5.5, 10.5
    end_el, end_px_h, end_cy = 24.0, 500, 700      # ring band y ~450-950 (shot list: clear above 430, below 960)

desc = {
    'L11a_ring_form': 'Starts close on the front Monero block (= L12 end), pulls back and up to the ring; 15 blocks '
                      'rise from the floor around it; the ring spins fast ~1.5 turns and slows to the L11b speed.',
    'L11b_ring_loop': 'Seamless loop: the ring turns one block step (22.5 deg) in 3 s; camera = L11a end.',
    'S01_ring_v_form': 'Vertical: as L11a, framed for Shorts (ring centred at y 1190, diameter ~820 px).',
    'S01_ring_v_loop': 'Vertical seamless loop: 22.5 deg in 3 s; camera = S01_ring_v_form end.',
    'L11b_ring_loop_alpha': 'L11b on a transparent film: the blocks only (same camera, phase and loop as L11b); '
                            'the glossy-floor reflections of the blocks come as a separate refl/ pass (RGB on black).',
}[shot]
sh = Shot(shot, frames, 'dark', alpha=ALPHA and not REFL, w=W, h=H, loop=not FORM, desc=desc)
sh.glare = not REFL
if ALPHA and not REFL:
    sh.extra_passes = {'refl': 'refl/####.png', 'refl_blend': 'screen'}
if REFL:
    sh.dir = os.path.join(sh.dir, 'refl')
    sh.no_manifest = True

ring = S.empty('RING', (0, 0, 0))
blocks = []
for i in range(N_BLOCKS):
    a = 2 * math.pi * i / N_BLOCKS
    holder = S.empty('B%02d' % i, (R * math.sin(a), -R * math.cos(a), 0), ring)
    holder.rotation_euler = (0, 0, a + math.radians(YAW0))
    b = O.make('monero_cube')
    b.parent = holder
    blocks.append((holder, b))
front_centre = Vector((0, -R, SIZE / 2))

# ---------------------------------------------------------------- camera: start = hero framing, end = overview
rig = S.Rig(target=front_centre, dist=2.13, az=0.0, el=12.0, fstop=4.0)
sh.fit(rig, [blocks[0][0]], px_h=300, cx=cx, cy=cy0)
start = dict(target=Vector(rig.target), dist=rig.dist, el=12.0, sx=rig.cam.data.shift_x, sy=rig.cam.data.shift_y)
# overview: ring centre as target, elevation end_el, distance so the ring spans end_px_w, ring centre at end_cy
rig.cam.data.shift_x = rig.cam.data.shift_y = 0.0
rig.set(target=Vector((0, 0, SIZE / 2)), el=end_el)
k = sh.pct / 100.0
lo, hi, pts = S.bbox([ring])


def height(d):
    rig.set(dist=d)
    pp = [S.project(p) for p in pts]
    return (max(p[1] for p in pp) - min(p[1] for p in pp)) / k


a, b = 0.3, 60.0
for _ in range(50):
    m = (a + b) / 2
    if height(m) > end_px_h:
        a = m
    else:
        b = m
rig.set(dist=(a + b) / 2)
sh.centre_on(rig, pts, cx, end_cy)   # the ring's projected band centred on (cx, end_cy)
end = dict(target=Vector(rig.target), dist=rig.dist, el=end_el, sx=rig.cam.data.shift_x, sy=rig.cam.data.shift_y)

S.light_rig('dark', target=(0, 0, SIZE / 2), scale=2.5)
fl = S.floor('dark', size=40, back=3.0, radius=1.5)
# v5: the glossy floor (reflection + glow pool) fades in over the first 1.5 s of the FORM shots, so the cut from
# L12 (alpha, no floor) never pops a full reflection in one frame. Loops keep the full floor.
fm = fl.data.materials[0]
fnt = fm.node_tree
fout = next(n for n in fnt.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
fsurf = fout.inputs['Surface'].links[0].from_socket
fink = fnt.nodes.new('ShaderNodeEmission')
fink.inputs['Color'].default_value = S.col('ink')
fink.inputs['Strength'].default_value = 1.0
fmix = fnt.nodes.new('ShaderNodeMixShader')
fval = fnt.nodes.new('ShaderNodeValue')
fval.name = 'floor_in'
fnt.links.new(fval.outputs[0], fmix.inputs['Fac'])
fnt.links.new(fink.outputs['Emission'], fmix.inputs[1])
fnt.links.new(fsurf, fmix.inputs[2])
fnt.links.new(fmix.outputs['Shader'], fout.inputs['Surface'])
if ALPHA and not REFL:                        # beauty: blocks only on a transparent film
    fl.hide_render = True
if REFL:                                      # pass: only what the glossy floor reflects (the blocks), on black
    rm_ = bpy.data.materials.new('floor_refl_only')
    for n in list(rm_.node_tree.nodes):
        rm_.node_tree.nodes.remove(n)
    rm_.node_tree.nodes.new('ShaderNodeOutputMaterial')
    _s, _v = S.recipe_into(rm_.node_tree, 'floor_dark')
    rp = next(n for n in rm_.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    rp.inputs['Emission Strength'].default_value = 0.0
    rp.inputs['Base Color'].default_value = (0, 0, 0, 1)
    rout = next(n for n in rm_.node_tree.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
    rm_.node_tree.links.new(rp.outputs['BSDF'], rout.inputs['Surface'])
    S.assign(fl, rm_)
    for n in bpy.context.scene.world.node_tree.nodes:
        if n.type == 'BACKGROUND':
            n.inputs['Strength'].default_value = 0.0
    for h, b in blocks:
        for m in [b] + list(b.children_recursive):
            if m.type == 'MESH':
                m.visible_camera = False
FLOOR_IN = 1.5
for f in range(1, frames + 2):
    fval.outputs[0].default_value = S.cubic_in_out(S.prog((f - 1) / FPS, 0.0, FLOOR_IN)) if FORM else 1.0
    fval.outputs[0].keyframe_insert('default_value', frame=f)
S.light_link([ring])


def _form_last_angle():
    return ring_angle(FORM_FRAMES / FPS)


def ring_angle(t):
    """Static, then a fast spin of ~1.5 turns that slows (never reverses) into the loop speed OMEGA."""
    if t <= T_SPIN:
        return 0.0
    u = t - T_SPIN
    return 520.0 * (1 - math.exp(-u / 0.75)) + OMEGA * u


def cam_k(t):
    if t <= T_PULL:
        return 0.0
    T = T_END - T_PULL
    u = min(t - T_PULL, T)
    return (1 - math.exp(-u / 1.15)) / (1 - math.exp(-T / 1.15))


LOOP_PHASE = _form_last_angle() % 22.5
order = sorted(range(1, N_BLOCKS), key=lambda i: (min(i, N_BLOCKS - i), i))   # neighbours of "you" first


def pose(f, t):
    if FORM:
        kk = cam_k(t)
        tgt = start['target'].lerp(end['target'], kk)
        d = math.exp(S.lerp(math.log(start['dist']), math.log(end['dist']), kk))
        # focus on the fixed front of the ring (= block 0 at frame 1); a rotating block would shift the DOF and
        # break the L11a-last == L11b-first seam
        rig.set(target=tgt, dist=d, el=S.lerp(start['el'], end['el'], kk), focus=front_centre)
        rig.cam.data.shift_x = S.lerp(start['sx'], end['sx'], kk)
        rig.cam.data.shift_y = S.lerp(start['sy'], end['sy'], kk)
        ring.rotation_euler = (0, 0, math.radians(ring_angle(t)))
        for n, i in enumerate(order):     # cascade: each block rises out of the floor, 0.1 s apart
            t0 = T_CROWD + n * 0.1
            kr = S.expo_out(S.prog(t, t0, t0 + 0.45))
            blocks[i][0].location.z = S.lerp(-SIZE * 1.15, 0.0, kr)
    else:
        # v5: frame 1 == the FORM shot's last frame (same ring angle); constant speed, 22.5 deg per 90 frames,
        # so frame 91 == frame 1 (identical blocks)
        ring.rotation_euler = (0, 0, math.radians(LOOP_PHASE + OMEGA * (f - 1) / FPS))


def front_world():
    bpy.context.view_layer.update()
    return blocks[0][0].matrix_world @ Vector((0, 0, SIZE / 2))


if FORM:
    # keyed one frame beyond both ends: motion blur at frame 1 / N is symmetric, so seams match (L11a last = L11b 1)
    S.bake([ring, rig.pivot, rig.cam, rig.focus] + [h for h, _ in blocks], range(0, frames + 2), pose)
    for f in range(0, frames + 2):     # lens shift is keyed alongside
        bpy.context.scene.frame_set(f)
        pose(f, f / FPS)
        rig.cam.data.keyframe_insert('shift_x', frame=f)
        rig.cam.data.keyframe_insert('shift_y', frame=f)
    sh.hold(1, int(T_PULL * FPS) - 1)
    sh.event('pullback_start', int(T_PULL * FPS))
    sh.event('crowd', int(T_CROWD * FPS))
    sh.event('crowd_done', int((T_CROWD + 1.5 + 0.45) * FPS))
    sh.event('spin', int(T_SPIN * FPS))
    sh.event('camera_settled', int(T_END * FPS))
    sh.extra['handoff'] = 'frame 1 = L12_cube_to_monero end pose; end framing = %s' % (
        'S01_ring_v_loop' if VERT else 'L11b_ring_loop')
else:
    rig.set(target=end['target'], dist=end['dist'], el=end['el'], focus=front_centre)
    rig.cam.data.shift_x, rig.cam.data.shift_y = end['sx'], end['sy']
    S.bake([ring], range(0, frames + 2), pose)   # frame 0 keyed too: symmetric blur at frame 1
    sh.extra['loop_note'] = ('constant speed 7.5 deg/s; frame 1 = the FORM shot\'s last frame (ring phase %.3f deg); '
                             'frame 91 = frame 1 (renders 1..90)' % LOOP_PHASE)

sh.anchor('ring_centre', lambda: Vector((0, 0, SIZE / 2)))
sh.anchor('front_block', front_world)
for nm, idx in (('block_front_left', N_BLOCKS - 1), ('block_front_right', 1)):
    sh.anchor(nm, (lambda i: (lambda: blocks[i][0].matrix_world @ Vector((0, 0, SIZE / 2))))(idx))
sh.extra['background'] = '#040723 (camera sees the world at exactly this colour)'
if not ALPHA:
    sh.samples = dict(bg_pixel=(frames, 60 if not VERT else 60, 60))
sh.run()
