"""Original ENU (east, north, up) rain tree authored for Fazhere Studio.

Build in Blender with build(bpy) or export this asset alone with
blender -b --threads 2 --python scripts/gate1/tree.py
"""

import random
import sys
import tempfile
from math import atan2, cos, pi, sin, tau
from pathlib import Path

from mathutils import Vector
from mathutils.kdtree import KDTree

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
from tree_surfaces import bake
from verge import plant


def material(bpy, name, base, rough):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*base, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*base, 1)
    p.inputs["Roughness"].default_value = rough
    return m, p


def surfaces(bpy, tmp):
    bake(tmp)

    def texture(m, filename, space):
        im = bpy.data.images.load(str(tmp / filename))
        im.colorspace_settings.name = space
        im.pack()
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = im
        return t

    bark, b = material(bpy, "Rain tree • damp fissured bark", (0.20, 0.14, 0.10), 0.82)
    c = texture(bark, "bark.jpg", "sRGB")
    n = texture(bark, "bark-normal.png", "Non-Color")
    orm = texture(bark, "bark-orm.png", "Non-Color")
    nodes = bark.node_tree.nodes
    link = bark.node_tree.links.new
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = 0.8
    channels = nodes.new("ShaderNodeSeparateColor")
    link(c.outputs["Color"], b.inputs["Base Color"])
    link(n.outputs["Color"], normal.inputs["Color"])
    link(normal.outputs[0], b.inputs["Normal"])
    link(orm.outputs["Color"], channels.inputs[0])
    link(channels.outputs["Green"], b.inputs["Roughness"])
    link(channels.outputs["Blue"], b.inputs["Metallic"])
    ao_group = (
        bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        if not bpy.data.node_groups.get("glTF Material Output")
        else bpy.data.node_groups.get("glTF Material Output")
    )
    if not ao_group.interface.items_tree.get("Occlusion"):
        ao_group.interface.new_socket(
            name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat"
        )
    ao = nodes.new("ShaderNodeGroup")
    ao.node_tree = ao_group
    link(channels.outputs["Red"], ao.inputs["Occlusion"])
    leaf, l = material(bpy, "Rain tree • paired leaflets", (0.12, 0.23, 0.06), 0.71)
    c = texture(leaf, "compound-leaves.png", "sRGB")
    nodes = leaf.node_tree.nodes
    link = leaf.node_tree.links.new
    link(c.outputs["Color"], l.inputs["Base Color"])
    # A binary mask keeps depth order stable in a canopy with many overlapping leaves.
    mask = nodes.new("ShaderNodeMath")
    mask.operation = "GREATER_THAN"
    mask.inputs[1].default_value = 0.29
    link(c.outputs["Alpha"], mask.inputs[0])
    link(mask.outputs[0], l.inputs["Alpha"])
    leaf.use_backface_culling = False
    leaf.surface_render_method = "DITHERED"
    return bark, leaf


class Geometry:
    def __init__(self):
        self.verts = []
        self.polys = []
        self.uvs = []

    def object(self, bpy, name, mat):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.verts, [], self.polys)
        mesh.update()
        o = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(o)
        o.data.materials.append(mat)
        if self.uvs:
            uv = mesh.uv_layers.new(name="Surface")
            for f, coords in zip(mesh.polygons, self.uvs):
                for i, p in zip(f.loop_indices, coords):
                    uv.data[i].uv = p
        for p in mesh.polygons:
            p.use_smooth = True
        return o

    def face(self, indices, uvs):
        self.polys.append(tuple(indices))
        self.uvs.append(tuple(uvs))


def spline(ctrl, steps):
    # Centrelines pass through the measured branch stations. Radius is interpolated with them.
    v = [Vector(p) for p in ctrl]
    out = []
    for i in range(len(v) - 1):
        a, b, c, d = v[max(0, i - 1)], v[i], v[i + 1], v[min(len(v) - 1, i + 2)]
        for j in range(steps):
            t = j / steps
            p = 0.5 * (
                2 * b
                + (-a + c) * t
                + (2 * a - 5 * b + 4 * c - d) * t * t
                + (-a + 3 * b - 3 * c + d) * t * t * t
            )
            out.append((p.to_3d(), max(0.001, p[3])))
    out.append((v[-1].to_3d(), v[-1][3]))
    return out


