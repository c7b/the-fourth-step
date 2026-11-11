"""The 'you' cube shots: L01_cube_jump, L02_cube_idle_ink, L03_cube_idle_white, L12_cube_to_monero,
L17_monero_block_idle.   Blender -b -P shots_cube.py -- --shot L01_cube_jump [--preview 1]

One camera for all of them (so hand-offs match: L01 end = L02 start; L12 end = L11a start):
60 mm, 12 deg above, cube body 300 px tall centred at (960, 520) (L17: 540), cube yawed 30 deg (three-quarter).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector, Euler
import studio as S
import objects as O
from shotlib import Shot

shot = S.opts(dict(shot='L01_cube_jump'))['shot']
YAW0 = 30.0
EL = 12.0
SIZE = S.UNIT          # 0.20 m
FPS = 30

SPEC = {
    'L01_cube_jump': dict(frames=120, world='dark', alpha=True, loop=False, cy=520,
                          desc='The lime "you" cube jumps in from below the frame, one arc, lands at centre with one '
                               'small physical settle. End pose = L02 frame 1.'),
    'L02_cube_idle_ink': dict(frames=240, world='dark', alpha=True, loop=True, cy=520,
                              desc='Seamless loop: the lime cube yaws 90 deg in 8 s (dark context, no floor).'),
    'L03_cube_idle_white': dict(frames=240, world='white', alpha=True, loop=True, cy=520,
                                desc='Seamless loop: the lime cube yaws 90 deg in 8 s on the white-world shadow catcher.'),
    'L12_cube_to_monero': dict(frames=96, world='dark', alpha=True, loop=False, cy=520,
                               desc='The lime jelly turns into frosted Monero orange, a frost front sweeping top to '
                                    'bottom in 1.2 s. End pose = the front block of L11a frame 1.'),
    'L17_monero_block_idle': dict(frames=240, world='dark', alpha=True, loop=True, cy=540,
                                  desc='Seamless loop: one frosted Monero-orange block yaws 90 deg in 8 s.'),
}[shot]

sh = Shot(shot, SPEC['frames'], SPEC['world'], SPEC['alpha'], loop=SPEC['loop'], desc=SPEC['desc'])
sh.glare = SPEC['world'] == 'dark'

# the cube hangs from a MOVER empty at its centre, so it can tumble about its own centre
mover = S.empty('MOVER', (0, 0, SIZE / 2))
kind = 'monero_cube' if shot == 'L17_monero_block_idle' else 'you_cube'
cube = O.make(kind)
cube.parent = mover
cube.location = (0, 0, -SIZE / 2)
mover.rotation_euler = (0, 0, math.radians(YAW0))
body = [c for c in cube.children if c.name.endswith('_body')][0]

# camera: fitted on the rest pose, identical in every cube shot
rig = S.Rig(target=(0, 0, SIZE / 2), dist=2.13, az=0.0, el=EL)
sh.fit(rig, [cube], px_h=300, cx=960, cy=SPEC['cy'])
S.light_rig(SPEC['world'], target=(0, 0, SIZE / 2), neg_fill=False)
if SPEC['world'] == 'white':
    S.floor('white', size=0.8, catcher=True)
S.lensing_plate(SPEC['world'], rig, dist_behind=1.2)
S.light_link([mover], floor_lit=(SPEC['world'] == 'white'))

sc = bpy.context.scene
N = SPEC['frames']
centre = lambda: mover.matrix_world.translation.copy()
top = lambda: mover.matrix_world @ Vector((0, 0, SIZE / 2))
upper_right = lambda: (rig.cam.matrix_world @ Vector((0, 0, 0))) * 0 + mover.matrix_world.translation + \
    rig.cam.matrix_world.to_3x3() @ Vector((SIZE * 0.62, SIZE * 0.62, 0))

if shot == 'L01_cube_jump':
    # timing (frames): handle 1-30 (cube below frame), launch 31, peak, land, settle, hold to 120
    F0, PEAK, LAND = 31, 64, 73
    zp = 0.06                               # peak 0.06 m (= 90 px) above the rest height
    a = zp / (LAND - PEAK) ** 2             # one parabola: z = zp - a (f - PEAK)^2 (constant gravity)
    z_start = zp - a * (F0 - PEAK) ** 2     # = about -0.75 m: the whole cube starts below the frame
    SET_END = LAND + 14

    def pose(f, t):
        if f <= F0:
            z, rx = z_start, -90.0
        elif f <= LAND:
            z = zp - a * (f - PEAK) ** 2
            # one quarter tumble: quick out of the launch, aligned a little after the peak, then a flat fall
            rx = -90.0 * (1 - S.prog(f, F0, PEAK + 2)) ** 1.5   # ~60 deg of the tumble visible, flat before the peak
        else:
            u = (f - LAND) / FPS             # one small rebound + a 2 deg rock, damped within ~0.45 s
            z = 0.0045 * max(0.0, math.sin(math.pi * min(1.0, u / 0.2))) * (u < 0.2)
            rx = 2.2 * math.exp(-7.5 * u) * math.sin(2 * math.pi * u / 0.3)
        mover.location = (0, 0, SIZE / 2 + z)
        mover.rotation_euler = Euler((math.radians(rx), 0, math.radians(YAW0)), 'ZXY')
    mover.rotation_mode = 'ZXY'
    S.bake([mover], range(1, N + 1), pose)
    sh.hold(1, F0 - 1)                       # empty frames (the cube is below the frame)
    sh.hold(SET_END, N)                      # static end pose
    sh.event('launch', F0)
    sh.event('peak', PEAK)
    sh.event('land', LAND)
    sh.event('settled', SET_END)
    sh.extra['handoff'] = 'end pose (frames %d-%d) = L02_cube_idle_ink frame 1' % (SET_END, N)

elif shot in ('L02_cube_idle_ink', 'L03_cube_idle_white', 'L17_monero_block_idle'):
    # seamless: yaw keyed 0 at frame 1 and 90 deg at frame N+1 (render 1..N), linear
    def pose(f, t):
        mover.rotation_euler = (0, 0, math.radians(YAW0 + 90.0 * (f - 1) / N))
    S.bake([mover], range(1, N + 2), pose)

elif shot == 'L12_cube_to_monero':
    F0, F1 = 31, 67                          # 1.2 s sweep
    m = bpy.data.materials.new('frost_sweep')
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    sa, va = S.recipe_into(nt, 'lime')
    sb, vb = S.recipe_into(nt, 'monero_frost')   # v5: lime frosts into neutral glass
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 6.0
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    wob = nt.nodes.new('ShaderNodeMath')
    wob.operation = 'MULTIPLY_ADD'
    wob.inputs[1].default_value = 0.06
    wob.inputs[2].default_value = -0.03
    nt.links.new(nz.outputs['Fac'], wob.inputs[0])
    zs = nt.nodes.new('ShaderNodeMath')
    zs.operation = 'ADD'
    nt.links.new(sep.outputs['Z'], zs.inputs[0])
    nt.links.new(wob.outputs[0], zs.inputs[1])
    front = nt.nodes.new('ShaderNodeValue')
    front.name = 'front'
    d = nt.nodes.new('ShaderNodeMath')
    d.operation = 'SUBTRACT'
    nt.links.new(zs.outputs[0], d.inputs[0])
    nt.links.new(front.outputs[0], d.inputs[1])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = -0.035, 0.035
    nt.links.new(d.outputs[0], mr.inputs['Value'])
    mx = nt.nodes.new('ShaderNodeMixShader')          # 0 (below the front) = lime, 1 (above) = orange frost
    nt.links.new(mr.outputs['Result'], mx.inputs[0])
    nt.links.new(sa, mx.inputs[1])
    nt.links.new(sb, mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs['Surface'])
    mv = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(mr.outputs['Result'], mv.inputs[0])
    nt.links.new(va, mv.inputs[1])
    nt.links.new(vb, mv.inputs[2])
    nt.links.new(mv.outputs[0], out.inputs['Volume'])
    S.assign(body, m)
    # the body mesh is centred on its object origin: local Z runs -0.5..0.5 (builder units)
    fs = front.outputs[0]
    for f in range(1, N + 2):
        k = S.cubic_in_out(S.prog(f, F0, F1))
        fs.default_value = S.lerp(0.62, -0.62, k)
        fs.keyframe_insert('default_value', frame=f)
    sh.hold(1, F0 - 1)
    sh.hold(F1 + 1, N)
    sh.event('sweep_start', F0)
    sh.event('done', F1)
    sh.extra['handoff'] = 'end pose = L11a_ring_form frame 1 (the front block)'

sh.anchor('cube_centre', centre)
sh.anchor('cube_top', top)
sh.anchor('cube_upper_right', upper_right)
sh.run()
