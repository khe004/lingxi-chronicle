const assert=require('node:assert/strict'),fs=require('node:fs');
const {simulate}=require('./balance-matrix.cjs'),{G,act,go,recover,survey}=require('./chapter-two-helpers.cjs');
const records=[];
for(const origin of ['scholar','merchant','herbalist'])for(const route of ['taiwei','star','green']){
 let initial,seed;for(seed=1;seed<=20;seed++){const run=simulate({origin,talent:'meridian',route,policy:'harmony-first',seed,returnState:true});if(run.state?.chapter==='mingqi'){initial=run.state;break;}}
 assert.ok(initial,'real opening success '+origin+'/'+route);let s=initial;const start=s.month,cp=JSON.stringify(s.chapterCheckpoint);
 s=go(recover(s,90),'mountain');while(s.grain<70||s.herbs<7){s=recover(s,40);s=act(s,'mingqiForage');assert.ok(!s.ending);}
 s=go(s,'temple');s=act(s,'mingqiSense');s=go(s,'mountain');s=act(s,'mingqiRidge');s=go(s,'temple');s=act(s,'mingqiFriend');s=act(s,'qiAwaken');
 s=survey(s,route);s=go(recover(s,90),'temple');if(!G.fiveQiSummary(s).stable)s=act(s,'qiCycle-'+route);s=act(recover(s,90),'ascStart');
 for(let i=0;i<3&&s.pending==='ascension';i++){const opts=G.options(s).filter(o=>!o.disabled);const choice=opts.find(o=>o.id==='ascProceed'&&/充分余裕|可通过/.test(o.detail))||opts.find(o=>o.id==='ascSlow'&&/充分余裕|可通过/.test(o.detail));assert.ok(choice);s=G.step(s,'choice:'+choice.id);}
 assert.equal(s.ending?.kind,'chapterComplete');assert.equal(JSON.stringify(s.chapterCheckpoint),cp);assert.ok(s.month-start<=96);assert.ok(s.lifeLimitMonths-s.ageMonths>=120);
 records.push({origin,route,seed,openingMonth:start,months:s.month-start,grade:s.openingResult.grade,remaining:s.lifeLimitMonths-s.ageMonths,grain:s.grain,wounds:s.wounds});
}
fs.writeFileSync('tests/reports/second-chapter-continuity.json',JSON.stringify({ruleVersion:G.RULE_VERSION,scope:'Nine complete public-action first-chapter to second-chapter runs; supplies obtained through actual mountain gathering, no injected chapter-two stock',records},null,2)+'\n');console.log(JSON.stringify(records,null,2));
