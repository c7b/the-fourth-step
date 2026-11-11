"""The Fourth Step v4: one studio for every 3D shot.

"MACHINED LIGHT" (research/direction-v4/style-bible-v4.md): one shadow-casting key (area, upper left behind),
reflection-only rim and top cards, 60 mm lens with shallow depth of field, real scale (cube 0.20 m), one
materials library (look.py). Every shot script imports this module.

Colour: view transform Standard, so a palette colour seen straight by the camera renders as that
exact hex. Run inside Blender: Blender -b -P <script>.py -- args
"""
import bpy, bmesh, math, json, os, sys
from mathutils import Vector, Matrix, Euler, Quaternion

# ----------------------------------------------------------------------------- palette (from look.py)
import importlib
import look as LOOK
PAL = LOOK.PALETTE


def srgb2lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def col(h, a=1.0):
    if isinstance(h, (tuple, list)):      # already linear
        return (h[0], h[1], h[2], a)
    h = PAL.get(h, h).lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (srgb2lin(r), srgb2lin(g), srgb2lin(b), a)


# ----------------------------------------------------------------------------- scene / render
UNIT = LOOK.UNIT
LENS = LOOK.CAMERA['lens']
LENS_HERO = LENS_WIDE = LENS


def new_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.name = 'studio'
    return s


def pick_gpu(prefs):
    """One code path for every OS: METAL on macOS; OPTIX elsewhere, falling back to CUDA (then HIP, oneAPI) if OptiX
    sees no device. Env FOURTH_STEP_GPU forces a type (e.g. CUDA); FOURTH_STEP_GPU=CPU renders on the CPU (slow)."""
    order = {'darwin': ['METAL'], 'win32': ['OPTIX', 'CUDA']}.get(sys.platform, ['OPTIX', 'CUDA', 'HIP', 'ONEAPI'])
    if os.environ.get('FOURTH_STEP_GPU'):
        order = [os.environ['FOURTH_STEP_GPU']] + order
    for t in order:
        try:
            prefs.compute_device_type = t
        except Exception:
            continue
        prefs.refresh_devices()
        if any(d.type == t for d in prefs.devices):
            return t
    raise RuntimeError('no GPU device for %s (tried %s)' % (sys.platform, order))


def render_settings(w=1920, h=1080, samples=None, alpha=False, fps=30, engine='CYCLES', motion_blur=None,
                    threshold=None, pct=100):
    samples = samples or LOOK.RENDER['samples']
    threshold = threshold or LOOK.RENDER['threshold']
    motion_blur = LOOK.RENDER['motion_blur'] if motion_blur is None else motion_blur
    s = bpy.context.scene
    r = s.render
    r.engine = engine
    r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, pct
    r.fps, r.fps_base = fps, 1.0
    r.film_transparent = alpha
    r.use_persistent_data = True
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA' if alpha else 'RGB'
    r.image_settings.color_depth = '8'
    r.image_settings.compression = 15
    r.use_motion_blur = motion_blur
    if motion_blur:
        r.motion_blur_shutter = LOOK.RENDER['shutter']
    s.view_settings.view_transform = LOOK.RENDER['view_transform']
    s.view_settings.look = LOOK.RENDER['look']
    s.view_settings.exposure = 0.0
    s.view_settings.gamma = 1.0
    s.display_settings.display_device = 'sRGB'
    if engine == 'CYCLES':
        prefs = bpy.context.preferences.addons['cycles'].preferences
        cpu = os.environ.get('FOURTH_STEP_GPU', '').upper() == 'CPU'
        if not cpu:
            gpu_type = pick_gpu(prefs)
            for d in prefs.devices:
                d.use = (d.type == gpu_type)
            print('DEVICE', gpu_type, [d.name for d in prefs.devices if d.use], flush=True)
        c = s.cycles
        c.device = 'CPU' if cpu else 'GPU'
        c.samples = samples
        c.use_adaptive_sampling = True
        c.adaptive_threshold = threshold
        c.adaptive_min_samples = 0
        c.use_denoising = True
        try:
            c.denoiser = 'OPENIMAGEDENOISE'
        except Exception:
            pass
        for k, v in dict(denoising_use_gpu=True, denoising_input_passes='RGB_ALBEDO_NORMAL',
                         denoising_prefilter='ACCURATE', denoising_quality='HIGH').items():
            try:
                setattr(c, k, v)
            except Exception:
                pass
        c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 12, 3, 4
        c.transmission_bounces, c.transparent_max_bounces, c.volume_bounces = 12, 8, 1
        c.caustics_reflective = False
        c.caustics_refractive = False
        c.blur_glossy = 1.0
        c.sample_clamp_indirect = 6.0
        c.film_transparent_glass = False   # glass is solid in alpha; it refracts the lensing plate
        c.use_light_tree = True
        try:
            c.use_auto_tile = False
        except Exception:
            pass
    else:  # EEVEE
        e = s.eevee
        e.taa_render_samples = samples
        e.use_raytracing = True
        e.use_shadows = True
        try:
            e.use_fast_gi = True
        except Exception:
            pass
    return s


