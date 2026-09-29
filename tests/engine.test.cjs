const assert=require('node:assert/strict');
const {test}=require('node:test');
const G=require('../dist/engine.js');
const run=(s,command,roll=0)=>G.step(s,command,()=>roll);
let s=G.create({name:'闻山',origin:'scholar',talent:'clarity'});s.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));
assert.equal(s.version,10);
assert.equal(s.manual,0);
assert.deepEqual(s.manuals,[0]);
assert.equal(G.ITEMS.manual[0].name,'《养息吐纳诀》');
assert.ok(G.ITEMS.manual.every(item=>item.stageMin===0&&item.stageMax===3));
assert.equal(G.cap(s),36);
assert.ok(G.cultivationGain(s)<.2);
assert.ok(G.cultivationGain({...s,manual:1})>G.cultivationGain(s)*6);
let oldSave=G.create();delete oldSave.story.trueTextReady;delete oldSave.story.trueTextNextMonth;
oldSave.manuals.push(2);oldSave.practice[2]=14;oldSave.flags.mentor=true;oldSave.npcFavor.cheng=3;oldSave.insight=8;oldSave.root=4;oldSave.wit=4;oldSave.dao=4;
oldSave=run(oldSave,'action:mentor');assert.equal(oldSave.pending,'trueText');
oldSave=run(oldSave,'choice:defer');assert.equal(oldSave.story.trueTextNextMonth,oldSave.month+6);
oldSave=run(oldSave,'action:mentor');assert.equal(oldSave.pending,'mentor');
let veteran=G.create();veteran.manuals.push(3);veteran.manual=3;delete veteran.story.trueTextReady;
veteran=run(veteran,'action:mentor');assert.equal(veteran.pending,'mentor');assert.equal(veteran.manual,3);
// Both affinity axes affect the same combat calculation, including defense and neutral choices.
assert.equal(G.compatibleElements(['wood','fire']),true);
assert.equal(G.compatibleElements(['water','fire']),false);
assert.equal(G.compatibleElements(['wood','fire','earth']),false);
assert.throws(()=>G.create({elements:['water','fire']}),RangeError);
const yinWater=G.create({elements:['water'],polarity:'yin'});
assert.deepEqual(yinWater.elements,['water']);
assert.equal(yinWater.polarity,'yin');
const strike=G.matchup({elements:['water'],polarity:'yin'},{elements:['fire'],polarity:'yang'});
assert.equal(strike.element,1);assert.equal(strike.polarity,1);
assert.ok(Math.abs(strike.attackFactor-1.2)<1e-10);assert.ok(Math.abs(strike.defenseFactor-.84)<1e-10);
const reply=G.matchup({elements:['fire'],polarity:'yang'},{elements:['water'],polarity:'yin'});
assert.equal(reply.element,-1);assert.equal(reply.polarity,1);
assert.equal(G.matchup({elements:[],polarity:'harmony'},{elements:['water'],polarity:'yin'}).attackFactor,1);
assert.deepEqual(G.combatStats(yinWater).defenseAspect.elements,['water']);assert.equal(G.combatStats(yinWater).defenseAspect.points.water,3);
assert.equal(G.combatStats({...yinWater,manual:2}).attackAspect.polarity,'yin');
assert.deepEqual(G.combatStats({...yinWater,trainingGear:{staff:true,vest:true}}).attackAspect.elements,['water','wood']);
assert.deepEqual(G.combatStats({...yinWater,trainingGear:{staff:true,vest:true}}).defenseAspect.elements,['fire','earth']);
assert.ok(Object.values(G.EQUIPMENT).flat().every(i=>G.compatibleElements(i.elements)));
assert.ok(G.ITEMS.manual.every(i=>G.compatibleElements(i.elements)));
// Neutral proficiency is derived from the weakest axis and can counter any element once trained.
const plain=G.create();assert.equal(G.points(plain).plain,1);assert.equal(G.points(plain).harmony,1);
assert.equal(Object.hasOwn(plain.affinityPoints,'plain'),false);assert.equal(Object.hasOwn(plain.affinityPoints,'harmony'),false);
assert.equal(G.points(G.create({elements:['wood','fire']})).wood,2);
assert.equal(G.affinityMissing(plain,G.ITEMS.manual[2]).length,2);
const trained=structuredClone(plain);for(const k of G.AFFINITY_KEYS)trained.affinityPoints[k]=3;
assert.equal(G.affinityMissing(trained,G.ITEMS.manual[2]).length,0);
assert.equal(G.points(trained).plain,3);trained.affinityPoints.metal=1;assert.equal(G.points(trained).plain,1);
const neutralStrike=G.matchup(G.combatStats(trained).attackAspect,G.SPAR_OPPONENTS.novice);
assert.ok(neutralStrike.element>0&&neutralStrike.polarity>0);
assert.ok(G.matchup(G.combatStats(plain).attackAspect,G.SPAR_OPPONENTS.novice).element<neutralStrike.element);
const neutralGuard=G.matchup(G.SPAR_OPPONENTS.novice,G.combatStats(trained).defenseAspect);
assert.ok(neutralGuard.element<0);assert.ok(neutralGuard.defenseFactor>1);
assert.ok(G.matchup(G.SPAR_OPPONENTS.novice,G.combatStats(plain).defenseAspect).polarity>neutralGuard.polarity);
assert.equal(G.matchup(G.SPAR_OPPONENTS.novice,G.combatStats(plain).defenseAspect).element<0,true);
const partial=structuredClone(trained);partial.affinityPoints.yin=1;
assert.ok(G.matchup(G.combatStats(partial).attackAspect,G.SPAR_OPPONENTS.novice).polarity<neutralStrike.polarity);
const noIndependent=structuredClone(trained);noIndependent.affinityPoints.metal=1;noIndependent.affinityPoints.yin=1;noIndependent.affinityPoints.plain=99;noIndependent.affinityPoints.harmony=99;
assert.equal(G.points(noIndependent).plain,1);assert.equal(G.points(noIndependent).harmony,1);
const migrated=G.migrate(noIndependent);assert.equal(Object.hasOwn(migrated.affinityPoints,'plain'),false);
const grown=G.create();grown.location='cliff';grown.grain=100;grown.focus=100;grown.events.nextMonth=999;
assert.equal(G.available(grown).some(a=>a.id.startsWith('attune-')),false);
assert.deepEqual(run(grown,'action:attune-water'),grown);
let nurtured=grown;for(let i=0;i<36;i++){if(nurtured.focus<18)nurtured=run(nurtured,'action:rest');nurtured=run(nurtured,'action:cultivate');}
assert.equal(G.points(nurtured).plain,2);
let springVisitor=G.create({elements:['fire'],polarity:'yin'});
const beforeSpringAge=springVisitor.ageMonths;springVisitor=run(springVisitor,'travel:mountain');
assert.equal(springVisitor.affinityPoints.water,1);assert.equal(springVisitor.ageMonths,beforeSpringAge);
assert.ok(springVisitor.logs.at(-1).text.includes('洗脉之效'));
springVisitor=run(springVisitor,'travel:temple');springVisitor=run(springVisitor,'travel:mountain');
assert.equal(springVisitor.affinityPoints.water,1);assert.equal(springVisitor.logs.filter(e=>e.effect==='水亲和 +1').length,1);
let fullWater=G.create({elements:['water']});fullWater.affinityPoints.water=6;fullWater=run(fullWater,'travel:mountain');
assert.equal(fullWater.affinityPoints.water,6);assert.equal(fullWater.logs.at(-1).effect,'水亲和已满');
let blocked=G.create({elements:['fire'],polarity:'yin'});blocked.manuals.push(2);blocked.pending='manual';
assert.ok(G.options(blocked).some(o=>o.id==='decode-2'));
assert.ok(!G.options(blocked).some(o=>o.id==='equip-2'));
blocked=run(blocked,'choice:equip-2');assert.equal(blocked.manual,0);
let compat=G.create({elements:['water'],polarity:'yin'});compat.stage=2;compat.location='arena';
assert.deepEqual(G.techniqueMissing(compat,'interrupt'),[]);
compat=run(compat,'action:learn-interrupt');assert.ok(compat.knownTechniques.includes('interrupt'));
compat.trainingGear.staff=true;assert.ok(G.techniqueMissing(compat,'interrupt').some(x=>x.includes('兵器')));
compat=run(compat,'action:spar-novice');assert.equal(G.combatOptions(compat).find(o=>o.id==='interrupt').disabled,true);
const snap=structuredClone(compat);compat=run(compat,'combat:interrupt');assert.deepEqual(compat,snap);
// Five combat abilities and Yin/Yang resources are available to every fighter.
const fireStats=G.combatStats(G.create({elements:['fire'],polarity:'yang'}));
const earthStats=G.combatStats(G.create({elements:['earth'],polarity:'yang'}));
const waterStats=G.combatStats(G.create({elements:['water'],polarity:'yang'}));
const metalStats=G.combatStats(G.create({elements:['metal'],polarity:'yang'}));
const woodStats=G.combatStats(G.create({elements:['wood'],polarity:'yang'}));
assert.ok(fireStats.attack>earthStats.attack);
assert.ok(earthStats.defense>fireStats.defense);
assert.ok(waterStats.evasion>fireStats.evasion);
assert.ok(metalStats.counter>fireStats.counter);
assert.ok(woodStats.vitality>fireStats.vitality);
assert.equal(Object.hasOwn(fireStats,'accuracy'),false);
assert.ok(G.combatStats(G.create({polarity:'yin'})).nei>G.combatStats(G.create({polarity:'yang'})).nei);
assert.ok(G.combatStats(G.create({polarity:'yang'})).qi>G.combatStats(G.create({polarity:'yin'})).qi);
for(const foe of Object.values(G.SPAR_OPPONENTS))for(const key of ['qi','nei','attack','defense','evasion','vitality','counter'])assert.ok(Number.isFinite(foe[key]),`${foe.name} ${key}`);
let metalSpar=G.create({elements:['metal']});metalSpar.location='arena';metalSpar=run(metalSpar,'action:spar-novice');
const foeQi=metalSpar.combat.enemy.currentQi;metalSpar=run(metalSpar,'combat:guard',0);
assert.ok(metalSpar.combat.enemy.currentQi<foeQi);assert.ok(metalSpar.combat.history.at(-1).includes('反制'));
let woodSpar=G.create({elements:['wood']});woodSpar.location='arena';woodSpar=run(woodSpar,'action:spar-novice');
woodSpar.combat.player.currentQi-=10;const hurtQi=woodSpar.combat.player.currentQi;
woodSpar=run(woodSpar,'combat:guard',.99);
assert.ok(woodSpar.combat.player.currentQi>hurtQi);assert.ok(woodSpar.combat.history.at(-1).includes('回生'));
// Affinity growth rewards specialization: broad low-level growth is possible, but high affinity takes sustained practice.
function cultivate(method,count){let disciple=G.create();disciple.manual=method;if(!disciple.manuals.includes(method))disciple.manuals.push(method);disciple.grain=300;disciple.events.nextMonth=999;disciple.stage=3;disciple.story.ordeal={triggered:true,resolved:true,route:'test',triggerMonth:0};
 for(let i=0;i<count&&!disciple.ending;i++){if(disciple.focus<18)disciple=run(disciple,'action:rest',1);if(disciple.progress>=G.cap(disciple))disciple.progress=0;disciple=run(disciple,'action:cultivate',1);}
 return disciple;
}
const universal=cultivate(0,23);for(const key of G.AFFINITY_KEYS)assert.equal(universal.affinityPoints[key],1,`basic ${key} must not rise before 24 actual sessions`);
const universal24=cultivate(0,24);for(const key of G.AFFINITY_KEYS)assert.equal(universal24.affinityPoints[key],2,`basic ${key}`);
const specialist=cultivate(3,60);assert.ok(specialist.affinityPoints.metal>=4&&specialist.affinityPoints.yang>=4,'immortal specialization deepens tagged axes');
assert.ok(specialist.affinityPoints.wood<=1&&specialist.affinityPoints.water<=1,'specialization leaves unrelated axes low');
const dual=cultivate(5,10);for(const key of ['wood','fire','yang'])assert.equal(dual.affinityPoints[key],2,`dual ${key}`);
assert.equal(dual.affinityPoints.water,1);assert.equal(dual.affinityPoints.yin,1);
// The practice grounds reuse character stats while isolating story, resources and lasting injuries.
let arena=G.create({name:'演武试客',elements:['water','wood'],polarity:'yang'});arena.affinityPoints.yin=3;arena.affinityPoints.earth=3;arena=run(arena,'travel:arena');
assert.equal(G.LOCATIONS.arena.name,'苍梧演武坪');
assert.equal(arena.story.arenaLessonSeen,true);assert.ok(arena.logs.at(-1).text.includes('传功弟子'));const arenaMonth=arena.month;arena=run(arena,'travel:temple');arena=run(arena,'travel:arena');assert.equal(arena.month,arenaMonth);assert.equal(arena.logs.filter(entry=>entry.text.includes('传功弟子')).length,1);
assert.ok(G.available(arena).length>=8);
assert.equal(G.available(arena).some(a=>a.id==='cultivate'),false);
const bare=G.combatStats(arena);
let adept=G.create();adept.location='arena';adept=run(adept,'action:learn-flow');
assert.equal(G.techniqueProgress(adept,'flow').name,'初学');
adept.techniquePractice.flow=5;adept=run(adept,'action:spar-keeper');
assert.ok(G.combatOptions(adept).some(option=>option.id==='flow'&&option.label.includes('初学')));
adept=run(adept,'combat:flow',0);
assert.equal(G.techniqueProgress(adept,'flow').name,'熟稔');
assert.ok((adept.combat?.history||adept.sparRecord.last.history).at(-1).includes('熟练度升至熟稔'));
assert.equal(G.techniqueEffect('flow',1).cost,5);
assert.equal(G.techniqueProgress(G.migrate(structuredClone(adept)),'flow').count,6);
assert.equal(G.techniqueProgress({...adept,techniquePractice:{flow:18}},'flow').name,'精通');
assert.equal(G.techniqueEffect('interrupt',2).interruptChance,1);
for(let rank=0;rank<3;rank++)assert.deepEqual(G.foeArtEffect({artRanks:{flow:rank}},'flow'),G.techniqueEffect('flow',rank),'players and human foes share the same proficiency scaling');
arena=run(arena,'action:kit-staff');arena=run(arena,'action:kit-vest');arena=run(arena,'action:kit-shoes');arena=run(arena,'action:kit-talisman');
assert.equal(G.combatStats(arena).evasion,bare.evasion+5);
assert.equal(G.combatStats(arena).attack,bare.attack+3);
assert.equal(G.combatStats(arena).defense,bare.defense+4);
assert.equal(G.combatStats(arena).nei,bare.nei+5);
arena=run(arena,'action:spar-novice');
const mainLogs=structuredClone(arena.logs);
assert.equal(arena.combat.enemy.qi,G.SPAR_OPPONENTS.novice.qi);
assert.equal(G.available(arena).length,0);
assert.equal(G.combatOptions(arena).some(a=>a.id==='flow'),false);
assert.equal(run(arena,'travel:temple').location,'arena');
arena=JSON.parse(JSON.stringify(arena));arena=run(arena,'combat:relic',1);
assert.equal(arena.combat.relicUsed,true);
assert.equal(G.combatOptions(arena).find(a=>a.id==='relic').disabled,true);
arena=run(arena,'combat:withdraw');
assert.equal(arena.combat,null);assert.equal(arena.sparRecord.withdrawals,1);
assert.equal(arena.month,1);assert.equal(arena.wounds,0);assert.equal(arena.grain,G.create().grain-1);
assert.equal(arena.progress,0);
assert.deepEqual(arena.logs.slice(0,mainLogs.length),mainLogs);assert.equal(arena.logs.length,mainLogs.length+1);
let advanced=G.create({elements:['water'],polarity:'yin'});advanced.stage=2;advanced.manuals.push(2);advanced.manual=2;advanced.location='arena';
assert.ok(G.combatStats(advanced).nei>G.combatStats({...advanced,manual:0}).nei);
advanced=run(advanced,'action:learn-interrupt');advanced=run(advanced,'action:spar-novice');
assert.ok(G.combatOptions(advanced).some(a=>a.id==='interrupt'));
advanced=run(advanced,'combat:guard',0);assert.equal(advanced.combat.intent,'charge');
advanced=run(advanced,'combat:interrupt',0);
assert.ok(advanced.combat.history.at(-1).includes('蓄势被你截断'));
assert.equal(advanced.combat.intent,'strike');
let practiceLoss=G.create();practiceLoss.location='arena';practiceLoss=run(practiceLoss,'action:spar-swift');
for(let i=0;i<20&&practiceLoss.combat;i++)practiceLoss=run(practiceLoss,'combat:strike',0);
assert.equal(practiceLoss.sparRecord.losses,1);
assert.ok(practiceLoss.sparRecord.last.history.at(-1).includes('你脚下不稳，抬手示意认负'));
assert.ok(practiceLoss.sparRecord.last.history.at(-1).includes('对手当即收招'));
assert.equal(practiceLoss.ending,null);assert.equal(practiceLoss.wounds,0);
assert.equal(practiceLoss.ageMonths,G.create().ageMonths+1);
// A learned immortal manual opens two remembered encounters, with a real cost and an annual record.
for(const [who,place,manual,first,second] of [['gu','cliff',4,'publish','annotate'],['ye','mountain',5,'treat','receive'],['lu','market',3,'broker','settle'],['cheng','temple',3,'withdraw','lecture']]){
 let character=G.create();character.month=24;character.stage=1;character.location=place;character.grain=40;character.herbs=6;character.silver=25;character.focus=100;character.manuals.push(manual);
 if(who==='lu')character.story.luCredential=true;
 if(who==='cheng')character.story.trueTextReady=true;
 assert.ok(G.available(character).some(a=>a.id===`after-${who}-1`),who);
 character=run(character,`action:after-${who}-1`);
 assert.ok(G.options(character).some(o=>o.id===first&&!o.disabled));
 character=run(character,`choice:${first}`);
 assert.equal(character.story.afterManual[who].first,first);
 assert.equal(G.available(character).some(a=>a.id===`after-${who}-1`),false);
 character.stage=2;character.month=character.story.afterManual[who].month+6;
 assert.ok(G.available(character).some(a=>a.id===`after-${who}-2`),who);
 character=run(character,`action:after-${who}-2`);
 character=run(character,`choice:${second}`);
 assert.equal(character.story.afterManual[who].second,second);
 assert.equal(G.available(character).some(a=>a.id===`after-${who}-2`),false);
 assert.ok(character.logs.some(e=>e.text.includes(who==='gu'?'顾闻溪':who==='ye'?'叶青蘅':who==='lu'?'陆知衡':'程上师')));
 character.location='temple';while(character.month<36)character=run(character,'action:rest',1);
 assert.ok(character.books.some(b=>b.lines.some(line=>line.includes(who==='gu'?'顾闻溪':who==='ye'?'叶青蘅':who==='lu'?'陆知衡':'程上师'))));
}
// NPC callbacks retain the first decision and cannot pay out twice.
let gu=G.create();gu.flags.scroll=true;gu.story.guMonth=2;gu.month=6;gu.location='cliff';gu.grain=20;
assert.ok(G.available(gu).some(x=>x.id==='guFollowup'));
gu=run(gu,'action:guFollowup');gu=run(gu,'choice:compare');
assert.equal(gu.story.guRoute,'compare');assert.equal(G.available(gu).some(x=>x.id==='guFollowup'),false);
gu.month+=5;gu=run(gu,'action:guReturn');gu=run(gu,'choice:joint');
assert.equal(gu.story.guSpringDiscount,true);assert.equal(G.available(gu).some(x=>x.id==='guReturn'),false);
let cheng=G.create();cheng.flags.mentor=true;cheng.manuals.push(2);cheng.story.chengMonth=2;cheng.month=6;cheng.grain=20;
cheng=run(cheng,'action:chengFollowup');cheng=run(cheng,'choice:copyForPay');
assert.equal(cheng.story.chengRoute,'copyForPay');cheng.month+=5;
cheng=run(cheng,'action:chengReturn');cheng=run(cheng,'choice:gift');
assert.equal(cheng.story.chengReturn,'gift');assert.equal(G.available(cheng).some(x=>x.id==='chengReturn'),false);
// Location events consume their month at the triggering action, then stop a batch.
for(const [location,action] of [['temple','rest'],['cliff','study'],['mountain','gather'],['market','marketWalk']]){
 let scene=G.create();scene.location=location;scene.manuals.push(2);scene.flags.scroll=true;scene.flags.herbalist=true;scene.month=20;scene.grain=30;scene.focus=100;
 scene=run(scene,`action:${action}`,0);
 assert.ok(scene.pending?.startsWith('scene-'),location);
 assert.equal(scene.month,21);
 const seen=scene.events.seen[0],choice=G.options(scene).find(o=>!o.disabled&&o.id!=='ignore');
 assert.ok(choice);scene=run(scene,`choice:${choice.id}`);
 assert.equal(scene.month,21);assert.equal(scene.pending,null);
 assert.deepEqual(scene.events.seen,[seen]);
 const old=structuredClone(scene);delete old.events;
 assert.doesNotThrow(()=>run(old,`action:${action}`,1));
}
let retreatEvent=G.create();retreatEvent.manuals.push(2);retreatEvent.manual=2;retreatEvent.month=20;retreatEvent.grain=30;
retreatEvent=run(retreatEvent,'action:secludeYear',0);
assert.ok(retreatEvent.pending?.startsWith('scene-'));
assert.ok(retreatEvent.month<32);
const ignoredEvent=run(retreatEvent,'choice:ignore');
assert.equal(ignoredEvent.events.seen.length,1);
assert.equal(ignoredEvent.month,retreatEvent.month);
assert.equal(G.migrate(ignoredEvent),ignoredEvent);
// The location deck changes at each foundation realm; later options act on progress and wounds.
const realmEventIds={1:['templeMeridian','cliffPulse','mountainVein','marketScript'],2:['templeSeal','cliffFormation','mountainCave','marketPact'],3:['templeBreath','cliffVision','mountainSpring']};
for(const [realm,ids] of Object.entries(realmEventIds)){
 for(const [index,location] of ['temple','cliff','mountain',...(realm=== '1'||realm==='2'?['market']:[])].entries()){
  let realmState=G.create();realmState.stage=Number(realm);realmState.location=location;realmState.month=25;realmState.grain=30;realmState.flags.scroll=true;realmState.flags.herbalist=true;
  if(location==='market')realmState.events.seen=[];
  realmState=run(realmState,location==='market'?'action:marketWalk':'action:rest',0);
  if(location==='market'&&realmState.pending==null){realmState.events.seen=[];realmState.events.nextMonth=0;realmState=run(realmState,'action:rest',0);}
  assert.equal(realmState.pending,`scene-${ids[index]}`);
 }
}
let pulse=G.create();pulse.stage=1;pulse.location='cliff';pulse.month=25;pulse.grain=30;pulse.totalProgress=90;pulse.flags.scroll=true;
pulse=run(pulse,'action:rest',0);const initialPulse=pulse.totalProgress;
pulse=run(pulse,'choice:readPulse');assert.equal(pulse.totalProgress,initialPulse+8);
let training=G.create();training.stage=1;training.manual=2;training.manuals.push(2);training.practice[2]=13;training.root=3;training.dao=3;training.location='cliff';training.month=25;training.grain=30;training.flags.scroll=true;training.progress=G.cap(training)-8-G.cultivationGain(training)+1;
training=run(training,'action:rest',0);
const reserved=G.options(training).find(x=>x.id==='readPulse');
assert.ok(reserved.detail.includes('本层功行 +'));
training=run(training,'choice:readPulse');
assert.ok(training.progress<G.cap(training));
training=run(training,'action:cultivate',1);
assert.equal(training.practice[2],14);
assert.equal(training.pending,'stage');
let seal=G.create();seal.stage=2;seal.location='temple';seal.month=25;seal.grain=30;seal.foundationStrain=1;seal.herbs=1;
seal=run(seal,'action:rest',0);seal=run(seal,'choice:repairSeal');assert.equal(seal.foundationStrain,0);
let finalRealm=G.create();finalRealm.stage=3;finalRealm.month=25;finalRealm.grain=30;finalRealm.herbs=1;finalRealm.wounds=2;
finalRealm=run(finalRealm,'action:rest',0);finalRealm=run(finalRealm,'choice:closeBreath');assert.equal(finalRealm.wounds,0);
// Retreat repeats the existing monthly rules and stops at a real decision.
let retreat=G.create({name:'闭关人'});retreat.manual=1;retreat.manuals.push(1);retreat.grain=30;retreat.events.nextMonth=999;
let manual=structuredClone(retreat);
retreat=run(retreat,'action:secludeYear');
for(let i=0;i<retreat.month;i++)manual=run(manual,manual.focus<18?'action:rest':'action:cultivate');
for(const key of ['month','progress','totalProgress','grain','focus','root','wit','wounds'])assert.equal(retreat[key],manual[key],key);
const directStart=G.create({origin:'herbalist'});directStart.location='mountain';directStart.grain=1;
const direct=run(directStart,'action:secludeYear');
assert.equal(direct.pending,'herbalist');
assert.equal(direct.month,1);
assert.equal(retreat.batchActive,undefined);
assert.ok(retreat.logs.at(-1).text.includes(`闭关${retreat.month}个月`));
assert.ok(retreat.logs.some(e=>e.batch));
let annual=G.create();annual.manual=0;annual.grain=20;annual.events.nextMonth=999;
annual=run(annual,'action:secludeYear');
assert.equal(annual.month,12);
assert.equal(annual.books[0].title,'第1卷 · 山中岁华');
assert.ok(annual.books[0].lines.some(line=>line.includes('修行')));
assert.ok(annual.logs.at(-1).text.includes('闭关12个月'));
// Market purchases can be combined without aging the character.
let market=G.create({origin:'merchant'});market.location='market';market.herbs=4;market.silver=9;
market=run(market,'action:sellall');
assert.equal(market.silver,25);assert.equal(market.herbs,0);assert.equal(market.month,0);
market=run(market,'action:buymax');
assert.equal(market.grain,G.ORIGINS.merchant.grain+40);assert.equal(market.silver,1);assert.equal(market.month,0);
const noFunds=run(market,'action:buymax');assert.equal(noFunds.silver,market.silver);
let purchase=G.create({origin:'merchant',elements:['wood']});purchase.location='market';purchase=run(purchase,'action:buymanual');
assert.ok(purchase.manuals.includes(1));assert.equal(purchase.manual,0);assert.equal(purchase.month,0);
let tonic=G.create();tonic.location='market';tonic.silver=16;const beforeTonic=tonic.lifeLimitMonths;
tonic=run(tonic,'action:buyelixir');assert.equal(tonic.lifeLimitMonths,beforeTonic);assert.equal(tonic.elixirBoost,6);assert.equal(tonic.month,0);
let harvest=G.create({origin:'herbalist'});harvest.location='mountain';harvest.flags.herbalist=true;harvest.grain=2;
let manualHarvest=structuredClone(harvest);
harvest=run(harvest,'action:gatherSeason');
for(let i=0;i<6;i++)manualHarvest=run(manualHarvest,manualHarvest.focus<12?'action:rest':'action:gather');
for(const key of ['month','herbs','grain','focus','wounds'])assert.equal(harvest[key],manualHarvest[key],`harvest ${key}`);
assert.equal(harvest.month,6);assert.ok(harvest.logs.at(-1).text.includes('连采6个月'));
let encounterHarvest=G.create();encounterHarvest.location='mountain';
encounterHarvest=run(encounterHarvest,'action:gatherSeason');
assert.equal(encounterHarvest.pending,'herbalist');assert.equal(encounterHarvest.month,1);
let interrupted=G.create({origin:'herbalist'});interrupted.location='mountain';interrupted.manual=1;interrupted.manuals.push(1);interrupted.grain=1;
interrupted=run(interrupted,'action:secludeYear');
assert.equal(interrupted.month,1);
assert.equal(interrupted.pending,'herbalist');
assert.ok(interrupted.logs.at(-1).text.includes('闭关1个月'));
let danger=G.create();danger.lifeLimitMonths=danger.ageMonths+12;
assert.ok(G.available(danger).find(x=>x.id==='secludeYear').disabled);
assert.ok(G.available({...danger,location:'mountain'}).find(x=>x.id==='gatherSeason').disabled);
danger=run(danger,'action:secludeYear');
assert.equal(danger.month,0);
assert.equal(danger.pending,null);
let threshold=G.create();threshold.manual=1;threshold.manuals.push(1);threshold.progress=G.cap(threshold)-1;
threshold=run(threshold,'action:secludeYear');
assert.equal(threshold.month,1);
assert.equal(threshold.pending,'stage');
threshold=run(threshold,'choice:defer');
assert.ok(G.available(threshold).some(a=>a.id==='stage'));
threshold=run(threshold,'action:stage');
assert.equal(threshold.pending,'stage');
// Study grows wisdom through the same hidden aptitude threshold and no longer changes cultivation yield.
assert.deepEqual([2,3,4,5,6,7].map(G.studyNeed),[7,10,13,16,19,22]);
let scholarOfScriptures=G.create({origin:'herbalist'});
scholarOfScriptures.location='cliff';scholarOfScriptures.grain=200;
const readTimes=n=>{for(let i=0;i<n;i++){
 if(scholarOfScriptures.focus<12)scholarOfScriptures=run(scholarOfScriptures,'action:rest');
 scholarOfScriptures=run(scholarOfScriptures,'action:study');
 if(scholarOfScriptures.pending==='scroll')scholarOfScriptures=run(scholarOfScriptures,'choice:hide');
}};
const beforeStudy=G.cultivationGain(scholarOfScriptures);
readTimes(2);assert.equal(scholarOfScriptures.wit,2);
assert.equal(scholarOfScriptures.studyWork,4);
assert.equal(G.cultivationGain(scholarOfScriptures),beforeStudy);
readTimes(2);assert.equal(scholarOfScriptures.wit,3);assert.equal(scholarOfScriptures.studyWork,1);
assert.ok(G.decodeNeed(scholarOfScriptures,4)<G.decodeNeed({...scholarOfScriptures,wit:2},4));
readTimes(4);assert.equal(scholarOfScriptures.wit,3);assert.equal(scholarOfScriptures.studyWork,9);
readTimes(1);assert.equal(scholarOfScriptures.wit,4);assert.equal(scholarOfScriptures.studyWork,1);
readTimes(6);assert.equal(scholarOfScriptures.wit,5);assert.equal(scholarOfScriptures.studyWork,0);
readTimes(8);assert.equal(scholarOfScriptures.wit,6);assert.equal(scholarOfScriptures.studyWork,0);
readTimes(10);assert.equal(scholarOfScriptures.wit,7);assert.equal(scholarOfScriptures.studyWork,1);
readTimes(11);assert.equal(scholarOfScriptures.wit,8);
readTimes(5);assert.equal(scholarOfScriptures.wit,8);
assert.equal(scholarOfScriptures.studyWork,0);
assert.ok(scholarOfScriptures.books.some(b=>b.lines.some(line=>line.includes('悟性提升'))));
const limit=s.lifeLimitMonths;
// Starting method alone cannot reach the first threshold in an ordinary lifetime.
let slow=G.create({name:'独修'});
for(let i=0;i<800&&!slow.ending&&slow.stage===0;i++){
 if(slow.pending==='stage')break;
 if(slow.pending==='herbalist'){slow=run(slow,'choice:leave');continue;}
 if(slow.focus<30)slow=run(slow,'action:rest');
 else if(slow.grain<3){slow=run(slow,'travel:mountain');slow=run(slow,'action:gather');}
 else slow=run(slow,'action:cultivate');
}
assert.equal(slow.ending?.kind,'retired');
assert.equal(slow.stage,0);
assert.ok(slow.progress<G.cap(slow));
// Follow the NPC route and earn the manuals, satisfying attributes through practice.
s=run(s,'travel:cliff');s=run(s,'action:study');s=run(s,'choice:share');
assert.deepEqual(s.npcFavor,{gu:2,ye:0,cheng:1,lu:0,wen:0});
s=run(s,'travel:mountain');s=run(s,'action:gather');
const encounter=structuredClone(s);
const paid=run(encounter,'choice:trade');
assert.equal(paid.silver,encounter.silver+8);
assert.deepEqual(paid.npcFavor,{gu:2,ye:-1,cheng:1,lu:0,wen:0});
const bypassed=run(encounter,'choice:leave');
assert.equal(bypassed.month,encounter.month);
assert.deepEqual(bypassed.npcFavor,encounter.npcFavor);
// The same encounter opens three later paths after time passes, each with its own cost.
for(const [first,next,clue] of [['help','accompany','trust'],['trade','buyMap','map'],['leave','solo','solo']]){
 let branch=run(encounter,`choice:${first}`);
 assert.equal(branch.story.yeRoute,first);
 assert.equal(G.available(branch).some(a=>a.id==='yeFollowup'),false);
 branch=run(branch,'action:rest');branch=run(branch,'action:rest');
 const before=branch.month;
 assert.equal(G.available(branch).some(a=>a.id==='yeFollowup'),true);
 branch=run(branch,'action:yeFollowup');
 assert.equal(branch.month,before);
 assert.ok(G.options(branch).some(o=>o.id===next&&!o.disabled));
 branch=run(branch,`choice:${next}`);
 assert.equal(branch.story.yeClue,clue);
 assert.equal(branch.month,before+1);
 assert.equal(G.available(branch).some(a=>a.id==='yeFollowup'),false);
 const beforeOpen=branch.silver;
 branch.insight=7;branch.focus=100;branch.silver=Math.max(branch.silver,10);
 branch=run(branch,'action:spring');
 const hidden=G.options(branch).find(o=>o.id==='hidden');
 assert.equal(hidden.disabled,false,`${first} path should find the high spring`);
 const expectedCost=first==='help'?2:first==='trade'?6:0;
 assert.ok(hidden.detail.includes(`银钱 −${expectedCost}`));
 branch=run(branch,'choice:hidden');
 assert.equal(branch.spring,3);
 assert.equal(branch.silver,Math.max(beforeOpen,10)-expectedCost);
 assert.ok(branch.books.length===0||branch.books.every(b=>Array.isArray(b.lines)));
}
let forage=run(encounter,'choice:leave');forage=run(forage,'action:rest');forage=run(forage,'action:rest');forage=run(forage,'action:yeFollowup');forage=run(forage,'choice:forage');
assert.equal(forage.story.yeClue,null);
assert.ok(forage.herbs>=encounter.herbs+2);
const oldEvent=structuredClone(bypassed);oldEvent.version=5;delete oldEvent.story;
const migratedEvent=G.migrate(oldEvent);
assert.equal(migratedEvent.story.yeRoute,'leave');
assert.equal(migratedEvent.version,7);
assert.equal(G.migrate(migratedEvent),migratedEvent);
s=run(s,'choice:help');
s=run(s,'travel:market');s=run(s,'action:sellherb');
s=run(s,'travel:mountain');s=run(s,'action:gather');
s=run(s,'travel:market');s=run(s,'action:sellherb');
assert.ok(s.silver>=12);
s=run(s,'action:buymanual');
assert.ok(s.manuals.includes(1));assert.equal(s.manual,0);
s=run(s,'travel:temple');s=run(s,'action:manual');
while(!G.manualDecoded(s,1)){if(s.focus<12){s=run(s,'choice:back');s=run(s,'action:rest');s=run(s,'action:manual');}s=run(s,'choice:decode-1');}
s=run(s,'action:manual');
s=run(s,'choice:equip-1');
assert.equal(s.manual,1);
assert.equal(G.cap(s),48);
assert.ok(s.lifeLimitMonths===limit);
const availableBefore=s.progress;
s=run(s,'action:manual');s=run(s,'choice:equip-0');
assert.equal(G.cap(s),36);
assert.equal(s.progress,availableBefore);
s=run(s,'action:manual');s=run(s,'choice:equip-1');
s.ageMonths=0; // Legacy scripted route fixture isolates acquisition gates from v2.43 chapter deadline.
s=run(s,'travel:temple');
function practiceUntil(predicate){for(let i=0;i<650&&!predicate()&&!s.ending;i++){
 if(s.progress>=G.cap(s)&&s.stage<3&&!s.pending)s=run(s,'action:stage');
 else if(s.pending==='herbalist')s=run(s,'choice:help');
 else if(s.pending==='stage')s=run(s,'choice:patient');
 else if(s.pending?.startsWith('scene-'))s=run(s,'choice:ignore');
 else if(s.focus<30)s=run(s,'action:rest');
 else if(s.grain<4){s=run(s,'travel:mountain');s=run(s,'action:gather');}
 else s=run(s,'action:cultivate');
 if(s.story.ordeal?.triggered&&!s.story.ordeal.resolved)s.story.ordeal.resolved=true;
}assert.equal(predicate(),true,'practice milestone should be reachable '+JSON.stringify({month:s.month,age:s.ageMonths,stage:s.stage,pending:s.pending,root:s.root,progress:s.progress,cap:G.cap(s),focus:s.focus,grain:s.grain,location:s.location,ending:s.ending}));}
practiceUntil(()=>s.root>=3);
assert.ok(s.practice[1]>=7,'the first root increase should follow the shared aptitude threshold');
s=run(s,'travel:temple');s=run(s,'action:mentor');
if(!s.flags.mentor){s=run(s,'choice:serve');s=run(s,'action:mentor');}
assert.ok(G.options(s).find(x=>x.id==='guidance').disabled===false);
assert.equal(G.options(s).some(x=>x.id==='raretext'),false);
s=run(s,'choice:guidance');
assert.ok(s.manuals.includes(2));assert.equal(s.manual,1);
s=run(s,'action:manual');for(let i=0;!G.manualDecoded(s,2)&&i<30;i++){
 if(s.pending?.startsWith('scene-'))s=run(s,'choice:ignore');
 if(s.pending==='manual'&&(s.focus<20||s.grain<3))s=run(s,'choice:back');
 if(!s.pending&&s.grain<3){s=run(s,'travel:mountain');s=run(s,'action:gather');s=run(s,'travel:temple');}
 if(!s.pending&&s.focus<20)s=run(s,'action:rest');
 if(!s.pending)s=run(s,'action:manual');
 if(s.pending==='manual')s=run(s,'choice:decode-2');
}
assert.ok(G.manualDecoded(s,2),JSON.stringify({month:s.month,pending:s.pending,location:s.location,focus:s.focus,grain:s.grain,ending:s.ending,decode:s.decodeWork,options:G.options(s)}));
s=run(s,'action:manual');s=run(s,'choice:equip-2');assert.equal(s.manual,2);
assert.equal(G.cap(s),56);
practiceUntil(()=>s.root>=4);
s.dao=4;s.practice[2]=14; // This legacy NPC-route fixture isolates dialogue gates from the new Dao aptitude progression.
s=run(s,'travel:temple');s=run(s,'action:mentor');s=run(s,'choice:serve');
assert.equal(s.npcFavor.cheng,3);
practiceUntil(()=>s.herbs>=2);
if(s.focus<20)s=run(s,'action:rest');s.focus=100;
if(s.pending?.startsWith('scene-'))s=run(s,'choice:ignore');
s=run(s,'travel:temple');s=run(s,'action:mentor');
assert.equal(s.pending,'trueText');
assert.equal(G.options(s).some(x=>x.id==='raretext'),false);
s=run(s,'choice:undertake');
assert.equal(s.story.trueTextReady,true);
s=run(s,'action:mentor');
assert.equal(G.options(s).find(x=>x.id==='raretext').disabled,false);
s=run(s,'choice:raretext');
assert.ok(s.manuals.includes(3));assert.equal(s.manual,2);
s.decodedManuals.push(3);s=run(s,'action:manual');s=run(s,'choice:equip-3');assert.equal(s.manual,3);
assert.equal(G.cap(s),78);
assert.ok(s.month<168,'high manual should be obtainable within the chapter deadline');
// The manual active at each breakthrough is recorded and changes foundation grade.
s.stage=0;s.foundation=0;s.foundationGrades=[];s.progress=G.cap(s);s.pending="stage";s.grain=50;s.focus=100;
practiceUntil(()=>s.progress>=G.cap(s));
assert.equal(s.pending,'stage');
const early=structuredClone(s);
assert.ok(G.stageChance(early)>G.stageChance({...early,manual:0}));
s=run(s,'choice:patient');
assert.equal(s.stage,1);
assert.equal(s.foundationGrades.length,1);
assert.equal(s.foundationGrades[0],3);
assert.equal(s.progress,0);
assert.ok(s.totalProgress>=G.NEED[0]);
for(let stage=1;stage<3;stage++){
 practiceUntil(()=>s.progress>=G.cap(s));
 assert.equal(s.pending,'stage');
 s=run(s,'choice:patient');
 assert.equal(s.stage,stage+1);
}
assert.equal(s.foundation,3);
assert.equal(s.foundationGrades.length,3);
assert.ok(s.books.length>0);
assert.ok(s.lifeLimitMonths>=limit);
// Late acquisition produces a different first foundation even when the final manual matches.
const late={...early,manual:1,totalProgress:70,root:3,dao:3};
assert.ok(G.stageGrade(early,'patient')>G.stageGrade(late,'patient'));
const lateFoundation={...s,foundationGrades:[G.stageGrade(late,'patient'),...s.foundationGrades.slice(1)]};
assert.ok(G.quality(s)>G.quality(lateFoundation));
assert.ok(G.chance(s)>G.chance(lateFoundation));
// Failure consumes time and progress, but can be retried after recovery.
let failed={...early,grain:10,focus:100,wounds:0};
failed=run(failed,'choice:patient',.999);
assert.equal(failed.stage,0);
assert.ok(failed.progress<early.progress);
assert.equal(failed.wounds,1);
assert.equal(failed.foundationStrain,1);
assert.equal(failed.month,early.month+2);
assert.equal(failed.pending,null);
assert.ok(G.available(failed).some(x=>x.id==='cultivate'&&!x.disabled));
assert.ok(G.available(failed).some(x=>x.id==='stage'&&x.label.includes('调理')));
let retry=structuredClone(failed);retry.progress=G.cap(retry);retry.wounds=0;retry.grain=20;
retry=run(retry,'action:stage');
assert.ok(G.options(retry).find(x=>x.id==='patient').detail.includes('30% 降一品'));
const downgraded=run(retry,'choice:patient',0);
assert.equal(downgraded.foundationGrades[0],G.stageGrade(retry,'patient')-1);
assert.equal(downgraded.foundationStrain,0);
let recovered=structuredClone(failed);recovered.herbs=2;recovered.grain=20;recovered.focus=100;
recovered=run(recovered,'action:stage');
assert.ok(G.options(recovered).find(x=>x.id==='patient').disabled);
recovered=run(recovered,'choice:restore');
assert.equal(recovered.foundationStrain,0);
assert.equal(recovered.herbs,1);
assert.equal(recovered.month,failed.month+2);
recovered.progress=G.cap(recovered);recovered.wounds=0;
recovered=run(recovered,'action:stage');
assert.equal(G.options(recovered).find(x=>x.id==='patient').detail.includes('降一品风险'),false);
const fullGrade=run(recovered,'choice:patient',0);
assert.equal(fullGrade.foundationGrades[0],G.stageGrade(recovered,'patient'));
let oldRetry=structuredClone(early);delete oldRetry.foundationStrain;oldRetry=run(oldRetry,'choice:patient',.999);
assert.equal(oldRetry.foundationStrain,1);
const yearEnd={...early,month:10,ageMonths:21*12+10,grain:10,books:[],logs:[]};
const recorded=run(yearEnd,'choice:patient');
assert.equal(recorded.month,12);
assert.ok(recorded.books[0].lines.some(x=>x.includes('元基')));
assert.equal(recorded.books[0].stage,G.STAGES[1]);
// Stage completion and final opening remain reachable.
s=run(s,'travel:mountain');s=run(s,'action:spring');s=run(s,'choice:common');
practiceUntil(()=>s.progress>=G.cap(s));
if(s.focus<50)s=run(s,'action:rest');
assert.ok(G.available(s).find(x=>x.id==='attempt'&&!x.disabled));
s=run(s,'action:attempt');
const best=run(s,'choice:steady');
assert.equal(best.ending.kind,'success');
assert.ok(best.books.at(-1).lines.some(x=>x.includes('脉象')));
assert.ok(G.lifeSummary(best).some(x=>x.includes('叶青蘅')));
assert.ok(G.lifeSummary(best).some(x=>x.includes('开脉脉象')));
assert.ok(G.lifeSummary(best).some(x=>x.includes('第1关')));
const mortal=G.step(s,'choice:steady',(()=>{const rolls=[.999,.999];return ()=>rolls.shift()??.5;})());
assert.equal(mortal.ending.kind,'mortal');
const legacy=G.create({name:'旧档'});legacy.version=3;delete legacy.totalProgress;delete legacy.practice;delete legacy.manuals;delete legacy.foundationGrades;legacy.progress=38;legacy.pending='stage';
const restored=G.migrate(legacy);
assert.equal(restored.version,7);
assert.equal(restored.studyWork,0);
assert.equal(restored.pending,'stage');
assert.equal(restored.progress,G.cap(restored));
assert.equal(restored.lifeLimitMonths,legacy.lifeLimitMonths);
assert.equal(G.migrate(restored),restored);
const oldest=structuredClone(legacy);oldest.version=2;oldest.trust=2;
delete oldest.body;delete oldest.dao;delete oldest.social;delete oldest.npcFavor;
oldest.logs.push({month:1,text:'你将残卷的隐义如实告诉同门顾闻溪。她记下这份人情，也替你带来两两润笔银。',tag:'人情'});
const converted=G.migrate(oldest);
assert.equal(converted.version,7);
assert.deepEqual(converted.npcFavor,{gu:2,ye:0,cheng:1,lu:0,wen:0});
assert.equal('trust' in converted,false);
const prev=G.create({name:'上代修士'});prev.version=4;delete prev.studyWork;prev.wit=6;prev.progress=12.5;
const continued=G.migrate(prev);
assert.equal(continued.version,7);
assert.equal(continued.wit,6);
assert.equal(continued.progress,12.5);
assert.equal(continued.studyWork,0);
// Each origin can reach a different immortal method, and the new pools have separate entry costs.
let star=G.create({origin:'scholar'});star.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));star.flags.scroll=true;star.npcFavor.gu=2;star.story.scriptureReads=8;star.root=4;star.wit=5;star.practice[1]=8;star.grain=30;star.location='cliff';
star=run(star,'action:guText');star=run(star,'choice:collaborate');
star=run(star,'travel:market');star.silver=6;star=run(star,'action:buyFragments');star=run(star,'travel:temple');
for(let i=0;i<3;i++)star=run(star,'action:rest',1);
star=run(star,'travel:cliff');star=run(star,'action:guFinish');star=run(star,'choice:verify');
assert.ok(star.manuals.includes(4));assert.equal(star.manualId,'breath');assert.equal(G.cap(star),36);
let green=G.create({origin:'herbalist'});green.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));green.location='mountain';green.flags.herbalist=true;green.story.yeRoute='help';green.story.scriptureReads=5;green.wit=3;green.grain=30;green.manuals.push(1);green.manual=1;
for(let i=0;i<10;i++){if(green.focus<18)green=run(green,'action:rest',1);green=run(green,'action:cultivate',1);}
green=run(green,'action:yeText');green=run(green,'choice:tend');
green=run(green,'action:gather',1);green=run(green,'action:gather',1);
green=run(green,'action:rest',1);
green=run(green,'action:yeFinish');green=run(green,'choice:healVein');
assert.ok(green.manuals.includes(5));assert.equal(green.manualId,'qingzhuan');assert.equal(green.story.yeHerbWork,2);
let trader=G.create({origin:'merchant'});trader.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));trader.location='market';trader.grain=40;
trader=run(trader,'action:luMeet');trader=run(trader,'choice:pledge');assert.ok(trader.manuals.includes(6));assert.equal(trader.manualId,'breath');
trader.practice[6]=10;trader.story.scriptureReads=7;trader.root=4;trader.wit=4;trader.dao=4;trader.month+=5;trader.silver=9;
trader=run(trader,'action:luReturn');trader=run(trader,'choice:redeemSilver');
assert.ok(trader.manuals.includes(3));assert.equal(trader.story.luCredential,true);
let contracted=G.create({origin:'merchant'});contracted.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));contracted.location='market';contracted.grain=30;
contracted=run(contracted,'action:luMeet');contracted=run(contracted,'choice:pledge');
contracted.month=contracted.story.luMonth+18;contracted.practice[6]=18;contracted.insight=7;contracted.wit=4;contracted.silver=8;
contracted=run(contracted,'action:luReturn');assert.equal(G.options(contracted).find(o=>o.id==='redeemSilver').disabled,false);
contracted=run(contracted,'choice:redeemSilver');assert.ok(contracted.manuals.includes(3));assert.equal(contracted.manualId,'breath');assert.equal(contracted.root,3);
let luFight=G.create({origin:'merchant'});luFight.location='market';luFight.grain=30;luFight.story.luHeard=true;luFight=run(luFight,'action:luMeet');assert.ok(G.options(luFight).some(o=>o.id==='fight'));const luMonth=luFight.month;luFight=run(luFight,'choice:fight');assert.equal(luFight.month,luMonth+1);assert.equal(luFight.combat.storyEncounter,'luEscort');luFight.combat.enemy.currentQi=1;luFight=run(luFight,'combat:strike',0);assert.equal(luFight.story.luBattle,'won');assert.equal(luFight.story.luRoute,'fight');assert.ok(luFight.npcFavor.lu>0);assert.ok(luFight.manuals.includes(6));assert.equal(luFight.sparRecord.wins,0);
let luFightObserved=G.create({origin:'merchant'});luFightObserved.location='market';luFightObserved.grain=30;luFightObserved.story.luHeard=true;luFightObserved=run(luFightObserved,'action:luMeet');luFightObserved=run(luFightObserved,'choice:fight');luFightObserved=run(luFightObserved,'combat:guard',0);assert.equal(luFightObserved.combat.intent,'paperCut');luFightObserved=run(luFightObserved,'combat:guard',0);assert.ok(luFightObserved.codex.combatantNotes.scrollBandit.seenArts.includes('paperCut'));
let luFightLoss=G.create({origin:'merchant'});luFightLoss.location='market';luFightLoss.grain=30;luFightLoss.story.luHeard=true;luFightLoss=run(luFightLoss,'action:luMeet');luFightLoss=run(luFightLoss,'choice:fight');luFightLoss.combat.player.currentQi=1;luFightLoss.combat.enemy.attack=300;luFightLoss.combat.intent='strike';luFightLoss=run(luFightLoss,'combat:guard',0);assert.equal(luFightLoss.story.luBattle,'lost');assert.equal(luFightLoss.story.luRoute,'fightDelayed');assert.ok(luFightLoss.npcFavor.lu<0);assert.equal(luFightLoss.manuals.includes(6),false);luFightLoss.month+=5;luFightLoss.silver=4;luFightLoss=run(luFightLoss,'action:luReturn');assert.ok(G.options(luFightLoss).some(o=>o.id==='repairScrollSilver'));luFightLoss=run(luFightLoss,'choice:repairScrollSilver');assert.equal(luFightLoss.story.luRoute,'fight');assert.ok(luFightLoss.manuals.includes(6));assert.equal(luFightLoss.story.luPapersDamaged,false);
trader.npcFavor.cheng=0;trader.silver=8;trader=run(trader,'travel:temple');trader=run(trader,'action:sealAudience');trader=run(trader,'choice:bondSeal');
trader.herbs=2;trader.insight=7;trader=run(trader,'action:spring');trader=run(trader,'choice:sealed');
assert.equal(trader.springId,'bone-spring');assert.equal(trader.story.sealDebt,'护卷抵契');
green.story.yeClue='trust';green.insight=7;green.herbs=5;green.focus=100;
green=run(green,'action:stoneScout');green=run(green,'choice:seekStone');
green=run(green,'action:spring');green=run(green,'choice:stone');
assert.equal(green.springId,'stone-marrow');
let springYield=G.create({origin:'herbalist'});springYield.location='mountain';springYield.flags.herbalist=true;springYield.story.yeClue='trust';springYield.grain=30;springYield.insight=5;springYield=run(springYield,'action:stoneScout');springYield=run(springYield,'choice:yieldSpring');assert.equal(springYield.story.stoneClue,true);assert.equal(springYield.story.stonePriority,undefined);assert.ok(springYield.codex.combatants.includes('springRival'));
let springDeal=G.create({origin:'herbalist'});springDeal.location='mountain';springDeal.flags.herbalist=true;springDeal.story.yeClue='trust';springDeal.grain=30;springDeal.insight=5;springDeal.silver=5;springDeal=run(springDeal,'action:stoneScout');springDeal=run(springDeal,'choice:negotiateSpring');assert.equal(springDeal.story.stonePriority,true);assert.equal(springDeal.silver,2);
springDeal.insight=7;springDeal.root=4;springDeal.body=4;springDeal.herbs=1;springDeal.focus=100;springDeal=run(springDeal,'action:spring');assert.equal(G.options(springDeal).find(o=>o.id==='stone').disabled,false);springDeal=run(springDeal,'choice:stone');assert.equal(springDeal.springId,'stone-marrow');assert.equal(springDeal.herbs,0);
let springFight=G.create({origin:'herbalist'});springFight.location='mountain';springFight.flags.herbalist=true;springFight.story.yeClue='trust';springFight.grain=30;springFight.insight=5;springFight=run(springFight,'action:stoneScout');springFight=run(springFight,'choice:contestSpring');assert.equal(springFight.combat.storyEncounter,'springContest');springFight.combat.enemy.currentQi=1;springFight=run(springFight,'combat:strike',0);assert.equal(springFight.story.stonePriority,true);assert.equal(springFight.story.stoneClue,true);assert.equal(springFight.sparRecord.wins,0);assert.ok(springFight.logs.some(l=>l.text.includes('优先探查权')));
let springLoss=G.create({origin:'herbalist'});springLoss.location='mountain';springLoss.flags.herbalist=true;springLoss.story.yeClue='trust';springLoss.grain=30;springLoss.insight=5;springLoss=run(springLoss,'action:stoneScout');springLoss=run(springLoss,'choice:contestSpring');springLoss.combat.player.currentQi=1;springLoss.combat.enemy.attack=300;springLoss.combat.intent='strike';springLoss=run(springLoss,'combat:guard',0);assert.equal(springLoss.story.stoneMissed,true);assert.equal(springLoss.story.stonePriority,undefined);assert.ok(G.options(Object.assign(springLoss,{pending:'stoneScout'})).some(o=>o.id==='seekStone'));
for(const method of [3,4,5])for(const pool of [3,4,5]){
 const sample=G.create();sample.manual=method;sample.spring=pool;sample.root=6;sample.insight=9;sample.foundation=3;sample.foundationGrades=[2,2,2];sample.wounds=0;
 for(const roll of [0,.01,.03,.05,.5,.99])for(const mode of ['steady','bold'])assert.notEqual(G.grade(sample,roll,mode),'上上品',`${method}/${pool}/${roll}/${mode} cannot bypass imperfect foundation`);
 sample.foundationGrades=[3,3,3];assert.equal(G.grade(sample,0,'steady'),'上上品',`${method}/${pool} should have a viable top-grade path`);
}
// Clear Meridian keeps its five-point opening advantage even when a fully prepared route reaches the base chance ceiling.
for(const origin of ['scholar','merchant','herbalist']){
 const prepared=G.create({origin,talent:'clarity'});
 prepared.manual=origin==='scholar'?4:origin==='merchant'?3:5;
 prepared.spring=origin==='scholar'?3:origin==='merchant'?4:5;
 prepared.stage=3;prepared.foundation=3;prepared.foundationGrades=[2,2,2];prepared.insight=8;prepared.totalProgress=240;prepared.focus=100;prepared.wounds=0;
 assert.equal(G.chance({...prepared,talent:'meridian'})-G.chance(prepared),5,origin);
 assert.ok(G.chance({...prepared,talent:'meridian'})<=84);
}
const savedV6=G.create();savedV6.version=6;delete savedV6.manualId;delete savedV6.springId;delete savedV6.manualIds;delete savedV6.story.luHeard;savedV6.books=[{year:1,lines:['旧卷原文'],stage:'入门吐纳'}];
const savedV7=G.migrate(savedV6);assert.equal(savedV7.version,7);assert.deepEqual(savedV7.books,savedV6.books);assert.equal(savedV7.manualId,'breath');assert.equal(savedV7.npcFavor.lu,0);
const oldPending=G.create();oldPending.version=6;oldPending.pending='trueText';oldPending.flags.mentor=true;oldPending.story.trueTextReady=false;
const continuedPending=G.migrate(oldPending);assert.equal(continuedPending.pending,'trueText');assert.ok(G.options(continuedPending).some(o=>o.id==='undertake'));
let overdue=G.create({origin:'merchant'});overdue.location='market';overdue=run(overdue,'action:luMeet');overdue=run(overdue,'choice:pledge');
overdue.month=overdue.story.luMonth+59;const priorSocial=overdue.social;
overdue=run(overdue,'action:marketWalk',1);assert.equal(overdue.social,priorSocial-1);assert.equal(overdue.story.luDefaulted,true);
overdue=run(overdue,'action:marketWalk',1);assert.equal(overdue.social,priorSocial-1);
// Immortal-method routes now attune their own core affinity instead of sending the player back to grind basic breathing for years.
let starAttune=G.create({origin:'scholar'});starAttune.affinityPoints.fire=1;starAttune.flags.scroll=true;starAttune.npcFavor.gu=2;starAttune.story.scriptureReads=8;starAttune.root=4;starAttune.wit=5;starAttune.practice[1]=8;starAttune.grain=30;starAttune.location='cliff';starAttune.story.guText='collaborate';starAttune.story.guFragments=true;starAttune.story.guTextMonth=0;starAttune.month=3;starAttune.focus=100;starAttune=run(starAttune,'action:guFinish');starAttune=run(starAttune,'choice:verify');assert.ok(starAttune.affinityPoints.fire>=4);assert.ok(starAttune.manuals.includes(4));
let taiweiAttune=G.create({origin:'merchant'});taiweiAttune.affinityPoints.metal=1;taiweiAttune.location='market';taiweiAttune.grain=30;taiweiAttune.story.luRoute='pledge';taiweiAttune.story.luMonth=0;taiweiAttune.manuals.push(6);taiweiAttune.manual=6;taiweiAttune.practice[6]=10;taiweiAttune.story.scriptureReads=7;taiweiAttune.root=4;taiweiAttune.wit=4;taiweiAttune.dao=4;taiweiAttune.social=5;taiweiAttune.silver=8;taiweiAttune.month=5;taiweiAttune=run(taiweiAttune,'action:luReturn');taiweiAttune=run(taiweiAttune,'choice:redeemSilver');assert.ok(taiweiAttune.affinityPoints.metal>=4);assert.ok(taiweiAttune.manuals.includes(3));
let greenAttune=G.create({origin:'herbalist'});greenAttune.affinityPoints.wood=1;greenAttune.affinityPoints.fire=1;greenAttune.location='mountain';greenAttune.grain=30;greenAttune.story.yeText='tend';greenAttune.story.yeTextMonth=0;greenAttune.story.yeHerbWork=2;greenAttune.month=2;greenAttune.story.scriptureReads=5;greenAttune.root=4;greenAttune.wit=3;greenAttune.body=4;greenAttune.herbs=2;greenAttune.focus=100;greenAttune.practice[1]=10;greenAttune=run(greenAttune,'action:yeFinish');greenAttune=run(greenAttune,'choice:healVein');assert.ok(greenAttune.affinityPoints.wood>=4||greenAttune.affinityPoints.fire>=4);assert.ok(greenAttune.manuals.includes(5));
console.log('All cultivation chapter checks passed');
// The archive unlocks through encounters; techniques must be learned before use.
let codex=G.create({gender:'male',elements:['wood']});assert.equal(codex.gender,'male');assert.deepEqual(codex.codex.people,[]);
codex=run(codex,'action:mentor');assert.deepEqual(codex.codex.people,['cheng']);
codex=run(codex,'choice:depart');codex=run(codex,'travel:arena');
assert.equal(G.available(codex).some(a=>a.id==='learn-flow'),true);
codex=run(codex,'action:spar-novice');assert.equal(G.combatOptions(codex).some(a=>a.id==='flow'),false);
const unlearned=run(codex,'combat:flow');assert.deepEqual(unlearned.combat,codex.combat);
codex=run(codex,'combat:withdraw');codex=run(codex,'action:learn-flow');assert.deepEqual(codex.knownTechniques,['flow']);
codex=run(codex,'action:kit-shoes');assert.ok(codex.codex.gear.includes('shoes'));
codex=run(codex,'travel:mountain');codex.pending='scene-mountainHerbs';codex=run(codex,'choice:engageApe');assert.ok(codex.codex.beasts.includes('ape'));assert.ok(G.combatOptions(codex).some(a=>a.id==='flow'));
let codexFight=G.create();codexFight.location='arena';codexFight=run(codexFight,'action:spar-keeper');assert.ok(codexFight.codex.combatants.includes('keeper'));assert.equal(codexFight.codex.combatantNotes.keeper.kind,'human');assert.deepEqual(codexFight.codex.combatantNotes.keeper.seenGear.sort(),['armor','weapon']);assert.deepEqual(codexFight.codex.combatantNotes.keeper.seenArts,[]);codexFight.combat.intent='earthWard';codexFight=run(codexFight,'combat:guard',0);assert.ok(codexFight.codex.combatantNotes.keeper.seenArts.includes('earthWard'));
let oldBeastCodex=G.create();oldBeastCodex.codex.beasts=['ape'];oldBeastCodex=G.migrate(oldBeastCodex);assert.ok(oldBeastCodex.codex.combatants.includes('ape'));assert.ok(oldBeastCodex.codex.combatantNotes.ape.seenArts.includes('vinePounce'));
let apeScene=G.create();apeScene.location='mountain';apeScene.pending='scene-mountainHerbs';assert.ok(G.options(apeScene).some(option=>option.id==='engageApe'));assert.ok(G.options(apeScene).some(option=>option.id==='bypassApe'));
let apeBypass=run(structuredClone(apeScene),'choice:bypassApe');assert.equal(apeBypass.story.apeEncounter,'bypassed');assert.equal(apeBypass.combat,null);assert.equal(apeBypass.grain,apeScene.grain+1);
let apeFight=run(structuredClone(apeScene),'choice:engageApe');assert.equal(apeFight.combat.storyEncounter,'mountainApe');apeFight.combat.enemy.currentQi=1;apeFight=run(apeFight,'combat:strike',0);assert.equal(apeFight.story.apeEncounter,'won');assert.equal(apeFight.herbs,apeScene.herbs+2);assert.equal(apeFight.sparRecord.wins,0);assert.ok(apeFight.codex.combatantNotes.ape.observations.length);
let apeLoss=run(structuredClone(apeScene),'choice:engageApe');apeLoss.combat.player.currentQi=1;apeLoss.combat.enemy.attack=300;apeLoss.combat.intent='strike';apeLoss=run(apeLoss,'combat:guard',0);assert.equal(apeLoss.story.apeEncounter,'lost');assert.equal(apeLoss.wounds,1);assert.equal(apeLoss.sparRecord.losses,0);
let apeRetreat=run(structuredClone(apeScene),'choice:engageApe');apeRetreat=run(apeRetreat,'combat:withdraw');assert.equal(apeRetreat.story.apeEncounter,'retreated');assert.equal(apeRetreat.wounds,0);assert.equal(apeRetreat.herbs,apeScene.herbs);
const prior=structuredClone(codex);codex=run(codex,'combat:auto-aggressive',0);
assert.equal(codex.combat,null);assert.equal(codex.sparRecord.last.style,'aggressive');assert.ok(codex.sparRecord.last.rounds<=30);
for(const field of ['month','ageMonths','lifeLimitMonths','grain','herbs','silver','progress'])assert.equal(codex[field],prior[field],field);
let cautious=run(prior,'combat:auto-steady',0);assert.equal(cautious.combat,null);assert.equal(cautious.sparRecord.last.style,'steady');
cautious=run(cautious,'travel:temple');assert.equal(cautious.trainingGear.shoes,false);assert.ok(cautious.codex.gear.includes('shoes'));
function winRate(stage,foe){let wins=0;for(let seed=1;seed<=50;seed++){let value=seed,rng=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);let subject=G.create();subject.stage=stage;subject.location='arena';subject=G.step(subject,`action:spar-${foe}`,rng);subject=G.step(subject,'combat:auto-aggressive',rng);wins+=subject.sparRecord.last.result==='胜出';}return wins;}
assert.equal(winRate(0,'keeper'),0);assert.equal(winRate(0,'swift'),0);
// Representative story-combat playtests: 100 deterministic seeds per build/stage.
function storyWinRate(origin,stage,foe,samples=100){let wins=0;for(let seed=1;seed<=samples;seed++){let value=seed,rng=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);let subject=G.create({origin});subject.stage=stage;subject.location='mountain';subject.pending='stoneScout';subject=G.step(subject,'choice:contestSpring',rng);subject=G.step(subject,'combat:auto-aggressive',rng);wins+=subject.sparRecord.last.result==='胜出';}return wins/samples;}
const scholarRivalEntry=storyWinRate('scholar',0,'springRival'),scholarRivalCore=storyWinRate('scholar',1,'springRival'),scholarRivalLate=storyWinRate('scholar',2,'springRival'),merchantRivalEntry=storyWinRate('merchant',0,'springRival'),herbalistRivalEntry=storyWinRate('herbalist',0,'springRival');
assert.ok(scholarRivalEntry<.2,`entry scholar should read as a risky challenge (${scholarRivalEntry})`);assert.ok(scholarRivalCore>=.2&&scholarRivalCore<=.5,`core scholar should have a contested but viable chance (${scholarRivalCore})`);assert.ok(scholarRivalLate>=.65,`late scholar should usually prevail (${scholarRivalLate})`);assert.ok(merchantRivalEntry>=.2&&merchantRivalEntry<=.55,`merchant should have a meaningful early chance (${merchantRivalEntry})`);assert.ok(herbalistRivalEntry>=.8,`herbalist's physical background should be a strong edge (${herbalistRivalEntry})`);
// Auto combat retains every exchange, including the opening and the last result.
let longSpar=G.create();longSpar.wit=100;longSpar.location='arena';
longSpar=G.step(longSpar,'action:spar-keeper',()=>.9);
longSpar=G.step(longSpar,'combat:auto-steady',()=>.9);
assert.ok(longSpar.sparRecord.last.rounds>12);
assert.equal(longSpar.sparRecord.last.history.length,longSpar.sparRecord.last.rounds+2);
assert.ok(longSpar.sparRecord.last.history[1].includes('互相行礼'));
assert.ok(longSpar.sparRecord.last.history.at(-1).includes(`第${longSpar.sparRecord.last.rounds}合`));
if(longSpar.sparRecord.last.result==='平局')assert.ok(longSpar.sparRecord.last.history.at(-1).includes('双方各自收势'));

