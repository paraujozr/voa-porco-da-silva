import {DurableObject} from 'cloudflare:workers';
import {randomUUID} from 'node:crypto';
import {createHandlers} from '../server/handlers.js';
import {freshProfile,nickname,LEVELS} from '../server/shared/engine.js';
import {Store} from './store.js';
import {ApiError,digest,secret,username,password,hashPassword,checkPassword} from './auth.js';
const GUEST_METHODS=new Set(['ensureProfile','setNickname','createRoom','joinRoom','readyRoom','duelTick','leaveRoom','socketTicket','me']);
const authMethods=new Set(['register','login','guest','recover']);
const errorResponse=e=>Response.json({error:e instanceof ApiError?e.message:'Não foi possível concluir. Tente novamente.',code:e.code||'internal'},{status:e.code==='unauthenticated'?401:e.code==='resource-exhausted'?429:400});
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',');
  if(origin&&!allowed.includes(origin))return new Response('Origem não autorizada',{status:403});
  const headers={'Access-Control-Allow-Origin':origin||allowed[0],'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'POST, GET, OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(new URL(request.url).pathname==='/health')return Response.json({ok:true,service:'voaporco-online'},{headers});
  try{const response=await env.GAME.get(env.GAME.idFromName('beta-v1')).fetch(request);if(response.status===101)return response;const out=new Response(response.body,response);for(const [k,v] of Object.entries(headers))out.headers.set(k,v);return out;}catch{return Response.json({error:'Servidor temporariamente indisponível.'},{status:503,headers});}
 }
};
export class GameServer extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.db=new Store(ctx.storage);this.handlers=createHandlers(this.db,ApiError);this.queue=Promise.resolve();}
 serial(fn){const next=this.queue.then(fn);this.queue=next.catch(()=>{});return next;}
 fetch(request){return this.serial(()=>this.handle(request).catch(errorResponse));}
 limit(key,max,window=60000){const id=`limits/${digest(key)}`,now=Date.now(),value=this.db.get(id)||{count:0,expires:now+window};if(++value.count>max)throw new ApiError('resource-exhausted','Muitas tentativas. Aguarde alguns minutos.');this.db.put(id,value);}
 session(token){if(!/^[a-f0-9]{64}$/.test(token||''))throw new ApiError('unauthenticated','Entre novamente para continuar.');const s=this.db.get(`sessions/${digest(token)}`);if(!s)throw new ApiError('unauthenticated','Sessão expirada. Entre novamente.');return s;}
 issue(uid,guest=false){const token=secret();this.db.put(`sessions/${digest(token)}`,{uid,guest,expires:Date.now()+(guest?21600000:604800000)});return {token,user:{uid,guest},profile:this.db.get(`profiles/${uid}`)};}
 async authenticate(method,data,ip){
  this.limit(`auth:${ip}`,20,900000);
  if(method==='guest'){const uid=`guest_${randomUUID()}`;this.db.put(`profiles/${uid}`,freshProfile(nickname(data.nickname||'Porco Visitante')));return this.issue(uid,true);}
  const name=username(data.username),key=`accounts/${name}`;this.limit(`account:${name}`,10,900000);const account=this.db.get(key);
  if(method==='register'){
   const pass=password(data.password);if(account)throw new ApiError('invalid-argument','Este usuário já está em uso. Escolha outro.');
   const credentials=await hashPassword(pass),uid=randomUUID(),recovery=secret();
   this.ctx.storage.transactionSync(()=>{this.db.put(key,{uid,...credentials,recovery:digest(recovery)});this.db.put(`profiles/${uid}`,freshProfile(name));});
   return {...this.issue(uid),recovery};
  }
  if(method==='recover'){
   password(data.password);if(!account||typeof data.recovery!=='string'||digest(data.recovery)!==account.recovery)throw new ApiError('unauthenticated','Usuário ou código de recuperação incorreto.');
   const credentials=await hashPassword(data.password),recovery=secret();this.db.put(key,{...account,...credentials,recovery:digest(recovery)});
   for(const row of this.db.sql.exec("SELECT id, body FROM documents WHERE id GLOB 'sessions/*'").toArray())if(JSON.parse(row.body).uid===account.uid)this.db.delete(row.id);
   for(const socket of this.ctx.getWebSockets())if(socket.deserializeAttachment()?.uid===account.uid)socket.close(1008,'Sessão encerrada');
   return {...this.issue(account.uid),recovery};
  }
  if(typeof data.password!=='string'||data.password.length>128)throw new ApiError('unauthenticated','Usuário ou senha incorretos.');
  // Run the same expensive derivation for unknown names to avoid a fast username oracle.
  const valid=await checkPassword(data.password,account||{salt:'00000000000000000000000000000000',hash:'0'.repeat(64)});
  if(!account||!valid)throw new ApiError('unauthenticated','Usuário ou senha incorretos.');return this.issue(account.uid);
 }
 async handle(request){
  const url=new URL(request.url);if(url.pathname==='/live')return this.connect(request,url);
  if(request.method!=='POST')return new Response('Método inválido',{status:405});
  if(Number(request.headers.get('Content-Length')||0)>200000)throw new ApiError('invalid-argument','Pedido muito grande.');
  const text=await request.text();if(text.length>200000)throw new ApiError('invalid-argument','Pedido muito grande.');
  let data;try{data=JSON.parse(text||'{}');}catch{throw new ApiError('invalid-argument','Pedido inválido.');}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new ApiError('invalid-argument','Pedido inválido.');
  const method=url.pathname.slice(1),ip=request.headers.get('CF-Connecting-IP')||'local';
  this.db.cleanup();if(authMethods.has(method))return Response.json({...await this.authenticate(method,data,ip),serverNow:Date.now()});
  if(method==='board'){this.limit(`board:${ip}`,120);if(!LEVELS[data.level])throw new ApiError('invalid-argument','Dificuldade inválida.');return Response.json(this.db.board(data.level));}
  const token=request.headers.get('Authorization')?.replace(/^Bearer /,''),s=this.session(token);if(s.ticket)throw new ApiError('unauthenticated','Token inv�lido.');
  this.limit(`api:${s.uid}`,180);if(s.guest&&!GUEST_METHODS.has(method)&&method!=='logout')throw new ApiError('permission-denied','Entre numa conta para salvar na nuvem.');
  let result;
  if(method==='logout'){this.db.delete(`sessions/${digest(token)}`);for(const socket of this.ctx.getWebSockets())if(socket.deserializeAttachment()?.session===digest(token))socket.close(1000,'Saiu');result={};}
  else if(method==='me')result={user:{uid:s.uid,guest:s.guest},profile:this.db.get(`profiles/${s.uid}`)};
  else if(method==='socketTicket'){const ticket=secret();this.db.put(`sessions/${digest(ticket)}`,{...s,ticket:true,session:digest(token),expires:Date.now()+30000});result={ticket};}
  else if(Object.hasOwn(this.handlers,method))result=await this.handlers[method](s.uid,data);
  else throw new ApiError('invalid-argument','Operação inválida.');
  await this.broadcast();return Response.json({...result,serverNow:Date.now()});
 }
 connect(request,url){
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')throw new ApiError('invalid-argument','WebSocket necessário.');
  const token=url.searchParams.get('ticket'),s=this.session(token);if(!s.ticket||!this.db.get(`sessions/${s.session}`))throw new ApiError('unauthenticated','Conexão expirada.');this.db.delete(`sessions/${digest(token)}`);
  if(this.ctx.getWebSockets().filter(ws=>ws.deserializeAttachment()?.uid===s.uid).length>=4)throw new ApiError('resource-exhausted','Feche outra aba para conectar.');
  const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);server.serializeAttachment({uid:s.uid,guest:s.guest,session:s.session,room:null,level:null,last:''});
  return new Response(null,{status:101,webSocket:client});
 }
 webSocketMessage(ws,message){return this.serial(async()=>{try{const a=ws.deserializeAttachment();if(!this.db.get(`sessions/${a.session}`)){ws.close(1008,'Sessão expirada');return;}this.limit(`ws:${a.uid}`,60);if(typeof message!=='string'||message.length>2000)throw Error();const data=JSON.parse(message);if(data.type==='watch'){if(data.room){if(!/^\d{6}$/.test(data.room))throw Error();const room=this.db.get(`rooms/${data.room}`);if(!room?.members.includes(a.uid))throw Error();}if(data.level&&!LEVELS[data.level])throw Error();a.room=data.room||null;a.level=data.level||null;a.last='';ws.serializeAttachment(a);await this.sendSnapshot(ws,a);}else if(data.type==='ping')ws.send('{"type":"pong"}');}catch{ws.send(JSON.stringify({type:'error',message:'Não foi possível acompanhar a sala.'}));}});}
 async sendSnapshot(ws,a){if(!this.db.get(`sessions/${a.session}`)){ws.close(1008,'Sessão expirada');return;}const profile=a.guest?null:this.db.get(`profiles/${a.uid}`),room=a.room?this.db.get(`rooms/${a.room}`):null;const payload={type:'snapshot',profile,room:room?.members.includes(a.uid)?room:null,board:a.level?this.db.board(a.level):null};const version=digest(JSON.stringify(payload));if(version!==a.last){ws.send(JSON.stringify({...payload,serverNow:Date.now()}));a.last=version;ws.serializeAttachment(a);}}
 async broadcast(){for(const ws of this.ctx.getWebSockets())try{await this.sendSnapshot(ws,ws.deserializeAttachment());}catch{ws.close(1011,'Reconecte');}}
 webSocketClose(ws,code){ws.close(code);}
}
