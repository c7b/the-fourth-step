"""P2: the engraved statement plate. L19a_plate_wall (white wall pull-back, opaque) and L19b_plate_dark_<tex>
(the plate alone on ink, alpha, once per supplied texture). Textures from textures/ (frames/plate-tex.html)
(plate-blank.png, plate-statement.png, plate-values-hidden.png, plate-all-hidden.png; 2488x1606).
Blender -b -P shots_plate.py -- --shot L19a_plate_wall | --shot L19b_plate_dark --tex plate-statement [--preview 1]

The plate face carries the texture (multiplied into the brushed aluminium, engraved look via a faint bump).
Light: the same key, swung to az 80 deg / el 38 deg (upper left, grazing the wall) because a camera-facing wall
gets nothing from the usual back-left key. Same power calibration, same cards.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
import studio as S
import objects as O
from shotlib import Shot

o = S.opts(dict(shot='L19a_plate_wall', tex='plate-statement'))
shot = o['shot']
FPS = 30
PW, PH = 3.0, 3.0 * 1606 / 2488       # plate face in builder units, the texture's aspect
WALL = shot in ('L19a_plate_wall', 'L20_ledger_wall_engraved')
ENGRAVED = shot == 'L20_ledger_wall_engraved'   # the other 34 plates carry the strangers' statements, faint
sid = shot if WALL else 'L19b_plate_dark_' + o['tex'].replace('plate-', '')
N = 240 if WALL else 300
sh = Shot(sid, N, 'white' if WALL else 'dark', alpha=not WALL, loop=False,
          desc=('White wall: face-on start (plate fills 94% of the width), pulls back 6 s to a wall of 7x5 plates '
                '(yours in the middle), ending ~20 deg yaw; raking light from the upper left.'
                + (' The other 34 plates carry the strangers\' statements, faint.' if ENGRAVED else
                   ' The other plates are blank.')) if WALL else
               ('The plate alone on ink, ~20 deg yaw, a slow 6 deg turn over 10 s; texture %s.' % o['tex']))


def face_material(tex, k=1.0):
    """cloud_metal with the AD's face texture projected on the front (-Y) face in object space.
    k < 1: a faint engraving (the texture is mixed toward white before multiplying)."""
    fn = os.path.join(S.TEXTURES, tex + '.png')
    m = bpy.data.materials.new('plate_%s_%.2f' % (tex, k))
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    surf, vol = S.recipe_into(nt, 'plate_metal')
    p = surf.node if surf.node.type == 'BSDF_PRINCIPLED' else next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    if os.path.exists(fn):
        tc = nt.nodes.new('ShaderNodeTexCoord')
        sep = nt.nodes.new('ShaderNodeSeparateXYZ')
        nt.links.new(tc.outputs['Object'], sep.inputs[0])
        u = nt.nodes.new('ShaderNodeMath'); u.operation = 'MULTIPLY_ADD'
        u.inputs[1].default_value = 1.0 / PW; u.inputs[2].default_value = 0.5
        v = nt.nodes.new('ShaderNodeMath'); v.operation = 'MULTIPLY_ADD'
        v.inputs[1].default_value = 1.0 / PH; v.inputs[2].default_value = 0.5
        nt.links.new(sep.outputs['X'], u.inputs[0]); nt.links.new(sep.outputs['Z'], v.inputs[0])
        cmb = nt.nodes.new('ShaderNodeCombineXYZ')
        nt.links.new(u.outputs[0], cmb.inputs['X']); nt.links.new(v.outputs[0], cmb.inputs['Y'])
        tx = nt.nodes.new('ShaderNodeTexImage')
        tx.image = bpy.data.images.load(fn)
        tx.extension = 'CLIP'
        nt.links.new(cmb.outputs[0], tx.inputs['Vector'])
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
        mul.inputs['Factor'].default_value = k
        mul.inputs['A'].default_value = p.inputs['Base Color'].default_value
        nt.links.new(tx.outputs['Color'], mul.inputs['B'])
        nt.links.new(mul.outputs['Result'], p.inputs['Base Color'])
    else:
        print('WARN texture missing', fn)
    nt.links.new(surf, out.inputs['Surface'])
    return m


s_ = 0.2                                   # builder unit -> m (plate 0.6 m wide)
mat_face = face_material(o['tex'] if not WALL else 'plate-statement')
if WALL:
    wall = O.ledger_wall(cols=7, rows=5, pw=PW, ph=PH, gap=0.16)
    wall.scale = (s_,) * 3
    mine = [c for c in wall.children if c.name.startswith('WALL_p3_2')][0]
    stranger = os.path.join(S.TEXTURES, 'plate-stranger-1.png')
    for c in mine.children_recursive:
        if c.name.endswith('_plate'):
            S.assign(c, mat_face)
    others_ = [q for q in wall.children if q.name.startswith('WALL_p') and q != mine]
    if not ENGRAVED:              # same plate material everywhere; only our plate is engraved
        blank = face_material('plate-blank')
        for q in others_:
            for c in q.children_recursive:
                if c.name.endswith('_plate'):
                    S.assign(c, blank)
    if ENGRAVED:
        faint = [face_material('plate-stranger-%d' % n, k=0.45) for n in (1, 2, 3)]
        others = [p for p in wall.children if p.name.startswith('WALL_p') and p != mine]
        for n, p in enumerate(sorted(others, key=lambda q: q.name)):
            for c in p.children_recursive:
                if c.name.endswith('_plate'):
                    S.assign(c, faint[(n * 7 + 3) % 3])
    target = mine.matrix_world.translation.copy() if False else Vector((0, 0, 0))
    bpy.context.view_layer.update()
    target = mine.matrix_world.translation.copy()
    rig = S.Rig(target=target, dist=1.0, az=0.0, el=0.0, fstop=4.0)
    # start: face-on, plate fills 94% of the width
    k = sh.pct / 100.0
    pts = [mine.matrix_world @ Vector((x * PW / 2, 0, z * PH / 2)) for x in (-1, 1) for z in (-1, 1)]
    a, b = 0.05, 50.0
    for _ in range(50):
        m_ = (a + b) / 2
        rig.set(dist=m_)
        pp = [S.project(p) for p in pts]
        if (max(p[0] for p in pp) - min(p[0] for p in pp)) / k > 0.94 * 1920:
            a = m_
        else:
            b = m_
    d0 = (a + b) / 2
    d1 = d0 * 6.0                  # the whole hop path (cols 2-6) stays in frame at the end
    def pose(f, t):
        kk = (1 - math.exp(-max(0, t - 1.0) / 1.4)) / (1 - math.exp(-6.0 / 1.4)) if t > 1.0 else 0.0
        kk = min(1.0, kk)
        rig.set(dist=math.exp(S.lerp(math.log(d0), math.log(d1), kk)), az=-20.0 * kk, el=4.0 * kk, focus=target)
    S.bake([rig.pivot, rig.cam, rig.focus], range(1, N + 1), pose)
    LOOKK = dict(S.LOOK.RIG['key'])
    S.LOOK.RIG['key'].update(az=80.0, el=38.0)
    S.light_rig('white', target=tuple(target), scale=3.0)
    S.LOOK.RIG['key'].update(LOOKK)
    S.light_link([wall], floor_lit=True)
    sh.hold(1, 30)
    sh.event('pullback_start', 31)
    corners = {'tl': (-1, 1), 'tr': (1, 1), 'br': (1, -1), 'bl': (-1, -1)}
    for nm, (x, z) in corners.items():
        sh.anchor('plate_' + nm, (lambda x=x, z=z: mine.matrix_world @ Vector((x * PW / 2, -0.05, z * PH / 2))))
    # the "one payment unravels the rest" hops: centres of these wall plates (col, row zero-based from the top left;
    # ours is col 3 row 2), named plate_c<col>_r<row> (AD request in REQUESTS.md)
    plates = {p.name: p for p in wall.children if p.name.startswith('WALL_p')}
    for c, r in ((3, 2), (4, 2), (4, 1), (5, 1), (5, 2), (6, 3), (5, 3), (2, 3), (2, 1)):
        pl = plates['WALL_p%d_%d' % (c, r)]
        sh.anchor('plate_c%d_r%d' % (c, r), (lambda pl=pl: pl.matrix_world @ Vector((0, -0.05, 0))))
    sh.every = 1
else:
    plate = O.statement_plate(w=PW, h=PH, wall=False)
    plate.scale = (s_,) * 3
    for c in plate.children:
        if c.name.endswith('_plate'):
            S.assign(c, mat_face)
    holder = S.empty('TURN', (0, 0, 0))
    plate.parent = holder
    rig = S.Rig(target=(0, 0, 0), dist=2.13, az=0.0, el=4.0, fstop=4.0)
    LOOKK = dict(S.LOOK.RIG['key'])
    S.LOOK.RIG['key'].update(az=62.0, el=36.0)      # the same raking key as the wall (upper left, in front)
    S.light_rig('dark', target=(0, 0, 0))
    S.LOOK.RIG['key'].update(LOOKK)
    S.lensing_plate('dark', rig, dist_behind=1.2)
    S.light_link([holder])
    def pose(f, t):
        holder.rotation_euler = (0, 0, math.radians(-20 + 6.0 * (f - 1) / N))
    S.bake([holder], range(1, N + 1), pose)
    sh.fit(rig, [plate], px_h=560, cx=960, cy=540, frame=1)
    for nm, (x, z) in {'tl': (-1, 1), 'tr': (1, 1), 'br': (1, -1), 'bl': (-1, -1)}.items():
        sh.anchor('plate_' + nm, (lambda x=x, z=z: plate.matrix_world @ Vector((x * PW / 2, -0.07, z * PH / 2))))
    sh.anchor('plate_centre', lambda: plate.matrix_world @ Vector((0, -0.07, 0)))
    sh.every = 1
sh.run()