# ----------------------------------------------------------------------------- materials
_IN = {  # friendly keys -> Principled BSDF socket names (Blender 4.x/5.x)
    'base': 'Base Color', 'metal': 'Metallic', 'rough': 'Roughness', 'ior': 'IOR', 'alpha': 'Alpha',
    'sss': 'Subsurface Weight', 'sss_radius': 'Subsurface Radius', 'sss_scale': 'Subsurface Scale',
    'spec': 'Specular IOR Level', 'aniso': 'Anisotropic', 'aniso_rot': 'Anisotropic Rotation',
    'trans': 'Transmission Weight', 'coat': 'Coat Weight', 'coat_rough': 'Coat Roughness',
    'sheen': 'Sheen Weight', 'emit': 'Emission Color', 'emit_k': 'Emission Strength', 'coat_ior': 'Coat IOR',
}
MATS = {}


_OUT = [None]   # the output node the current recipe writes into (see recipe_into)


def _apply(nt, p, out, shadow_tint=None, **kw):
    _OUT[0] = out
    for k, v in kw.items():
        sock = p.inputs.get(_IN.get(k, k))
        if sock is None:
            print('WARN no socket', k)
            continue
        if isinstance(v, str) or (sock.type == 'RGBA' and isinstance(v, (tuple, list)) and len(v) == 3):
            v = col(v)
        sock.default_value = v
    if shadow_tint:   # glass casts a coloured shadow, not a black one (Is Shadow Ray -> tinted transparent)
        c, k = shadow_tint
        lp = nt.nodes.new('ShaderNodeLightPath')
        tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        cc = col(c)
        tr.inputs['Color'].default_value = (cc[0] * k + (1 - k) * 0.05, cc[1] * k + (1 - k) * 0.05,
                                            cc[2] * k + (1 - k) * 0.05, 1)
        mx = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(lp.outputs['Is Shadow Ray'], mx.inputs['Fac'])
        nt.links.new(p.outputs['BSDF'], mx.inputs[1])
        nt.links.new(tr.outputs['BSDF'], mx.inputs[2])
        nt.links.new(mx.outputs['Shader'], out.inputs['Surface'])


def _principled(name, shadow_tint=None, **kw):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    _apply(nt, p, out, shadow_tint, **kw)
    return m, nt, p


def recipe_into(nt, name):
    """Build look.MATERIALS[name] inside an existing node tree; returns (surface socket, volume socket or None).
    Used to blend two looks in one material (L12 frost sweep)."""
    recipe = dict(LOOK.MATERIALS[name])
    fx = recipe.pop('fx', [])
    fake = nt.nodes.new('ShaderNodeOutputMaterial')
    fake.is_active_output = False
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs['BSDF'], fake.inputs['Surface'])
    _apply(nt, p, fake, **recipe)
    for kind, args in fx:
        FX[kind](nt, p, **args)
    surf = fake.inputs['Surface'].links[0].from_socket
    vol = fake.inputs['Volume'].links[0].from_socket if fake.inputs['Volume'].is_linked else None
    nt.nodes.remove(fake)
    return surf, vol


def _fx_brushed(nt, p, rough=0.3, var=0.05, k=0.06, scale=(1.0, 260.0, 1.0)):
    """Brushed-metal lines: a noise stretched along one axis drives bump and a little roughness."""
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = scale
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 6.0
    nz.inputs['Detail'].default_value = 8.0
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
    _bump(nt, p, nz.outputs['Fac'], k)
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = rough - var
    mr.inputs['To Max'].default_value = rough + var
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], p.inputs['Roughness'])


def _bump(nt, p, height, k):
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = k
    bump.inputs['Distance'].default_value = 0.002
    nt.links.new(height, bump.inputs['Height'])
    prev = p.inputs['Normal'].links[0].from_socket if p.inputs['Normal'].is_linked else None
    if prev is not None:
        nt.links.new(prev, bump.inputs['Normal'])
    nt.links.new(bump.outputs['Normal'], p.inputs['Normal'])