def sweep(g, stations, n, seed, frames=None):
    prev = None
    total = 0
    base = len(g.verts)
    prev_point = None
    for j, (p, r) in enumerate(stations):
        t = (
            stations[min(j + 1, len(stations) - 1)][0] - stations[max(0, j - 1)][0]
        ).normalized()
        if prev is None:
            prev = t.cross(Vector((0, 1, 0))).normalized()
        if prev.length < 0.01:
            prev = t.cross(Vector((1, 0, 0))).normalized()
        a = (prev - t * prev.dot(t)).normalized()
        b = t.cross(a).normalized()
        old_dist = total
        if prev_point is not None:
            total += (p - prev_point).length
        if frames is not None:
            frames.append((p, a, b, r, total))
        for k in range(n):
            phase = tau * k / n
            flute = (
                1
                + 0.046 * sin(5 * phase + seed + total * 0.43)
                + 0.034 * cos(3 * phase - seed - total * 0.38)
                + 0.014 * cos(8 * phase + total * 1.2)
            )
            g.verts.append(p + (a * cos(phase) + b * sin(phase)) * r * flute)
        if j > 0:
            for k in range(n):
                k2 = (k + 1) % n
                start = base + n * (j - 1)
                g.face(
                    (start + k, start + k2, start + n + k2, start + n + k),
                    (
                        (k / n, old_dist),
                        ((k + 1) / n, old_dist),
                        ((k + 1) / n, total),
                        (k / n, total),
                    ),
                )
        prev = a
        prev_point = p
    for off, rev in ((0, True), ((len(stations) - 1) * n, False)):
        kk = list(range(n))[::-1] if rev else list(range(n))
        g.face(
            (base + off + k for k in kk),
            (
                (0.5 + 0.49 * cos(tau * k / n), 0.5 + 0.49 * sin(tau * k / n))
                for k in kk
            ),
        )


def weld_primary(bpy, o, frames):
    # Volumetric union grows one continuous cambium surface across every crotch and buttress.
    bpy.context.view_layer.objects.active = o
    vox = o.modifiers.new("Unify cambium across forks", "REMESH")
    vox.mode = "VOXEL"
    vox.voxel_size = 0.023
    bpy.ops.object.modifier_apply(modifier=vox.name)
    sm = o.modifiers.new("Soften the bark collar", "SMOOTH")
    sm.factor = 0.94
    sm.iterations = 4
    bpy.ops.object.modifier_apply(modifier=sm.name)
    low = o.modifiers.new("Preserve flares and reduce flat spans", "DECIMATE")
    low.ratio = 0.135
    bpy.ops.object.modifier_apply(modifier=low.name)
    kd = KDTree(len(frames))
    for i, (p, *_) in enumerate(frames):
        kd.insert(p, i)
    kd.balance()
    mesh = o.data
    uv = mesh.uv_layers.active or mesh.uv_layers.new(name="Branch grain")
    for f in mesh.polygons:
        f.use_smooth = True
        p, idx, _ = kd.find(f.center)
        centre, a, b, _r, dist = frames[idx]
        t = a.cross(b)
        coords = []
        for vid in f.vertices:
            delta = mesh.vertices[vid].co - centre
            coords.append(
                [
                    atan2(delta.dot(b), delta.dot(a)) / tau + 0.5,
                    (dist + delta.dot(t)) / 0.86,
                ]
            )
        if max(u for u, v in coords) - min(u for u, v in coords) > 0.5:
            for uvp in coords:
                if uvp[0] < 0.5:
                    uvp[0] += 1
        for li, (u, v) in zip(f.loop_indices, coords):
            uv.data[li].uv = (u * 1.45, v)


