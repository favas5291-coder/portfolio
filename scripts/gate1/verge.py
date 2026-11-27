"""A planted verge beyond the road and a few courtyard ferns around the root flare."""

from math import cos, pi, sin, tau

from mathutils import Vector


def plant(bpy, Geometry, sweep, material, rng, bark, leaf_card):
    wood, green = Geometry(), Geometry()
    vcolour = []

    def leafyface(ids, uv, colour):
        green.face(ids, uv)
        vcolour.extend([colour] * len(ids))

    def palm(x, y, h):
        phi = rng.uniform(0, tau)
        sway = Vector((cos(phi), sin(phi), 0)) * h * rng.uniform(0.055, 0.21)

        def centre(t):
            return Vector((x, y, -0.07 + h * t)) + sway * (t * t)

        trunk = []
        for i in range(32):
            t = i / 31
            radius = h * (0.023 - 0.009 * t) + h * 0.014 * max(0, 1 - t * 9)
            trunk.append((centre(t), radius))
        sweep(wood, trunk, 9, rng.random())
        # Strong leaf-scar rings fade after the green crown shaft.
        for t in [j / 26 for j in range(3, 24, 2)]:
            r = h * (0.023 - 0.009 * t)
            sweep(
                wood,
                [
                    (centre(t), r * 1.022),
                    (centre(t + 0.002), r * 1.035),
                    (centre(t + 0.004), r),
                ],
                8,
                rng.random(),
            )
        for i in range(11):
            a = phi + i * 2.40 + rng.uniform(-0.21, 0.21)
            reach = h * rng.uniform(0.32, 0.55)
            d = Vector((cos(a), sin(a), 0))
            side = Vector((-sin(a), cos(a), 0))
            new = i / 11
            vert = reach * (0.88 + new * 1.32)
            drop = reach * (1.45 + new * 0.22)
            sc = rng.uniform(-0.18, 0.18)

            def frond(
                t, new=new, d=d, reach=reach, side=side, sc=sc, vert=vert, drop=drop
            ):
                return (
                    centre(0.935 + new * 0.064)
                    + d * (reach * t)
                    + side * (reach * sc * t * t)
                    + Vector((0, 0, vert * t - drop * t * t))
                )

            sweep(
                wood,
                [(frond(j / 6), max(0.002, 0.024 * (1 - j / 7))) for j in range(7)],
                5,
                rng.random(),
            )
            for j in range(1, 16):
                t = j / 17
                p = frond(t)
                width = 0.024 * reach * (1 - t * 0.65)
                for orient in (-1, 1):
                    l = (
                        reach
                        * 0.27
                        * (0.3 + 0.74 * sin(pi * t) ** 0.64)
                        * rng.uniform(0.79, 1.15)
                    )
                    v = (d * 0.37 + side * (orient * 0.94)).normalized()
                    q = p + v * (l * 0.53) + Vector((0, 0, 0.23 * l))
                    tip = p + v * l + Vector((0, 0, l * rng.uniform(-0.48, -0.27)))
                    k = len(green.verts)
                    green.verts.extend(
                        [
                            p,
                            q + d * width,
                            q + Vector((0, 0, width * 0.74)),
                            q - d * width,
                            tip,
                        ]
                    )
                    col = rng.uniform(0.69, 1.19)
                    lcol = (0.12 * col, 0.204 * col, 0.057 * col, 1)
                    dcol = (0.09 * col, 0.159 * col, 0.039 * col, 1)
                    leafyface(
                        [k, k + 1, k + 4, k + 2],
                        [(0.5, 0), (1, 0.5), (0.5, 1), (0.5, 0.5)],
                        lcol,
                    )
                    leafyface(
                        [k, k + 2, k + 4, k + 3],
                        [(0.5, 0), (0.5, 0.5), (0.5, 1), (0, 0.5)],
                        dcol,
                    )

    def underplant(x, y, h):
        phi = rng.uniform(0, tau)
        for i in range(10):
            a = phi + i * 2.3999 + rng.uniform(-0.14, 0.14)
            d = Vector((cos(a), sin(a), 0))
            side = Vector((-d.y, d.x, 0))
            r = h * rng.uniform(0.37, 0.97)
            z = h * rng.uniform(0.7, 1.14)
            for j in range(9):
                t = j / 8
                p = (
                    Vector((x, y, -0.06))
                    + d * r * (t**1.35)
                    + Vector((0, 0, z * (sin(t * 1.87))))
                    + side * 0.076 * r * sin(t * pi)
                )
                w = (
                    z
                    * rng.uniform(0.093, 0.112)
                    * max(0.009, sin(t * pi) ** 0.82)
                    * min(1, t * 3)
                )
                v = len(green.verts)
                green.verts.extend(
                    [
                        p - side * w - Vector((0, 0, 0.23 * w)),
                        p,
                        p + side * w - Vector((0, 0, 0.34 * w)),
                    ]
                )
                if j:
                    tint = rng.uniform(0.91, 1.06)
                    for k in (0, 1):
                        c = (
                            (0.091 * tint, 0.178 * tint, 0.053 * tint, 1)
                            if k
                            else (0.074 * tint, 0.145 * tint, 0.044 * tint, 1)
                        )
                        leafyface(
                            [v - 3 + k, v + k, v + k + 1, v - 2 + k],
                            [
                                (k * 0.5, t - 1 / 8),
                                (k * 0.5, t),
                                ((k + 1) * 0.5, t),
                                ((k + 1) * 0.5, t - 1 / 8),
                            ],
                            c,
                        )

    for x, y, h in [
        (-8, -23, 7.6),
        (-4.9, -24.2, 6.0),
        (0.7, -24.7, 8.7),
        (3.2, -24, 5.7),
        (11.7, -24.5, 6.1),
        (13.1, -25.8, 8.1),
        (18.7, -24, 6.8),
        (25, -23, 8.2),
        (-5, 12, 6.7),
        (14.4, 11, 6.2),
    ]:
        palm(x, y, h)
    for i in range(21):
        x = -13 + i * 2.18 + rng.uniform(-0.62, 0.56)
        y = rng.uniform(-22.6, -18.8)
        underplant(
            x + rng.uniform(-0.68, 0.68),
            y + rng.uniform(-0.41, 0.41),
            rng.uniform(1.2, 2.65),
        )
    for i in range(23):
        # Ferns use the same authored bipinnate atlas and remain beneath the main trunk.
        x = rng.uniform(0.13, 2.93)
        y = rng.uniform(0.15, 3.61)
        z = 0.153
        if (x - 1.72) ** 2 + (y - 1.83) ** 2 < 0.62**2:
            continue
        for j in range(5):
            a = tau * j / 5 + rng.uniform(-0.32, 0.32)
            leaf_card(
                Vector((x, y, z)),
                Vector((cos(a), sin(a), rng.uniform(0.7, 1.35))),
                rng.uniform(0.27, 0.48),
                rng.randrange(4),
            )
    palmwood = wood.object(bpy, "Opposite verge | arching palm trunks", bark)
    leaves, p = material(
        bpy, "Verge | waxed palm and ginger leaves", (0.07, 0.13, 0.04), 0.62
    )
    att = leaves.node_tree.nodes.new("ShaderNodeVertexColor")
    att.layer_name = "Blade colour"
    leaves.node_tree.links.new(att.outputs["Color"], p.inputs["Base Color"])
    canopy = green.object(
        bpy, "Opposite verge | arching fronds and waxy leaves", leaves
    )
    attr = canopy.data.color_attributes.new(
        name="Blade colour", type="BYTE_COLOR", domain="CORNER"
    )
    for row, c in zip(attr.data, vcolour):
        row.color = c
    return [palmwood, canopy]