def _fx_grain(nt, p, scale=180.0, k=0.05):
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 4.0
    _bump(nt, p, nz.outputs['Fac'], k)


def _emit_add(nt, p, fac_socket, color, k):
    """Add emission (color * k * fac) on top of the BSDF via the Principled emission inputs."""
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = k
    nt.links.new(fac_socket, mul.inputs[0])
    if p.inputs['Emission Strength'].is_linked:   # sum with a previous effect
        add = nt.nodes.new('ShaderNodeMath')
        add.operation = 'ADD'
        nt.links.new(p.inputs['Emission Strength'].links[0].from_socket, add.inputs[0])
        nt.links.new(mul.outputs[0], add.inputs[1])
        nt.links.new(add.outputs[0], p.inputs['Emission Strength'])
    else:
        base_k = p.inputs['Emission Strength'].default_value
        add = nt.nodes.new('ShaderNodeMath')
        add.operation = 'ADD'
        add.inputs[1].default_value = base_k
        nt.links.new(mul.outputs[0], add.inputs[0])
        nt.links.new(add.outputs[0], p.inputs['Emission Strength'])
    p.inputs['Emission Color'].default_value = col(color)


def _fx_edge_glow(nt, p, color='lime', k=6.0, width=0.012, sharp=6.0):
    """A thin glowing edge (hidebox frames): where the Bevel-node normal departs from the true normal."""
    bv = nt.nodes.new('ShaderNodeBevel')
    bv.samples = 6
    bv.inputs['Radius'].default_value = width
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    dot = nt.nodes.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    nt.links.new(bv.outputs['Normal'], dot.inputs[0])
    nt.links.new(geo.outputs['Normal'], dot.inputs[1])
    inv = nt.nodes.new('ShaderNodeMath')
    inv.operation = 'SUBTRACT'
    inv.inputs[0].default_value = 1.0
    nt.links.new(dot.outputs['Value'], inv.inputs[1])
    pw = nt.nodes.new('ShaderNodeMath')
    pw.operation = 'MULTIPLY'
    pw.inputs[1].default_value = sharp * 10
    pw.use_clamp = True
    nt.links.new(inv.outputs[0], pw.inputs[0])
    _emit_add(nt, p, pw.outputs[0], color, k)


def _fx_inner_glow(nt, p, color='lime', k=1.5, power=2.0):
    """Jelly glass: glow strongest at grazing angles (the edges of a tile light up from inside)."""
    lw = nt.nodes.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.5
    pw = nt.nodes.new('ShaderNodeMath')
    pw.operation = 'POWER'
    pw.inputs[1].default_value = power
    nt.links.new(lw.outputs['Facing'], pw.inputs[0])
    _emit_add(nt, p, pw.outputs[0], color, k)


def _fx_absorb(nt, p, color='lime', density=2.0, glow=0.0, glow_color=None):
    """Thick glass: colour deepens with thickness (absorption). glow > 0 adds a volumetric emission:
    a soft glowing heart that is brightest where the glass is thickest (the jelly 'inner light')."""
    out = _OUT[0] or next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    va = nt.nodes.new('ShaderNodeVolumeAbsorption')
    va.inputs['Color'].default_value = col(color)
    va.inputs['Density'].default_value = density
    vol = va.outputs['Volume']
    if glow > 0:
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = col(glow_color or color)
        em.inputs['Strength'].default_value = glow
        ad = nt.nodes.new('ShaderNodeAddShader')
        nt.links.new(vol, ad.inputs[0])
        nt.links.new(em.outputs['Emission'], ad.inputs[1])
        vol = ad.outputs['Shader']
    nt.links.new(vol, out.inputs['Volume'])


def _fx_rough_noise(nt, p, rough=0.3, var=0.05, scale=4.0):
    """Real surfaces are never uniformly rough: a large-scale noise drives roughness +/- var."""
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 3.0
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = rough - var
    mr.inputs['To Max'].default_value = rough + var
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], p.inputs['Roughness'])


def _fx_tangent_radial(nt, p):
    """Lathe-turned rings: anisotropy tangent radial around the object's Z."""
    tg = nt.nodes.new('ShaderNodeTangent')
    tg.direction_type = 'RADIAL'
    tg.axis = 'Z'
    nt.links.new(tg.outputs['Tangent'], p.inputs['Tangent'])