// Seeing the market records its pill, without spending money or buying it.
let almanac=G.create();const startingSilver=almanac.silver;
assert.deepEqual(almanac.codex.elixirs,[]);
almanac=run(almanac,'travel:market');
assert.deepEqual(almanac.codex.elixirs,[G.ITEMS.elixir.id]);
assert.equal(almanac.silver,startingSilver);
assert.equal(almanac.flags.elixir,false);
almanac=run(almanac,'travel:temple');
assert.deepEqual(almanac.codex.elixirs,[G.ITEMS.elixir.id]);
const earlierMarketSave=structuredClone(almanac);delete earlierMarketSave.codex.elixirs;
assert.deepEqual(G.migrate(earlierMarketSave).codex.elixirs,[G.ITEMS.elixir.id]);
assert.equal(G.migrate(G.migrate(earlierMarketSave)).codex.elixirs.length,1);
for(const [id,art,cost] of [['novice','flow',6],['keeper','earthWard',9],['swift','metalFlash',12],['ape','vinePounce',6]]){
 let duelist=G.create({origin:'herbalist'});duelist.stage=3;duelist.location=id==='ape'?'mountain':'arena';if(id==='ape'){duelist.pending='scene-mountainHerbs';duelist=run(duelist,'choice:engageApe');}else duelist=run(duelist,`action:spar-${id}`);
 const before=duelist.combat.enemy.currentNei;duelist.combat.intent=art;
 duelist=run(duelist,'combat:guard',0);
 const lines=duelist.combat?.history||duelist.sparRecord.last.history;
 assert.ok(lines.at(-1).includes(id==='ape'?'天赋神通':'招式'),`${id} should use its art`);
 assert.equal((duelist.combat?.enemy.currentNei??before-cost),before-cost);
}
assert.ok(G.SPAR_OPPONENTS.keeper.gear.armor);
assert.ok(G.SPAR_OPPONENTS.swift.gear.weapon&&G.SPAR_OPPONENTS.swift.gear.shoes);
assert.deepEqual(G.FOE_ARTS.earthWard.elements,['earth']);
assert.equal(G.FOE_ARTS.metalFlash.polarity,'yang');
assert.deepEqual(G.FOE_ARTS.vinePounce.elements,['wood']);
let colorful=G.create({elements:['water'],polarity:'yin'});colorful.location='arena';colorful=run(colorful,'action:spar-novice');colorful=run(colorful,'combat:withdraw');
assert.deepEqual(colorful.sparRecord.last.playerAspect.elements,['water']);
assert.deepEqual(colorful.sparRecord.last.enemyAspect.elements,['fire']);


