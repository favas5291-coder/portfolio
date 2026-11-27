"""Original right-hand-drive hatchback. Coordinates in metres, east / north / up.

Run with blender -b --factory-startup -P scripts/gate1/car.py to produce the
standalone GLB. Import build(bpy) to place the same authored model in a bake.
"""
import math
from pathlib import Path

import bmesh
import numpy as np
from mathutils import Vector

CENTRE_Y = -6.70
HINGE = (7.83, -5.81, 0)
ASSET_DIR = Path(__file__).resolve().parents[2] / "public/appointment/models"


def build(bpy):
    scene = bpy.context.scene
    collection = bpy.data.collections.new("Kozhikode hatch")
    scene.collection.children.link(collection)

    def empty(name, position):
        obj = bpy.data.objects.new(name, None)
        collection.objects.link(obj)
        obj.location = position
        obj.empty_display_size = 0.08
        return obj

    root = empty("ArrivalCar", (0, 0, 0))
    door = empty("PassengerHinge", HINGE)
    door.parent = root
    door["swingDeg"] = -68
    root["author"] = "Fazhere Studio / original Appointment model"
    root["dimensionsMetres"] = [4.30, 1.76, 1.51]
    root["wheelbaseMetres"] = 2.72

    def mat(name, color, roughness, metal=0, coat=0):
        m = bpy.data.materials.new("Car | " + name)
        m.diffuse_color = (*color, 1)
        m.use_nodes = True
        p = m.node_tree.nodes.get("Principled BSDF")
        for key, v in (("Base Color", (*color, 1)), ("Roughness", roughness),
                       ("Metallic", metal), ("Coat Weight", coat), ("Coat Roughness", 0.115)):
            p.inputs[key].default_value = v
        return m

    paint = mat("Mineral green metallic enamel", (0.086, 0.214, 0.206), 0.245, 0.58, 0.65)
    rubber = mat("Black EPDM", (0.015, 0.019, 0.019), 0.68)
    felt = mat("Window channel flock", (0.014, 0.016, 0.016), 0.96)
    leather = mat("Graphite grained trim", (0.047, 0.056, 0.055), 0.61)
    cloth = mat("Warm grey seat textile", (0.194, 0.173, 0.14), 0.87)
    silver = mat("Satin anodized aluminium", (0.43, 0.46, 0.46), 0.29, 0.83)
    pale = mat("Warm top stitching", (0.38, 0.335, 0.26), 0.88)
    bright = mat("Machined wheel faces", (0.56, 0.60, 0.61), 0.19, 0.9)
    wheel_dark = mat("Graphite wheel barrel", (0.056, 0.063, 0.063), 0.36, 0.74)
    disc = mat("Brake rotor", (0.22, 0.22, 0.21), 0.4, 0.88)
    reflector = mat("Mirror silver", (0.80, 0.87, 0.88), 0.075, 0.94, 0.20)
    lamp_red = mat("Garnet lamp prism", (0.375, 0.007, 0.012), 0.19, 0.3, 0.6)
    lamp_frost = mat("Opal lamp diffuser", (0.68, 0.73, 0.73), 0.17, 0.33, 0.45)
    glass = mat("Barely tinted laminated glass", (0.66, 0.81, 0.80), 0.09, 0.12, 0.2)
    p = glass.node_tree.nodes.get("Principled BSDF")
    p.inputs["Alpha"].default_value = 0.10
    glass.surface_render_method = "BLENDED"
    glass.diffuse_color = (0.66, 0.81, 0.80, 0.1)
    glass.use_backface_culling = True

    def grain(m, style, color):
        # Finite, tileable microstructure. One UV unit represents one metre.
        n = 128
        y, x = np.mgrid[0:n, 0:n]
        rng = np.random.default_rng(97 if style == "grain" else 113)
        if style == "grain":
            grid = 16
            jitter = rng.uniform(0.1, 0.9, size=(grid, grid, 2))
            cx, cy = x // 8, y // 8
            distances = []
            for j in [-1, 0, 1]:
                for i in [-1, 0, 1]:
                    off = jitter[(cy+j) % grid, (cx+i) % grid]
                    dx = i + off[:,:,0] - (x%8)/8
                    dy = j + off[:,:,1] - (y%8)/8
                    distances.append(dx*dx+dy*dy)
            first, second = np.partition(distances, 1, axis=0)[:2]
            h = np.clip((np.sqrt(second)-np.sqrt(first))*4.0, 0, 1)
        else:
            warp = (x + 1.6 * np.sin(2*math.pi*y/16))/4
            weft = (y + 0.9 * np.sin(2*math.pi*x/16))/4
            h = 0.5+0.24*np.sin(2*math.pi*warp)+0.21*np.sin(2*math.pi*weft)
        h = h + rng.random((n,n))*0.12
        nodes = m.node_tree.nodes
        links = m.node_tree.links
        shader = nodes.get("Principled BSDF")
        mapping = nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (14, 14, 1)
        uv = nodes.new("ShaderNodeTexCoord")
        links.new(uv.outputs["UV"], mapping.inputs["Vector"])
        def image_node(suffix, rgb, noncolor):
            img = bpy.data.images.new("Car "+style+" "+suffix, n,n,alpha=False)
            if noncolor:
                img.colorspace_settings.name = "Non-Color"
            rgba = np.concatenate([rgb, np.ones((n,n,1))], axis=2)
            img.pixels.foreach_set(rgba.reshape(-1).astype("float32"))
            img.pack()
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = img
            links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
            return tex.outputs["Color"]
        # For sRGB input Blender's image API accepts encoded values. These byte
        # colours decode to material-linear graphite/linen values in both paths.
        tone = (np.array(color)**(1/2.2))[None,None,:]*(0.85+0.21*h[:,:,None])
        albedo = image_node("albedo", tone, False)
        links.new(albedo, shader.inputs["Base Color"])
        dx = (np.roll(h,1,1)-np.roll(h,-1,1)) * 0.42
        dy = (np.roll(h,1,0)-np.roll(h,-1,0)) * 0.42
        normals = np.stack((dx,dy,np.ones_like(dx)),axis=2)
        normals = 0.5 + 0.5*normals/np.linalg.norm(normals,axis=2)[:,:,None]
        normal = nodes.new("ShaderNodeNormalMap")
        links.new(image_node("normal", normals, True), normal.inputs["Color"])
        links.new(normal.outputs["Normal"], shader.inputs["Normal"])
        rough = np.clip((0.63 if style == "grain" else 0.90) - (h-.5)*0.12,0,1)
        cavity = 0.91 + 0.09*np.clip(h,0,1)
        packed = np.stack((cavity,rough,np.zeros_like(rough)),axis=2)
        separate = nodes.new("ShaderNodeSeparateColor")
        links.new(image_node("surface",packed,True),separate.inputs[0])
        links.new(separate.outputs["Green"],shader.inputs["Roughness"])
        links.new(separate.outputs["Blue"],shader.inputs["Metallic"])
        gltf = bpy.data.node_groups.get("glTF Material Output")
        if gltf is None:
            gltf = bpy.data.node_groups.new("glTF Material Output","ShaderNodeTree")
            gltf.interface.new_socket(name="Occlusion",in_out="INPUT",socket_type="NodeSocketFloat")
        output = nodes.new("ShaderNodeGroup")
        output.node_tree = gltf
        links.new(separate.outputs["Red"],output.inputs["Occlusion"])
    grain(leather, "grain", (0.047,0.056,0.055))
    grain(cloth, "weave", (0.194,0.173,0.14))

    def mesh(name, points, faces, material, parent=root, bevel=0, closed=True, smooth=True):
        anchor = Vector(HINGE) if parent == door else Vector((0,0,0))
        data = bpy.data.meshes.new(name)
        data.from_pydata([Vector(p)-anchor for p in points], [], faces)
        data.materials.append(material)
        if closed:
            bm = bmesh.new()
            bm.from_mesh(data)
            bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
            bm.to_mesh(data)
            bm.free()
        data.update()
        uv = data.uv_layers.new(name="Metres")
        for f in data.polygons:
            f.use_smooth = smooth
            axis = max(range(3), key=lambda a: abs(f.normal[a]))
            for idx in f.loop_indices:
                co = data.vertices[data.loops[idx].vertex_index].co
                uv.data[idx].uv = ((co.y, co.z), (co.x,co.z), (co.x,co.y))[axis]
        obj = bpy.data.objects.new(name, data)
        collection.objects.link(obj)
        obj.parent = parent
        if bevel:
            mod = obj.modifiers.new("Tool radii", "BEVEL")
            mod.width = bevel
            mod.segments = 3
            mod.affect = "EDGES"
            mod.limit_method = "ANGLE"
            mod.angle_limit = 0.40
            mod.harden_normals = True
            normal = obj.modifiers.new("Pressed normals", "WEIGHTED_NORMAL")
            normal.keep_sharp = True
        return obj

    def loft(name, rings, material, parent=root, bevel=0, closed=True):
        sides = len(rings[0])
        points = sum(rings, [])
        faces = [(i*sides+j, i*sides+(j+1)%sides, (i+1)*sides+(j+1)%sides, (i+1)*sides+j)
                 for i in range(len(rings)-1) for j in range(sides)]
        if closed:
            faces += [tuple(reversed(range(sides))),tuple(range(len(points)-sides,len(points)))]
        return mesh(name,points,faces,material,parent,bevel,closed)

    def tube(name,line,radius,material,parent=root,radii=None,sides=9):
        rings = []
        last = None
        for i,p in enumerate(line):
            t = (Vector(line[min(i+1,len(line)-1)])-Vector(line[max(i-1,0)])).normalized()
            if last is None:
                last = Vector((0,0,1)) if abs(t.z)<0.94 else Vector((0,1,0))
            u = (last-t*last.dot(t)).normalized()
            v = t.cross(u)
            last = u
            r = radius if radii is None else radii[i]
            rings.append([tuple(Vector(p)+r*(u*math.cos(a*math.tau/sides)+v*math.sin(a*math.tau/sides))) for a in range(sides)])
        return loft(name,rings,material,parent)

    def panel(name, outline, y0, y1, material,parent=root,bevel=0.006):
        return loft(name,[[(x,y,z) for x,z in outline] for y in (y0,y1)],material,parent,bevel)

    def capsule(name, rows, material, parent=root, power=0.55):
        # Longitudinal sections of stamped/foamed forms; rows are x, centre y,
        # half-width, bottom and top. The cross section is a superellipse.
        rings=[]
        for x,cy,w,b,t in rows:
            r=[]
            for i in range(24):
                a=math.tau*i/24
                s,c=math.sin(a),math.cos(a)
                r.append((x, cy+w*math.copysign(abs(c)**power,c),
                          (b+t)/2+(t-b)/2*math.copysign(abs(s)**power,s)))
            rings.append(r)
        return loft(name,rings,material,parent)

    def body_part(name, sections, material):
        return capsule(name,[(x,CENTRE_Y,w,b,t) for x,w,b,t in sections],material)

    body_part("Pressed floor pan", [(4.29,.66,.28,.44),(4.42,.76,.24,.46),
        (5.55,.66,.22,.42),(6.60,.67,.22,.41),(7.67,.67,.24,.42),(8.37,.70,.28,.48)],rubber)
    body_part("Bonnet crown",[(7.89,.695,.780,.893),(7.945,.79,.746,.900),(8.015,.805,.694,.875),
        (8.24,.808,.64,.81),(8.44,.735,.595,.745),(8.50,.66,.574,.692)],paint)
    body_part("Front valance",[(8.12,.798,.265,.59),(8.35,.802,.255,.602),
        (8.48,.727,.28,.589),(8.55,.56,.325,.548)],paint)
    body_part("Tailgate waist",[(4.25,.61,.46,.82),(4.31,.75,.43,.897),(4.50,.82,.46,.94),
        (4.68,.80,.50,.94)],paint)
    body_part("Rear apron",[(4.25,.59,.33,.51),(4.30,.75,.285,.559),(4.46,.817,.252,.574),(4.61,.81,.26,.545)],paint)
    body_part("Roof outer pressing",[(4.63,.45,1.367,1.389),(4.77,.696,1.408,1.457),
        (5.03,.781,1.435,1.493),(5.69,.799,1.443,1.51),(6.81,.798,1.444,1.51),
        (7.29,.783,1.443,1.499),(7.48,.743,1.442,1.480),(7.56,.60,1.432,1.458)],paint)
    body_part("Headliner",[(4.83,.606,1.391,1.407),(5.1,.719,1.404,1.426),
        (6.9,.743,1.415,1.466),(7.38,.720,1.418,1.455)],cloth)
    def glass_strip(name, top, bottom, material=glass):
        rings=[]
        for i in range(17):
            t=-1+2*i/16
            bx, bw, bz=bottom
            tx, tw, tz=top
            bow=1-t*t
            rings.append([(bx+.035*bow,CENTRE_Y+t*bw,bz+.018*bow),
                          (tx+.018*bow,CENTRE_Y+t*tw,tz+.014*bow)])
        pts=sum(rings,[])
        return mesh(name,pts,[(2*i,2*i+2,2*i+3,2*i+1) for i in range(16)],material,closed=False)
    glass_strip("Curved windscreen",(7.49,.73,1.46),(7.95,.80,.916))
    glass_strip("Liftgate glass",(4.76,.675,1.425),(4.37,.756,.929))
    wheel_x=(5.03,7.75)
    def arch_base(x):
        h=.30
        for hub in wheel_x:
            d=abs(x-hub)
            if d<.357:
                h=max(h, .32+math.sqrt(.357**2-d**2))
        return h

    def flank(name,a,b,sign,parent):
        xs=sorted(set([a,b]+[a+(b-a)*i/32 for i in range(1,32)]
                      +[w+.357*math.cos(i*math.pi/30) for w in wheel_x for i in range(31)
                        if a<w+.357*math.cos(i*math.pi/30)<b]))
        rows=[]
        for x in xs:
            top=.906 + .031*math.exp(-((x-5.0)/.84)**2)-.280*max(x-7.68,0)**1.4
            bottom=arch_base(x)
            taper=.123*(max(4.71-x,0)/.46)**1.6+.16*(max(x-8.10,0)/.45)**1.8
            outer=.874-taper
            shoulder=.018*sum(math.exp(-((x-hub)/.56)**2) for hub in wheel_x)
            dy=-.011+.009*math.cos((x-6.5)*1.4)
            rows.append([(x,CENTRE_Y+sign*(w+dy),z) for w,z in [
                (outer-.092,bottom+.009),(outer-.053,bottom),(outer-.043,bottom+.025),
                (outer-.041+shoulder*.4,bottom+(top-bottom)*.18),
                (outer-.019+shoulder*.8,bottom+(top-bottom)*.47),
                (outer-.005+shoulder,bottom+(top-bottom)*.64),
                (outer+.002+shoulder,bottom+(top-bottom)*.74),
                (outer-.004+shoulder,top-.103),(outer-.009+shoulder*.8,top-.075),
                (outer-.030+shoulder*.55,top-.036),(outer-.052,top),
                (outer-.080,top-.005)]])
        return loft(name,rows,paint,parent,0.002)

    for sign in (-1,1):
        side = "Kerb " if sign==1 else "Road "
        # Door seams and wheel arch openings are cut into the sheet metal profile.
        for a,b,label,is_door in [(4.31,5.16,"rear quarter",False),(5.171,6.366,"rear leaf",False),
                                  (6.380,7.82,"front leaf",True),(7.834,8.47,"front wing",False)]:
            parent = door if is_door and sign==1 else root
            flank(side+label,a,b,sign,parent)
        y=lambda w: CENTRE_Y+sign*w
        tube(side+"roof drip moulding",[(4.87,y(.687),1.459),(5.06,y(.722),1.484),
            (5.73,y(.733),1.492),(6.85,y(.736),1.493),(7.27,y(.718),1.482),
            (7.43,y(.696),1.465)],.006,rubber)
        tube(side+"rocker hem",[(5.39,y(.827),.292),(5.57,y(.850),.267),
            (7.16,y(.851),.266),(7.36,y(.834),.290)],.027,paint)
        # Fixed cabin pillars outside the designed clear front side aperture.
        panel(side+"rear sail",[(4.42,.91),(4.70,1.402),(4.87,1.45),(5.10,1.450),(4.91,.94)],
              y(.782),y(.833),paint,bevel=.018)
        panel(side+"B-post",[(6.263,.893),(6.299,1.456),(6.402,1.456),(6.404,.893)],
              y(.78),y(.837),rubber,bevel=.011)
        panel(side+"windscreen pillar",[(7.556,1.455),(7.474,1.454),(7.781,.899),(7.939,.902)],
              y(.747),y(.805),paint,bevel=.014)
        panel(side+"rear side glass",[(4.90,.94),(5.08,1.422),(6.276,1.431),(6.250,.927)],
              y(.805),y(.809),glass,bevel=.001)
        moving = door if sign==1 else root
        # Side glass and header are very slightly crowned, preserving view to office.
        line=[(6.425,y(.872),.909),(6.427,y(.866),1.399),(6.463,y(.853),1.433),
              (6.60,y(.849),1.445),(7.399,y(.849),1.445),(7.465,y(.846),1.427),
              (7.730,y(.835),.969),(7.782,y(.849),.911)]
        tube(side+"door upper rolled frame",line,.022,paint,moving)
        tube(side+"flocked glass run",[(x,y1-sign*.014,z-.010) for x,y1,z in line],.0125, felt,moving)
        panel(side+"front side glass",[(6.448,.905),(6.450,1.404),(6.475,1.424),
            (7.417,1.428),(7.450,1.412),(7.75,.91)],y(.858),y(.862),glass,moving,.001)
        cap=[(6.383,y(.829),.901),(6.52,y(.831),.909),(6.88,y(.832),.911),
             (7.35,y(.830),.908),(7.725,y(.815),.896),(7.813,y(.785),.889)]
        tube(side+"outer brightwork",[(x,y1+sign*.024,z-.005) for x,y1,z in cap],.009,silver,moving)
        tube(side+"EPDM outer wiper",cap,.0105,rubber,moving)
        for x in [5.36,6.61]:
            owner = moving if x>6 else root
            capsule(side+"floating door pull",[(x-.096,y(.866),.008,.786,.799),
                (x-.077,y(.885),.023,.776,.804),(x+.036,y(.906),.020,.777,.805),
                (x+.096,y(.877),.012,.782,.801)],paint,owner)

    # Layered door card, stepped padded belt and pocket. Make the pull bowl
    # a true deep-drawn recess with an open mouth, sloped walls and a back.
    def card(name, contour, surface, thickness,material,bevel):
        return panel(name,contour,surface,surface+thickness,material,door,bevel)
    outline=[(6.405,.359),(6.409,.871),(6.464,.903),(7.756,.889),(7.800,.855),
             (7.806,.701),(7.572,.638),(7.44,.461),(7.405,.342),(6.49,.319)]
    card("Flocked backing and edge return",outline,-5.915,.008,rubber,.015)
    lower=[(6.417,.361),(6.422,.715),(6.51,.745),(7.389,.707),(7.739,.698),
           (7.737,.665),(7.52,.578),(7.39,.344),(6.52,.332)]
    card("Lower molded door bin",lower,-5.938,.043,leather,.021)
    card("Inner soft belt",[(6.418,.799),(6.422,.866),(6.463,.903),(7.761,.888),
            (7.789,.846),(7.749,.812),(7.495,.79),(6.84,.803)],-5.955,.075,leather,.016)
    # The deep two-piece belt falls towards the cabin. The near face is padded,
    # the outboard return catches the sky and compresses against the fixed pane.
    # Raised from the initial trim after looking through both final lenses.
    xs=[6.42,6.49,6.64,6.93,7.20,7.45,7.60,7.75,7.79]
    dz=[-.031,-.007,0,.004,.002,-.001,-.004,-.018,-.033]
    section=[(-5.861,.913),(-5.861,.974),(-5.870,.990),(-5.885,.995),
             (-5.899,.993),(-5.927,.986),(-5.951,.977),(-5.970,.968),
             (-5.979,.955),(-5.978,.939),(-5.967,.923),(-5.932,.892),(-5.891,.892)]
    loft("Padded rising belt rail", [[(x,y,z+height) for y,z in section]
         for x,height in zip(xs,dz)],leather,door,.003)
    tube("Twin-lip belt glass scraper",[(x,-5.855,.986+height) for x,height in zip(xs,dz)],
         .0085,rubber,door)
    tube("Belt hinge side pressed seam",[(x,-5.948,.980+height) for x,height in zip(xs,dz)],
         .0022,felt,door,sides=6)
    for i in range(109):
        x=6.446+i*.0121
        h=float(np.interp(x,xs,dz))
        tube("Belt bonded topstitch",[(x,-5.947,.9822+h),(x+.007,-5.947,.9822+h)],
             .00072,pale,door,sides=5)
    tube("Continuous interior window seal",[(6.424,-5.893,.910),(6.567,-5.899,.914),
        (6.94,-5.899,.915),(7.43,-5.898,.913),(7.747,-5.885,.904)],.0135,rubber,door)
    trim_line=[(6.448,-5.963,.817),(6.68,-5.966,.825),(6.90,-5.969,.815),
        (7.17,-5.966,.800),(7.44,-5.960,.799),(7.744,-5.944,.815)]
    tube("Brushed continuous belt fillet",trim_line,.0070,silver,door)
    card("Inset wing pad",[(6.434,.727),(6.506,.809),(6.693,.816),(6.97,.801),
         (7.187,.775),(7.099,.635),(6.638,.66)],-5.956,.032,cloth,.015)
    arm_rows=[(6.455,-5.948,.033,.638,.671),(6.539,-5.979,.059,.625,.702),
        (6.714,-5.995,.067,.629,.712),(7.05,-5.977,.057,.637,.697),
        (7.207,-5.948,.042,.664,.724)]
    capsule("Stitched armrest",arm_rows,leather,door)
    pocket=[(6.483,-5.984,.473),(6.548,-5.999,.478),(6.822,-5.996,.459),
            (7.025,-5.986,.466),(7.128,-5.963,.514)]
    tube("Map pocket rolled mouth",pocket,.014,leather,door)
    def roundrect(cx,cz,w,h,r):
        p=[]
        for sx,sz,deg in [(1,1,0),(-1,1,90),(-1,-1,180),(1,-1,270)]:
            for j in range(6):
                a=math.radians(deg+90*j/5)
                p.append((cx+sx*(w/2-r)+r*math.cos(a),cz+sz*(h/2-r)+r*math.sin(a)))
        return p
    def bowl(name,cx,cz,rows,material):
        rings=[[(x,y,z) for x,z in roundrect(cx,cz,w,h,r)] for y,w,h,r in rows]
        n=len(rings[0]); points=sum(rings,[])
        faces=[(k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i)
               for k in range(len(rings)-1) for i in range(n)]
        faces.append(tuple(range(len(points)-n,len(points))))
        return mesh(name,points,faces,material,door,closed=False)
    bowl("Recessed latch escutcheon",7.413,.746,[(-5.963,.393,.113,.040),
         (-5.969,.380,.108,.037),(-5.967,.345,.085,.032),
         (-5.939,.299,.066,.027),(-5.925,.257,.051,.022)],rubber)
    capsule("Cast interior release lever",[(7.282,-5.950,.005,.747,.757),
       (7.304,-5.961,.008,.740,.760),(7.414,-5.955,.012,.736,.758),
       (7.503,-5.941,.011,.739,.763),(7.527,-5.932,.014,.743,.764)],silver,door)
    def thread_point(x):
        i=next(k for k,row in enumerate(arm_rows[1:]) if row[0]>=x)
        a,b=arm_rows[i],arm_rows[i+1]
        v=(x-a[0])/(b[0]-a[0])
        _,cy,w,base,top=[a[k]*(1-v)+b[k]*v for k in range(5)]
        angle=math.radians(145)
        return (x,cy-w*abs(math.cos(angle))**.55-.001,
                (base+top)/2+(top-base)*.5*math.sin(angle)**.55+.0006)
    for i in range(52):
        x=6.505+i*.0123
        tube("Armrest saddle stitch",[thread_point(x),thread_point(x+.0065)],
             .00082,pale,door,sides=5)

    # Wire-frame mirror support grows from the quarterlight triangle. The lens
    # and the body share the same pressure-cast pivot as the passenger door.
    for s in (-1,1):
        y=lambda w:CENTRE_Y+s*w
        owner=door if s==1 else root
        panel("Mirror sail",[(7.615,.90),(7.748,1.015),(7.806,.907)],y(.854),y(.884),rubber,owner,.008)
        tube("Mirror folding foot",[(7.725,y(.866),.938),(7.635,y(.962),.959),
            (7.603,y(1.045),1.004)],.032,rubber,owner,radii=[.044,.029,.044])
        capsule("Mirror enamel cap",[(7.487,y(1.116),.078,1.028,1.086),
            (7.504,y(1.110),.123,.989,1.117),(7.543,y(1.107),.132,.974,1.128),
            (7.600,y(1.099),.114,.981,1.124),(7.644,y(1.070),.068,1.004,1.105)],
              paint,owner)
        # Convex mirror lens faces aft and inboard, catching the sky.
        rings=[]
        for size,off in [(1,0),(.950,-.004),(.70,-.007),(.29,-.009),(.02,-.010)]:
            r=[]
            for i in range(32):
                a=i*math.tau/32; c=math.cos(a); si=math.sin(a)
                u=.113*size*math.copysign(abs(c)**.72,c)
                zz=.055*size*math.copysign(abs(si)**.67,si)
                r.append((7.482+off-.22*u, y(1.107+u),1.052+zz+.066*u))
            rings.append(r)
        loft("Mirror reflective lens",rings,reflector,owner)
        tube("Mirror lens compression seal",rings[0]+[rings[0][0]],.0061,rubber,owner)

    # Each tyre section contains both bead seats and a gently flattened
    # contact patch. Machined rim, split spokes and rotor sit at separate depths.
    for hub_x in wheel_x:
        for side in (-1,1):
            cy=CENTRE_Y+side*.810
            cz=.321
            label=("Front " if hub_x>6 else "Rear ")+("kerb" if side==1 else "road")
            def wheel_turn(name,profile,material,steps=64,contact=False):
                rings=[]
                for radius, depth in profile:
                    ring=[]
                    for k in range(steps):
                        a=math.tau*k/steps
                        z=cz+radius*math.sin(a)
                        ring.append((hub_x+radius*math.cos(a),cy+depth*side,max(.021,z) if contact else z))
                    rings.append(ring)
                return loft(label+" "+name,rings,material,closed=False)
            wheel_turn("tyre casing",[(.205,-.091),(.249,-.099),(.285,-.093),(.304,-.083),
                (.317,-.065),(.322,-.040),(.321,-.032),(.317,-.028),(.322,-.023),
                (.323,-.009),(.323,.010),(.318,.014),(.323,.020),(.323,.043),
                (.321,.055),(.318,.066),(.308,.080),(.287,.091),(.270,.097),
                (.258,.100),(.253,.100),(.250,.097),(.232,.094),(.214,.090),
                (.204,.090),(.200,.076),(.205,-.091)],rubber,contact=True)
            wheel_turn("tyre mold line",[(.268,.097),(.269,.099),(.271,.099),(.272,.097)],rubber)
            wheel_turn("wheel barrel",[(.205,-.08),(.205,.078),(.209,.085),(.209,.091),
                (.195,.093),(.183,.080),(.181,-.07),(.205,-.08)],wheel_dark)
            wheel_turn("lathed rim lip",[(.197,.088),(.200,.095),(.207,.095),(.209,.090)],bright)
            wheel_turn("brake disc",[(.060,.024),(.151,.024),(.161,.028),(.161,.037),(.060,.037)],disc)
            wheel_turn("disc bell",[(.04,.040),(.082,.034),(.095,.027)],wheel_dark,32)
            wheel_turn("lug cover",[(.008,.10),(.050,.10),(.070,.092),(.083,.080),(.079,.058)],wheel_dark,32)
            for k in range(5):
                a=math.tau*k/5
                for direction in (-1,1):
                    corners=[(.061,-.13,.089),(.079,-.096,.088),(.191,.135,.080),
                             (.194,.24,.080),(.166,.225,.090),(.082,.111,.097)]
                    rings=[]
                    for back in [0,-.016]:
                        r=[]
                        for radius,turn,depth in corners:
                            ang=a+direction*turn
                            r.append((hub_x+radius*math.cos(ang),cy+side*(depth+back),
                                      cz+radius*math.sin(ang)))
                        rings.append(r)
                    loft(label+" split spoke",rings,bright,bevel=.002)
                lx=hub_x+.044*math.cos(a)
                lz=cz+.044*math.sin(a)
                tube(label+" countersunk wheel bolt",[(lx,cy+side*.098,lz),
                     (lx,cy+side*.104,lz)],.008,bright,sides=6)
            wheel_turn("centre medallion",[(.004,.103),(.027,.102),(.030,.099)],silver,32)
            # The wheelhouses have visible depth behind the painted arch.
            tunnel=[]
            for i in range(33):
                a=math.pi*i/32
                tunnel.append([(hub_x+r*math.cos(a),CENTRE_Y+side*w,cz+r*math.sin(a))
                     for w,r in [(0.63,.350),(.70,.353),(.82,.349),(.847,.352)]])
            pts=sum(tunnel,[])
            mesh(label+" wheel well",pts,[(i*4+j,i*4+j+1,(i+1)*4+j+1,(i+1)*4+j)
              for i in range(32) for j in range(3)],felt,closed=False)

    # RHD cabin: bolstered seat, fabric inserts and rear bench are visible when
    # the open door is seen in reflection and from above the canopy.
    for sy in (CENTRE_Y-.43,CENTRE_Y+.43):
        def seatpiece(name,rows,m):
            return capsule(name,[(x,sy+dy,w,b,t) for x,dy,w,b,t in rows],m)
        seatpiece("Seat cushion shell",[(6.41,0,.188,.345,.575),(6.47,0,.227,.332,.594),
            (6.79,0,.241,.345,.573),(7.06,0,.223,.370,.560),(7.12,0,.181,.393,.525)],leather)
        seatpiece("Seat cushion insert",[(6.48,0,.141,.559,.588),(6.67,0,.157,.554,.582),
            (6.98,0,.156,.539,.568),(7.065,0,.137,.525,.555)],cloth)
        for dy in (-.18,.18):
            seatpiece("Cushion side bolster",[(6.45,dy,.036,.517,.599),(6.56,dy,.059,.516,.637),
                (6.90,dy,.052,.513,.615),(7.06,dy,.038,.508,.571)],leather)
        # Swept, progressively narrowing backrest angles towards the rear.
        def backrest(name,y,levels,m):
            rings=[]
            for z,x,w,t in levels:
                rings.append([(x+t*math.copysign(abs(math.cos(i*math.tau/24))**.64,math.cos(i*math.tau/24)),
                     y+w*math.copysign(abs(math.sin(i*math.tau/24))**.57,math.sin(i*math.tau/24)),z) for i in range(24)])
            return loft(name,rings,m)
        backrest("Contoured seat back",sy,[(.50,6.50,.184,.090),(.58,6.489,.227,.094),
            (.751,6.452,.220,.085),(.934,6.40,.209,.077),(1.041,6.361,.174,.061),
            (1.053,6.357,.129,.055)],leather)
        backrest("Woven backrest insert",sy,[(.593,6.576,.137,.012),(.75,6.535,.152,.012),
            (.934,6.481,.147,.012),(1.014,6.423,.126,.018)],cloth)
        for off in (-.072,.072):
            tube("Headrest post",[(6.349,sy+off,1.029),(6.337,sy+off,1.125)],.008,silver)
        backrest("Head restraint",sy,[(1.104,6.335,.111,.042),(1.127,6.326,.137,.067),
            (1.244,6.303,.140,.073),(1.283,6.302,.117,.057)],leather)

    body_part("Rear seat base",[(5.18,.55,.39,.54),(5.28,.675,.36,.58),
        (5.65,.67,.384,.57),(5.73,.59,.42,.54)],cloth)
    body_part("Rear bench back",[(4.992,.56,.55,1.04),(5.052,.645,.52,1.062),(5.205,.64,.53,.92)],leather)
    body_part("Glare-free dashboard",[(7.471,.651,.609,.832),(7.50,.752,.612,.863),(7.60,.798,.617,.892),
        (7.768,.783,.631,.901),(7.95,.72,.658,.891)],leather)
    for v in range(4):
        x=7.478-v*.002
        tube("Vent blade",[(x,-6.335,.776+v*.010),(x,-6.092,.778+v*.010)],.003, wheel_dark)
    tube("Steering column",[(7.60,-7.11,.677),(7.404,-7.11,.815)],.041,rubber)
    steer=[(7.376+.055*math.sin(i*math.tau/48),-7.11+.171*math.cos(i*math.tau/48),
            .832+.153*math.sin(i*math.tau/48)) for i in range(49)]
    tube("Stitched steering wheel",steer,.020,leather)
    for a in (.23,2.91,4.71):
        tube("Steering wheel spoke",[(7.391,-7.11,.829),
             (7.376+.055*math.sin(a),-7.11+.159*math.cos(a),.832+.150*math.sin(a))],.024,wheel_dark)
    capsule("Padded steering wheel boss",[(7.34,-7.11,.070,.786,.862),
        (7.367,-7.11,.085,.779,.868),(7.418,-7.11,.066,.787,.858)],leather)
    for s in (-1,1):
        y=lambda w:CENTRE_Y+s*w
        tube("Swept front light",[(8.20,y(.794),.739),(8.32,y(.783),.716),
            (8.431,y(.734),.685),(8.478,y(.637),.681),(8.49,y(.528),.679)],.023,lamp_frost,
            radii=[.011,.025,.034,.029,.013])
        tube("Rear combination light",[(4.494,y(.826),.869),(4.367,y(.812),.861),
            (4.297,y(.760),.849),(4.270,y(.664),.842),(4.26,y(.475),.834)],.029,lamp_red)
        for x,w,z in [(8.482,.676,.46),(4.291,.655,.404)]:
            tube("Bumper reflector",[(x,y(w-.092),z),(x,y(w),z+.003)],.010,
                 lamp_red if x<5 else lamp_frost)
    mouth=[(8.52,-7.207,.443),(8.533,-7.173,.398),(8.540,-6.93,.366),
           (8.541,-6.70,.359),(8.540,-6.47,.366),(8.533,-6.227,.398),(8.52,-6.193,.443)]
    for k in range(3):
        tube("Front intake horizontal louvre",[(x+.004*k,y,z+.023*k) for x,y,z in mouth],.012,rubber)

    # Consolidate stationary and moving batches independently to bound draw
    # calls. Modifiers are evaluated once; each parent retains its hinge space.
    deps=bpy.context.evaluated_depsgraph_get()
    bpy.context.view_layer.update()
    groups={}
    for obj in list(collection.objects):
        if obj.type=="MESH":
            groups.setdefault((obj.parent,obj.data.materials[0]),[]).append(obj)
    for (owner,material),objs in groups.items():
        if len(objs)<2:
            continue
        bm=bmesh.new()
        for obj in objs:
            evaluated=obj.evaluated_get(deps)
            data=evaluated.to_mesh(preserve_all_data_layers=True,depsgraph=deps)
            bm.from_mesh(data)
            evaluated.to_mesh_clear()
        data=bpy.data.meshes.new(material.name+" batched")
        bm.to_mesh(data)
        bm.free()
        data.materials.append(material)
        merged=bpy.data.objects.new(owner.name+" / "+material.name.replace("Car | ",""),data)
        collection.objects.link(merged)
        merged.parent=owner
        for obj in objs:
            original=obj.data
            bpy.data.objects.remove(obj,do_unlink=True)
            if original.users==0:
                bpy.data.meshes.remove(original)
    bpy.context.view_layer.update()
    return root


if __name__=="__main__":
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build(bpy)
    ASSET_DIR.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(ASSET_DIR/"car.glb"),export_format="GLB",
        export_yup=True,export_apply=True,export_extras=True,export_cameras=False,
        export_lights=False,export_animations=False)
