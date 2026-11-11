"""Lookdev: the hero materials side by side, for the view-transform comparison (bible §3).
Blender -b -P lookdev_group.py -- --vt 'Khronos PBR Neutral' --world dark --out out/_lookdev/vt_pbr.png [--cards 1]
"""
import os, sys, time, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import studio as S
import objects as O

o = S.opts(dict(vt='Standard', world='dark', out='out/_lookdev/vt_standard.png', w=960, h=540, cards=1, samples=0))
S.new_scene()
S.render_settings(o['w'], o['h'], samples=o['samples'] or None, motion_blur=False)
bpy.context.scene.view_settings.view_transform = o['vt']
items = [('you_cube', -0.5), ('monero_cube', -0.25), ('violet_module', 0.0), ('azure_module', 0.27), ('coin', 0.5)]
roots = []
for kind, x in items:
    r = O.make(kind)
    if kind in ('violet_module', 'azure_module'):
        r.scale = (0.11,) * 3
        r.rotation_euler = (0, 0, math.radians(-20))
    if kind == 'coin':
        r.scale = (0.2,) * 3
    r.location = (x, 0, 0)
    roots.append(r)
rig = S.Rig(dist=2.13, az=0, el=14, fstop=5.6)
S.frame_to(rig, roots, fill=0.42)
rig.set(target=rig.target + S.Vector((0, 0, -0.03)))
# hex chips: Emission 1.0 squares in front (under Standard they render exactly as their hex)
for j, hx in enumerate(['ink', 'cloud', 'lime', 'monero', 'purple', 'azure', 'yellow', 'steel']):
    m = bpy.data.materials.new('chip_' + hx)
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = S.col(hx); em.inputs['Strength'].default_value = 1.0
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], out.inputs['Surface'])
    chip = S.box('chip_' + hx, (0.07, 0.004, 0.07), ((j - 3.5) * 0.105, -0.22, 0.0352), m, None, bev=0.0)
    chip.rotation_euler = (math.radians(-14), 0, 0)
    chip.visible_shadow = False
    roots.append(chip)
S.light_rig(o['world'], target=tuple(rig.target), scale=1.6, cards=bool(o['cards']))
S.floor(o['world'], size=40, back=1.6, radius=0.8)
S.lensing_plate(o['world'], rig, dist_behind=2.0)
S.light_link(roots, floor_lit=(o['world'] == 'white'))
sc = bpy.context.scene
sc.render.filepath = os.path.abspath(o['out'])
t0 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDER_TIME group %s %.2f s' % (o['vt'], time.time() - t0))