// P0 regression: standard immortal-manual acquisition attunes the core affinity needed to use the reward.
let attuneStar=G.create({origin:'scholar'});attuneStar.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,0]));attuneStar.flags.scroll=true;attuneStar.npcFavor.gu=2;attuneStar.story.scriptureReads=8;attuneStar.root=4;attuneStar.wit=5;attuneStar.practice[1]=8;attuneStar.grain=30;attuneStar.location='cliff';attuneStar.story.guText='collaborate';attuneStar.story.guFragments=true;attuneStar.story.guTextMonth=0;attuneStar.month=3;attuneStar.focus=100;
attuneStar=run(attuneStar,'action:guFinish');attuneStar=run(attuneStar,'choice:verify');
assert.ok(attuneStar.manuals.includes(4));assert.ok(attuneStar.affinityPoints.fire>=4);assert.equal(attuneStar.manual,0);
let attuneGreen=G.create({origin:'herbalist'});attuneGreen.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,0]));attuneGreen.location='mountain';attuneGreen.flags.herbalist=true;attuneGreen.story.yeText='tend';attuneGreen.story.yeTextMonth=0;attuneGreen.story.yeHerbWork=2;attuneGreen.month=2;attuneGreen.story.scriptureReads=5;attuneGreen.root=4;attuneGreen.wit=3;attuneGreen.body=4;attuneGreen.practice[1]=10;attuneGreen.herbs=4;attuneGreen.grain=20;attuneGreen.focus=100;
attuneGreen=run(attuneGreen,'action:yeFinish');attuneGreen=run(attuneGreen,'choice:healVein');
assert.ok(attuneGreen.manuals.includes(5));assert.ok(attuneGreen.affinityPoints.wood>=4||attuneGreen.affinityPoints.fire>=4);assert.equal(attuneGreen.manual,0);


