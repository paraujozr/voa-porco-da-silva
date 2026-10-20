import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,advance,replay,revive,credit,freshProfile,roomResult,nickname,continuePrice} from '../shared/engine.js';
function fly(seed=19,goal=90){const run=createRun(seed,'easy'),inputs=[];let events=0;while(!run.dead&&run.distance<goal){const target=run.gates.find(g=>g.x> -1)?.center??1;const flap=run.y<target-.5&&run.v<0;if(flap)inputs.push(run.tick);events+=!!advance(run,flap).sixSeven;}return {run,inputs,events};}
test('replay reproduz distância e moedas',()=>{const {run,inputs}=fly();const copy=replay({seed:run.seed,level:run.level,inputs,ticks:run.tick});for(const key of ['distance','coins','y','dead','passed'])assert.equal(copy[key],run[key]);});
test('Six Seven dispara apenas no 67º cano, nunca aos 67 metros',()=>{const r=createRun();r.distance=67;r.passed=66;assert.equal(advance(r).sixSeven,false);r.gates=[{id:1,x:-1.59,center:1,gap:6,passed:false}];assert.equal(advance(r).sixSeven,true);assert.equal(r.passed,67);assert.equal(advance(r).sixSeven,false);});
test('replay rejeita duplicação e voo após colisão',()=>{assert.throws(()=>replay({seed:1,level:'normal',inputs:[0,0],ticks:10}));const r=createRun();while(!r.dead)advance(r);assert.throws(()=>replay({seed:1,level:'normal',inputs:[],ticks:r.tick+1}));});
test('continue preserva distância e exige autorização',()=>{const r=createRun();while(!r.dead)advance(r);const tick=r.tick,distance=r.distance;revive(r);assert.equal(r.distance,distance);assert.equal(r.shield,180);advance(r);const copy=replay({seed:1,level:'normal',inputs:[],ticks:r.tick,revives:[tick]});assert.equal(copy.y,r.y);assert.equal(copy.continues,1);assert.deepEqual([0,1,2].map(continuePrice),[25,50,100]);});
test('crédito incremental e ranking sem continue',()=>{const r={...createRun(),coins:8,passed:68};const first=credit(freshProfile(),r);const next=credit(first,{...r,coins:11,passed:99,continues:1},8,false);assert.equal(next.coins,11);assert.equal(next.runs,1);assert.equal(next.ranked.normal,68);assert.equal(next.best['cipo:normal'],99);});
test('duelo encerra desconectado e decide empate',()=>{const room={state:'racing',startAt:0,players:{a:{state:'done',distance:99,lastSeen:0},b:{state:'racing',distance:67,lastSeen:0}}};assert.equal(roomResult(room,16000).winner,'a');room.players.b.distance=99;assert.equal(roomResult(room,16000).winner,'draw');assert.equal(room.state,'racing');});
test('apelido normaliza e rejeita marcação',()=>{assert.equal(nickname('  Zé   Porco '),'Zé Porco');assert.throws(()=>nickname('<script>'));});

// Real physics/collisions: no seeded score or invulnerability.
test('voo longo atravessa 1.000 canos e o servidor valida o resultado',()=>{
 for(const level of ['easy','normal','hard']){
  const run=createRun(19,level),inputs=[];let maxGates=0,maxTokens=0,events=0;
  while(!run.dead&&run.passed<1000){const target=run.gates.find(g=>g.x> -1.6)?.center??1;const flap=run.y<target-.5&&run.v<0;if(flap)inputs.push(run.tick);events+=!!advance(run,flap).sixSeven;maxGates=Math.max(maxGates,run.gates.length);maxTokens=Math.max(maxTokens,run.tokens.length);}
  assert.equal(run.dead,false,`${level}: ${run.reason} aos ${run.passed} canos`);assert.equal(run.passed,1000);assert.ok(run.tick>120*600);assert.equal(events,1);assert.ok(maxGates<10);assert.ok(maxTokens<30);
  const copy=replay({seed:19,level,inputs,ticks:run.tick});for(const key of ['passed','coins','tick','dead','y'])assert.equal(copy[key],run[key]);
  const saved=credit(freshProfile(),copy);assert.equal(saved.ranked[level],1000);
  assert.ok(JSON.stringify({inputs,ticks:run.tick}).length<200000);
 }
});
test('limites explícitos: solo de uma hora e duelo de três minutos',()=>{
 const solo=createRun(19,'normal');solo.tick=120*600-1;assert.equal(advance(solo).dead,false);
 solo.tick=120*3600-1;advance(solo);assert.equal(solo.reason,'limit');
 const duel=createRun(19,'normal',true);duel.tick=120*180-1;advance(duel);assert.equal(duel.reason,'limit');
 assert.throws(()=>replay({seed:19,level:'normal',ticks:120*3600+1,inputs:[]}),/Replay inválido/);
});
