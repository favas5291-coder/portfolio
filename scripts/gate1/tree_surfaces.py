"""Paint tileable bark PBR maps and a true-scale bipinnate rain-tree leaf atlas."""

import random
from math import hypot, pi, sin
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def bake_bark(directory):
    n = 512
    rng = np.random.default_rng(178)
    yy, xx = np.mgrid[:n, :n] / n

    def noise(nx, ny):
        grid = rng.uniform(-1, 1, (ny, nx))
        x, y = xx * nx, yy * ny
        i, j = x.astype(int), y.astype(int)
        u, v = x - i, y - j
        u, v = u * u * (3 - 2 * u), v * v * (3 - 2 * v)
        a = grid[j, i] * (1 - u) + grid[j, (i + 1) % nx] * u
        b = grid[(j + 1) % ny, i] * (1 - u) + grid[(j + 1) % ny, (i + 1) % nx] * u
        return a * (1 - v) + b * v

    bend = 0.033 * noise(3, 4) + 0.019 * noise(6, 9) + 0.004 * noise(12, 18)
    # Unequal bark plates with deep broken channels, longitudinal grain and cross fissures.
    x = (xx + bend) * 12
    line = np.abs(((x + 0.5) % 1) - 0.5)
    breaks = np.maximum(0, noise(12, 6) + 0.26)
    groove = np.exp(-(line**2) / 0.005) * np.clip(0.53 + breaks, 0, 1)
    outer = noise(9, 4) * 0.39 + noise(38, 10) * 0.23 + noise(81, 22) * 0.12
    narrow = np.abs(np.sin(2 * pi * (42 * (xx + bend * 0.74) + 0.3 * noise(6, 9))))
    height = (
        outer
        - groove * 0.84
        + narrow * 0.1
        + noise(156, 100) * 0.11
        + noise(85, 40) * 0.075
    )
    lichen = np.clip(
        (noise(4, 7) * 0.66 + noise(16, 20) * 0.49 + noise(63, 85) * 0.3 - 0.22) * 2,
        0,
        1,
    )
    grain = rng.normal(0, 1, (n, n))
    value = 1 + height * 0.50 + noise(5, 4) * 0.14
    color = np.stack(
        [84 * value + lichen * 13, 71 * value + lichen * 21, 57 * value + lichen * 20],
        axis=2,
    )
    color += grain[:, :, None] * 2.8
    Image.fromarray(np.uint8(np.clip(color, 0, 255))).save(
        directory / "bark.jpg", quality=86
    )
    gx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.92
    gy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.83
    normal = np.stack([-gx, gy, np.ones_like(gx)], axis=2)
    normal /= np.linalg.norm(normal, axis=2)[:, :, None]
    Image.fromarray(np.uint8(np.clip((normal * 0.5 + 0.5) * 255, 0, 255))).save(
        directory / "bark-normal.png"
    )
    orm = np.stack(
        [
            0.96 - groove * 0.34,
            np.clip(0.83 + outer * 0.16 - groove * 0.03, 0.42, 0.98),
            np.zeros_like(xx),
        ],
        axis=2,
    )
    Image.fromarray(np.uint8(orm * 255)).save(directory / "bark-orm.png")


def bake_leaf(directory):
    k = 2
    n = 512
    atlas = Image.new("RGBA", (n * k, n * k), (69, 97, 39, 0))
    draw = ImageDraw.Draw(atlas)
    for idx in range(4):
        rng = random.Random(142 + idx)
        ox, oy = idx % 2 * 256, idx // 2 * 256

        def xy(p, ox=ox, oy=oy):
            return ((ox + p[0]) * k, (oy + p[1]) * k)

        def segment(a, b, fill, width):
            draw.line((xy(a), xy(b)), fill=fill, width=max(1, round(width * k)))

        # One compound leaf per quadrant: 4–6 pairs of pinnae; distal pairs largest.
        for side in (-1, 1):
            for j in range(5):
                y = 220 - j * 38 + (4 if side == 1 else 0)
                length = (56 + 26 * sin(pi * (j + 1) / 6)) * rng.uniform(0.93, 1.1)
                x0 = 124 + 12 * sin(pi * (242 - y) / 231)
                end = (x0 + length * side, y - 39 - rng.uniform(0, 10))
                base = (x0, y)
                segment(base, end, (118, 132, 58, 255), 1.5)
                dx, dy = end[0] - x0, end[1] - y
                l = hypot(dx, dy)
                ex, ey = dx / l, dy / l
                for h in range(1, 8):
                    q = h / 8.1
                    centre = (x0 + q * dx, y + q * dy)
                    for sign in (-1, 1):
                        spread = 0.91 * sign
                        vx, vy = ex * 0.52 - ey * spread, ey * 0.52 + ex * spread
                        ll = (11 + 7 * q) * rng.uniform(0.87, 1.15)
                        ww = (3.4 + 2.4 * q) * rng.uniform(0.90, 1.18)
                        cx, cy = centre
                        poly = [
                            (
                                cx + vx * ll * t - vy * ww * w,
                                cy + vy * ll * t + vx * ww * w,
                            )
                            for t, w in (
                                (0, 0),
                                (0.29, 0.64),
                                (0.70, 1),
                                (0.96, 0.44),
                                (1, 0),
                                (0.84, -0.56),
                                (0.43, -0.78),
                            )
                        ]
                        shade = rng.randint(-15, 20) + idx * 3
                        draw.polygon(
                            [xy(p) for p in poly],
                            fill=(64 + shade, 91 + shade, 41 + int(shade * 0.58), 255),
                        )
                        segment(
                            centre,
                            (cx + vx * ll * 0.82, cy + vy * ll * 0.82),
                            (101 + shade, 123 + shade, 60 + int(shade * 0.6), 255),
                            0.64,
                        )
        for a in range(1, 29):

            def stem(t):
                return (124 + 12 * sin(pi * t), 247 - 236 * t)

            segment(
                stem((a - 1) / 28),
                stem(a / 28),
                (122, 129, 59, 255),
                2.4 * (1 - a / 40),
            )
    atlas.resize((n, n), Image.Resampling.LANCZOS).save(
        directory / "compound-leaves.png", optimize=True
    )


def bake(directory):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    bake_bark(directory)
    bake_leaf(directory)
