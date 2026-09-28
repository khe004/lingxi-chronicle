// Controlled affinity comparison after obtaining three immortal manuals.
// Fixed resources and a reset of capped realm progress isolate practice time from acquisition.
const assert=require('node:assert/strict');
const G=require('../dist/engine.js');
function run(mode){
 let s=G.create({elements:['wood'],polarity:'yang'});s.stage=3;s.story.ordeal={triggered:true,resolved:true,route:'test',triggerMonth:0};s.manuals.push(3,4,5);
 Object.assign(s.affinityPoints,{metal:4,fire:4,wood:4,yin:4,yang:4});
 s.grain=500;s.events.nextMonth=999;
 let actions=0;const at={};
 while(!s.ending){
  if(s.progress>=G.cap(s))s.progress=0;
  s.manual=mode==='specialize'?3:[3,4,5][Math.floor(actions/6)%3];
  s=G.step(s,s.focus<18?'action:rest':'action:cultivate',()=>.99);actions++;
  for(const month of [60,120,168])if(s.month>=month&&!at[month])at[month]={...G.points(s)};
 }
 assert.equal(s.ending.kind,'retired');assert.equal(s.month,168);
 return at;
}
const specialize=run('specialize'),rotate=run('rotate');
assert.ok(specialize[168].metal>=rotate[168].metal+1);
assert.ok(Object.values(rotate[168]).slice(0,7).filter(x=>x>=6).length<4);
console.log(JSON.stringify({specialize,rotate},null,2));
