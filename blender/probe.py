"""Exposure probe (bible §3): a Cloud diffuse cube under the ONE rig; prints the linear value of its lit top
face, its front face and the floor, so the key power can be calibrated (target top = 0.80-0.85 linear).
Blender -b -P probe.py -- --world white --key 1.0
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import numpy as np
import studio as S
import objects as O

o = S.opts(dict(world='white', key=1.0, out='/tmp/probe.exr'))
S.new_scene()
S.render_settings(480, 270, samples=64, motion_blur=False)
sc = bpy.context.scene
sc.render.image_settings.file_format = 'OPEN_EXR'
sc.render.image_settings.color_depth = '32'
sc.view_settings.view_transform = 'Standard'
S.MATS['probe'] = S._principled('probe', base='cloud', rough=0.9, spec=0.0)[0]
root = O.box('PROBE', (0.2, 0.2, 0.2), (0, 0, 0.1), 'probe', None, bev=0.004, seg=2)
rig = S.Rig(dist=2.13, az=25, el=12, fstop=0)
S.light_rig(o['world'], target=(0, 0, 0.1), key_power=o['key'])
S.floor(o['world'])
S.light_link([root], floor_lit=(o['world'] == 'white'))
sc.render.filepath = o['out']
bpy.ops.render.render(write_still=True)
img = bpy.data.images.load(o['out'])
W, H = img.size
px = np.array(img.pixels[:]).reshape(H, W, 4)


def at(p):
    x, y = S.project(p)
    x, y = int(x * W / 480), int(y * H / 270)
    v = px[H - 1 - y, x, :3]
    return [round(float(c), 3) for c in v]


print('PROBE world=%s key=%.2f top=%s front=%s right=%s floor_front=%s' % (
    o['world'], o['key'], at((0, 0, 0.199)), at((0, -0.1, 0.1)), at((0.1, 0, 0.1)), at((0, -0.35, 0.0))))
