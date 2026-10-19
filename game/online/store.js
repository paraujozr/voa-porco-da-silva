// Document-shaped adapter keeps the authoritative game rules shared with the legacy server.
// Requests are serialized by GameServer; writes commit together in SQLite.
export class Store {
 constructor(storage){this.storage=storage;this.sql=storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, body TEXT NOT NULL, expires INTEGER, score INTEGER, achieved INTEGER)');this.sql.exec('CREATE INDEX IF NOT EXISTS expiry ON documents(expires)');this.sql.exec('CREATE INDEX IF NOT EXISTS scores ON documents(score DESC, achieved ASC)');}
 doc(id){return id;}
 get(id){const row=this.sql.exec('SELECT body FROM documents WHERE id = ? AND (expires IS NULL OR expires > ?)',id,Date.now()).toArray()[0];return row?JSON.parse(row.body):null;}
 put(id,value){let expires=null;if(id.startsWith('runs/'))expires=value.startAt+86400000;else if(id.startsWith('rooms/'))expires=value.expiresAt+3600000;else if(id.startsWith('sessions/')||id.startsWith('limits/'))expires=value.expires;else if(id.startsWith('profiles/guest_'))expires=Date.now()+21600000;this.sql.exec('INSERT OR REPLACE INTO documents (id,body,expires,score,achieved) VALUES (?,?,?,?,?)',id,JSON.stringify(value),expires,id.startsWith('boards/')?value.distance:null,id.startsWith('boards/')?value.achievedAt:null);}
 delete(id){this.sql.exec('DELETE FROM documents WHERE id = ?',id);}
 async runTransaction(fn){const pending=new Map(),read=id=>pending.has(id)?structuredClone(pending.get(id)):this.get(id);const tx={get:async id=>{const value=read(id);return {exists:value!==null,data:()=>structuredClone(value)};},set:(id,value,options)=>pending.set(id,options?.merge?{...read(id),...value}:structuredClone(value)),update:(id,value)=>{const old=read(id);if(!old)throw Error('Registro não encontrado.');pending.set(id,{...old,...value});},create:(id,value)=>{if(read(id))throw Error('Registro já existe.');pending.set(id,structuredClone(value));}};const result=await fn(tx);this.storage.transactionSync(()=>{for(const [id,value] of pending)this.put(id,value);});return result;}
 board(level){return this.sql.exec('SELECT body FROM documents WHERE id GLOB ? ORDER BY score DESC, achieved ASC LIMIT 50',`boards/${level}/entries/*`).toArray().map(row=>JSON.parse(row.body));}
 cleanup(){this.sql.exec('DELETE FROM documents WHERE id IN (SELECT id FROM documents WHERE expires <= ? LIMIT 500)',Date.now());}
}
