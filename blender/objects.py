"""Every object in The Fourth Step v4, built from code with the studio's materials.

Each builder returns a root EMPTY whose origin is the object's floor contact (bottom centre), so
shots can drop, hop and settle it. Units: the "you" cube is 1.0 on a side.
No text anywhere: labels are overlaid in 2D by the art agent.
"""
import bpy, bmesh, math
from mathutils import Vector, Matrix, Euler
import studio as S
from studio import box, cyl, lathe, extrude_poly, sweep_tube, empty, mat, assign, bevel


def _root(name, loc=(0, 0, 0)):
    return empty(name, loc)


def rounded_rect(w, h, r, n=8):
    """Rounded rectangle polygon in the XZ plane, centred."""
    pts = []
    for cx, cz, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180),
                       (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


# ----------------------------------------------------------------------------- the cubes
def core(name, size, z, material, parent):
    """The inner light of a jelly object: seen through the shell as a soft heart; casts no shadow."""
    c = box(name, (size, size, size), (0, 0, z), material, parent, bev=0.18 * size, seg=4)
    c.visible_shadow = False
    return c


def you_cube(size=1.0, name='YOU'):
    """'You': lime jelly glass, 6% bevel, a glowing core at 60%."""
    root = _root(name)
    box(name + '_body', (size, size, size), (0, 0, size / 2), 'lime', root, bev=0.06 * size, seg=6)
    return root


def monero_cube(size=1.0, name='XMR'):
    """Monero's private block: the 'you' cube frosted over in Monero orange (same geometry)."""
    root = _root(name)
    box(name + '_body', (size, size, size), (0, 0, size / 2), 'monero_frost', root, bev=0.06 * size, seg=6)
    return root


def steel_cube(size=1.0, name='STEEL'):
    root = _root(name)
    box(name + '_body', (size, size, size), (0, 0, size / 2), 'steel', root, bev=0.06 * size, seg=5)
    return root


# ----------------------------------------------------------------------------- money
def coin(r=0.5, h=0.12, material='gold', name='COIN', upright=False, rim=0.06):
    root = _root(name)
    prof = [(0.0005, 0.016), (r * 0.80, 0.016), (r * 0.83, 0.0), (r * 0.97, 0.0), (r, 0.012), (r, h - 0.012),
            (r * 0.97, h), (r * 0.83, h), (r * 0.80, h - 0.016), (0.0005, h - 0.016)]
    c = lathe(name + '_disc', prof, material, root, verts=96)
    bevel(c, 0.004, 2, angle=25)
    if upright:   # standing on its edge, face toward the camera (-Y)
        c.rotation_euler = (math.radians(90), 0, 0)
        c.location = (0, h / 2, r)
    return root


def coin_stack(n=5, r=0.5, h=0.12, name='STACK', jitter=0.03, seed=3):
    import random
    rnd = random.Random(seed)
    root = _root(name)
    coins = []
    for i in range(n):
        c = coin(r, h, 'gold', '%s_c%d' % (name, i))
        c.parent = root
        c.location = (rnd.uniform(-jitter, jitter), rnd.uniform(-jitter, jitter), i * h * 1.002)
        c.rotation_euler = (0, 0, rnd.uniform(0, 6.28))
        coins.append(c)
    root['coins'] = [c.name for c in coins]
    return root


# ----------------------------------------------------------------------------- the bank
def bank(name='BANK'):
    """Unmistakable classical bank: three steps, six fluted columns, entablature, pediment."""
    root = _root(name)
    st = 'stone'
    # stylobate: three steps
    z = 0.0
    for i, (w, d) in enumerate(((5.6, 3.1), (5.25, 2.85), (4.9, 2.6))):
        box('%s_step%d' % (name, i), (w, d, 0.17), (0, 0, z + 0.085), st, root, bev=0.018, seg=3)
        z += 0.17
    base_z = z  # 0.51
    col_h = 2.55
    # cella (inner wall), set back so the columns stand in front of a shaded wall
    box(name + '_cella', (4.25, 1.55, col_h), (0, 0.42, base_z + col_h / 2), 'stone_shade', root, bev=0.02, seg=2)
    # columns: fluted shaft with entasis, torus base, echinus + abacus capital
    xs = [-1.85, -1.05, 1.05, 1.85]   # four columns, a wide central bay for the door
    flutes = 20
    for i, x in enumerate(xs):
        for y in (-0.92,):
            cname = '%s_col%d' % (name, i)
            # shaft profile with flutes (alternating radius around the circle) built as a lathe of rings
            bm = bmesh.new()
            rings = []
            nz = 14
            verts = flutes * 4
            for k in range(nz + 1):
                t = k / nz
                zz = base_z + 0.12 + t * (col_h - 0.27)
                rr = 0.23 * (1 - 0.13 * t ** 1.4)
                ring = []
                for j in range(verts):
                    a = 2 * math.pi * j / verts
                    groove = 0.5 + 0.5 * math.cos(a * flutes)  # 1 at ridge, 0 in the flute
                    rad = rr * (0.93 + 0.07 * groove ** 0.6)
                    ring.append(bm.verts.new((x + rad * math.cos(a), y + rad * math.sin(a), zz)))
                rings.append(ring)
            for ra, rb in zip(rings, rings[1:]):
                for j in range(verts):
                    jj = (j + 1) % verts
                    bm.faces.new((ra[j], ra[jj], rb[jj], rb[j]))
            bm.faces.new(list(reversed(rings[0])))
            bm.faces.new(rings[-1])
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            S.mesh_from_bm(cname, bm, st, root)
            # base: plinth + torus-like disc
            box(cname + '_plinth', (0.5, 0.5, 0.06), (x, y, base_z + 0.03), st, root, bev=0.01, seg=2)
            lathe(cname + '_torus', [(0.0005, base_z + 0.06), (0.24, base_z + 0.06), (0.255, base_z + 0.09),
                                     (0.24, base_z + 0.12), (0.0005, base_z + 0.12)], st, root, verts=48,
                  loc=(x, y, 0))
            top = base_z + col_h - 0.15
            lathe(cname + '_echinus', [(0.0005, top), (0.185, top), (0.215, top + 0.04), (0.255, top + 0.08),
                                       (0.0005, top + 0.08)], st, root, verts=48, loc=(x, y, 0))
            box(cname + '_abacus', (0.56, 0.56, 0.07), (x, y, top + 0.115), st, root, bev=0.01, seg=2)
    # the heavy door, centred in the cella wall, in a stone surround
    cf = 0.42 - 1.55 / 2
    dw, dh = 1.05, 1.85
    box(name + '_door', (dw, 0.08, dh), (0, cf - 0.03, base_z + dh / 2), 'door', root, bev=0.012, seg=2)
    for i in range(2):
        box('%s_doorleaf%d' % (name, i), (dw / 2 - 0.09, 0.03, dh - 0.22),
            ((i - 0.5) * dw / 2, cf - 0.08, base_z + dh / 2 - 0.02), 'door', root, bev=0.01, seg=2)
    for sx in (-1, 1):
        box('%s_jamb%d' % (name, (sx + 1) // 2), (0.14, 0.14, dh + 0.1), (sx * (dw / 2 + 0.07), cf - 0.04,
            base_z + (dh + 0.1) / 2), st, root, bev=0.012, seg=2)
    box(name + '_lintel', (dw + 0.46, 0.18, 0.2), (0, cf - 0.06, base_z + dh + 0.18), st, root, bev=0.015, seg=2)
    ent_z = base_z + col_h
    # entablature: architrave, frieze, cornice
    box(name + '_architrave', (4.95, 2.45, 0.3), (0, -0.05, ent_z + 0.15), st, root, bev=0.015, seg=2)
    box(name + '_frieze', (4.85, 2.4, 0.26), (0, -0.05, ent_z + 0.43), st, root, bev=0.015, seg=2)
    box(name + '_cornice', (5.3, 2.75, 0.13), (0, -0.05, ent_z + 0.625), st, root, bev=0.02, seg=3)
    ped_z = ent_z + 0.69
    # pediment: recessed tympanum + raking cornices
    B, P = 2.62, 0.82
    extrude_poly(name + '_tympanum', [(-B + 0.12, 0.0), (B - 0.12, 0.0), (0.0, P - 0.06)], 2.5, 'stone_shade', root,
                 loc=(0, 0.05, ped_z))
    th = math.atan2(P, B)
    L = math.hypot(B, P) + 0.12
    for sgn in (-1, 1):   # left rake rises to the apex (rot -th), right one falls from it (rot +th)
        bx = box('%s_rake%d' % (name, (sgn + 1) // 2), (L, 2.75, 0.14), (0, 0, 0), st, root, bev=0.02, seg=3)
        bx.rotation_euler = (0, sgn * th, 0)
        nrm = Vector((sgn * math.sin(th), 0, math.cos(th))) * 0.05
        bx.location = Vector((sgn * B / 2, -0.05, ped_z + P / 2)) + nrm
    # a small acroterion block at the apex (reads as finished architecture)
    box(name + '_apex', (0.22, 2.6, 0.12), (0, -0.05, ped_z + P + 0.03), st, root, bev=0.02, seg=2)
    return root


# ----------------------------------------------------------------------------- programs (Ethereum)
def module(material='azure', name='MODULE', w=2.0, d=1.0, h=0.62):
    """The program module (smart contract): anodised box, three keys, ports, a lime indicator."""
    root = _root(name)
    box(name + '_body', (w, d, h), (0, 0, h / 2), material, root, bev=0.07, seg=5)
    for i in range(3):
        box('%s_key%d' % (name, i), (0.3, 0.3, 0.08), (-0.45 + i * 0.42, 0.0, h + 0.012), 'black_glass', root,
            bev=0.025, seg=3)
    box(name + '_led', (0.09, 0.09, 0.03), (w / 2 - 0.22, -d / 2 + 0.2, h + 0.005), 'lime_led', root, bev=0.01, seg=2)

    for sx in (-1, 1):
        cyl('%s_port%d' % (name, (sx + 1) // 2), 0.17, 0.05, (sx * (w / 2 + 0.01), 0, 0.2), 'steel_light', root,
            verts=48, bev=0.01, rot=(0, math.radians(90), 0))
        cyl('%s_hole%d' % (name, (sx + 1) // 2), 0.14, 0.06, (sx * (w / 2 + 0.02), 0, 0.2), 'black_glass', root,
            verts=32, bev=0.0, rot=(0, math.radians(90), 0))
    return root


def arrow_arc(name, center, radius, a0, a1, tube=0.065, head=0.17, material='azure', parent=None, n=48, plane='XZ'):
    """A curved 3D arrow from angle a0 to a1 (degrees), head at a1. plane 'XZ' faces the camera, 'XY' lies flat."""
    C = Vector(center)
    U = Vector((1, 0, 0))
    V = Vector((0, 0, 1)) if plane == 'XZ' else Vector((0, 1, 0))
    a0r, a1r = math.radians(a0), math.radians(a1)
    sgn = 1 if a1 > a0 else -1
    head_ang = (head * 1.1) / radius * sgn
    pts = []
    for i in range(n + 1):
        a = a0r + (a1r - head_ang - a0r) * i / n
        pts.append(tuple(C + U * radius * math.cos(a) + V * radius * math.sin(a)))
    tube_o = sweep_tube(name + '_shaft', pts, tube, material, parent)
    a_end = a1r - head_ang
    p = C + U * radius * math.cos(a_end) + V * radius * math.sin(a_end)
    tan = (U * -math.sin(a_end) + V * math.cos(a_end)) * sgn
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=tube * 2.5, radius2=0.0, depth=head * 1.3)
    hd = S.mesh_from_bm(name + '_head', bm, material, parent)
    hd.location = p + tan * head * 0.6
    hd.rotation_euler = tan.to_track_quat('Z', 'Y').to_euler()
    return tube_o, hd


def app_base(name, parent, r=1.3, h=0.2):
    """The shared turntable base of the four Ethereum apps (anodised azure disc)."""
    prof = [(0.0005, 0.0), (r - 0.04, 0.0), (r, 0.04), (r, h - 0.05), (r - 0.05, h), (0.0005, h)]
    b = lathe(name + '_base', prof, 'azure', parent, verts=128)
    bevel(b, 0.012, 3, angle=25)
    return h


def eth_exchange(name='EXCHANGE'):
    """Exchange: a gold and a silver coin standing on the base, ringed by two flat curved arrows (a swap)."""
    root = _root(name)
    h = app_base(name, root)
    rr = 0.42
    a = coin(rr, 0.11, 'gold', name + '_tokA', upright=True)
    a.parent = root
    a.location = (-0.5, 0, h)
    b = coin(rr, 0.11, 'silver', name + '_tokB', upright=True)
    b.parent = root
    b.location = (0.5, 0, h)
    # the swap: two curved arrows as one floating ring around the coins, at their mid-height (bright steel)
    arcs = empty(name + '_arrows', (0, 0, h + rr), root)
    arrow_arc(name + '_a1', (0, 0, 0), 1.02, 196, 344, tube=0.055, head=0.22, material='steel_light', parent=arcs,
              plane='XY')
    arrow_arc(name + '_a2', (0, 0, 0), 1.02, 16, 164, tube=0.055, head=0.22, material='steel_light', parent=arcs,
              plane='XY')
    root['tokA'], root['tokB'] = a.name, b.name
    return root


def padlock(name='LOCK', material='azure', parent=None):
    root = empty(name, (0, 0, 0), parent)
    box(name + '_body', (0.78, 0.32, 0.64), (0, 0, 0.32), material, root, bev=0.07, seg=5)
    # shackle: a U of round bar (its own empty so it can drop shut)
    sh = empty(name + '_shackle', (0, 0, 0.0), root)
    r, leg = 0.23, 0.28
    pts = [(-r, 0, 0.5)] + [(-r, 0, 0.5 + leg * k / 6) for k in range(1, 7)]
    pts += [(-r * math.cos(math.pi * k / 24), 0, 0.5 + leg + r * math.sin(math.pi * k / 24)) for k in range(1, 24)]
    pts += [(r, 0, 0.5 + leg - leg * k / 6) for k in range(0, 7)]
    sweep_tube(name + '_bar', pts, 0.06, 'steel_light', sh)
    # keyhole: a dark round + slot, shapes only
    cyl(name + '_kh', 0.055, 0.04, (0, -0.165, 0.36), 'black_glass', root, verts=32, bev=0.0,
        rot=(math.radians(90), 0, 0))
    box(name + '_ks', (0.04, 0.04, 0.12), (0, -0.165, 0.28), 'black_glass', root, bev=0.0)
    root['shackle'] = sh.name
    return root


def hourglass(name, parent, H=1.15):
    root = empty(name, (0, 0, 0), parent)
    cap_r, cap_h = 0.36, 0.07
    lathe(name + '_capB', [(0.0005, 0), (cap_r, 0), (cap_r, cap_h), (0.0005, cap_h)], 'azure', root, verts=64)
    lathe(name + '_capT', [(0.0005, H - cap_h), (cap_r, H - cap_h), (cap_r, H), (0.0005, H)], 'azure', root, verts=64)
    for i in range(3):
        ang = 2 * math.pi * i / 3 + 0.5
        cyl('%s_post%d' % (name, i), 0.028, H - 2 * cap_h, (0.3 * math.cos(ang), 0.3 * math.sin(ang), H / 2), 'azure',
            root, verts=24, bev=0.0)
    # glass: two bulbs and a neck
    g0, g1 = cap_h, H - cap_h
    mid = (g0 + g1) / 2
    prof = []
    for k in range(25):
        t = k / 24
        z = g0 + (g1 - g0) * t
        s = abs(t - 0.5) * 2
        r = 0.04 + 0.2 * math.sin(min(1.0, s) * math.pi / 2) ** 0.7
        r = min(r, 0.24) * (1 - 0.15 * max(0.0, s - 0.85) / 0.15)
        prof.append((r, z))
    prof = [(0.0005, g0)] + prof + [(0.0005, g1)]
    lathe(name + '_glass', prof, 'frost_glass', root, verts=64)
    # sand: a cone in the lower bulb, a little left in the top
    lathe(name + '_sandB', [(0.0005, g0 + 0.01), (0.2, g0 + 0.01), (0.0005, g0 + 0.2)], 'sand', root, verts=48)
    lathe(name + '_sandT', [(0.0005, mid + 0.04), (0.12, mid + 0.16), (0.0005, mid + 0.16)], 'sand', root, verts=48)
    return root


def eth_loan(name='LOAN'):
    """Loan: a short stack of gold coins next to a small hourglass, on the blue base."""
    root = _root(name)
    h = app_base(name, root)
    st = coin_stack(5, 0.42, 0.11, name + '_stack')
    st.parent = root
    st.location = (-0.45, 0.05, h)
    hg = hourglass(name + '_hourglass', root)
    hg.location = (0.55, -0.05, h)
    root['hourglass'] = hg.name
    return root


def _metaball_mesh(name, elems, material, parent, resolution=0.035, threshold=0.6):
    mb = bpy.data.metaballs.new(name + '_mb')
    mb.resolution = resolution
    mb.render_resolution = resolution
    mb.threshold = threshold
    for (typ, co, radius, size, rot) in elems:
        e = mb.elements.new(type=typ)
        e.co = co
        e.radius = radius
        if size is not None:
            e.size_x, e.size_y, e.size_z = size
        if rot is not None:
            e.rotation = Euler(rot).to_quaternion()
    o = bpy.data.objects.new(name + '_tmp', mb)
    bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    bpy.data.metaballs.remove(mb)
    out = bpy.data.objects.new(name, me)
    S.link(out, parent)
    for p in me.polygons:
        p.use_smooth = True
    assign(out, material)
    return out


def _catmull(pts, n=10, closed=True):
    out = []
    m = len(pts)
    for i in range(m if closed else m - 1):
        p0, p1, p2, p3 = (Vector(pts[(i + k) % m]) for k in (-1, 0, 1, 2))
        for s in range(n):
            t = s / n
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                                     + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)))
    return out


def controller_outline():
    """Face-on gamepad silhouette (XZ), counter-clockwise, ~2.1 wide: body + two grips."""
    right = [(0.0, 0.40), (0.42, 0.44), (0.78, 0.40), (0.98, 0.22), (1.06, -0.05), (1.02, -0.36), (0.9, -0.6),
             (0.72, -0.66), (0.56, -0.56), (0.44, -0.34), (0.26, -0.22), (0.0, -0.2)]
    left = [(-x, z) for x, z in reversed(right[1:-1])]
    pts = right + left
    pts = list(reversed(pts))  # counter-clockwise when seen from -Y
    return _catmull(pts, 8)


def eth_game(name='GAME'):
    """Game: a sleek controller in blue anodised aluminium with lime buttons, leaning back on the base."""
    root = _root(name)
    h = app_base(name, root)
    body = empty(name + '_pose', (0, 0.12, h + 0.62), root)
    body.rotation_euler = (math.radians(24), 0, 0)
    shell = extrude_poly(name + '_shell', controller_outline(), 0.36, 'azure', body, bev=0.13, seg=7)
    shell.modifiers['bevel'].angle_limit = math.radians(60)
    # d-pad (cross), left
    for (sx, sz) in ((0.32, 0.1), (0.1, 0.32)):
        box(name + '_dpad%s' % ('h' if sx > sz else 'v'), (sx, 0.1, sz), (-0.5, -0.19, 0.1), 'lime_button', body,
            bev=0.025, seg=3)
    # four face buttons, right (one lime)
    for i, (bx, bz) in enumerate(((0.55, 0.25), (0.55, -0.03), (0.41, 0.11), (0.69, 0.11))):
        cyl('%s_btn%d' % (name, i), 0.068, 0.08, (bx, -0.19, bz), 'lime_button', body, verts=32,
            bev=0.02, rot=(math.radians(90), 0, 0))
    # two thumbsticks, centre-low
    for sx in (-1, 1):
        cyl('%s_stick%d' % (name, (sx + 1) // 2), 0.11, 0.1, (sx * 0.24, -0.19, -0.08), 'black_glass', body, verts=40,
            bev=0.03, rot=(math.radians(90), 0, 0))
    return root


def eth_savings(name='SAVINGS'):
    """Savings: a piggy bank in blue anodised aluminium, a gold coin half into its slot, on the base."""
    root = _root(name)
    h = app_base(name, root)
    pig = empty(name + '_pig', (0, 0, h), root)
    leg_h = 0.2
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=0.5)
    bmesh.ops.scale(bm, vec=(1.12, 0.8, 0.78), verts=bm.verts)
    body = S.mesh_from_bm(name + '_body', bm, 'azure', pig)
    body.location = (0, 0, leg_h + 0.36)
    zc = leg_h + 0.36
    cyl(name + '_snout', 0.17, 0.16, (-0.6, 0, zc - 0.02), 'azure', pig, verts=48, bev=0.04,
        rot=(0, math.radians(90), 0))
    for sy in (-1, 1):
        cyl('%s_nostril%d' % (name, (sy + 1) // 2), 0.03, 0.02, (-0.685, sy * 0.06, zc - 0.02), 'black_glass', pig,
            verts=16, bev=0.0, rot=(0, math.radians(90), 0))
        sph = bmesh.new()
        bmesh.ops.create_uvsphere(sph, u_segments=16, v_segments=8, radius=0.035)
        eye = S.mesh_from_bm('%s_eye%d' % (name, (sy + 1) // 2), sph, 'black_glass', pig)
        eye.location = (-0.42, sy * 0.2, zc + 0.16)
        cone = bmesh.new()
        bmesh.ops.create_cone(cone, cap_ends=True, segments=24, radius1=0.12, radius2=0.01, depth=0.2)
        ear = S.mesh_from_bm('%s_ear%d' % (name, (sy + 1) // 2), cone, 'azure', pig)
        ear.location = (-0.3, sy * 0.2, zc + 0.36)
        ear.rotation_euler = (sy * math.radians(-18), math.radians(-25), 0)
    for i, (lx, ly) in enumerate(((-0.3, -0.2), (-0.3, 0.2), (0.3, -0.2), (0.3, 0.2))):
        cyl('%s_leg%d' % (name, i), 0.09, leg_h + 0.12, (lx, ly, (leg_h + 0.12) / 2), 'azure', pig, verts=32,
            bev=0.03)
    tail = [(0.55 + 0.06 * math.cos(t * 2) * (1 - t / 8) + t * 0.012, 0.06 * math.sin(t * 2) * (1 - t / 8),
             zc + 0.05 + t * 0.012) for t in [k / 4 for k in range(0, 25)]]
    sweep_tube(name + '_tail', tail, 0.022, 'azure', pig, sides=12)
    box(name + '_slot', (0.3, 0.05, 0.03), (0.02, 0, zc + 0.385), 'black_glass', pig, bev=0.01, seg=2)
    c = coin(0.2, 0.05, 'gold', name + '_coin', upright=True)
    c.parent = pig
    c.rotation_euler = (0, 0, math.radians(90))   # its face along X, edge into the slot
    c.location = (0.02, 0, zc + 0.26)
    root['coin'] = c.name
    return root


# ----------------------------------------------------------------------------- notes, plates, wall, devices, key
def glass_note(name='NOTE', w=2.2, h=1.0, t=0.035):
    root = _root(name)
    pane = extrude_poly(name + '_pane', rounded_rect(w, h, 0.07), t, 'frost_glass', root, loc=(0, 0, h / 2),
                        bev=0.01, seg=4)
    return root
    # a hairline frame engraved just inside the edge (clear glass strip), shapes only
    inner = rounded_rect(w - 0.16, h - 0.16, 0.04)
    outer = rounded_rect(w - 0.13, h - 0.13, 0.055)
    bm = bmesh.new()
    vi = [bm.verts.new((x, -t / 2 - 0.0015, z + h / 2)) for x, z in inner]
    vo = [bm.verts.new((x, -t / 2 - 0.0015, z + h / 2)) for x, z in outer]
    n = len(inner)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((vo[i], vo[j], vi[j], vi[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    S.mesh_from_bm(name + '_line', bm, 'cloud_metal', root)
    return root


def statement_plate(name='PLATE', w=3.0, h=2.0, t=0.06, wall=True):
    """A brushed cloud-aluminium plate, four hex bolts; faces -Y (the camera)."""
    root = _root(name)
    extrude_poly(name + '_plate', rounded_rect(w, h, 0.05), t, 'cloud_metal', root, loc=(0, -t / 2, 0), bev=0.012,
                 seg=3)
    for sx in (-1, 1):
        for sz in (-1, 1):
            cyl('%s_bolt%d%d' % (name, (sx + 1) // 2, (sz + 1) // 2), 0.055, 0.03,
                (sx * (w / 2 - 0.16), -t - 0.012, sz * (h / 2 - 0.16)), 'steel_light', root, verts=6, bev=0.006,
                rot=(math.radians(90), 0, math.radians(30)))
    if wall:
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0.002, 0), rotation=(math.radians(90), 0, 0))
        wl = bpy.context.active_object
        wl.name = name + '_wall'
        wl['no_bbox'] = True
        wl.scale = (40, 40, 1)
        wl.parent = root
        assign(wl, 'stone')
    return root


def ledger_wall(name='WALL', cols=7, rows=5, pw=1.5, ph=1.0, gap=0.09):
    root = _root(name)
    W = cols * pw + (cols - 1) * gap
    H = rows * ph + (rows - 1) * gap
    plates = []
    for i in range(cols):
        for j in range(rows):
            x = -W / 2 + pw / 2 + i * (pw + gap)
            z = H / 2 - ph / 2 - j * (ph + gap)
            p = statement_plate('%s_p%d_%d' % (name, i, j), pw, ph, 0.04, wall=False)
            p.parent = root
            p.location = (x, 0, z)
            plates.append(p)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0.002, 0), rotation=(math.radians(90), 0, 0))
    wl = bpy.context.active_object
    wl.name = name + '_wall'
    wl['no_bbox'] = True
    wl.scale = (80, 60, 1)
    wl.parent = root
    assign(wl, 'stone')
    root['W'], root['H'] = W, H
    return root


def terminal(name='TERMINAL'):
    root = _root(name)
    W, D, H = 1.3, 0.24, 2.0
    box(name + '_body', (W, D, H), (0, 0, H / 2), 'cloud_metal', root, bev=0.08, seg=5)
    box(name + '_screen', (W - 0.2, 0.03, 1.25), (0, -D / 2 - 0.004, H - 0.12 - 0.625), 'black_glass', root, bev=0.02,
        seg=3)
    for i in range(6):
        box('%s_key%d' % (name, i), (0.12, 0.05, 0.1), (-0.4 + i * 0.16, -D / 2 - 0.01, 0.38), 'cloud_paint', root,
            bev=0.02, seg=2)
    box(name + '_led', (0.05, 0.02, 0.05), (0, -D / 2 - 0.005, 0.2), 'lime_led', root, bev=0.0)
    return root


def view_key(name='KEY'):
    """Cloud-aluminium key with a lime tab on its bow; lying flat."""
    root = _root(name)
    ro, ri, t = 0.42, 0.22, 0.1
    verts = 64
    bm = bmesh.new()
    prof = [(ri, 0), (ro, 0), (ro, t), (ri, t)]
    rings = [[bm.verts.new((r * math.cos(2 * math.pi * i / verts), r * math.sin(2 * math.pi * i / verts), z))
              for i in range(verts)] for r, z in prof]
    for a, b in zip(rings, rings[1:] + rings[:1]):
        for i in range(verts):
            j = (i + 1) % verts
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bow = S.mesh_from_bm(name + '_bow', bm, 'key_metal', root)
    bow.location = (-0.9, 0, 0)
    bevel(bow, 0.02, 3, angle=40)
    box(name + '_tab', (0.2, 0.2, 0.05), (-0.9 - 0.31, 0, t + 0.02), 'lime', root, bev=0.02, seg=3)
    for ch in root.children:
        if ch.name.endswith(('_bow', '_shaft')) or '_bit' in ch.name:
            S.edge_glow(ch, 'edge_lime_key')
    box(name + '_shaft', (1.5, 0.15, t), (0.1, 0, t / 2), 'key_metal', root, bev=0.02, seg=3)
    for i, (x, dz) in enumerate(((0.55, 0.22), (0.72, 0.15), (0.86, 0.26))):
        box('%s_bit%d' % (name, i), (0.12, dz, t), (x, -0.075 - dz / 2 + 0.01, t / 2), 'key_metal', root, bev=0.015,
            seg=2)
    return root


# ----------------------------------------------------------------------------- the Tari tower
def tower(n=5, levels=7, c=0.5, gap=0.025, name='TOWER', seed=7):
    """Minotari base (glossy ink cubes) under an Ootle crown (violet cubes at stepped heights).
    Returns the root; root['black'] / root['violet'] list the cube object names with their grid cells."""
    import random
    rnd = random.Random(seed)
    root = _root(name)
    step = c + gap
    off = (n - 1) / 2
    # one shared mesh per material: cubes are linked duplicates (fast, consistent bevel)
    def proto(nm, material):
        o = box(nm, (c, c, c), (0, 0, 0), material, None, bev=0.045, seg=4)
        o.modifiers['bevel'].harden_normals = True
        return o
    pb = proto(name + '_protoB', 'ink_gloss')
    pv = proto(name + '_protoV', 'violet')
    blacks, violets = [], []
    for k in range(levels):
        for i in range(n):
            for j in range(n):
                o = pb.copy()
                o.name = '%s_b_%d_%d_%d' % (name, i, j, k)
                S.link(o, root)
                o.location = ((i - off) * step, (j - off) * step, c / 2 + k * step)
                blacks.append((o.name, i, j, k))
    top = levels * step
    for i in range(n):
        for j in range(n):
            # crown heights: a soft diagonal wave quantised to quarter cubes (the brand tower's stepped top)
            h = 0.5 + 0.5 * math.sin(0.9 * (i - off) + 0.6 * (j - off) + 0.4)
            dz = round(h * 3) / 3 * 0.75 * c          # stepped crown (brand kit): 0 / 0.25 / 0.5 / 0.75 cube
            o = pv.copy()
            o.name = '%s_v_%d_%d' % (name, i, j)
            S.link(o, root)
            o.location = ((i - off) * step, (j - off) * step, top + c / 2 + dz)
            violets.append((o.name, i, j, dz))
    bpy.data.objects.remove(pb)
    bpy.data.objects.remove(pv)
    root['black'] = [b[0] for b in blacks]
    root['violet'] = [v[0] for v in violets]
    root['top'] = top
    return root, blacks, violets


def monero_ring(n=16, R=5.2, size=1.0, name='RING'):
    root = _root(name)
    cubes = []
    for i in range(n):
        a = 2 * math.pi * i / n
        cb = monero_cube(size, '%s_%02d' % (name, i))
        cb.parent = root
        cb.location = (R * math.sin(a), -R * math.cos(a), 0)
        cb.rotation_euler = (0, 0, a)
        cubes.append(cb)
    return root, cubes


BUILDERS = {
    'you_cube': (you_cube, 'dark'), 'monero_cube': (monero_cube, 'dark'), 'steel_cube': (steel_cube, 'white'),
    'coin': (lambda: coin(upright=True), 'white'), 'bank': (bank, 'white'), 'azure_module': (module, 'white'),
    'violet_module': (lambda: module('violet_glass', 'VMODULE'), 'dark'), 'eth_exchange': (eth_exchange, 'white'),
    'eth_loan': (eth_loan, 'white'), 'eth_game': (eth_game, 'white'), 'eth_savings': (eth_savings, 'white'),
    'glass_note': (glass_note, 'dark'), 'statement_plate': (statement_plate, 'white'),
    'ledger_wall': (ledger_wall, 'white'), 'view_key': (view_key, 'dark'),
    'tower': (lambda: tower()[0], 'dark'), 'monero_ring': (lambda: monero_ring()[0], 'dark'),
}


def make(kind, scale=None):
    """Build an object and scale it to real units (UNIT metres per builder unit, or `scale`)."""
    r = BUILDERS[kind][0]()
    s = S.UNIT if scale is None else scale
    r.scale = (s, s, s)
    return r
