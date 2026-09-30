// Fixed-seed, action-level balance runner. Policies only use public game commands.
const G=require('../dist/engine.js');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const origins=['scholar','merchant','herbalist'],talents=['clarity','meridian','vitality'];
const routes=['taiwei','star','green'],policies=['rarity-first','harmony-first'];
const SPRING_OPTION_INDEX={common:1,deep:2,hidden:3,sealed:4,stone:5},RARITY_RANK={基础:0,凡品:1,灵品:2,仙品:3};
function rng(seed){let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
function travel(s,where){return s.location===where?null:`travel:${where}`;}
function ready(s,id){return G.available(s).some(x=>x.id===id&&!x.disabled);}
function choice(s,id){return G.options(s).some(x=>x.id===id&&!x.disabled)?`choice:${id}`:null;}
function command(s,route,policy,buyPill,opening='transition'){
 if(s.combat)return s.combat.storyEncounter==='ordealDuel'?'combat:auto-aggressive':'combat:withdraw';
 if(s.pending){
  const p=s.pending;
  if(p==='stage')return choice(s,'patient')||'choice:defer';
  if(p==='attempt')return 'choice:steady';
  if(p==='ordealHelp'){
   const preference=route==='star'?['ordealGu','ordealYe','ordealCheng']:route==='green'?['ordealYe','ordealGu','ordealCheng']:['ordealCheng','ordealGu','ordealYe'];
   return preference.map(id=>choice(s,id)).find(Boolean)||'choice:back';
  }
  if(p==='manual'){
   const order=[route==='star'?4:route==='green'?5:3,route==='taiwei'&&s.origin==='scholar'?2:6,1];
   for(const id of order)if(s.manuals.includes(id)&&!G.manualDecoded(s,id))return choice(s,`decode-${id}`)||'choice:back';
   return (route==='taiwei'&&s.origin!=='scholar'&&s.root<4&&choice(s,'equip-1'))||order.map(id=>choice(s,`equip-${id}`)).find(Boolean)||'choice:back';
  }
  if(p==='spring'){
   const candidates=G.options(s).filter(o=>SPRING_OPTION_INDEX[o.id]&&!o.disabled);
   candidates.sort((a,b)=>{const ia=SPRING_OPTION_INDEX[a.id],ib=SPRING_OPTION_INDEX[b.id],ha=G.springHarmony(s,ia).score,hb=G.springHarmony(s,ib).score,pa=G.ITEMS.spring[ia].power,pb=G.ITEMS.spring[ib].power,ra=RARITY_RANK[G.ITEMS.spring[ia].rarity]||0,rb=RARITY_RANK[G.ITEMS.spring[ib].rarity]||0;return policy==='harmony-first'?(hb-ha||rb-ra||pb-pa):(rb-ra||pb-pa||hb-ha);});
   return candidates.length?`choice:${candidates[0].id}`:'choice:back';
  }
  if(p==='scroll')return 'choice:share';
  if(p==='herbalist')return choice(s,'help')||'choice:leave';
  if(p==='guText')return choice(s,'collaborate')||choice(s,'independent')||'choice:back';
  if(p==='guFinish')return choice(s,'verify')||'choice:back';
  if(p==='yeText')return choice(s,'tend')||'choice:back';
  if(p==='yeFinish')return choice(s,'healVein')||'choice:back';
  if(p==='luMeet')return choice(s,'pledge')||choice(s,'escort')||'choice:back';
  if(p==='luReturn')return choice(s,'redeemSilver')||choice(s,'redeemHerbs')||'choice:back';
  if(p==='stoneScout')return choice(s,'yieldSpring')||choice(s,'seekStone')||'choice:back';
  if(p==='sealAudience')return choice(s,'bondSeal')||choice(s,'serveSeal')||'choice:back';
  if(p==='mentor')return choice(s,'raretext')||choice(s,'guidance')||choice(s,'serve')||'choice:depart';
  if(p==='trueText')return 'choice:undertake';
  if(p==='yeFollowup')return choice(s,'accompany')||choice(s,'buyMap')||choice(s,'solo')||choice(s,'part')||choice(s,'forage');
  if(p==='guFollowup')return choice(s,'compare')||choice(s,'commission')||choice(s,'decline');
  if(p==='guReturn')return choice(s,'joint')||choice(s,'copy')||choice(s,'wage');
  if(p==='chengFollowup')return choice(s,'guard')||choice(s,'copyForPay')||choice(s,'pass');
  if(p==='chengReturn')return choice(s,'askMethod')||choice(s,'askSupply')||choice(s,'settle')||choice(s,'gift');
  if(p.startsWith('scene-'))return 'choice:ignore';
  if(p.startsWith('after-'))return 'choice:back';
  return choice(s,'back')||choice(s,'depart')||choice(s,'ignore');
 }
 if(s.story?.ordeal?.triggered&&!s.story.ordeal.resolved){
  const options=G.options({...s,pending:'ordealHelp'});
  const preference=route==='star'?['ordealGu','ordealYe','ordealCheng']:route==='green'?['ordealYe','ordealGu','ordealCheng']:['ordealCheng','ordealGu','ordealYe'];
  const availableHelpers=preference.map(id=>options.find(o=>o.id===id)).filter(Boolean);
  const helper=availableHelpers.find(o=>!o.disabled);
  if(helper){const place=helper.id==='ordealCheng'?'temple':helper.id==='ordealGu'?'cliff':'mountain';if(s.location!==place)return travel(s,place);return 'action:ordealHelp';}
  const stalled=availableHelpers[0];
  if(stalled){const miss=stalled.requirements?.filter(r=>!r.met).map(r=>r.label)||[];
   if(miss.includes('心神'))return 'action:rest';
   if(miss.includes('灵草')){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
   if(miss.includes('心得')||miss.includes('悟性')){if(s.location!=='cliff')return travel(s,'cliff');return 'action:study';}
   if(miss.includes('口粮')){if(s.location==='market'&&s.silver>=3)return 'action:buygrain';if(s.location!=='mountain')return travel(s,'mountain');return s.focus<12?'action:rest':'action:gather';}
   if(miss.includes('程上师好感')&&!s.flags.mentor){if(s.location!=='temple')return travel(s,'temple');return 'action:mentor';}
  }
  const visitor=G.available({...s,location:'arena'}).some(o=>o.id==='ordealDuel');
  if(visitor){if(s.location!=='arena')return travel(s,'arena');return 'action:ordealDuel';}
 }
 const target=route==='star'?4:route==='green'?5:3;
 if(s.grain<4){if(s.location!=='mountain')return travel(s,'mountain');return s.focus<12?'action:rest':'action:gather';}
 if(s.focus<25)return 'action:rest';
 if(s.wounds>=2)return 'action:rest';
 if(s.stage<3&&s.progress>=G.cap(s))return 'action:stage';
 if(opening==='basic'&&!s.manuals.includes(1)&&s.practice[0]<24)return 'action:secludeYear';
 if(!s.manuals.includes(1)&&(opening!=='basic'||s.practice[0]>=24)){
  if(s.silver<12){if(s.herbs>=3){if(s.location!=='market')return travel(s,'market');return 'action:sellall';}if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
  if(s.location!=='market')return travel(s,'market');return 'action:buymanual';
 }
 if(s.manual===0&&opening==='basic')return 'action:manual';
 if(s.manual===0&&opening!=='basic'){if(!G.affinityMissing(s,G.ITEMS.manual[1]).length)return 'action:manual';return 'action:secludeYear';}
 if(opening==='specialist'&&s.manual===1&&s.practice[1]<12)return 'action:secludeYear';
 const openingPractice=1;
 if(!s.manuals.includes(target)){
  if(s.focus<35)return 'action:rest';
  const needReads=route==='star'?3:route==='green'?2:s.origin==='scholar'?0:7;
  const needWit=route==='star'?5:route==='green'?3:4;
  if((s.story.scriptureReads||0)<needReads||s.wit<needWit){if(s.location!=='cliff')return travel(s,'cliff');return s.focus<16?'action:rest':'action:study';}
  if(route==='star'){
   if(!s.flags.scroll){if(s.location!=='cliff')return travel(s,'cliff');return 'action:study';}
   if(!s.story.guText){if(s.location!=='cliff')return travel(s,'cliff');return 'action:guText';}
   if(s.month<s.story.guTextMonth+3)return 'action:rest';
   if(!s.story.guFragments){if(s.location!=='mountain')return travel(s,'mountain');return 'action:findFragments';}
    if(s.root<3||s.practice[openingPractice]<8){return 'action:secludeYear';}
   if(s.location!=='cliff')return travel(s,'cliff');return 'action:guFinish';
  }
  if(route==='green'){
   if(!s.story.yeText){if(s.herbs<2){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}if(s.location!=='mountain')return travel(s,'mountain');return 'action:yeText';}
   if(s.month<s.story.yeTextMonth+2)return 'action:rest';
   if(s.body<4){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
   if(s.story.yeHerbWork<2||s.herbs<3){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
   if(s.root<4||s.practice[openingPractice]<10)return 'action:secludeYear';
   if(s.location!=='mountain')return travel(s,'mountain');return 'action:yeFinish';
  }
  if(route==='taiwei'){
   if(s.origin==='scholar'){
    if(s.root<3||s.practice[openingPractice]<16)return 'action:secludeYear';
   if(!s.flags.mentor||!s.manuals.includes(2)){if(s.location!=='temple')return travel(s,'temple');return 'action:mentor';}
   if(s.manual!==2)return 'action:manual';
   if(s.practice[2]<14||s.root<4||s.dao<4)return 'action:secludeYear';
   if(s.npcFavor.cheng<4){if(s.location!=='temple')return travel(s,'temple');if(ready(s,'chengFollowup'))return 'action:chengFollowup';if(ready(s,'chengReturn'))return 'action:chengReturn';return 'action:rest';}
   if(!s.story.trueTextReady||s.npcFavor.cheng<3){if(s.location!=='temple')return travel(s,'temple');return 'action:mentor';}
    if(s.herbs<2){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
    if(s.location!=='temple')return travel(s,'temple');return 'action:mentor';
   }
   if(!s.story.luHeard){if(s.location!=='market')return travel(s,'market');return 'action:marketWalk';}
   if(!s.story.luRoute){if(s.location!=='market')return travel(s,'market');return 'action:luMeet';}
   if(s.root<4){if(s.manual!==1)return 'action:manual';return 'action:secludeYear';}
   if(s.manual!==6)return 'action:manual';
   if(s.practice[6]<10||s.wit<4||s.dao<3||s.social<(s.story.luRoute==='escort'?2:4))return 'action:secludeYear';
   if(s.silver<8&&s.herbs<3){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
   if(s.location!=='market')return travel(s,'market');return 'action:luReturn';
  }
 }
 if(s.manual!==target)return 'action:manual';
 if(!s.spring){
  if(route==='taiwei'&&s.focus<25)return 'action:rest';
  if(route==='star'&&(s.focus<40||s.silver<6)){
   if(s.focus<40)return 'action:rest';
   if(s.herbs>=2){if(s.location!=='market')return travel(s,'market');return 'action:sellall';}
   if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';
  }
  if(route==='green'&&s.focus<35)return 'action:rest';
   if(route==='star'&&(s.story.scriptureReads||0)<3){if(s.location!=='cliff')return travel(s,'cliff');return 'action:study';}
  if(route==='green'){
   if(!s.story.yeClue&&s.story.yeRoute&&!s.story.yeFollowup){if(s.location!=='mountain')return travel(s,'mountain');if(ready(s,'yeFollowup'))return 'action:yeFollowup';return 'action:rest';}
   if(!s.story.stoneClue){if(s.location!=='mountain')return travel(s,'mountain');return 'action:stoneScout';}
   if(s.herbs<2){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
  }
  if(route==='taiwei'){
   if(!s.story.sealPermit){if(s.location!=='temple')return travel(s,'temple');
    if(s.npcFavor.cheng<3&&!s.story.luCredential){if(!s.flags.mentor||!s.manuals.includes(2))return 'action:mentor';if(ready(s,'chengFollowup'))return 'action:chengFollowup';return 'action:rest';}
    return 'action:sealAudience';}
   if(s.herbs<2){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
   if(s.location!=='temple')return travel(s,'temple');return 'action:spring';
  }
  if(s.location!=='mountain')return travel(s,'mountain');return 'action:spring';
 }
 if(s.stage<3&&s.progress>=G.cap(s))return 'action:stage';
 if(s.stage===3&&s.progress>=G.cap(s))return s.focus<50?'action:rest':'action:attempt';
 if(buyPill&&!s.elixirBoost&&s.progress<G.cap(s)-G.cultivationGain(s)*6){
  if(s.silver<10&&s.herbs>=4){if(s.location!=='market')return travel(s,'market');return 'action:sellall';}
  if(s.silver>=10){if(s.location!=='market')return travel(s,'market');return 'action:buyelixir';}
 }
 if(s.grain<9&&s.herbs>=3){if(s.location!=='market')return travel(s,'market');return 'action:sellall';}
 if(s.grain<9&&s.silver>=3){if(s.location!=='market')return travel(s,'market');return 'action:buymax';}
 return s.lifeLimitMonths-s.ageMonths<=12||s.wounds>=4?'action:cultivate':'action:secludeYear';
}
function probeMingqiEntry(input){
 if(input.chapter!=='mingqi')return null;
 let s=input,steps=0;const entryMonth=s.month;
 function prepare(){
  if(s.grain<3){s=G.step(s,'travel:mountain');if(s.focus<8)s=G.step(s,'action:mingqiRest');s=G.step(s,'action:mingqiForage');steps++;}
  if(s.focus<12){s=G.step(s,'action:mingqiRest');steps++;}
 }
 prepare();s=G.step(s,'action:mingqiSense');steps++;
 prepare();s=G.step(s,'travel:mountain');s=G.step(s,'action:mingqiRidge');steps++;
 prepare();s=G.step(s,'travel:temple');s=G.step(s,'action:mingqiFriend');steps++;
 return {complete:!!s.mingqi?.introComplete,ending:s.ending?.kind||null,months:s.month-entryMonth,steps,grain:s.grain,focus:s.focus,wounds:s.wounds};
}
function simulate({origin,talent,route,policy,seed,buyPill=false,elements=['wood'],polarity='yang',trace=false,opening='transition'}){
 // Hold the starting aspect constant across route comparisons; immortal acquisition later attunes its core aspect.
 let s=G.create({origin,talent,elements,polarity}),random=rng(seed),steps=0,pillsBought=0,firstSpirit=null,firstManual=null,firstDecoded=null,firstPractice=null,firstSpring=null,attemptMonth=null,attemptChance=null,attemptAptitude=null,attemptHarmony=null,attemptQuality=null,attemptTopReady=null,minGrain=s.grain,last='',actions=[],affinityAt={},aptitudeAt={};
 const aptitude=state=>({root:state.root,wit:state.wit,body:state.body,dao:state.dao,social:state.social});
 random.onMonth=state=>{if([60,120,168].includes(state.month))aptitudeAt[state.month]=aptitude(state);};
 while(!s.ending&&!s.openingResult&&steps<1500&&s.month<750){let c=command(s,route,policy,buyPill,opening);if(!c)return {reason:'policy-null',seed,origin,talent,route,policy,opening,state:s};
  // General cultivation actions are no longer offered at the market after the P0 menu cleanup.
  if(s.location==='market'&&['action:rest','action:cultivate','action:secludeYear','action:manual','action:stage','action:attempt'].includes(c))c='travel:temple';
  if(s.location==='arena'&&['action:rest','action:cultivate','action:secludeYear','action:manual','action:stage','action:attempt'].includes(c))c='travel:temple';
  const before=JSON.stringify([s.month,s.ageMonths,s.pending,s.location,s.progress,s.totalProgress,s.manual,s.manuals,s.decodedManuals,s.spring,s.foundation,s.foundationGrades,s.foundationStrain,s.root,s.wit,s.body,s.dao,s.social,s.aptitudeXp,s.practice,s.affinityPoints,s.affinityTraining,s.focus,s.grain,s.herbs,s.silver,s.wounds,s.lifeLimitMonths,s.npcFavor,s.flags,s.story,s.events,s.ending,s.combat?.id,s.combat?.round]);last=c;
  if(c==='choice:steady'||c==='choice:bold'){attemptMonth=s.month;attemptChance=G.chance(s,c==='choice:bold'?'bold':'steady');attemptAptitude=aptitude(s);attemptHarmony=G.springHarmony(s);attemptQuality=G.quality(s);attemptTopReady=attemptQuality>=22&&G.ITEMS.manual[s.manual]?.rarity==='仙品'&&G.ITEMS.spring[s.spring]?.rarity==='仙品'&&attemptHarmony.score>=1&&s.foundation>=3&&G.flawlessFoundation(s)&&s.wit>=5&&s.wounds===0;}
  if(c==='action:buyelixir')pillsBought++;
  const at=s.month;s=G.step(s,c,random);steps++;minGrain=Math.min(minGrain,s.grain);
  for(const milestone of [60,120,168])if(at<milestone&&s.month>=milestone)affinityAt[milestone]={...G.points(s)};
  for(const milestone of [60,120,168])if(!aptitudeAt[milestone]&&s.month===milestone)aptitudeAt[milestone]=aptitude(s);
  if(trace)actions.push({month:at,command:c,monthAfter:s.month});
  if(!firstSpirit&&(s.manuals.includes(2)||s.manuals.includes(6)))firstSpirit=s.month;
  if(!firstManual&&s.manuals.includes(route==='star'?4:route==='green'?5:3))firstManual=s.month;
  const target=route==='star'?4:route==='green'?5:3;
  if(firstDecoded===null&&G.manualDecoded(s,target))firstDecoded=s.month;
  if(firstPractice===null&&s.practice[target]>0)firstPractice=s.month;
  if(!firstSpring&&s.spring>=3)firstSpring=s.month;
  if(JSON.stringify([s.month,s.ageMonths,s.pending,s.location,s.progress,s.totalProgress,s.manual,s.manuals,s.decodedManuals,s.spring,s.foundation,s.foundationGrades,s.foundationStrain,s.root,s.wit,s.body,s.dao,s.social,s.aptitudeXp,s.practice,s.affinityPoints,s.affinityTraining,s.focus,s.grain,s.herbs,s.silver,s.wounds,s.lifeLimitMonths,s.npcFavor,s.flags,s.story,s.events,s.ending,s.combat?.id,s.combat?.round])===before)return {reason:'policy-stall',seed,origin,talent,route,policy,opening,command:c,state:s};
 }
 return {entryProbe:probeMingqiEntry(s),reason:s.openingResult?.kind||s.ending?.kind||'timeout',seed,origin,talent,route,policy,opening,steps,pillsBought,month:s.month,firstSpirit,firstManual,firstDecoded,firstPractice,firstSpring,attemptMonth,attemptChance,attemptAptitude,attemptHarmonyLevel:attemptHarmony?.level||null,attemptHarmonyScore:attemptHarmony?.score??null,attemptQuality,attemptTopReady,aptitudeAt,successMonth:s.openingResult?.kind==='success'?s.openingResult.month:null,finalGrade:s.openingResult?.grade||s.ending?.grade||null,minGrain,stage:s.stage,manual:s.manual,spring:s.spring,grain:s.grain,silver:s.silver,herbs:s.herbs,wounds:s.wounds,grades:s.foundationGrades,affinityAt,last,...(trace?{actions}:{}),...(!s.ending&&!s.openingResult?{state:s}:{})};
}
if(require.main===module){
 const rows=[],improvements=[],bestByBuild={},bestByManual={},manualImprovements=[],buyPill=process.argv.includes('--pill'),groupByManual=process.argv.includes('--best-by-manual'),compareOpenings=process.argv.includes('--compare-openings'),openings=compareOpenings?['basic','transition','specialist']:['transition'];
 const outIndex=process.argv.indexOf('--best-out');
 if(outIndex>=0&&!process.argv[outIndex+1])throw Error('--best-out requires a file path');
 const count=Number(process.argv.find(x=>/^\d+$/.test(x))||1);
 const seedStartIndex=process.argv.indexOf('--seed-start'),seedEndIndex=process.argv.indexOf('--seed-end');
 const seedStart=Number(seedStartIndex>=0?process.argv[seedStartIndex+1]:1),seedEnd=Number(seedEndIndex>=0?process.argv[seedEndIndex+1]:count);
 const originFilter=process.argv.includes('--origin')?process.argv[process.argv.indexOf('--origin')+1]:null,routeFilter=process.argv.includes('--route')?process.argv[process.argv.indexOf('--route')+1]:null;
 if(!Number.isInteger(seedStart)||!Number.isInteger(seedEnd)||seedStart<1||seedEnd>count||seedStart>seedEnd)throw Error('invalid seed range');
 for(const opening of openings)for(const origin of origins.filter(x=>!originFilter||x===originFilter))for(const talent of talents)for(const route of routes.filter(x=>!routeFilter||x===routeFilter))for(const policy of policies)for(let seed=seedStart;seed<=seedEnd;seed++){
  const x=simulate({origin,talent,route,policy,seed,buyPill,opening});rows.push(x);
  if(x.successMonth==null)continue;
  if(groupByManual){
   const manual=String(x.manual);
   if(!bestByManual[manual]||x.successMonth<bestByManual[manual].successMonth){
    bestByManual[manual]={manual:x.manual,manualName:G.ITEMS.manual[x.manual]?.name||manual,origin,talent,route,policy,seed,buyPill,opening,successMonth:x.successMonth,attemptMonth:x.attemptMonth,finalGrade:x.finalGrade};
    manualImprovements.push({manual,...bestByManual[manual]});
   }
  }
  const key=[opening,origin,talent,route].join('/');
  if(!bestByBuild[key]||x.successMonth<bestByBuild[key].successMonth){
   bestByBuild[key]={opening,origin,talent,route,policy,seed,buyPill,successMonth:x.successMonth,attemptMonth:x.attemptMonth,finalGrade:x.finalGrade};
   improvements.push({build:key,...bestByBuild[key]});
  }
 }
 if(rows.length===5400&&openings.length===1&&openings[0]==='transition'){
  for(const x of rows.filter(x=>x.reason==='success'))assert.ok(x.entryProbe?.complete&&!x.entryProbe.ending&&x.entryProbe.months<=6,`mingqi entry blocked: ${x.origin}/${x.talent}/${x.route}/${x.policy}/${x.seed}`);
  const blocked=rows.filter(x=>['policy-stall','policy-null','timeout'].includes(x.reason));
  assert.equal(blocked.length,0,`matrix has structural stalls: ${blocked.slice(0,3).map(x=>`${x.origin}/${x.talent}/${x.route}/${x.policy}/${x.seed}:${x.reason}`).join(', ')}`);
  const attempted=rows.filter(x=>x.attemptMonth!=null);
  assert.ok(attempted.every(x=>x.attemptMonth<=168),'all legal meridian attempts must occur by month 168');
  assert.ok(attempted.length/rows.length>=.85,`overall attempt rate ${attempted.length}/${rows.length} is below 85%`);
  const cells=new Map();for(const x of rows){const key=`${x.origin}/${x.talent}/${x.route}/${x.policy}`;const a=cells.get(key)||{total:0,attempts:0};a.total++;if(x.attemptMonth!=null)a.attempts++;cells.set(key,a);}
 for(const [key,a] of cells)assert.ok(a.attempts/a.total>=.75,`${key} attempt rate ${a.attempts}/${a.total} is below 75%`);
  const paired=new Map(rows.map(x=>[[x.origin,x.talent,x.route,x.seed,x.policy].join('/'),x.spring])),divergent=[...new Set(rows.map(x=>[x.origin,x.talent,x.route,x.seed].join('/')))].filter(key=>paired.get(`${key}/rarity-first`)!==paired.get(`${key}/harmony-first`)).length;
 assert.ok(divergent>0,'the two pool-selection policies must make at least some different choices');
 }
 const springPairMap=new Map(rows.map(x=>[[x.origin,x.talent,x.route,x.seed,x.policy].join('/'),x.spring]));
 const springPairKeys=[...new Set(rows.map(x=>[x.origin,x.talent,x.route,x.seed].join('/')))];
 const policyChoiceDivergence={changed:springPairKeys.filter(key=>springPairMap.get(`${key}/rarity-first`)!==springPairMap.get(`${key}/harmony-first`)).length,total:springPairKeys.length};
 policyChoiceDivergence.percent=Number((policyChoiceDivergence.changed/policyChoiceDivergence.total*100).toFixed(2));
 const best=Object.values(bestByBuild).sort((a,b)=>a.successMonth-b.successMonth||a.seed-b.seed)[0]||null;
 const replay=best?simulate({...best,trace:true}):null;
 if(replay&&replay.successMonth!==best.successMonth)throw Error('Best route replay did not reproduce');
 const manualResults={};
 if(groupByManual)for(const [manual,winner] of Object.entries(bestByManual)){
  const replay=simulate({...winner,trace:true});
  if(replay.successMonth!==winner.successMonth||replay.manual!==winner.manual)throw Error(`Manual ${manual} route replay did not reproduce`);
  manualResults[manual]={...winner,actions:replay.actions};
 }
 const summarize=items=>{const attempts=items.filter(x=>x.attemptMonth!=null),successes=items.filter(x=>x.successMonth!=null),sorted=a=>a.filter(Number.isFinite).sort((x,y)=>x-y),quantile=(a,q)=>{const v=sorted(a);return v.length?v[Math.floor((v.length-1)*q)]:null;},mean=a=>a.length?Number((a.reduce((n,x)=>n+x,0)/a.length).toFixed(2)):null,foundationGrades={},finalGrades={},springSelections={};for(const x of items){for(const grade of x.grades||[])foundationGrades[grade]=(foundationGrades[grade]||0)+1;if(x.finalGrade)finalGrades[x.finalGrade]=(finalGrades[x.finalGrade]||0)+1;if(x.spring){const name=G.ITEMS.spring[x.spring]?.name||String(x.spring);springSelections[name]=(springSelections[name]||0)+1;}}return {total:items.length,attempts:attempts.length,successes:successes.length,successRate:Number((successes.length/items.length*100).toFixed(2)),averageAttemptMonth:mean(attempts.map(x=>x.attemptMonth)),medianAttemptMonth:quantile(attempts.map(x=>x.attemptMonth),.5),p90AttemptMonth:quantile(attempts.map(x=>x.attemptMonth),.9),medianSuccessMonth:quantile(successes.map(x=>x.successMonth),.5),springSelections,foundationGrades,finalGrades};};
 const strata={overall:summarize(rows),policy:{},origin:{},route:{},policyByOrigin:{},policyByRoute:{}};for(const p of policies){strata.policy[p]=summarize(rows.filter(x=>x.policy===p));strata.policyByOrigin[p]={};strata.policyByRoute[p]={};for(const o of origins)strata.policyByOrigin[p][o]=summarize(rows.filter(x=>x.policy===p&&x.origin===o));for(const r of routes)strata.policyByRoute[p][r]=summarize(rows.filter(x=>x.policy===p&&x.route===r));}for(const o of origins)strata.origin[o]=summarize(rows.filter(x=>x.origin===o));for(const r of routes)strata.route[r]=summarize(rows.filter(x=>x.route===r));
 const bestResult={objective:'earliest successful meridian opening (month)',seedCount:count,buyPill,best,improvements,bestByBuild,bestActions:replay?.actions||[],...(groupByManual?{manualImprovements,bestByManual:manualResults}:{})};
 if(outIndex>=0)fs.writeFileSync(process.argv[outIndex+1],JSON.stringify(bestResult,null,2)+'\n');
 const by={};for(const x of rows){const key=[x.opening,x.origin,x.route,x.reason].join('/');by[key]=(by[key]||0)+1;}
 console.log(JSON.stringify({count:rows.length,by,attempted:rows.filter(x=>x.attemptMonth!=null).length,policyChoiceDivergence,strata,records:rows.map(({state,...x})=>x),failures:rows.filter(x=>x.attemptMonth==null).map(x=>({origin:x.origin,talent:x.talent,route:x.route,policy:x.policy,seed:x.seed,reason:x.reason,month:x.month||x.state?.month,command:x.command||x.last,stage:x.state?.stage,manual:x.state?.manual,focus:x.state?.focus,grain:x.state?.grain,pending:x.state?.pending,story:x.state?.story})).slice(0,30),bestResult},null,2));
}
module.exports={simulate};
