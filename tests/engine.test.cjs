const assert=require('node:assert/strict');
const G=require('../dist/engine.js');
const run=(s,command,roll=0)=>G.step(s,command,()=>roll);
let s=G.create({name:'闻山',origin:'scholar',talent:'clarity'});s.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));
assert.equal(s.version,8);
assert.equal(s.manual,0);
assert.deepEqual(s.manuals,[0]);
assert.equal(G.ITEMS.manual[0].name,'《养息吐纳诀》');
assert.ok(G.ITEMS.manual.every(item=>item.stageMin===0&&item.stageMax===3));
assert.equal(G.cap(s),50);
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
const grown=G.create();grown.location='cliff';grown.grain=40;grown.focus=100;
assert.equal(G.available(grown).some(a=>a.id.startsWith('attune-')),false);
assert.deepEqual(run(grown,'action:attune-water'),grown);
let nurtured=grown;for(let i=0;i<12;i++){if(nurtured.focus<18)nurtured=run(nurtured,'action:rest');nurtured=run(nurtured,'action:cultivate');}
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
assert.equal(G.options(blocked).find(o=>o.id==='equip-2').disabled,true);
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
// Every 12 actual practice sessions raise all of the manual's tagged affinities together.
function cultivateTwelve(method){let disciple=G.create();disciple.manual=method;disciple.manuals.push(method);disciple.grain=100;
 for(let i=0;i<12;i++){if(disciple.focus<18)disciple=run(disciple,'action:rest',1);disciple=run(disciple,'action:cultivate',1);}
 return disciple;
}
const universal=cultivateTwelve(0);for(const key of G.AFFINITY_KEYS)assert.equal(universal.affinityPoints[key],2,`basic ${key}`);
const dual=cultivateTwelve(5);for(const key of ['wood','fire','yang'])assert.equal(dual.affinityPoints[key],2,`dual ${key}`);
assert.equal(dual.affinityPoints.water,1);assert.equal(dual.affinityPoints.yin,1);
const balanced=cultivateTwelve(6);for(const key of ['earth','metal','yin','yang'])assert.equal(balanced.affinityPoints[key],2,`balanced ${key}`);
// The practice grounds reuse character stats while isolating story, resources and lasting injuries.
let arena=G.create({name:'演武试客',elements:['water','wood'],polarity:'yang'});arena.affinityPoints.yin=3;arena.affinityPoints.earth=3;arena=run(arena,'travel:arena');
assert.equal(G.LOCATIONS.arena.name,'苍梧演武坪');
assert.equal(arena.story.arenaLessonSeen,true);assert.ok(arena.logs.at(-1).text.includes('传功弟子'));const arenaMonth=arena.month;arena=run(arena,'travel:temple');arena=run(arena,'travel:arena');assert.equal(arena.month,arenaMonth);assert.equal(arena.logs.filter(entry=>entry.text.includes('传功弟子')).length,1);
assert.ok(G.available(arena).length>=9);
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
assert.equal(arena.month,0);assert.equal(arena.wounds,0);assert.equal(arena.grain,G.create().grain);
assert.equal(arena.progress,0);
assert.deepEqual(arena.logs,mainLogs);
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
assert.equal(practiceLoss.ageMonths,G.create().ageMonths);
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
 while(character.month<36)character=run(character,'action:rest',1);
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
const realmEventIds={1:['templeMeridian','cliffPulse','mountainVein','marketScript'],2:['templeSeal','cliffFormation','mountainCave','marketPact'],3:['templeBreath','cliffVision','mountainSpring','marketExchange']};
for(const [realm,ids] of Object.entries(realmEventIds)){
 for(const [index,location] of ['temple','cliff','mountain','market'].entries()){
  let realmState=G.create();realmState.stage=Number(realm);realmState.location=location;realmState.month=25;realmState.grain=30;realmState.flags.scroll=true;realmState.flags.herbalist=true;
  realmState=run(realmState,location==='market'?'action:marketWalk':'action:rest',0);
  assert.equal(realmState.pending,`scene-${ids[index]}`);
 }
}
let pulse=G.create();pulse.stage=1;pulse.location='cliff';pulse.month=25;pulse.grain=30;pulse.totalProgress=90;pulse.flags.scroll=true;
pulse=run(pulse,'action:rest',0);const initialPulse=pulse.totalProgress;
pulse=run(pulse,'choice:readPulse');assert.equal(pulse.totalProgress,initialPulse+8);
let training=G.create();training.stage=1;training.manual=2;training.manuals.push(2);training.practice[2]=13;training.root=3;training.dao=3;training.location='cliff';training.month=25;training.grain=30;training.flags.scroll=true;training.progress=G.cap(training)-6;
training=run(training,'action:rest',0);
const reserved=G.options(training).find(x=>x.id==='readPulse');
assert.ok(reserved.detail.includes('本层功行 +2.64'));
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
let retreat=G.create({name:'闭关人'});retreat.manual=1;retreat.manuals.push(1);retreat.grain=30;
let manual=structuredClone(retreat);
retreat=run(retreat,'action:seclusion');
assert.equal(retreat.pending,'seclusion');
retreat=run(retreat,'choice:six');
for(let i=0;i<6;i++)manual=run(manual,manual.focus<18?'action:rest':'action:cultivate');
for(const key of ['month','progress','totalProgress','grain','focus','root','wit','wounds'])assert.equal(retreat[key],manual[key],key);
const directStart=G.create({origin:'herbalist'});directStart.location='mountain';directStart.grain=1;
const direct=run(directStart,'action:secludeYear');
assert.equal(direct.pending,'herbalist');
assert.equal(direct.month,1);
assert.equal(retreat.batchActive,undefined);
assert.ok(retreat.logs.at(-1).text.includes('闭关6个月'));
assert.ok(retreat.logs.some(e=>e.batch));
let annual=G.create();annual.manual=3;annual.manuals.push(3);annual.grain=20;
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
assert.equal(purchase.manual,1);assert.equal(purchase.month,0);
let tonic=G.create();tonic.location='market';tonic.silver=16;const beforeTonic=tonic.lifeLimitMonths;
tonic=run(tonic,'action:buyelixir');assert.equal(tonic.lifeLimitMonths,beforeTonic+24);assert.equal(tonic.month,0);
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
interrupted=run(interrupted,'action:seclusion');interrupted=run(interrupted,'choice:twelve');
assert.equal(interrupted.month,1);
assert.equal(interrupted.pending,'herbalist');
assert.ok(interrupted.logs.at(-1).text.includes('闭关1个月'));
let danger=G.create();danger.lifeLimitMonths=danger.ageMonths+12;
assert.ok(G.available(danger).find(x=>x.id==='seclusion').disabled);
assert.ok(G.available({...danger,location:'mountain'}).find(x=>x.id==='gatherSeason').disabled);
danger=run(danger,'action:seclusion');
assert.equal(danger.month,0);
assert.equal(danger.pending,null);
let threshold=G.create();threshold.manual=1;threshold.manuals.push(1);threshold.progress=G.cap(threshold)-1;
threshold=run(threshold,'action:seclusion');threshold=run(threshold,'choice:twelve');
assert.equal(threshold.month,1);
assert.equal(threshold.pending,'stage');
threshold=run(threshold,'choice:defer');
assert.ok(G.available(threshold).some(a=>a.id==='stage'));
threshold=run(threshold,'action:stage');
assert.equal(threshold.pending,'stage');
// Research grows wisdom at a slowing rate and raises cultivation yield.
assert.deepEqual([2,3,4,5,6,7].map(G.studyNeed),[2,3,6,11,18,27]);
let scholarOfScriptures=G.create({origin:'herbalist'});
scholarOfScriptures.location='cliff';scholarOfScriptures.grain=200;
const readTimes=n=>{for(let i=0;i<n;i++){
 if(scholarOfScriptures.focus<12)scholarOfScriptures=run(scholarOfScriptures,'action:rest');
 scholarOfScriptures=run(scholarOfScriptures,'action:study');
 if(scholarOfScriptures.pending==='scroll')scholarOfScriptures=run(scholarOfScriptures,'choice:hide');
}};
const beforeStudy=G.cultivationGain(scholarOfScriptures);
readTimes(2);assert.equal(scholarOfScriptures.wit,3);
assert.equal(scholarOfScriptures.studyWork,0);
assert.ok(G.cultivationGain(scholarOfScriptures)>beforeStudy);
readTimes(3);assert.equal(scholarOfScriptures.wit,4);
readTimes(5);assert.equal(scholarOfScriptures.wit,4);
assert.equal(scholarOfScriptures.studyWork,5);
readTimes(1);assert.equal(scholarOfScriptures.wit,5);
readTimes(10);assert.equal(scholarOfScriptures.wit,5);
readTimes(1);assert.equal(scholarOfScriptures.wit,6);
readTimes(18+27);assert.equal(scholarOfScriptures.wit,8);
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
assert.equal(slow.ending?.kind,'death');
assert.equal(slow.stage,0);
assert.ok(slow.progress<G.cap(slow));
// Follow the NPC route and earn the manuals, satisfying attributes through practice.
s=run(s,'travel:cliff');s=run(s,'action:study');s=run(s,'choice:share');
assert.deepEqual(s.npcFavor,{gu:2,ye:0,cheng:1,lu:0});
s=run(s,'travel:mountain');s=run(s,'action:gather');
const encounter=structuredClone(s);
const paid=run(encounter,'choice:trade');
assert.equal(paid.silver,encounter.silver+8);
assert.deepEqual(paid.npcFavor,{gu:2,ye:-1,cheng:1,lu:0});
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
assert.equal(s.manual,1);
assert.equal(G.cap(s),70);
assert.ok(s.lifeLimitMonths===limit);
const availableBefore=s.progress;
s=run(s,'action:manual');s=run(s,'choice:equip-0');
assert.equal(G.cap(s),50);
assert.equal(s.progress,availableBefore);
s=run(s,'action:manual');s=run(s,'choice:equip-1');
function practiceUntil(predicate){for(let i=0;i<650&&!predicate()&&!s.ending;i++){
 if(s.pending==='herbalist')s=run(s,'choice:help');
 else if(s.pending==='stage')s=run(s,'choice:defer');
 else if(s.pending?.startsWith('scene-'))s=run(s,'choice:ignore');
 else if(s.focus<30)s=run(s,'action:rest');
 else if(s.grain<4){s=run(s,'travel:mountain');s=run(s,'action:gather');}
 else s=run(s,'action:cultivate');
}assert.equal(predicate(),true,'practice milestone should be reachable');}
practiceUntil(()=>s.root>=3);
assert.ok(s.practice[1]>=16);
s=run(s,'travel:temple');s=run(s,'action:mentor');
assert.ok(G.options(s).find(x=>x.id==='guidance').disabled===false);
assert.equal(G.options(s).some(x=>x.id==='raretext'),false);
s=run(s,'choice:guidance');
assert.equal(s.manual,2);
assert.equal(G.cap(s),90);
practiceUntil(()=>s.root>=4&&s.dao>=4);
assert.ok(s.practice[2]>=14);
s=run(s,'travel:temple');s=run(s,'action:mentor');s=run(s,'choice:serve');
assert.equal(s.npcFavor.cheng,3);
practiceUntil(()=>s.herbs>=2);
if(s.focus<20)s=run(s,'action:rest');
if(s.pending?.startsWith('scene-'))s=run(s,'choice:ignore');
s=run(s,'travel:temple');s=run(s,'action:mentor');
assert.equal(s.pending,'trueText');
assert.equal(G.options(s).some(x=>x.id==='raretext'),false);
s=run(s,'choice:undertake');
assert.equal(s.story.trueTextReady,true);
s=run(s,'action:mentor');
assert.equal(G.options(s).find(x=>x.id==='raretext').disabled,false);
s=run(s,'choice:raretext');
assert.equal(s.manual,3);
assert.equal(G.cap(s),110);
assert.ok(s.month<180,'high manual should be obtainable before the first breakthrough');
// The manual active at each breakthrough is recorded and changes foundation grade.
practiceUntil(()=>s.progress>=G.cap(s));
assert.equal(s.pending,'stage');
const early=structuredClone(s);
assert.ok(G.stageChance(early)>G.stageChance({...early,manual:0}));
s=run(s,'choice:patient');
assert.equal(s.stage,1);
assert.equal(s.foundationGrades.length,1);
assert.equal(s.foundationGrades[0],3);
assert.equal(s.progress,0);
assert.ok(s.totalProgress>=110);
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
assert.deepEqual(converted.npcFavor,{gu:2,ye:0,cheng:1,lu:0});
assert.equal('trust' in converted,false);
const prev=G.create({name:'上代修士'});prev.version=4;delete prev.studyWork;prev.wit=6;prev.progress=12.5;
const continued=G.migrate(prev);
assert.equal(continued.version,7);
assert.equal(continued.wit,6);
assert.equal(continued.progress,12.5);
assert.equal(continued.studyWork,0);
// Each origin can reach a different immortal method, and the new pools have separate entry costs.
let star=G.create({origin:'scholar'});star.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));star.flags.scroll=true;star.npcFavor.gu=2;star.insight=8;star.root=4;star.wit=5;star.practice[1]=8;star.grain=30;star.location='cliff';
star=run(star,'action:guText');star=run(star,'choice:collaborate');
star=run(star,'travel:market');star.silver=6;star=run(star,'action:buyFragments');
for(let i=0;i<3;i++)star=run(star,'action:rest',1);
star=run(star,'travel:cliff');star=run(star,'action:guFinish');star=run(star,'choice:verify');
assert.equal(star.manualId,'star-script');assert.ok(star.manuals.includes(4));assert.equal(G.cap(star),125);
let green=G.create({origin:'herbalist'});green.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));green.location='mountain';green.flags.herbalist=true;green.insight=5;green.wit=3;green.grain=30;green.manuals.push(1);green.manual=1;
for(let i=0;i<10;i++){if(green.focus<18)green=run(green,'action:rest',1);green=run(green,'action:cultivate',1);}
green=run(green,'action:yeText');green=run(green,'choice:tend');
green=run(green,'action:gather',1);green=run(green,'action:gather',1);
green=run(green,'action:rest',1);
green=run(green,'action:yeFinish');green=run(green,'choice:healVein');
assert.equal(green.manualId,'green-vein');assert.equal(green.story.yeHerbWork,2);
let trader=G.create({origin:'merchant'});trader.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));trader.location='market';trader.grain=40;
trader=run(trader,'action:luMeet');trader=run(trader,'choice:pledge');assert.equal(trader.manualId,'caravan-script');
trader.practice[6]=10;trader.insight=7;trader.root=4;trader.wit=4;trader.dao=4;trader.month+=5;trader.silver=9;
trader=run(trader,'action:luReturn');trader=run(trader,'choice:redeemSilver');
assert.equal(trader.manualId,'taiwei');assert.equal(trader.story.luCredential,true);
let contracted=G.create({origin:'merchant'});contracted.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,6]));contracted.location='market';contracted.grain=30;
contracted=run(contracted,'action:luMeet');contracted=run(contracted,'choice:pledge');
contracted.month=contracted.story.luMonth+18;contracted.practice[6]=18;contracted.insight=7;contracted.wit=4;contracted.silver=8;
contracted=run(contracted,'action:luReturn');assert.equal(G.options(contracted).find(o=>o.id==='redeemSilver').disabled,false);
contracted=run(contracted,'choice:redeemSilver');assert.equal(contracted.manualId,'taiwei');assert.equal(contracted.root,3);
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
 assert.equal(G.grade(sample,0,'steady'),'上上品',`${method}/${pool} should have a viable top-grade path`);
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
overdue=run(overdue,'action:rest',1);assert.equal(overdue.social,priorSocial-1);assert.equal(overdue.story.luDefaulted,true);
overdue=run(overdue,'action:rest',1);assert.equal(overdue.social,priorSocial-1);
// Immortal-method routes now attune their own core affinity instead of sending the player back to grind basic breathing for years.
let starAttune=G.create({origin:'scholar'});starAttune.affinityPoints.fire=1;starAttune.flags.scroll=true;starAttune.npcFavor.gu=2;starAttune.insight=8;starAttune.root=4;starAttune.wit=5;starAttune.practice[1]=8;starAttune.grain=30;starAttune.location='cliff';starAttune.story.guText='collaborate';starAttune.story.guFragments=true;starAttune.story.guTextMonth=0;starAttune.month=3;starAttune.focus=100;starAttune=run(starAttune,'action:guFinish');starAttune=run(starAttune,'choice:verify');assert.equal(starAttune.affinityPoints.fire,4);assert.equal(starAttune.manualId,'star-script');
let taiweiAttune=G.create({origin:'merchant'});taiweiAttune.affinityPoints.metal=1;taiweiAttune.location='market';taiweiAttune.grain=30;taiweiAttune.story.luRoute='pledge';taiweiAttune.story.luMonth=0;taiweiAttune.manuals.push(6);taiweiAttune.manual=6;taiweiAttune.practice[6]=10;taiweiAttune.insight=7;taiweiAttune.root=4;taiweiAttune.wit=4;taiweiAttune.dao=4;taiweiAttune.social=5;taiweiAttune.silver=8;taiweiAttune.month=5;taiweiAttune=run(taiweiAttune,'action:luReturn');taiweiAttune=run(taiweiAttune,'choice:redeemSilver');assert.equal(taiweiAttune.affinityPoints.metal,4);assert.equal(taiweiAttune.manualId,'taiwei');
let greenAttune=G.create({origin:'herbalist'});greenAttune.affinityPoints.wood=1;greenAttune.affinityPoints.fire=1;greenAttune.location='mountain';greenAttune.grain=30;greenAttune.story.yeText='tend';greenAttune.story.yeTextMonth=0;greenAttune.story.yeHerbWork=2;greenAttune.month=2;greenAttune.insight=5;greenAttune.root=4;greenAttune.wit=3;greenAttune.body=4;greenAttune.herbs=2;greenAttune.focus=100;greenAttune.practice[1]=10;greenAttune=run(greenAttune,'action:yeFinish');greenAttune=run(greenAttune,'choice:healVein');assert.ok(greenAttune.affinityPoints.wood>=4||greenAttune.affinityPoints.fire>=4);assert.equal(greenAttune.manualId,'green-vein');
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
codex=run(codex,'action:spar-ape');assert.ok(codex.codex.beasts.includes('ape'));assert.ok(G.combatOptions(codex).some(a=>a.id==='flow'));
let codexFight=G.create();codexFight.location='arena';codexFight=run(codexFight,'action:spar-keeper');assert.ok(codexFight.codex.combatants.includes('keeper'));assert.equal(codexFight.codex.combatantNotes.keeper.kind,'human');assert.deepEqual(codexFight.codex.combatantNotes.keeper.seenGear.sort(),['armor','weapon']);assert.deepEqual(codexFight.codex.combatantNotes.keeper.seenArts,[]);codexFight.combat.intent='earthWard';codexFight=run(codexFight,'combat:guard',0);assert.ok(codexFight.codex.combatantNotes.keeper.seenArts.includes('earthWard'));
let oldBeastCodex=G.create();oldBeastCodex.codex.beasts=['ape'];oldBeastCodex=G.migrate(oldBeastCodex);assert.ok(oldBeastCodex.codex.combatants.includes('ape'));assert.ok(oldBeastCodex.codex.combatantNotes.ape.seenArts.includes('vinePounce'));
let apeScene=G.create();apeScene.location='mountain';apeScene.pending='scene-mountainHerbs';assert.ok(G.options(apeScene).some(option=>option.id==='engageApe'));assert.ok(G.options(apeScene).some(option=>option.id==='bypassApe'));
let apeBypass=run(structuredClone(apeScene),'choice:bypassApe');assert.equal(apeBypass.story.apeEncounter,'bypassed');assert.equal(apeBypass.combat,null);assert.equal(apeBypass.grain,apeScene.grain+1);
let apeFight=run(structuredClone(apeScene),'choice:engageApe');assert.equal(apeFight.combat.storyEncounter,'mountainApe');apeFight.combat.enemy.currentQi=1;apeFight=run(apeFight,'combat:strike',0);assert.equal(apeFight.story.apeEncounter,'won');assert.equal(apeFight.herbs,apeScene.herbs+2);assert.equal(apeFight.sparRecord.wins,0);assert.ok(apeFight.codex.combatantNotes.ape.observations.length);
let apeLoss=run(structuredClone(apeScene),'choice:engageApe');apeLoss.combat.player.currentQi=1;apeLoss.combat.enemy.attack=300;apeLoss.combat.intent='strike';apeLoss=run(apeLoss,'combat:guard',0);assert.equal(apeLoss.story.apeEncounter,'lost');assert.equal(apeLoss.wounds,1);assert.equal(apeLoss.sparRecord.losses,0);
let apeRetreat=run(structuredClone(apeScene),'choice:engageApe');apeRetreat=run(apeRetreat,'combat:withdraw');assert.equal(apeRetreat.story.apeEncounter,'retreated');assert.equal(apeRetreat.wounds,0);assert.equal(apeRetreat.herbs,apeScene.herbs);
const prior=structuredClone(codex);codex=run(codex,'combat:auto-aggressive',0);
assert.equal(codex.combat,null);assert.equal(codex.sparRecord.last.style,'aggressive');assert.ok(codex.sparRecord.last.rounds<=30);
for(const field of ['month','ageMonths','lifeLimitMonths','grain','herbs','silver','progress','wounds'])assert.equal(codex[field],prior[field],field);
let cautious=run(prior,'combat:auto-steady',0);assert.equal(cautious.combat,null);assert.equal(cautious.sparRecord.last.style,'steady');
cautious=run(cautious,'travel:temple');assert.equal(cautious.trainingGear.shoes,false);assert.ok(cautious.codex.gear.includes('shoes'));
function winRate(stage,foe){let wins=0;for(let seed=1;seed<=50;seed++){let value=seed,rng=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);let subject=G.create();subject.stage=stage;subject.location='arena';subject=G.step(subject,`action:spar-${foe}`,rng);subject=G.step(subject,'combat:auto-aggressive',rng);wins+=subject.sparRecord.last.result==='胜出';}return wins;}
assert.equal(winRate(0,'keeper'),0);assert.equal(winRate(0,'swift'),0);
// Representative story-combat playtests: 100 deterministic seeds per build/stage.
function storyWinRate(origin,stage,foe,samples=100){let wins=0;for(let seed=1;seed<=samples;seed++){let value=seed,rng=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);let subject=G.create({origin});subject.stage=stage;subject.location='arena';subject=G.step(subject,`action:spar-${foe}`,rng);subject=G.step(subject,'combat:auto-aggressive',rng);wins+=subject.sparRecord.last.result==='胜出';}return wins/samples;}
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
 let duelist=G.create({origin:'herbalist'});duelist.stage=3;duelist.location='arena';duelist=run(duelist,`action:spar-${id}`);
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
let attuneStar=G.create({origin:'scholar'});attuneStar.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,0]));attuneStar.flags.scroll=true;attuneStar.npcFavor.gu=2;attuneStar.insight=8;attuneStar.root=4;attuneStar.wit=5;attuneStar.practice[1]=8;attuneStar.grain=30;attuneStar.location='cliff';attuneStar.story.guText='collaborate';attuneStar.story.guFragments=true;attuneStar.story.guTextMonth=0;attuneStar.month=3;attuneStar.focus=100;
attuneStar=run(attuneStar,'action:guFinish');attuneStar=run(attuneStar,'choice:verify');
assert.equal(attuneStar.manualId,'star-script');assert.ok(attuneStar.affinityPoints.fire>=4);assert.equal(attuneStar.manual,4);
let attuneGreen=G.create({origin:'herbalist'});attuneGreen.affinityPoints=Object.fromEntries(G.AFFINITY_KEYS.map(k=>[k,0]));attuneGreen.location='mountain';attuneGreen.flags.herbalist=true;attuneGreen.story.yeText='tend';attuneGreen.story.yeTextMonth=0;attuneGreen.story.yeHerbWork=2;attuneGreen.month=2;attuneGreen.insight=5;attuneGreen.root=4;attuneGreen.wit=3;attuneGreen.body=4;attuneGreen.practice[1]=10;attuneGreen.herbs=4;attuneGreen.grain=20;attuneGreen.focus=100;
attuneGreen=run(attuneGreen,'action:yeFinish');attuneGreen=run(attuneGreen,'choice:healVein');
assert.equal(attuneGreen.manualId,'green-vein');assert.ok(attuneGreen.affinityPoints.wood>=4||attuneGreen.affinityPoints.fire>=4);assert.equal(attuneGreen.manual,5);


