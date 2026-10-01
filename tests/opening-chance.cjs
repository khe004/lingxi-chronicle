const assert=require('node:assert/strict');
const G=require('../dist/engine.js');
function build(manual=3,spring=3){const s=G.create({origin:'merchant'});Object.assign(s,{stage:3,manual,manuals:[0,manual],decodedManuals:[0,manual],spring,foundation:3,foundationGrades:[3,3,3],root:5,wit:5,dao:4,body:5,focus:100,wounds:0,progress:88+G.ITEMS.manual[manual].capBonus,totalProgress:300,grain:30,pending:'attempt'});s.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,5]));return s;}
let combinations=0;
for(const m of [3,4,5])for(const p of [3,4,5]){const s=build(m,p);if(G.springHarmony(s).score<1)continue;combinations++;assert.equal(G.chance(s),99);assert.equal(G.chance(s,'bold'),87);assert.equal(G.chance({...s,focus:35}),99);assert.equal(G.chance({...s,wounds:1}),90);assert.equal(G.chance({...s,focus:25}),96);}
assert.ok(combinations>=3);
const s=build();assert.equal(G.step(s,'choice:steady',()=>.989).chapter,'mingqi');assert.ok(G.step(s,'choice:steady',()=>.99).ending);
assert.equal(G.options(s).find(o=>o.id==='steady').label.includes('99%'),true);
for(const grades of [[1,1,1],[2,2,2],[3,3,3]])for(const m of [1,2,3,4,5,6])for(const p of [1,2,3,4,5]){const a=build(m,p);a.foundationGrades=grades;const healthy=G.chance(a);assert.ok(healthy>=5&&healthy<=99);assert.ok(G.chance({...a,wounds:1})<healthy||healthy===5);assert.ok(G.chance({...a,focus:20})<=healthy);assert.ok(G.chance(a,'bold')<healthy||healthy===5);}
console.log(`Opening chance: ${combinations} aligned immortal combinations at 99%; 90 preparation combinations and real roll boundaries passed`);
