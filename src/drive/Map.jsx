import { BUILDINGS, SPAWN } from './layout.js';
import { destinations, openDestination } from './Destinations.jsx';

// The poster uses the driving world's metre coordinates. North is the top edge.
const X = 12.1, Y = 3.35, Z = -5.85, D = 6.1, H = 11.6;
const origin = [482, 294];
const point = (x, z, up = 0) => [origin[0] + X * x + Z * z, origin[1] + Y * x + D * z - H * up];
const shape = (vertices) => vertices.map((vertex) => point(...vertex).join(',')).join(' ');
const floor = 'matrix(' + [X, Y, Z, D, ...origin].join(' ') + ')';
const front = (x, z, top) => 'matrix(' + [X, Y, 0, H, ...point(x,z,top)].join(' ') + ')';

const paint = {
  gymdrobe: { wall: '#f2e9d0', side: '#959f90', top: '#d8cdb5', fascia: '#204f4a', trim: '#f6efe0', label: 'GYMDROBE', h: 5.8 },
  luxvibe: { wall: '#dfbb9f', side: '#b78e70', top: '#b38469', fascia: '#653d48', trim: '#f1ddc9', label: 'LUXVIBE', h: 4.5 },
  fabea: { wall: '#ecdfb9', side: '#bab398', top: '#d4c9a5', fascia: '#ebdfba', trim: '#58493c', label: 'fabea', h: 4.15 },
  workshop: { wall: '#b75e42', side: '#8e5139', top: '#a65e41', fascia: '#795444', trim: '#fff0ce', label: 'WORKSHOP', h: 3.95 },
  office: { wall: '#f6e5be', side: '#c8b08a', top: '#b97959', fascia: '#e7d6ae', trim: '#2c4941', label: 'FAZHERE', h: 4.65 },
  tea: { wall: '#809f8e', side: '#547965', top: '#a2704c', fascia: '#336d62', trim: '#f4e7c7', label: 'CHAYA', h: 2.8 },
};

function Polygon({ vertices, fill }) {
  return <polygon points={shape(vertices)} fill={fill} />;
}

