(function(root){'use strict';function createChapterTwo(D){
 const {qiStable,add,turn,note,remember,chapterRoll,withRequirements:withReq,resourceRequirement:res,flagRequirement:flag,LOCATIONS}=D;
 const SITE_NAMES=['雾径辨流','热隙开路','泉台定脉'];
 function fresh(){return {sand:0,ascAid:null,ascDebt:0,version:1,findings:[],vessel:false,conditioning:0,fieldAid:0,fieldDebt:0,attempts:0,failures:0,history:[],ascension:null,complete:false};}
 function journey(s){return s.mingqi?.fiveQi?.journey||fresh();}
 function ensure(s){const q=s.mingqi.fiveQi;q.journey={...fresh(),...q.journey};return q.journey;}
 function temporary(s,months=1){const q=s.mingqi?.fiveQi;return !!q&&(q.temporaryUntil||0)-s.month>=months&&!q.blocked;}
 function ready(s,months=1){const q=s.mingqi?.fiveQi;return !!q&&(qiStable(q)||temporary(s,months));}
 function consumeTime(s,months){for(let i=0;i<months&&!s.ending;i++)turn(s);}
 function travelChoices(s){return Object.entries(LOCATIONS).filter(([id,l])=>l.region==='cangwu'||s.chapter==='mingqi'&&s.mingqi?.introComplete&&s.mingqi?.fiveQi).map(([id,l])=>{const months=l.region===(LOCATIONS[s.location]?.region)||l.region==='cangwu'&&LOCATIONS[s.location]?.region==='cangwu'?0:2;return {id,...l,months,disabled:!!(s.pending||s.combat||s.ending)||s.location===id||months>0&&(s.grain<months||s.focus<8),detail:months?'往来两月，口粮 2、心神 −8':'区域内往来不耗月'};});}
 function travel(s,id){const option=travelChoices(s).find(o=>o.id===id&&!o.disabled);if(!option)return s;if(option.months){add(s,{focus:-8});consumeTime(s,option.months);if(s.ending)return s;}s.location=id;s.trainingGear={staff:false,vest:false,shoes:false,talisman:false};note(s,`你来到${option.name}。${option.detail}。`,'行旅');return s;}
 function available(s){const q=s.mingqi?.fiveQi;if(!q||!s.mingqi.introComplete)return [];const j=journey(s),out=[...ascendAvailable(s)],action=(id,label,detail,r=[])=>out.push(withReq({id,label,detail},r));
  if(j.complete)return [];
  if(s.location==='riverMarket'){
   action('expSupplies','河灯市备粮','银钱 −2、口粮 +6，不耗月',[res(s,'silver',2)]);
   action('expTrade','出售一株灵草','灵草 −1、银钱 +3，不耗月',[res(s,'herbs',1)]);
   action('expCooling','购清心丹','银钱 −5，不耗月；药效覆盖整段行程才可安全行动',[res(s,'silver',5)]);
   action('expWard','委托温土符','一月、口粮 1、银钱 −4、灵草 −1；护一次泄火或朝元土环',[res(s,'grain',1),res(s,'silver',4),res(s,'herbs',1)]);
  }
  if(s.location==='temple'&&!j.fieldAid&&!j.vessel)action('expAskGuide','请程上师照看雾径','一月、口粮 1；可代替一次不稳定行气，留下誊卷之约；不是长期调和',[res(s,'grain',1)]);
  if(s.location==='temple'&&j.fieldDebt>0)action('expRepayGuide','誊卷偿还行旅护法','一月、口粮 1、心神 −10；偿还一次护法之约',[res(s,'grain',1),res(s,'focus',10)]);
  if(s.location==='redValley'&&!j.vessel){const goal=SITE_NAMES[j.findings.length];const req=months=>[res(s,'grain',months),flag('行气足以覆盖全程',ready(s,months)||j.fieldAid>0,'先稳定循环、服足效清心丹，或请具体护法')];
   action('expCareful',`循稳路 · ${goal}`,'两月、口粮 2、心神 −18；谨慎完成一处测流，不损五气',[...req(2),res(s,'focus',18)]);
   if(q.method==='taiwei')action('expFlow',`金水导流 · ${goal}`,'两月、口粮 2、心神 −8；太微收敛火势，降低长程消耗',[...req(2),res(s,'focus',8)]);
   if(q.method==='green')action('expNurture',`青华循药径 · ${goal}`,'两月、口粮 2、心神 −14、灵草 −1；完成测流并暗伤 −1',[...req(2),res(s,'focus',14),res(s,'herbs',1)]);
   if(q.arts.includes('drain'))action('expBurst',`泄火破障 · ${goal}`,'一月、口粮 1、心神 −24；星篆火旺时热隙可连通两处，其他法门推进一处；耗肝木和脾土，温土符只护土',[...req(1),res(s,'focus',24)]);
   if(!ready(s,1))action('expPush',`冒险深入 · ${goal}`,'一月、口粮 1、心神 −18；不稳行气强行推进一处，暗伤 +1 至 2，重伤可身死；可先服丹或撤退',[res(s,'grain',1),res(s,'focus',18)]);
   action('expRetreat','沿原路退回河灯市','两月、口粮 2、心神 −8；保留已测成果，不丢掉人物经历',[res(s,'grain',2),res(s,'focus',8)]);
  }
  if(j.vessel&&j.conditioning<2&&ready(s,12))action('expCondition','循法静修一年，熟悉测流图','十二月、口粮 12、心神 −20；运转准备 +1（最多两档）；第一档支持水火，第二档支持回流，已有余裕时可不修',[res(s,'grain',12),res(s,'focus',20),flag('护卷旧契已结清',!s.story.luRoute||s.story.luRoute==='complete'||s.story.luDefaulted,'先处理旧护卷契，避免闭关误期')]);
  return out;
 }
 function step(s,command){const [kind,id]=command.split(':');if(id?.startsWith('asc'))return ascendStep(s,command);if(kind!=='action'||!available(s).some(o=>o.id===id&&!o.disabled))return s;const q=s.mingqi.fiveQi,j=ensure(s);
  if(id==='expSupplies'){add(s,{silver:-2,grain:6});note(s,'你购下下一程口粮。','交易');return s;}
  if(id==='expTrade'){add(s,{herbs:-1,silver:3});note(s,'你售药备资。','交易');return s;}
  if(id==='expCooling'){add(s,{silver:-5});q.items.cooling++;note(s,'清心丹可在行气不稳时撑住一段两月测流，服药须覆盖全程。','交易');return s;}
  if(id==='expWard'){add(s,{silver:-4,herbs:-1});q.items.ward++;consumeTime(s,1);note(s,'你委托制成温土符。','交易');return s;}
  if(id==='expAskGuide'){j.fieldAid=1;j.fieldDebt++;consumeTime(s,1);const e=remember(s,'mingqi.field-guide',{actors:['cheng'],tags:['护法'],text:'程上师为一次雾径行气护法；留下誊卷之约。'});e.knownBy=['cheng'];note(s,'程上师只照看一段雾径，替你稳住一次不稳定行气。你应下一次誊卷之约。','人情');return s;}
  if(id==='expRepayGuide'){j.fieldDebt--;add(s,{focus:-10});consumeTime(s,1);note(s,'你誊卷偿还行旅护法人情。','人情');return s;}
  if(id==='expRetreat')return travel(s,'riverMarket');
  if(id==='expCondition'){add(s,{focus:-20});consumeTime(s,12);if(!s.ending){j.conditioning++;q.cultivationMonths+=12;note(s,`你将测流图与自身循环印证，运转准备 ${j.conditioning}/2；第一档支持水火，第二档支持回流；已有充分余裕的关口不必继续准备。`,'修行');}return s;}
  const months=['expBurst','expPush'].includes(id)?1:2,start=j.findings.length,burstStrong=q.method==='star'&&q.values.fire>=2,focus={expCareful:18,expFlow:8,expNurture:14,expBurst:24,expPush:18}[id];
  if(!ready(s,months)&&j.fieldAid>0){j.fieldAid--;note(s,'程上师留下的导气护持替你稳住这一段；已用完一次护法。','人情');}
  add(s,{focus:-focus});if(id==='expNurture'){add(s,{herbs:-1,wounds:-1});if(s.wounds<3)q.blocked=false;}
  if(id==='expBurst'){q.values.fire=Math.max(-2,q.values.fire-1);q.values.wood=Math.max(-2,q.values.wood-1);if(q.items.ward>0)q.items.ward--;else q.values.earth=Math.max(-2,q.values.earth-1);q.lastCause='泄火破开热隙，节省行程，但消耗木土承转；回程前可重行法门。';}
  if(id==='expPush'){const injury=1+(chapterRoll(s,'valley-push-'+start,{values:q.values,wounds:s.wounds,seed:s.chapterSeed})<.35?1:0);add(s,{wounds:injury});q.lastCause='不稳行气深入赤炉谷，环境反冲造成新伤。';note(s,`你冒险深入，暗伤 +${injury}；测流收益须以伤势偿付。`,'危险');}
  consumeTime(s,months);if(s.ending)return s;
  const count=id==='expBurst'&&start===1&&burstStrong?2:1;for(let i=0;i<count&&j.findings.length<3;i++){const name=SITE_NAMES[j.findings.length];j.findings.push(name);remember(s,'mingqi.survey.'+j.findings.length,{tags:['测流','朝元准备'],text:`在赤炉谷完成${name}，留下真实测流图。`});}
  note(s,`你完成${j.findings.slice(start).join('、')}。测流 ${j.findings.length}/3。${id==='expNurture'?'青华循药径也缓解了一点旧伤。':''}`,'探索');
  if(j.findings.length===3){j.vessel=true;j.sand=1;note(s,'三处流向合成测流图，并取得承流砂。它将支持朝元金水回流；你已完成本版探索目标，可留卷。静修最多两年形成有用的运转准备，回善渊观可确认开始五气朝元。','探索');}
  return s;
 }
 function summary(s){if(!s.mingqi?.fiveQi)return null;const j=journey(s);return {title:j.complete?'明气圆满':j.ascension?'五气朝元':j.vessel?'赤炉测流已成':'出山目标 · 赤炉测流',goal:j.complete?'五气朝元已成，下一境界未开放，可保留朝元留卷。':j.ascension?`正在行${GATE_NAMES[j.ascension.index]}，根据关口提示选择应对或中止。`:j.lastResult?.kind==='failed'?j.lastResult.reason+'静养、重行法门，改进薄弱处后可再试。':j.vessel?'测流图与承流砂支持朝元；可在善渊观开始，静修至多两年增加准备而非强制。':'在赤炉谷测明雾径、热隙、泉台三处流向；河灯市可补给。',findings:[...j.findings],conditioning:j.conditioning,fieldAid:j.fieldAid,fieldDebt:j.fieldDebt,complete:j.complete,ascDebt:j.ascDebt||0,ascAid:!!j.ascAid,lastResult:j.lastResult,attempts:j.attempts};}
 const GATE_NAMES=['水火相济','木土承转','金水回流'];
 function preparation(s){const q=s.mingqi.fiveQi,j=journey(s),p=D.points(s);return {method:q.method,values:{...q.values},wounds:s.wounds,foundation:[...s.foundationGrades],strain:s.foundationStrain||0,grade:s.openingResult.grade,spring:s.spring,harmony:D.springHarmony(s).score,affinity:{...p},conditioning:j.conditioning,vessel:j.vessel};}
 function gateScores(p){const v=p.values,root=Math.min(...p.foundation)>=2?1:0,high=p.grade.startsWith('上')?1:0,wound=p.wounds>=3?1:0;return [
  v.water+(p.method==='taiwei'?1:0)+root+high+(p.conditioning>=1?1:0)+(p.affinity.water>=3?1:0)-(v.fire>1?1:0)-wound,
  v.earth+(p.method==='green'?1:0)+root-(v.wood<0?1:0)-wound-(p.strain>=2?1:0),
  v.metal+v.water+(p.vessel?2:0)+(p.conditioning>=2?1:0)+(p.harmony>=1?1:0)+(p.affinity[({taiwei:'metal',star:'fire',green:'wood'})[p.method]||'water']>=4?1:0)+high-(Math.min(...p.foundation)<2?1:0)
 ];}
 function preview(s){if(!s.mingqi?.fiveQi)return null;const p=preparation(s),scores=gateScores(p);return GATE_NAMES.map((name,i)=>({name,level:scores[i]>=4?'余裕充足':scores[i]>=2?'准备可行':'有薄弱处',reason:[`肾水、心火、元基与开脉品相；运转准备${p.conditioning>=1?'已支持':'尚可增加'}水火相济。`,`脾土承接、肝木、旧伤与元基裂隙；${p.method==='green'?'青华温养有利':'可用慢导、疏脉或温土符处理'}。`,`肺金、肾水、测流成果及华池契合；${p.vessel?'测流图已指明回流':'测流图尚未完成'}。`][i]}));}
 function ascendAvailable(s){const q=s.mingqi?.fiveQi;if(!q||!s.mingqi.introComplete)return [];const j=journey(s);if(j.complete||s.pending)return [];const out=[],action=(id,label,detail,r=[])=>out.push(withReq({id,label,detail},r));
  if(s.location==='temple'){
   if(!j.ascAid)action('ascAskAid','请程上师护持朝元水环','一月、口粮 1；专护一次水火关，另留誊卷之约；行旅护法不能代替此约',[res(s,'grain',1)]);
   if((j.ascDebt||0)>0)action('ascRepay','誊卷偿还朝元护法','一月、口粮 1、心神 −10；偿还一次人情',[res(s,'grain',1),res(s,'focus',10)]);
   if(j.vessel&&!j.sand)action('ascSand','以灵草重新温养承流砂','一月、口粮 1、灵草 −2；只制备一份回流外物，不无限积存',[res(s,'grain',1),res(s,'herbs',2)]);
   if(j.vessel)action('ascStart','确认开始五气朝元','起关一月、口粮 1、心神 −12；后续三关通常各一月，慢导各两月，最低 4 粮不保证足够全程，三关全慢导需共 7 粮；中止不返还耗用，失败可恢复再试',[res(s,'grain',4),res(s,'focus',24),flag('循环稳定',qiStable(q),'先调和或疏通，不把短效丹当作永久朝元资格')]);
  }
  return out;
 }
 function assessOption(s,id,bonus,months,cost,label,extra=''){const a=journey(s).ascension,p=preparation(s);if(id==='ascArt'&&a.index===0)p.values.fire=Math.max(-2,p.values.fire-1);const score=gateScores(p)[a.index]+bonus;const expected=score>=4?'有充分余裕':score>=2?'可通过，仍可能带伤':score>=1?'此准备无法贯通，将带伤失败':'此准备无法贯通，有身死危险';return withReq({id,label,detail:`${months} 月、口粮 ${months}、心神 −${cost}；${expected}${extra?'；'+extra:''}`},[res(s,'grain',months),res(s,'focus',cost)]);}
 function options(s){const j=journey(s),a=j.ascension,q=s.mingqi?.fiveQi;if(s.pending!=='ascension'||!a||!q||s.ending)return [];const i=a.index,list=[assessOption(s,'ascProceed',0,1,8,'循现有准备行关'),assessOption(s,'ascSlow',3,2,14,'放缓导气，多用一月')];
  if(i===0&&q.arts.includes('drain'))list.push(assessOption(s,'ascArt',2,1,20,'以泄火术导心火','同时耗肝木 −1、脾土 −1，温土符护本次脾土'));
  if(i===1&&q.arts.includes('unblock'))list.push(assessOption(s,'ascArt',3,1,20,'以疏脉术打开木土关','不治疗旧伤'));
  if(i===1&&q.items.ward>0)list.push(assessOption(s,'ascWard',3,1,8,'用温土符护承转','消耗一符，只护本关'));
  if(i===0&&j.ascAid)list.push(assessOption(s,'ascAid',3,1,8,'请程上师护住水环','消耗本次具体护法，不增加其他关口把握'));
  if(i===2&&(j.sand||0)>0)list.push(assessOption(s,'ascSandUse',2,1,8,'以承流砂引金水回流','消耗一份承流砂'));
  list.push(withReq({id:'ascAbort',label:'主动中止，保留此生',detail:'一月、口粮 1、心神最多 −4；零粮也可中止，但会饥寒伤身；已耗用不返还，保留测流与学习，原随机不刷新'},[]));
  return list;
 }
 function closeAttempt(s,kind,reason){const j=ensure(s),a=j.ascension;j.lastResult={kind,reason,month:s.month,gate:a?.index??0};j.history.push({...j.lastResult,preparation:a?.preparation});j.ascension=null;s.pending=null;if(kind==='failed')j.failures++;note(s,reason+'测流图、法门与人情仍保留，可静养、重行循环，选择慢导／外物／具体护法后再试。','朝元');}
 function finishAscension(s){const j=ensure(s),a=j.ascension,kind=a.injuries?'wounded':'normal';j.complete=true;closeAttempt(s,kind,kind==='wounded'?'你带伤完成五气朝元。':'三关循环贯通，你完成五气朝元。');s.stage=5;s.ending={kind:'chapterComplete',grade:kind==='wounded'?'带伤圆满':'明气圆满',body:'第二章已完成，朝元之时的留卷已经保存。下一境界尚未开放，可翻阅卷册。'};const e=remember(s,'realm.chaoyuan',{tags:['五气朝元','明气圆满'],outcome:kind,text:s.ending.body});e.knownBy=j.ascAidUsed?['cheng']:[];const snapshot=D.copy(s);delete snapshot.chapterCheckpoint;delete snapshot.realmCheckpoint;s.realmCheckpoint={version:1,kind:'chaoyuan',seed:s.chapterSeed,state:snapshot};}
 function ascendStep(s,command){const [kind,id]=command.split(':');if(!s.mingqi?.fiveQi||s.ending)return s;if(kind==='action'&&!ascendAvailable(s).some(o=>o.id===id&&!o.disabled))return s;if(kind==='choice'&&!options(s).some(o=>o.id===id&&!o.disabled))return s;if(kind!=='action'&&kind!=='choice')return s;const j=ensure(s),q=s.mingqi.fiveQi;
  if(kind==='action'){
   if(!ascendAvailable(s).some(o=>o.id===id&&!o.disabled))return s;
   if(id==='ascAskAid'){j.ascAid={actor:'cheng',scope:'朝元水火环'};j.ascDebt=(j.ascDebt||0)+1;consumeTime(s,1);const e=remember(s,'mingqi.ascAid.'+s.month,{actors:['cheng'],tags:['护法','朝元'],text:'程上师另订朝元水环护持之约，留下一次誊卷人情。'});e.knownBy=['cheng'];note(s,'程上师应下只护水火关一次。此约独立于旧行旅护法；你欠下一次誊卷。','人情');return s;}
   if(id==='ascRepay'){j.ascDebt--;add(s,{focus:-10});consumeTime(s,1);note(s,'你完成誊卷，偿还这次朝元护法之约。','人情');return s;}
   if(id==='ascSand'){add(s,{herbs:-2});j.sand=1;consumeTime(s,1);note(s,'你以灵草温养一份承流砂，备用于金水回流关。','外物');return s;}
   if(id==='ascStart'){const p=preparation(s);j.attempts++;j.ascension={version:1,index:0,preparation:p,rolls:GATE_NAMES.map((_,i)=>chapterRoll(s,'chaoyuan-'+i,p)),injuries:0};add(s,{focus:-12});consumeTime(s,1);if(s.ending){j.ascension=null;return s;}s.pending='ascension';note(s,'你确认开始朝元。准备与三关随机已固定，可按薄弱处选择慢导、外物、护法或中止。','朝元');return s;}
  }
  if(kind!=='choice'||!options(s).some(o=>o.id===id&&!o.disabled))return s;
  if(id==='ascAbort'){add(s,{focus:-4});consumeTime(s,1);if(s.ending){j.ascension=null;s.pending=null;return s;}closeAttempt(s,'aborted','你主动中止朝元，保全此生；已经耗用的资粮与外物不返还。');return s;}
  const a=j.ascension,i=a.index,months=id==='ascSlow'?2:1,cost=id==='ascSlow'?14:id==='ascArt'?20:8;let bonus=0;
  if(id==='ascSlow')bonus=3;
  if(id==='ascWard'){q.items.ward--;bonus=3;}
  if(id==='ascAid'){j.ascAid=null;j.ascAidUsed=true;bonus=3;}
  if(id==='ascSandUse'){j.sand--;bonus=2;}
  if(id==='ascArt'){bonus=i===1?3:2;if(i===0){q.values.fire=Math.max(-2,q.values.fire-1);q.values.wood=Math.max(-2,q.values.wood-1);if(q.items.ward>0)q.items.ward--;else q.values.earth=Math.max(-2,q.values.earth-1);}}
  const score=gateScores(preparation(s))[i]+bonus,roll=a.rolls[i];add(s,{focus:-cost});
  if(score<2){const fatal=score<=0&&roll<.15;add(s,{wounds:fatal?6:2});consumeTime(s,months);if(s.ending){j.ascension=null;s.pending=null;return s;}closeAttempt(s,'failed',`${GATE_NAMES[i]}未能贯通：本环准备不足，留下两点暗伤；并非此前测流或法门无效。`);return s;}
  if(score<4&&roll<.2){add(s,{wounds:1});a.injuries++;note(s,`${GATE_NAMES[i]}勉强接续，留下一点暗伤。`,'朝元');}
  consumeTime(s,months);if(s.ending){j.ascension=null;s.pending=null;return s;}note(s,`${GATE_NAMES[i]}已通。${id==='ascSlow'?'你以额外一月换得稳妥导气。':''}`,'朝元');a.index++;if(a.index===3)finishAscension(s);return s;
 }

 return {options,preview,gateScores,preparation,available,step,summary,travelChoices,travel,journey,ensure,ready,temporary,consumeTime};
}if(typeof module==='object'&&module.exports)module.exports=createChapterTwo;else root.LingxiChapterTwoFactory=createChapterTwo;})(typeof globalThis!=='undefined'?globalThis:this);
