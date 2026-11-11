"""THE LOOK: every material recipe and every light/world parameter of the film, in one place.

Re-skin the whole film by editing this file only (studio.py reads it; object builders only name
materials by role). Version: v1 "MACHINED LIGHT" (research/direction-v4/style-bible-v4.md), 2026-11-08.
Shot list (SHOTLIST-3D.md) wins where they disagree.

Material recipe keys:
  Principled sockets (friendly names, see studio._IN): base, metal, rough, ior, sss, sss_radius,
  sss_scale, spec, aniso, aniso_rot, trans, coat, coat_rough, coat_ior, sheen, emit, emit_k, alpha
  shadow_tint: (colour, strength) -> coloured (not black) shadows through glass (Is Shadow Ray trick)
  fx: list of effects: ('brushed', {...}) | ('grain', {...}) | ('rough_noise', {...}) | ('edge_glow', {...}) |
      ('inner_glow', {...}) | ('absorb', {color, density}) | ('tangent_radial', {})
Colours are palette names or hex strings (sRGB); studio converts to linear. Tuples of 3 floats are linear.
Scale: 1 unit = 1 m; the "you" cube is 0.20 m (UNIT).
"""

UNIT = 0.20          # metres per builder unit: the hero cube's edge

PALETTE = {
    'ink': '#040723', 'cloud': '#ECEEFF', 'purple': '#813BF5', 'lime': '#C7EA00', 'green': '#C9EB00',
    'red': '#FE2C3F', 'azure': '#0939CF', 'yellow': '#EBC216', 'steel': '#67697C', 'frost': '#D3D7DE',
    # Monero: the AD's pick from Monero's palette (logo orange is quoted as #FF6600 + grey #4C4C4C)
    'monero': '#F26822', 'graphite': '#2A2C33', 'black': '#000000',
}

