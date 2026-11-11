"""Lookdev still of one object in the studio (real scale, the ONE rig, 60 mm).
Blender -b -P lookdev.py -- --obj bank --out out/_lookdev/bank.png [--w 960 --h 540 --samples 0 --world white
                                     --az 25 --el 12 --fill 0.5 --vt Standard --blend path.blend]
"""
import os, sys, time, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import studio as S
import objects as O

o = S.opts(dict(obj='you_cube', out='out/_lookdev/you_cube.png', w=960, h=540, samples=0, world='', az=25.0,
                el=12.0, fill=0.45, fstop=2.8, blend='', engine='CYCLES', turn=0.0, vt='', cards=1, absorb=0.0,
                glow=-1.0))
if o['absorb'] or o['glow'] >= 0:   # quick material A/B without editing look.py
    for nm in ('lime', 'monero'):
        fx = S.LOOK.MATERIALS[nm]['fx']
        for kind, args in fx:
            if kind == 'absorb':
                if o['absorb']:
                    args['density'] = o['absorb']
                if o['glow'] >= 0:
                    args['glow'] = o['glow']
S.new_scene()
world = o['world'] or O.BUILDERS[o['obj']][1]
S.render_settings(o['w'], o['h'], samples=o['samples'] or None, alpha=False, engine=o['engine'], motion_blur=False)
if o['vt']:
    bpy.context.scene.view_settings.view_transform = o['vt']
root = O.make(o['obj'])
root.rotation_euler = (0, 0, math.radians(o['turn']))
lo, hi, _ = S.bbox([root])
size = max((hi - lo).x, (hi - lo).y, (hi - lo).z)
FRONT = ('statement_plate', 'ledger_wall', 'glass_note')
az, el = (0.0, 2.0) if o['obj'] in FRONT and o['az'] == 25.0 else (o['az'], o['el'])
lift = 0.0
if o['obj'] in ('statement_plate', 'ledger_wall', 'glass_note'):
    lift = 0.0 if o['obj'] == 'glass_note' else -lo.z + 0.02
    root.location.z += lift
rig = S.Rig(dist=2.13, az=az, el=el, fstop=o['fstop'] if size < 0.6 else 4.0)
S.frame_to(rig, [root], fill=o['fill'])
lo, hi, _ = S.bbox([root])
scale = max(1.0, size / 0.35)
S.light_rig(world, target=tuple(rig.target), scale=scale, cards=bool(o['cards']))
if o['obj'] not in ('statement_plate', 'ledger_wall'):
    S.floor(world, size=30 * scale, back=1.2 * scale, radius=0.6 * scale)
S.lensing_plate(world, rig, dist_behind=1.5 * scale)
S.light_link([root], floor_lit=(world == 'white'))
print('BBOX', o['obj'], tuple(round(v, 3) for v in lo), tuple(round(v, 3) for v in hi), 'dist', round(rig.dist, 3))
sc = bpy.context.scene
sc.render.filepath = os.path.abspath(o['out'])
os.makedirs(os.path.dirname(sc.render.filepath), exist_ok=True)
if o['blend']:
    S.save_blend(os.path.abspath(o['blend']))
t0 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDER_TIME %s %.2f s' % (o['obj'], time.time() - t0))
