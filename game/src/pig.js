import * as T from 'three';
// Surface-only voxel meshing: one draw call per articulated part, no hidden cube faces.
export class Voxels {
 constructor(size=.13){this.size=size;this.cells=new Map();}
 set(x,y,z,c){this.cells.set(`${x},${y},${z}`,c);}
 cube(cx,cy,cz,w,h,d,color){const s=this.size;for(let x=Math.round((cx-w/2)/s);x<Math.round((cx+w/2)/s);x++)for(let y=Math.round((cy-h/2)/s);y<Math.round((cy+h/2)/s);y++)for(let z=Math.round((cz-d/2)/s);z<Math.round((cz+d/2)/s);z++)this.set(x,y,z,color);return this;}
 ellipsoid(cx,cy,cz,rx,ry,rz,color){const s=this.size;for(let x=Math.floor((cx-rx)/s);x<=Math.ceil((cx+rx)/s);x++)for(let y=Math.floor((cy-ry)/s);y<=Math.ceil((cy+ry)/s);y++)for(let z=Math.floor((cz-rz)/s);z<=Math.ceil((cz+rz)/s);z++){if(((x*s-cx)/rx)**2+((y*s-cy)/ry)**2+((z*s-cz)/rz)**2<=1)this.set(x,y,z,typeof color==='function'?color(x*s,y*s,z*s):color);}return this;}
 build(){const s=this.size,vertices=[],colors=[],normals=[];const faces=[[[1,0,0],[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]],[[-1,0,0],[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]],[[0,1,0],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]],[[0,-1,0],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]],[[0,0,1],[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]],[[0,0,-1],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]]];for(const [key,hex] of this.cells){const [x,y,z]=key.split(',').map(Number);const c=new T.Color(hex);const shade=1+(((Math.abs(x*73+y*37+z*17)%9)-4)*.003);c.multiplyScalar(shade);for(const [n,points] of faces){if(this.cells.has(`${x+n[0]},${y+n[1]},${z+n[2]}`))continue;for(const idx of [0,1,2,0,2,3]){const p=points[idx];vertices.push((x+p[0]-.5)*s,(y+p[1]-.5)*s,(z+p[2]-.5)*s);normals.push(...n);colors.push(c.r,c.g,c.b);}}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeBoundingSphere();const m=new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true}));m.castShadow=true;m.receiveShadow=true;return m;}
}
export const mat=c=>new T.MeshLambertMaterial({color:c});
export function mesh(parent,geo,material,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function box(p,m,x,y,z,w,h,d,r=0){const o=mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);o.rotation.z=r;return o;}
export function ball(p,m,x,y,z,sx,sy=sx,sz=sx){return box(p,m,x,y,z,sx*2,sy*2,sz*2);}
export function disposeGroup(group){const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});group.removeFromParent();}
export function label(text,bg='#15334c',fg='#ffdf65',w=512){const c=document.createElement('canvas');c.width=w;c.height=112;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,112);ctx.fillStyle=fg;ctx.font=`900 ${Math.min(74,(w-28)/(text.length*.63))}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,58,w-24);const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;t.minFilter=T.LinearFilter;t.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:t,side:T.DoubleSide});}
export function makePig(data){
 const g=new T.Group(),id=data.id,skin=data.skin,shirt=data.shirt;
 const C={dark:0x292339,hoof:0x382735,pink:0xe67d91,inner:0xf38da2,white:0xfff7e8,gold:0xffc547};
 const part=(parent,fn,size=.065)=>{const v=new Voxels(size);fn(v);const o=v.build();parent.add(o);return o;};
 const group=(p,x,y,z)=>{const o=new T.Group();o.position.set(x,y,z);p.add(o);return o;};
 const cube=(p,c,x,y,z,w,h,d,r=0)=>box(p,mat(c),x,y,z,w,h,d,r);
 const oval=(p,c,x,y,z,rx,ry,rz)=>part(p,v=>v.ellipsoid(x,y,z,rx,ry,rz,c));
 const patch=(p,text,x,y,z,w,h,bg='#fff7e8',fg='#24304a')=>{cube(p,0x263044,x,y,z,w+.04,h+.04,.045);if(typeof document!=='undefined')mesh(p,new T.PlaneGeometry(w,h),label(text,bg,fg,256),x,y,z+.025);};
 const body=group(g,-.12,-.25,0);
 part(body,v=>{v.ellipsoid(0,0,0,.68,.78,.47,shirt);v.ellipsoid(0,.65,0,.4,.3,.33,skin);});
 // A complete jacket or shirt wraps around the torso. Hems and seams read at game scale.
 const dressed=!['mandrake','babe','torresmo','waddles','hamm','hawk'].includes(id);
 if(dressed){cube(body,0x26334e,0,-.59,.37,1.03,.13,.18);cube(body,new T.Color(shirt).multiplyScalar(.65),0,-.05,.465,.055,1.05,.045);}
 const head=group(g,.03,.82,.02);
 part(head,v=>{v.ellipsoid(0,0,0,.79,.7,.58,skin);v.ellipsoid(-.47,-.18,.38,.28,.27,.22,skin);v.ellipsoid(.47,-.18,.38,.28,.27,.22,skin);});
 // Two high contrast eyes, raised brows, muzzle and mouth are separate sculpted features.
 for(const side of [-1,1]){oval(head,C.white,side*.33,.16,.5,.23,.29,.105);oval(head,C.dark,side*.30,.14,.59,.115,.17,.045);cube(head,C.white,side*.30-.025,.23,.64,.075,.09,.025);cube(head,0x784a47,side*.34,.48,.48,.31,.07,.07,side*.1);oval(head,0xf08b98,side*.54,-.23,.48,.14,.1,.045);}
 oval(head,0xb94d70,0,-.22,.59,.39,.245,.21);oval(head,0xf299a6,0,-.19,.73,.36,.205,.13);
 for(const side of [-1,1])oval(head,0x772f4e,side*.145,-.17,.85,.065,.09,.03);
 cube(head,0x643346,0,-.49,.53,.34,.06,.05);cube(head,0xffffff,.11,-.47,.56,.12,.07,.03);
 const ears=[];for(const side of [-1,1]){const e=group(head,side*.55,.53,-.04);e.rotation.z=-side*.25;part(e,v=>{v.ellipsoid(0,.2,0,.225,.36,.15,skin);v.ellipsoid(0,.22,.13,.13,.24,.055,C.inner);});ears.push(e);}
 const limbs=[];for(const side of [-1,1]){const leg=group(g,-.12+side*.38,-.94,.02);leg.rotation.z=side*.12;part(leg,v=>{v.ellipsoid(0,-.13,0,.22,.3,.24,dressed?0x35516d:skin);v.cube(0,-.38,.13,.44,.24,.52,id==='peppa'?C.gold:C.hoof);v.cube(0,-.39,.4,.045,.19,.035,0x171c2b);});limbs.push(leg);const arm=group(body,side*.61,.22,.02);arm.rotation.z=side*.22;part(arm,v=>{v.ellipsoid(0,-.13,0,.23,.34,.27,dressed?shirt:skin);v.ellipsoid(0,-.46,.07,.21,.22,.23,id==='piggy'?0xb17bd6:skin);v.cube(0,-.58,.16,.3,.1,.23,C.hoof);});limbs.push(arm);}
 const tail=group(body,-.64,-.28,-.1);part(tail,v=>{for(let i=0;i<22;i++){const a=i/21*Math.PI*2;v.cube(-.12-Math.sin(a)*.18,Math.cos(a)*.18,-i*.007,.09,.09,.09,skin);}});
 function cap(color,accent,backward=false){oval(head,color,0,.54,-.04,.79,.3,.61);cube(head,accent,0,.55,.52,1.25,.11,.22);cube(head,color,backward?-.72:0,.5,backward?-.05:.71,backward?.55:1.45,.09,backward?.6:.52);cube(head,accent,0,.83,-.04,.12,.09,.12);}
 function collar(color){for(const side of [-1,1])cube(body,color,side*.19,.49,.43,.32,.22,.08,-side*.36);}
 function shades(){for(const side of [-1,1]){cube(head,0x181d35,side*.34,.17,.66,.65,.43,.11);cube(head,0x48d7e9,side*.34,.22,.73,.51,.22,.035);cube(head,0xb66dde,side*.34,.06,.735,.51,.1,.04);cube(head,0xcaffff,side*.34-.12,.25,.76,.06,.18,.025,-.4);}cube(head,0xed559d,0,.21,.7,.12,.09,.1);}
 function chain(){for(let i=0;i<17;i++){const x=(i/16-.5)*1.12;cube(body,i%2?0xffe58c:C.gold,x,.18-(1-(x/.6)**2)*.35,.5,.095,.11,.07,i%2?.18:-.18);}oval(body,0xa36925,0,-.35,.55,.18,.22,.055);oval(body,C.gold,0,-.32,.61,.15,.19,.04);cube(body,0xfff2b0,-.04,-.29,.66,.045,.16,.02);}
 if(id==='mandrake'){cap(0x182b50,0xee5c9d,true);shades();chain();cube(body,0x1b344b,0,-.58,.07,1.08,.3,.85);for(const s of [-1,1])cube(body,0x57cedb,s*.39,-.62,.51,.1,.22,.05);patch(head,'CRIA',-.18,.64,.49,.48,.17,'#14294b','#ffdc69');}
 if(id==='clt'){collar(C.white);cube(body,0x24466e,0,.1,.52,.12,.66,.055);cube(body,0x24466e,0,-.24,.52,.18,.18,.055,Math.PI/4);patch(body,'CLT',.32,.13,.48,.36,.3);cube(body,0x72513d,-.92,-.5,.12,.56,.65,.38);cube(body,0xd5ac74,-.92,-.5,.33,.55,.07,.03);cube(body,0x493426,-.92,-.11,.12,.3,.13,.2);}
 if(id==='maker'){cap(0x191c30,0xf04a91);collar(0xf04a91);patch(body,'FIAP',0,.17,.51,.83,.27,'#222338','#ff4e93');patch(body,'MAKER LAB',0,-.16,.49,.77,.16,'#222338','#f7f1e7');cube(body,0x1c7e6e,-.86,-.25,.31,.44,.6,.12);cube(body,0x1c2b3a,-.86,-.25,.39,.2,.24,.03);for(let i=0;i<4;i++)cube(body,C.gold,-1.01+i*.1,-.02,.39,.04,.1,.03);}
 if(id==='obra'){oval(head,0xf5bf35,0,.5,0,.82,.42,.64);cube(head,0xffda56,0,.49,.1,1.8,.12,1.5);cube(head,0xffda56,0,.8,.02,.15,.23,1.02);for(const s of [-1,1])cube(body,C.white,s*.34,0,.45,.12,1,.09);cube(body,C.white,0,-.31,.47,1.1,.12,.08);patch(head,'OBRA',0,.66,.61,.56,.18,'#ffcf3f','#293647');}
 if(id==='craque'){collar(0x16844f);patch(body,'10',0,.08,.5,.58,.56,'#f4d14b','#12683d');cube(head,0xf9e3a2,0,.49,.49,1.24,.12,.16);}
 if(id==='praia'){oval(head,0xddae64,0,.61,0,.58,.32,.52);cube(head,0xf3d590,0,.45,.1,1.9,.12,1.7);cube(head,0x83553a,0,.55,.5,1.15,.15,.12);shades();patch(body,'MATE',0,.1,.5,.6,.25,'#4ab4bc','#fff4db');}
 if(id==='delivery'){cap(0xcb3547,0xffd6a4);cube(body,0xc63849,0,.15,-.65,1.3,1.2,.5);patch(body,'EXPRESS',0,.13,.5,.8,.25,'#283b51','#fff0db');}
 if(id==='maromba'){cube(head,0xb6df65,0,.48,.5,1.35,.16,.18);patch(body,'TÁ PAGO',0,.11,.5,.85,.26,'#8559a5','#ffffff');}
 if(id==='coroa'||id==='rabico'){cube(head,C.gold,0,.63,0,1.35,.26,1.02);for(const x of [-.54,0,.54])cube(head,C.gold,x,.86,.39,.18,.38,.2);oval(head,0xde456c,0,.69,.55,.14,.14,.04);if(id==='rabico')collar(C.white);else chain();}
 if(id==='babe'){collar(0xa53839);oval(body,C.gold,0,.28,.5,.13,.15,.05);}
 if(id==='porky'){collar(C.white);for(const s of [-1,1])cube(body,0xdb3c51,s*.17,.4,.57,.27,.24,.09,s*.28);cube(body,0xad233a,0,.4,.63,.13,.13,.06);}
 if(id==='piggy'){oval(head,0xe7b44d,0,.55,-.12,.8,.4,.62);for(const s of [-1,1])for(let i=0;i<3;i++)oval(head,i%2?0xf4cb68:0xd79b3b,s*(.6+i*.025),.4-i*.25,.02,.2,.34,.27);for(const s of [-1,1]){cube(head,C.dark,s*.34,.43,.59,.41,.065,.06,s*.12);oval(head,C.gold,s*.74,-.25,.13,.09,.13,.06);}for(let i=0;i<9;i++)oval(body,C.white,(i-4)*.11,.33-Math.sin(i/8*Math.PI)*.2,.5,.055,.06,.04);}
 if(id==='piglet'){for(let i=0;i<4;i++)cube(body,0x8b2c64,0,.34-i*.25,.44,1.02,.075,.1);ears.forEach(e=>e.scale.y=1.45);}
 if(id==='peppa'){part(body,v=>{for(let y=-.65;y<.15;y+=.065)v.ellipsoid(0,y,0,.72-(y+.65)*.2,.05,.5,0xdd3d50);});}
 if(id==='torresmo'){for(const [x,y] of [[-.4,.1],[.3,-.3]])oval(body,0x825136,x,y,.43,.2,.16,.04);oval(head,0x956447,.49,.42,.44,.19,.13,.06);}
 if(id==='gobbato'){collar(C.white);patch(body,'P',0,.15,.5,.48,.5,'#ffffff','#08723f');for(const s of [-1,1])cube(head,C.white,s*.38,-.32,.68,.11,.35,.12,s*-.2);}
 if(id==='spiderham'){
  const red=0xd72b43,ink=0x14223d,blue=0x2455b4;
  // Sculpted mask, stepped lenses and raised webbing remain readable at play scale.
  oval(head,red,0,0,.02,.81,.71,.59);
  for(const side of [-1,1]){
   part(head,v=>{for(let row=0;row<5;row++){const width=.48-row*.055;v.cube(side*(.31+row*.012),.32-row*.075,.665,width,.08,.09,ink);v.cube(side*(.31+row*.012),.31-row*.065,.72,Math.max(.09,width-.10),.06,.035,0xfff9ef);}},.035);
   for(let i=0;i<3;i++)cube(head,ink,side*(.14+i*.19),.47-i*.04,.55-i*.025,.025,.3,.025,side*-.45);
   cube(body,blue,side*.42,-.14,.39,.29,.8,.2);
   oval(limbs[side===-1?1:3],red,0,-.44,.07,.235,.27,.25);
   oval(limbs[side===-1?0:2],blue,0,-.08,0,.23,.25,.25);
   cube(limbs[side===-1?0:2],red,0,-.34,.13,.47,.34,.54);
   for(let i=0;i<3;i++)cube(body,ink,side*.15,.16-i*.08,.56,.3,.025,.035,side*(.5-i*.5));
  }
  cube(body,red,0,.12,.49,.5,.87,.1);oval(body,ink,0,.12,.56,.085,.14,.035);oval(body,ink,0,.29,.56,.055,.06,.035);
  for(const side of [-1,1])for(let i=0;i<4;i++)cube(body,ink,side*.16,.2-i*.08,.57,.27,.025,.03,side*(.65-i*.4));
  oval(head,red,0,-.2,.73,.37,.215,.14);for(const side of [-1,1])oval(head,ink,side*.145,-.17,.86,.06,.08,.025);
  for(const y of [.43,-.02,-.4])cube(head,ink,0,y,.61,1.1,.025,.025);
  cube(head,ink,0,.29,.62,.025,.66,.03);
 }
 if(id==='waddles'){oval(body,0xb7667d,-.35,.25,.4,.28,.28,.1);oval(head,0xb7667d,-.47,.47,.31,.25,.2,.17);}
 if(id==='hamm'){cube(head,0x513040,0,.68,0,.62,.055,.12);oval(body,0xb2804e,0,-.15,.48,.21,.21,.045);}
 if(id==='hawk'){collar(0x357d4f);oval(body,0xc8d5b1,0,.28,.54,.15,.18,.05);}
 // Raised feather fans sit behind the shoulders, leaving costume and face unobstructed.
 const wings=[];for(const side of [-1,1]){const w=group(g,-.12+side*.51,.1,-.38);w.rotation.y=side*.16;for(let i=0;i<5;i++){const f=group(w,side*(.2+i*.15),.13+i*.12,-.04);f.rotation.z=-side*(.43+i*.12);part(f,v=>{v.ellipsoid(0,.28,0,.14,.62-i*.045,.1,0xaac4da);v.ellipsoid(-side*.025,.32,.055,.115,.56-i*.04,.075,i%2?0xf4f8ed:0xdcecf0);},.065);}wings.push(w);}
 g.userData={wings,ears,limbs};return g;
}