MATERIALS = {
    # 2.1 "you": lime jelly glass (clear resin lit from inside: + inner core 'lime_core')
    'lime': dict(base='lime', trans=1.0, rough=0.06, ior=1.5, coat=1.0, coat_rough=0.03, emit='lime', emit_k=0.12,
                 shadow_tint=('lime', 0.55), fx=[('absorb', dict(color='lime', density=4.0, glow=4.5))]),
    'lime_core': dict(base='lime', rough=0.5, emit='lime', emit_k=4.0),
    # 2.3 Monero: frosted orange resin (+ inner core 'monero_core')
    'monero': dict(base='monero', trans=1.0, rough=0.42, ior=1.48, coat=1.0, coat_rough=0.06, emit='monero',
                   emit_k=0.10, shadow_tint=('monero', 0.45), fx=[('absorb', dict(color='monero', density=3.0, glow=3.0))]),
    # v5 (AD 2026-11-08): Monero = neutral frosted glass, the "hidden" steel role (orange read as "flagged = bad").
    # "You" frosts into the same material as the 15 decoys. Calm cool-white heart, no colour, neutral shadow.
    'monero_frost': dict(base='#D3D7E2', trans=1.0, rough=0.40, ior=1.45, coat=1.0, coat_rough=0.05,
                         emit='#DDE2F0', emit_k=0.04, shadow_tint=('#9095A5', 0.45),
                         fx=[('rough_noise', dict(rough=0.40, var=0.04, scale=4.0)),
                             ('absorb', dict(color='steel', density=2.5, glow=0.8, glow_color='#E6EAF6'))]),
    # (AD nudge: emission 0.08 -> 0.04 and heart 1.2 -> 0.8 for more top/side value separation: glass, not milk)
    'monero_core': dict(base='monero', rough=0.5, emit='monero', emit_k=2.5),
    # 2.2 Tari violet frosted glass (template) / crown voxels (less frost, more emission)
    'violet_glass': dict(base='purple', trans=1.0, rough=0.32, ior=1.45, coat=1.0, coat_rough=0.04, emit='purple',
                         emit_k=0.15, shadow_tint=('purple', 0.4), fx=[('absorb', dict(color='purple', density=2.0, glow=2.2))]),
    'violet_core': dict(base='purple', rough=0.5, emit='purple', emit_k=2.0),
    'violet': dict(base='purple', trans=1.0, rough=0.18, ior=1.45, coat=1.0, coat_rough=0.04, emit='purple',
                   emit_k=0.3, fx=[('absorb', dict(color='purple', density=2.0, glow=1.5))]),
    # Minotari base voxels: glossy black
    'ink_gloss': dict(base='ink', rough=0.12, coat=1.0, coat_rough=0.03, spec=0.6),
    # 2.4 graphite brushed metal (+ optional lime edge glow); steel = stranger / customer
    'graphite': dict(base='graphite', metal=1.0, rough=0.28, aniso=0.7, fx=[('brushed', dict(rough=0.28, var=0.07, k=0.06))]),
    'steel': dict(base=(0.217, 0.226, 0.323), metal=1.0, rough=0.28, aniso=0.5,
                  fx=[('brushed', dict(rough=0.28, var=0.06, k=0.06))]),
    # bolts, shackles, hinges: lighter steel
    'steel_light': dict(base=(0.55, 0.56, 0.60), metal=1.0, rough=0.25, aniso=0.5,
                        fx=[('brushed', dict(rough=0.25, var=0.05, k=0.04))]),
    # 2.7 gold coin (measured F0 nudged to the kit's yellow), lathe-turned (radial anisotropy)
    'gold': dict(base=(1.0, 0.72, 0.26), metal=1.0, rough=0.16, aniso=0.35, fx=[('tangent_radial', {})]),
    # silver coin (exchange): aluminium F0
    'silver': dict(base=(0.62, 0.63, 0.66), metal=1.0, rough=0.26, aniso=0.35, fx=[('tangent_radial', {})]),
    # azure anodised aluminium (modules, app bases)
    'azure': dict(base='azure', metal=1.0, rough=0.35, fx=[('grain', dict(scale=900, k=0.02))]),
    # public plates, the key: cloud anodised aluminium / brushed aluminium
    'cloud_metal': dict(base=(0.55, 0.56, 0.60), metal=1.0, rough=0.22, aniso=0.8,
                        fx=[('brushed', dict(rough=0.22, var=0.05, k=0.05))]),
    # the statement plate (L19/L20): anodised, part-metallic so the face takes the raking key and the engraving
    # reads on the white wall AND alone on ink (full metal mirrors the dark world and goes black)
    'plate_metal': dict(base=(0.72, 0.73, 0.77), metal=0.35, rough=0.34, aniso=0.4,
                        fx=[('brushed', dict(rough=0.34, var=0.05, k=0.05))]),
    'key_metal': dict(base=(0.80, 0.81, 0.86), metal=1.0, rough=0.24, aniso=0.6,
                      fx=[('brushed', dict(rough=0.24, var=0.05, k=0.04))]),
    # the bank: white stone; inner wall and door a little darker so the columns read
    'stone': dict(base=(0.80, 0.78, 0.74), rough=0.62, sss=0.05, fx=[('grain', dict(scale=60, k=0.03)),
                                                                    ('rough_noise', dict(rough=0.62, var=0.05))]),
    'stone_shade': dict(base=(0.52, 0.51, 0.49), rough=0.7, fx=[('grain', dict(scale=60, k=0.03))]),
    'door': dict(base='graphite', metal=1.0, rough=0.3, aniso=0.6, fx=[('brushed', dict(rough=0.3, var=0.05, k=0.05))]),
    # 2.5 frosted cloud glass (the banknote)
    'frost_glass': dict(base='cloud', trans=1.0, rough=0.45, ior=1.5, coat=0.6, coat_rough=0.08, emit='cloud', emit_k=0.07,
                        shadow_tint=('cloud', 0.5), fx=[('rough_noise', dict(rough=0.45, var=0.05, scale=3.0))]),
    'sand': dict(base=(0.85, 0.62, 0.22), rough=0.8),
    # hidebox edge: the bevel faces of dark metal parts (Bevel modifier material index 1) glow lime where they turn
    # away from the camera and face down/sideways (a thin line, not a neon tube)
    'edge_lime': dict(base='graphite', metal=1.0, rough=0.28, emit='lime', emit_k=0.0,
                      fx=[('edge_mask', dict(color='lime', k=7.0, power=1.6, nz=0.2))]),
    'edge_lime_key': dict(base=(0.80, 0.81, 0.86), metal=1.0, rough=0.24, emit='lime', emit_k=0.0,
                          fx=[('edge_mask', dict(color='lime', k=6.0, power=1.6, nz=0.35))]),
    'black_glass': dict(base='#020309', rough=0.06, coat=1.0, coat_rough=0.02),
    'lime_led': dict(base='lime', rough=0.3, emit='lime', emit_k=8.0),
    'lime_button': dict(base='lime', rough=0.25, coat=0.6, coat_rough=0.05, emit='lime', emit_k=0.6),
    # floors
    'floor_white': dict(base='cloud', rough=0.6),
    # emits exactly ink (the floor gets no light: light-linked away), so the background pixel reads #040723
    'floor_dark': dict(base='ink', rough=0.20, spec=0.5, coat=0.4, coat_rough=0.15, emit='ink', emit_k=1.0,
                       fx=[('rough_noise', dict(rough=0.2, var=0.06, scale=1.5))]),
}

# the ONE lighting rig (bible §3). Angles: az measured from the camera direction; + = camera-left side.
# positions are for a subject at real scale (~0.2-0.5 m); `scale` in light_rig() multiplies distances/sizes.
RIG = {
    # power calibrated with probe.py (2026-11-08): lit top of a Cloud cube = 0.805 linear (dark), 0.81 (white)
    'key': dict(az=125.0, el=50.0, dist=2.8, size=1.2, power=25.5, spread=90.0, color=(1, 1, 1)),
    'rim': dict(az=-150.0, el=20.0, dist=2.2, size=(0.2, 2.0), power=10.2),      # reflection-only strip card
    'top': dict(dist=2.0, size=1.6, power=5.1),                                   # reflection-only sheen
    'white': dict(key_k=0.82, world_cam='cloud', world_fill='cloud', fill_k=0.35, floor='floor_white', neg_fill=True,
                  cards=True, lens_plate='cloud'),
    'dark': dict(key_k=1.0, world_cam='ink', world_fill='ink', fill_k=0.02, floor='floor_dark', neg_fill=False, cards=True,
                 lens_plate='ink'),
}

# camera language (bible §4 + shot list): 60 mm everywhere, f/2.8 (f/4 groups)
CAMERA = dict(lens=60.0, fstop=2.8, fstop_group=4.0, el_hero=10.0, el_module=20.0, blades=7)

# render defaults
RENDER = dict(samples=96, threshold=0.02, motion_blur=True, shutter=0.5, view_transform='Standard', look='None')
