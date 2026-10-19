import {MathUtils as M} from 'three';
// Integrate wing phase instead of multiplying time by a changing speed: no pose jumps.
export function animatePig(pig,{time,dt,state,velocity=0,pulse=0,dance=0}){
 const u=pig.userData,a=u.motion ||= {phase:0,rate:8,energy:0},flying=state==='playing',hit=state==='over';
 const falling=flying?M.clamp((-velocity-1)/9,0,1):0;
 a.rate=M.damp(a.rate,hit?2:8+Math.max(0,pulse)*10-falling*3,6,dt);
 a.energy=M.damp(a.energy,pulse,12,dt);a.phase+=a.rate*dt;
 const beat=Math.sin(a.phase),lift=Math.sin(a.phase-.6),strength=hit?.1:.38+a.energy*.45;
 u.wings.forEach((wing,i)=>{const side=i?1:-1;wing.rotation.z=M.damp(wing.rotation.z,side*(hit?.6:beat*strength+.12*falling),16,dt);wing.rotation.x=M.damp(wing.rotation.x,.12+Math.cos(a.phase+.3)*strength*.45,12,dt);wing.rotation.y=M.damp(wing.rotation.y,side*(.16+Math.sin(a.phase-.5)*.15),10,dt);});
 if(u.body){u.body.position.y=M.damp(u.body.position.y,-.25+(hit?0:lift*.035+a.energy*.035),12,dt);u.body.rotation.x=M.damp(u.body.rotation.x,hit?.16:-.08-a.energy*.12+falling*.13,8,dt);u.body.scale.y=M.damp(u.body.scale.y,1+a.energy*.035-Math.cos(a.phase)*.012,10,dt);}
 if(u.head){u.head.position.y=M.damp(u.head.position.y,.82+(hit?-.08:Math.sin(a.phase-.9)*.045),10,dt);u.head.rotation.z=M.damp(u.head.rotation.z,hit?.2:-velocity*.012+Math.sin(time*2)*.025,6,dt);u.head.rotation.x=M.damp(u.head.rotation.x,falling*.12-a.energy*.08,8,dt);}
 u.ears?.forEach((ear,i)=>{const side=i?1:-1;ear.rotation.z=M.damp(ear.rotation.z,(u.dog?side*2.4:-side*.25)+Math.sin(a.phase-1+i*.2)*.08,8,dt);ear.rotation.x=M.damp(ear.rotation.x,-a.energy*.2+falling*.3+Math.sin(a.phase-1.4)*.07,8,dt);});
 u.limbs?.forEach((limb,i)=>{const arm=i===1||i===3,side=i<2?-1:1;const wave=Math.sin(a.phase-1+(arm?0:.8)+i*.35);const target=dance&&arm?side*(1.1+Math.sin(time*10+(i===1?0:Math.PI))*.65):side*((arm?.2:.12)+(arm?.12:.06)*wave+falling*(arm?.3:.1));limb.rotation.z=M.damp(limb.rotation.z,target,9,dt);limb.rotation.x=M.damp(limb.rotation.x,hit?-.5:(arm?-.12:.15)+wave*(arm?.16:.25)-a.energy*(arm?.28:.45),7,dt);});
 if(u.tail)u.tail.rotation.x=M.damp(u.tail.rotation.x,Math.sin(a.phase-1.8)*.3,8,dt);
 if(flying){pig.rotation.z=M.damp(pig.rotation.z,M.clamp(velocity*.055,-.55,.34)+(dance?Math.sin(time*10)*.1:Math.sin(a.phase-.4)*.025),5,dt);pig.rotation.y=M.damp(pig.rotation.y,.24+Math.sin(a.phase*.5)*.06,6,dt);}
 if(hit)pig.rotation.z=M.damp(pig.rotation.z,-1.15,4,dt);
}
