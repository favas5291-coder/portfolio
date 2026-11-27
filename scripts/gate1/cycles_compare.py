"""Render matched reference frames from source GLBs before mesh/texture compression."""
from math import radians, sin, cos, tan
from pathlib import Path
import argparse
import sys
import bpy
from mathutils import Vector

repo = Path(__file__).resolve().parents[2]
args = argparse.ArgumentParser()
args.add_argument('--models', type=Path, default=repo/'public/appointment/models')
args.add_argument('--output', type=Path, required=True)
args.add_argument('--shot', choices=['passenger','pavement','guest'],default='passenger')
args.add_argument('--phone', action='store_true')
args.add_argument('--scale', type=int, default=100)
args.add_argument('--samples', type=int, default=32)
opts = args.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
for name in ['shell','tree','car']:
    bpy.ops.import_scene.gltf(filepath=str(opts.models/f'{name}.glb'))
s.world = bpy.data.worlds.new('Clouds after the shower')
s.world.use_nodes = True
world = s.world.node_tree
cloud = world.nodes.new('ShaderNodeTexEnvironment')
cloud.image = bpy.data.images.load(str(repo/'public/appointment/environment/after-rain.hdr'))
world.links.new(cloud.outputs[0], world.nodes['Background'].inputs[0])
world.nodes['Background'].inputs[1].default_value = .62

az,el = map(radians,(248,16))
sun_dir = Vector((sin(az)*cos(el),cos(az)*cos(el),sin(el)))
bpy.ops.object.light_add(type='SUN')
bpy.context.object.rotation_euler = (-sun_dir).to_track_quat('-Z','Y').to_euler()
bpy.context.object.data.energy = 2.0
bpy.context.object.data.color = (1,.84,.66)
bpy.context.object.data.angle = radians(2.0)
for pos,power,span in [((6.6,1.55,5.64),125,1.6),((4.02,1.9,3.10),65,1.2)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object.data
    light.energy,light.shape,light.size,light.color = power,'DISK',span,(1,.68,.40)

stops = {
    'passenger': ((7.02,-6.23,1.13),4,5,69,72),
    'pavement': ((6.66,-4.90,1.74),-19,10,65,69),
    'guest': ((6.55,1.30,4.60),169,-16,57,62),
}
eye,yaw,pitch,vwide,vphone = stops[opts.shot]
if opts.shot=='pavement':
    bpy.data.objects['PassengerHinge'].rotation_mode='XYZ'
    bpy.data.objects['PassengerHinge'].rotation_euler.z -= radians(68)
a,b=map(radians,(yaw,pitch))
bpy.ops.object.camera_add(location=eye)
s.camera=bpy.context.object
s.camera.rotation_euler=Vector((sin(a)*cos(b),cos(a)*cos(b),sin(b))).to_track_quat('-Z','Y').to_euler()
s.camera.data.sensor_fit='VERTICAL'
s.camera.data.sensor_height=24
s.camera.data.lens=12/tan(radians(vphone if opts.phone else vwide)/2)
s.camera.data.clip_start=.02
s.render.engine='CYCLES'
s.cycles.samples=opts.samples
s.cycles.use_denoising=False
s.cycles.max_bounces=5
s.cycles.transparent_max_bounces=12
s.render.resolution_x,s.render.resolution_y = (390,386) if opts.phone else (960,750)
s.render.resolution_percentage=opts.scale
s.view_settings.view_transform='AgX'
s.render.image_settings.file_format='PNG'
s.render.filepath=str(opts.output.resolve())
bpy.ops.render.render(write_still=True)
