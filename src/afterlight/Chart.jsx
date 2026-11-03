import { useId } from 'react';

// A hand-drawn plate accompanies the real-time scene and doubles as its low-motion chart.
export default function Chart({place}) {
  const id=useId().replaceAll(':','');
  const ref=name=>'url(#'+id+name+')';
  return <svg className={'al-chart al-chart--'+place} viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id={id+'sky'} x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#0b242c"/><stop offset=".66" stopColor="#44605a"/><stop offset="1" stopColor="#a58567"/></linearGradient>
      <linearGradient id={id+'sea'} x2=".15" y2="1"><stop stopColor="#446865"/><stop offset=".5" stopColor="#214748"/><stop offset="1" stopColor="#102e34"/></linearGradient>
      <linearGradient id={id+'ray'}><stop stopColor="#ffce85" stopOpacity=".75"/><stop offset="1" stopColor="#ffd599" stopOpacity=".06"/></linearGradient>
      <linearGradient id={id+'tower'}><stop stopColor="#cbb99b"/><stop offset=".42" stopColor="#ebdfc4"/><stop offset=".43" stopColor="#b9b29a"/><stop offset="1" stopColor="#626f66"/></linearGradient>
      <pattern id={id+'ripples'} width="73" height="17" patternUnits="userSpaceOnUse"><path d="M3 5q10-2 18 0m19 8q12-2 21-1" fill="none" stroke="#d4e2c7" opacity=".14"/></pattern>
    </defs>
    <rect width="800" height="310" fill={ref('sky')}/><circle cx="610" cy="82" r="15" fill="#ecdfb6" opacity=".81"/>
    <path d="M0 228Q91 160 151 202T276 182Q360 124 440 187T587 177Q673 122 800 190V320H0Z" fill="#405d57"/>
    <path d="M0 240Q84 204 153 221T300 203Q395 165 463 218T592 201Q702 157 800 217V320H0Z" fill="#324d48"/>
    <path d="M0 273q121-51 239-13l87-22 145 22 123-32 206 29v62H0Z" fill="#25443e"/>
    <path d="M0 297q129-19 241-3t231-6q153-14 328 10v202H0Z" fill={ref('sea')}/>
    <path d="M0 313h800v187H0Z" fill={ref('ripples')}/>
    <g stroke="#182e2e" strokeWidth="4">{[331,375,419,463,507,551,595,639,683,727].map(x=><path key={x} d={`M${x} 284v35l19-25`}/>)}</g>
    <path d="M319 280h432v11H319z" fill="#a58e6c"/><path d="M327 291h419" stroke="#172d2d" strokeWidth="5"/>
    <path d="M362 233l43-28 51 26v48h-94z" fill="#795b46"/><path d="m351 237 56-39 58 35-7 7-51-27-48 32z" fill="#3a3831"/>
    <path d="M460 210h148v73H460z" fill="#35514a"/><path d="m447 212 91-42 83 39-5 8-79-29-84 33z" fill="#6e5342"/><rect x="470" y="219" width="126" height="27" rx="1" fill="#dbceac"/><text x="533" y="237" fill="#31443e" textAnchor="middle" fontSize="13" fontWeight="bold" fontFamily="sans-serif">GYMDROBE</text><path d="M475 250h117v31H475z" fill="#c89965"/>
    <path d="M649 243l30-18 28 19v35h-58z" fill="#65716a"/><path d="m640 246 38-27 38 23-4 6-34-18-32 22z" fill="#463d35"/><path d="M674 253h12v17h-12z" fill="#f6c180"/>
    <path d="M92 316q70-46 144-31l38 21-81 25-103-2z" fill="#424c43"/><path d="M114 311l54-20 49 2-46 14z" fill="#7c7661"/>
    <path d="M150 290l10-158h24l12 158z" fill={ref('tower')}/><path d="M157 178h30l3 32h-35z" fill="#bd6946"/><path d="M152 245h40l2 25h-43z" fill="#b66b4b"/>
    <path d="M152 120h39v15h-39z" fill="#283c38"/><path d="M158 98h27v23h-27z" fill="#e8bc80"/><path d="M158 98v25m8-25v25m11-25v25m8-25v25" stroke="#53615a" strokeWidth="2"/><path d="m151 98 21-16 20 16z" fill="#343f3b"/><path d="M172 83v-9" stroke="#353c38" strokeWidth="2"/>
    <path d="M177 109l538 32-21 101z" fill={ref('ray')}/>
    <g fill="#df9f65" opacity=".72">{Array.from({length:20},(_,i)=><rect key={i} x={137+i*4+Math.sin(i*2)*17} y={335+i*8} width={17+i*1.5} height={i%2+1.5}/>)}</g>
    <g fill="#253c38" stroke="#b6956c" strokeWidth="2"><path d="M319 374q39 6 85-3l-13 12q-36 10-62 0z"/><path d="M348 371v-24l31 15v8z" fill="#726955"/></g>
    <path d="M290 394q37-5 74 0m-42 7q26-3 48 0m-57-12q28-4 51 0" stroke="#c0c8a2" opacity=".4" fill="none"/>
  </svg>;
}