def _fx_edge_mask(nt, p, color='lime', k=6.0, power=1.6, nz=0.2):
    """Emission = k * facing^power * (world normal Z < nz): bevels glow where they turn away and face down."""
    lw = nt.nodes.new('ShaderNodeLayerWeight')
    lw.inputs['Blend'].default_value = 0.5
    pw = nt.nodes.new('ShaderNodeMath')
    pw.operation = 'POWER'
    pw.inputs[1].default_value = power
    nt.links.new(lw.outputs['Facing'], pw.inputs[0])
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Normal'], sep.inputs[0])
    lt = nt.nodes.new('ShaderNodeMath')
    lt.operation = 'LESS_THAN'
    lt.inputs[1].default_value = nz
    nt.links.new(sep.outputs['Z'], lt.inputs[0])
    m = nt.nodes.new('ShaderNodeMath')
    m.operation = 'MULTIPLY'
    nt.links.new(pw.outputs[0], m.inputs[0])
    nt.links.new(lt.outputs[0], m.inputs[1])
    _emit_add(nt, p, m.outputs[0], color, k)


FX = {'edge_mask': _fx_edge_mask, 'rough_noise': _fx_rough_noise, 'tangent_radial': _fx_tangent_radial, 'brushed': _fx_brushed, 'grain': _fx_grain, 'edge_glow': _fx_edge_glow, 'inner_glow': _fx_inner_glow,
      'absorb': _fx_absorb}


def mat(name):
    """The materials library (recipes in look.py). Same role -> same material everywhere in the film."""
    if name in MATS:
        return MATS[name]
    recipe = dict(LOOK.MATERIALS[name])
    fx = recipe.pop('fx', [])
    m, nt, p = _principled(name, **recipe)
    for kind, args in fx:
        FX[kind](nt, p, **args)
    _OUT[0] = None
    MATS[name] = m
    return m


def assign(obj, m):
    if isinstance(m, str):
        m = mat(m)
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj


# ----------------------------------------------------------------------------- lights & world
def _aim(obj, target=(0, 0, 0)):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def _sph(az, el, dist, target=(0, 0, 0)):
    """Point around target. az: degrees from the camera direction (-Y), + toward camera-LEFT (-X)."""
    az, el = math.radians(az), math.radians(el)
    return Vector(target) + Vector((-math.sin(az) * math.cos(el) * dist, -math.cos(az) * math.cos(el) * dist,
                                    math.sin(el) * dist))


def _area(coll, name, size, power, loc, target, color=(1, 1, 1), spread=None, diffuse=True, shadow=True):
    ld = bpy.data.lights.new(name, 'AREA')
    if isinstance(size, (tuple, list)):
        ld.shape = 'RECTANGLE'
        ld.size, ld.size_y = size
    else:
        ld.shape = 'SQUARE'
        ld.size = size
    ld.energy = power
    ld.color = color
    if spread is not None:
        ld.spread = math.radians(spread)
    try:
        ld.use_shadow = shadow
    except Exception:
        pass
    o = bpy.data.objects.new(name, ld)
    coll.objects.link(o)
    o.location = loc
    _aim(o, target)
    o.visible_camera = False
    o.visible_diffuse = diffuse
    return o


