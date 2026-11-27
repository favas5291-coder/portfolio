import { useId } from 'react';
import { projectPreviews } from '../data/project-previews.js';
import projections from './stillProjection.json';
import './screenStill.css';

// Project a live manifest image onto the measured glass in each still. SVG
// affine triangles render without WebGL or JavaScript, including prerender.
function projectPoint([a,b,c,d], u, v) {
  const dx1 = b[0]-c[0], dx2 = d[0]-c[0], dx3 = a[0]-b[0]+c[0]-d[0];
  const dy1 = b[1]-c[1], dy2 = d[1]-c[1], dy3 = a[1]-b[1]+c[1]-d[1];
  const det = dx1*dy2 - dx2*dy1;
  if (Math.abs(det) < 0.0001) return a;
  const g = (dx3*dy2 - dx2*dy3)/det;
  const h = (dx1*dy3 - dx3*dy1)/det;
  const k = 1 + g*u + h*v;
  return [0,1].map(i =>
    ((b[i]*(1+g)-a[i])*u + (d[i]*(1+h)-a[i])*v + a[i])/k);
}

function ScreenImage({ frame, src, layout, token }) {
  if (!frame || !src) return null;
  const {points,width,height} = frame;
  const fragments = [];
  const count = 2, step = 1/count;
  for (let y=0; y<count; y++) for (let x=0; x<count; x++) {
    // Both triangles are represented by a right-angled corner and its two
    // orthogonal UV neighbours, making the affine transform explicit.
    for (const reverse of [false,true]) {
      const u = (x + Number(reverse))*step, v = (y + Number(reverse))*step;
      const du = reverse ? -step : step;
      const o = projectPoint(points,u,v);
      const p = projectPoint(points,u+du,v), q = projectPoint(points,u,v+du);
      const a = (p[0]-o[0])/du, b = (p[1]-o[1])/du;
      const c = (q[0]-o[0])/du, d = (q[1]-o[1])/du;
      const e = o[0]-a*u-c*v, f = o[1]-b*u-d*v;
      fragments.push({
        triangle:[o,p,q].map(point => point.join(',')).join(' '),
        transform:`matrix(${a} ${b} ${c} ${d} ${e} ${f})`,
      });
    }
  }
  return <svg className={'ap-screen-layer ap-screen-'+layout} aria-hidden="true" focusable="false"
    viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
    <defs>
      <image id={token} href={src} width="1" height="1" preserveAspectRatio="none"/>
      {fragments.map(({triangle},i) => <clipPath id={token+'-clip'+i} key={i}>
        <polygon points={triangle}/>
      </clipPath>)}
    </defs>
    {fragments.map(({ transform },i) => <g key={i} clipPath={'url(#'+token+'-clip'+i+')'}>
      <use href={'#'+token} transform={transform}/>
    </g>)}
  </svg>;
}

export function ScreenStill({ chapter, projectUrl }) {
  const token = useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const id = chapter?.id || chapter;
  const paired = Object.values(projectPreviews).find(p => p.mobile?.matchesDesktop === p.screenshot);
  const images = id === 'studio' ? [
    ['studio', paired?.screenshot || projectPreviews.gymdrobe.screenshot],
    ['phone', paired?.mobile.screenshot],
  ] : id === 'reception' ? [['reception', projectPreviews.gymdrobe.screenshot]] :
    id === 'office' ? [['office', projectUrl || projectPreviews.gymdrobe.screenshot]] : [];
  return images.flatMap(([name,src]) => ['compact','wide'].map(layout =>
    <ScreenImage key={name+layout} frame={projections[name]?.[layout]} src={src}
      token={'screen'+token+name+layout} layout={layout}/>));
}