// v2.42 feedback/regression checks.
let pill=G.create({origin:'merchant'});pill.location='market';pill.silver=20;const baseGain=G.cultivationGain(pill);
pill=run(pill,'action:buyelixir');assert.equal(pill.elixirBoost,6);assert.equal(pill.silver,10);assert.ok(G.cultivationGain(pill)>baseGain);
pill=run(pill,'travel:temple');pill.grain=20;pill.focus=100;pill=run(pill,'action:cultivate',0);assert.equal(pill.elixirBoost,5);
const boostedGain=G.cultivationGain(pill);assert.ok(boostedGain>baseGain);
pill=run(pill,'action:rest',0.99);assert.equal(pill.elixirBoost,5,'rest must not spend a dose');
for(let n=0;n<5;n++){if(pill.focus<18)pill=run(pill,'action:rest',0.99);pill=run(pill,'action:cultivate',0.99);}
assert.equal(pill.elixirBoost,0,'the sixth actual cultivation spends the last dose');
assert.equal(G.cultivationGain(pill),baseGain);
pill=run(pill,'travel:market');pill.silver=10;pill=run(pill,'action:buyelixir');assert.equal(pill.elixirBoost,6,'a finished course may be bought again');

let wen=G.create({origin:'herbalist'});wen.location='mountain';wen.pending='stoneScout';wen=run(wen,'choice:yieldSpring');assert.ok(wen.codex.people.includes('wen'));assert.equal(wen.npcFavor.wen,1);
let escorted=G.create({origin:'herbalist',elements:['wood']});escorted.location='market';escorted.story.luHeard=true;escorted.wit=3;escorted=run(escorted,'action:luMeet');escorted=run(escorted,'choice:escort',0.99);
assert.ok(escorted.manuals.includes(6),'earning a spirit manual should grant its scroll');assert.equal(escorted.manual,0);assert.ok(escorted.affinityPoints.earth>=3||escorted.affinityPoints.metal>=3);
escorted.story.luMonth=0;escorted.month=8;escorted.practice[6]=10;escorted.story.scriptureReads=7;escorted.wit=4;escorted.dao=3;escorted.root=4;escorted.silver=8;escorted.focus=100;escorted=run(escorted,'action:luReturn');
assert.equal(G.options(escorted).find(o=>o.id==='redeemSilver').disabled,false,'an escort with low social may redeem after actual practice');
let pledged=G.create({origin:'merchant'});pledged.location='market';pledged=run(pledged,'action:luMeet');pledged=run(pledged,'choice:pledge',0.99);pledged.month=8;pledged.practice[6]=10;pledged.story.scriptureReads=7;pledged.wit=4;pledged.root=4;pledged.social=2;pledged.silver=8;pledged=run(pledged,'action:luReturn');
assert.equal(G.options(pledged).find(o=>o.id==='redeemSilver').disabled,true,'pledged trade must retain its social requirement');
const {simulate}=require('./balance-matrix.cjs');
for(const [origin,route] of [['scholar','star'],['merchant','taiwei'],['herbalist','green']]){
 const runSpec={origin,talent:'meridian',route,policy:'quest',seed:17};
 const first=simulate(runSpec),second=simulate(runSpec);
 assert.deepEqual(first,second,'identical seeded action routes must replay exactly');
 assert.ok(first.firstManual!=null&&first.firstSpring!=null&&first.attemptMonth!=null,`${origin}/${route} must actually earn both rewards and reach an attempt`);
}