def light_rig(world='white', target=(0, 0, 0.1), scale=1.0, cards=None, key_power=1.0, neg_fill=None):
    """The ONE rig (look.RIG): a soft area KEY upper-left-behind (the only shadow), a reflection-only
    RIM strip and TOP sheen (diffuse off, no shadow), a black negative fill on the white look.
    `scale` multiplies distances and sizes (power by scale^2) for big subjects (tower, ring, bank)."""
    R = LOOK.RIG
    W = R[world]
    coll = bpy.data.collections.new('rig_lights')
    bpy.context.scene.collection.children.link(coll)
    t = Vector(target)
    k = R['key']
    key = _area(coll, 'KEY', k['size'] * scale, k['power'] * scale * scale * key_power * W.get('key_k', 1.0),
                _sph(k['az'], k['el'], k['dist'] * scale, t), t, k.get('color', (1, 1, 1)), k.get('spread'))
    use_cards = W.get('cards', True) if cards is None else cards
    if use_cards:
        r = R['rim']
        rs = r['size']
        _area(coll, 'RIM', (rs[0] * scale, rs[1] * scale), r['power'] * scale * scale,
              _sph(r['az'], r['el'], r['dist'] * scale, t), t, diffuse=False, shadow=False)
        tp = R['top']
        _area(coll, 'TOP', tp['size'] * scale, tp['power'] * scale * scale, t + Vector((0, 0, tp['dist'] * scale)), t,
              diffuse=False, shadow=False)
    if (W.get('neg_fill') if neg_fill is None else neg_fill):
        bpy.ops.mesh.primitive_plane_add(size=1, location=_sph(-80, 10, 1.2 * scale, t))
        nf = bpy.context.active_object
        nf.name = 'NEG_FILL'
        nf.scale = (1.0 * scale, 1.5 * scale, 1)
        d = t - nf.location
        nf.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        nf.visible_camera = False
        nf.visible_shadow = False
        assign(nf, _black())
    # world: the camera sees the exact palette colour; light/reflections get a dim fill
    w = bpy.data.worlds.new('world_' + world)
    bpy.context.scene.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputWorld')
    lp = nt.nodes.new('ShaderNodeLightPath')
    bg_cam = nt.nodes.new('ShaderNodeBackground')
    bg_cam.inputs['Color'].default_value = col(W['world_cam'])
    bg_cam.inputs['Strength'].default_value = 1.0
    bg_fill = nt.nodes.new('ShaderNodeBackground')
    bg_fill.inputs['Color'].default_value = col(W['world_fill'])
    bg_fill.inputs['Strength'].default_value = W['fill_k']
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
    nt.links.new(bg_fill.outputs['Background'], mix.inputs[1])
    nt.links.new(bg_cam.outputs['Background'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])
    return coll


def light_link(subjects, lights=('KEY', 'RIM', 'TOP'), floor_lit=False):
    """Only the subjects receive the rig's lights (Cycles light linking): the glossy black floor then shows
    object reflections and coloured spill, never the softboxes. floor_lit=True keeps the key on the floor
    (white world / shadow catcher needs the key)."""
    coll = bpy.data.collections.get('LIT') or bpy.data.collections.new('LIT')
    objs = []
    for o in subjects:
        objs += [o] + list(o.children_recursive)
    for o in objs:
        if o.type in ('MESH', 'EMPTY') and o.name not in coll.objects:
            coll.objects.link(o)
    if floor_lit and 'FLOOR' in bpy.data.objects and 'FLOOR' not in coll.objects:
        coll.objects.link(bpy.data.objects['FLOOR'])
    for nm in lights:
        L = bpy.data.objects.get(nm)
        if L is None:
            continue
        if nm == 'KEY' or not floor_lit:
            L.light_linking.receiver_collection = coll
        else:   # cards never touch the floor
            c2 = bpy.data.collections.get('LIT_CARDS') or bpy.data.collections.new('LIT_CARDS')
            for o in objs:
                if o.type == 'MESH' and o.name not in c2.objects:
                    c2.objects.link(o)
            L.light_linking.receiver_collection = c2
    return coll


def _black():
    if 'neg_black' in MATS:
        return MATS['neg_black']
    m, nt, p = _principled('neg_black', base=(0, 0, 0), rough=1.0, spec=0.0)
    MATS['neg_black'] = m
    return m


TEXTURES = os.path.abspath('textures')     # run Blender from the repo root (blender/render-all.sh does)


def lensing_plate(world, rig, dist_behind=3.0, size=40.0):
    """Glass needs something to bend (bible 2.8): a plane behind the subject carrying the AD's own 2D field
    (textures/bg-ink.png / bg-cloud.png, vertical variants for Shorts), parented to the camera and sized to the
    frustum so it stays screen-aligned like the film's background. Invisible to the camera; seen only through
    transmission/reflection. Falls back to a flat palette colour if the texture is missing."""
    W = LOOK.RIG[world]
    sc = bpy.context.scene
    vert = sc.render.resolution_y > sc.render.resolution_x
    fn = os.path.join(TEXTURES, 'bg-%s%s.png' % ('ink' if world == 'dark' else 'cloud', '-vertical' if vert else ''))
    nm = 'lens_' + world + ('_v' if vert else '')
    if nm not in MATS:
        m = bpy.data.materials.new(nm)
        nt = m.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Strength'].default_value = 1.0
        if os.path.exists(fn):
            tx = nt.nodes.new('ShaderNodeTexImage')
            tx.image = bpy.data.images.load(fn)
            tx.extension = 'EXTEND'
            nt.links.new(tx.outputs['Color'], em.inputs['Color'])
        else:
            print('WARN lensing texture missing', fn)
            em.inputs['Color'].default_value = col(W['lens_plate'])
        nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
        MATS[nm] = m
    bpy.context.view_layer.update()
    cam = rig.cam
    D = (rig.target - cam.matrix_world.translation).length + dist_behind
    cd = cam.data
    wide = D * cd.sensor_width / cd.lens
    rx, ry = sc.render.resolution_x, sc.render.resolution_y
    fw, fh = (wide, wide * ry / rx) if rx >= ry else (wide * rx / ry, wide)
    big = max(fw, fh)
    bpy.ops.mesh.primitive_plane_add(size=1.0)
    pl = bpy.context.active_object
    pl.name = 'LENS_PLATE'
    pl.parent = cam
    pl.location = (cd.shift_x * big, cd.shift_y * big, -D)
    pl.rotation_euler = (0, 0, 0)
    pl.scale = (fw * 1.02, fh * 1.02, 1)
    pl.visible_camera = False
    pl.visible_diffuse = False
    pl.visible_shadow = False
    assign(pl, MATS[nm])
    return pl