# Ordered growth stations, including the street leader and north-facing landing limb.
LIMBS = [
    [
        (1.72, 1.83, 0.06, 0.38),
        (1.72, 1.83, 0.27, 0.27),
        (1.69, 1.81, 0.75, 0.218),
        (1.73, 1.83, 1.39, 0.207),
        (1.75, 1.83, 1.80, 0.231),
        (1.68, 1.87, 2.11, 0.24),
        (1.48, 2.02, 2.54, 0.17),
        (1.30, 2.30, 2.99, 0.143),
        (0.92, 2.49, 3.67, 0.115),
        (0.63, 2.54, 4.17, 0.085),
        (0.30, 2.46, 4.91, 0.043),
    ],
    [
        (1.72, 1.85, 1.73, 0.205),
        (1.89, 1.65, 2.11, 0.173),
        (2.02, 1.39, 2.32, 0.155),
        (2.10, 0.92, 2.70, 0.147),
        (2.18, 0.48, 3.18, 0.126),
        (2.29, 0.14, 3.49, 0.111),
        (2.56, -0.10, 3.62, 0.102),
        (3.15, -0.40, 3.77, 0.080),
        (3.72, -0.51, 3.89, 0.073),
        (4.32, -0.70, 4.10, 0.062),
        (5.05, -0.85, 4.18, 0.047),
        (5.58, -1.10, 4.43, 0.030),
        (6.00, -1.15, 4.50, 0.018),
    ],
    [
        (1.68, 1.86, 2.01, 0.17),
        (1.43, 1.71, 2.31, 0.135),
        (1.05, 1.58, 2.61, 0.119),
        (0.56, 1.33, 2.81, 0.10),
        (0.08, 1.22, 3.15, 0.09),
        (-0.60, 0.99, 3.40, 0.078),
        (-1.23, 0.87, 3.61, 0.064),
        (-1.94, 0.62, 3.89, 0.045),
        (-2.73, 0.71, 4.05, 0.029),
    ],
    [
        (1.46, 2.05, 2.45, 0.14),
        (1.48, 2.36, 2.69, 0.112),
        (1.63, 2.83, 3.03, 0.087),
        (1.76, 3.14, 3.19, 0.073),
        (1.79, 3.58, 3.33, 0.054),
        (1.78, 4.08, 3.55, 0.035),
        (1.66, 4.42, 3.80, 0.024),
    ],
    [
        (1.28, 2.31, 3.01, 0.12),
        (1.40, 2.39, 3.36, 0.104),
        (1.53, 2.32, 3.88, 0.087),
        (1.78, 2.15, 4.35, 0.071),
        (1.84, 2.03, 5.01, 0.058),
        (1.66, 1.95, 5.60, 0.043),
        (1.45, 2.03, 6.14, 0.031),
        (1.10, 2.03, 6.65, 0.018),
    ],
    [
        (0.63, 2.53, 4.10, 0.079),
        (0.42, 2.74, 4.41, 0.062),
        (0.16, 2.96, 4.70, 0.055),
        (-0.18, 3.48, 4.97, 0.048),
        (-0.53, 3.81, 5.36, 0.038),
        (-0.76, 4.18, 5.90, 0.026),
    ],
    [
        (2.13, 0.77, 2.85, 0.102),
        (2.01, 0.47, 3.25, 0.082),
        (1.74, 0.11, 3.63, 0.071),
        (1.46, -0.26, 4.12, 0.056),
        (1.31, -0.76, 4.42, 0.047),
        (0.95, -1.33, 4.69, 0.039),
        (0.64, -1.90, 4.78, 0.022),
    ],
    [
        (1.54, 2.31, 3.91, 0.066),
        (1.76, 2.21, 4.43, 0.054),
        (1.90, 2.22, 5.08, 0.048),
        (2.02, 2.27, 5.71, 0.033),
        (2.06, 2.23, 6.36, 0.026),
        (2.37, 2.06, 6.94, 0.018),
    ],
    [
        (0.03, 1.23, 3.19, 0.075),
        (-0.15, 0.94, 3.51, 0.06),
        (-0.39, 0.53, 3.95, 0.05),
        (-0.51, 0.11, 4.50, 0.038),
        (-0.51, -0.31, 5.08, 0.023),
    ],
    [
        (3.10, -0.37, 3.74, 0.063),
        (3.24, -0.58, 4.03, 0.053),
        (3.42, -0.91, 4.27, 0.044),
        (3.43, -1.25, 4.63, 0.035),
        (3.31, -1.61, 4.93, 0.021),
    ],
    [
        (4.29, -0.69, 4.08, 0.046),
        (4.47, -0.86, 4.32, 0.038),
        (4.64, -0.93, 4.69, 0.028),
        (4.93, -0.91, 4.96, 0.020),
    ],
    [
        (0.96, 2.48, 3.60, 0.075),
        (0.61, 2.38, 3.95, 0.060),
        (0.14, 2.35, 4.28, 0.046),
        (-0.33, 2.38, 4.59, 0.036),
        (-0.74, 2.35, 4.97, 0.024),
    ],
]


