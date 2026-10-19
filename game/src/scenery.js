import * as T from 'three';
import {Voxels,mat,box,mesh,label} from './pig.js';
export function detailedTree(parent,x,z,h=5,type='leaf'){
 const g=new T.Group();g.position.set(x,-4.8,z);parent.add(g);const v=new Voxels(.22);
 v.cube(0,h*.38,0,.45,h*.76,.45,0x76513b);v.cube(.12,h*.3,.23,.12,h*.55,.08,0xa87a4d);
 if(type==='palm'){for(let j=0;j<5;j++)v.cube(Math.sin(j*.4)*.12,j*h*.14,0,.5,.12,.5,0xb4915a);for(let k=0;k<7;k++){const a=k/7*Math.PI*2;for(let j=0;j<7;j++){const d=j*.33,y=h*.85+Math.sin(j*.6)*.45-j*.09;v.cube(Math.cos(a)*d,y,Math.sin(a)*d,.65-j*.045,.19,.65-j*.045,j%2?0x448247:0x68ad53);}}}else{
 for(const [dx,dy,dz,s,c] of [[0,.85,0,1.2,0x356b43],[-.7,.92,.1,1,0x448b4c],[.7,.95,-.1,1.1,0x4c9450],[0,1.12,0,1.1,0x6da951],[.6,1.08,.55,.72,0x8ab95b]])v.ellipsoid(dx,h*dy,dz,s,s*.83,s,c);
 for(let i=0;i<5;i++){const a=i*2.4;v.cube(Math.cos(a)*1.1,h*.94+Math.sin(a)*.5,.82,.16,.2,.16,0xe4b75b);}}
 g.add(v.build());return g;
}
export function detailedHouse(parent,x,z,i){
 const g=new T.Group();g.position.set(x,-4.8,z);parent.add(g);const colors=[0xec956a,0xebc353,0x46a2ae,0x9c87be,0xe8d9b7,0xdd6e71];const cache=new Map();const m=c=>{if(!cache.has(c))cache.set(c,mat(c));return cache.get(c);};const b=(c,x,y,z,w,h,d,r=0)=>box(g,m(c),x,y,z,w,h,d,r);
 const h=2.3+(i%3)*.55,w=3.2;b(0x8a7862,0,.12,0,w+.2,.24,2.7);b(colors[i%6],0,h/2+.2,0,w,h,2.4);b(0xf1e4be,0,h-.12,1.22,w,.14,.09);
 // Terracotta roof with individual staggered tile courses and a raised ridge.
 for(const side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<7;col++){const xx=-1.65+col*.53,zz=side*(row*.3+.1),yy=h+.75-row*.125;b((row+col)%3?0xae553d:0xd07949,xx,yy,zz,.55,.11,.38,0);}
 b(0xde9561,0,h+.8,0,3.7,.14,.16);
 // Recessed timber door, bright window reveals, shutters, lintels and flower boxes.
 b(0x5a3c35,-.65,.95,1.23,.7,1.5,.1);b(0x8b5d43,-.65,.95,1.3,.56,1.37,.08);b(0xf3ce69,-.43,.94,1.36,.07,.07,.05);
 for(const xx of [.67]){b(0xf4ebc7,xx,1.62,1.25,1.06,1.15,.12);b(0x285b70,xx,1.62,1.33,.83,.89,.06);b(0x79d4d1,xx-.18,1.72,1.37,.28,.65,.025);b(0xf4ebc7,xx,1.62,1.4,.07,.91,.05);b(0xf4ebc7,xx,1.62,1.4,.84,.07,.05);for(const s of [-1,1]){b(0x377875,xx+s*.65,1.62,1.27,.22,.95,.1);for(let j=0;j<5;j++)b(0x63a197,xx+s*.65,1.27+j*.16,1.34,.22,.04,.04);}b(0x97513c,xx,.96,1.5,1.05,.25,.36);for(let j=0;j<5;j++){b(0x588546,xx-.4+j*.2,1.16,1.5,.17,.22,.14);b([0xee7461,0xf6cc6b,0xcb7dc0][j%3],xx-.4+j*.2,1.3,1.52,.14,.14,.12);}}
 b(0xcfb794,0,.2,1.5,3.8,.14,.6);b(0xe9d2aa,0,.08,1.83,4.1,.12,.4);
 if(i%3===0){b(0x415d6f,-.8,h+.35,-.65,.7,.85,.7);b(0x91b8c1,-.8,h+.8,-.65,.8,.12,.8);}
 if(i%4===1){const text=['MERCEARIA','BAR DO ZÉ','PADARIA','LAN HOUSE'][Math.floor(i/4)%4];mesh(g,new T.PlaneGeometry(2.2,.4),label(text,'#183f47','#ffe6a3'),0,h-.42,1.28);for(let j=0;j<8;j++)b(j%2?0xf9e4a3:0xca524b,-1.65+j*.47,h-.82,1.6,.46,.11,.7);}
 return g;
}
export function enrichWorld(group,map,movers){
 const cache=new Map();const m=c=>{if(!cache.has(c))cache.set(c,mat(c));return cache.get(c);};const b=(p,c,x,y,z,w,h,d,r=0)=>box(p,m(c),x,y,z,w,h,d,r);const root=(x,y,z)=>{const g=new T.Group();g.position.set(x,y,z);group.add(g);return g;};
 const skyMat=new T.ShaderMaterial({depthWrite:false,uniforms:{top:{value:new T.Color(0x409fc7)},bottom:{value:new T.Color(0xffe2af)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec2 vUv;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(0.08,0.32,vUv.y)),1.);\n#include <colorspace_fragment>\n}',toneMapped:false});const sky=mesh(group,new T.PlaneGeometry(300,120),skyMat,0,15,-110);sky.castShadow=false;sky.receiveShadow=false;
 // A warm low sun and sculpted, stepped cloud banks.
 const sun=mesh(group,new T.CircleGeometry(2.1,32),new T.MeshBasicMaterial({color:0xffe9ab}),18,6.8,-66);sun.castShadow=false;
 for(let i=0;i<5;i++){const c=root(-34+i*17,7+(i%2)*2,-49);const v=new Voxels(.45);for(let j=0;j<4;j++)v.ellipsoid((j-1.5)*1.2,Math.sin(j*2)*.3,0,1.25,.65+.25*(j%2),.55,j%2?0xfff5dc:0xe9eddf);c.add(v.build());movers.push({type:'cloud',g:c,base:c.position.clone(),seed:i});}
 if(map.id==='cipo'){
  const tower=root(10,-4.8,-23);for(const x of [-.8,.8])for(const z of [-.7,.7])b(tower,0xa68c68,x,2.8,z,.16,5.6,.16);for(let j=0;j<4;j++){b(tower,0x7d7760,0,1+j*1.1,.7,1.7,.08,.08);b(tower,0x7d7760,0,1.5+j*1.1,.7,2,.08,.08,.6);}b(tower,0x478e9c,0,5.5,0,2.3,1.8,1.9);b(tower,0x80b7bd,0,6.45,0,2.55,.17,2.1);mesh(tower,new T.PlaneGeometry(1.95,.55),label('CIPÓ GUAÇU','#478e9c','#fff2bd'),0,5.6,.97);
  const church=root(-12,-4.8,-23);b(church,0xe7d4a4,0,2,0,4,4,3);b(church,0xd4b986,2,3,0,1.4,6,1.7);b(church,0xb15f3e,2,6.2,0,1.7,.3,1.9);b(church,0xe8d3a1,2,6.9,0,.12,1.1,.12);b(church,0xe8d3a1,2,7.1,0,.6,.12,.12);b(church,0x594a3c,0,1.2,1.53,.9,2.4,.08);b(church,0xf3d57b,0,3,1.54,.55,.65,.08);b(church,0x584d42,2,5.2,.87,.56,.75,.08);
 }
 // Scattered foreground flower beds and reeds give the ground scale and color.
 for(let i=0;i<35;i++){const x=-45+i*2.8,z=i%2?-3:-18;const g=root(x,-4.7,z);for(let j=0;j<3;j++){b(g,0x447547,j*.18,.16+j*.06,0,.065,.38,.065);b(g,map.id==='amazonia'?0xe78175:[0xf2ca67,0xe77686,0xab8bc6][i%3],j*.18,.4+j*.06,0,.18,.14,.15);}}
 // Low ripples slide independently of the land and shimmer with the sunlight.
 for(let i=0;i<22;i++){const wave=b(group,i%2?0x93dbd2:0xc4e9d4,-40+i*4,-4.68,-1-(i%3)*.7,1+(i%4)*.7,.025,.07);movers.push({type:'ripple',g:wave,base:wave.position.clone(),seed:i});}
 return skyMat;
}
