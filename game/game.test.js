import {test} from 'node:test';
import assert from 'node:assert/strict';
import {integrate,hitGate,readSave,writeSave,purchase,MAPS,PIGS} from './src/config.js';
test('voo tem resultado consistente em 60 e 120 passos',()=>{function sim(n){let y=0,v=6.8;for(let i=0;i<n;i++){const next=integrate(y,v,1/n);y=next.y;v=next.velocity;}return y;}assert.ok(Math.abs(sim(60)-sim(120))<.09);});
test('colisão exige sobreposição horizontal e vertical',()=>{const g={x:0,center:1,gap:5.3};assert.equal(hitGate(0,1,g),false);assert.equal(hitGate(0,4,g),true);assert.equal(hitGate(4,4,g),false);});
test('save corrompido não impede a inicialização',()=>{assert.equal(readSave({getItem:()=>'{invalid'}).coins,0);assert.equal(readSave({getItem:()=>'{"coins":-50}'}).coins,0);});
test('progresso é preservado e falha de armazenamento é tolerada',()=>{let value;const storage={setItem:(k,v)=>value=v,getItem:()=>value};const s={coins:12,best:{rio:5},unlocked:['coroa'],maps:['cipo'],muted:true,low:false};assert.equal(writeSave(storage,s),true);assert.deepEqual(readSave(storage),s);assert.equal(writeSave({setItem:()=>{throw Error('blocked')}},s),false);});

test('mapas cobram uma vez e respeitam saldo',()=>{const s={coins:50,maps:['cipo'],unlocked:[]};assert.equal(purchase(s,MAPS[1],'map'),'purchased');assert.equal(s.coins,10);assert.equal(purchase(s,MAPS[1],'map'),'owned');assert.equal(s.coins,10);assert.equal(purchase(s,MAPS[2],'map'),'insufficient');assert.deepEqual(s.maps,['cipo','rio']);});
test('save antigo mantém moedas e skins e começa em Cipó',()=>{const s=readSave({getItem:k=>k==='voaporco-beta-save'?JSON.stringify({coins:215,unlocked:['coroa'],best:{rio:7}}):null});assert.equal(s.coins,215);assert.equal(s.best.rio,7);assert.deepEqual(s.unlocked,['coroa']);assert.deepEqual(s.maps,['cipo']);});
test('coleção tem 21 ids únicos e skins grátis não gastam moedas',()=>{assert.equal(PIGS.length,21);assert.equal(new Set(PIGS.map(p=>p.id)).size,21);const s={coins:0,unlocked:[]};assert.equal(purchase(s,PIGS[0],'skin'),'owned');assert.equal(s.coins,0);});