let preview=G.create();preview.story.yeRoute='help';preview.story.yeMonth=0;preview.month=3;preview.pending='yeFollowup';const previewMonth=preview.month,previewFavor=preview.npcFavor.ye;
assert.ok(G.options(preview).some(o=>o.id==='back'));preview=run(preview,'choice:back');assert.equal(preview.month,previewMonth);assert.equal(preview.npcFavor.ye,previewFavor);assert.equal(preview.story.yeFollowup,null);

let affinityRetreat=G.create();affinityRetreat.manuals.push(1);affinityRetreat.manual=1;affinityRetreat.practice[1]=11;affinityRetreat.affinityTraining[1]=17;affinityRetreat.grain=30;affinityRetreat.focus=100;affinityRetreat.events.nextMonth=999;affinityRetreat=run(affinityRetreat,'action:secludeYear',0.99);
const retreatLog=affinityRetreat.logs.filter(l=>l.tag==='闭关').at(-1);assert.ok(retreatLog?.effect.includes('木亲和'),retreatLog?.effect||'missing retreat affinity summary');

// A natural thirty-round draw is reachable with ordinary stats, without mutating combat values.
let drawSeed=3,drawRng=()=>((drawSeed=(Math.imul(drawSeed,1664525)+1013904223)>>>0)/4294967296);
let drawCheck=G.create({origin:'herbalist'});drawCheck.stage=3;drawCheck.location='mountain';drawCheck.pending='scene-mountainHerbs';drawCheck=G.step(drawCheck,'choice:engageApe',drawRng);
for(let n=0;n<30&&drawCheck.combat;n++)drawCheck=G.step(drawCheck,'combat:guard',drawRng);
assert.equal(drawCheck.sparRecord.last.result,'平局');