def floor(world='white', size=30.0, catcher=False, z=0.0, cyc=True, back=4.0, radius=1.5):
    """Seamless floor. Dark: a curved cyclorama (no horizon). catcher=True: Cycles shadow catcher plane
    (alpha shots on the white world: only the contact shadow lands in the alpha)."""
    if catcher or not cyc:
        bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
        f = bpy.context.active_object
    else:
        bm = bmesh.new()
        prof = [(-size / 2, 0.0)]
        prof += [(back - radius + radius * math.sin(math.pi / 2 * i / 12), radius - radius * math.cos(math.pi / 2 * i / 12))
                 for i in range(13)]
        prof += [(back, size * 0.6)]
        rows = []
        for (y, zz) in prof:
            rows.append([bm.verts.new((x, y, zz + z)) for x in (-size / 2, size / 2)])
        for r0, r1 in zip(rows, rows[1:]):
            bm.faces.new((r0[0], r0[1], r1[1], r1[0]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        f = mesh_from_bm('FLOOR', bm, None, None)
        for poly in f.data.polygons:
            if poly.normal.z < 0:
                poly.flip()
    f.name = 'FLOOR'
    assign(f, LOOK.RIG[world]['floor'])
    if catcher:
        f.is_shadow_catcher = True
    return f


# ----------------------------------------------------------------------------- camera
class Rig:
    """Camera on a pivot: pivot at the target; yaw = azimuth (+ = camera moves right), pitch = elevation."""

    def __init__(self, target=(0, 0, 0.1), dist=2.13, az=0.0, el=10.0, lens=None, fstop=None, roll=0.0):
        lens = lens or LENS
        fstop = LOOK.CAMERA['fstop'] if fstop is None else fstop
        self.pivot = bpy.data.objects.new('CAM_PIVOT', None)
        bpy.context.scene.collection.objects.link(self.pivot)
        cd = bpy.data.cameras.new('CAM')
        cd.lens = lens
        cd.sensor_width = 36.0
        cd.sensor_fit = 'AUTO'   # 36 mm along the long side (Shorts = rotated full-frame body)
        cd.clip_start, cd.clip_end = 0.01, 200
        cd.dof.use_dof = bool(fstop)
        if fstop:
            cd.dof.aperture_fstop = fstop
            cd.dof.aperture_blades = 7
            cd.dof.aperture_rotation = math.radians(12)
        self.cam = bpy.data.objects.new('CAM', cd)
        bpy.context.scene.collection.objects.link(self.cam)
        self.cam.parent = self.pivot
        self.focus = bpy.data.objects.new('FOCUS', None)
        bpy.context.scene.collection.objects.link(self.focus)
        cd.dof.focus_object = self.focus
        bpy.context.scene.camera = self.cam
        self.set(target, dist, az, el, roll)

    def set(self, target=None, dist=None, az=None, el=None, roll=None, lens=None, focus=None):
        if target is not None:
            self.target = Vector(target)
        if dist is not None:
            self.dist = dist
        if az is not None:
            self.az = az
        if el is not None:
            self.el = el
        if roll is not None:
            self.roll = roll
        if lens is not None:
            self.cam.data.lens = lens
        self.pivot.location = self.target
        self.pivot.rotation_euler = Euler((math.radians(-self.el), 0.0, math.radians(self.az)), 'ZXY')
        self.cam.location = (0.0, -self.dist, 0.0)
        self.cam.rotation_euler = Euler((math.radians(90), math.radians(self.roll), 0.0), 'XYZ')
        self.focus.location = Vector(focus) if focus is not None else self.target

    def key(self, frame):
        for o, paths in ((self.pivot, ('location', 'rotation_euler')), (self.cam, ('location', 'rotation_euler')),
                         (self.focus, ('location',))):
            for p in paths:
                o.keyframe_insert(p, frame=frame)
        self.cam.data.keyframe_insert('lens', frame=frame)

    def world_pos(self):
        bpy.context.view_layer.update()
        return self.cam.matrix_world.translation.copy()


def project(point, scene=None):
    """World point -> pixel (x, y) in the render, y down."""
    from bpy_extras.object_utils import world_to_camera_view
    scene = scene or bpy.context.scene
    bpy.context.view_layer.update()
    v = world_to_camera_view(scene, scene.camera, Vector(point))
    W = scene.render.resolution_x * scene.render.resolution_percentage / 100
    H = scene.render.resolution_y * scene.render.resolution_percentage / 100
    return [round(v.x * W, 1), round((1 - v.y) * H, 1)]


def bbox(objs):
    pts = []
    bpy.context.view_layer.update()
    for o in objs:
        if o.type == 'EMPTY':
            for c in o.children_recursive:
                if c.type == 'MESH' and not c.get('no_bbox'):
                    pts += [c.matrix_world @ Vector(b) for b in c.bound_box]
        elif o.type == 'MESH':
            pts += [o.matrix_world @ Vector(b) for b in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi, pts


def frame_to(rig, objs, fill=0.55, center_z=None):
    """Distance so the objects' projected height is `fill` of the frame height (and width fits)."""
    lo, hi, pts = bbox(objs)
    c = (lo + hi) / 2
    if center_z is not None:
        c.z = center_z
    rig.set(target=c)
    scene = bpy.context.scene
    W, H = scene.render.resolution_x, scene.render.resolution_y

    def extent(d):
        rig.set(dist=d)
        pp = [project(p) for p in pts]
        xs, ys = [p[0] for p in pp], [p[1] for p in pp]
        return max((max(ys) - min(ys)) / H, (max(xs) - min(xs)) / W * 0.62)   # width may reach fill/0.62

    a, b = 0.5, 400.0
    for _ in range(40):
        m = (a + b) / 2
        if extent(m) > fill:
            a = m
        else:
            b = m
    rig.set(dist=(a + b) / 2)
    return rig


# ----------------------------------------------------------------------------- geometry helpers
def link(obj, parent=None, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    if parent is not None:
        obj.parent = parent
    return obj


def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.3
    link(e, parent)
    e.location = loc
    return e


def mesh_from_bm(name, bm, material=None, parent=None, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o, parent)
    if smooth:
        for poly in me.polygons:
            poly.use_smooth = True
    if material:
        assign(o, material)
    return o


def bevel(o, width=0.05, segments=5, angle=40, harden=True, profile=0.5):
    m = o.modifiers.new('bevel', 'BEVEL')
    m.width = width
    m.segments = segments
    m.limit_method = 'ANGLE'
    m.angle_limit = math.radians(angle)
    m.profile = profile
    try:
        m.harden_normals = harden
    except Exception:
        pass
    return m


def edge_glow(o, material='edge_lime'):
    """hidebox edge: the Bevel modifier's new faces go to material slot 1 (a lime-glowing edge material)."""
    if len(o.data.materials) < 2:
        o.data.materials.append(mat(material))
    for m in o.modifiers:
        if m.type == 'BEVEL':
            m.material = 1
    return o


def box(name, size=(1, 1, 1), loc=(0, 0, 0), material=None, parent=None, bev=0.05, seg=5, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    o = mesh_from_bm(name, bm, material, parent)
    o.location = loc
    o.rotation_euler = rot
    if bev:
        bevel(o, min(bev, min(size) * 0.49), seg)
    return o


def cyl(name, r=0.5, h=1.0, loc=(0, 0, 0), material=None, parent=None, verts=64, bev=0.02, seg=4, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r, depth=h)
    o = mesh_from_bm(name, bm, material, parent)
    o.location = loc
    o.rotation_euler = rot
    if bev:
        bevel(o, min(bev, h * 0.45, r * 0.45), seg, angle=50)
    return o


def lathe(name, profile, material=None, parent=None, verts=64, loc=(0, 0, 0), rot=(0, 0, 0)):
    """Revolve a (r, z) profile (bottom to top) around Z; closed at the axis ends."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        ring = []
        for i in range(verts):
            a = 2 * math.pi * i / verts
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for ra, rb in zip(rings, rings[1:]):
        for i in range(verts):
            j = (i + 1) % verts
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_from_bm(name, bm, material, parent)
    o.location = loc
    o.rotation_euler = rot
    return o


def extrude_poly(name, pts2d, depth, material=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), bev=0.0, seg=3):
    """Extrude a 2D polygon (in XZ plane, facing -Y) by depth along Y (centred)."""
    bm = bmesh.new()
    front = [bm.verts.new((x, -depth / 2, z)) for x, z in pts2d]
    back = [bm.verts.new((x, depth / 2, z)) for x, z in pts2d]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    n = len(pts2d)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[j], front[i], back[i], back[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_from_bm(name, bm, material, parent)
    o.location = loc
    o.rotation_euler = rot
    if bev:
        bevel(o, bev, seg, angle=30)
    return o


def sweep_tube(name, path_pts, radius, material=None, parent=None, sides=24):
    """A round tube along a polyline of 3D points (used for arrows, shackles)."""
    bm = bmesh.new()
    rings = []
    n = len(path_pts)
    for i, p in enumerate(path_pts):
        p = Vector(p)
        t = (Vector(path_pts[min(i + 1, n - 1)]) - Vector(path_pts[max(i - 1, 0)])).normalized()
        up = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        u = t.cross(up).normalized()
        v = t.cross(u).normalized()
        ring = [bm.verts.new(p + (u * math.cos(2 * math.pi * k / sides) + v * math.sin(2 * math.pi * k / sides)) * radius)
                for k in range(sides)]
        rings.append(ring)
    for ra, rb in zip(rings, rings[1:]):
        for k in range(sides):
            j = (k + 1) % sides
            bm.faces.new((ra[k], ra[j], rb[j], rb[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_from_bm(name, bm, material, parent)


# ----------------------------------------------------------------------------- motion (the 2D film's curves)
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, a, b):
    return clamp((t - a) / (b - a)) if b != a else (1.0 if t >= b else 0.0)


def expo_out(x):
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def expo_in_out(x):
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    return 2 ** (20 * x - 10) / 2 if x < 0.5 else (2 - 2 ** (-20 * x + 10)) / 2


def cubic_in_out(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def quart_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 4


def approach(t, tau):
    """Exponential approach 0 -> 1 (the 2D film's V3.approach): fast, then slow for longer."""
    return 0.0 if t <= 0 else 1 - math.exp(-t / tau)


def spring(t, freq=2.2, damp=5.5):
    """Damped settle 0 -> 1 with a small overshoot (weight)."""
    if t <= 0:
        return 0.0
    return 1 - math.exp(-damp * t) * math.cos(2 * math.pi * freq * t)


def lerp(a, b, k):
    return a + (b - a) * k


def vlerp(a, b, k):
    return Vector(a).lerp(Vector(b), k)


def bake(objs, frames, fn):
    """Per-frame keyframes: fn(frame, t_seconds) sets transforms; we key loc/rot/scale of objs."""
    fps = bpy.context.scene.render.fps
    for f in frames:
        fn(f, f / fps)
        for o in objs:
            o.keyframe_insert('location', frame=f)
            o.keyframe_insert('rotation_euler', frame=f)
            o.keyframe_insert('scale', frame=f)
    for o in objs:
        ad = o.animation_data
        if ad and ad.action:
            _linear(ad.action)


def _linear(action):
    try:
        curves = action.fcurves
    except AttributeError:
        curves = []
    try:  # Blender 4.4+/5.x layered actions
        curves = [fc for layer in action.layers for strip in layer.strips for cb in strip.channelbags for fc in cb.fcurves]
    except Exception:
        pass
    for fc in curves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


# ----------------------------------------------------------------------------- io
def argv():
    a = sys.argv
    return a[a.index('--') + 1:] if '--' in a else []


def opts(defaults):
    """--key value pairs after '--'."""
    out = dict(defaults)
    a = argv()
    i = 0
    while i < len(a):
        if a[i].startswith('--'):
            k = a[i][2:].replace('-', '_')
            v = a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith('--') else '1'
            d = defaults.get(k)
            out[k] = type(d)(v) if d is not None and not isinstance(d, bool) else (v not in ('0', 'false') if isinstance(d, bool) else v)
            i += 2 if v != '1' or (i + 1 < len(a) and a[i + 1] == '1') else 1
        else:
            i += 1
    return out


def write_manifest(path, **kw):
    with open(path, 'w') as f:
        json.dump(kw, f, indent=1)


def save_blend(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