// v2.42 feedback/regression checks.
let pill=G.create({origin:'merchant'});pill.location='market';pill.silver=20;const baseGain=G.cultivationGain(pill);
pill=run(pill,'action:buyelixir');assert.equal(pill.elixirBoost,6);assert.equal(pill.silver,10);assert.ok(G.cultivationGain(pill)>baseGain);
pill.grain=20;pill.focus=100;pill=run(pill,'action:cultivate',0);assert.equal(pill.elixirBoost,5);

let wen=G.create({origin:'herbalist'});wen.location='mountain';wen.pending='stoneScout';wen=run(wen,'choice:yieldSpring');assert.ok(wen.codex.people.includes('wen'));assert.equal(wen.npcFavor.wen,1);

let preview=G.create();preview.story.yeRoute='help';preview.story.yeMonth=0;preview.month=3;preview.pending='yeFollowup';const previewMonth=preview.month,previewFavor=preview.npcFavor.ye;
assert.ok(G.options(preview).some(o=>o.id==='back'));preview=run(preview,'choice:back');assert.equal(preview.month,previewMonth);assert.equal(preview.npcFavor.ye,previewFavor);assert.equal(preview.story.yeFollowup,null);

let retreat=G.create();retreat.manuals.push(1);retreat.manual=1;retreat.practice[1]=11;retreat.grain=30;retreat.focus=100;retreat.events.nextMonth=999;retreat=run(retreat,'action:secludeYear',0.99);
const retreatLog=retreat.logs.filter(l=>l.tag==='闭关').at(-1);assert.ok(retreatLog?.effect.includes('木亲和'),retreatLog?.effect||'missing retreat affinity summary');

// Thirty rounds without a knockout is a deliberate draw path, not dead UI.
let drawCheck=G.create();drawCheck.location='arena';drawCheck=run(drawCheck,'action:spar-keeper');drawCheck.combat.player.attack=0;drawCheck.combat.enemy.attack=0;drawCheck.combat.player.counter=0;drawCheck.combat.enemy.counter=0;
for(let n=0;n<30&&drawCheck.combat;n++)drawCheck=run(drawCheck,'combat:guard',0.99);
assert.equal(drawCheck.sparRecord.last.result,'平局');