let recoveredRetreat=G.create();recoveredRetreat.manuals.push(1);recoveredRetreat.manual=1;recoveredRetreat.month=12;recoveredRetreat.ageMonths+=12;recoveredRetreat.grain=30;recoveredRetreat.focus=40;recoveredRetreat.events={seen:[],nextMonth:0};
recoveredRetreat=run(recoveredRetreat,'action:secludeYear',0);assert.ok(recoveredRetreat.pending?.startsWith('scene-'));assert.ok(recoveredRetreat.focus>40,'retreat event should surface after a recovery month');


// v2.43 regressions: 16-to-30 chapter window, mutually exclusive Taiwei acquisition, localized chronicle, simplified retreat UI.
let deadline=G.create();deadline.grain=500;deadline.events.nextMonth=999;
for(let i=0;i<168&&!deadline.ending;i++)deadline=run(deadline,'action:rest',1);
assert.equal(deadline.ending?.kind,'retired');assert.equal(Math.floor(deadline.ageMonths/12),30);

let taiweiFromMentor=G.create({origin:'merchant'});taiweiFromMentor.manuals.push(3);taiweiFromMentor.story.luHeard=true;taiweiFromMentor.story.luRoute='pledge';taiweiFromMentor.story.luMonth=0;taiweiFromMentor.month=10;taiweiFromMentor.location='market';
assert.equal(G.available(taiweiFromMentor).some(a=>a.id==='luReturn'),false);
let taiweiFromLu=G.create();taiweiFromLu.manuals.push(3);taiweiFromLu.story.trueTextReady=true;taiweiFromLu.pending='mentor';
assert.equal(G.options(taiweiFromLu).some(o=>o.id==='raretext'),false);

