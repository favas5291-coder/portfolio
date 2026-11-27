"""Bake static occlusion and diffuse bounce into a shared secondary UV atlas.
Run after shell.py, before KTX and mesh compression:
  blender -b -P scripts/gate1/bake_shell.py -- /path/to/raw-shell.glb /path/to/baked-shell.glb
"""
from pathlib import Path
from math import sin,cos,radians
import sys
import bpy
from mathutils import Vector

source,destination = map(Path,sys.argv[sys.argv.index('--')+1:])
repo=Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
s=bpy.context.scene
s.render.engine='CYCLES'
s.cycles.samples=10
s.cycles.use_denoising=False
s.cycles.max_bounces=4
s.render.bake.margin=3
all_objects=list(s.objects)
eligible={'Lime','Teak','Laterite','DryStone','Cushion'}
objects=[]
materials={}
for obj in all_objects:
    if obj.type!='MESH' or obj.parent or not obj.data.materials: continue
    material=obj.data.materials[0]
    if material.name not in eligible: continue
    if material.name not in materials: materials[material.name]=material.copy()
    obj.data.materials[0]=materials[material.name]
    uv=obj.data.uv_layers.new(name='StudioLight')
    obj.data.uv_layers.active=uv
    obj.data.uv_layers[0].active_render=True
    objects.append(obj)
if not objects: raise ValueError('No architectural receivers found')
def select(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
select(objects)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=radians(73), island_margin=.001, area_weight=.5,scale_to_bounds=True)
bpy.ops.object.mode_set(mode='OBJECT')
def bake(name,kind):
    target=bpy.data.images.new(name,width=1024,height=1024,alpha=False)
    target.colorspace_settings.name='Non-Color' if kind=='AO' else 'sRGB'
    nodes={}
    for mat in materials.values():
        n=mat.node_tree.nodes.new('ShaderNodeTexImage'); n.image=target
        mat.node_tree.nodes.active=n
        uv_node=mat.node_tree.nodes.new('ShaderNodeUVMap'); uv_node.uv_map='StudioLight'
        mat.node_tree.links.new(uv_node.outputs['UV'],n.inputs['Vector'])
        nodes[mat]=n
    select(objects)
    bpy.ops.object.bake(type=kind,pass_filter={'INDIRECT','COLOR'} if kind=='DIFFUSE' else set(),uv_layer='StudioLight')
    target.pack()
    return nodes

# The direct key and shadowing of moving hinges stay live. Bake only reflected
# diffuse light from the fixed envelope and two practicals.
s.world=bpy.data.worlds.new('Diffuse daylight')
s.world.use_nodes=True
world=s.world.node_tree
tex=world.nodes.new('ShaderNodeTexEnvironment')
tex.image=bpy.data.images.load(str(repo/'public/appointment/environment/after-rain.hdr'))
world.links.new(tex.outputs[0],world.nodes['Background'].inputs[0])
world.nodes['Background'].inputs[1].default_value=.55
a,h=map(radians,(248,16))
bpy.ops.object.light_add(type='SUN')
sun=bpy.context.object
sun.rotation_euler=Vector((-sin(a)*cos(h),-cos(a)*cos(h),-sin(h))).to_track_quat('-Z','Y').to_euler()
sun.data.energy=1.65
sun.data.color=(1,.82,.62)
for pos,energy in [((6.62,1.75,5.55),26),((3.95,2.35,2.65),13)]:
    bpy.ops.object.light_add(type='POINT',location=pos)
    lamp=bpy.context.object.data
    lamp.energy=energy
    lamp.color=(1,.68,.36)
for obj in all_objects:
    if obj.parent and obj.parent.name=='EntranceHinge':obj.hide_render=True
ao=bake('Static architectural occlusion','AO')
indirect=bake('Reflected daylight and practicals','DIFFUSE')
group=bpy.data.node_groups.get('glTF Material Output')
if not group:
    group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
    group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
for mat in materials.values():
    tree=mat.node_tree
    out=next((n for n in tree.nodes if n.type=='GROUP' and n.node_tree==group),None)
    if not out:out=tree.nodes.new('ShaderNodeGroup');out.node_tree=group
    tree.links.new(ao[mat].outputs['Color'],out.inputs['Occlusion'])
    p=next(n for n in tree.nodes if n.type=='BSDF_PRINCIPLED')
    tree.links.new(indirect[mat].outputs['Color'],p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value=.63
for obj in all_objects:obj.hide_render=False
select(all_objects)
bpy.ops.export_scene.gltf(filepath=str(destination.resolve()),export_format='GLB',use_selection=True,export_yup=True,export_image_format='AUTO')
print('Baked architecture receivers',len(objects))
