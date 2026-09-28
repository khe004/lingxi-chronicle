// Fixed-seed combat calibration for the time-limited first-ordeal challenger.
const assert=require('node:assert/strict');
const G=require('../dist/engine.js');
function rng(seed){let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}

function duel({seed,prepared}){
 const build=prepared
  ?{origin:'merchant',talent:'meridian',elements:['metal'],polarity:'yang'}
  :{origin:'scholar',talent:'clarity',elements:['wood'],polarity:'yang'};
 let s=G.create(build),random=rng(seed);
 s.stage=3;s.location='arena';s.month=60;s.progress=22;s.focus=100;
 s.story.ordeal={triggered:true,resolved:false,route:null,triggerMonth:52,visitorUntil:60};
 if(prepared){
  s.manual=3;s.manuals=[...new Set([...s.manuals,3])];
  Object.assign(s,{root:5,wit:5,body:5,dao:5,foundation:3});
  s.knownTechniques=['flow','surge'];s.techniquePractice={flow:18,surge:18};
  s.trainingGear={staff:false,vest:true,shoes:false,talisman:false};
  assert.deepEqual(G.techniqueMissing(s,'flow'),[]);
  assert.deepEqual(G.techniqueMissing(s,'surge'),[]);
 }
 assert.ok(G.available(s).some(x=>x.id==='ordealDuel'),'visitor should still be present at the deadline');
 s=G.step(s,'action:ordealDuel',random);
 s=G.step(s,'combat:auto-aggressive',random);
 assert.ok(s.sparRecord.last,'the duel should finish and be recorded');
 assert.equal(s.story.ordeal.resolved,s.sparRecord.last.result==='胜出');
 return s.sparRecord.last.result;
}

function sample(prepared,count=100){let wins=0,losses=0,draws=0;for(let seed=1;seed<=count;seed++){const result=duel({seed,prepared});if(result==='胜出')wins++;else if(result==='失手')losses++;else draws++;}return {wins,losses,draws,count,winRate:wins/count};}

const ordinary=sample(false),trained=sample(true);
assert.ok(ordinary.winRate<=.10,`an unprepared new-stage character should usually lose (${ordinary.winRate})`);
assert.ok(trained.winRate>=.25&&trained.winRate<=.75,`a trained compatible build should have a real but uncertain chance (${trained.winRate})`);
assert.ok(trained.winRate>=ordinary.winRate+.2,'investment should materially improve duel odds');
console.log(JSON.stringify({ordinary,trained},null,2));
