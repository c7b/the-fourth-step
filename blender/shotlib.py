"""Shot framework: pixel-exact placement, handles, manifest (SHOTLIST-3D.md contract), resumable renders.

Every shot script:
    sh = Shot('L01_cube_jump', frames=120, world='dark', alpha=True)
    ... build objects, animate (bake per frame) ...
    sh.fit(rig, [cube], px_h=300, cx=960, cy=520)
    sh.event('land', 64); sh.anchor('cube_centre', lambda: cube_centre_world)
    sh.hold(1, 30)  # frames 1..30 are identical: render one, copy the rest
    sh.run()
Args after `--`: --preview 1 (half size, out dir <id>@960) --samples N --only a-b (render a frame subset)
                 --norender 1 (manifest + blend only) --short 1 (1080x1920)
"""
import os, sys, json, math, time, shutil
import bpy
from mathutils import Vector
import studio as S

OUT = os.path.abspath(os.environ.get('RENDERS_DIR', 'out'))   # blender/render-all.sh sets renders/


class Shot:
    def __init__(self, sid, frames, world='dark', alpha=True, w=1920, h=1080, loop=False, desc='', lens=None):
        self.o = S.opts(dict(preview=0, samples=0, only='', norender=0, threshold=0.0))
        self.sid, self.frames, self.world, self.alpha, self.loop, self.desc = sid, frames, world, alpha, loop, desc
        S.new_scene()
        bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
        self.pct = 50 if self.o['preview'] else 100
        S.render_settings(w, h, samples=self.o['samples'] or None, alpha=alpha, pct=self.pct,
                          threshold=self.o['threshold'] or None)
        sc = bpy.context.scene
        sc.unit_settings.system = 'METRIC'
        sc.unit_settings.scale_length = 1.0
        sc.frame_start, sc.frame_end = 1, frames
        self.W, self.H = w * self.pct // 100, h * self.pct // 100
        self.dir = os.path.join(OUT, sid + ('@960' if self.o['preview'] else ''))
        self.events, self.anchors, self.holds, self.passes, self.extra = {}, {}, [], [], {}
        self.samples = {}   # name -> (frame, x, y) in full-size px: measured sRGB after render, saved in the manifest
        self.glare = False  # True: also write glare/####.png (bloom of emission + hot highlights; AD screens it)
        self.every = 30     # anchor sampling step in frames (1 = every frame)
        self.extra_passes = {}   # e.g. {'refl': 'refl/####.png'} rendered by a separate run into a subfolder
        self.no_manifest = False # True for a pass-only run (frames go into a subfolder of the shot)
        self.lens = lens or S.LENS

    # ------------------------------------------------------------------ placement
    def fit(self, rig, objs, px_h, cx, cy, frame=None):
        """Dolly so the objects' projected bbox is px_h tall (in full-size px), then lens-shift so its centre
        lands on (cx, cy) (full-size px). Uses the pose at `frame`."""
        sc = bpy.context.scene
        if frame is not None:
            sc.frame_set(frame)
        k = self.pct / 100.0
        lo, hi, pts = S.bbox(objs)

        def ext(d):
            rig.set(dist=d)
            pp = [S.project(p) for p in pts]
            ys = [p[1] for p in pp]
            return (max(ys) - min(ys)) / k
        a, b = 0.05, 200.0
        for _ in range(50):
            m = (a + b) / 2
            if ext(m) > px_h:
                a = m
            else:
                b = m
        rig.set(dist=(a + b) / 2)
        self.centre_on(rig, pts, cx, cy)
        return rig

    def centre_on(self, rig, pts, cx, cy):
        k = self.pct / 100.0
        cam = rig.cam.data
        big = max(self.W, self.H)
        for _ in range(3):
            pp = [S.project(p) for p in pts]
            mx = (min(p[0] for p in pp) + max(p[0] for p in pp)) / 2 / k
            my = (min(p[1] for p in pp) + max(p[1] for p in pp)) / 2 / k
            cam.shift_x += (mx - cx) / (big / k)
            cam.shift_y -= (my - cy) / (big / k)
            bpy.context.view_layer.update()

    # ------------------------------------------------------------------ contract
    def event(self, name, frame):
        self.events[name] = int(frame)

    def anchor(self, name, fn):
        """fn() -> world point (Vector) at the current frame."""
        self.anchors[name] = fn

    def hold(self, a, b, src=None):
        """Frames a..b are identical (static handle): render `src` (default b for a lead-in, a for a tail), copy."""
        self.holds.append((a, b, src if src is not None else (b if a == 1 else a)))

    def _manifest(self, every=None):
        every = every or self.every
        sc = bpy.context.scene
        fr = sorted(set([1, self.frames] + list(self.events.values()) + list(range(1, self.frames + 1, every))))
        anchors = {}
        for name, fn in self.anchors.items():
            anchors[name] = []
            for f in fr:
                sc.frame_set(f)
                p = S.project(fn())
                anchors[name].append([f, p[0], p[1]])
        sc.frame_set(1)
        m = dict(id=self.sid, fps=sc.render.fps, frames=self.frames, width=self.W, height=self.H,
                 alpha=self.alpha, loop=self.loop, lens=self.lens, events=self.events, anchors=anchors,
                 description=self.desc, view_transform=sc.view_settings.view_transform,
                 draft=bool(self.o['preview']),
                 passes=dict(({'glare': 'glare/####.png', 'glare_blend': 'screen'} if self.glare else {}),
                             **self.extra_passes), **self.extra)
        os.makedirs(self.dir, exist_ok=True)
        with open(os.path.join(self.dir, self.sid + '.json'), 'w') as f:
            json.dump(m, f, indent=1)
        return m

    def run(self):
        sc = bpy.context.scene
        os.makedirs(self.dir, exist_ok=True)
        # several render machines: a shot claimed by another one (<dir>/.claimed) is waited for, never rendered twice;
        # once its complete frames land (<dir>/.delivered) the skip-existing check below renders nothing
        claim = os.path.join(self.dir, '.claimed')
        if os.path.exists(claim):
            print('CLAIMED %s by %s: waiting for delivery' % (self.sid, open(claim).read().strip()), flush=True)
            t0 = time.time()
            while (os.path.exists(claim) and not os.path.exists(os.path.join(self.dir, '.delivered'))
                   and time.time() - t0 < 4 * 3600):
                time.sleep(20)
        if not self.no_manifest:
            self._manifest()
        S.save_blend(os.path.abspath(os.path.join('blend', self.sid + ('_pass' if self.no_manifest else '') + '.blend')))
        stamp = time.strftime('%Y%m%d-%H%M')
        S.save_blend(os.path.abspath(os.path.join('blend', 'versions', '%s__%s%s.blend' % (
            self.sid, stamp, '@960' if self.o['preview'] else ''))))
        if self.o['norender']:
            return
        r = sc.render
        r.filepath = os.path.join(self.dir, '####')
        r.use_file_extension = True
        r.use_overwrite = False
        r.use_placeholder = True
        skip = set()
        for a, b, src in self.holds:
            skip |= set(range(a, b + 1)) - {src}
        todo = [f for f in range(1, self.frames + 1) if f not in skip]
        if self.o['only']:
            a, b = (int(x) for x in self.o['only'].split('-'))
            todo = [f for f in todo if a <= f <= b]
        t0 = time.time()
        n = 0
        todo = [f for f in todo if not (os.path.exists(os.path.join(self.dir, '%04d.png' % f))
                                        and os.path.getsize(os.path.join(self.dir, '%04d.png' % f)) > 0)]
        if True:   # animation renders in contiguous runs (<= 60 frames): one session, less per-frame overhead;
            #         also the only way the File Output node (glare pass) writes
            if self.glare:
                import passes as P
                P.setup(self.dir + '/', glare=True)
            runs, cur = [], []
            for f in todo:
                if cur and (f != cur[-1] + 1 or len(cur) >= 60):
                    runs.append(cur)
                    cur = []
                cur.append(f)
            if cur:
                runs.append(cur)
            r.filepath = os.path.join(self.dir, '####')
            for run_ in runs:
                sc.frame_start, sc.frame_end = run_[0], run_[-1]
                bpy.ops.render.render(animation=True)
                n += len(run_)
                print('FRAME %s %d-%d done (%d/%d) %.1f s/frame' % (self.sid, run_[0], run_[-1], n, len(todo),
                                                                    (time.time() - t0) / max(1, n)), flush=True)
            sc.frame_start, sc.frame_end = 1, self.frames
            if self.glare:
                gdir = os.path.join(self.dir, 'glare')
                os.makedirs(gdir, exist_ok=True)
                for fn in os.listdir(self.dir):
                    if fn.startswith('pass_glare') and fn.endswith('.png'):
                        os.replace(os.path.join(self.dir, fn), os.path.join(gdir, fn[len('pass_glare'):]))
        else:
            for f in todo:
                path = os.path.join(self.dir, '%04d.png' % f)
                sc.frame_set(f)
                r.filepath = path
                bpy.ops.render.render(write_still=True)
                n += 1
                el = time.time() - t0
                print('FRAME %s %d done (%d/%d) %.1f s/frame' % (self.sid, f, n, len(todo), el / n), flush=True)
        for sub in ([''] + (['glare'] if self.glare else [])):
            d = os.path.join(self.dir, sub)
            for a, b, src in self.holds:
                sp = os.path.join(d, '%04d.png' % src)
                if not os.path.exists(sp):
                    continue
                for f in range(a, b + 1):
                    if f != src:
                        shutil.copyfile(sp, os.path.join(d, '%04d.png' % f))
        if self.samples:
            meas = {}
            for nm, (f, x, y) in self.samples.items():
                p = os.path.join(self.dir, '%04d.png' % f)
                if not os.path.exists(p):
                    continue
                img = bpy.data.images.load(p, check_existing=False)
                img.colorspace_settings.name = 'Non-Color'     # read the stored sRGB bytes as-is
                w, h = img.size
                k = self.pct / 100.0
                xi, yi = int(x * k), int(h - 1 - y * k)
                px = img.pixels[(yi * w + xi) * 4:(yi * w + xi) * 4 + 3]
                meas[nm] = [round(c * 255) for c in px]
            mp = os.path.join(self.dir, self.sid + '.json')
            m = json.load(open(mp))
            m['measured_srgb'] = meas
            if 'bg_pixel' in meas:
                m['bg_pixel'] = meas['bg_pixel']
            json.dump(m, open(mp, 'w'), indent=1)
            print('MEASURED', self.sid, meas, flush=True)
        done = all(os.path.exists(os.path.join(self.dir, '%04d.png' % f)) for f in range(1, self.frames + 1))
        print('SHOT %s %s frames=%d rendered=%d time=%.0f s' % (self.sid, 'COMPLETE' if done else 'PARTIAL',
                                                                  self.frames, n, time.time() - t0), flush=True)


def to_world(obj, local):
    bpy.context.view_layer.update()
    return obj.matrix_world @ Vector(local)
