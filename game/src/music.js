export class MusicPlayer {
 constructor(muted,fallback){this.muted=muted;this.enabled=true;this.fallback=fallback;this.track=new Audio(`${import.meta.env.BASE_URL}audio/trilha.mp3`);this.effect=new Audio(`${import.meta.env.BASE_URL}audio/fahh.mp3`);this.event=new Audio(`${import.meta.env.BASE_URL}audio/six-seven.mp3`);this.event.volume=.55;this.event.onended=()=>{this.track.volume=.32;};this.track.id='soundtrack';this.effect.id='loss-sound';this.track.hidden=true;this.effect.hidden=true;document.body.append(this.track,this.effect);this.track.loop=true;this.track.volume=.32;this.effect.volume=.8;this.track.preload='auto';this.effect.preload='auto';this.mute(muted);this.button=document.getElementById('music-toggle');this.button.onclick=()=>{this.enabled=!this.enabled;this.button.textContent=this.enabled?'♫ MÚSICA ON':'♫ MÚSICA OFF';if(this.enabled)this.theme();else this.track.pause();};this.button.textContent='♫ MÚSICA ON';}
 unlock(){
  try{this.ctx ||= new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});
   if(!this.buffers){this.buffers={};for(const [key,file] of [['loss','fahh.mp3'],['seven','six-seven.mp3']])fetch(`${import.meta.env.BASE_URL}audio/${file}`).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(b=>this.ctx.decodeAudioData(b)).then(b=>this.buffers[key]=b).catch(()=>{});}
  }catch{}
 }
 playEffect(key,volume){if(this.muted||!this.ctx||!this.buffers?.[key])return false;this.stopEffect();const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers[key];gain.gain.value=volume;source.connect(gain);gain.connect(this.ctx.destination);source.onended=()=>{source.disconnect();gain.disconnect();this.track.volume=.32;};source.start();this.activeEffect=source;return true;}
 stopEffect(){if(this.activeEffect){this.activeEffect.onended=null;try{this.activeEffect.stop();}catch{}this.activeEffect.disconnect();this.activeEffect=null;}this.track.volume=.32;}
 sixSeven(){if(this.muted)return;if(this.playEffect('seven',.55)){this.track.volume=.1;return;}this.track.volume=.1;this.event.currentTime=0;this.event.play().catch(()=>{this.track.volume=.32;});}
 theme(){this.stopEffect();this.effect.pause();this.effect.currentTime=0;if(this.enabled&&!this.muted)this.track.play().catch(()=>{});}
 fail(){this.stopEffect();this.event.pause();this.track.volume=.32;this.track.pause();if(this.muted)return true;if(this.playEffect('loss',.8))return true;this.effect.currentTime=0;this.effect.play().catch(()=>this.fallback());return true;}
 mute(value){this.muted=value;this.track.muted=value;this.effect.muted=value;this.event.muted=value;if(value){this.stopEffect();this.track.pause();}}
 stop(){this.stopEffect();this.event.pause();this.track.volume=.32;this.track.pause();this.effect.pause();this.effect.currentTime=0;}
 pause(){this.stopEffect();this.event.pause();this.track.volume=.32;this.track.pause();}
}
export function decorateFestival(){const el=document.querySelector('.bunting');el.innerHTML='<div class="fest-wire"></div>'+Array.from({length:24},(_,i)=>`<span class="fest-flag" style="--i:${i};--color:${['#ffdf00','#009c3b','#ef7453','#47aecb'][i%4]};left:${i*4.3}%"></span><i class="fest-bulb" style="--i:${i};left:${i*4.3+2.4}%;--color:${['#ffe577','#ff876a','#80ffd4','#a7cfff'][i%4]}"></i>`).join('');}
