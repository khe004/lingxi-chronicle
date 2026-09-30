// Resource-sufficient acceptance matrix; scarcity is covered separately below.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {G,entry,act,go,recover,stable}=require('./chapter-two-helpers.cjs');
const clone=s=>JSON.parse(JSON.stringify(s)),methods={taiwei:3,star:4,green:5,breath:2};
function run(method,defect,grade,wounds,policy,seed){
 let s=entry(methods[method],wounds,defect,grade);s.chapterSeed=seed;
 const start=s.month,stock={grain:s.grain,herbs:s.herbs,silver:s.silver},commands=[];
 const action=id=>{const next=act(s,id);assert.notEqual(next.month===s.month&&JSON.stringify(next)===JSON.stringify(s),true,'stalled '+id);s=next;commands.push(id);};
 s=stable(s,method);
 if(policy==='mixed')for(const id of ['qiLearnDrain','qiLearnDrain','qiLearnUnblock','qiLearnUnblock']){s=recover(s,40);action(id);}
 s=go(recover(s),'riverMarket');if(policy==='items'||policy==='mixed')action('expWard');
 s=go(recover(s),'redValley');
 while(G.chapterTwoSummary(s).findings.length<3){s=recover(s,40);if(!G.fiveQiSummary(s).stable)action(method==='breath'?'qiBreath':'qiCycle-'+method);action(policy==='mixed'&&G.chapterTwoSummary(s).findings.length===1?'expBurst':method==='taiwei'?'expFlow':method==='green'?'expNurture':'expCareful');}
 const exploration=s.month-start;assert.ok(exploration<=36,'exploration budget');
 s=go(recover(s,90),'temple');if(!G.fiveQiSummary(s).stable||s.mingqi.fiveQi.values.wood<0)action(method==='breath'?'qiBreath':'qiCycle-'+method);
 if(policy==='aid'){action('ascAskAid');action('ascRepay');}
 s=recover(s,90);const checkpoint=clone(s.chapterCheckpoint);action('ascStart');
 while(s.pending==='ascension'&&!s.ending){const opts=G.options(s).filter(o=>!o.disabled),index=s.mingqi.fiveQi.journey.ascension.index;
  const usable=id=>opts.find(o=>o.id===id&&/可通过|充分余裕/.test(o.detail));
  let choice=policy==='aid'&&index===0?usable('ascAid'):policy==='items'&&index===1?usable('ascWard'):policy==='mixed'&&(index===1||index===0&&s.mingqi.fiveQi.values.fire>1&&s.mingqi.fiveQi.values.earth>=1)?usable('ascArt'):undefined;
  if(!choice&&policy!=='self'&&index===2)choice=usable('ascSandUse');
  choice=choice||usable('ascProceed')||usable('ascSlow')||opts.find(o=>o.id==='ascAbort');
  commands.push(choice.id);s=G.step(s,'choice:'+choice.id);
 }
 assert.equal(s.ending?.kind,'chapterComplete',JSON.stringify({method,defect,grade,wounds,policy,seed,result:s.mingqi.fiveQi.journey.lastResult}));
 assert.deepEqual(s.chapterCheckpoint,checkpoint);assert.deepEqual(G.migrate(clone(s)).realmCheckpoint,s.realmCheckpoint);
 const months=s.month-start,remaining=s.lifeLimitMonths-s.ageMonths;assert.ok(months<=96);assert.ok(remaining>=120);
 return {method,defect,grade,wounds,policy,seed,months,exploration,remaining,injuries:s.wounds,grain:stock.grain-s.grain,herbs:stock.herbs-s.herbs,silver:stock.silver-s.silver,commands};
}
const records=[];for(const method of Object.keys(methods))for(const defect of [false,true])for(const grade of ['中中品','上上品'])for(const wounds of [0,3])for(const policy of ['self','items','aid','mixed'])for(const seed of [11,37,81])records.push(run(method,defect,grade,wounds,policy,seed));
const policies={};for(const policy of ['self','items','aid','mixed']){const rows=records.filter(r=>r.policy===policy);policies[policy]={runs:rows.length,months:[Math.min(...rows.map(r=>r.months)),Math.max(...rows.map(r=>r.months))],meanMonths:rows.reduce((a,r)=>a+r.months,0)/rows.length,meanHerbs:rows.reduce((a,r)=>a+r.herbs,0)/rows.length,meanSilver:rows.reduce((a,r)=>a+r.silver,0)/rows.length,injured:rows.filter(r=>r.injuries>0).length};}
for(const policy of ['items','aid','mixed'])assert.notDeepEqual(records.find(r=>r.policy===policy).commands,records.find(r=>r.policy==='self').commands);
let base=entry();base=stable(base,'taiwei');base=go(recover(base),'redValley');for(let i=0;i<3;i++)base=act(recover(base),'expFlow');base=go(recover(base,90),'temple');base=act(base,'ascStart');
let boundaryCount=0;for(const grain of [0,1,4])for(const focus of [0,8,14])for(const wounds of [4,5])for(const remaining of [1,120]){let s=clone(base);Object.assign(s,{grain,focus,wounds,lifeLimitMonths:s.ageMonths+remaining});const opt=G.options(s).find(o=>o.id==='ascAbort');assert.ok(opt&&!opt.disabled);s=G.step(s,'choice:ascAbort');assert.equal(s.pending,null);assert.equal(s.mingqi.fiveQi.journey.ascension,null);boundaryCount++;}
// Stable circulation does not demand repeated upkeep or indefinite growth.
for(const method of Object.keys(methods)){let s=stable(entry(methods[method]),method),q=clone(s.mingqi.fiveQi.values);for(let i=0;i<36;i++)s=act(s,'mingqiRest');assert.ok(G.fiveQiSummary(s).stable);assert.deepEqual(s.mingqi.fiveQi.values,q);}
fs.writeFileSync('tests/reports/second-chapter-matrix.json',JSON.stringify({ruleVersion:G.RULE_VERSION,scope:'Resource-sufficient fixtures timed after entry() has completed initial milestones and qiAwaken; excludes initial milestones and extra supply gathering. Real public actions, four distinct policies; scarcity tested separately; no estimate of new-player win rate',runs:records.length,completed:records.length,boundaryCount,policies,records},null,2)+'\n');console.log(JSON.stringify({runs:records.length,boundaryCount,policies},null,2));
