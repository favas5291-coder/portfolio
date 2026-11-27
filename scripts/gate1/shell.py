"""Measured Fazhere shell, built in metres (east, north, height). Run with Blender -b -P."""
from collections import defaultdict
from math import cos, pi, sin
from pathlib import Path
import random
import subprocess
import tempfile
import importlib.util

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
SURFACES = Path(tempfile.gettempdir()) / 'faz-shell-textures'


class Studio:
    def __init__(self):
        self.materials = {}
        self.parts = defaultdict(lambda: [[], []])
        self.parents = {}
        self.rng = random.Random(4807)
        self.made = []

    def finish(self, name, color, rough=.65, metal=0, alpha=1, glow=0, image=None):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        mat.use_backface_culling = alpha >= 1 and name not in ('Foliage','FoliageLight')
        p = mat.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value = (*color,1)
        p.inputs['Roughness'].default_value = rough
        p.inputs['Metallic'].default_value = metal
        p.inputs['Alpha'].default_value = alpha
        if glow:
            p.inputs['Emission Color'].default_value = (*color,1)
            p.inputs['Emission Strength'].default_value = glow
        if image:
            nodes,links = mat.node_tree.nodes,mat.node_tree.links
            def texture(suffix, space):
                n=nodes.new('ShaderNodeTexImage')
                n.image=bpy.data.images.load(str(SURFACES / (image+'-'+suffix+'.jpg')),check_existing=True)
                n.image.colorspace_settings.name=space
                return n.outputs['Color']
            links.new(texture('color','sRGB'),p.inputs['Base Color'])
            normal=nodes.new('ShaderNodeNormalMap')
            links.new(texture('normal','Non-Color'),normal.inputs['Color'])
            links.new(normal.outputs[0],p.inputs['Normal'])
            sep=nodes.new('ShaderNodeSeparateColor')
            links.new(texture('orm','Non-Color'),sep.inputs[0])
            links.new(sep.outputs['Green'],p.inputs['Roughness'])
            links.new(sep.outputs['Blue'],p.inputs['Metallic'])
            tree=bpy.data.node_groups.get('glTF Material Output')
            if not tree:
                tree=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
                tree.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
            output=nodes.new('ShaderNodeGroup');output.node_tree=tree
            links.new(sep.outputs['Red'],output.inputs['Occlusion'])
        self.materials[name]=mat

    def geometry(self, key, verts, faces):
        vv,ff=self.parts[key]
        start=len(vv)
        vv.extend(tuple(v) for v in verts)
        ff.extend(tuple(start+i for i in face) for face in faces)

    def block(self, xyz, upper, mat, bevel=.009, part='Fixed', transform=None):
        x,y,z=xyz;X,Y,Z=upper
        verts=[(x,y,z),(X,y,z),(X,Y,z),(x,Y,z),(x,y,Z),(X,y,Z),(X,Y,Z),(x,Y,Z)]
        if transform is not None: verts=[transform@Vector(v) for v in verts]
        faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
        self.geometry((part,mat,bevel),verts,faces)

    def tube(self, a,b,r,mat,part='Fixed',sides=12, end_r=None):
        a,b=Vector(a),Vector(b); w=(b-a).normalized()
        helper=Vector((0,0,1)) if abs(w.z)<.90 else Vector((1,0,0))
        u=w.cross(helper).normalized();v=w.cross(u)
        verts=[p+(u*cos(2*pi*i/sides)+v*sin(2*pi*i/sides))*rad
               for p,rad in [(a,r),(b,r if end_r is None else end_r)] for i in range(sides)]
        faces=[tuple(reversed(range(sides))),tuple(range(sides,sides*2))]
        faces += [(i,(i+1)%sides,sides+(i+1)%sides,sides+i) for i in range(sides)]
        self.geometry((part,mat,0),verts,faces)

    def plate(self,coords,mat,part):
        self.geometry((part,mat,0), coords, [(0,1,2,3)])

    def label(self, body, centre, width, mat, toward_street=True, depth=.002):
        curve=bpy.data.curves.new(body,'FONT');curve.body=body;curve.align_x='CENTER';curve.align_y='CENTER'
        curve.extrude=depth;curve.bevel_depth=.0005;curve.bevel_resolution=1;curve.resolution_u=6
        obj=bpy.data.objects.new('Letters '+body,curve);bpy.context.collection.objects.link(obj)
        obj.data.materials.append(self.materials[mat]);obj.location=centre
        obj.rotation_euler=(pi/2,0,0 if toward_street else pi)
        bpy.context.view_layer.update();f=width/max(1e-4,obj.dimensions.x);obj.scale=(f,f,f)
        bpy.context.view_layer.objects.active=obj;obj.select_set(True)
        bpy.ops.object.convert(target='MESH');obj.select_set(False);self.made.append(obj)

    def assemble(self):
        for (part,mat,bev),(verts,faces) in self.parts.items():
            mesh=bpy.data.meshes.new(part+' '+mat);mesh.from_pydata(verts,[],faces);mesh.update()
            ob=bpy.data.objects.new(part if part=='OfficeScreen' else part+' '+mat,mesh)
            bpy.context.collection.objects.link(ob);ob.data.materials.append(self.materials[mat])
            if part in self.parents:ob.parent=self.parents[part]
            uv=mesh.uv_layers.new(name='UVMap')
            scale={'Teak':1.36,'Laterite':1.31,'DryStone':1.75,'WetPaving':2.75,'Asphalt':3.25}.get(mat,1.7)
            for face in mesh.polygons:
                n=face.normal
                dominant=max(range(3),key=lambda i:abs(n[i]))
                for li in face.loop_indices:
                    co=mesh.vertices[mesh.loops[li].vertex_index].co
                    if part=='OfficeScreen':
                        val=((7.42-co.x)/.44,(co.z-4.29)/.2475)
                    elif mat=='Teak' and ('Stile' in part or 'Fins' in part):
                        val=co.z/scale, (co.x+co.y)/.92
                    elif dominant==2:val=co.x/scale,co.y/scale
                    elif dominant==1:val=co.x/scale,co.z/scale
                    else:val=co.y/scale,co.z/scale
                    uv.data[li].uv=val
            if bev:
                bpy.context.view_layer.objects.active=ob
                m=ob.modifiers.new('Edge catchlights','BEVEL');m.width=bev;m.segments=2
                bpy.ops.object.modifier_apply(modifier=m.name)
                weight=ob.modifiers.new('Flat planes','WEIGHTED_NORMAL');weight.keep_sharp=True
                bpy.ops.object.modifier_apply(modifier=weight.name)
            self.made.append(ob)


