export class MusicPlayer {
 constructor(muted,fallback){this.muted=muted;this.enabled=true;this.fallback=fallback;this.track=new Audio(`${import.meta.env.BASE_URL}audio/trilha.mp3`);this.effect=new Audio(`${import.meta.env.BASE_URL}audio/fahh.mp3`);this.track.id='soundtrack';this.effect.id='loss-sound';this.track.hidden=true;this.effect.hidden=true;document.body.append(this.track,this.effect);this.track.loop=true;this.track.volume=.32;this.effect.volume=.8;this.track.preload='auto';this.effect.preload='auto';this.mute(muted);this.button=document.getElementById('music-toggle');this.button.onclick=()=>{this.enabled=!this.enabled;this.button.textContent=this.enabled?'♫ MÚSICA ON':'♫ MÚSICA OFF';if(this.enabled)this.theme();else this.track.pause();};this.button.textContent='♫ MÚSICA ON';}
 theme(){this.effect.pause();this.effect.currentTime=0;if(this.enabled&&!this.muted)this.track.play().catch(()=>{});}
 fail(){this.track.pause();if(this.muted)return true;this.effect.currentTime=0;this.effect.play().catch(()=>this.fallback());return true;}
 mute(value){this.muted=value;this.track.muted=value;this.effect.muted=value;if(value)this.track.pause();}
 stop(){this.track.pause();this.effect.pause();this.effect.currentTime=0;}
 pause(){this.track.pause();}
}
export function decorateFestival(){const el=document.querySelector('.bunting');el.innerHTML='<div class="fest-wire"></div>'+Array.from({length:24},(_,i)=>`<span class="fest-flag" style="--i:${i};--color:${['#ffdf00','#009c3b','#ef7453','#47aecb'][i%4]};left:${i*4.3}%"></span><i class="fest-bulb" style="--i:${i};left:${i*4.3+2.4}%;--color:${['#ffe577','#ff876a','#80ffd4','#a7cfff'][i%4]}"></i>`).join('');}
