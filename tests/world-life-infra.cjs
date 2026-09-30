const assert=require('assert');
const G=require('../dist/engine.js');

const s=G.create({name:'infra',origin:'scholar',talent:'clarity'});
assert.equal(s.version,12);
assert.deepEqual(s.world,{continent:'donghua',region:'cangwu'});
assert.equal(G.REGIONS.cangwu.parent,'donghua');
for(const [id,loc] of Object.entries(G.LOCATIONS)){
  assert.equal(loc.region,'cangwu',id+' should belong to 苍梧山');
  assert.deepEqual(G.locationPath(id).slice(0,2),['东华洲','苍梧山']);
}
assert(G.hasMemory(s,'life.enter-cangwu'));
assert.equal(G.memoriesByTag(s,'苍梧').length,1);
const before=s.lifeHistory.length;
G.remember(s,'test.promise',{choice:'守约',outcome:'accepted',actors:['cheng'],tags:['重诺','人情'],text:'答应旧约'});
G.remember(s,'test.promise',{choice:'失约'});
assert.equal(s.lifeHistory.length,before+1,'semantic memories are idempotent');
assert.equal(G.memoriesByTag(s,'重诺')[0].choice,'守约');
G.markTrait(s,'重诺',2); G.markTrait(s,'重诺',-1);
assert.equal(s.lifeTraits['重诺'],1);

const old=JSON.parse(JSON.stringify(s));old.version=10;delete old.world;delete old.chapter;delete old.lifeHistory;delete old.lifeTraits;
const migrated=G.migrate(old);
assert.equal(migrated.version,12);
assert.equal(migrated.chapter,'opening');
assert.equal(migrated.world.region,'cangwu');
assert(Array.isArray(migrated.lifeHistory));
// A real completed choice records the source event, not the cleared menu.
const event=G.create({origin:'scholar'});event.pending='scroll';event.location='cliff';event.grain=30;event.events.nextMonth=999;
const resolved=G.step(event,'choice:share',()=>0);
const decisions=G.memoriesByTag(resolved,'scroll');
assert.equal(decisions.length,1);assert.equal(decisions[0].choice,'share');
assert.equal(decisions[0].place,'cliff');assert.equal(decisions[0].region,'cangwu');
assert.equal(event.lifeHistory.length,1,'stepping must preserve the input snapshot');
const repeat=G.step(resolved,'choice:share',()=>0);
assert.equal(repeat.lifeHistory.length,resolved.lifeHistory.length,'a stale choice cannot add a second fact');
// Every supported historical schema reaches the current world/history schema in one load.
for(const version of [2,3,4,5,6,7,8,9,10]){
 const legacy=G.create({origin:'scholar'});legacy.version=version;
 delete legacy.world;delete legacy.chapter;delete legacy.lifeHistory;delete legacy.lifeTraits;
 const upgraded=G.migrate(legacy);
 assert.equal(upgraded.version,12,`v${version}`);assert.equal(upgraded.world.region,'cangwu');
 assert.deepEqual(upgraded.lifeHistory,[],'migration must not invent historical choices');
 assert.deepEqual(upgraded.lifeTraits,{});
}
const roundtrip=G.migrate(JSON.parse(JSON.stringify(resolved)));G.markTrait(roundtrip,'重诺',2);
const loaded=G.migrate(JSON.parse(JSON.stringify(roundtrip)));
assert.deepEqual(loaded.lifeHistory,resolved.lifeHistory);assert.equal(loaded.lifeTraits['重诺'],2);
assert.equal(G.migrate(loaded).lifeHistory.length,loaded.lifeHistory.length);
for(const location of Object.keys(G.LOCATIONS)){
 const moved=G.step(G.create(),'travel:'+location,()=>0);
 assert.equal(moved.world.region,G.LOCATIONS[moved.location].region);
 assert.equal(moved.world.continent,G.REGIONS[moved.world.region].parent);
}
console.log('world-life-infra: ok');