let chron=G.create();chron.story.afterManual={gu:{first:'publish',second:'annotate',month:1},ye:{first:'treat',second:'visit',month:1},lu:{first:'honor',second:'credit',month:1},cheng:{first:'teach',second:'guide',month:1}};chron.ending={kind:'retired'};
const chronText=G.lifeSummary(chron).join('\n');
for(const token of ['publish','annotate','treat','visit','honor','credit','teach','guide'])assert.equal(chronText.includes(token),false,`chronicle leaked ${token}`);
assert.equal(G.available(G.create()).some(a=>a.id==='seclusion'),false);

// P0 arena/location/menu regressions.
let p0=G.create();p0.location='arena';let arenaIds=G.available(p0).filter(a=>a.id.startsWith('spar-')).map(a=>a.id).sort();assert.deepEqual(arenaIds,['spar-keeper','spar-novice','spar-swift']);
assert.ok(!arenaIds.includes('spar-ape')&&!arenaIds.includes('spar-scrollBandit')&&!arenaIds.includes('spar-springRival'));
let learn=G.create();learn.location='arena';const learnMonth=learn.month;learn=run(learn,'action:learn-flow',.99);assert.equal(learn.month,learnMonth+1);assert.ok(learn.knownTechniques.includes('flow'));
let marketP0=G.create();marketP0.location='market';const marketIdsP0=G.available(marketP0).map(a=>a.id);for(const id of ['cultivate','secludeYear','manual','rest'])assert.ok(!marketIdsP0.includes(id),`market must hide ${id}`);
let first=G.create();first.location='arena';first.stage=3;first.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));first.manual=3;first.manuals.push(3);first.grain=20;first=run(first,'action:spar-novice',.99);first=run(first,'combat:auto-aggressive',.01);assert.equal(first.month,1);assert.equal(first.story.arenaFirstWins.novice,true);const insightAfter=first.insight;first=run(first,'action:spar-novice',.99);first=run(first,'combat:auto-aggressive',.01);assert.equal(first.month,2);assert.equal(first.insight,insightAfter,'first-win reward must not repeat');


// P0 onboarding/deadline/route-copy regressions.
for(const origin of Object.keys(G.ORIGINS))for(const talent of Object.keys(G.TALENTS)){const intro=G.openingStory(origin,talent);const originPhrase={scholar:'寒门书生之家',merchant:'行商之家',herbalist:'采药人家'}[origin];assert.ok(intro.includes(originPhrase));assert.ok(intro.includes(G.TALENTS[talent].name));assert.ok(intro.includes('十六岁'));assert.ok(intro.includes('三十岁'));assert.ok(!/\b(?:scholar|merchant|herbalist|clarity|meridian|vitality)\b/.test(intro));}
let unknownYe=G.create({origin:'herbalist'});unknownYe.location='mountain';assert.equal(G.available(unknownYe).some(x=>x.id==='yeText'),false,'herbalist origin must not know Ye before meeting her');unknownYe.story.yeRoute='help';assert.equal(G.available(unknownYe).some(x=>x.id==='yeText'),true,'Ye route should unlock asking about Qinghua');
let yeCopy=G.create();yeCopy.pending='yeFinish';yeCopy.practice[1]=4;yeCopy.practice[2]=2;yeCopy.practice[6]=7;const yeOpt=G.options(yeCopy).find(x=>x.id==='healVein');assert.ok(yeOpt.requirements.some(r=>r.text.includes('《青篆引脉帖》 4 / 10')));assert.ok(yeOpt.requirements.some(r=>r.text.includes('《澄元导脉经》 2 / 6')));assert.ok(!yeOpt.detail.includes('6／10'));

// P0 transparency / duplicate purchase / combat context regressions.
let marketManual=G.create({origin:'merchant'});marketManual.location='market';marketManual.silver=30;let buy=G.available(marketManual).find(x=>x.id==='buymanual');assert.equal(buy.disabled,false);marketManual=run(marketManual,'action:buymanual');const afterSilver=marketManual.silver;buy=G.available(marketManual).find(x=>x.id==='buymanual');assert.equal(buy.disabled,true);assert.ok(buy.requirements.some(r=>!r.met&&r.text.includes('已习得')));marketManual=run(marketManual,'action:buymanual');assert.equal(marketManual.silver,afterSilver);assert.equal(marketManual.manuals.filter(x=>x===1).length,1);
let cave=G.create();cave.stage=2;cave.pending='scene-mountainCave';cave.herbs=0;cave.wounds=0;cave.focus=10;const caveOpts=G.options(cave);assert.ok(caveOpts.find(x=>x.id==='healCave').disabledReasons.some(x=>x.includes('灵草')));assert.ok(caveOpts.find(x=>x.id==='seekCave').disabledReasons.some(x=>x.includes('心神')));
let starVerify=G.create();starVerify.pending='guFinish';starVerify.story.guFragments=true;const starOpt=G.options(starVerify).find(x=>x.id==='verify');assert.ok(starOpt.requirements.some(r=>r.text.includes('《青篆引脉帖》')));assert.ok(!starOpt.detail.includes('6／8'));
let lowFocus=G.create();lowFocus.location='arena';lowFocus.focus=20;lowFocus=run(lowFocus,'action:spar-novice');assert.ok(lowFocus.combat.history.some(x=>x.includes('开局仅能调动')));assert.equal(G.affinityRequirement(G.ITEMS.manual[1]),1);


// P0 safe-exit / blocked-choice explanation regressions.
let chengBlocked=G.create();chengBlocked.story.chengRoute='guard';chengBlocked.pending='chengReturn';chengBlocked.focus=68;chengBlocked.progress=G.cap(chengBlocked);const chengBlockedOpts=G.options(chengBlocked);const blockedMethod=chengBlockedOpts.find(x=>x.id==='askMethod');assert.equal(blockedMethod.disabled,true);assert.ok(blockedMethod.disabledReasons.some(x=>x.includes('功行已满')||x.includes('预留必要实修')));const safeChengExit=chengBlockedOpts.find(x=>x.id==='back');assert.ok(safeChengExit);assert.ok(safeChengExit.detail.includes('不改变关系'));
for(const route of ['guard','copyForPay']){let exit=G.create();exit.pending='chengReturn';exit.story.chengRoute=route;exit.month=42;exit.npcFavor.cheng=3;const before={month:exit.month,favor:exit.npcFavor.cheng,grain:exit.grain,silver:exit.silver,focus:exit.focus};exit=run(exit,'choice:back');assert.equal(exit.pending,null);assert.deepEqual({month:exit.month,favor:exit.npcFavor.cheng,grain:exit.grain,silver:exit.silver,focus:exit.focus},before);}
for(const location of ['temple','cliff','mountain','market','arena'])for(const resourceState of [{},{focus:0,grain:0,silver:0,herbs:0,wounds:5},{focus:8,grain:1,silver:2,herbs:1,wounds:0}]){let state=G.create();state.location=location;Object.assign(state,resourceState);if(state.focus===8)state.progress=G.cap(state);for(const action of G.available(state))if(action.disabled)assert.ok(action.disabledReasons?.length,`${location}/${action.id} is disabled without an explanation`);}
let lowFocusTrueText=G.create();lowFocusTrueText.pending='trueText';lowFocusTrueText.focus=10;const trueTextOpt=G.options(lowFocusTrueText).find(x=>x.id==='undertake');assert.equal(trueTextOpt.disabled,true);assert.ok(trueTextOpt.disabledReasons.some(x=>x.includes('心神')));
let lowFocusGu=G.create();lowFocusGu.pending='guFollowup';lowFocusGu.focus=10;const guCompare=G.options(lowFocusGu).find(x=>x.id==='compare');assert.equal(guCompare.disabled,true);assert.ok(guCompare.disabledReasons.some(x=>x.includes('心神')));

test('气机逆乱在元成入真四分之一处触发并阻断功行',()=>{
 const s=G.create({origin:'scholar',talent:'clarity'});s.stage=3;s.manual=3;s.manuals=[0,3];s.progress=G.NEED[3]*.25-1;s.focus=100;s.grain=20;
 let n=G.step(s,'action:cultivate',()=>0);assert.equal(n.story.ordeal?.triggered,true);const p=n.progress;
 n=G.step(n,'action:cultivate',()=>0);assert.equal(n.progress,p);assert.match(n.logs.at(-1).effect,/功行 \+0/);
});
test('迁移旧存档时补触发已越过阈值的气机逆乱',()=>{
 const s=G.create({});s.stage=3;s.progress=30;s.story.ordeal=null;
 const n=G.migrate(s);assert.equal(n.story.ordeal?.triggered,true);assert.equal(n.story.ordeal?.triggerMonth,n.month);
});
test('气机逆乱闭关只消耗一个月且不增长功行',()=>{
 const s=G.create({});s.stage=3;s.manual=3;s.manuals=[0,3];s.progress=30;s.focus=100;s.grain=20;s.story.ordeal={triggered:true,resolved:false,triggerMonth:1,visitorUntil:9};
 const n=G.step(s,'action:secludeYear',()=>0);assert.equal(n.month,s.month+1);assert.equal(n.progress,s.progress);assert.match(n.logs.at(-1).text,/并非单凭苦修/);
});
test('闭关途中越过碍难阈值即在首月中断',()=>{
 const s=G.create({});s.stage=3;s.manual=3;s.manuals=[0,3];s.progress=21;s.focus=100;s.grain=30;s.events.nextMonth=999;
 const n=G.step(s,'action:secludeYear',()=>.99);assert.equal(n.story.ordeal?.triggered,true);assert.equal(n.month,s.month+1);assert.ok(n.progress>=22);
});
test('事件功行跨过阈值时立即触发气机逆乱',()=>{
 const s=G.create({});s.stage=3;s.location='cliff';s.pending='scene-cliffPulse';s.progress=21;s.totalProgress=100;s.focus=100;s.grain=20;s.insight=5;
 const n=G.step(s,'choice:readPulse',()=>0);assert.equal(n.story.ordeal?.triggered,true);assert.ok(n.progress>=22);
});
test('气机逆乱人物调查不锁路线，正式受助后解除',()=>{
 const s=G.create({});s.stage=3;s.progress=30;s.focus=100;s.grain=20;s.dao=5;s.npcFavor.cheng=3;s.flags.mentor=true;s.story.ordeal={triggered:true,resolved:false,triggerMonth:1,visitorUntil:9};
 let n=G.step(s,'action:ordealHelp',()=>0);assert.equal(n.pending,'ordealHelp');assert.ok(G.options(n).some(o=>o.id==='ordealCheng'));n=G.step(n,'choice:back',()=>0);assert.equal(n.story.ordeal.resolved,false);
 n=G.step(n,'action:ordealHelp',()=>0);n=G.step(n,'choice:ordealCheng',()=>0);assert.equal(n.story.ordeal.resolved,true);assert.equal(n.story.ordeal.route,'cheng');
});
test('限时破碍修士只在期限内出现',()=>{
 const s=G.create({});s.stage=3;s.progress=30;s.location='arena';s.story.ordeal={triggered:true,resolved:false,triggerMonth:1,visitorUntil:8};s.month=8;
 assert.ok(G.available(s).some(x=>x.id==='ordealDuel'));s.month=9;assert.ok(!G.available(s).some(x=>x.id==='ordealDuel'));
});

