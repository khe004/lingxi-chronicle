const assert=require('assert');
const G=require('../dist/engine.js');

const s=G.create({name:'infra',origin:'scholar',talent:'clarity'});
assert.equal(s.version,11);
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
assert.equal(migrated.version,11);
assert.equal(migrated.chapter,'opening');
assert.equal(migrated.world.region,'cangwu');
assert(Array.isArray(migrated.lifeHistory));
console.log('world-life-infra: ok');
