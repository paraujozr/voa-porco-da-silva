import {MathUtils} from 'three';
export function animatePig(pig,{time,dt,state,velocity=0,pulse=0,dance=0}){
 const u=pig.userData;const fall=state==='playing'&&velocity< -2,hit=state==='over';const rate=hit?1:fall?5:12+pulse*12;const amplitude=hit?.05:fall?.18:.42+pulse*.3;
 u.wings.forEach((w,i)=>{w.rotation.x=MathUtils.damp(w.rotation.x,(i?1:-1)*Math.sin(time*rate)*amplitude,14,dt);w.rotation.z=MathUtils.damp(w.rotation.z,hit?(i?-.6:.6):0,8,dt);});
 u.ears?.forEach((e,i)=>e.rotation.z=(i?-.25:.25)+Math.sin(time*3+i)*.045);
 u.limbs?.forEach((limb,i)=>{const arm=i===1||i===3;const side=i<2?-1:1;const target=dance&&arm?side*(1.1+Math.sin(time*10+(i===1?0:Math.PI))*.65):side*.13;limb.rotation.z=MathUtils.damp(limb.rotation.z,target,12,dt);limb.rotation.x=MathUtils.damp(limb.rotation.x,hit?-.5:Math.sin(time*(fall?2:4)+i)*.17,10,dt);});
 if(state==='playing')pig.rotation.z=MathUtils.damp(pig.rotation.z,MathUtils.clamp(velocity*.04,-.45,.3)+(dance?Math.sin(time*10)*.1:0),10,dt);
 if(hit)pig.rotation.z=MathUtils.damp(pig.rotation.z,-1.15,4,dt);
}
