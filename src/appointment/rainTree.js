// Albizia-like spreading limbs and bipinnate sprays. Root, branch and leaf positions
// are deterministic so the sequence of stills and the live scene share a silhouette.
export function rainTree(T, m, g, parent) {
  const rng=m.random;
  const tree = g.group(parent,-3.6,0,-1.8);
  tree.scale.set(1.22,1.04,1.08);
  const positions=[], colors=[];
  const bark = new T.Color('#736652');
  const canopy = g.group(tree);
  const leafMatrices=[];
  const dummy=new T.Object3D();
  function limb(start, finish, radius, tip, bend) {
    const a=new T.Vector3(...start), b=new T.Vector3(...finish);
    const mid=a.clone().lerp(b,.46).add(new T.Vector3(...bend));
    const curve=new T.QuadraticBezierCurve3(a,mid,b);
    const frames=curve.computeFrenetFrames(8,false);
    const rings=[];
    for(let k=0;k<=8;k++) {
      const t=k/8, center=curve.getPoint(t);
      const ring=[];
      for(let i=0;i<11;i++){
        const theta=i/11*Math.PI*2;
        const r=(radius*(1-t)+tip*t)*(1+.22*Math.sin(theta*5+t*.7)+.07*Math.cos(theta*3));
        ring.push(center.clone().addScaledVector(frames.normals[k],r*Math.cos(theta)).addScaledVector(frames.binormals[k],r*Math.sin(theta)));
      }
      rings.push(ring);
    }
    for(let k=0;k<8;k++) for(let i=0;i<11;i++){
      const j=(i+1)%11, a=rings[k], b=rings[k+1];
      const shade=.76+.20*Math.sin(i*2.1)+rng()*.095;
      for(const v of [a[i],a[j],b[i],b[i],a[j],b[j]]) {
        positions.push(v.x,v.y,v.z); colors.push(bark.r*shade,bark.g*shade,bark.b*shade);
      }
    }
  }
  // Roots flare into the soil before the distinct fork, visible from both floors.
  for(let i=0;i<7;i++){
    const a=i*.897+.18;
    limb([.01,.86,.03],[Math.sin(a)*.93,.03,Math.cos(a)*.87],.12,.048,[.04,-.29,.02]);
  }
  limb([0,.03,0],[.17,2.96,-.20],.38,.24,[-.27,.05,.12]);
  const shade=['#677439','#81914a','#98a356','#577348','#778542'];
  const colours=[];
  // Several forks spring from three sinuous leaders. Keep the woody limbs
  // inside the rain court until they clear the adjacent roof.
  const leaders=[[-.87,4.45,.41],[.83,4.76,-.47],[-.36,4.58,-1.08]];
  leaders.forEach((end,i)=>limb([.12,2.16+i*.31,-.19],end,.20-i*.025,.104,
    [end[0]*.43,-.32,end[2]*.3]));
  for(let i=0;i<10;i++){
    const origin=leaders[i%3];
    const a=i*2.399+.23;
    const crown=[Math.cos(a)*(1.18+rng()*.48),5.54+rng()*1.08,Math.sin(a)*(1.53+rng()*.59)];
    limb(origin,crown,.109+rng()*.029,.048,[Math.cos(a)*.32,.27,Math.sin(a)*.41]);
    for(let l=0;l<4;l++){
      const yaw=a+(l-1.5)*.47;
      const end=[crown[0]+Math.cos(yaw)*(.47+rng()*1.29),crown[1]+.52+rng()*.75,crown[2]+Math.sin(yaw)*(.56+rng()*1.13)];
      limb(crown,end,.068,.024,[Math.cos(yaw)*.17,.11,Math.sin(yaw)*.17]);
      for(let n=0;n<3;n++){
        const dir=yaw+(n-1)*.55;
        const twig=[end[0]+Math.cos(dir)*(.23+rng()*.63),end[1]+.08+rng()*.45,end[2]+Math.sin(dir)*(.31+rng()*.61)];
        limb(end,twig,.032,.006,[.06,.03,-.04]);
        for(let v=0;v<6;v++) {
          dummy.position.set(twig[0]+(rng()-.5)*.82,twig[1]+(rng()-.5)*.65,twig[2]+(rng()-.5)*.84);
          dummy.rotation.set(-.35-rng()*1.06,rng()*6.28,(rng()-.5)*2.1,'YXZ');
          dummy.scale.set(.75+rng()*.87,.58+rng()*.60,1);
          dummy.updateMatrix(); leafMatrices.push(dummy.matrix.clone());
          colours.push(new T.Color(shade[Math.floor(rng()*shade.length)]));
        }
      }
    }
  }
  const branches=new T.BufferGeometry();
  branches.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  branches.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  branches.computeVertexNormals();
  const trunk=new T.Mesh(g.register(branches),m.surface({vertexColors:true,roughness:.98,side:T.DoubleSide}));
  trunk.castShadow=true; trunk.receiveShadow=true; tree.add(trunk);
  const twigMap=m.canvasMap(192,192,(ctx,w,h)=>{
    ctx.strokeStyle='#aaa083'; ctx.lineCap='round';
    function stroke(ax,ay,bx,by,width) {ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}
    stroke(11,168,172,32,2.5);
    for(let j=0;j<7;j++){
      const x=23+j*22,y=158-j*19;
      for(const sign of [-1,1]){
        const reach=(1-Math.abs(j-2.5)*.11)*(52+rng()*11);
        const vx=(sign<0?-.34:.92)*reach,vy=(sign<0?-1.05:.23)*reach;
        stroke(x,y,x+vx,y+vy,1.6);
        for(let i=0;i<7;i++){
          const t=(i+.4)/7;
          for(const side of [-1,1]){
            const leafLen=(1-.48*t)*(7+rng()*3);
            const ang=Math.atan2(vy,vx)+side*.76;
            ctx.save();ctx.translate(x+vx*t+Math.cos(ang)*leafLen*.6,y+vy*t+Math.sin(ang)*leafLen*.6);
            ctx.rotate(ang);
            const b=167+Math.floor(rng()*74); ctx.fillStyle='rgb('+b+','+Math.min(255,b+9)+','+Math.floor(b*.78)+')';
            ctx.beginPath(); ctx.ellipse(0,0,leafLen,3.0-rng()*.76,0,0,Math.PI*2);ctx.fill();ctx.restore();
          }
        }
      }
    }
  });
  const foliage = m.surface({map:twigMap,alphaTest:.33,side:T.DoubleSide,roughness:1});
  const sprays = new T.InstancedMesh(g.register(new T.PlaneGeometry(1.25,1.14)),foliage,leafMatrices.length);
  leafMatrices.forEach((matrix,i)=>{sprays.setMatrixAt(i,matrix);sprays.setColorAt(i,colours[i]);});
  sprays.castShadow=true; sprays.receiveShadow=true; sprays.computeBoundingSphere(); canopy.add(sprays);
  return { update(t){canopy.rotation.y=.0024*Math.sin(t*.48);canopy.rotation.z=.0014*Math.sin(t*.31);} };
}