def build(context_bpy=bpy):
    source = Path(__file__).with_name('shell_surfaces.py')
    finishes = ROOT / 'public/appointment/finishes'
    last_change = max(p.stat().st_mtime for p in [source, *finishes.glob('*.webp')])
    maps = [SURFACES / (name+'-'+kind+'.jpg') for name in ('laterite','lime','teak','dry','paving','road')
            for kind in ('color','normal','orm')]
    if any(not p.exists() or p.stat().st_mtime < last_change for p in maps):
        subprocess.run(['python3',str(source),str(SURFACES)],check=True)
    s=Studio();b=s.block;t=s.tube
    for name,im in [('Laterite','laterite'),('Lime','lime'),('Teak','teak'),('DryStone','dry'),('WetPaving','paving'),('Asphalt','road')]:
        s.finish(name,(1,1,1),image=im)
    s.finish('PuddleWater',(.078,.094,.089),.12,.22)
    s.finish('TarmacDust',(.19,.20,.17),.77)
    s.finish('ShadowJoint',(.035,.041,.035),.82)
    s.finish('Iron',(.085,.094,.085),.33,.78)
    s.finish('DeepBronze',(.105,.072,.039),.34,.77)
    s.finish('Gasket',(.016,.020,.017),.84)
    s.finish('GlazedEdge',(.10,.23,.18),.18,.25)
    s.finish('ClearSafetyGlass',(.65,.83,.80),.12,.05,.065)
    s.finish('FazhereOrange',(.83,.215,.045),.38,.30)
    s.finish('WarmLamp',(1,.64,.32),.29,0,1,1.7)
    s.finish('Linen',(.45,.37,.28),.95)
    s.finish('OfficeGlassBlank',(.018,.023,.020),.33)
    s.finish('Earth',(.096,.062,.040),.96)
    s.finish('BronzeLetter',(.70,.39,.15),.33,.60)
    s.finish('Cushion',(.16,.215,.180),.89)
    s.finish('Foliage',(.115,.188,.085),.84)
    s.finish('FoliageLight',(.235,.30,.101),.84)

    # Bound the view through the guest window with a real street section and distant courtyard wall.
    b((-60,-17,-.15),(60,-5.50,-.008),'Asphalt',.018,'Carriageway')
    b((-60,-55,-.19),(60,-17,-.015),'Earth',.008,'Verge bed')
    b((-24,-18.22,.02),(28,-17.90,1.12),'Laterite',.018,'Garden boundary')
    b((-24,-18.26,1.11),(28,-17.86,1.18),'DryStone',.012,'Boundary coping')
    b((-60,-5.50,-.075),(60,7.35,.133),'WetPaving',.01,'Footway substrate')
    # Individually jointed blocks interlock at the kerb. Leave a slight rise and a runoff channel.
    for i in range(-32,34):
        x=i*.92
        b((x,-5.50,.015),(x+.914,-5.26,.141),'DryStone',.015,'Kerb nosings')
    for k in range(-5,7):
        x=k*6.25+.45
        b((x,-11.75,.001),(x+2.75,-11.68,.003),'TarmacDust',.001,'Lane paint')
    # Paving uses mapped roughness and real kerf gaps. Stops exactly at the edge of the dry slab.
    for row in range(5):
        y=-5.25+row*.69
        for col in range(-14,19):
            x=col*1.23+(row%2)*.615
            b((x,y,.132),(x+1.224,y+.685,.145),'WetPaving',.003,'Street flagstones')
    for x0,x1 in [(-16,2.80),(5,22)]:
        b((x0,-1.80,.133),(x1,0,.145),'WetPaving',.003,'Street flagstones')
    b((2.80,-1.80,.134),(5.00,.32,.149),'DryStone',.004,'Dry threshold')
    # Narrow drainage channel with cast transverse ribs; no abrupt lip beneath the door.
    b((2.80,-1.815,.143),(5.,-1.75,.146),'ShadowJoint',.002,'Threshold drain')
    for i in range(63):
        x=2.81+i*.0346
        b((x,-1.812,.146),(x+.009,-1.755,.150),'Iron',.0015,'Drain bars')

    # A water film pools in depressions in the basalt and roadway. Authored perimeter loops
    # vary independently of the roughness map. Static reflections can use each height separately.
    for part, z, pools in [
        ('Pavement films', .1462, [(2.48,-2.53,.72,.10),(3.70,-2.75,.59,.09),(6.91,-4.67,.77,.11),
                                   (5.11,-4.35,.66,.15),(7.80,-2.48,.95,.16),(5.56,-2.12,.33,.06),
                                   (4.31,-2.07,.19,.043),(8.26,-4.95,.47,.061),(.85,-3.03,.87,.23)]),
        ('Road films', -.006, [(2.60,-5.80,1.46,.17),(5.8,-5.68,1.24,.069),(9.19,-5.83,1.83,.23),
                              (6.47,-8.22,1.32,.25),(-.83,-7.18,1.44,.29),(9.84,-10.41,.75,.19)])]:
        for cx,cy,rx,ry in pools:
            phase=s.rng.uniform(0,pi)
            verts=[(cx,cy,z)]
            n=52
            for i in range(n):
                a=2*pi*i/n
                r=1+.22*sin(3*a+phase)+.11*cos(5*a-phase)+.065*sin(11*a+phase)
                verts.append((cx+rx*r*cos(a),cy+ry*r*sin(a),z))
            faces=[(0,1+i,1+(i+1)%n) for i in range(n)]
            s.geometry((part,'PuddleWater',0),verts,faces)
    # Single ground floor wraps a front court that stays open to the street and sky.
    for lo,hi in [((3.17,0),(10.20,7.25)),((0,3.78),(3.17,7.25))]:
        b((*lo,.135),(*hi,.156),'DryStone',.004,'Ground floor')
    b((.02,.01,.134),(3.12,3.74,.153),'Earth',.012,'Courtyard loam')
    b((0,3.78,.14),(.26,7.25,3.28),'Laterite',.016,'West return')
    b((0,6.99,.14),(10.2,7.25,3.26),'Lime',.02,'North wall')
    b((9.89,0,.14),(10.2,7.25,3.40),'Laterite',.016,'East return')
    # Street room includes a timber-framed display recess below the lit upper bay.
    for x,X in ((4.88,5.40),(8.43,10.20)):
        b((x,0,.14),(X,.32,2.54),'Laterite',.008,'Street masonry')
        b((x,-.012,.14),(X,.327,.237),'DryStone',.006,'Street plinth')
    b((5.40,0,.14),(8.43,.31,.33),'DryStone',.005,'Showroom sill')
    b((4.88,0,2.54),(10.20,.32,3.20),'Lime',.008,'Street lime beam')
    b((4.88,-.004,2.512),(10.20,.32,2.54),'DeepBronze',.004,'Street drip')
    for x in (5.40,6.90,8.385):
        b((x,.195,.33),(x+.045,.25,2.514),'DeepBronze',.004,'Street glazing sections')
    for z in (.33,2.467):
        b((5.40,.195,z),(8.43,.251,z+.045),'DeepBronze',.003,'Street glazing sections')
    for x,X in ((5.445,6.90),(6.945,8.385)):
        b((x,.222,.375),(X,.233,2.467),'ClearSafetyGlass',.002,'Street glazing')
    for i in range(8):
        x=7.816+i*.081
        trans=Matrix.Translation((x,-.038,0))@Matrix.Rotation(.35,4,'Z')
        b((-.016,-.049,.34),(.016,.049,2.507),'Teak',.003,'Reception shade Fins',trans)
    b((3.17,.0,3.13),(5.1,3.78,3.31),'DryStone',.008,'Entrance roof')
    # Physical shadow line between pale rendered beam and floor slab.
    b((5.10,-.013,3.204),(10.20,.025,3.228),'DeepBronze',.003,'Horizontal reveal')
    b((8.54,-.365,.436),(9.99,.0,.498),'DryStone',.008,'Built-in bench')
    for x in (8.65,9.73):
        b((x,-.245,.145),(x+.12,0,.45),'Laterite',.005,'Bench feet')
    # Slim oak reveal jambs make the deep opening readable from an oblique seat.
    b((5.40,-.009,.33),(5.432,.195,2.512),'Teak',.003,'Inner timber jamb')
    b((8.398,-.009,.33),(8.43,.195,2.512),'Teak',.003,'Inner timber jamb')
    b((3.17,0,.14),(3.40,.32,3.23),'Laterite',.012,'Entrance west pier')
    b((3.40,0,2.62),(4.88,.32,3.23),'Lime',.010,'Entrance lintel')
    for x in (3.394,4.68):
        b((x,.058,.147),(x+.048,.156,2.62),'DeepBronze',.004,'Entry jamb')
    b((4.73,.040,.17),(4.88,.11,2.605),'Teak',.003,'Entry sidelight')
    b((3.39,.058,2.568),(4.74,.156,2.62),'DeepBronze',.004,'Entry head')
    for y in (1.35,2.86):
        b((3.17,y,.151),(3.30,y+.14,3.18),'Iron',.009,'Court columns')
    b((3.17,0,3.08),(3.39,3.8,3.30),'DryStone',.014,'Court fascia')
    for y in (.14,1.50):
        b((3.189,y,.18),(3.206,y+1.18,2.95),'ClearSafetyGlass',.003,'Court glazing')

    # Real canopy buildup, standing seams, folded drip edge, timber lining and two recessed downlights.
    b((2.80,-1.80,2.966),(5.00,.24,3.100),'DryStone',.015,'Entry eave core')
    b((2.78,-1.812,3.10),(5.02,.25,3.13),'Iron',.005,'Entry folded coping')
    for i in range(20):
        x=2.801+i*.11
        b((x,-1.793,2.9),(x+.105,.22,2.969),'Teak',.003,'Canopy boards')
    for x in (3.25,4.58):
        t((x,-.90,2.900),(x,-.90,2.889),.054,'DeepBronze',sides=24)
        t((x,-.90,2.889),(x,-.90,2.886),.038,'WarmLamp',sides=20)
    b((2.80,-1.817,2.916),(5.,-1.799,3.103),'DeepBronze',.004,'Canopy fascia')
    for i in range(5):
        x=2.83+.52*i
        b((x,-1.8,3.128),(x+.016,.20,3.151),'Iron',.003,'Canopy roof seams')
    # Entry glazing, patch fittings and offset handle all pivot together about the hinge pin.
    hinge=bpy.data.objects.new('EntranceHinge',None);bpy.context.collection.objects.link(hinge)
    hinge.location=(3.42,.11,.14);s.parents['EntranceLeaf']=hinge;s.made.append(hinge)
    b((.018,-.006,.025),(1.23,.006,2.417),'ClearSafetyGlass',.003,'EntranceLeaf')
    b((1.225,-.009,.025),(1.233,.009,2.417),'GlazedEdge',.002,'EntranceLeaf')
    b((.024,-.014,.027),(1.229,.014,.068),'DeepBronze',.002,'EntranceLeaf')
    for z in (.06,2.28):
        b((-.017,-.026,z),(.136,.026,z+.099),'DeepBronze',.004,'EntranceLeaf')
        t((0,0,z-.019),(0,0,z+.115),.014,'Iron','EntranceLeaf')
    for side in (-1,1):
        for z in (.93,1.35):t((1.07,side*.009,z),(1.07,side*.073,z),.017,'DeepBronze','EntranceLeaf')
        t((1.07,side*.073,.86),(1.07,side*.073,1.42),.017,'FazhereOrange','EntranceLeaf',18)
    b((.12,.022,2.385),(.38,.059,2.442),'Iron',.006,'EntranceLeaf')

    # Signed wall field with real extruded lettering. Letter spacing is resolved from the actual glyphs.
    s.label('Fazhere Studio',(6.72,-.015,2.873),2.15,'DeepBronze',depth=.010)
    b((5.414,-.022,2.794),(5.462,-.002,2.963),'FazhereOrange',.003,'Enamel doorway mark')

    # Office platform wraps the stair and the unroofed project-room void.
    for lo,hi in [((5.10,0),(10.20,4.21)),((8.91,4.21),(10.20,6.10)),((2.30,6.10),(10.20,7.25))]:
        b((*lo,3.16),(*hi,3.40),'DryStone',.013,'Upper slab')
    for lo,hi in [((5.10,0,3.40),(5.42,.32,5.92)),((7.86,0,3.40),(10.20,.32,5.92)),
                  ((5.42,0,3.40),(7.86,.32,3.66)),((5.42,0,5.57),(7.86,.32,5.92)),
                  ((5.10,.32,3.40),(5.42,4.21,5.92)),((9.88,.32,3.40),(10.20,4.21,5.92)),
                  ((5.10,4.02,3.40),(8.46,4.21,5.92)),((9.84,4.02,3.40),(10.18,4.21,5.92)),
                  ((8.46,4.02,5.49),(9.84,4.21,5.92))]:
        b(lo,hi,'Lime',.009,'Office lime render')
    # Upper reveals stay deep. Head and sill stop at the wall face, clear of both return wheel rays.
    b((5.42,-.007,3.637),(7.86,.335,3.66),'DryStone',.005,'Stone sill')
    for x in (5.423,7.824):
        b((x,.11,3.66),(x+.034,.19,5.57),'DeepBronze',.003,'Upper window stiles')
    for z in (3.66,5.53):
        b((5.423,.11,z),(7.858,.19,z+.038),'DeepBronze',.003,'Upper window rails')
    b((5.46,.148,3.697),(7.824,.159,5.532),'ClearSafetyGlass',.002,'Upstairs fixed glass')
    # Fixed end screens and full-size open leaf. Each blade is a separate eased member with grain lengthwise.
    def screen(w,matx,part):
        for x in (0,w-.047):
            b((x,-.019,0),(x+.047,.026,1.90),'Teak',.004,part+' Stile',matx)
        for z in (0,1.85):
            b((.037,-.019,z),(w-.037,.026,z+.05),'Teak',.004,part+' rails',matx)
        count=max(2,round((w-.12)/.092))
        for i in range(count):
            x=.063+(i+.5)*(w-.126)/count
            f=matx@Matrix.Translation((x,0,0))@Matrix.Rotation(-.28,4,'Z')
            b((-.014,-.033,.045),(.014,.033,1.86),'Teak',.003,part+' Fins',f)
    screen(.56,Matrix.Translation((5.42,-.16,3.667)),'West screen')
    screen(.59,Matrix.Translation((7.27,-.16,3.667)),'East screen')
    # Open leaf swings from its east jamb, 99.8° outside the facade.
    open_t=Matrix.Translation((7.27,-.16,3.667))@Matrix.Rotation(-1.399,4,'Z')
    screen(1.29,open_t,'Open screen')
    for z in (3.92,5.10):
        t((7.271,-.16,z),(7.271,-.16,z+.14),.021,'FazhereOrange',sides=16)
    # Deep roof edge reads as stacked weathering cap, fascia, vent shadow and tongue-and-groove soffit.
    b((4.83,-.54,5.94),(10.48,4.48,6.12),'Lime',.015,'Upper roof')
    b((4.81,-.56,6.12),(10.50,4.50,6.17),'Iron',.005,'Parapet flashing')
    b((4.84,-.545,5.902),(10.47,4.48,5.941),'DeepBronze',.005,'Drip reveal')
    for i in range(38):
        x=4.83+.148*i
        b((x,-.535,5.879),(x+.144,.345,5.904),'Teak',.002,'Roof lining')
    # Lit interior lining seen from the street. Use visible light sources beneath timber pelmets.
    b((5.48,3.970,4.03),(8.37,4.018,5.57),'Teak',.005,'Office rear lining')
    for i in range(23):
        x=5.48+i*.129
        b((x,3.961,4.03),(x+.004,3.975,5.57),'DeepBronze',.001,'Panel grooves')
    b((5.47,3.88,5.56),(8.38,4.03,5.64),'Teak',.005,'Light valance')
    b((5.49,3.91,5.548),(8.35,3.973,5.561),'WarmLamp',.002,'Wall wash')
    # A single paper pendant carries the glowing upstairs landmark in the opening.
    t((6.76,2.53,5.90),(6.76,2.53,5.35),.005,'DeepBronze')
    outline=[(0.03,5.37),(.14,5.34),(.255,5.26),(.285,5.17),(.247,5.07),(.13,5.00),(.061,4.988)]
    n=36;vv=[(6.76+r*cos(i*2*pi/n),2.53+r*sin(i*2*pi/n),z)for r,z in outline for i in range(n)]
    ff=[(j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n) for j in range(len(outline)-1) for i in range(n)]
    s.geometry(('Paper lantern','WarmLamp',0),vv,ff)
    for j in (1,3,5):
        r,z=outline[j]
        for i in range(n):
            a=2*pi*i/n;d=2*pi*(i+1)/n
            t((6.76+r*cos(a),2.53+r*sin(a),z),(6.76+r*cos(d),2.53+r*sin(d),z),.0016,'Teak',sides=5)
    # Guest desk and display share the declared vacant return cone.
    b((6.95,.08,4.104),(8.28,.80,4.15),'Teak',.011,'Desk top')
    for x in (6.982,8.185):
        b((x,.135,3.40),(x+.055,.74,4.105),'Teak',.008,'Desk trestles')
    b((7.12,.10,4.15),(7.28,.23,4.162),'Iron',.004,'Monitor foot')
    b((7.178,.134,4.16),(7.216,.165,4.30),'Iron',.003,'Monitor stem')
    b((6.966,.071,4.278),(7.434,.118,4.55),'Iron',.006,'Monitor case')
    s.plate([(7.42,.120,4.29),(6.98,.120,4.29),(6.98,.120,4.5375),(7.42,.120,4.5375)],'OfficeGlassBlank','OfficeScreen')
    b((6.96,.57,4.15),(7.22,.61,4.205),'DeepBronze',.0025,'Desk plate')
    s.label('Muhammed Favas K',(7.09,.612,4.178),.232,'BronzeLetter',False,.0009)
    # Offset guest seat under camera, sculpted upholstered back on its north side below seat-eye line.
    b((6.29,1.08,3.79),(6.81,1.54,3.88),'Cushion',.034,'Chair seat')
    b((6.29,1.50,3.86),(6.81,1.587,4.28),'Cushion',.035,'Chair back')
    for x in (6.32,6.78):
        for y in (1.13,1.51):
            t((x+.014,y+.014,3.40),(x,y,3.85),.018,'Teak',end_r=.027)
    for x in (6.262,6.79):
        b((x,1.14,3.989),(x+.049,1.54,4.024),'Teak',.01,'Chair arm caps')
        t((x+.02,1.18,3.83),(x+.02,1.18,3.998),.012,'Iron')

    # The two-flight circulation strip supports testing the measured arrival into the rough office.
    for i in range(10):
        tread=.23;rise=.163
        ya=6.98-(i+1)*tread
        b((1.10,ya,.15+i*rise),(2.26,ya+tread,.14+(i+1)*rise),'DryStone',.005,'West flight')
        ya=4.68+i*tread
        b((2.34,ya,1.76+i*rise),(3.50,ya+tread,1.77+(i+1)*rise),'DryStone',.005,'East flight')
    b((1.10,3.82,1.60),(3.50,4.68,1.77),'DryStone',.008,'Half landing')
    for x in (1.10,3.49):
        rev=x>2
        def elev(y):
            return (1.77+(y-4.68)*1.63/2.3) if rev else (.14+(6.98-y)*1.63/2.3)
        for y in (4.73,5.77,6.86):
            z=elev(y);t((x,y,z),(x,y,z+.93),.014,'Iron')
        t((x,4.67,elev(4.67)+.93),(x,6.98,elev(6.98)+.93),.024,'Teak')
    garden_spec=importlib.util.spec_from_file_location('east_garden',Path(__file__).with_name('east_garden.py'))
    garden_module=importlib.util.module_from_spec(garden_spec)
    garden_spec.loader.exec_module(garden_module)
    garden_module.build_garden(s)
    s.assemble()
    # Consolidate fixed geometry by material. The hinged leaf and two film elevations must
    # remain separate draws. An independent office set makes later streaming possible.
    sets=defaultdict(list)
    for obj in s.made:
        if obj.type!='MESH' or obj.name=='OfficeScreen':
            continue
        name=obj.name
        if obj.parent:zone='Door'
        elif name.startswith(('Pavement films','Road films')):zone=name.split(' ')[0]+'Film'
        elif name.startswith(('Guest','Office','Chair','Desk','Monitor','Letters Muhammed','Upper','Upstairs','Stone sill','West screen','East screen','Open screen','Upper window','Light valance','Panel grooves','Paper lantern','Wall wash','Roof lining','Parapet','Drip reveal')):zone='Upper'
        elif name.startswith(('Carriageway','Street flagstones','Lane paint','Footway','Kerb','Verge','Garden boundary','Boundary coping','Threshold drain','Drain bars','Dry threshold')):zone='Site'
        else:zone='Shell'
        sets[(zone,obj.data.materials[0].name)].append(obj)
    keep=[obj for obj in s.made if obj.type!='MESH' or obj.name=='OfficeScreen']
    for (zone,mat),objs in sets.items():
        bpy.ops.object.select_all(action='DESELECT')
        active=next((o for o in objs if o.name[:7]!='Letters'),objs[0])
        bpy.context.view_layer.objects.active=active
        for obj in objs:obj.select_set(True)
        if len(objs)>1:bpy.ops.object.join()
        active.name=zone+'_'+mat
        keep.append(active)
    return keep


if __name__=='__main__':
    bpy.ops.wm.read_factory_settings(use_empty=True)
    objects=build()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    dest=ROOT/'public/appointment/models/shell.glb';dest.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,
                              export_yup=True,export_cameras=False,export_lights=False,export_image_format='AUTO')
    print('Authored shell:',dest)
