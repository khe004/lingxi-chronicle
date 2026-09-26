// Fixed-seed, action-level balance runner. Policies only use public game commands.
const G=require('../dist/engine.js');
const fs=require('node:fs');
const origins=['scholar','merchant','herbalist'],talents=['clarity','meridian','vitality'];
const routes=['taiwei','star','green'],policies=['conservative','quest','risky'];
function rng(seed){let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
function travel(s,where){return s.location===where?null:`travel:${where}`;}
function ready(s,id){return G.available(s).some(x=>x.id===id&&!x.disabled);}
function choice(s,id){return G.options(s).some(x=>x.id===id&&!x.disabled)?`choice:${id}`:null;}
function command(s,route,policy,buyPill){
 if(s.combat)return 'combat:withdraw';
 if(s.pending){
  const p=s.pending;
  if(p==='stage')return choice(s,'restore')&&s.foundationStrain&&s.wounds===0&&policy==='conservative'?'choice:restore':choice(s,policy==='risky'?'hasty':'patient')||'choice:defer';
  if(p==='attempt')return policy==='risky'?'choice:bold':'choice:steady';
  if(p==='manual')return (route==='taiwei'&&s.origin!=='scholar'&&s.root<4&&choice(s,'equip-1'))||choice(s,`equip-${route==='star'?4:route==='green'?5:3}`)||choice(s,'equip-1')||choice(s,'equip-2')||choice(s,'equip-6')||'choice:back';
  if(p==='spring')return (route==='star'?choice(s,'hidden'):route==='green'?choice(s,'stone'):choice(s,'sealed'))||'choice:back';
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
 const target=route==='star'?4:route==='green'?5:3;
 if(s.grain<(policy==='conservative'?8:4)){if(s.location!=='mountain')return travel(s,'mountain');return s.focus<12?'action:rest':'action:gather';}
 if(s.focus<(policy==='conservative'?40:policy==='risky'?18:25))return 'action:rest';
 if(s.wounds>=(policy==='conservative'?1:policy==='risky'?4:2))return 'action:rest';
 if(s.stage<3&&s.progress>=G.cap(s))return 'action:stage';
 if(!s.manuals.includes(1)){
  if(s.silver<12){if(s.herbs>=3){if(s.location!=='market')return travel(s,'market');return 'action:sellall';}if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
  if(s.location!=='market')return travel(s,'market');return 'action:buymanual';
 }
 if(s.manual===0){if(!G.affinityMissing(s,G.ITEMS.manual[1]).length)return 'action:manual';return 'action:secludeYear';}
 if(!s.manuals.includes(target)){
  if(s.focus<35)return 'action:rest';
  const needInsight=route==='star'?8:route==='green'?5:8;
  const needWit=route==='star'?5:route==='green'?3:4;
  if(s.insight<needInsight||s.wit<needWit){if(s.location!=='cliff')return travel(s,'cliff');return s.focus<16?'action:rest':'action:study';}
  if(route==='star'){
   if(!s.flags.scroll){if(s.location!=='cliff')return travel(s,'cliff');return 'action:study';}
   if(!s.story.guText){if(s.location!=='cliff')return travel(s,'cliff');return 'action:guText';}
   if(!s.story.guFragments){if(s.location!=='mountain')return travel(s,'mountain');return 'action:findFragments';}
   if(s.root<3||s.practice[1]<8){return 'action:secludeYear';}
   if(s.location!=='cliff')return travel(s,'cliff');return 'action:guFinish';
  }
  if(route==='green'){
   if(!s.story.yeText){if(s.herbs<2){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}if(s.location!=='mountain')return travel(s,'mountain');return 'action:yeText';}
   if(s.body<4){if(s.herbs<2)return 'action:gather';return 'action:bodyTonic';}
   if(s.story.yeHerbWork<2||s.herbs<3){if(s.location!=='mountain')return travel(s,'mountain');return 'action:gather';}
   if(s.root<4||s.practice[1]<10)return 'action:secludeYear';
   if(s.location!=='mountain')return travel(s,'mountain');return 'action:yeFinish';
  }
  if(route==='taiwei'){
   if(s.origin==='scholar'){
    if(s.root<3||s.practice[1]<16)return 'action:secludeYear';
    if(!s.flags.mentor||!s.manuals.includes(2)){if(s.location!=='temple')return travel(s,'temple');return 'action:mentor';}
    if(s.manual!==2)return 'action:manual';
    if(s.practice[2]<14||s.root<4||s.dao<4)return 'action:secludeYear';
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
  if(s.insight<7){if(s.location!=='cliff')return travel(s,'cliff');return 'action:study';}
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
function simulate({origin,talent,route,policy,seed,buyPill=false,elements=['wood'],polarity='yang',trace=false}){
 // Hold the starting aspect constant across route comparisons; immortal acquisition later attunes its core aspect.
 let s=G.create({origin,talent,elements,polarity}),random=rng(seed),steps=0,pillsBought=0,firstSpirit=null,firstManual=null,firstSpring=null,attemptMonth=null,attemptChance=null,minGrain=s.grain,last='',actions=[];
 while(!s.ending&&steps<1500&&s.month<750){const c=command(s,route,policy,buyPill);if(!c)return {reason:'policy-null',seed,origin,talent,route,policy,state:s};
  const before=JSON.stringify([s.month,s.pending,s.location,s.progress,s.manual,s.spring,s.focus,s.grain,s.herbs,s.silver,s.stage]);last=c;
  if(c==='choice:steady'||c==='choice:bold'){attemptMonth=s.month;attemptChance=G.chance(s,c==='choice:bold'?'bold':'steady');}
  if(c==='action:buyelixir')pillsBought++;
  const at=s.month;s=G.step(s,c,random);steps++;minGrain=Math.min(minGrain,s.grain);
  if(trace)actions.push({month:at,command:c,monthAfter:s.month});
  if(!firstSpirit&&(s.manuals.includes(2)||s.manuals.includes(6)))firstSpirit=s.month;
  if(!firstManual&&s.manuals.includes(route==='star'?4:route==='green'?5:3))firstManual=s.month;
  if(!firstSpring&&s.spring>=3)firstSpring=s.month;
  if(JSON.stringify([s.month,s.pending,s.location,s.progress,s.manual,s.spring,s.focus,s.grain,s.herbs,s.silver,s.stage])===before)return {reason:'policy-stall',seed,origin,talent,route,policy,command:c,state:s};
 }
 return {reason:s.ending?.kind||'timeout',seed,origin,talent,route,policy,steps,pillsBought,month:s.month,firstSpirit,firstManual,firstSpring,attemptMonth,attemptChance,successMonth:s.ending?.kind==='success'?s.month:null,finalGrade:s.ending?.grade||null,minGrain,stage:s.stage,manual:s.manual,spring:s.spring,grain:s.grain,silver:s.silver,herbs:s.herbs,wounds:s.wounds,grades:s.foundationGrades,last,...(trace?{actions}:{}),...(!s.ending?{state:s}:{})};
}
if(require.main===module){
 const rows=[],improvements=[],bestByBuild={},bestByManual={},manualImprovements=[],buyPill=process.argv.includes('--pill'),groupByManual=process.argv.includes('--best-by-manual');
 const outIndex=process.argv.indexOf('--best-out');
 if(outIndex>=0&&!process.argv[outIndex+1])throw Error('--best-out requires a file path');
 const count=Number(process.argv.find(x=>/^\d+$/.test(x))||1);
 for(const origin of origins)for(const talent of talents)for(const route of routes)for(const policy of policies)for(let seed=1;seed<=count;seed++){
  const x=simulate({origin,talent,route,policy,seed,buyPill});rows.push(x);
  if(x.successMonth==null)continue;
  if(groupByManual){
   const manual=String(x.manual);
   if(!bestByManual[manual]||x.successMonth<bestByManual[manual].successMonth){
    bestByManual[manual]={manual:x.manual,manualName:G.ITEMS.manual[x.manual]?.name||manual,origin,talent,route,policy,seed,buyPill,successMonth:x.successMonth,attemptMonth:x.attemptMonth,finalGrade:x.finalGrade};
    manualImprovements.push({manual,...bestByManual[manual]});
   }
  }
  const key=[origin,talent,route].join('/');
  if(!bestByBuild[key]||x.successMonth<bestByBuild[key].successMonth){
   bestByBuild[key]={origin,talent,route,policy,seed,buyPill,successMonth:x.successMonth,attemptMonth:x.attemptMonth,finalGrade:x.finalGrade};
   improvements.push({build:key,...bestByBuild[key]});
  }
 }
 const best=Object.values(bestByBuild).sort((a,b)=>a.successMonth-b.successMonth||a.seed-b.seed)[0]||null;
 const replay=best?simulate({...best,trace:true}):null;
 if(replay&&replay.successMonth!==best.successMonth)throw Error('Best route replay did not reproduce');
 const manualResults={};
 if(groupByManual)for(const [manual,winner] of Object.entries(bestByManual)){
  const replay=simulate({...winner,trace:true});
  if(replay.successMonth!==winner.successMonth||replay.manual!==winner.manual)throw Error(`Manual ${manual} route replay did not reproduce`);
  manualResults[manual]={...winner,actions:replay.actions};
 }
 const bestResult={objective:'earliest successful meridian opening (month)',seedCount:count,buyPill,best,improvements,bestByBuild,bestActions:replay?.actions||[],...(groupByManual?{manualImprovements,bestByManual:manualResults}:{})};
 if(outIndex>=0)fs.writeFileSync(process.argv[outIndex+1],JSON.stringify(bestResult,null,2)+'\n');
 const by={};for(const x of rows){const key=[x.origin,x.route,x.reason].join('/');by[key]=(by[key]||0)+1;}
 console.log(JSON.stringify({count:rows.length,by,attempted:rows.filter(x=>x.attemptMonth!=null).length,records:rows.map(({state,...x})=>x),failures:rows.filter(x=>x.attemptMonth==null).map(x=>({origin:x.origin,talent:x.talent,route:x.route,policy:x.policy,seed:x.seed,reason:x.reason,month:x.month||x.state?.month,command:x.command||x.last,stage:x.state?.stage,manual:x.state?.manual,focus:x.state?.focus,grain:x.state?.grain,pending:x.state?.pending,story:x.state?.story})).slice(0,30),bestResult},null,2));
}
module.exports={simulate};
