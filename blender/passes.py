"""Extra passes for alpha shots (AD-DECISIONS §4): written next to the beauty under the same frame index.
  shadow/####.png : Cycles Shadow Catcher pass (RGB, 1 = no shadow; coloured glass shadows survive). AD: multiply.
  glare/####.png  : bloom of emission/hot highlights only (RGB on black). AD: screen.
Blender 5.x compositor: node group as scene.compositing_node_group, File Output with file_output_items.
"""
import os
import bpy


def setup(shot_dir, shadow=False, glare=False, glare_strength=0.35, threshold=0.9, size=0.6):
    if not (shadow or glare):
        return []
    sc = bpy.context.scene
    vl = bpy.context.view_layer
    tree = bpy.data.node_groups.new('passes', 'CompositorNodeTree')
    sc.compositing_node_group = tree
    sc.render.use_compositing = True
    tree.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = tree.nodes.new('CompositorNodeRLayers')
    out = tree.nodes.new('NodeGroupOutput')
    tree.links.new(rl.outputs['Image'], out.inputs['Image'])        # beauty unchanged
    made = []
    fo = tree.nodes.new('CompositorNodeOutputFile')
    fo.directory = shot_dir
    fo.file_name = 'pass_'      # files: pass_<item><frame>.png (renamed into <item>/####.png by shotlib)
    fo.format.media_type = 'IMAGE'
    fo.format.file_format = 'PNG'
    fo.format.color_mode = 'RGB'
    fo.format.color_depth = '8'
    if shadow:
        vl.cycles.use_pass_shadow_catcher = True
        bpy.context.view_layer.update()
        fo.file_output_items.new('RGBA', 'shadow')
        tree.links.new(rl.outputs['Shadow Catcher'], fo.inputs['shadow'])
        made.append(('shadow', 'shadow/####.png'))
    if glare:
        gl = tree.nodes.new('CompositorNodeGlare')
        gl.inputs['Type'].default_value = 'Bloom'
        gl.inputs['Quality'].default_value = 'High'
        gl.inputs['Threshold'].default_value = threshold
        gl.inputs['Strength'].default_value = glare_strength
        gl.inputs['Size'].default_value = size
        tree.links.new(rl.outputs['Image'], gl.inputs['Image'])
        fo.file_output_items.new('RGBA', 'glare')
        tree.links.new(gl.outputs['Glare'], fo.inputs['glare'])
        made.append(('glare', 'glare/####.png'))
    return made
