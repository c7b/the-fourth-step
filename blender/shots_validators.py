"""v5 · L21_validator_teams (4:59, "teams of computers check the work, each team looks after its own piece of the
records"). Opaque on ink (#040723), glossy floor. 270 frames = 1 s handle + 7 s action + 1 s handle.
Four committees: each guards its own shard of the ledger (frosted cloud-glass slab, amounts as frosted violet insets)
with five small violet glass validators. A lime payment pulse travels along the floor; as it passes, that team's
validators get a thin lime edge glow and its shard lights; the amounts never un-frost. Events: pulse_start,
group1..group4, all_checked. Bands kept clear: y 0-300 (headline) and 860-1080 (chip + tracker).
Blender -b -P shots_validators.py -- --shot L21_validator_teams [--preview 1]
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
import studio as S
from shotlib import Shot

shot = 'L21_validator_teams'
FPS, N = 30, 270
sh = Shot(shot, N, 'dark', alpha=False, loop=False,
          desc='Four teams of violet glass validators, each guarding its own frosted shard of the ledger; a lime payment '
               'pulse passes and each team lights up in turn; the amounts stay frosted.')
sh.glare = True
sh.every = 1     # v6: per-frame anchors (the pulse's screen path, for 2D work if wanted)
sc = bpy.context.scene


def glow_material(name, recipe, color='lime', k=6.0, power=1.8):
    """A look.py recipe plus an edge glow (facing^power) whose strength is a keyable Value node 'glow'."""
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    surf, vol = S.recipe_into(nt, recipe)
    lw = nt.nodes.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.5
    pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = power
    nt.links.new(lw.outputs['Facing'], pw.inputs[0])
    val = nt.nodes.new('ShaderNodeValue'); val.name = 'glow'; val.outputs[0].default_value = 0.0
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    nt.links.new(pw.outputs[0], mul.inputs[0]); nt.links.new(val.outputs[0], mul.inputs[1])
    mul2 = nt.nodes.new('ShaderNodeMath'); mul2.operation = 'MULTIPLY'; mul2.inputs[1].default_value = k
    nt.links.new(mul.outputs[0], mul2.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = S.col(color)
    nt.links.new(mul2.outputs[0], em.inputs['Strength'])
    add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(surf, add.inputs[0]); nt.links.new(em.outputs['Emission'], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs['Surface'])
    if vol is not None:
        nt.links.new(vol, out.inputs['Volume'])
    return m, val.outputs[0]


# ------------------------------------------------------------------ the four teams (metres)
GROUPS = [(-0.78, -0.06), (-0.27, 0.10), (0.27, 0.10), (0.78, -0.06)]
SW, SH, ST = 0.21, 0.135, 0.014          # shard slab
VC = 0.042                               # validator piece
teams = []
for gi, (gx, gy) in enumerate(GROUPS):
    root = S.empty('TEAM%d' % gi, (gx, gy, 0))
    yaw = math.atan2(gx, 2.4) * 0.6          # each team turned a little toward the camera
    root.rotation_euler = (0, 0, yaw)
    shard_m, shard_glow = glow_material('shard_%d' % gi, 'frost_glass', k=2.5, power=2.2)
    val_m, val_glow = glow_material('validator_%d' % gi, 'violet', k=2.2, power=4.0)   # a thin lime edge
    # the shard: a frosted cloud-glass slab standing up, three frosted violet "amount" bars set in its face
    shard = S.box('T%d_shard' % gi, (SW, ST, SH), (0, 0.03, SH / 2 + 0.004), shard_m, root, bev=0.004, seg=3)
    for b in range(3):
        bw = SW * (0.62 if b != 1 else 0.48)
        S.box('T%d_bar%d' % (gi, b), (bw, 0.004, 0.016), (SW * 0.12 - (0.62 * SW - bw) / 2, 0.03 - ST / 2 - 0.0015,
              SH * 0.74 - b * 0.036 + 0.004), 'violet_glass', root, bev=0.0015, seg=2)
    # five validators in an arc in front of the shard, all facing it
    for v in range(5):
        a = math.radians(-62 + v * 31)
        p = Vector((0.17 * math.sin(a), 0.03 - 0.17 * math.cos(a), VC / 2))
        o = S.box('T%d_val%d' % (gi, v), (VC, VC, VC), p, val_m, root, bev=VC * 0.12, seg=4)
        o.rotation_euler = (0, 0, a)
    teams.append(dict(root=root, x=gx, shard_glow=shard_glow, val_glow=val_glow))

# ------------------------------------------------------------------ the payment pulse (a small lime light)
pulse_m = bpy.data.materials.new('pulse')
pnt = pulse_m.node_tree
for n in list(pnt.nodes):
    pnt.nodes.remove(n)
pe = pnt.nodes.new('ShaderNodeEmission'); pe.inputs['Color'].default_value = S.col('lime'); pe.inputs['Strength'].default_value = 1.25  # true lime under Standard (higher clips to yellow); glare adds the glow
po = pnt.nodes.new('ShaderNodeOutputMaterial'); pnt.links.new(pe.outputs[0], po.inputs['Surface'])
bm_r = 0.033                       # final: 3x the draft's pulse (AD)
import bmesh
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=bm_r)
pulse = S.mesh_from_bm('PULSE', bm, pulse_m, None)
pulse.visible_shadow = False


def path(u):
    """Floor path weaving in front of each team (u 0..1, left to right)."""
    x = -1.25 + 2.5 * u
    # v6: a slalom that swings toward each team (one period per team spacing), so the comet tail visibly bends
    y = -0.33 + 0.10 * math.cos(math.pi * 2.0 * (x + 0.78) / 0.525)
    return Vector((x, y, bm_r + 0.002))


# v6 (owner: "the tail stays a straight line, it doesn't follow the path"): the trail is a RIBBON laid along the
# pulse's whole floor route; its shader lights only the stretch just behind the pulse (keyed 'head' = the pulse's
# route parameter) and fades it along the route, so the tail bends exactly with the path travelled. No particles.
TRAIL_L, TRAIL_W, NR = 0.45, 0.05, 900
plen = sum((path((i + 1) / 400) - path(i / 400)).length for i in range(400))
trail_m = bpy.data.materials.new('trail')
tnt = trail_m.node_tree
for n in list(tnt.nodes):
    tnt.nodes.remove(n)
tuv = tnt.nodes.new('ShaderNodeUVMap')
tsep = tnt.nodes.new('ShaderNodeSeparateXYZ'); tnt.links.new(tuv.outputs['UV'], tsep.inputs[0])
thead = tnt.nodes.new('ShaderNodeValue'); thead.name = 'head'
tdist = tnt.nodes.new('ShaderNodeMath'); tdist.operation = 'SUBTRACT'                 # route distance behind the pulse
tnt.links.new(thead.outputs[0], tdist.inputs[0]); tnt.links.new(tsep.outputs['X'], tdist.inputs[1])
tmr = tnt.nodes.new('ShaderNodeMapRange')                                              # 0 -> 1 (at the pulse), L -> 0
tmr.inputs['From Min'].default_value, tmr.inputs['From Max'].default_value = 0.0, TRAIL_L / plen
tmr.inputs['To Min'].default_value, tmr.inputs['To Max'].default_value = 1.0, 0.0
tnt.links.new(tdist.outputs[0], tmr.inputs['Value'])
tbehind = tnt.nodes.new('ShaderNodeMath'); tbehind.operation = 'GREATER_THAN'; tbehind.inputs[1].default_value = -0.0004
tnt.links.new(tdist.outputs[0], tbehind.inputs[0])                                      # nothing ahead of the pulse
tpow = tnt.nodes.new('ShaderNodeMath'); tpow.operation = 'POWER'; tpow.inputs[1].default_value = 2.2
tnt.links.new(tmr.outputs['Result'], tpow.inputs[0])
tw = tnt.nodes.new('ShaderNodeMath'); tw.operation = 'SUBTRACT'; tw.inputs[0].default_value = 1.0
tnt.links.new(tsep.outputs['Y'], tw.inputs[1])
tw2 = tnt.nodes.new('ShaderNodeMath'); tw2.operation = 'MULTIPLY'
tnt.links.new(tsep.outputs['Y'], tw2.inputs[0]); tnt.links.new(tw.outputs[0], tw2.inputs[1])
tw3 = tnt.nodes.new('ShaderNodeMath'); tw3.operation = 'MULTIPLY'; tw3.inputs[1].default_value = 4.0  # soft sides
tnt.links.new(tw2.outputs[0], tw3.inputs[0])
tval = tnt.nodes.new('ShaderNodeValue'); tval.name = 'trail_on'
fac = tpow.outputs[0]
for other in (tbehind.outputs[0], tw3.outputs[0], tval.outputs[0]):
    m_ = tnt.nodes.new('ShaderNodeMath'); m_.operation = 'MULTIPLY'
    tnt.links.new(fac, m_.inputs[0]); tnt.links.new(other, m_.inputs[1]); fac = m_.outputs[0]
tem = tnt.nodes.new('ShaderNodeEmission'); tem.inputs['Color'].default_value = S.col('lime'); tem.inputs['Strength'].default_value = 1.0
ttr = tnt.nodes.new('ShaderNodeBsdfTransparent')
tmx = tnt.nodes.new('ShaderNodeMixShader')
tnt.links.new(fac, tmx.inputs['Fac']); tnt.links.new(ttr.outputs[0], tmx.inputs[1]); tnt.links.new(tem.outputs[0], tmx.inputs[2])
tout = tnt.nodes.new('ShaderNodeOutputMaterial'); tnt.links.new(tmx.outputs[0], tout.inputs['Surface'])
tbm = bmesh.new()
uvl = tbm.loops.layers.uv.new('UVMap')
lv, rv = [], []
for i in range(NR + 1):
    u = i / NR
    p = path(u); p.z = 0.0015
    tg = path(min(1.0, u + 1e-3)) - path(max(0.0, u - 1e-3)); tg.z = 0.0; tg.normalize()
    nrm = Vector((-tg.y, tg.x, 0.0))
    lv.append(tbm.verts.new(p + nrm * TRAIL_W / 2)); rv.append(tbm.verts.new(p - nrm * TRAIL_W / 2))
for i in range(NR):
    fc = tbm.faces.new((lv[i], rv[i], rv[i + 1], lv[i + 1]))
    for loop, uv in zip(fc.loops, ((i / NR, 1.0), (i / NR, 0.0), ((i + 1) / NR, 0.0), ((i + 1) / NR, 1.0))):
        loop[uvl].uv = uv
trail = S.mesh_from_bm('TRAIL', tbm, trail_m, None, smooth=False)
trail.visible_shadow = False

T0, T1 = 31, 228            # pulse travels (frames)
lit_frame = {}
for gi, t in enumerate(teams):
    u = (t['x'] + 1.25) / 2.5
    lit_frame[gi] = int(round(T0 + (T1 - T0) * u))


def pose(f, tsec):
    u = S.prog(f, T0, T1)
    pulse.location = path(u)
    pulse.hide_render = not (T0 <= f <= T1 + 2)
    thead.outputs[0].default_value = u
    tval.outputs[0].default_value = S.prog(f, T0, T0 + 8) * (1 - S.prog(f, T1 - 6, T1 + 2))


for f in range(0, N + 2):
    pose(f, f / FPS)
    pulse.keyframe_insert('location', frame=f)
    pulse.keyframe_insert('hide_render', frame=f)
    thead.outputs[0].keyframe_insert('default_value', frame=f)
    tval.outputs[0].keyframe_insert('default_value', frame=f)
    for gi, t in enumerate(teams):
        g = S.expo_out(S.prog(f, lit_frame[gi] - 2, lit_frame[gi] + 10))       # lights as the pulse passes, stays lit
        t['val_glow'].default_value = g
        t['val_glow'].keyframe_insert('default_value', frame=f)
        t['shard_glow'].default_value = g
        t['shard_glow'].keyframe_insert('default_value', frame=f)

# ------------------------------------------------------------------ camera: one slow push
rig = S.Rig(target=(0, -0.05, 0.06), dist=2.6, az=0.0, el=34.0, fstop=4.0)
allobj = [t['root'] for t in teams]
# frame: the teams span x 160-1760 at the start, centred in the y 330-840 band
k = sh.pct / 100.0
_, _, pts = S.bbox(allobj)
pts = pts + [path(u / 20.0) for u in range(5, 16)]      # the pulse path in front of the teams counts too


def ext(d):
    rig.set(dist=d)
    pp = [S.project(p) for p in pts]
    return ((max(p[0] for p in pp) - min(p[0] for p in pp)) / k, (max(p[1] for p in pp) - min(p[1] for p in pp)) / k)


a, b = 0.3, 30.0
for _ in range(50):          # fill the y 330-840 band (470 px of content), but never wider than 1600 px
    m = (a + b) / 2
    w, h = ext(m)
    if h > 470 or w > 1600:
        a = m
    else:
        b = m
d0 = (a + b) / 2
rig.set(dist=d0)
sh.centre_on(rig, pts, 960, 585)


def cam(f, tsec):
    kk = (1 - math.exp(-max(0.0, tsec) / 4.0)) / (1 - math.exp(-N / FPS / 4.0))
    rig.set(dist=d0 * (1 - 0.07 * kk))           # 7% push, fast then slow, one direction


S.bake([rig.pivot, rig.cam], range(0, N + 2), cam)
S.light_rig('dark', target=(0, 0.02, 0.07), scale=1.6)
fl = S.floor('dark', size=30, back=2.5, radius=1.2)
S.light_link(allobj + [pulse])
sh.event('pulse_start', T0)
for gi in range(4):
    sh.event('group%d' % (gi + 1), lit_frame[gi])
sh.event('all_checked', lit_frame[3] + 10)
for gi, t in enumerate(teams):
    sh.anchor('team%d' % (gi + 1), (lambda r=t['root']: r.matrix_world @ Vector((0, 0.03, SH + 0.02))))
sh.anchor('pulse', lambda: pulse.matrix_world.translation.copy())
sh.anchor('pulse_floor', lambda: Vector((pulse.matrix_world.translation.x, pulse.matrix_world.translation.y, 0.0)))
sh.samples = dict(bg_pixel=(1, 60, 60))
sh.extra['background'] = '#040723'
sh.run()