function Building({ building, onOpen }) {
  const { id, x, z, width: w, depth: d } = building;
  const { wall, side, top, fascia, trim, label, h } = paint[id];
  const l = x - w / 2, r = x + w / 2, back = z - d / 2, f = z + d / 2;
  const featured = id === 'gymdrobe';
  const striped = ['luxvibe', 'tea', 'fabea'].includes(id);
  const panels = Math.max(2, Math.round(w / 2));
  const roofTop = h + .16;
  const shop = <>
    <Polygon fill="#73765c" vertices={[[l+.4, f+.35], [r+1.6,f+.45], [r+2,back+1.6], [l+.7,back+.1]]} />
    <Polygon fill="#e3d6b3" vertices={[[l-.42,f+.85],[r+.42,f+.85],[r+.42,back-.4],[l-.42,back-.4]]} />
    <Polygon fill={side} vertices={[[r,back],[r,f],[r,f,h],[r,back,h]]} />
    <g transform={front(l,f,h)}>
      <rect width={w} height={h} fill={wall} />
      <rect x=".44" y={h*.42} width={w-.88} height={h*.58} fill="#365855" />
      {Array.from({ length: panels }, (_, i) => {
        const colWidth = (w-.88)/panels;
        return <g key={i}>
          <rect x={.44 + i*colWidth+.09} y={h*.44} width={colWidth-.18} height={h*.53} fill={id === 'workshop' ? '#937d65' : i%2 ? '#7c9c91' : '#62867c'}/>
          {id === 'workshop' ? [0,1,2,3].map(k => <path key={k} d={'M' + (.5+i*colWidth) + ' ' + (h*.5+k*.45) + 'h' + (colWidth-.14)} stroke="#695f52" strokeWidth=".07" />) :
            <path d={'M' + (.59+i*colWidth) + ' ' + (h*.46) + 'h' + (colWidth-.36) + 'l-' + (colWidth-.36) + ' ' + (h*.32) + 'Z'} fill="#b2ba9b" opacity=".53" />}
        </g>;
      })}
      <rect x=".15" y=".15" width={w-.3} height={h*.32} fill={fascia} />
      <text x={w/2} y={.27+h*.18} textAnchor="middle" dominantBaseline="middle" fill={trim}
        fontFamily={id === 'fabea' || id === 'luxvibe' ? 'Georgia,serif' : 'Arial,sans-serif'} fontWeight={id === 'fabea' ? 500 : 800}
        fontSize={featured ? 1.18 : id === 'tea' ? .52 : .78} letterSpacing={featured ? -.03 : .01}>{label}</text>
      {featured && <><path d={'M.25 '+(h-.18)+'h'+(w-.5)} stroke="#d3b88e" strokeWidth=".35" /><path d={'M.3 1.78h'+(w-.6)} stroke="#df914e" strokeWidth=".11" /></>}
    </g>
    <Polygon fill={top} vertices={[[l-.16,back-.16,roofTop],[r+.16,back-.16,roofTop],[r+.16,f+.18,roofTop],[l-.16,f+.18,roofTop]]} />
    <polyline points={shape([[l-.16,f+.18,roofTop],[r+.16,f+.18,roofTop],[r+.16,back-.16,roofTop]])} fill="none" stroke="#faf0ce" strokeWidth="1.7" opacity=".85" />
    {['workshop','tea','office'].includes(id) ? Array.from({ length: Math.floor(w*1.4) }, (_, i) => (
      <polyline key={i} fill="none" stroke="#ede3ba" opacity=".47" strokeWidth="1" points={shape([[l+.1+i*.66,back,roofTop+.02],[l+.1+i*.66,f+.05,roofTop+.02]])} />
    )) : <Polygon fill={featured ? '#c0c5ac' : '#b4a886'} vertices={[[l+.65,back+.6,roofTop+.01],[r-.65,back+.6,roofTop+.01],[r-.65,f-.6,roofTop+.01],[l+.65,f-.6,roofTop+.01]]} />}
    {featured && <>
      <Polygon fill="#9b9d83" vertices={[[l+1,back+1.2,roofTop],[l+3.1,back+1.2,roofTop],[l+3.1,back+3,roofTop],[l+1,back+3,roofTop]]} />
      <Polygon fill="#e8dfc3" vertices={[[l+.8,back+1,roofTop+.4],[l+2.8,back+1,roofTop+.4],[l+2.8,back+2.65,roofTop+.4],[l+.8,back+2.65,roofTop+.4]]} />
    </>}
    {striped && Array.from({length: 8},(_,i) => {
      const step = w/8, edge = l+i*step, shade = i%2 ? '#eadab7' : (id === 'luxvibe' ? '#a56b6c' : id === 'tea' ? '#6d9073' : '#cab491');
      return <g key={i}><Polygon fill={shade} vertices={[[edge,f,h*.6],[edge+step,f,h*.6],[edge+step,f+.9,h*.54],[edge,f+.9,h*.54]]} />
        <Polygon fill={shade} vertices={[[edge,f+.9,h*.54],[edge+step,f+.9,h*.54],[edge+step,f+.9,h*.47],[edge,f+.9,h*.47]]} /></g>;
    })}
  </>;
  return id === 'tea' ? <g>{shop}</g> : (
    <a className="drive-map-stop" href={destinations[id].href} aria-label={'Explore ' + destinations[id].name} onClick={(event) => openDestination(event,id,onOpen)}>
      <title>{destinations[id].name}</title>{shop}
      <polygon className="drive-map-focus" points={shape([[l-.65,back-.5,h+.4],[r+.65,back-.5,h+.4],[r+.65,f+.9],[l-.65,f+.9],[l-.65,f+.9,h+.4]])} />
    </a>
  );
}

const foliage = 'M-17 3C-29 1-34-7-26-15c-2-9 7-15 15-14 3-8 15-12 23-5 10-4 20 0 22 7 14 2 19 11 13 19 4 8-7 16-16 13-8 7-22 8-29 3-7 1-12-1-15-5Z';
function Tree({ x,z,size = 1 }) {
  const [a,b] = point(x,z);
  return <g transform={'translate('+a+' '+b+') scale('+size+')'}>
    <ellipse cx="12" cy="2" rx="36" ry="7" fill="#768460" opacity=".51" transform="rotate(13)" />
    <path d="M-5 0 -1-13 -2-30 3-30 4-15 10-25 11-21 5-10 5 0Z" fill="#6f6650"/>
    <g transform="translate(-2 -30)">
      <path d={foliage} fill="#426e56"/>
      <path d="M-26-15c-1-9 8-14 15-14 4-9 17-11 24-5 12-4 20 1 21 8-5 9-13 13-20 10-11 8-20 6-25 1-6 4-11 3-15 0Z" fill="#718b60"/>
      <path d="M-15-27c11-8 20-10 27-5M-21-20l8-4M5-15l10-4" fill="none" stroke="#a1ac78" strokeWidth="2.2" strokeLinecap="round"/>
    </g>
  </g>;
}

