"""Build the reusable studio base .blend: the ONE rig (dark look; the white look is one call away), the camera at the
hero framing, the full materials library, and every object of the film in its own collection (real scale, laid
out on a grid). Blender -b -P build_base.py -- --out blend/studio_base_v1.blend
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import studio as S
import objects as O

o = S.opts(dict(out='blend/studio_base_v1.blend', world='dark'))
S.new_scene()
S.render_settings(1920, 1080)
kinds = [k for k in O.BUILDERS if k not in ('ledger_wall', 'statement_plate')] + ['statement_plate', 'ledger_wall']
for i, kind in enumerate(kinds):
    coll = bpy.data.collections.new('OBJ_' + kind)
    bpy.context.scene.collection.children.link(coll)
    r = O.make(kind)
    for ob in [r] + list(r.children_recursive):
        for c in list(ob.users_collection):
            c.objects.unlink(ob)
        coll.objects.link(ob)
    r.location = ((i % 6) * 1.2, (i // 6) * 1.6, 0)
    coll.hide_render = i != 0          # only the hero cube renders by default
for m in S.LOOK.MATERIALS:             # the whole library, even unused roles
    S.mat(m)
    S.MATS[m].use_fake_user = True
rig = S.Rig(target=(0, 0, 0.1), dist=2.13, az=0.0, el=12.0)
S.light_rig(o['world'], target=(0, 0, 0.1))
S.floor(o['world'], size=40, back=3.0, radius=1.5)
S.save_blend(os.path.abspath(o['out']))
print('BASE saved', o['out'], len(kinds), 'objects,', len(S.LOOK.MATERIALS), 'materials')
