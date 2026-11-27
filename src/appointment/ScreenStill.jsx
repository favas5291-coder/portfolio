import { useId } from 'react';
import { projectPreviews } from '../data/project-previews.js';
import projections from './stillProjection.json';
import './screenStill.css';

// Project a live manifest image onto the measured glass in each still. SVG
// affine triangles render without WebGL or JavaScript, including prerender.
function projectPoint([a, b, c, d], u, v) {
  const dx1 = b[0] - c[0],
    dx2 = d[0] - c[0],
    dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1],
    dy2 = d[1] - c[1],
    dy3 = a[1] - b[1] + c[1] - d[1];
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 0.0001) return a;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  const k = 1 + g * u + h * v;
  return [0, 1].map((i) => ((b[i] * (1 + g) - a[i]) * u + (d[i] * (1 + h) - a[i]) * v + a[i]) / k);
}

function ScreenImage({ frame, capture, layout, token }) {
  if (!frame || !capture) return null;
  const imageAspect = capture.width / capture.height;
  const glassAspect = frame.aspect || imageAspect;
  const imageWidth = Math.min(1, imageAspect / glassAspect);
  const imageHeight = Math.min(1, glassAspect / imageAspect);
  const { points, width, height } = frame;
  const fragments = [];
  const count = 2,
    step = 1 / count;
  for (let y = 0; y < count; y++)
    for (let x = 0; x < count; x++) {
      // Both triangles are represented by a right-angled corner and its two
      // orthogonal UV neighbours, making the affine transform explicit.
      for (const reverse of [false, true]) {
        const u = (x + Number(reverse)) * step,
          v = (y + Number(reverse)) * step;
        const du = reverse ? -step : step;
        const o = projectPoint(points, u, v);
        const p = projectPoint(points, u + du, v),
          q = projectPoint(points, u, v + du);
        const a = (p[0] - o[0]) / du,
          b = (p[1] - o[1]) / du;
        const c = (q[0] - o[0]) / du,
          d = (q[1] - o[1]) / du;
        const e = o[0] - a * u - c * v,
          f = o[1] - b * u - d * v;
        // Independently antialiased clip paths can reveal hairlines between
        // triangles. Overlap by a pixel and clip once at the actual glass edge.
        const vertices = [o, p, q];
        const center = [(o[0] + p[0] + q[0]) / 3, (o[1] + p[1] + q[1]) / 3];
        const triangle = vertices.map(([x, y]) => {
          const dx = x - center[0], dy = y - center[1];
          const length = Math.hypot(dx, dy) || 1;
          return [x + 1.8 * dx / length, y + 1.8 * dy / length].join(',');
        }).join(' ');
        fragments.push({
          triangle,
          transform: `matrix(${a} ${b} ${c} ${d} ${e} ${f})`,
        });
      }
    }
  return (
    <svg
      className={'ap-screen-layer ap-screen-' + layout}
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <image
          id={token}
          href={capture.screenshot}
          x={(1 - imageWidth) / 2}
          y={(1 - imageHeight) / 2}
          width={imageWidth}
          height={imageHeight}
          preserveAspectRatio="none"
        />
        <clipPath id={token + '-glass'}>
          <polygon points={points.map((point) => point.join(',')).join(' ')} />
        </clipPath>
        {fragments.map(({ triangle }, i) => (
          <clipPath id={token + '-clip' + i} key={i}>
            <polygon points={triangle} />
          </clipPath>
        ))}
      </defs>
      <g clipPath={'url(#' + token + '-glass)'}>
        {fragments.map(({ transform }, i) => (
          <g key={i} clipPath={'url(#' + token + '-clip' + i + ')'}>
            <use href={'#' + token} transform={transform} />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function ScreenStill({ chapter, projectUrl }) {
  const token = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = chapter?.id || chapter;
  const paired = Object.values(projectPreviews).find((p) => p.mobile?.matchesDesktop === p.screenshot);
  const images =
    id === 'studio'
      ? [
          ['studio', paired || projectPreviews.gymdrobe],
          ['phone', paired?.mobile],
        ]
      : id === 'reception'
        ? [['reception', projectPreviews.gymdrobe]]
        : id === 'office'
          ? [['office', Object.values(projectPreviews).find((item) => item.screenshot === projectUrl) || projectPreviews.gymdrobe]]
          : [];
  return images.flatMap(([name, capture]) =>
    ['compact', 'wide'].map((layout) => (
      <ScreenImage
        key={name + layout}
        frame={projections[name]?.[layout]}
        capture={capture}
        token={'screen' + token + name + layout}
        layout={layout}
      />
    )),
  );
}
