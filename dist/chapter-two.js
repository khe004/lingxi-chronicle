(function(root){'use strict';function createChapterTwo(D){
 const {qiStable,add,turn,note,remember,chapterRoll,withRequirements:withReq,resourceRequirement:res,flagRequirement:flag,LOCATIONS}=D;
 const SITE_NAMES=['雾径辨流','热隙开路','泉台定脉'];
 function fresh(){return {version:1,findings:[],vessel:false,conditioning:0,fieldAid:0,fieldDebt:0,attempts:0,failures:0,history:[],ascension:null,complete:false};}
 function journey(s){return s.mingqi?.fiveQi?.journey||fresh();}
 function ensure(s){const q=s.mingqi.fiveQi;if(!q.journey)q.journey=fresh();return q.journey;}
 function temporary(s,months=1){const q=s.mingqi?.fiveQi;return !!q&&(q.temporaryUntil||0)-s.month>=months&&!q.blocked;}
 function ready(s,months=1){const q=s.mingqi?.fiveQi;return !!q&&(qiStable(q)||temporary(s,months));}
 function consumeTime(s,months){for(let i=0;i<months&&!s.ending;i++)turn(s);}
 function travelChoices(s){return Object.entries(LOCATIONS).filter(([id,l])=>l.region==='cangwu'||s.chapter==='mingqi'&&s.mingqi?.introComplete&&s.mingqi?.fiveQi).map(([id,l])=>{const months=l.region===(LOCATIONS[s.location]?.region)||l.region==='cangwu'&&LOCATIONS[s.location]?.region==='cangwu'?0:2;return {id,...l,months,disabled:!!(s.pending||s.combat||s.ending)||s.location===id||months>0&&(s.grain<months||s.focus<8),detail:months?'往来两月，口粮 2、心神 −8':'区域内往来不耗月'};});}
 function travel(s,id){const option=travelChoices(s).find(o=>o.id===id&&!o.disabled);if(!option)return s;if(option.months){add(s,{focus:-8});consumeTime(s,option.months);if(s.ending)return s;}s.location=id;s.trainingGear={staff:false,vest:false,shoes:false,talisman:false};note(s,`你来到${option.name}。${option.detail}。`,'行旅');return s;}
 function available(s){const q=s.mingqi?.fiveQi;if(!q||!s.mingqi.introComplete)return [];const j=journey(s),out=[],action=(id,label,detail,r=[])=>out.push(withReq({id,label,detail},r));
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
  if(j.vessel&&j.conditioning<2&&ready(s,12))action('expCondition','循法静修一年，熟悉测流图','十二月、口粮 12、心神 −20；运转准备 +1（最多两档），改善朝元水火与回流关',[res(s,'grain',12),res(s,'focus',20),flag('护卷旧契已结清',!s.story.luRoute||s.story.luRoute==='complete'||s.story.luDefaulted,'先处理旧护卷契，避免闭关误期')]);
  return out;
 }
 function step(s,command){const [kind,id]=command.split(':');if(kind!=='action'||!available(s).some(o=>o.id===id&&!o.disabled))return s;const q=s.mingqi.fiveQi,j=ensure(s);
  if(id==='expSupplies'){add(s,{silver:-2,grain:6});note(s,'你购下下一程口粮。','交易');return s;}
  if(id==='expTrade'){add(s,{herbs:-1,silver:3});note(s,'你售药备资。','交易');return s;}
  if(id==='expCooling'){add(s,{silver:-5});q.items.cooling++;note(s,'清心丹可在行气不稳时撑住一段两月测流，服药须覆盖全程。','交易');return s;}
  if(id==='expWard'){add(s,{silver:-4,herbs:-1});q.items.ward++;consumeTime(s,1);note(s,'你委托制成温土符。','交易');return s;}
  if(id==='expAskGuide'){j.fieldAid=1;j.fieldDebt++;consumeTime(s,1);const e=remember(s,'mingqi.field-guide',{actors:['cheng'],tags:['护法'],text:'程上师为一次雾径行气护法；留下誊卷之约。'});e.knownBy=['cheng'];note(s,'程上师只照看一段雾径，替你稳住一次不稳定行气。你应下一次誊卷之约。','人情');return s;}
  if(id==='expRepayGuide'){j.fieldDebt--;add(s,{focus:-10});consumeTime(s,1);note(s,'你誊卷偿还行旅护法人情。','人情');return s;}
  if(id==='expRetreat')return travel(s,'riverMarket');
  if(id==='expCondition'){add(s,{focus:-20});consumeTime(s,12);if(!s.ending){j.conditioning++;q.cultivationMonths+=12;note(s,`你将测流图与自身循环印证，运转准备 ${j.conditioning}/2；已改善后续朝元的水火及回流条件。`,'修行');}return s;}
  const months=['expBurst','expPush'].includes(id)?1:2,start=j.findings.length,burstStrong=q.method==='star'&&q.values.fire>=2,focus={expCareful:18,expFlow:8,expNurture:14,expBurst:24,expPush:18}[id];
  if(!ready(s,months)&&j.fieldAid>0){j.fieldAid--;note(s,'程上师留下的导气护持替你稳住这一段；已用完一次护法。','人情');}
  add(s,{focus:-focus});if(id==='expNurture'){add(s,{herbs:-1,wounds:-1});if(s.wounds<3)q.blocked=false;}
  if(id==='expBurst'){q.values.fire=Math.max(-2,q.values.fire-1);q.values.wood=Math.max(-2,q.values.wood-1);if(q.items.ward>0)q.items.ward--;else q.values.earth=Math.max(-2,q.values.earth-1);q.lastCause='泄火破开热隙，节省行程，但消耗木土承转；回程前可重行法门。';}
  if(id==='expPush'){const injury=1+(chapterRoll(s,'valley-push-'+start,{values:q.values,wounds:s.wounds,seed:s.chapterSeed})<.35?1:0);add(s,{wounds:injury});q.lastCause='不稳行气深入赤炉谷，环境反冲造成新伤。';note(s,`你冒险深入，暗伤 +${injury}；测流收益须以伤势偿付。`,'危险');}
  consumeTime(s,months);if(s.ending)return s;
  const count=id==='expBurst'&&start===1&&burstStrong?2:1;for(let i=0;i<count&&j.findings.length<3;i++){const name=SITE_NAMES[j.findings.length];j.findings.push(name);remember(s,'mingqi.survey.'+j.findings.length,{tags:['测流','朝元准备'],text:`在赤炉谷完成${name}，留下真实测流图。`});}
  note(s,`你完成${j.findings.slice(start).join('、')}。测流 ${j.findings.length}/3。${id==='expNurture'?'青华循药径也缓解了一点旧伤。':''}`,'探索');
  if(j.findings.length===3){j.vessel=true;note(s,'三处流向合成测流图，并取得承流砂。它将支持朝元金水回流；你已完成本版探索目标，可留卷。静修最多两年形成有用的运转准备，朝元尚待下一批。','探索');}
  return s;
 }
 function summary(s){if(!s.mingqi?.fiveQi)return null;const j=journey(s);return {title:j.vessel?'赤炉测流已成':'出山目标 · 赤炉测流',goal:j.vessel?'测流图与承流砂支持朝元准备；可循法静修至多两年。':'在赤炉谷测明雾径、热隙、泉台三处流向；河灯市可补给。',findings:[...j.findings],conditioning:j.conditioning,fieldAid:j.fieldAid,fieldDebt:j.fieldDebt,complete:j.complete};}
 return {available,step,summary,travelChoices,travel,journey,ensure,ready,temporary,consumeTime};
}if(typeof module==='object'&&module.exports)module.exports=createChapterTwo;else root.LingxiChapterTwoFactory=createChapterTwo;})(typeof globalThis!=='undefined'?globalThis:this);