test('心得不再是可积累资源，研读蚀文留下具体研读经历',()=>{
 let s=G.create({origin:'scholar',talent:'clarity'});s.location='cliff';s.grain=20;s.focus=100;
 assert.equal(s.insight,0);s=run(s,'action:study',0.99);assert.equal(s.insight,0);assert.equal(s.story.scriptureReads,1);
});
test('悟性不再提高参透后的长期功行速度',()=>{
 const low=G.create({origin:'herbalist'}),high=G.create({origin:'scholar'});low.wit=2;high.wit=7;low.manual=0;high.manual=0;
 assert.equal(G.cultivationGain(low),G.cultivationGain(high));
});
test('新取得功法必须先参悟，悟性越高所需月份越少',()=>{
 let low=G.create({origin:'herbalist'}),high=G.create({origin:'scholar',talent:'clarity'});
 low.manuals.push(2);high.manuals.push(2);low.decodedManuals=[0];high.decodedManuals=[0];low.decodeWork=Array(7).fill(0);high.decodeWork=Array(7).fill(0);
 assert.ok(G.decodeNeed(low,2)>G.decodeNeed(high,2));
 low.pending='manual';assert.ok(G.options(low).some(o=>o.id==='decode-2'));assert.ok(!G.options(low).some(o=>o.id==='equip-2'));
});
test('凡灵仙法卷均可按悟性参透，旧存档已得法卷保留可修',()=>{
 for(const wit of [2,3,5,7])for(const id of [1,2,4]){
  let state=G.create({origin:'herbalist'});state.wit=Number(wit);state.manuals.push(id);state.grain=100;state.focus=100;state.events.nextMonth=999;
  const initialNeed=G.decodeNeed(state,id);
  let elapsed=0;
  while(!G.manualDecoded(state,id)&&elapsed<12){state=run(state,'action:manual',.99);state=run(state,`choice:decode-${id}`,.99);elapsed++;if(state.pending?.startsWith('scene-'))state=run(state,'choice:ignore',.99);if(state.focus<20)state=run(state,'action:rest',.99);}
  assert.ok(elapsed<=initialNeed,`悟性 ${wit} / 法卷 ${id} should参透 within its initial requirement`);
  assert.ok(G.manualDecoded(state,id));
 }
 let old=G.create();old.version=8;old.manuals.push(2,4);delete old.decodedManuals;delete old.decodeWork;old.insight=7;
 old=G.migrate(old);assert.equal(old.insight,0);assert.ok(G.manualDecoded(old,2)&&G.manualDecoded(old,4));
});


test('五项属性成长 2.0 使用统一隐藏历练阈值且高属性更难成长',()=>{
 assert.ok(G.aptitudeNeed('root',5)>G.aptitudeNeed('root',2));
 assert.ok(G.aptitudeNeed('wit',6)>G.aptitudeNeed('wit',3));
 const s=G.create({origin:'scholar'});assert.deepEqual(s.aptitudeXp,{root:0,wit:0,body:0,dao:0,social:0});
 assert.equal(G.available(s).some(o=>o.id==='bodyTonic'),false,'the removed direct-body training button must not return');
});

test('免费菜单、返回与坊市买卖不会增加五项隐藏历练',()=>{
 let s=G.create({origin:'scholar'});s.grain=30;s.silver=30;s.herbs=3;s.location='temple';
 s=G.step(s,'action:manual');s=G.step(s,'choice:back');
 s.location='market';s=G.step(s,'action:sellall');s=G.step(s,'action:buymax');
 assert.deepEqual(s.aptitudeXp,{root:0,wit:0,body:0,dao:0,social:0});
});

test('v9 存档迁移到 v10 时保留旧悟性历练并初始化其余历练',()=>{
 const old=G.create({origin:'scholar'});old.version=9;delete old.aptitudeXp;old.studyWork=5;
 const migrated=G.migrate(old);
 assert.equal(migrated.version,10);
 assert.deepEqual(migrated.aptitudeXp,{root:0,wit:5,body:0,dao:0,social:0});
 assert.equal(migrated.studyWork,5);
});

test('闭关的逐月观察只供矩阵采样，不改变 seeded 结算',()=>{
 const start=G.create({origin:'scholar'});start.grain=100;start.focus=100;start.events.nextMonth=999;
 const makeRng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const baseline=G.step(start,'action:secludeYear',makeRng(211));
 const observedRandom=makeRng(211),months=[];observedRandom.onMonth=s=>months.push(s.month);
 const observed=G.step(start,'action:secludeYear',observedRandom);
 assert.deepEqual(observed,baseline);
 assert.ok(months.length>0);
 assert.deepEqual(months,Array.from({length:months.length},(_,i)=>i+1));
});

test('研读与采药分别塑造悟性和体魄历练，不再依赖功法固定次数直加属性',()=>{
 let study=G.create({origin:'herbalist'});study.location='cliff';study.grain=50;study.focus=100;study.events.nextMonth=999;
 const wit=study.wit;for(let i=0;i<4;i++){study=run(study,'action:study',.99);if(study.pending==='scroll')study=run(study,'choice:hide',.99);if(study.focus<20)study=run(study,'action:rest',.99);}
 assert.ok(study.wit>wit,'连续真实研读应积累到一次悟性成长');
 let gather=G.create({origin:'scholar'});gather.location='mountain';gather.grain=50;gather.focus=100;gather.events.nextMonth=999;gather.flags.herbalist=true;
 const body=gather.body;for(let i=0;i<10;i++){gather=run(gather,'action:gather',.99);if(gather.pending==='herbalist')gather=run(gather,'choice:leave',.99);if(gather.pending?.startsWith('scene-'))gather=run(gather,'choice:ignore',.99);if(gather.focus<20)gather=run(gather,'action:rest',.99);}
 assert.ok(gather.body>body,'长期行山采药应塑造体魄');
});

test('功法实修不再按旧功法专属周期直接赠送五项属性',()=>{
 let s=G.create({origin:'scholar'});s.manuals=[0,1];s.decodedManuals=[0,1];s.manual=1;s.grain=100;s.focus=100;s.events.nextMonth=999;
 const start={wit:s.wit,body:s.body,dao:s.dao,social:s.social};
 for(let i=0;i<16;i++){s=run(s,'action:cultivate',.99);if(s.pending==='stage')s=run(s,'choice:defer',.99);if(s.focus<20)s=run(s,'action:rest',.99);}
 assert.equal(s.wit,start.wit);assert.equal(s.body,start.body);assert.equal(s.dao,start.dao);assert.equal(s.social,start.social);
 assert.ok(s.root>=3,'修行本身通过统一承载历练塑造根骨');
});

test('三次稳固筑元的道心历练达到程上师路线门槛',()=>{
 let s=G.create({origin:'scholar'});s.grain=100;s.focus=100;s.events.nextMonth=999;
 for(let i=0;i<3;i++){s.progress=G.cap(s);s=run(s,'action:stage',0);assert.equal(s.pending,'stage');s=run(s,'choice:patient',0);}
 assert.equal(s.dao,4);assert.equal(s.aptitudeXp.dao,1);
});


test('人物事件的直接属性奖励迁入统一历练通道',()=>{
 let s=G.create({origin:'scholar'});s.pending='chengFollowup';s.focus=100;s.grain=30;const dao=s.dao;
 s=run(s,'choice:guard',.99);assert.equal(s.dao,dao,'一次守阁不应直接道心 +1');assert.ok(s.aptitudeXp.dao>=4,'守阁应留下道心历练');
 let t=G.create({origin:'scholar'});t.pending='after-cheng-1';t.focus=100;t.grain=30;const dao2=t.dao;
 t=run(t,'choice:teach',.99);assert.equal(t.dao,dao2,'教习事件不应直接改道心');assert.ok(t.aptitudeXp.dao>=4,'教习应积累道心历练');
});

test('地点事件按实际解决方式塑造不同属性而不是固定直加',()=>{
 let s=G.create({origin:'merchant'});s.pending='scene-marketGrain';s.focus=100;s.grain=30;s.events.nextMonth=999;
 const social=s.social;s=run(s,'choice:bargain',.99);assert.equal(s.social,social);assert.ok(s.aptitudeXp.social>=2);
 let t=G.create({origin:'herbalist'});t.pending='scene-mountainMist';t.focus=100;t.grain=30;t.events.nextMonth=999;
 const body=t.body;t=run(t,'choice:shortcut',.99);assert.equal(t.body,body);assert.ok(t.aptitudeXp.body>=2);
});


test('元基打磨以月份换确定上品且道心越高越快',()=>{
 assert.equal(G.polishNeed({dao:3}),4);assert.equal(G.polishNeed({dao:4}),3);assert.equal(G.polishNeed({dao:5}),2);assert.equal(G.polishNeed({dao:6}),1);
 let s=G.create({origin:'scholar'});s.pending='stage';s.progress=G.cap(s);s.totalProgress=500;s.month=10;s.ageMonths+=10;s.grain=30;s.focus=100;s.events.nextMonth=999;
 const startMonth=s.month;
 while(!G.polishReady(s)){assert.ok(G.options(s).some(x=>x.id==='polish'&&!x.disabled));s=run(s,'choice:polish',.99);}
 assert.equal(s.month-startMonth,s.foundationPolish);assert.ok(s.foundationPolish<=4);
 const oldStage=s.stage;s=run(s,'choice:perfect',.99);assert.equal(s.stage,oldStage+1);assert.equal(s.foundationGrades.at(-1),3);assert.equal(s.foundationPolish,0);assert.equal(s.foundationStrain,0);
});

test('跨年打磨保留筑元关口直到完成圆满筑元',()=>{
 let s=G.create({origin:'scholar'});s.pending='stage';s.progress=G.cap(s);s.totalProgress=500;s.month=10;s.ageMonths+=10;s.grain=30;s.focus=100;s.events.nextMonth=999;
 s=run(s,'choice:polish',.99);assert.equal(s.month,11);assert.equal(s.pending,'stage');assert.equal(s.foundationPolish,1);
});

test('任何真实元基掉档都会永久失去上上品资格',()=>{
 const s=G.create({origin:'scholar'});s.foundationGrades=[3,2,3];assert.equal(G.flawlessFoundation(s),false);
 s.foundationGrades=[3,3,3];assert.equal(G.flawlessFoundation(s),true);
});

test('径行或急进冲关会清空本关未完成的打磨',()=>{
 let s=G.create({origin:'scholar'});s.pending='stage';s.progress=G.cap(s);s.grain=30;s.focus=100;s.foundationPolish=1;s.events.nextMonth=999;
 s=run(s,'choice:hasty',0);assert.equal(s.foundationPolish,0);
});


test('华池契合同时考虑人物亲和与当前功法',()=>{
 const s=G.create({origin:'scholar',elements:['water'],polarity:'yin'});
 s.manual=2;s.affinityPoints.water=5;s.affinityPoints.yin=5;
 const water=G.springHarmony(s,2),metal=G.springHarmony(s,3);
 assert.ok(water.score>metal.score);assert.ok(['上佳','相合'].includes(water.level));assert.ok(water.reasons.some(x=>x.includes('当前功法')));
});

test('华池契合影响开脉但品级仍保留独立强度',()=>{
 const s=G.create({origin:'scholar',elements:['water'],polarity:'yin'});s.manual=2;s.affinityPoints.water=5;s.affinityPoints.yin=5;
 const good=G.springHarmony(s,2),bad=G.springHarmony(s,5);
 assert.ok(good.chance>bad.chance);assert.ok(good.quality>bad.quality);
});

test('相冲仙品华池不能仅凭稀有度取得上上资格',()=>{
 const s=G.create({origin:'scholar',elements:['water'],polarity:'yin'});s.manual=4;s.spring=5;s.foundation=3;s.foundationGrades=[3,3,3];s.wit=8;s.root=8;s.wounds=0;s.affinityPoints.water=6;s.affinityPoints.yin=6;
 assert.ok(G.springHarmony(s).score<2);
 for(const roll of [0,.001,.02,.5,.99])assert.notEqual(G.grade(s,roll,'steady'),'上上品');
});