def build(bpy):
    with tempfile.TemporaryDirectory(prefix="fazhere-tree-") as tmp:
        bark, leaf = surfaces(bpy, Path(tmp))
    rng = random.Random(5291)
    woody, twigs, blades = Geometry(), Geometry(), Geometry()
    spatial = []
    for i, limb in enumerate(LIMBS):
        sweep(woody, spline(limb, 5), 14, i, spatial)
    for i in range(8):
        phi = tau * i / 8 + rng.uniform(-0.27, 0.27)
        r = rng.uniform(0.53, 0.92)
        direction = Vector((cos(phi), sin(phi), 0))
        pts = []
        for d, h, th in [
            (0, 0.47, 0.18),
            (0.15, 0.32, 0.135),
            (0.35, 0.20, 0.116),
            (0.66, 0.131, 0.072),
            (1, 0.116, 0.019),
        ]:
            p = Vector((1.72, 1.83, h)) + direction * (r * d)
            pts.append((*p, th))
        sweep(woody, spline(pts, 3), 11, i, spatial)
    bole = woody.object(
        bpy, "Courtyard rain tree | flared bole and branch collars", bark
    )
    weld_primary(bpy, bole, spatial)

    def allowed(p):
        if p.x > 2.45 and p.y > -0.08 and p.z < 6.45:
            return False
        if p.x > 6.13 and p.y < 0.1 and p.z < 5.95:
            return False
        return p.z >= 3.55 or p.x <= 3.0

    def leaf_card(start, direction, length, idx):
        # Three articulated ribs make the compound leaf cup, twist and droop in sunlight.
        d = direction.normalized()
        side = d.cross(Vector((0, 0, 1))).normalized()
        if side.length < 0.05:
            return
        side.z += rng.uniform(-0.45, 0.45)
        width = length * rng.uniform(0.68, 0.94)
        base = len(blades.verts)
        dx = (idx % 2) * 0.5
        dy = (1 - idx // 2) * 0.5
        for t in (0, 0.50, 1):
            p = (
                start
                + d * (length * t)
                + Vector((0, 0, length * (0.19 * sin(t * pi) - 0.19 * t * t)))
            )
            for s in (-1, 0, 1):
                blades.verts.append(
                    p
                    + side * (s * 0.50 * width)
                    + Vector((0, 0, -abs(s) * 0.09 * width))
                )
        for j, (v1, v2) in enumerate(((0, 0.50), (0.50, 1))):
            for k in (0, 1):
                a = base + 3 * j + k
                u1, u2 = k * 0.25, (k + 1) * 0.25
                blades.face(
                    (a, a + 3, a + 4, a + 1),
                    (
                        (dx + u1, dy + v1 * 0.5),
                        (dx + u1, dy + v2 * 0.5),
                        (dx + u2, dy + v2 * 0.5),
                        (dx + u2, dy + v1 * 0.5),
                    ),
                )

    def grow(start, direction, length, radius, level):
        d = direction.normalized()
        side = Vector((-d.y, d.x, 0)).normalized()
        mid = (
            start
            + d * (length * 0.53)
            + side * rng.uniform(-0.15, 0.15) * length
            + Vector((0, 0, rng.uniform(0.00, 0.19) * length))
        )
        end = start + d * length + side * rng.uniform(-0.22, 0.22) * length
        if not allowed(end) or not allowed(mid):
            return
        sweep(
            twigs,
            [(start, radius), (mid, radius * 0.66), (end, max(0.0015, radius * 0.32))],
            6 if level > 0 else 4,
            rng.random(),
        )
        if level <= 1:
            for j in range(2 if level == 1 else 3):
                t = (j + 1) / 3
                origin = (
                    start.lerp(mid, t * 2) if t < 0.5 else mid.lerp(end, (t - 0.5) * 2)
                )

                for sign in (-1, 1):
                    direction = (
                        d * 0.48
                        + side * (sign * rng.uniform(0.45, 1.12))
                        + Vector((0, 0, rng.uniform(-0.52, 0.36)))
                    )
                    end_leaf = origin + direction * 0.28
                    if allowed(end_leaf):
                        leaf_card(
                            origin, direction, rng.uniform(0.27, 0.45), rng.randrange(4)
                        )
        if level:
            for i in range(3 if level == 2 else 2):
                t = 0.38 + i * (0.62 / (2 if level == 2 else 1))
                origin = (
                    start.lerp(mid, t * 2) if t < 0.5 else mid.lerp(end, (t - 0.5) * 2)
                )
                gd = (
                    d * rng.uniform(0.35, 0.95)
                    + side * ((-1) ** i * rng.uniform(0.35, 1.15))
                    + Vector((0, 0, rng.uniform(-0.22, 0.60)))
                )
                grow(
                    origin,
                    gd,
                    length * rng.uniform(0.47, 0.72),
                    radius * 0.48,
                    level - 1,
                )

    for i, limb in enumerate(LIMBS):
        # Brush the outer two thirds of each scaffold. The court keeps a clear lower trunk.
        s = spline(limb, 3)
        for j in range(4, 10):
            k = min(len(s) - 1, int((0.38 + j * 0.066) * (len(s) - 1)))
            p, r = s[k]
            d = (p - s[max(0, k - 2)][0]).normalized()
            perp = Vector((-d.y, d.x, 0)).normalized()
            shoot = (
                d * 0.80
                + perp * ((-1) ** j * rng.uniform(0.6, 1.35))
                + Vector((0, 0, rng.uniform(0.22, 0.76)))
            )
            grow(p, shoot, rng.uniform(0.65, 1.19), min(0.034, r * 0.55), 2)
    # The visible distal end curves back toward the court, then tapers to a leaf stalk.
    for i, limb in enumerate(LIMBS):
        p = Vector(limb[-1][:3])
        d = (p - Vector(limb[-2][:3])).normalized()
        if i == 1:
            d = Vector((0.04, -0.33, 0.94))
        tip = p + d * 0.17
        end = tip + d * 0.21 + Vector((-0.04, 0.012, 0.07))
        sweep(twigs, [(p, limb[-1][3]), (tip, limb[-1][3] * 0.57), (end, 0.002)], 8, i)
        for side in (-1, 1):
            grow(tip, Vector((-0.60, side * 0.57, 0.59)), 0.46, 0.009, 1)
            leaf_card(end, Vector((-0.22, side * 0.53, 0.43)), 0.38, i % 4)
    verge = plant(bpy, Geometry, sweep, material, rng, bark, leaf_card)
    sprig = twigs.object(bpy, "Rain tree | feathered terminal wood", bark)
    crown = blades.object(bpy, "Rain tree | bipinnate crown", leaf)
    return [bole, sprig, crown, *verge]


if __name__ == "__main__":
    import bpy

    bpy.ops.wm.read_factory_settings(use_empty=True)
    models = build(bpy)
    output = HERE.parent.parent / "public" / "appointment" / "models" / "tree.glb"
    output.parent.mkdir(parents=True, exist_ok=True)
    for model in models:
        model.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_draco_mesh_compression_enable=False,
    )
    print("Written", output, output.stat().st_size)
