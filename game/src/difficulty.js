export const DIFFICULTIES={
 easy:{name:'De boa',speed:4.5,acceleration:.025,maxBoost:.9,gap:[5.8,6.7],spacing:[12,18],rise:1.4},
 normal:{name:'Na raça',speed:5.5,acceleration:.04,maxBoost:1.3,gap:[4.8,5.8],spacing:[10,16.5],rise:2.1},
 hard:{name:'Sem dó',speed:6.5,acceleration:.045,maxBoost:1.5,gap:[4.1,5.1],spacing:[8.8,14.5],rise:2.5}
};
export function flightSpeed(level,score){const d=DIFFICULTIES[level]||DIFFICULTIES.normal;return d.speed+Math.min(score*d.acceleration,d.maxBoost);}
export function nextGate(level,lastCenter=1,lastSpacing=0,random=Math.random){const d=DIFFICULTIES[level]||DIFFICULTIES.normal;let spacing=d.spacing[0]+random()*(d.spacing[1]-d.spacing[0]);if(Math.abs(spacing-lastSpacing)<1.5)spacing=spacing<(d.spacing[0]+d.spacing[1])/2?d.spacing[1]:d.spacing[0];const gap=d.gap[0]+random()*(d.gap[1]-d.gap[0]);const shift=(random()*2-1)*d.rise;const center=Math.max(-.7,Math.min(2.8,lastCenter+shift));return {spacing,gap,center};}
