export class CloudTransport {
 constructor(url,storage,onProfile){this.url=url.replace(/\/$/,'');this.storage=storage;this.onProfile=onProfile;this.token=storage.getItem('voaporco-session')||'';this.watchers={};this.retry=1000;this.generation=0;}
 save(token){this.disconnect();this.token=token;this.storage.setItem('voaporco-session',token);}
 clear(){this.disconnect();this.token='';this.storage.setItem('voaporco-session','');}
 async call(method,data={},auth=true){
  if(!this.url)throw Error('Servidor online ainda não publicado.');
  let response;try{response=await fetch(`${this.url}/${method}`,{method:'POST',headers:{'Content-Type':'application/json',...(auth&&this.token?{Authorization:`Bearer ${this.token}`}:{})},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});}catch{throw Error('Sem conexão com o servidor. Confira a internet e tente novamente.');}
  let result;try{result=await response.json();}catch{throw Error('Servidor temporariamente indisponível.');}
  if(!response.ok||result.error){const e=Error(result.error||'Não foi possível concluir.');e.code=result.code;throw e;}return result;
 }
 disconnect(){this.generation++;clearTimeout(this.timer);clearInterval(this.heartbeat);if(this.socket){this.socket.onclose=null;this.socket.close();}this.socket=null;this.connecting=false;}
 async connect(){if(!this.token||this.socket||this.connecting)return;this.connecting=true;const generation=this.generation;
  try{const {ticket}=await this.call('socketTicket');if(generation!==this.generation)return;const url=new URL(`${this.url}/live`);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.searchParams.set('ticket',ticket);const ws=this.socket=new WebSocket(url);ws.onopen=()=>{this.retry=1000;this.subscribe();this.heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('{"type":"ping"}');},30000);};
   ws.onmessage=e=>{let data;try{data=JSON.parse(e.data);}catch{return;}if(data.type==='snapshot'){if(data.profile)this.onProfile(data.profile);for(const kind of ['room','board'])if(data[kind])this.watchers[kind]?.next(data[kind]);}else if(data.type==='error')this.notify(data.message);};
   ws.onclose=()=>{this.socket=null;clearInterval(this.heartbeat);this.notify('Reconectando ao servidor…');if(this.token&&generation===this.generation)this.schedule();};
  }catch(e){this.notify(e.message);if(generation===this.generation&&e.code!=='unauthenticated')this.schedule();}finally{if(generation===this.generation)this.connecting=false;}
 }
 schedule(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.connect(),this.retry);this.retry=Math.min(15000,this.retry*2);}
 notify(message){for(const watcher of Object.values(this.watchers))watcher.error?.(message);}
 subscribe(){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'watch',room:this.watchers.room?.value||null,level:this.watchers.board?.value||null}));}
 watch(kind,value,next,error){const watcher={value,next,error};this.watchers[kind]=watcher;this.connect();this.subscribe();return ()=>{if(this.watchers[kind]===watcher){delete this.watchers[kind];this.subscribe();}};}
}