function Pickup() {
  const [a,b] = point(SPAWN.x,SPAWN.z);
  return <g transform={'translate('+a+' '+b+') rotate(15)'} aria-hidden="true">
    <ellipse cx="6" cy="9" rx="28" ry="9" fill="#6c6953" opacity=".55"/>
    <g fill="#323f38"><ellipse cx="-16" cy="1" rx="5" ry="7"/><ellipse cx="8" cy="12" rx="6" ry="7"/><ellipse cx="21" cy="-2" rx="4" ry="6"/></g>
    <path d="m-23-5 13-17 36 6-12 22z" fill="#e87938"/><path d="m-23-5 37 11v7l-37-10z" fill="#c85b2d"/>
    <path d="m14 6 12-22v7L14 13z" fill="#9d4e2c"/>
    <path d="m-19-5 5-8 14 2-5 10z" fill="#8c512f"/><path d="m-16-6 4-5 9 2-3 6z" fill="#9b6643"/>
    <path d="m-6-12 6-10 13 2 6 11-2 6z" fill="#f79543"/><path d="m0-20 10 2 5 8-13-3z" fill="#5b807c"/>
    <path d="m-5-10 4-8 2 8z" fill="#477272"/><path d="m6-7 14-2 4-4-11 16z" fill="#f6a34d"/>
    <path d="m-21 1 6 2v2l-6-2z" fill="#d5b599"/><path d="m17 2 4-5v4l-4 5z" fill="#ffdd8b"/>
  </g>;
}

const trees = [[-23,-19,.8],[-13,-20,1.1],[22,-15,1.45],[23,0,.8],[-25,3,.8],[-3,1,1.37],[-23,16,1.1],[22,16,1.25],[8,-23,.8]];
const streets = 'M-37 -8 C-22 -8 -16 -8 -5 -7 S10 -7 18 -8 Q25 -8 24 0 Q24 8 17 9 L-14 9 Q-24 9 -24 1 T-17 -8 M0 27 C-.5 14 1 1 0 -7 M22 -7 Q25 -17 18 -23 Q16 -25 8 -24 L-14 -24 Q-23 -24 -24 -15 L-24 -8';

export default function DriveMap({onOpen}) {
  const subjects = [
    ...BUILDINGS.map((building) => ({ depth: point(building.x,building.z+building.depth/2)[1], key: building.id, draw: <Building building={building} onOpen={onOpen} /> })),
    ...trees.map(([x,z,size]) => ({depth: point(x,z)[1], key: 'tree'+x+z, draw: <Tree x={x} z={z} size={size} />})),
    {depth:point(SPAWN.x,SPAWN.z)[1],key:'pickup',draw:<Pickup/>},
  ].sort((a,b) => a.depth-b.depth);
  return (
    <div className="drive-illustration"><svg viewBox="43 5 896 505" role="group" aria-label="Kozhikode neighbourhood map. Select a storefront, the service workshop or Fazhere office.">
      <g transform={floor}>
        <path d="M-65-60H65V45H-65Z" fill="#c5c6a0"/>
        <g fill="none" stroke="#b3b68f" strokeWidth=".18" opacity=".6">{[-48,-44,-39,-34,21,27,31].map(s => <path key={s} d={'M-61 '+s+'q18 -5 39 0t37 1 42 -2'}/>)}</g>
        <path d="M-39-11q19-8 36-1t37 1l2 4-72 1Z" fill="#b1be96"/>
        <path d={streets} fill="none" stroke="#a3a68b" strokeWidth="6.9" strokeLinejoin="round" />
        <path d={streets} fill="none" stroke="#e6d6b3" strokeWidth="6.4" strokeLinejoin="round" />
        <path d={streets} fill="none" stroke="#978f7b" strokeWidth="5.3" strokeLinejoin="round" />
        <path d={streets} fill="none" stroke="#dfd3af" strokeWidth=".18" strokeDasharray="1.6 1.8" opacity=".85" />
        <path d="M-11 .7Q-12-4-9-4L-4-3 -3 4 -8 6Q-13 6-11 .7Z" fill="#a7b78c"/>
        <path d="M-1.5-6.4H2" fill="none" stroke="#ebdfbe" strokeWidth=".22"/>
        {Array.from({length:6},(_,i) => <path key={i} d={'M'+(5.9+i*.43)+' -9.8v4.2'} stroke="#e7dab8" strokeWidth=".22"/>)}
        {[[-25,-11],[-7,-12],[12,-20],[-23,13],[10,12],[4,15]].map(([a,b])=><g key={a+','+b} transform={'translate('+a+' '+b+')'} stroke="#848f65" strokeWidth=".12"><path d="M0 .5 -.2 0M.1 .4 .2-.2M.32 .5 .7 .2"/></g>)}
      </g>
      {subjects.map(({key,draw})=><g key={key}>{draw}</g>)}
    </svg></div>
  );
}
