export default function ForgeFallback() {
  return <div className="forge-poster" aria-hidden="true"><svg viewBox="0 0 800 800" fill="none">
    <defs>
      <linearGradient id="steel" x1="140" y1="140" x2="650" y2="630" gradientUnits="userSpaceOnUse"><stop stopColor="#b7b3a8"/><stop offset=".35" stopColor="#6b6a63"/><stop offset=".7" stopColor="#252522"/><stop offset="1" stopColor="#8d8b80"/></linearGradient>
      <linearGradient id="rubber" x1="260" y1="260" x2="540" y2="600"><stop stopColor="#353631"/><stop offset="1" stopColor="#131412"/></linearGradient>
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0h6" stroke="#fff" strokeOpacity=".08"/></pattern>
    </defs>
    <g transform="translate(405 402) rotate(-29) skewY(9)">
      <path d="M-230 140C-270 215 235 245 255 80" stroke="#373832" strokeWidth="15"/>
      <path d="M-230 140C-270 215 235 245 255 80" stroke="#8c8a79" strokeWidth="2"/>
      <rect x="-285" y="-25" width="570" height="50" rx="9" fill="url(#steel)" stroke="#b1afa4"/>
      {[-170, 170].map((x,i) => <g key={x} transform={`translate(${x} 0)`}>
        <ellipse cx="15" rx="76" ry="181" fill="#171814" stroke="#74766a" strokeWidth="2"/>
        <ellipse rx="76" ry="181" fill="url(#rubber)" stroke="#909184" strokeWidth="2"/>
        <ellipse rx="60" ry="153" stroke="#53574c" strokeWidth="2"/>
        <ellipse rx="51" ry="135" stroke="#45483f" strokeWidth="14"/>
        <path d={`M${i ? -20 : 20} -169a74 169 0 0 ${i ? 0 : 1} 0 338`} stroke="#ff5c26" strokeWidth="5"/>
        <ellipse rx="17" ry="38" fill="url(#steel)" stroke="#acaa9e"/>
        {[-108,0,108].map(y=><ellipse key={y} cx="43" cy={y} rx="4" ry="6" fill="#aaa99c"/>)}
      </g>)}
      <path d="M-77-86L20-117 89-71 89 86-6 116-77 73Z" fill="#62635a" stroke="#a8a79c"/>
      <path d="M-77-86L-6-39 89-71M-6-39V116" stroke="#c7c3b4"/>
      <path d="M-57-38L-30-16-57 4M14-14L43 4 14 22" stroke="#ff5c26" strokeWidth="8"/>
      <path d="M-77 73L-6 116 89 86" stroke="#ff5c26" strokeWidth="3"/>
      <path d="M-269-17v34m9-34v34m9-34v34m9-34v34m9-34v34m9-34v34" stroke="#171814" strokeWidth="3"/>
    </g>
    <path d="M112 670h576M182 686h436" stroke="#4b4c43" strokeWidth="1"/>
  </svg></div>;
}
