(function(root,factory){const game=factory();if(typeof module==='object'&&module.exports)module.exports=game;else root.LingxiEngine=game;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='lingxi-opening-v2';
const ELEMENTS={wood:'木',fire:'火',earth:'土',metal:'金',water:'水'};
const ELEMENT_BEATS={wood:'earth',earth:'water',water:'fire',fire:'metal',metal:'wood'};
const POLARITIES={yin:'阴',yang:'阳',harmony:'冲和'};
const AFFINITY_KEYS=[...Object.keys(ELEMENTS),'yin','yang'];
function innatePoints(elements=[],polarity='harmony'){
 const p=Object.fromEntries(AFFINITY_KEYS.map(k=>[k,0]));
 if(!elements.length)for(const k of Object.keys(ELEMENTS))p[k]=1;
 else for(const k of elements)p[k]=elements.length>1?2:3;
 if(polarity==='harmony'){p.yin=1;p.yang=1;}else p[polarity]=3;
 return p;
}
function points(s){if(!s.affinityPoints)s.affinityPoints=innatePoints(s.elements,s.polarity);
 const p=s.affinityPoints;return {...p,plain:Math.min(...Object.keys(ELEMENTS).map(k=>p[k]||0)),harmony:Math.min(p.yin||0,p.yang||0)};
}
function raiseAffinity(s,key){if(!AFFINITY_KEYS.includes(key))return false;
 if(!s.affinityPoints)s.affinityPoints=innatePoints(s.elements,s.polarity);
 if((s.affinityPoints[key]||0)>=6)return false;s.affinityPoints[key]=(s.affinityPoints[key]||0)+1;return true;
}
function upgradeAffinity(s){const prior=s.affinityPoints||innatePoints(s.elements||[],s.polarity||'harmony');
 const fresh=Object.fromEntries(AFFINITY_KEYS.map(k=>[k,prior[k]||0]));
 if(!s.elements?.length&&prior.plain>0&&Object.keys(ELEMENTS).every(k=>!fresh[k]))for(const k of Object.keys(ELEMENTS))fresh[k]=Math.max(1,Math.floor(prior.plain/2));
 if((s.polarity||'harmony')==='harmony'&&prior.harmony>0&&fresh.yin===0&&fresh.yang===0)fresh.yin=fresh.yang=Math.max(1,Math.floor(prior.harmony/2));
 s.affinityPoints=fresh;return s;
}
function affinityRequirement(item){return item.rarity==='基础'?0:item.rarity==='凡品'?2:item.rarity==='灵品'?3:4;}
function affinityMissing(s,item){const p=points(s),need=affinityRequirement(item);if(!need)return [];
 const result=[];if(item.elements?.length&&!item.elements.some(k=>(p[k]||0)>=need))result.push(`${item.elements.map(k=>ELEMENTS[k]).join('／')} ≥${need}${item.elements.length>1?'（择一）':''}`);
 if(item.polarity&&item.polarity!=='harmony'&&(p[item.polarity]||0)<need)result.push(`${POLARITIES[item.polarity]} ≥${need}`);
 return result;
}
function aspectCompatible(a,b){return (!a?.elements?.length||!b?.elements?.length||a.elements.some(x=>b.elements.includes(x)))&&(!a?.polarity||a.polarity==='harmony'||!b?.polarity||b.polarity==='harmony'||a.polarity===b.polarity);}
function techniqueMissing(s,id){const t=TECHNIQUES[id];if(!t)return ['未识招式'];const missing=affinityMissing(s,{...t,rarity:t.rarity||'凡品'});
 const manual=ITEMS.manual[s.manual],weapon=s.trainingGear?.staff?EQUIPMENT.weapon[1]:EQUIPMENT.weapon[0];
 if(!aspectCompatible(t,manual))missing.push(`当前功法${manual.name}不合`);
 if(!aspectCompatible(t,weapon))missing.push(`当前兵器${weapon.name}不合`);
 return missing;
}

function compatibleElements(input){const values=Array.isArray(input)?input:[];
 if(values.includes('plain'))return values.length===1;
 return new Set(values).size===values.length&&values.every(v=>Object.hasOwn(ELEMENTS,v))&&values.every((v,i)=>values.slice(i+1).every(w=>ELEMENT_BEATS[v]!==w&&ELEMENT_BEATS[w]!==v));
}
function affinity(elements=[],polarity='harmony'){return {elements:Array.isArray(elements)?elements.filter(v=>Object.hasOwn(ELEMENTS,v)):[],polarity:Object.hasOwn(POLARITIES,polarity)?polarity:'harmony'};}
function matchup(offense,defense){const a=affinity(offense?.elements,offense?.polarity),d=affinity(defense?.elements,defense?.polarity);
 const ap=offense?.points,dp=defense?.points,all=Object.keys(ELEMENTS);
 const elemental=(x,y)=>ELEMENT_BEATS[x]===y?1:ELEMENT_BEATS[y]===x?-1:0;
 const axes=(x,y)=>{if(!x.length&&!y.length)return 0;
  if(!x.length)return Math.max(...all.map(v=>y.reduce((sum,w)=>sum+elemental(v,w),0)/y.length));
  if(!y.length)return Math.min(...all.map(v=>x.reduce((sum,w)=>sum+elemental(w,v),0)/x.length));
  return x.reduce((sum,v)=>sum+y.reduce((total,w)=>total+elemental(v,w),0),0)/(x.length*y.length);
 };
 const base=axes(a.elements,d.elements);
 const strength=(aspect,p,defender=false)=>{if(!p)return aspect.length?1:0;
  const selected=aspect.length?aspect:all;return Math.min(1.5,selected.reduce((sum,k)=>sum+(p[k]||0),0)/selected.length/3);
 };
 const element=base*(base>=0?strength(a.elements,ap):strength(d.elements,dp));
 let polarity=0;
 const aY=a.polarity==='harmony',dY=d.polarity==='harmony';
 if(!aY&&!dY&&a.polarity!==d.polarity)polarity=1;
 else if(aY&&!dY)polarity=Math.min(1.5,Math.min(ap?.yin||0,ap?.yang||0)/3);
 else if(!aY&&dY)polarity=(1-Math.min(1,Math.min(dp?.yin||0,dp?.yang||0)/3))*(ap?Math.min(1.5,(ap[a.polarity]||0)/3):1);
 if(polarity===1&&ap)polarity=Math.min(1.5,(ap[a.polarity]||0)/3);
 return {element,polarity,attackFactor:1+element*.12+polarity*.08,defenseFactor:1-element*.10-polarity*.06};
}
const STAGES=['入门吐纳','凝元显意','淬元去芜','元成入真'];
const NEED=[36,52,70,88];
const OLD_NEED=[38,62,83,110];
const MANUAL_BONUS=[0,12,20,26,30,26,18];
const SPEED=[.12,3.5,5.4,11.5,10.5,10.5,5.2];
const REQUIREMENTS=[null,{root:2,wit:2},{root:3,wit:3},{root:4,wit:4,dao:4},{root:3,wit:5,dao:3},{root:4,wit:3,body:4},{root:3,wit:3}];
const ORIGINS={scholar:{name:'寒门书生',text:'识字解文，盘缠将尽；认识校卷人。',silver:5,grain:5,herbs:0,root:2,wit:5,body:2,social:3,insight:2,life:67},merchant:{name:'行商子弟',text:'带着资粮上山；旧识愿介绍商路护卷。',silver:14,grain:7,herbs:0,root:3,wit:3,body:3,social:5,insight:0,life:69},herbalist:{name:'采药人家',text:'熟悉山路与药径，欠缺典籍。',silver:3,grain:6,herbs:2,root:5,wit:2,body:5,social:2,insight:0,life:72}};
const TALENTS={clarity:{name:'慧心',text:'善解蚀文，参悟更快。'},meridian:{name:'清脉',text:'经脉稳固，冲关更有把握。'},vitality:{name:'长息',text:'寿元较长，休养更见成效。'}};
const LOCATIONS={temple:{name:'善渊观',text:'下院之中，名分与道书都来之不易。'},cliff:{name:'千丈岩',text:'同门在此论道、交换手抄残卷。'},mountain:{name:'苍梧后山',text:'药径与泉眼隐在云雾里。'},market:{name:'山下集市',text:'米粮、药材、拓本，各有价钱。'},arena:{name:'苍梧演武坪',text:'山壁间辟出一片平地，散修与下院弟子在此换招。坪中止于切磋，见负即收手。'}};
const ITEMS={manual:[{id:'breath',name:'《养息吐纳诀》',rarity:'基础',power:0},{id:'qingzhuan',name:'《青篆引脉帖》',rarity:'凡品',power:1},{id:'cheng-spirit',name:'《澄元导脉经》',rarity:'灵品',power:2},{id:'taiwei',name:'《太微玉脉真章》',rarity:'仙品',power:3},{id:'star-script',name:'《星篆玄息录》',rarity:'仙品',power:3.15},{id:'green-vein',name:'《青华养脉篇》',rarity:'仙品',power:2.75},{id:'caravan-script',name:'《行云寄脉书》',rarity:'灵品',power:1.5}],spring:[null,{id:'pine',name:'松风泉',rarity:'凡品',power:1},{id:'jade',name:'沉璧灵泉',rarity:'灵品',power:2},{id:'yaoguang',name:'瑶光玉液池',rarity:'仙品',power:3},{id:'bone-spring',name:'照骨玄泉',rarity:'仙品',power:2.8},{id:'stone-marrow',name:'苍梧石髓池',rarity:'仙品',power:3.1}],elixir:{id:'juqi',name:'聚气丹',rarity:'灵品',stageMin:0,stageMax:3}};
const MANUAL_AFFINITIES=[affinity(),affinity(['wood']),affinity(['water'],'yin'),affinity(['metal'],'yang'),affinity(['fire'],'yin'),affinity(['wood','fire'],'yang'),affinity(['earth','metal'])];
ITEMS.manual.forEach((item,i)=>Object.assign(item,{speed:SPEED[i],capBonus:MANUAL_BONUS[i],requirements:REQUIREMENTS[i]||{},stageMin:0,stageMax:3,...MANUAL_AFFINITIES[i]}));
const manualPower=s=>ITEMS.manual[s.manual]?.power??0;
const springPower=s=>ITEMS.spring[s.spring]?.power??0;
function syncIds(s){s.manualId=ITEMS.manual[s.manual]?.id||'breath';s.manualIds=[...new Set(s.manuals.map(n=>ITEMS.manual[n]?.id).filter(Boolean))];s.springId=ITEMS.spring[s.spring]?.id||null;return s;}
const rand=(rng)=>Math.max(0,Math.min(.999999,Number(rng())));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copy=(s)=>JSON.parse(JSON.stringify(s));
const year=(month)=>Math.max(1,Math.ceil(month/12));
const time=(month)=>month===0?'求道第1年 · 初入山门':`求道第${year(month)}年 · ${(month-1)%12+1}月`;
function openingStory(origin,talent){
 const origins={
  scholar:'你出身寒门书生之家，自幼与旧纸残卷为伴，虽家资清薄，却总觉得那些仙家异闻未必只是书生妄谈。',
  merchant:'你出身行商之家，自幼随商旅往来山川，见过奇人异士，也早知道凡俗之外另有一重天地。',
  herbalist:'你出身采药人家，自幼随长辈出入山野，识草木、辨山径，也曾在云深处见过凡理难解的泉气与踪迹。'
 };
 const talents={
  clarity:'你又生有慧心，读到晦涩处常能比旁人多悟一层。',
  meridian:'你又天生清脉，经络稳固，吐纳行气少有滞涩。',
  vitality:'你又天生长息，筋骨耐久，跋山涉水也比常人更能支撑。'
 };
 return `${origins[origin]||origins.scholar}${talents[talent]||talents.clarity}少时曾远远见过修士御风越岭，自此心中便存下一个念头：世间既有长生之道，为何不能是我？听闻东华洲苍梧山中有修行人传法，十六岁这年，你终于辞别故里，独自入山寻仙。凡人年华有限；若三十岁前仍不能开脉入道，你便只能收起这场仙梦，下山归家。善渊观只传了你最粗浅的《养息吐纳诀》。仙门就在眼前，而你尚在门外。`;
}
function create({name,origin='scholar',talent='clarity',gender='female',elements=[],polarity='harmony'}={}){
 const o=ORIGINS[origin]||ORIGINS.scholar,t=TALENTS[talent]?talent:'clarity';
 const clean=String(name||'').trim().slice(0,12)||'无名求道者';
 const body=o.body+(t==='vitality'?1:0);
 if(!compatibleElements(elements))throw new RangeError('五行相克或属性无效，不能同时选取');
 const birth=elements.includes('plain')?[]:elements;
const s={version:9,name:clean,gender:gender==='male'?'male':'female',elements:birth,polarity:Object.hasOwn(POLARITIES,polarity)?polarity:'harmony',affinityPoints:innatePoints(birth,polarity),knownTechniques:[],techniquePractice:{},codex:{people:[],beasts:[],combatants:[],combatantNotes:{},gear:[],elixirs:[]},origin:ORIGINS[origin]?origin:'scholar',talent:t,month:0,ageMonths:16*12,lifeLimitMonths:(o.life+(body-3)+(t==='vitality'?6:0))*12,location:'temple',stage:0,progress:0,totalProgress:0,practice:[0,0,0,0,0,0,0],affinityTraining:[0,0,0,0,0,0,0],studyWork:0,manuals:[0],foundationGrades:[],foundationStrain:0,focus:100,wounds:0,silver:o.silver,grain:o.grain,herbs:o.herbs,root:o.root+(t==='meridian'?1:0),wit:o.wit,body,dao:3,social:o.social,insight:o.insight+(t==='clarity'?2:0),foundation:0,manual:0,spring:0,npcFavor:{gu:0,ye:0,cheng:0,lu:0,wen:0},flags:{scroll:false,herbalist:false,mentor:false,elixir:false},elixirBoost:0,story:{arenaLessonSeen:false,yeRoute:null,yeMonth:null,yeFollowup:null,yeClue:null,guReacted:false,chengReacted:false,trueTextReady:false,trueTextNextMonth:0,guRoute:null,guMonth:null,chengRoute:null,chengMonth:null,guText:null,guFragments:false,guTextMonth:0,yeText:null,yeTextMonth:0,yeHerbWork:0,luRoute:null,luMonth:0,luCredential:false,luHeard:origin==='merchant',luDefaulted:false,sealPermit:false,stoneClue:false},events:{seen:[],nextMonth:0},trainingGear:{staff:false,vest:false,shoes:false,talisman:false},sparRecord:{wins:0,losses:0,withdrawals:0,draws:0,last:null},combat:null,pending:null,ending:null,logs:[],books:[]};
 note(s,openingStory(s.origin,s.talent),'开篇');return syncIds(s);
}
function note(s,text,tag='日常',effect=''){s.logs.push({month:s.month,text,tag,effect,...(s.batchActive&&['修行','日常','采集'].includes(tag)?{batch:true}:{})});if(s.logs.length>220)s.logs.shift();
 if(s.month>0&&s.month%12===0&&['开篇','人情','抉择','法门','华池','突破','开脉','结局','伤病','延寿','悟道','见闻'].includes(tag)){
  const current=s.books.find(b=>b.year===year(s.month));if(current&&!current.lines.includes(text))current.lines.push(text);
 }
}
function add(s,delta){for(const [k,v] of Object.entries(delta)){s[k]+=v;}s.focus=clamp(s.focus,0,100);s.wounds=clamp(s.wounds,0,6);s.grain=Math.max(0,s.grain);s.silver=Math.max(0,s.silver);s.herbs=Math.max(0,s.herbs);s.insight=clamp(s.insight,0,10);s.dao=clamp(s.dao,0,6);s.progress=Math.max(0,s.progress);}
function favor(s,who,amount){s.npcFavor[who]=clamp(s.npcFavor[who]+amount,-2,5);}
function springPath(s){const clue=s.story?.yeClue;
 const discount=s.story?.guSpringDiscount?1:0;
 if(clue==='trust')return {name:'叶青蘅同行',silver:2-discount,focus:20,ready:s.npcFavor.gu>=1&&s.npcFavor.ye>=1&&s.insight>=7};
 if(clue==='map')return {name:'叶青蘅旧图',silver:6-discount,focus:20,ready:s.npcFavor.gu>=1&&s.insight>=7};
 if(clue==='solo')return {name:'独行泉径',silver:0,focus:s.talent==='meridian'?30:35,ready:s.insight>=7&&(s.root>=4||s.wit>=5||s.dao>=4)};
 return {name:'故友引路',silver:4-discount,focus:20,ready:s.npcFavor.gu>=1&&s.npcFavor.ye>=1&&s.insight>=7};
}
function soloFocus(s){return s.talent==='clarity'?20:s.talent==='meridian'?22:25;}
function effectiveBody(s){const left=(s.lifeLimitMonths-s.ageMonths)/12;return Math.max(1,s.body-(left<=2?3:left<=5?2:left<=10?1:0));}
const SPAR_OPPONENTS={
 novice:{name:'守坪弟子 · 许砚',rank:'入门',text:'持练习木剑，以引气贯锋试探来客。',qi:42,nei:16,attack:12,defense:6,vitality:0,counter:0,evasion:8,elements:['fire'],polarity:'yang',gear:{weapon:'练习木剑'},artRanks:{flow:0},pattern:['strike','charge','burst','guard','flow']},
 keeper:{name:'护台人 · 石闻',rank:'凝元',text:'披镇山甲、执沉岩棍，守中带攻。',qi:108,nei:42,attack:28,defense:25,vitality:0,counter:0,evasion:17,elements:['earth'],polarity:'yin',gear:{weapon:'沉岩棍',armor:'镇山甲'},artRanks:{earthWard:1},pattern:['guard','earthWard','strike','charge','burst']},
 scrollBandit:{name:'截卷修士 · 赵七',rank:'入门',text:'袖中藏着半截卷轴，持短刀拦路。',qi:52,nei:14,attack:16,defense:8,vitality:0,counter:0,evasion:14,elements:['metal'],polarity:'yang',gear:{weapon:'断锋短刀'},artRanks:{paperCut:0},pattern:['charge','paperCut','strike','guard','burst']},
 springRival:{name:'寻泉客 · 闻秋',rank:'凝元',text:'熟悉苍梧地势，已在泉眼旁插下探脉竹签。',qi:68,nei:18,attack:19,defense:12,vitality:0,counter:0,evasion:15,elements:['wood'],polarity:'yin',gear:{weapon:'青竹杖'},artRanks:{flow:1},pattern:['flow','strike','charge','burst','guard']},
 swift:{name:'游坪客 · 柳惊鸿',rank:'淬元',text:'持霜纹短剑、踏轻云靴，以锋锐剑招取胜。',qi:108,nei:44,attack:31,defense:21,vitality:0,counter:9,evasion:23,elements:['metal'],polarity:'yang',gear:{weapon:'霜纹短剑',shoes:'轻云靴'},artRanks:{metalFlash:2},pattern:['strike','metalFlash','guard','charge','burst']},
 ape:{name:'青背灵猿',rank:'山中异兽',kind:'beast',text:'青背灵猿不持器物，天生会催木气化作藤影扑击。',qi:58,nei:12,attack:17,defense:9,vitality:2,counter:0,evasion:18,elements:['wood'],polarity:'harmony',innate:'藤影扑击',artRanks:{vinePounce:1},pattern:['strike','guard','vinePounce','charge','burst']}
};
const FOE_ARTS={flow:{name:'引气贯锋',cost:6,mult:1.25,hit:0,growth:{cost:[0,-1,-2],mult:[0,.07,.14]}},earthWard:{name:'磐岩镇脉',cost:9,mult:1.3,hit:0,guard:5,elements:['earth'],polarity:'yin',growth:{mult:[0,.06,.12]}},metalFlash:{name:'霜锋掠影',cost:12,mult:1.55,hit:6,elements:['metal'],polarity:'yang',growth:{mult:[0,.06,.12],hit:[0,2,4]}},vinePounce:{name:'藤影扑击',cost:6,mult:1.4,hit:8,innate:true,elements:['wood'],polarity:'harmony',growth:{mult:[0,.06,.12]}},paperCut:{name:'裂页断章',cost:5,mult:1.3,hit:3,elements:['metal'],polarity:'yang',growth:{mult:[0,.05,.1]}}};
Object.values(SPAR_OPPONENTS).forEach(foe=>{foe.points=points({affinityPoints:innatePoints(foe.elements,foe.polarity)});foe.qi+=3*foe.points.yang;foe.nei+=2*foe.points.yin;foe.attack+=foe.gear?.weapon?3:0;foe.defense+=foe.gear?.armor?4:0;foe.evasion+=foe.gear?.shoes?5:0;});
const TECHNIQUES={flow:{name:'引气贯锋',cost:6,mult:1.25,hit:0,stage:0,rarity:'基础',elements:null,polarity:null,growth:{cost:[0,-1,-2],mult:[0,.07,.14]},detail:'以内息贯入掌锋，伤害倍率 1.25'},interrupt:{name:'截息',cost:9,mult:.8,hit:0,stage:1,rarity:'凡品',elements:['water'],polarity:'yin',growth:{cost:[0,0,-1],interruptChance:[.55,.75,1]},detail:'截断对手蓄势，伤害倍率 0.8'},surge:{name:'归元一击',cost:14,mult:1.65,hit:-10,stage:2,rarity:'灵品',elements:['metal'],polarity:'yang',growth:{mult:[0,.12,.24],hit:[0,3,6]},detail:'汇聚真息重击，伤害倍率 1.65、命中 −10'}};
const PROFICIENCY_NAMES=['初学','熟稔','精通'];
function proficiencyRank(count){return count>=18?2:count>=6?1:0;}
function proficiencyName(rank){return PROFICIENCY_NAMES[Math.max(0,Math.min(2,rank||0))];}
function techniqueRank(s,id){return proficiencyRank(Math.max(0,s.techniquePractice?.[id]||0));}
function techniqueProgress(s,id){const count=Math.max(0,s.techniquePractice?.[id]||0),rank=techniqueRank(s,id);return {name:proficiencyName(rank),count,next:rank===2?null:rank===1?18:6};}
function rankedArtEffect(art,rank){if(!art)return null;const growth=art.growth||{},at=(key)=>growth[key]?.[rank]||0;return {cost:Math.max(0,art.cost+at('cost')),mult:art.mult+at('mult'),hit:art.hit+at('hit'),interruptChance:at('interruptChance'),rank};}
function techniqueEffect(id,rank){return rankedArtEffect(TECHNIQUES[id],rank);}
const EQUIPMENT={weapon:[{id:'bare',name:'空手',rarity:'基础',effect:'攻势无加成'},{id:'staff',name:'试锋木杖',rarity:'凡品',effect:'攻势 +3'}],armor:[{id:'robe',name:'粗布衣',rarity:'基础',effect:'护体无加成'},{id:'vest',name:'护心藤甲',rarity:'凡品',effect:'护体 +4'}],shoes:[{id:'cloth',name:'布履',rarity:'基础',effect:'闪避无加成'},{id:'shoes',name:'逐风履',rarity:'凡品',effect:'闪避 +5'}],relic:[{id:'none',name:'无佩器',rarity:'基础',effect:'未佩法器'},{id:'talisman',name:'试法铜符',rarity:'灵品',effect:'内息上限 +5；一场催动一次'}]};
const GEAR_AFFINITIES={staff:affinity(['water','wood'],'yang'),vest:affinity(['fire','earth'],'yin'),shoes:affinity(['wood','fire']),talisman:affinity(['earth','metal'],'yang')};
Object.values(EQUIPMENT).forEach(items=>items.forEach(item=>Object.assign(item,{stageMin:0,stageMax:item.rarity==='基础'?null:3,...(GEAR_AFFINITIES[item.id]||affinity())})));
const COMBAT_MANUAL={0:{},1:{attack:1},2:{attack:1,defense:1,nei:2},3:{defense:4,nei:2,counter:2},4:{nei:9,counter:4},5:{qi:12,defense:2},6:{attack:1,evasion:6}};
function combineAspect(primary,secondary){const p=affinity(primary?.elements,primary?.polarity),s=affinity(secondary?.elements,secondary?.polarity);
 return affinity(p.elements.length?p.elements:s.elements,p.polarity!=='harmony'?p.polarity:s.polarity);
}
function combatStats(s){const body=effectiveBody(s),gear=s.trainingGear||{},manual=COMBAT_MANUAL[s.manual]||{},stage=s.stage;
 const natural=affinity(s.elements,s.polarity),method=ITEMS.manual[s.manual];
 const offense=combineAspect(gear.staff?EQUIPMENT.weapon[1]:null,combineAspect(method,natural));offense.points=points(s);
 const defense=combineAspect(gear.vest?EQUIPMENT.armor[1]:gear.shoes?EQUIPMENT.shoes[1]:null,combineAspect(natural,method));defense.points=points(s);
 const p=points(s);
 return {qi:Math.max(1,30+8*body+6*stage-4*s.wounds+(manual.qi||0)+3*p.yang),nei:8+4*s.root+2*s.wit+5*stage+(manual.nei||0)+2*p.yin+(gear.talisman?5:0),attack:5+2*s.root+body+3*stage+(manual.attack||0)+(gear.staff?3:0)+2*p.fire,defense:3+2*body+2*stage+(manual.defense||0)+(gear.vest?4:0)+2*p.earth,vitality:Math.max(0,p.wood+(manual.vitality||0)),counter:Math.max(0,3*p.metal+(manual.counter||0)),evasion:8+3*p.water+Math.max(0,body-3)+(manual.evasion||0)+(gear.shoes?5:0),attackAspect:offense,defenseAspect:defense};
}
function foeArtEffect(foe,id){return rankedArtEffect(FOE_ARTS[id],foe.artRanks?.[id]||0);}
function sparIntent(foe,round){const intended=foe.pattern[(round-1)%foe.pattern.length];return FOE_ARTS[intended]&&foe.currentNei<foeArtEffect(foe,intended).cost?'strike':intended;}
function startSpar(s,id){const foe=SPAR_OPPONENTS[id];if(!foe||s.combat||s.pending||s.ending||s.location!=='arena')return;
 const player=combatStats(s);s.combat={id,round:1,player:{...player,currentQi:player.qi,currentNei:Math.max(0,Math.floor(player.nei*s.focus/100))},enemy:{...foe,currentQi:foe.qi,currentNei:foe.nei},intent:sparIntent(foe,1),relicUsed:false,history:[`守坪弟子敲响起手的木板。你与${foe.name}互相行礼。`]};discoverCombatant(s,id);
}
function startSceneCombat(s,id,scenario='mountainApe'){const foe=SPAR_OPPONENTS[id];if(!foe||s.combat)return;const player=combatStats(s);s.combat={id,storyEncounter:scenario,round:1,player:{...player,currentQi:player.qi,currentNei:Math.max(0,Math.floor(player.nei*s.focus/100))},enemy:{...foe,currentQi:foe.qi,currentNei:foe.nei},intent:sparIntent(foe,1),relicUsed:false,history:[scenario==='luEscort'?'坊市后巷，截卷修士拦在商队前。陆知衡护住卷箱，留给你一条出手的空隙。':scenario==='springContest'?'泉眼旁，寻泉客闻秋先一步布下探脉竹签，见你到来便横杖拦住去路。':'药径深处，青背灵猿挡在灵草丛前。你与它隔着藤枝对峙。']};discoverCombatant(s,id);}
function combatOptions(s){if(!s.combat)return [];const c=s.combat;
 return [{id:'strike',label:'寻常出手',detail:'不耗内息；以攻势直接进招'},{id:'guard',label:'敛息守势',detail:'本回合护体 +8、内息 +2；不出手'},...Object.entries(TECHNIQUES).filter(([id,t])=>s.knownTechniques?.includes(id)&&s.stage>=t.stage).map(([id,t])=>{const rank=techniqueRank(s,id),effect=techniqueEffect(id,rank);return {id,label:`${t.name} · ${proficiencyName(rank)}`,detail:`内息 −${effect.cost}；${id==='interrupt'?`截断机会 ${Math.round(effect.interruptChance*100)}%`: `伤害倍率 ${effect.mult.toFixed(2)}`}${id==='surge'?`、命中 ${effect.hit}`:''}${techniqueMissing(s,id).length?'；不可施展：'+techniqueMissing(s,id).join('、'):''}`,disabled:c.player.currentNei<effect.cost||techniqueMissing(s,id).length>0};}),...(s.trainingGear?.talisman?[{id:'relic',label:'催动试法铜符',detail:'内息 −4，本回合护体 +14；每场一次',disabled:c.relicUsed||c.player.currentNei<4}]:[]),{id:'withdraw',label:s.location==='arena'?'收手认输':'寻机逃离',detail:'切磋可随时退出；不受伤、不耗月'}];
}
function autoSpar(s,style,rng){if(!s.combat||!['aggressive','steady'].includes(style))return;
 const opponent=s.combat.enemy.name;
 while(s.combat){const c=s.combat,ready=id=>combatOptions(s).some(o=>o.id===id&&!o.disabled);let move='strike';
  if(style==='aggressive'){if(ready('surge'))move='surge';else if(ready('flow'))move='flow';else if(ready('interrupt')&&c.intent==='charge')move='interrupt';}
  else if(c.intent==='burst'&&ready('relic'))move='relic';else if(c.intent==='charge'&&ready('interrupt'))move='interrupt';else if(c.intent==='burst'&&c.player.currentQi<c.player.qi*.6)move='guard';else if(ready('flow')&&c.player.currentNei>=10)move='flow';
  sparRound(s,move,rng);
 }
 if(s.sparRecord?.last){s.sparRecord.last.style=style;s.sparRecord.last.history.unshift(`与${opponent}切磋，${style==='aggressive'?'你选择猛攻':'你选择稳扎稳打'}。`);}
}
function sparHit(attacker,defender,base,multiplier,hitBonus,guard,rng){const clash=matchup(attacker.attackAspect||attacker,defender.defenseAspect||defender);
 const odds=clamp(88+hitBonus-defender.evasion+3*clash.element+2*clash.polarity,10,95);
 if(rand(rng)*100>=odds)return {hit:false,damage:0,odds,clash};
 return {hit:true,damage:Math.max(1,Math.round((base+attacker.attack*multiplier*clash.attackFactor)*30/(30+defender.defense*clash.defenseFactor+guard))),odds,clash};
}
function counterStrike(defender,attacker,guarded,rng){if((defender.counter||0)<=0||defender.currentQi<=0)return 0;
 if(!guarded&&rand(rng)>=Math.min(.65,.15+defender.counter*.035))return 0;
 const damage=Math.max(1,Math.round(defender.counter*1.3*30/(30+attacker.defense)));
 attacker.currentQi=Math.max(0,attacker.currentQi-damage);return damage;
}
function recoverQi(person){if(person.currentQi<=0)return 0;const amount=Math.min(person.qi-person.currentQi,Math.min(3,Math.floor(((person.vitality||0)+1)/2)));
 person.currentQi+=amount;return amount;
}
function finishSpar(s,result){const c=s.combat,storyEncounter=c.storyEncounter,record=s.sparRecord||(s.sparRecord={wins:0,losses:0,withdrawals:0,draws:0,last:null});
 if(storyEncounter==='springContest'){
  if(result==='胜出'){c.history[c.history.length-1]+='闻秋收杖退开，承认你赢得这次优先探查权；石髓池仍须另备灵草与心神。';s.story.stoneClue=true;s.story.stonePriority=true;s.story.stoneMissed=false;s.story.springRivalFavor=(s.story.springRivalFavor||0)+1;favor(s,'wen',1);discover(s,'people','wen');recordCombatantObservation(s,'springRival','争泉时以守势和探脉步法应战。');}
  else if(result==='失手'){c.history[c.history.length-1]+='你被闻秋逼退，错过这次优先探查机会，泉眼仍可另寻。';s.story.stoneMissed=true;s.story.springRivalFavor=(s.story.springRivalFavor||0)-1;favor(s,'wen',-1);discover(s,'people','wen');add(s,{wounds:1});recordCombatantObservation(s,'springRival','争泉时不肯让步，擅长以竹杖封住近路。');}
  else {c.history[c.history.length-1]+='你主动收手，闻秋先行探泉；这次优先机会已过，山中仍有别的泉径。';s.story.stoneMissed=true;recordCombatantObservation(s,'springRival','争泉后先行探泉，没有追击。');}
  note(s,s.story.stonePriority?'你在后山争泉中胜过闻秋，取得石髓池本次优先探查权；入池仍要自行准备。':s.story.stoneMissed?'你在后山争泉中未能取得本次优先权，但其他泉径仍可探访。':'你让闻秋先行探泉，换得一条石髓泉脉线索。','见闻',s.story.stonePriority?'灵草消耗 −1':'');
 }else if(storyEncounter==='mountainApe'){
  if(result==='胜出'){c.history[c.history.length-1]+='青背灵猿护住药丛，却被你击退。它退回林间，你采得灵草，也记下它守地护食的习性。';add(s,{herbs:2});s.story.apeEncounter='won';recordCombatantObservation(s,'ape','守地护食，似乎在护着药丛。');}
  else if(result==='失手'){c.history[c.history.length-1]+='你气力不继，只得退回药径，手臂被藤枝划出一道伤口。灵猿仍守着药丛。';add(s,{wounds:1});s.story.apeEncounter='lost';recordCombatantObservation(s,'ape','守在药丛前，不容外人靠近。');}
  else if(result==='认输'){c.history[c.history.length-1]+='你寻隙退回药径，放弃眼前的灵草。青背灵猿没有追来。';s.story.apeEncounter='retreated';recordCombatantObservation(s,'ape','守在药丛附近，没有追出林缘。');}
  note(s,s.story.apeEncounter==='won'?'你击退青背灵猿，采得灵草；它守护药丛的缘由仍值得查访。':s.story.apeEncounter==='lost'?'你在药径与青背灵猿交手失利，带伤退回；此事并未断绝后续探查。':'你从药径退开，避过与青背灵猿冲突，也放弃了这次采集。','见闻',s.story.apeEncounter==='won'?'灵草 +2':s.story.apeEncounter==='lost'?'暗伤 +1':'');
  if(s.wounds>=6)end(s,'death','药径交手留下的伤势牵动旧伤，你终究没能走出苍梧山。');
 }else if(storyEncounter==='luEscort'){
  if(result==='胜出'){c.history[c.history.length-1]+='截卷修士被你逼退，陆知衡护住卷箱，将散卷托付给你。';s.story.luBattle='won';s.story.luRoute='fight';favor(s,'lu',2);earnManual(s,6,'你替陆知衡击退截卷修士，护住了散卷');}
  else if(result==='失手'){c.history[c.history.length-1]+='你不敌截卷修士，几页散卷被撕裂。陆知衡带卷脱身，约你日后补偿修复。';s.story.luBattle='lost';s.story.luRoute='fightDelayed';s.story.luPapersDamaged=true;favor(s,'lu',-1);}
  else {c.history[c.history.length-1]+='你寻机撤出后巷，陆知衡带着卷箱脱身，但几页散卷遗失。日后仍可补偿修复。';s.story.luBattle='retreated';s.story.luRoute='fightDelayed';s.story.luPapersDamaged=true;}
  note(s,s.story.luBattle==='won'?'你在坊市后巷护住陆知衡的散卷，击退截卷修士，赢得他的信任。':s.story.luBattle==='lost'?'护卷失手，散卷受损，陆知衡将契约延期；补偿修复后仍可继续履约。':'你撤出后巷，陆知衡带卷脱身，但散卷遗失数页；补偿修复后仍可继续履约。','见闻',s.story.luBattle==='won'?'陆知衡好感 +2 · 得《行云寄脉书》':s.story.luBattle==='lost'?'陆知衡好感 −1 · 契约延期':'契约延期');
 }else{
  if(result==='失手')c.history[c.history.length-1]+='你脚下不稳，抬手示意认负。对手当即收招，守坪弟子判你此场失手。';
  else if(result==='平局')c.history[c.history.length-1]+='守坪弟子敲板叫停，双方各自收势，此战以平局作罢。';
  else if(result==='认输')c.history[c.history.length-1]+='守坪弟子记下结果，这场切磋到此为止。';
  record[result==='胜出'?'wins':result==='失手'?'losses':result==='平局'?'draws':'withdrawals']=(record[result==='胜出'?'wins':result==='失手'?'losses':result==='平局'?'draws':'withdrawals']||0)+1;
  record.last={opponent:c.enemy.name,result,rounds:c.round,history:c.history.slice(),qi:c.player.currentQi,nei:c.player.currentNei,playerAspect:c.player.attackAspect,enemyAspect:{elements:c.enemy.elements,polarity:c.enemy.polarity}};
  s.story.arenaFirstWins=s.story.arenaFirstWins||{};let reward='';
  if(result==='胜出'&&!s.story.arenaFirstWins[c.id]){s.story.arenaFirstWins[c.id]=true;if(c.id==='novice'){add(s,{insight:1});reward='心得 +1';}else if(c.id==='keeper'){s.dao=clamp(s.dao+1,0,6);reward='道心 +1';}else if(c.id==='swift'){add(s,{silver:4});reward='银钱 +4';}if(reward){c.history[c.history.length-1]+=`守坪弟子记下你的首次胜绩，并送上演武首胜之礼（${reward}）。`;record.last.history=c.history.slice();}}
  note(s,`你将这个月的大半闲暇用在演武坪。与${c.enemy.name}正式换招后，又调息养气、复盘得失，并以数次短练印证这一战。`,'演武',`耗时 1 月${reward?' · 首胜 '+reward:''}`);turn(s);
 }
 if(storyEncounter)record.last={opponent:c.enemy.name,result,rounds:c.round,history:c.history.slice(),qi:c.player.currentQi,nei:c.player.currentNei,playerAspect:c.player.attackAspect,enemyAspect:{elements:c.enemy.elements,polarity:c.enemy.polarity},storyEncounter};
 s.combat=null;
}
function combatFlavor(move,turn,enemy=false){const pools={flow:['真气循锋而走，劲力直贯中门','气机沿兵刃骤然一紧，锋势随之递进','一口真息贯入锋端，趁隙直取门户'],interrupt:['抢在换气之际截入，逼得气机一滞','窥准行气转折处递招，意在截断真息','贴着对方气机起伏抢进半步，截其吐纳'],surge:['周身真息骤归一处，沉势尽数压下','凝息归元，蓄起的劲力顷刻尽出','不再留力，将一身真息聚作一击'],strike:['寻到门户的一线空隙，顺势递出一击','踏前半步，趁势向中门出手','试探之后忽然变势，直取近身空处'],burst:['沉肩蓄力后猛然发劲','将蓄起的劲力一口气压上','脚下定势，重劲随身而发'],guard:['收住门户，稳稳护住中线','敛息沉肩，把攻势化在身前','不急着抢攻，先稳住自身架势'],dodge:['身形一错，让来势擦身而过','看准锋势侧身避开','脚下轻转，恰好让过这一击']};const arr=pools[move]||pools.strike;return arr[(turn+(enemy?1:0))%arr.length];}
function sparRound(s,id,rng){const c=s.combat;if(!c||!combatOptions(s).some(o=>o.id===id&&!o.disabled))return;
 if(id==='withdraw'){c.history.push('你举手认输，对方当即收招。');finishSpar(s,'认输');return;}
 const p=c.player,e=c.enemy,intent=c.intent,turn=c.round;
 let guard=0,interrupted=false,line=`第${turn}合：`,playerMissed=false;
 if(id==='guard'){p.currentNei=Math.min(p.nei,p.currentNei+2);guard=8;line+=`你${combatFlavor('guard',turn)}，调匀一口内息。`;}
 else if(id==='relic'){p.currentNei-=4;c.relicUsed=true;guard=14;line+='你催动试法铜符，清光护在身前。';}
 else {const rank=techniqueRank(s,id),effect=techniqueEffect(id,rank);const [cost,mult,hitBonus,name]=id==='strike'?[0,1,0,'寻常出手']:[effect.cost,effect.mult,effect.hit,TECHNIQUES[id].name];p.currentNei-=cost;
  let advanced=false;
  if(effect){s.techniquePractice=s.techniquePractice||{};s.techniquePractice[id]=(s.techniquePractice[id]||0)+1;advanced=techniqueRank(s,id)>rank;}
  const art=TECHNIQUES[id],attackAspect=art?.elements?{...affinity(art.elements,art.polarity),points:p.attackAspect.points}:p.attackAspect;
  const hit=sparHit({...p,attackAspect},e,0,mult,hitBonus,intent==='guard'?8:intent==='earthWard'?5:0,rng);
  if(hit.hit){e.currentQi=Math.max(0,e.currentQi-hit.damage);line+=`你以「${name}」${effect?`（${proficiencyName(rank)}）`:''}${combatFlavor(id==='strike'?'strike':id,turn)}，削去气血 ${hit.damage}。`;interrupted=id==='interrupt'&&intent==='charge'&&rand(rng)<effect.interruptChance;}
  else {line+=`你以「${name}」${effect?`（${proficiencyName(rank)}）`:''}探入，对方${combatFlavor('dodge',turn,true)}。`;playerMissed=true;}
  if(advanced)line+=`你对「${name}」的领悟更深，熟练度升至${proficiencyName(techniqueRank(s,id))}。`;
 }
 if(e.currentQi===0){c.history.push(line+'对手示意认负。');finishSpar(s,'胜出');return;}
 if(id!=='guard'&&id!=='relic'&&(intent==='guard'||playerMissed)){
  const reflected=counterStrike(e,p,intent==='guard',rng);if(reflected)line+=`对方趁势反制，你的气血 −${reflected}。`;
  if(p.currentQi===0){c.history.push(line);finishSpar(s,'失手');return;}
 }
 if(interrupted){line+='对方蓄势被你截断，只得退开半步。';c.intent='strike';}
 else if(intent==='guard'){e.currentNei=Math.min(e.nei,e.currentNei+2);line+=`对方${combatFlavor('guard',turn,true)}，吐息回气。`;}
 else if(intent==='charge')line+='对方沉肩运气，下一招将重击。';
 else {const heavy=intent==='burst'&&e.currentNei>=6,art=FOE_ARTS[intent],artEffect=foeArtEffect(e,intent);if(heavy)e.currentNei-=6;if(artEffect)e.currentNei-=artEffect.cost;
  const hit=sparHit(e,id==='relic'?{...p,defenseAspect:{...EQUIPMENT.relic[1],points:p.defenseAspect.points}}:p,0,artEffect?.mult||(heavy?1.6:1),artEffect?.hit||(heavy?-5:0),guard,rng);
  const move=art?`${art.innate?'天赋神通':'招式'}「${art.name}」（${proficiencyName(artEffect.rank)}）`:heavy?'「蓄力重击」':'「寻常出手」';
  const flavorKey=art?(intent==='flow'?'flow':intent):heavy?'burst':'strike';
  if(hit.hit){p.currentQi=Math.max(0,p.currentQi-hit.damage);line+=art?`对方施展${move}，${combatFlavor(flavorKey,turn,true)}，你的气血 −${hit.damage}。`:`对方以${move}${combatFlavor(flavorKey,turn,true)}，你的气血 −${hit.damage}。`;}
  else line+=art?`对方施展${move}，你${combatFlavor('dodge',turn)}。`:`对方以${move}攻来，你${combatFlavor('dodge',turn)}。`;
  if(art)recordCombatantArt(s,c.id,intent);
  if(p.currentQi>0&&(guard>0||!hit.hit)){
   const reflected=counterStrike(p,e,guard>0,rng);if(reflected)line+=`你趁势反制，对方气血 −${reflected}。`;
  }
 }
 if(e.currentQi===0){c.history.push(line+'对手示意认负。');finishSpar(s,'胜出');return;}
 if(p.currentQi>0){const healP=recoverQi(p),healE=recoverQi(e);if(healP)line+=`你回生气血 ${healP}。`;if(healE)line+=`对方回生气血 ${healE}。`;}
 c.history.push(line);
 if(p.currentQi===0){finishSpar(s,'失手');return;}
 if(turn>=30){finishSpar(s,'平局');return;}
 c.round++;if(!interrupted)c.intent=sparIntent(e,c.round);
}
function cap(s,manual=s.manual){return NEED[s.stage]+(ITEMS.manual[manual]?.capBonus||0);}
function cultivationGain(s){const boost=(s.elixirBoost||0)>0?1.25:1;return Math.round((ITEMS.manual[s.manual]?.speed||SPEED[0])*(1+(s.wit-3)*.06)*boost*100)/100;}
function eventProgressGain(s,amount){
 const remainingPractice=s.manual===1&&s.root<3?Math.max(0,16-s.practice[1]):s.manual===2&&!s.manuals.some(m=>ITEMS.manual[m]?.rarity==='仙品')?Math.max(0,14-s.practice[2]):0;
 return Math.max(0,Math.round(Math.min(amount,cap(s)-s.progress-remainingPractice*cultivationGain(s))*100)/100);
}
function studyNeed(wit){return 2+(wit-2)**2;}
function study(s){if(s.wit>=8)return;
 s.studyWork++;
 if(s.studyWork>=studyNeed(s.wit)){s.studyWork=0;s.wit++;note(s,`反复推敲蚀文之后，你的悟性提升至 ${s.wit}。`,'悟道','悟性 +1');}
}
function missingAttributes(s,manual){return Object.entries(ITEMS.manual[manual]?.requirements||{}).filter(([k,v])=>s[k]<v).map(([k,v])=>`${{root:'根骨',wit:'悟性',dao:'道心',body:'体魄'}[k]} ${v}`);}
function stageChance(s,mode='patient'){
 const raw=8+manualPower(s)*9+s.root*2+s.dao*2+effectiveBody(s)*1.5+Math.min(16,Math.floor(s.totalProgress/25))-(s.stage*7)-(s.wounds*8)+(s.talent==='meridian'?5:0)+(mode==='patient'?12:-8);
 return clamp(Math.floor(raw),5,85);
}
function stageGrade(s,mode){const score=manualPower(s)*2+s.root+s.dao+Math.floor(s.totalProgress/70)+(mode==='patient'?3:0)-s.wounds*2;
 return score>=17?3:score>=12?2:1;
}
function downgradeChance(s,mode){return s.foundationStrain&&stageGrade(s,mode)>1?Math.min(80,10+s.foundationStrain*20+(mode==='hasty'?10:0)):0;}
function affinityTrainingNeed(s,manual){
 const method=ITEMS.manual[manual],keys=[...(method.elements.length?method.elements:Object.keys(ELEMENTS)),...(method.polarity==='harmony'?['yin','yang']:[method.polarity])];
 const level=Math.max(...keys.map(k=>s.affinityPoints?.[k]||0));
 const base=method.rarity==='仙品'?10:method.rarity==='灵品'?14:method.rarity==='凡品'?18:36;
 return Math.ceil(base*(level>=5?2.8:level>=4?1.7:1));
}
function trainAttribute(s){const n=++s.practice[s.manual],manual=s.manual;
 s.affinityTraining=s.affinityTraining||Array(ITEMS.manual.length).fill(0);s.affinityTraining[manual]=(s.affinityTraining[manual]||0)+1;
 const need=affinityTrainingNeed(s,manual);
 if(s.affinityTraining[manual]>=need){s.affinityTraining[manual]=0;const method=ITEMS.manual[manual],elements=method.elements.length?method.elements:Object.keys(ELEMENTS),polarities=method.polarity==='harmony'?['yin','yang']:[method.polarity];
  const raised=[...elements,...polarities].filter(key=>raiseAffinity(s,key));
  if(raised.length)note(s,`你长期循${method.name}调息，${raised.map(key=>ELEMENTS[key]||POLARITIES[key]).join('、')}的亲和更进一步。`,'修行');}

 if(manual===0&&n%48===0&&s.wit<8){s.wit++;note(s,'持久吐纳之后，你对行气的悟性略有增进。','修行');}
 if(manual===1&&n%16===0&&s.root<8){s.root++;note(s,'青篆行气渐熟，根骨受到温养。','修行');}
 if(manual===2&&n%14===0){if(s.root<8)s.root++;if(s.dao<6)s.dao++;note(s,'澄元导脉经淬炼根骨，也使求道之心更笃定。','修行');}
 if(manual===3&&n%12===0&&s.body<8){s.body++;s.lifeLimitMonths+=12;note(s,'太微真章洗炼形神，体魄提升，寿限延长一年。','延寿');}
 if(manual===4&&n%14===0){if(s.wit<8)s.wit++;else add(s,{insight:1});note(s,'星篆逐渐明朗，你对蚀文的领悟更深。','悟道');}
 if(manual===5&&n%12===0&&s.herbs>=1){add(s,{herbs:-1,wounds:-1});if(s.body<8){s.body++;s.lifeLimitMonths+=24;}note(s,'你耗去一株灵草依青华法温养经脉，伤势渐轻，体魄提升并延寿两年。','延寿','灵草 −1');}
 if(manual===6&&n%16===0&&s.social<8){s.social++;note(s,'行云寄脉书中人脉与气脉互参，你更懂得与同道往来。','修行');}
}
function upgradeRoutes(s){s.version=7;upgradeAffinity(s);s.practice=Array.from({length:ITEMS.manual.length},(_,i)=>s.practice?.[i]||0);s.npcFavor={gu:0,ye:0,cheng:0,wen:0,...s.npcFavor,lu:s.npcFavor?.lu||0,wen:s.npcFavor?.wen||0};s.story={guText:null,guFragments:false,guTextMonth:0,yeText:null,yeTextMonth:0,yeHerbWork:0,luRoute:null,luMonth:0,luCredential:false,luHeard:s.origin==='merchant',luDefaulted:false,sealPermit:false,stoneClue:false,...s.story};return syncIds(s);}
function upgradeStory(s){
 const entries=[...s.logs,...s.books.flatMap(b=>b.lines||[]).map(text=>({text}))];
 const encounter=entries.find(e=>/分药救了山中采药人叶青蘅|为叶青蘅指路|绕过受伤的采药人/.test(e.text));
 const route=encounter?.text.includes('分药救了')?'help':encounter?.text.includes('为叶青蘅指路')?'trade':encounter?.text.includes('绕过受伤')?'leave':null;
 s.story={yeRoute:route,yeMonth:Number.isFinite(encounter?.month)?encounter.month:s.month,yeFollowup:null,yeClue:null,guReacted:false,chengReacted:false,trueTextReady:false,trueTextNextMonth:0};
 s.version=6;return s;
}
function migrate(input){if(!input||!Array.isArray(input.logs)||!Array.isArray(input.books)||!Number.isFinite(input.ageMonths))return null;
 if(input.version===9||input.version===8||input.version===7){input.version=9;input.techniquePractice=input.techniquePractice||{};input.affinityTraining=Array.from({length:ITEMS.manual.length},(_,i)=>input.affinityTraining?.[i]||0);input.npcFavor={gu:0,ye:0,cheng:0,lu:0,wen:0,...input.npcFavor};input.elixirBoost=Number.isFinite(input.elixirBoost)?input.elixirBoost:(input.flags?.elixir?6:0);
  if(!input.affinityPoints||'plain' in input.affinityPoints||'harmony' in input.affinityPoints){input=upgradeAffinity(copy(input));}
  input.codex=input.codex||{};input.codex.combatants=input.codex.combatants||[];input.codex.combatantNotes=input.codex.combatantNotes||{};input.codex.elixirs=(input.codex.elixirs||[]).filter(id=>id!=='yangyuan');
  for(const id of input.codex.beasts||[]){if(!input.codex.combatants.includes(id)){input.codex.combatants.push(id);const foe=SPAR_OPPONENTS[id],seenArts=foe?.innate?Object.keys(FOE_ARTS).filter(art=>FOE_ARTS[art].name===foe.innate):[];input.codex.combatantNotes[id]={kind:'beast',seenArts,seenGear:[]};}}
  const visitedMarket=input.location==='market'||input.flags?.elixir||input.logs.some(e=>e.text==='你来到山下集市。');
  if(visitedMarket&&!input.codex.elixirs.includes(ITEMS.elixir.id))input.codex.elixirs.push(ITEMS.elixir.id);return input;
 }
 if(input.version===6)return upgradeRoutes(copy(input));
 if(input.version===5)return upgradeRoutes(upgradeStory(copy(input)));
 if(input.version!==2&&input.version!==3&&input.version!==4)return null;
 if(input.version===4){const s=copy(input);s.studyWork=0;return upgradeRoutes(upgradeStory(s));}
 const s=copy(input),o=ORIGINS[s.origin]||ORIGINS.scholar;
 if(s.version===2){s.version=3;s.body=o.body+(s.talent==='vitality'?1:0);s.dao=3;s.social=o.social;s.npcFavor={gu:0,ye:0,cheng:0};
 // Event prose was saved in both the recent log and annual books; deduplicate it.
 const seen=new Set([...s.logs.map(e=>e.text),...s.books.flatMap(b=>b.lines||[])]);
 for(const line of seen){
  if(line.includes('如实告诉同门顾闻溪')){favor(s,'gu',2);favor(s,'cheng',1);}
  if(line.includes('顾闻溪却察觉'))favor(s,'gu',-1);
  if(line.includes('释文卖给抄书人'))favor(s,'gu',-1);
  if(line.includes('分药救了山中采药人叶青蘅')){favor(s,'ye',2);favor(s,'cheng',1);}
  if(line.includes('为叶青蘅指路'))favor(s,'ye',-1);
  if(line.includes('替程上师整理旧卷'))favor(s,'cheng',1);
  if(line.includes('上师告诫：真章虽妙'))favor(s,'cheng',-1);
  if(line.includes('反复淬炼元灵'))s.dao=clamp(s.dao+1,0,6);
 }
 delete s.trust;}
 // Earlier chapters used a different progress scale. Preserve progress toward the current stage.
 const oldStage=clamp(s.stage,0,3);s.progress=Math.round(Math.max(0,s.progress)/OLD_NEED[oldStage]*(NEED[oldStage]+MANUAL_BONUS[s.manual])*100)/100;
 s.totalProgress=NEED.slice(0,oldStage).reduce((sum,n)=>sum+n,0)+s.progress;
 s.practice=[0,0,0,0];s.manuals=Array.from({length:s.manual+1},(_,i)=>i);
 const oldSteps=[...new Set([...s.books.flatMap(b=>b.lines||[]),...s.logs.map(e=>e.text)].filter(x=>/反复淬炼元灵|强行催动元灵/.test(x)))];
 s.foundationGrades=Array.from({length:oldStage},(_,i)=>oldSteps[i]?.includes('反复淬炼元灵')?2:i<s.foundation?2:1);
 if(s.pending==='stage'&&s.progress<cap(s))s.pending=null;
 s.studyWork=0;return upgradeRoutes(upgradeStory(s));
}
function book(s,yr,partial=false){
 if(s.books.some(b=>b.year===yr))return;
 const entries=s.logs.filter(x=>x.month>=(yr===1?0:(yr-1)*12+1)&&x.month<=yr*12);
 const tags=['开篇','人情','抉择','法门','华池','突破','开脉','结局','伤病','延寿','悟道','见闻'];
 const lines=entries.filter(x=>tags.includes(x.tag)).map(x=>x.text);
 const counts={修行:0,研经:0,采集:0,交易:0};
 for(const e of entries)if(Object.hasOwn(counts,e.tag))counts[e.tag]++;
 const summary=Object.entries(counts).filter(([,n])=>n).map(([tag,n])=>`${tag}${n}次`).join('、');
 if(summary)lines.push(`这一年，你还经历了${summary}。`);
 if(!lines.length)lines.push('这一年，你在苍梧山默默打磨根基。');
 s.books.push({year:yr,partial,title:partial?`第${yr}卷 · 未竟`: `第${yr}卷 · 山中岁华`,lines,stage:STAGES[s.stage],age:Math.floor(s.ageMonths/12)});
}
function end(s,kind,body,grade=''){
 s.ending={kind,grade,body};note(s,body,'结局');
 if(s.month%12!==0||s.month===0)book(s,year(s.month),true);else{const last=s.books.find(b=>b.year===year(s.month));if(last&&!last.lines.includes(body))last.lines.push(body);else if(!last)book(s,year(s.month));}
}
function lifeSummary(s){if(!s.ending)return [];
 const route={help:'分药救助叶青蘅',trade:'向叶青蘅索酬指路',leave:'绕过药径独行'}[s.story?.yeRoute]||'未遇叶青蘅';
 const follow={accompany:'后来与她同行辨泉',part:'后来采药各行',buyMap:'后来购得泉径旧图',cash:'后来接下山下短工',solo:'后来独自寻得泉径',forage:'后来避险采药'}[s.story?.yeFollowup]||'此事未有后续';
 const ranks=s.foundationGrades.length?s.foundationGrades.map((n,i)=>`第${i+1}关${['','下','中','上'][n]||'未定'}品`).join('、'):'尚未筑元';
 return [`${ORIGINS[s.origin]?.name||'求道者'}，天赋${TALENTS[s.talent]?.name||'平常'}；终局时 ${Math.floor(s.ageMonths/12)} 岁。`,`药径旧事：${route}；${follow}。`,`道途根基：${ranks}；历来累计功行 ${Number(s.totalProgress).toFixed(2)}。`,`终局所依：${ITEMS.manual[s.manual]?.name||'旧法'}、${ITEMS.spring[s.spring]?.name||'未得华池'}。`,`人物往来：顾闻溪 ${s.npcFavor.gu>=0?'+':''}${s.npcFavor.gu}，叶青蘅 ${s.npcFavor.ye>=0?'+':''}${s.npcFavor.ye}，程上师 ${s.npcFavor.cheng>=0?'+':''}${s.npcFavor.cheng}，陆知衡 ${(s.npcFavor.lu||0)>=0?'+':''}${s.npcFavor.lu||0}。`,...Object.entries({gu:'星篆校勘',ye:'青华药约',lu:'商路旧契',cheng:'上师传法'}).filter(([who])=>s.story.afterManual?.[who]?.first).map(([who,label])=>{const labels={publish:'公开勘误',reserve:'独自重校',annotate:'补注残文',credit:'署名刊行',treat:'送药救助',keep:'留药养脉',visit:'同访辨泉',receive:'收下回礼',honor:'守约还卷',broker:'承接新买卖',settle:'结清旧契',teach:'代授行气',withdraw:'婉拒差事',guide:'随师问道',lecture:'重听旧注'};return `${label}：${labels[s.story.afterManual[who].first]||'旧事已决'}；${labels[s.story.afterManual[who].second]||'后事未决'}。`;}),...(s.story.sealDebt?[`照骨玄泉池契：${s.story.sealDebt}。`]:[]),s.ending.kind==='success'?`开脉脉象：${s.ending.grade}。`:s.ending.kind==='mortal'?'开脉未成，归于凡俗。':s.ending.kind==='retired'?'三十未开脉，辞山归家。':'身死道消，此生道途止于苍梧。'];
}
function turn(s){s.month++;s.ageMonths++;if(s.grain>0)s.grain--;else{add(s,{wounds:1});s.lifeLimitMonths=Math.max(s.ageMonths,s.lifeLimitMonths-3);note(s,'本月口粮断绝，饥寒损伤了身体，也折去些许寿元。','伤病');}
 if(s.story?.luRoute&&s.story.luRoute!=='complete'&&!s.story.luDefaulted&&s.month>=s.story.luMonth+60){s.story.luDefaulted=true;add(s,{silver:-Math.min(s.silver,6)});s.social=Math.max(1,s.social-1);favor(s,'lu',-2);note(s,'护卷契书五年未结，陆知衡遣人追索盘缠，你的处世声名因此受损；仍可结契求法。','抉择','银钱最多 −6 · 处世 −1 · 陆知衡 −2');}
 if(s.month%12===0)book(s,year(s.month));
 if(!s.ending&&s.ageMonths>=30*12){end(s,'retired','三十岁这一年，你仍未能叩开仙凡之门。你收起旧卷，辞别苍梧，下山归家；多年吐纳终成一段凡尘旧梦。');return;}if(s.ageMonths>=s.lifeLimitMonths||s.wounds>=6){end(s,'death',s.wounds>=6?'积伤难复，你在苍梧山的冬夜中溘然长逝。':'寿数已尽。你仍未求得长生之门，山中只余旧日道书。');}
}
function chance(s,mode='steady'){
 const legacyBonus=s.foundationGrades.reduce((n,g)=>n+Math.max(0,g-1),0);
 const raw=20+manualPower(s)*8+springPower(s)*7+s.foundation*4+Math.min(12,Math.floor(s.totalProgress/35))+s.insight*.7+s.root*1.5+Math.floor(s.focus/20)-(s.wounds*9)+(s.body-3)*2+(s.spring===4?4:0)+(s.spring===5&&s.root>=5?2:0)-(mode==='bold'?19:0);
 return clamp(clamp(Math.floor(raw),15,63)+legacyBonus*2+(s.dao-3)*3-(s.body-effectiveBody(s))*3+(s.talent==='meridian'?5:0),5,84);
}
function quality(s){return manualPower(s)*2+springPower(s)*2+s.foundation*2+s.foundationGrades.reduce((n,g)=>n+Math.max(0,g-1),0)+s.root+Math.floor(s.insight/3)+(s.talent==='clarity'?1:0)+(s.manual===4&&s.wit>=6?1:0)-s.wounds*2;}
function grade(s,roll,mode){
 const names=['上上品','上中品','上下品','中上品','中中品','中下品','下上品','下中品','下下品'];
 const q=quality(s),r=rand(()=>roll),bold=mode==='bold';
 const topReady=q>=22&&ITEMS.manual[s.manual]?.rarity==='仙品'&&ITEMS.spring[s.spring]?.rarity==='仙品'&&s.foundation>=3&&s.foundationGrades.every(g=>g>=2)&&s.insight>=8&&s.wounds===0;
 const base=topReady?0:q>=22?1:q>=18?2:q>=15?3:q>=12?4:q>=9?5:q>=6?6:q>=3?7:8;
 let shift;
 if(base===0)shift=r<(bold?.60:.50)?0:r<(bold?.65:.85)?1:2;
 else if(base===1)shift=r<(bold?.06:.03)?-1:r<(bold?.36:.53)?0:r<(bold?.56:.85)?1:2;
 else shift=r<(bold?.03:.01)?-2:r<(bold?.10:.04)?-1:r<(bold?.44:.54)?0:r<(bold?.64:.84)?1:2;
 return names[clamp(base+shift,0,names.length-1)];
}
function canRevealTrueText(s){return !s.story?.trueTextReady&&!s.manuals.includes(3)&&s.manuals.includes(2)&&s.flags.mentor&&s.practice[2]>=14&&s.npcFavor.cheng>=3&&s.insight>=6&&s.root>=4&&s.wit>=4&&s.dao>=4&&s.month>=(s.story?.trueTextNextMonth||0);}
const SCENE_DESCRIPTIONS={
 templeLamp:'夜里灯火将尽，值夜弟子却在旧卷里发现半页模糊蚀文。抄录的人各执一说，若今晚不辨清，明日这页便要随卷入库。',
 templeLedger:'月末清点粮库时，执事发现入库粟米与厨房支取的数目对不上。几笔旧账字迹潦草，还有一处像是重复记了两次；山下取粮的人已经在催。',
 cliffDebate:'午后几名同门在崖下争论一段导脉旧说，从经义一路争到各自修法。有人见你经过，索性把问题抛给了你。',
 cliffWind:'山风忽然转急，崖边几处石缝发出长短不同的啸声。你听出其中似乎暗合吐纳节律，风口石壁上又隐约露出旧刻。',
 mountainHerbs:'后山药径旁新翻的泥土里露出几株可用灵草，却也有猿踪压过草叶。若继续采摘，可能要与护食的灵猿周旋。',
 mountainMist:'雾气忽从山坳漫上来，熟悉的药径很快只剩几步可见。有人说抄近路能早下山，也有人宁愿在原地等雾散。',
 marketGrain:'粮铺临收摊时忽然改了价，几名客人与掌柜争得不可开交。你看得出账里有可商量的余地，也可以趁机换些陈谷。',
 marketTome:'旧书摊上压着一张来历不明的拓本，摊主只当奇字招徕客人。你却看出其中几笔与蚀文相近，真假一时难辨。',
 templeMeridian:'静坐时你察觉气机在一处经络间反复滞涩，像是功行渐深后留下的小结；旁边同门也正为类似问题发愁。',
 cliffPulse:'崖风拍壁，石纹与自身脉动竟有片刻相合。若顺势参照，也许能把这点体会化进当前功行。',
 mountainVein:'山腹湿气里夹着一缕与平日不同的土腥味，像有浅层地脉翻动。附近药株的根须都朝着同一方向伸展。',
 marketScript:'旧书摊新收了一页残缺符文，摊主只当奇字卖。你看出其中有几笔与蚀文相近，或许值得细究。',
 templeSeal:'观中一处旧封禁松动，执事正在找人帮忙稳住阵脚。此事不算凶险，却最考验根基是否扎实。',
 cliffFormation:'千丈岩几块天然巨石在日影下连成奇异方位，像极了粗浅阵势。风从其中穿过时，气机也随之偏转。',
 mountainCave:'雨后山坡塌开一道窄缝，里面透出冷风。洞不深，却有旧兽痕与灵气残留，深处似乎还有水声。',
 marketPact:'两名行商为一纸旧约争得面红耳赤，都想请你作中人。契书牵涉道书运送，谁也不肯先退一步。',
 templeBreath:'夜半行功时，你忽觉呼吸与周遭灯火一齐慢了下来，像是开脉前最后一道关隘在体内显形。',
 cliffVision:'云开月现的一瞬，崖下群山层层铺展，气象与平日迥异。你心中隐约生出一线明悟，风势却正在散去。',
 mountainSpring:'后山深处一眼旧泉忽然泛起细碎灵光，与先前所见已大不相同。泉意虽淡，却足以让将近圆满的根基再受一次洗炼。',
 marketExchange:'集市将散时，一名老客拿出几件彼此不搭的旧物求换。旁人只看价钱，你却察觉其中藏着修行上的取舍。'
};
const SCENES={temple:['templeLamp','templeLedger'],cliff:['cliffDebate','cliffWind'],mountain:['mountainHerbs','mountainMist'],market:['marketGrain','marketTome']};
const REALM_SCENES={1:{temple:['templeMeridian'],cliff:['cliffPulse'],mountain:['mountainVein'],market:['marketScript']},2:{temple:['templeSeal'],cliff:['cliffFormation'],mountain:['mountainCave'],market:['marketPact']},3:{temple:['templeBreath'],cliff:['cliffVision'],mountain:['mountainSpring'],market:['marketExchange']}};
function sceneEvent(s,rng){
 if(s.ending||s.pending||s.month<12||(s.stage===0&&!s.manuals.some(m=>m>=1)))return;
 const e=s.events||(s.events={seen:[],nextMonth:0});
 if(s.month<(e.nextMonth||0))return;
 const remaining=(s.stage===0?SCENES[s.location]||[]:REALM_SCENES[s.stage]?.[s.location]||[]).filter(id=>!e.seen.includes(id));
 if(!remaining.length||rand(rng)>=.24)return;
 const id=remaining[Math.floor(rand(rng)*remaining.length)];e.seen.push(id);e.nextMonth=s.month+8;s.pending=`scene-${id}`;
 note(s,`你在${LOCATIONS[s.location].name}遇见一桩意料之外的事。${SCENE_DESCRIPTIONS[id]||'事情来得突然，需要你亲自作主。'}`,'人情');
}
function attuneManualAffinity(s,n){const item=ITEMS.manual[n],need=affinityRequirement(item);if(!item||!['灵品','仙品'].includes(item.rarity)||!need)return [];if(!s.affinityPoints)s.affinityPoints=innatePoints(s.elements,s.polarity);const raised=[];if(item.elements?.length){const key=item.elements.slice().sort((a,b)=>(s.affinityPoints[b]||0)-(s.affinityPoints[a]||0))[0];if((s.affinityPoints[key]||0)<need){s.affinityPoints[key]=need;raised.push(`${ELEMENTS[key]}亲和 → ${need}`);}}if(item.polarity&&item.polarity!=='harmony'&&(s.affinityPoints[item.polarity]||0)<need){s.affinityPoints[item.polarity]=need;raised.push(`${POLARITIES[item.polarity]}亲和 → ${need}`);}return raised;}
function earnManual(s,n,source){if(!s.manuals.includes(n))s.manuals.push(n);const attuned=attuneManualAffinity(s,n),ready=!affinityMissing(s,ITEMS.manual[n]).length;if(ready)s.manual=n;note(s,`${source}，你取得${ITEMS.manual[n].name}。${attuned.length?'求法历练使自身气机与真章相契（'+attuned.join('、')+'）。':''}${ready?'已转修此法。':'属性未足，暂存法卷；需另寻契合机缘后再转修。'}`,'法门',attuned.join(' · '));}
function canReadStar(s){return (s.practice[1]||0)>=8||(s.practice[2]||0)>=6||(s.practice[6]||0)>=8;}
function canNurtureVein(s){return (s.practice[1]||0)>=10||(s.practice[2]||0)>=6||(s.practice[6]||0)>=10;}\nfunction practiceRequirementText(s,requirements){return Object.entries(requirements).map(([manual,need])=>`${ITEMS.manual[manual].name}实修 ${Math.min(s.practice[manual]||0,need)} / ${need} 次`).join('；');}
function canRedeem(s){const contractAptitude=s.root>=4||s.root>=3&&s.social>=5&&(s.practice[6]||0)>=18;const socialReady=s.story.luRoute==='escort'?s.social>=2:s.social>=4;return (s.practice[6]||0)>=10&&s.insight>=7&&contractAptitude&&s.wit>=4&&s.dao>=3&&socialReady;}
const AFTER_MANUAL={gu:{place:'cliff',manual:4},ye:{place:'mountain',manual:5},lu:{place:'market',manual:3},cheng:{place:'temple',manual:3}};
function afterManualReady(s,who,part){
 const record=s.story.afterManual?.[who],route=AFTER_MANUAL[who];
 const acquired=who==='lu'?s.story.luCredential:who==='cheng'?s.story.trueTextReady&&s.manuals.includes(3):s.manuals.includes(route.manual);
 return acquired&&(part===1?s.stage>=1&&!record?.first:s.stage>=2&&!!record?.first&&!record?.second&&s.month>=record.month+6);
}
function options(s){
 if(s.ending)return [];
 if(s.pending==='guText')return [{id:'collaborate',label:'与顾闻溪合校残篇',detail:'一月、口粮 1、心神 −16；需顾好感 1、心得 5、悟性 4；日后仍要搜集缺页',disabled:s.npcFavor.gu<1||s.insight<5||s.wit<4||s.focus<16},{id:'independent',label:'自购残篇，独自考据',detail:'一月、口粮 1、银钱 −6、心神 −20；需心得 7、悟性 5；顾好感 −1',disabled:s.silver<6||s.insight<7||s.wit<5||s.focus<20},{id:'back',label:'暂不立题'}];
 if(s.pending==='guFinish')return [{id:'verify',label:'试行校成的星篆法',rarity:'仙品',detail:`一月、口粮 1、心神 −25${s.story.guText==='independent'?'、灵草 −1':''}；需缺页、心得 8、根骨 3、悟性 5，并实修凡品 8 次或灵品 6／8 次；所得真章适合考据修行`,disabled:!s.story.guFragments||s.insight<8||s.root<3||s.wit<5||!canReadStar(s)||s.focus<25||(s.story.guText==='independent'&&s.herbs<1)||s.manuals.includes(4)},{id:'back',label:'继续推敲'}];
 if(s.pending==='yeText')return [{id:'tend',label:'替叶青蘅养护泉脉',detail:'一月、口粮 1、灵草 −1、心神 −16；叶好感 +1；后续须亲自采药验证',disabled:s.herbs<1||s.focus<16},{id:'sample',label:'独取药径泉样',detail:'一月、口粮 1、灵草 −1、心神 −12、暗伤 +1；叶好感 −1，换取独立验证',disabled:s.herbs<1||s.focus<12||s.wounds>=5},{id:'back',label:'暂不问法'}];
 if(s.pending==='yeFinish')return [{id:'healVein',label:'以灵草试行青华篇',rarity:'仙品',detail:'一月、口粮 1、灵草 −2、心神 −22；需采药验证 2 次、心得 5、根骨 4、悟性 3、体魄 4，前置修行：${practiceRequirementText(s,{1:10,2:6,6:10})}',disabled:s.story.yeHerbWork<2||s.insight<5||s.root<4||s.wit<3||s.body<4||!canNurtureVein(s)||s.herbs<2||s.focus<22||s.manuals.includes(5)},{id:'back',label:'留待来日'}];
 if(s.pending==='luMeet')return [{id:'pledge',label:'押资护卷，立下契书',detail:'一月、口粮 1、银钱 −6；需处世 4、根骨 3、悟性 3；得灵品《行云寄脉书》，以后还要履约换回真章',rarity:'灵品',disabled:s.silver<6||s.social<4||missingAttributes(s,6).length>0},{id:'escort',label:'替商队护送散卷',detail:'一月、口粮 1、心神 −30、暗伤 +1；需体魄 3、根骨 3、悟性 3；得灵品过渡法',rarity:'灵品',disabled:s.focus<30||s.body<3||s.wounds>=5||missingAttributes(s,6).length>0},{id:'fight',label:'出手护卷，截住拦路修士',detail:'一月、口粮 1；胜利推进护卷契约，失手或撤退会使卷册受损、契约延期',rarity:'灵品'},{id:'back',label:'暂不介入',detail:'不耗月份；日后仍可回来商谈'}];
 if(s.pending==='luReturn'&&s.story.luRoute==='fightDelayed')return [{id:'repairScrollSilver',label:'赔付银钱，修复散卷',detail:'一月、口粮 1、银钱 −4；补全卷册，继续护卷契约',disabled:s.silver<4},{id:'repairScrollHerbs',label:'以灵草抵补散卷',detail:'一月、口粮 1、灵草 −2；补全卷册，继续护卷契约',disabled:s.herbs<2},{id:'sellPapers',label:'卖出残卷，放下这条路',detail:'银钱 +6；结束护卷契约，仍可通过其他路线求仙品法'},{id:'back',label:'暂缓补偿'}];
 if(s.pending==='luReturn'&&s.manuals.includes(3))return [{id:'back',label:'真章已得',detail:'你已从别处承受太微真章，此契不再以求法为终点；可自行离开'}];
 if(s.pending==='luReturn')return [{id:'redeemSilver',label:'银钱结契，呈卷求法',rarity:'仙品',detail:`一月、口粮 1、银钱 −8；需心得 7、悟性 4、道心 3、${s.story.luRoute==='escort'?'护送路线处世 2':'押资路线处世 4'}，根骨 4 且行云实修 10 次，或根骨 3、处世 5 且行云实修 18 次`,disabled:s.silver<8||!canRedeem(s)},{id:'redeemHerbs',label:'以灵草偿约，呈卷求法',rarity:'仙品',detail:'一月、口粮 1、灵草 −3；其余承法条件相同',disabled:s.herbs<3||!canRedeem(s)},{id:'sellPapers',label:'卖出护卷所得，放下这条路',detail:'银钱 +12；放弃此契，仍可通过其他路线求仙品法'},{id:'back',label:'暂缓结契'}];
 if(s.pending==='sealAudience')return [{id:'serveSeal',label:'应下守池差事',detail:'两月、口粮 2、心神 −20；需程好感 3，开放照骨玄泉；留下宗门责任',disabled:s.npcFavor.cheng<3||s.grain<3||s.focus<20},{id:'bondSeal',label:'交还护卷，抵作池契',detail:'一月、口粮 1、银钱 −8；需陆知衡的履约文书，开放照骨玄泉',disabled:!s.story.luCredential||s.silver<8},{id:'back',label:'不受池约'}];
 if(s.pending==='stoneScout')return [{id:'yieldSpring',label:'让闻秋先探泉',detail:'不耗月份与资源；取得泉脉线索，闻秋好感 +1，无优先权'},{id:'negotiateSpring',label:'出银钱换先探机会',detail:'一月、口粮 1、银钱 −3；取得泉脉线索与本次优先权',disabled:s.silver<3},{id:'contestSpring',label:'与寻泉客争夺探查权',detail:'一月、口粮 1；交手胜利获优先权，失手或收手错过本次机会',disabled:!!s.story.stoneMissed},{id:'seekStone',label:'循药径独自探石髓泉眼',detail:'一月、口粮 1、灵草 −1、心神 −24；体魄低于 5 时暗伤 +1；此时只取得泉脉线索',disabled:s.herbs<1||s.focus<24||s.wounds>=5&&effectiveBody(s)<5},{id:'back',label:'留在山路'}];
 if(s.pending?.startsWith('after-')){
  const [,who,part]=s.pending.split('-'),first=s.story.afterManual?.[who]?.first;
  const back={id:'back',label:'先放下此事',detail:'不耗月份；日后仍可回来作答'};
  if(part==='1'){
   const choices={
    gu:[{id:'publish',label:'与顾闻溪公开勘误',detail:'一月、口粮 1、心神 −18、心得 +2、顾好感 +1；公开自己的旧注也有纰漏',disabled:s.focus<18},{id:'reserve',label:'先留误字，独自重校',detail:'一月、口粮 1、心神 −12、心得 +1、顾好感 −1；保住优先校注权',disabled:s.focus<12}],
    ye:[{id:'treat',label:'送药给伤者，和叶青蘅同去',detail:'一月、口粮 1、灵草 −2、心神 −12、叶好感 +1；留下一份来日的谢礼',disabled:s.herbs<2||s.focus<12},{id:'keep',label:'把药留下，先养自己的经脉',detail:'一月、口粮 1、灵草 −1、暗伤 −1、心神 +12、叶好感 −1',disabled:s.herbs<1}],
    lu:[{id:'honor',label:'替陆知衡送还余卷',detail:'一月、口粮 1、银钱 −5、陆好感 +1；商路留给你一份回礼',disabled:s.silver<5},{id:'broker',label:'留下余卷，替他接一笔新买卖',detail:'一月、口粮 1、心神 −15、银钱 +8、陆好感 −1；须自行承担往后误传的争议',disabled:s.focus<15}],
    cheng:[{id:'teach',label:'代上师教新弟子行气',detail:'一月、口粮 1、心神 −20、程好感 +1、道心 +1；承下一次教学回访',disabled:s.focus<20},{id:'withdraw',label:'谢绝教习，取回自己校卷的报酬',detail:'不耗月份；银钱 +6、程好感 −1，留下完整闭关时间'}]
   };return [...choices[who],back];
  }
  const choices={
   gu:first==='publish'?[{id:'annotate',label:'共同补完校本',detail:'一月、口粮 1、心神 −16、心得 +2、顾好感 +1',disabled:s.focus<16},{id:'fee',label:'让她独自完稿，领取译注酬金',detail:'不耗月份；银钱 +7，不再参与校订'}]:[{id:'correct',label:'把留存的误字告诉顾闻溪',detail:'一月、口粮 1、心神 −14、顾好感 +1、心得 +1',disabled:s.focus<14},{id:'sell',label:'将自己的校注另售书商',detail:'不耗月份；银钱 +9、顾好感 −1'}],
   ye:first==='treat'?[{id:'receive',label:'领伤者备下的药材',detail:'不耗月份；灵草 +3、叶好感 +1'},{id:'visit',label:'陪叶青蘅回山诊脉',detail:'一月、口粮 1、心神 −16、暗伤 −2、叶好感 +1',disabled:s.focus<16}]:[{id:'remedy',label:'带药去补上当时的诊治',detail:'一月、口粮 1、灵草 −2、叶好感 +1、道心 +1',disabled:s.herbs<2},{id:'formula',label:'向叶青蘅购一份自养药方',detail:'不耗月份；银钱 −4、暗伤 −2',disabled:s.silver<4}],
   lu:first==='honor'?[{id:'credit',label:'收下商路信用凭票',detail:'不耗月份；银钱 +10、陆好感 +1'},{id:'supplies',label:'将回礼换成闭关米粮',detail:'不耗月份；口粮 +18'}]:[{id:'settle',label:'补偿误传的抄卷人',detail:'不耗月份；银钱 −6、陆好感 +1',disabled:s.silver<6},{id:'defend',label:'亲自辩清余卷的来历',detail:'一月、口粮 1、心神 −18、心得 +2；陆好感不变',disabled:s.focus<18}],
   cheng:first==='teach'?[{id:'guide',label:'再为弟子解一段行气难题',detail:'一月、口粮 1、心神 −18、程好感 +1、心得 +2',disabled:s.focus<18},{id:'entrust',label:'将教习交还上师，领走资粮',detail:'不耗月份；口粮 +10，程好感不变'}]:[{id:'lecture',label:'带着旧注回来与上师论法',detail:'一月、口粮 1、心神 −15、心得 +2、程好感 +1',disabled:s.focus<15},{id:'keepPay',label:'仍按旧约各修各道',detail:'不耗月份；银钱 +5，程好感不变'}]
  };return [...choices[who],back];
 }
 if(s.pending==='seclusion')return [{id:'three',label:'闭关三个月',detail:'最多三个月；每月按当前功法修炼，心神不足先静养'},{id:'six',label:'闭关半年',detail:'最多六个月；后山缺粮时先采药补给'},{id:'twelve',label:'闭关一年',detail:'最多十二个月；遇事件、筑元关口或危险立即出关'},{id:'back',label:'暂不闭关',detail:'不耗月份与资源'}];
 if(s.pending==='scroll')return [{id:'share',label:'如实解读，并与同门分享',detail:'一月、口粮 1；心得 +1、银钱 +2，结交顾闻溪与程上师'},{id:'hide',label:'留下关键一页，独自参详',detail:'一月、口粮 1；心得 +2，顾闻溪好感 −1'},{id:'selltext',label:'卖给抄书人，换取资粮',detail:'一月、口粮 1；银钱 +7，顾闻溪好感 −1'}];
 if(s.pending==='herbalist')return [{id:'help',label:'分出一株灵草救人',detail:'一月、口粮 1、灵草 −1；心得 +1、叶青蘅好感 +2、程上师好感 +1',disabled:s.herbs<1},{id:'trade',label:'索取八两报酬再指路',detail:'一月、口粮 1；银钱 +8、叶青蘅好感 −1'},{id:'leave',label:'绕道独行',detail:'不另耗月份、口粮与灵草；保留独自探路的可能'}];
 if(s.pending==='yeFollowup'){
  const route=s.story.yeRoute;
  if(route==='help')return [{id:'accompany',label:'随叶青蘅再访泉径',detail:`一月、口粮 1、心神 −18；叶青蘅好感 +1、寻仙品华池时银钱少花 2${s.origin==='herbalist'?'；识草额外得灵草 1':''}`},{id:'part',label:'替她采一程药，再各走各路',detail:'一月、口粮 1、心神 −12；灵草 +2，不取得同行线索'},{id:'back',label:'先不作答',detail:'不耗月份；下次仍可回来'}];
  if(route==='trade')return [{id:'buyMap',label:'照旧规矩买下泉径旧图',detail:`一月、口粮 1、银钱 −${s.social>=5?3:4}、心神 −12；得到独立寻泉线索${s.wit>=5||s.talent==='clarity'?'、心得 +1':''}`,disabled:s.silver<(s.social>=5?3:4)},{id:'cash',label:'收下商路上的短工',detail:'一月、口粮 1、心神 −16；银钱 +5，不取得旧图'},{id:'back',label:'先不作答',detail:'不耗月份；下次仍可回来'}];
  return [{id:'solo',label:'循山势独自寻泉',detail:`一月、口粮 1、心神 −${soloFocus(s)}${effectiveBody(s)<5&&s.talent!=='vitality'?'、暗伤 +1':''}；独行线索，后续寻泉需更多心神`,disabled:!(s.root>=4||s.wit>=5||s.dao>=4)||s.focus<soloFocus(s)},{id:'forage',label:'避开险径，专心采药',detail:'一月、口粮 1、心神 −12；灵草 +2、口粮 +2，不取得线索'},{id:'back',label:'先不作答',detail:'不耗月份；下次仍可回来'}];
 }
 if(s.pending==='trueText')return [{id:'undertake',label:'应下校卷之约',detail:'一月、口粮 1、心神 −20；完成后方能向上师求取秘传真章',disabled:s.focus<20},{id:'defer',label:'暂且告退',detail:'不耗月份；半年后可再来商谈'}];
 if(s.pending==='guFollowup')return [{id:'compare',label:'与顾闻溪对读残卷',detail:'一月、口粮 1、心神 −16；心得 +2、顾好感 +1',disabled:s.focus<16},{id:'commission',label:'替她向书商交稿',detail:'一月、口粮 1；银钱 +8；顾好感不变'},{id:'decline',label:'留心自己的修行',detail:'不耗时间，顾闻溪会记住你这次的决定'}];
 if(s.pending==='guReturn')return s.story.guRoute==='compare'?[{id:'joint',label:'合力校定泉脉注解',detail:'一月、口粮 1、心神 −18；心得 +1、顾好感 +1，寻泉费用少 1',disabled:s.focus<18},{id:'private',label:'只借旧注自参',detail:'不耗月份；心得 +1，顾好感 −1，不取得寻泉线索'}]:[{id:'copy',label:'誊录书商带来的药方',detail:'一月、口粮 1；灵草 +2，顾好感 +1'},{id:'wage',label:'帮书商跑一趟山路',detail:'一月、口粮 1；银钱 +6，不取得药方'}];
 if(s.pending==='chengFollowup')return [{id:'guard',label:'替上师守一夜藏书阁',detail:'一月、口粮 1、心神 −20；程好感 +1、道心 +1',disabled:s.focus<20},{id:'copyForPay',label:'替上师抄卷换资粮',detail:'一月、口粮 1；银钱 +8、心得 +1，不增加好感'},{id:'pass',label:'婉拒这份差事',detail:'不耗月份；此后仍可正常求法'}];
 if(s.pending==='chengReturn')return s.story.chengRoute==='guard'?[{id:'askMethod',label:'再请教行气疑难',detail:`一月、口粮 1、心神 −18；本层功行 +${eventProgressGain(s,8)}，程好感 +1`,disabled:s.focus<18||eventProgressGain(s,8)<=0},{id:'askSupply',label:'领一份闭关资粮',detail:'不耗月份；口粮 +5、程好感 −1'}]:[{id:'settle',label:'结清抄卷酬劳',detail:'不耗月份；银钱 +5，程好感 −1'},{id:'gift',label:'留下抄卷作人情',detail:'不耗月份；程好感 +1，放弃酬劳'}];
 if(s.pending?.startsWith('scene-')){
  const id=s.pending.slice(6);
  const choices={templeLamp:[['keep','守灯辨字','心神 −12、心得 +1'],['rest','熄灯静养','心神 +16、口粮 −1']],templeLedger:[['audit','核对粮册','心神 −12、口粮 +3'],['deliver','替人送粮','口粮 −2、银钱 +7']],cliffDebate:[['argue','参与辩经','心神 −14、心得 +1'],['listen','静听两家辩论','心神 +12、悟性修习 +1']],cliffWind:[['trace','循风探石刻','心神 −16、灵草 +2'],['shelter','回避风口','心神 +12、口粮 +1']],mountainHerbs:[['engageApe','循着灵草气息进药圃','与护地妖兽交手；胜负将影响采集与伤势'],['bypassApe','绕过猿影，另寻药株','平安离开这片药圃，口粮 +1']],mountainMist:[['shortcut','穿雾抄近道','心神 −15、银钱 +5；体魄低时暗伤 +1'],['wait','避雾候晴','口粮 +2、心神 +12']],marketGrain:[['bargain','帮商户核算粮价','银钱 +4、心神 −12'],['stock','换取陈谷','银钱 −2、口粮 +5']],marketTome:[['decode','辨认摊头拓本','银钱 −2、心得 +1'],['sell','替摊主叫卖','银钱 +5、心神 −10']],
  templeMeridian:[['sortPulse','替同门理顺行气','心神 −18、心得 +2'],['sortStore','调度观中资粮','心神 −10、口粮 +6']],cliffPulse:[['readPulse','辨认岩中灵息','心神 −18、本层功行 +8'],['leadGroup','带人登岩寻路','心神 −10、银钱 +8']],mountainVein:[['tapVein','探寻新药脉','心神 −18、灵草 +3'],['drawVein','借山势行气','口粮 −2、本层功行 +7']],marketScript:[['buyScript','购下完整拓本','银钱 −5、本层功行 +9'],['sellScript','替书商鉴定残篇','灵草 −1、银钱 +8']],
  templeSeal:[['repairSeal','封合元基裂隙','灵草 −1、心神 −18、裂隙 −1'],['readSeal','参悟观中旧印','心神 −20、本层功行 +11']],cliffFormation:[['forceFlow','催动灵息破阵','暗伤 +1、本层功行 +12；暗伤达到 6 则身死'],['holdArray','守住阵眼静候','心得 −1、心神 +20']],mountainCave:[['healCave','洞中引泉疗伤','灵草 −2、暗伤 −2'],['seekCave','深入洞中采药','心神 −20、灵草 +4']],marketPact:[['buyPact','换取冲关注解','银钱 −6、本层功行 +12'],['tradePact','替商队护送道书','心神 −22、银钱 +10']],
  templeBreath:[['closeBreath','收束真息疗伤','灵草 −1、心神 +35、暗伤 −1'],['openBreath','引真息贯通元脉','心神 −24、本层功行 +15']],cliffVision:[['observeSky','登岩观象','心神 −20、心得 +2'],['guideSky','带弟子踏勘岩脉','心神 −20、银钱 +12']],mountainSpring:[['washSpring','借山泉洗去旧伤','灵草 −2、暗伤 −2、心神 +20'],['gatherSpring','采下泉畔灵材','心神 −20、灵草 +4']],marketExchange:[['buyRations','购置长关资粮','银钱 −7、口粮 +16'],['sellGoods','售出积存灵材','灵草 −2、银钱 +12']]};
  const requirements={sortPulse:{focus:18},sortStore:{focus:10},readPulse:{focus:18,progress:1},leadGroup:{focus:10},tapVein:{focus:18},drawVein:{grain:2,progress:1},buyScript:{silver:5,progress:1},sellScript:{herbs:1},repairSeal:{herbs:1,focus:18,strain:1},readSeal:{focus:20,progress:1},forceFlow:{progress:1},holdArray:{insight:1},healCave:{herbs:2,wounds:1},seekCave:{focus:20},buyPact:{silver:6,progress:1},tradePact:{focus:22},closeBreath:{herbs:1},openBreath:{focus:24,progress:1},observeSky:{focus:20},guideSky:{focus:20},washSpring:{herbs:2,wounds:1},gatherSpring:{focus:20},buyRations:{silver:7},sellGoods:{herbs:2}};
  const progressOffers={readPulse:8,drawVein:7,buyScript:9,readSeal:11,forceFlow:12,buyPact:12,openBreath:15};
  return (choices[id]||[]).map(([choice,label,detail])=>{const needs=requirements[choice]||{},offered=progressOffers[choice],actual=offered?eventProgressGain(s,offered):0;return {id:choice,label,detail:`刚才的行动已耗一月；${offered?detail.replace(`本层功行 +${offered}`,`本层功行 +${actual}`):detail}`,disabled:(offered&&actual<=0)||Object.entries(needs).some(([resource,n])=>resource==='progress'?s.progress>=cap(s):resource==='strain'?(s.foundationStrain||0)<n:s[resource]<n)||(id==='templeLedger'&&choice==='deliver'&&s.grain<2)||(id==='marketGrain'&&choice==='stock'&&s.silver<2)||(id==='marketTome'&&choice==='decode'&&s.silver<2)||(id==='cliffDebate'&&choice==='argue'&&s.focus<14)||(id==='cliffWind'&&choice==='trace'&&s.focus<16)||(id==='mountainMist'&&choice==='shortcut'&&s.focus<15)||(id==='templeLamp'&&choice==='keep'&&s.focus<12)||(id==='templeLamp'&&choice==='rest'&&s.grain<1)||(id==='templeLedger'&&choice==='audit'&&s.focus<12)||(id==='mountainHerbs'&&choice==='harvest'&&s.focus<12)||(id==='marketGrain'&&choice==='bargain'&&s.focus<12)||(id==='marketTome'&&choice==='sell'&&s.focus<10)};}).concat({id:'ignore',label:'不再耽搁',detail:'不追加耗时或收益'});
 }
 if(s.pending==='mentor')return [{id:'serve',label:'整理道书，先结一份善缘 · 仅一次',detail:`一月、口粮 1；心得 +1、银钱 +2、程上师好感 +${s.social>=5?2:1}`,disabled:s.flags.mentor},{id:'guidance',label:`请教${ITEMS.manual[2].name} · 需好感 1、心得 5、根骨 3、悟性 3`,detail:'一月、口粮 1；取得灵品功法，心得和好感只作门槛',rarity:ITEMS.manual[2].rarity,disabled:s.npcFavor.cheng<1||s.insight<5||missingAttributes(s,2).length>0||s.manuals.includes(2)},...(s.story?.trueTextReady&&!s.manuals.includes(3)?[{id:'raretext',label:`求取${ITEMS.manual[3].name} · 需好感 3、心得 8、灵草 2、根骨 4、悟性 4、道心 4`,detail:'一月、口粮 1、灵草 −2、程上师好感 −1；取得仙品功法',rarity:ITEMS.manual[3].rarity,disabled:s.npcFavor.cheng<3||s.insight<8||s.herbs<2||missingAttributes(s,3).length>0||s.manuals.includes(3)}]:[]),{id:'depart',label:'告辞',detail:'不耗月份与资源'}];
 if(s.pending==='spring'){const path=springPath(s),routeLabel=path.name==='叶青蘅同行'?'与叶青蘅同行':path.name==='叶青蘅旧图'?'按叶青蘅旧图':path.name==='独行泉径'?'循独行泉径':'请故友引路';const mountain=s.location==='mountain';return [...(mountain?[{id:'common',label:`取用${ITEMS.spring[1].name}`,rarity:ITEMS.spring[1].rarity,detail:'一月、口粮 1；无额外门槛',disabled:s.spring>=1},{id:'deep',label:`循地脉寻${ITEMS.spring[2].name}`,rarity:ITEMS.spring[2].rarity,detail:'一月、口粮 1、心神 −25；需心得 4',disabled:s.insight<4||s.focus<25||s.spring>=2},{id:'hidden',label:`${routeLabel}寻${ITEMS.spring[3].name}`,rarity:ITEMS.spring[3].rarity,detail:`一月、口粮 1、银钱 −${path.silver}、心神 −${path.focus}；需心得 7${path.name==='独行泉径'?'、根骨 4／悟性 5／道心 4 之一':path.name==='叶青蘅旧图'?'、顾闻溪好感 1':'、顾闻溪与叶青蘅好感各 1'}`,disabled:!path.ready||s.silver<path.silver||s.focus<path.focus||s.spring>=3},...(s.story.stoneClue?[{id:'stone',label:`取用${ITEMS.spring[5].name}`,rarity:'仙品',detail:`一月、口粮 1、灵草 −${s.story.stonePriority?1:2}、心神 −30；需心得 7、根骨 4、体魄 4；未养足体魄会留下暗伤${s.story.stonePriority?'；优先权减免 1 株灵草':''}`,disabled:s.insight<7||s.root<4||s.body<4||s.herbs<(s.story.stonePriority?1:2)||s.focus<30||s.wounds>=5||s.spring>=3}]:[])]:[]),...(!mountain&&s.story.sealPermit?[{id:'sealed',label:`取用${ITEMS.spring[4].name}`,rarity:'仙品',detail:'一月、口粮 1、灵草 −2、心神 −20；需心得 6；可疗暗伤，但顶级品相仍要稳固元基',disabled:s.herbs<2||s.insight<6||s.focus<20||s.spring>=3}]:[]),{id:'back',label:'暂不决定',detail:'不耗月份与资源'}];}
 if(s.pending==='manual')return s.manuals.map(m=>({id:`equip-${m}`,label:`修习${ITEMS.manual[m].name} · 本层上限 ${cap(s,m)} · 每月约 +${Math.round(ITEMS.manual[m].speed*(1+(s.wit-3)*.06)*100)/100}`,detail:affinityMissing(s,ITEMS.manual[m]).join('、')||'属性已契合',rarity:ITEMS.manual[m].rarity,disabled:m===s.manual||affinityMissing(s,ITEMS.manual[m]).length>0})).concat({id:'back',label:'暂不切换'});
 if(s.pending==='stage')return [{id:'patient',label:`稳固根基 · 成功率 ${stageChance(s)}% · 预计${['','下','中','上'][stageGrade(s,'patient')]}品元基`,detail:`两月、口粮 2、心神 −10；成功道心 +1，失败暗伤 +1、裂隙 +1${downgradeChance(s,'patient')?`；成功仍有 ${downgradeChance(s,'patient')}% 降一品风险`:''}`,disabled:s.grain<3||s.progress<cap(s)},{id:'hasty',label:`急进冲关 · 成功率 ${stageChance(s,'hasty')}% · 预计${['','下','中','上'][stageGrade(s,'hasty')]}品元基`,detail:`一月、口粮 1；成功暗伤 +1，失败暗伤 +2、裂隙 +2${downgradeChance(s,'hasty')?`；成功仍有 ${downgradeChance(s,'hasty')}% 降一品风险`:''}`,disabled:s.progress<cap(s)},{id:'restore',label:`静养修补元基 · 当前裂隙 ${s.foundationStrain||0}`,detail:'两月、口粮 2、灵草 −1、心神 −12；裂隙 −1，伤势另需调养',disabled:!(s.foundationStrain>0)||s.herbs<1||s.grain<3||s.focus<12},{id:'defer',label:'暂缓冲关 · 留待换法或调养',detail:'不耗月份与资源'}];
 if(s.pending==='attempt')return [{id:'steady',label:`守正开脉 · 成功率 ${chance(s)}%`,detail:'一月、口粮 1、心神 −35；失败即终局'},{id:'bold',label:`强求上品 · 成功率 ${chance(s,'bold')}%`,detail:'一月、口粮 1、心神 −35；提高冲出高品与大幅掉档的机会，失败即终局'},{id:'back',label:'再准备一番',detail:'不耗月份与资源'}];
 return [];
}
function available(s){if(s.ending||s.pending||s.combat)return [];
 if(s.location==='arena'){const arenaIds=['novice','keeper','swift'];return [...Object.entries(TECHNIQUES).filter(([id,t])=>s.stage>=t.stage&&!s.knownTechniques?.includes(id)).map(([id,t])=>({id:`learn-${id}`,label:`习得 · ${t.name}`,detail:`${t.detail}；耗内息 ${t.cost}；${techniqueMissing(s,id).join('、')||'功法与兵器契合'}。研习、揣摩并练至可用，耗时一月`,disabled:techniqueMissing(s,id).length>0 })),...arenaIds.map(id=>[id,SPAR_OPPONENTS[id]]).filter(([,foe])=>foe).map(([id,foe])=>({id:`spar-${id}`,label:`切磋 · ${foe.name}`,detail:`${foe.rank}对手 · 气血 ${foe.qi}／内息 ${foe.nei} · ${foe.text}演武、调息与复盘合计耗时一月${s.story?.arenaFirstWins?.[id]?' · 首胜奖励已得':' · 首胜另有奖励'}`})),...[['staff','试锋木杖','攻势 +3'],['vest','护心藤甲','护体 +4'],['talisman','试法铜符','内息上限 +5；可催动护身一次'],['shoes','逐风履','闪避 +5']].map(([id,label,effect])=>({id:`kit-${id}`,label:`${s.trainingGear?.[id]?'归还':'借用'}${label}`,detail:`开脉前试器 · ${effect} · ${affinityMissing(s,GEAR_AFFINITIES[id]?EQUIPMENT[{'staff':'weapon','vest':'armor','shoes':'shoes','talisman':'relic'}[id]][1]:{}).join('、')||'属性已契合'} · 战前切换不耗时`,disabled:!s.trainingGear?.[id]&&affinityMissing(s,EQUIPMENT[{'staff':'weapon','vest':'armor','shoes':'shoes','talisman':'relic'}[id]][1]).length>0}))];}
 const batchRisk=s.lifeLimitMonths-s.ageMonths<=12||s.wounds>=4;
 const base=[{id:'secludeYear',label:'闭关修炼',detail:batchRisk?'已接近本章期限或暗伤过重，请逐月决定行动':'自动逐月结算，至多一年；满额、事件、缺粮或危险即停；后山可采药补给',disabled:s.progress>=cap(s)||batchRisk},{id:'cultivate',label:'吐纳修炼',detail:`一月、口粮 1、心神 −22 · 功行约 +${cultivationGain(s)}，本层上限 ${cap(s)}`,disabled:s.focus<18||s.progress>=cap(s)},{id:'manual',label:'切换功法',detail:`不耗月份 · 已得 ${s.manuals.length} 门，本层上限随之变化`},{id:'rest',label:'静养调息',detail:`一月、口粮 1 · 心神约 +${48+(effectiveBody(s)-3)*4+(s.talent==='vitality'?12:0)}、暗伤 −${effectiveBody(s)>=5?2:1}`}];
 if(s.location==='cliff'){
  for(const part of [1,2])if(afterManualReady(s,'gu',part))base.push({id:`after-gu-${part}`,label:part===1?'顾闻溪 · 星篆误字':'顾闻溪 · 校本来信',detail:'得法后的旧事有了下文；打开不耗月份'});
  base.push({id:'study',label:'研读蚀文',detail:`一月、口粮 1、心神 −16 · ${s.insight>=10?'心得已满':`心得 +${Math.min(10-s.insight,s.talent==='clarity'?2:1)}`} · ${s.wit>=8?'悟性已至上限':`悟性修习 ${s.studyWork}/${studyNeed(s.wit)}`}`,disabled:s.focus<12});
  if(s.flags.scroll&&!s.story?.guRoute&&s.month>=(s.story?.guMonth??0)+3)base.push({id:'guFollowup',label:'顾闻溪来邀校卷',detail:'她记得你如何处理那页残卷；打开事件不耗月份'});
  if(['compare','commission'].includes(s.story?.guRoute)&&!s.story?.guReturn&&s.month>=s.story.guMonth+5)base.push({id:'guReturn',label:'顾闻溪的回信',detail:'此前的合作有了下文；打开事件不耗月份'});
  if(s.flags.scroll&&!s.story.guText&&!s.manuals.includes(4))base.push({id:'guText',label:'追索星篆残篇',detail:'与顾闻溪合校，或自购残篇；需心得与悟性，打开不耗时'});
  if(s.story.guText&&s.story.guText!=='complete'&&s.month>=s.story.guTextMonth+3)base.push({id:'guFinish',label:'试行星篆真章',detail:'需搜齐缺页并积累心得、根骨；打开不耗时'});
 }
 if(s.location==='mountain'){
  for(const part of [1,2])if(afterManualReady(s,'ye',part))base.push({id:`after-ye-${part}`,label:part===1?'叶青蘅 · 药笺':'叶青蘅 · 山中回音',detail:'得法后的旧事有了下文；打开不耗月份'});
  base.push({id:'gather',label:'采药',detail:'一月、口粮 1、心神 −15 · 灵草至少 +1、口粮 +2',disabled:s.focus<12});
  base.push({id:'gatherSeason',label:'连采至多半年',detail:batchRisk?'寿元剩余不足一年或暗伤过重，请逐月采药':'逐月采药，心神不足先静养；遇人物事件或危险立即停下',disabled:batchRisk||(s.focus<12&&s.grain===0)});
  if(s.story?.yeRoute&&!s.story.yeFollowup&&s.month>=s.story.yeMonth+2)base.push({id:'yeFollowup',label:'药径旧事',detail:`叶青蘅记得你${{help:'分药相助',trade:'索酬指路',leave:'绕道而去'}[s.story.yeRoute]}；再作一次选择`});
  if((s.story.yeRoute||s.codex?.people?.includes('ye'))&&!s.story.yeText&&!s.manuals.includes(5))base.push({id:'yeText',label:'问叶青蘅青华养脉法',detail:'需灵草，择同行养脉或独自取样；打开不耗时'});
  if(s.story.yeText&&s.story.yeText!=='complete'&&s.month>=s.story.yeTextMonth+2)base.push({id:'yeFinish',label:'试行青华养脉篇',detail:`已采药验证 ${s.story.yeHerbWork||0}/2 次；还需心得、根骨、体魄及灵草`});
  if(s.story.yeText&&s.body<4)base.push({id:'bodyTonic',label:'以灵草温养体魄',detail:'一月、口粮 1、灵草 −2、心神 −16；体魄 +1、寿限 +1 年；仅养脉求法时可用',disabled:s.herbs<2||s.focus<16});
  if(s.story.guText&&!s.story.guFragments)base.push({id:'findFragments',label:'沿山脉寻星篆缺页',detail:'一月、口粮 1、心神 −24；体魄不足 4 时暗伤 +1；亦可在坊市购得',disabled:s.focus<24||s.wounds>=5&&effectiveBody(s)<4});
  if(!s.story.stoneClue&&(s.story.yeClue||s.origin==='herbalist'||s.root>=5&&effectiveBody(s)>=4)&&s.insight>=4)base.push({id:'stoneScout',label:'探访苍梧石髓池',detail:'与寻泉客闻秋相遇，可让泉、议价、独探或争夺本次优先权；打开不耗时'});
  base.push({id:'spring',label:'寻访华池',detail:'择一处开脉泉眼；打开菜单不耗时'});
 }
 if(s.location==='market'){
  for(const part of [1,2])if(afterManualReady(s,'lu',part))base.push({id:`after-lu-${part}`,label:part===1?'陆知衡 · 余卷':'陆知衡 · 契外回信',detail:'得法后的旧事有了下文；打开不耗月份'});
  base.push({id:'marketWalk',label:'逛坊市，听风声',detail:'一月、口粮 1；打听见闻，可能遇到坊市事件；没有新消息时银钱 +2'}, {id:'sellall',label:'售出全部灵草',detail:`${s.herbs} 株 × ${s.social>=5?4:3} 银两＝${s.herbs*(s.social>=5?4:3)} 银两 · 不耗月份`,disabled:s.herbs<1},{id:'buymax',label:'尽量购买米粮',detail:`${Math.floor(s.silver/3)} 包 × 5 份＝${Math.floor(s.silver/3)*5} 份口粮 · 花 ${Math.floor(s.silver/3)*3} 银两，不耗月份`,disabled:s.silver<3},{id:'buygrain',label:'购买一包米粮',detail:'3 银两换 5 份口粮 · 不耗月份',disabled:s.silver<3},{id:'sellherb',label:'售出一株灵草',detail:`1 株换 ${s.social>=5?4:3} 银两 · 不耗月份`,disabled:s.herbs<1},{id:'buymanual',label:`购取${ITEMS.manual[1].name}`,rarity:ITEMS.manual[1].rarity,detail:`12 银两，不耗月份 · 需根骨 2、悟性 2${missingAttributes(s,1).length?' · 属性未足':''}`,disabled:s.silver<12||s.manuals.includes(1)||missingAttributes(s,1).length>0},{id:'heal',label:'寻医疗伤',detail:'5 银两 · 疗伤耗一月',disabled:s.silver<5||s.wounds===0},{id:'buyelixir',label:`求购${ITEMS.elixir.name}`,rarity:ITEMS.elixir.rarity,detail:`开脉前适用 · 10 银两 · 接下来 6 次实际吐纳功行 +25% · 不叠加、不耗月份${s.elixirBoost?` · 当前剩 ${s.elixirBoost} 次`:''}`,disabled:s.silver<10||s.elixirBoost>0});
  if(s.story.guText&&!s.story.guFragments)base.push({id:'buyFragments',label:'寻回星篆缺页',detail:'银钱 −5；补齐顾闻溪考据所需残篇；可另去后山找寻',disabled:s.silver<5});
  if(s.story.luHeard&&!s.story.luRoute&&!s.manuals.includes(3))base.push({id:'luMeet',label:'拜访商旅陆知衡',detail:'商路护卷与契书；打开不耗时'});
  if(s.story.luRoute&&s.story.luRoute!=='complete'&&!s.manuals.includes(3)&&s.month>=s.story.luMonth+5)base.push({id:'luReturn',label:s.story.luRoute==='fightDelayed'?'陆知衡 · 处理受损散卷':'陆知衡归还散卷',detail:s.story.luRoute==='fightDelayed'?'散卷受损已拖延五个月；可赔付修复后继续履约，也可卖出残卷离开；打开不耗时':'行云法需修满 10 月，再以银钱或灵草结契；打开不耗时'});
 }
 if(s.location==='temple'){
  for(const part of [1,2])if(afterManualReady(s,'cheng',part))base.push({id:`after-cheng-${part}`,label:part===1?'程上师 · 传法之后':'程上师 · 旧注回访',detail:'得法后的旧事有了下文；打开不耗月份'});
  base.push({id:'mentor',label:'拜访程上师',detail:'请益、结交或求法；打开菜单不耗时'});
  if(s.flags.mentor&&s.manuals.includes(2)&&!s.story?.chengRoute&&s.month>=(s.story?.chengMonth??0)+3)base.push({id:'chengFollowup',label:'程上师的差事',detail:'上师想起你整理旧卷的耐心；打开事件不耗时'});
  if(['guard','copyForPay'].includes(s.story?.chengRoute)&&!s.story?.chengReturn&&s.month>=s.story.chengMonth+5)base.push({id:'chengReturn',label:'程上师再谈旧卷',detail:'先前的差事有了后续；打开事件不耗时'});
  if(!s.story.sealPermit&&(s.npcFavor.cheng>=3||s.story.luCredential))base.push({id:'sealAudience',label:'求照骨玄泉池契',detail:'守池差事或归还护卷，得池契后还须备药入池；打开不耗时'});
  if(s.story.sealPermit)base.push({id:'spring',label:'取用照骨玄泉',detail:'池契已备；打开菜单不耗时'});
 }
 if(s.stage<3&&(s.progress>=cap(s)||s.foundationStrain>0))base.push({id:'stage',label:s.progress>=cap(s)?'冲击筑元':'调理元基裂隙',detail:s.progress>=cap(s)?'重新查看稳固或急进的条件；打开菜单不耗时':'功行未满，先修补元基或继续修炼；打开菜单不耗时'});
 if(s.stage===3){const missing=[];if(s.progress<cap(s))missing.push(`功行差 ${Math.ceil((cap(s)-s.progress)*100)/100}`);if(!s.spring)missing.push('华池');if(s.focus<50)missing.push('心神 50');if(s.grain<2)missing.push('口粮 2');if(s.wounds>=4)missing.push('需疗伤');base.push({id:'attempt',label:'冲击开脉',detail:missing.length?`尚需：${missing.join('、')}`:'一次机会 · 失败即终局',disabled:missing.length>0});}
 if(s.location==='market')return base.filter(a=>!['secludeYear','cultivate','manual','rest'].includes(a.id));
 return base;
}
function batchCultivate(initial,limit,rng){let s=initial,trained=0,rested=0,gathered=0,reason='约定的闭关期限已满';
 const start={month:s.month,progress:s.progress,root:s.root,wit:s.wit,body:s.body,dao:s.dao,grain:s.grain,herbs:s.herbs,affinity:{...points(s)}};
 s.batchActive=true;
 for(let i=0;i<limit;i++){
  if(s.pending){reason='眼前有事，需要亲自抉择';break;}
  if(s.ending){reason='此生已终';break;}
  if(s.progress>=cap(s)){reason='本层功行已满';break;}
  if(s.lifeLimitMonths-s.ageMonths<=12||s.wounds>=4){reason='寿元或伤势已近险境';break;}
  let action;
  if(s.grain<=1&&s.location==='mountain'&&s.focus>=12)action='gather';
  else if(s.grain===1&&s.location==='mountain')action='rest';
  else if(s.grain<=1){reason='口粮将尽，需亲自补给';break;}
  else if(s.focus<18)action='rest';
  else action='cultivate';
  const next=step(s,`action:${action}`,rng);
  if(next.month===s.month&&!next.pending){reason='无法继续闭关';break;}
  s=next;if(action==='gather')gathered++;else if(action==='rest')rested++;else trained++;
  if(action==='cultivate'&&s.pending?.startsWith('scene-')&&!s.ending){const pending=s.pending;s.pending=null;const recovered=step(s,'action:rest',rng);s=recovered;s.pending=pending;rested++;reason='静养恢复后，遇到必须亲自处理的随机事件';}
  if(s.pending){reason=reason==='静养恢复后，遇到必须亲自处理的随机事件'?reason:'遇到必须亲自处理的事件或筑元关口';break;}
  if(s.ending){reason='此生已终';break;}
 }
 delete s.batchActive;
 const months=s.month-start.month;
 if(months)note(s,`闭关${months}个月：吐纳${trained}个月、静养${rested}个月${gathered?`、采药补给${gathered}个月`:''}。${reason}。`,'闭关',`本层功行 +${(s.progress-start.progress).toFixed(2)} · 口粮 ${s.grain-start.grain>=0?'+':''}${s.grain-start.grain} · 灵草 ${s.herbs-start.herbs>=0?'+':''}${s.herbs-start.herbs}${AFFINITY_KEYS.filter(k=>(points(s)[k]||0)!==(start.affinity[k]||0)).map(k=>` · ${ELEMENTS[k]||POLARITIES[k]}亲和 ${start.affinity[k]||0}→${points(s)[k]||0}`).join('')}${s.root!==start.root?` · 根骨 +${s.root-start.root}`:''}${s.wit!==start.wit?` · 悟性 +${s.wit-start.wit}`:''}${s.body!==start.body?` · 体魄 +${s.body-start.body}`:''}${s.dao!==start.dao?` · 道心 +${s.dao-start.dao}`:''}`);
 else note(s,`闭关尚未开始：${reason}。`,'闭关');
 return s;
}
function batchGather(initial,rng){let s=initial,gathered=0,rested=0,reason='半年的采药计划已满';
 const start={month:s.month,herbs:s.herbs,grain:s.grain,focus:s.focus};s.batchActive=true;
 for(let i=0;i<6;i++){
  if(s.pending){reason='遇到需要亲自处理的事';break;}
  if(s.ending){reason='此生已终';break;}
  if(s.lifeLimitMonths-s.ageMonths<=12||s.wounds>=4){reason='寿元或伤势已近险境';break;}
  const action=s.focus>=12?'gather':'rest';
  if(action==='rest'&&s.grain===0){reason='口粮不足以支撑静养';break;}
  s=step(s,`action:${action}`,rng);
  if(action==='gather')gathered++;else rested++;
  if(s.pending){reason='山路上有人求助，需要亲自抉择';break;}
  if(s.ending){reason='此生已终';break;}
 }
 delete s.batchActive;
 const months=s.month-start.month;
 if(months)note(s,`连采${months}个月：采药${gathered}个月、静养${rested}个月。${reason}。`,'采药',`灵草 ${s.herbs-start.herbs>=0?'+':''}${s.herbs-start.herbs} · 口粮 ${s.grain-start.grain>=0?'+':''}${s.grain-start.grain} · 心神 ${s.focus-start.focus>=0?'+':''}${s.focus-start.focus}`);
 else note(s,`采药尚未开始：${reason}。`,'采药');
 return s;
}
function stepInternal(input,command,rng=Math.random){const s=copy(input);if(s.ending)return s;
 const [kind,id]=command.split(':');
 if(kind==='combat'){if(id==='auto-aggressive'||id==='auto-steady')autoSpar(s,id.slice(5),rng);else sparRound(s,id,rng);return s;}
 if(kind==='travel'){if(s.pending||s.combat||!LOCATIONS[id])return s;if(s.location==='arena'&&id!=='arena')s.trainingGear={staff:false,vest:false,shoes:false,talisman:false};s.location=id;note(s,`你来到${LOCATIONS[id].name}。`);if(id==='arena'&&!s.story.arenaLessonSeen){s.story.arenaLessonSeen=true;note(s,'演武坪上，传功弟子正给新入门弟子演示行气招式。你在旁看了一阵，见这些都是入门弟子可以习练的功夫，便也上前随众习招。此后可在此习招、切磋。','见闻');}
  if(id==='mountain'&&!s.story.mountainSpringSeen){s.story.mountainSpringSeen=true;const raised=raiseAffinity(s,'water');note(s,raised?'山雨过后，药径旁一眼清泉从石缝中涌出。你以泉水涤去一路尘土，水气顺经脉缓缓游走；泉眼随即复归寂静，此后再来，已无初见时的洗脉之效。':'山雨过后，你在药径旁见到一眼清泉。你以泉水涤尘，水气入脉，却发现自身水行亲和已至极境；泉眼随即复归寂静。','奇遇',raised?'水亲和 +1':'水亲和已满');}
  if(s.story?.yeFollowup&&id==='cliff'&&!s.story.guReacted){s.story.guReacted=true;note(s,s.story.yeClue==='map'?'顾闻溪听你说起买来的旧图，辨出其上被故意颠倒的泉脉符号。':s.story.yeClue==='solo'?'顾闻溪见你带回独行时画下的山势，替你校正了一处险径。':'顾闻溪听闻你在药径的选择，提醒你泉脉之外也要顾惜资粮。','人情');}
  return s;}
 if(kind==='action'){
  if(s.pending||!available(s).some(a=>a.id===id&&!a.disabled))return s;
  const beforeMonth=s.month;
  if(id.startsWith('spar-')){startSpar(s,id.slice(5));return s;}
  if(id.startsWith('learn-')){const tech=id.slice(6);if(TECHNIQUES[tech]&&s.stage>=TECHNIQUES[tech].stage&&!techniqueMissing(s,tech).length){s.knownTechniques=s.knownTechniques||[];if(!s.knownTechniques.includes(tech))s.knownTechniques.push(tech);s.techniquePractice=s.techniquePractice||{};s.techniquePractice[tech]=s.techniquePractice[tech]||0;note(s,`你在演武坪受诀后反复揣摩${TECHNIQUES[tech].name}，拆招、调息、印证一月，终于能在交手中施展。`,'演武','习得招式 · 耗时 1 月');turn(s);}return s;}
  if(id.startsWith('kit-')){const slot=id.slice(4);if(!['staff','vest','shoes','talisman'].includes(slot))return s;s.trainingGear=s.trainingGear||{staff:false,vest:false,talisman:false};s.trainingGear[slot]=!s.trainingGear[slot];discover(s,'gear',slot);return s;}
  if(id==='secludeYear')return batchCultivate(s,12,rng);
  if(id==='gatherSeason')return batchGather(s,rng);
  if(id.startsWith('after-')){s.pending=id;return s;}
  if(id==='cultivate'){const gained=Math.min(cultivationGain(s),Math.max(0,cap(s)-s.progress));s.progress=Math.round((s.progress+gained)*100)/100;s.totalProgress=Math.round((s.totalProgress+gained)*100)/100;add(s,{focus:-22});trainAttribute(s);if((s.elixirBoost||0)>0)s.elixirBoost--;note(s,`你依${ITEMS.manual[s.manual].name}吐纳行气，积累这一层的功行。`,'修行',`功行 +${gained.toFixed(2)}${s.elixirBoost>0?` · 聚气余效 ${s.elixirBoost} 次`:''}`);turn(s);if(!s.ending&&s.stage<3&&s.progress>=cap(s))s.pending='stage';}
  if(id==='rest'){const body=effectiveBody(s);add(s,{focus:48+(body-3)*4+(s.talent==='vitality'?12:0),wounds:body>=5?-2:-1});note(s,'你暂歇一月，收束杂念，调养经脉。','日常');turn(s);}
  if(id==='study'){add(s,{focus:-16,insight:s.talent==='clarity'?2:1,silver:s.insight>=5?2:0});note(s,'你推演蚀文，一字多解，终于窥见道书中隐藏的行气之理。','研经');study(s);turn(s);if(!s.ending&&!s.flags.scroll){s.flags.scroll=true;s.pending='scroll';}}
  if(id==='gather'){add(s,{focus:-15,herbs:rand(rng)<.28?2:1,grain:5});if(s.story.yeText&&s.story.yeText!=='complete')s.story.yeHerbWork=Math.min(2,(s.story.yeHerbWork||0)+1);note(s,'你沿山径采下灵草，也带回一些野菜与谷物，足够支撑一阵子。','采集');turn(s);if(!s.ending&&!s.flags.herbalist){s.flags.herbalist=true;s.pending='herbalist';}}
  if(id==='yeFollowup')s.pending='yeFollowup';
  if(id==='stoneScout')s.pending='stoneScout';
  if(['guFollowup','guReturn','chengFollowup','chengReturn','guText','guFinish','yeText','yeFinish','luMeet','luReturn','sealAudience','stoneScout'].includes(id))s.pending=id;
  if(id==='seclusion')s.pending='seclusion';
  if(id==='spring')s.pending='spring';
  if(id==='mentor'){s.pending=canRevealTrueText(s)?'trueText':'mentor';if(s.story?.yeFollowup&&!s.story.chengReacted){s.story.chengReacted=true;note(s,s.story.yeRoute==='help'?'程上师听闻你曾替叶青蘅疗伤，谈及泉脉时多说了几句。':s.story.yeRoute==='trade'?'程上师听闻你以银钱换得旧图，提醒你看清图上的旧记号。':'程上师看过你独行留下的山路痕迹，劝你别拿性命赌一眼泉光。','人情');}}
  if(id==='manual')s.pending='manual';
  if(id==='stage')s.pending='stage';
  if(id==='attempt')s.pending='attempt';
  if(id==='buygrain'||id==='buymax'){const packs=id==='buymax'?Math.floor(s.silver/3):1;add(s,{silver:-packs*3,grain:packs*5});note(s,`你在坊市购得${packs*5}份口粮，可供往后修行。`,'交易',`银钱 −${packs*3} · 口粮 +${packs*5}`);}
  if(id==='sellherb'||id==='sellall'){const price=s.social>=5?4:3,amount=id==='sellall'?s.herbs:1;add(s,{herbs:-amount,silver:price*amount});note(s,`药铺收下${amount}株灵草，给了你${price*amount}两银钱。`,'交易',`灵草 −${amount} · 银钱 +${price*amount}`);}
  if(id==='buymanual'){add(s,{silver:-12});earnManual(s,1,'你在坊市购得法卷');}
  if(id==='buyFragments'){add(s,{silver:-5});s.story.guFragments=true;note(s,'你向书商购回缺失的一页星篆。断简已齐，还须回千丈岩核对行气。','法门','银钱 −5');}
  if(id==='findFragments'){add(s,{focus:-24,wounds:effectiveBody(s)<4?1:0});s.story.guFragments=true;note(s,'你循残卷中的山势标记，从岩缝里找到星篆缺页。此行劳损经脉，需回千丈岩试行真章。','法门');turn(s);}
  if(id==='bodyTonic'){add(s,{herbs:-2,focus:-16,body:1});s.lifeLimitMonths+=12;note(s,'你依叶青蘅所示，将两株灵草炼为温养汤，体魄稍健，寿限也延长一年。','延寿','体魄 +1 · 寿限 +1 年');turn(s);}
  if(id==='heal'){add(s,{silver:-5,wounds:-2,focus:12});note(s,'医者以药汤疏通郁结，暗伤渐消。','伤病');turn(s);}
  if(id==='marketWalk'){note(s,'你在坊市听商贩与行脚修士议论山中近况，顺手帮摊主理了货。','交易');if(!s.story.luHeard){s.story.luHeard=true;note(s,'坊间有人说商旅陆知衡正在寻护卷之人，你记住了他的名字。','人情');}turn(s);sceneEvent(s,rng);if(!s.pending&&!s.ending){add(s,{silver:2});note(s,'这一月没有新奇线索，摊主结了两两工钱。','交易','银钱 +2');}return s;}
  if(id==='buyelixir'){add(s,{silver:-10});s.flags.elixir=true;s.elixirBoost=6;note(s,`你换来一枚${ITEMS.elixir.name}。接下来六次实际吐纳，所得功行提高四分之一。`,'修行','银钱 −10 · 6 次吐纳功行 +25%');}
  if(s.month>beforeMonth)sceneEvent(s,rng);
 }
 if(kind==='choice'){
  const opt=options(s).find(o=>o.id===id&&!o.disabled);if(!opt)return s;
  const event=s.pending;s.pending=null;
  if(id==='back')return s;
  if(event?.startsWith('after-')){
   if(id==='back')return s;
   const [,who,part]=event.split('-'),memory=s.story.afterManual||(s.story.afterManual={});
   const record=memory[who]||(memory[who]={});
   const outcomes={
    publish:[{focus:-18,insight:2},'gu',1,'顾闻溪将误字连同你的旧注一并誊入校本。她说：“错处有名有姓，后来人才知道从哪里接着读。”你们各自在卷末署名。'],reserve:[{focus:-12,insight:1},'gu',-1,'你留下误字独自重校。顾闻溪看见缺了的一页，合上卷册：“我等你的定本，但这一行不能再让人照着练。”'],
    treat:[{herbs:-2,focus:-12},'ye',1,'叶青蘅接过你分出的药，先替伤者止血，才有空擦手上的泥。“药不是长在账册里的，”她说，“你这份我记得。”'],keep:[{herbs:-1,wounds:-1,focus:12},'ye',-1,'你用药护住自己的经络，山径的伤者由叶青蘅另寻药治。她只说：“你也要冲关，我明白。下一次上山，记得多备些。”'],
    honor:[{silver:-5},'lu',1,'陆知衡把余卷一页页点清，抽出你写的履约文书夹在账里。“银钱可结，信用要走过一趟商路才算数。”你替他把卷送回原主。'],broker:[{focus:-15,silver:8},'lu',-1,'你将余卷押在坊市，替陆知衡谈成一笔新买卖。他在契尾添了一行小字：“若拓本误传，持卷人自行说明。”'],
    teach:[{focus:-20,dao:1},'cheng',1,'程上师把一群刚入观的弟子交到你面前：“会练是一回事，教得别人不走岔路，又是一回事。”你陪他们从最浅的一口气练起。'],withdraw:[{silver:6},'cheng',-1,'你接过校卷酬劳，谢绝教习。程上师收起戒尺：“修自己的道也要时日。只望你日后记得，这门法从谁手中来。”'],
    annotate:[{focus:-16,insight:2},'gu',1,'数月后，顾闻溪把校本寄到你案头，误字旁已补上两种读法。“前一版是我们共同犯的错，”她在信末写道，“这一版也是共同改的。”'],fee:[{silver:7},'gu',0,'顾闻溪独自校成新本，按约送来译注酬金。她在附笺里写道：“你那一行旧解，我留着给后学辨。”'],correct:[{focus:-14,insight:1},'gu',1,'你终于把留存的误字交还。顾闻溪没有责问，只将两张旧注叠在一起：“肯改过来，后学就少走一段歧路。”'],sell:[{silver:9},'gu',-1,'书商买下你的单行校注；顾闻溪在摊前认出了笔迹。她不拦这笔生意，只不再与你合署新的卷册。'],
    receive:[{herbs:3},'ye',1,'叶青蘅捎来一包晒好的山药：“上回那人能走路了。她不识字，让我替她写一句谢。”包里另有三株灵草。'],visit:[{focus:-16,wounds:-2},'ye',1,'叶青蘅邀你同去回诊。伤者已能下地，她在灶边煮药，叶青蘅顺手替你清了旧伤：“给人诊脉，也看看自己的。”'],remedy:[{herbs:-2,dao:1},'ye',1,'你带药重走那条山径。叶青蘅收下药，只说：“来得迟些，总比把这事当成从未发生好。”'],formula:[{silver:-4,wounds:-2},'ye',0,'你付清药方钱，叶青蘅在纸角添了服药的时辰：“买卖归买卖，药煎错了我还是会骂你。”'],
    credit:[{silver:10},'lu',1,'商队凭你的履约文书放出一张信用票。陆知衡说：“这一回不用你押银了。可别让我在账上改主意。”'],supplies:[{grain:18},'lu',0,'你没有收回礼的银钱，叫陆知衡换成十八份闭关口粮。他把每袋都记了重，免得人说商路亏了你。'],settle:[{silver:-6},'lu',1,'你把误传的抄卷人请到摊前，赔清六两。陆知衡看着你重写卷目：“契外的账，也算你肯认。”'],defend:[{focus:-18,insight:2},'lu',0,'你当众辨出余卷的来源，逐处指给抄卷人看。陆知衡听完合上账：“有些亏损能用话补，有些不能；今天这笔算补上了。”'],
    guide:[{focus:-18,insight:2},'cheng',1,'一个弟子拿着你旧日写下的行气注来问，程上师站在门边没有替你回答。你重新推演一遍，才发现当年的省略处。'],entrust:[{grain:10},'cheng',0,'你将教习的笔记交还程上师。他给你十份口粮：“各有自己的关要过，去闭你的关吧。”'],lecture:[{focus:-15,insight:2},'cheng',1,'你携旧注回观，程上师用朱笔圈出两处异文：“取了酬劳，也没有把学问丢下。”这次你们谈到暮钟响起。'],keepPay:[{silver:5},'cheng',0,'程上师照旧约结清后续抄卷银钱，没有再派差事。你带着资粮离开，得以安心修自己的功课。']
   };
   const [delta,person,favorChange,line]=outcomes[id];add(s,delta);if(favorChange)favor(s,person,favorChange);
   if(part==='1'){record.first=id;record.month=s.month;}else record.second=id;
   note(s,line,part==='1'?'抉择':'人情',Object.entries(delta).map(([key,val])=>`${{focus:'心神',insight:'心得',herbs:'灵草',wounds:'暗伤',silver:'银钱',dao:'道心',grain:'口粮'}[key]} ${val>0?'+':''}${val}`).concat(favorChange?`${{gu:'顾闻溪',ye:'叶青蘅',lu:'陆知衡',cheng:'程上师'}[person]} ${favorChange>0?'+':''}${favorChange}`:[]).join(' · '));
   if(new Set(['publish','reserve','treat','keep','honor','broker','teach','annotate','correct','visit','remedy','defend','guide','lecture']).has(id))turn(s);
   return s;
  }
  if(event==='guText'){
   if(id==='back')return s;s.story.guText=id;s.story.guTextMonth=s.month;
   if(id==='collaborate'){add(s,{focus:-16});favor(s,'gu',1);note(s,'你与顾闻溪合校星篆残篇，她指出缺失的一页须另寻，允你校成后自行试法。','法门','顾闻溪 +1 · 尚缺一页');}
   else {add(s,{silver:-6,focus:-20});favor(s,'gu',-1);note(s,'你向书商自购星篆残篇，避开顾闻溪独自考据，缺页仍须另寻。','抉择','银钱 −6 · 顾闻溪 −1');}
   turn(s);return s;
  }
  if(event==='guFinish'){
   if(id==='back')return s;add(s,{focus:-25,herbs:s.story.guText==='independent'?-1:0});s.story.guText='complete';earnManual(s,4,s.story.guFirst==='hide'?'昔日曾私藏蚀文，如今将残篇重新核定':'你将星篆残页逐字核对');turn(s);return s;
  }
  if(event==='yeText'){
   if(id==='back')return s;s.story.yeText=id;s.story.yeTextMonth=s.month;add(s,{herbs:-1,focus:id==='tend'?-16:-12,wounds:id==='sample'?1:0});favor(s,'ye',id==='tend'?1:-1);note(s,id==='tend'?'你与叶青蘅一起养护泉脉，抄得青华篇的行气纲目；仍要亲自采药验证。':'你独取泉样推演青华篇，虽伤了经脉，却不欠同行人情；仍要亲自采药验证。',id==='tend'?'人情':'抉择');turn(s);return s;
  }
  if(event==='yeFinish'){
   if(id==='back')return s;add(s,{herbs:-2,focus:-22});s.story.yeText='complete';earnManual(s,5,'两次采药验证之后，青华法脉终于应和你自身经络');turn(s);return s;
  }
  if(event==='luMeet'){
   if(id==='back')return s;if(id==='fight'){note(s,'你答应替陆知衡护卷。商队刚出坊市，截卷修士便从后巷追了上来。','抉择');turn(s);if(s.ending)return s;s.story.luRoute='fight';s.story.luMonth=s.month;startSceneCombat(s,'scrollBandit','luEscort');return s;}s.story.luRoute=id;s.story.luMonth=s.month;add(s,id==='pledge'?{silver:-6}:{focus:-30,wounds:1});favor(s,'lu',1);earnManual(s,6,id==='pledge'?'你与陆知衡立下护卷契书':'你替陆知衡护送散卷');note(s,'陆知衡收起归还文书：行云法只是过渡，欲求密卷还得勤修此法并结清此契。','人情');turn(s);return s;
  }
  if(event==='luReturn'){
   if(id==='back')return s;
   if(id==='repairScrollSilver'||id==='repairScrollHerbs'){add(s,id==='repairScrollSilver'?{silver:-4}:{herbs:-2});s.story.luRoute='fight';s.story.luPapersDamaged=false;s.story.luMonth=s.month;favor(s,'lu',1);earnManual(s,6,'你赔付修复散卷，陆知衡重新将护卷之约托付给你');note(s,'你补齐受损卷页与赔偿，陆知衡愿意继续这份护卷之约。','人情');turn(s);return s;}
   if(id==='sellPapers'){const recovery=s.story.luRoute==='fightDelayed'?6:12;add(s,{silver:recovery});s.story.luRoute='complete';note(s,'你将护卷所得卖给书商，结清陆知衡的契书，改取现钱；这条密卷线至此结束。','抉择',`银钱 +${recovery}`);return s;}
   add(s,id==='redeemSilver'?{silver:-8}:{herbs:-3});s.story.luRoute='complete';s.story.luCredential=true;favor(s,'lu',1);favor(s,'cheng',1);earnManual(s,3,'你还卷履约，陆知衡与程上师核过卷中缺页，才准许你承受太微真章');note(s,'陆知衡留下履约文书，可作日后求照骨玄泉的凭证。','人情');turn(s);return s;
  }
  if(event==='sealAudience'){
   if(id==='back')return s;
   if(id==='serveSeal'){add(s,{focus:-20});turn(s);if(s.ending)return s;turn(s);if(s.ending)return s;favor(s,'cheng',1);s.story.sealDebt='守池差事';note(s,'你替下院守池两月，程上师交付照骨玄泉池契；往后仍欠一份宗门差事。','人情');}
   else {add(s,{silver:-8});turn(s);if(s.ending)return s;favor(s,'lu',1);s.story.sealDebt='护卷抵契';note(s,'你把护卷凭证呈给守池人，再交八两资粮，换得照骨玄泉池契。','人情');}
   s.story.sealPermit=true;return s;
  }
  if(event==='stoneScout'){
   if(id==='back')return s;
   if(id==='yieldSpring'){discoverCombatant(s,'springRival');discover(s,'people','wen');s.story.stoneClue=true;s.story.springRivalFavor=(s.story.springRivalFavor||0)+1;favor(s,'wen',1);recordCombatantObservation(s,'springRival','愿意分享泉脉线索，先让来客记下地势。');note(s,'你让闻秋先行探泉，他留下石髓池的脉线方位。','见闻','闻秋好感 +1');return s;}
   if(id==='negotiateSpring'){add(s,{silver:-3});turn(s);if(s.ending)return s;s.story.stoneClue=true;s.story.stonePriority=true;discoverCombatant(s,'springRival');discover(s,'people','wen');s.story.springRivalFavor=(s.story.springRivalFavor||0)+1;favor(s,'wen',1);recordCombatantObservation(s,'springRival','收下银钱后让出本次优先探查权。');note(s,'你付给闻秋三两银钱，换得石髓池脉线索与本次优先探查权。','见闻','银钱 −3');return s;}
   if(id==='contestSpring'){discover(s,'people','wen');turn(s);if(s.ending)return s;startSceneCombat(s,'springRival','springContest');return s;}
   add(s,{herbs:-1,focus:-24,wounds:effectiveBody(s)<5?1:0});s.story.stoneClue=true;note(s,'你循地脉辨出苍梧石髓池所在。这里只是找到泉眼，真正入池尚需灵草与心神。','华池');turn(s);return s;
  }
  if(event==='seclusion'){if(id==='back')return s;return batchCultivate(s,{three:3,six:6,twelve:12}[id],rng);}
  if(event==='scroll'){
   if(id==='share'){add(s,{insight:1,silver:2});favor(s,'gu',2+(s.social>=5?1:0));favor(s,'cheng',1);note(s,'你将残卷的隐义如实告诉同门顾闻溪。她记下这份人情，也替你带来两两润笔银，并向程上师举荐了你。','人情');}
   if(id==='hide'){add(s,{insight:2});favor(s,'gu',-1);note(s,'你独自留下关键一页。参悟更深了，顾闻溪却察觉了你的保留。','抉择');}
   if(id==='selltext'){add(s,{silver:7});favor(s,'gu',-1);note(s,'你将释文卖给抄书人，眼前资粮充足，顾闻溪却不再轻信你的讲解。','抉择');}
   turn(s);s.story.guMonth=s.month;s.story.guFirst=id;
  }
  if(event==='herbalist'){
   s.story.yeRoute=id;s.story.yeMonth=s.month;
   if(id==='help'){add(s,{herbs:-1,insight:1});favor(s,'ye',2);favor(s,'cheng',1);note(s,'你分药救了山中采药人叶青蘅。她指出泉脉的走向，并为你在程上师面前作保。','人情','灵草 −1 · 叶青蘅 +2 · 程上师 +1 · 心得 +1');}
   if(id==='trade'){add(s,{silver:8});favor(s,'ye',-1);note(s,'你为叶青蘅指路，收下八两报酬。眼前资粮宽裕了，她却不再愿为你作保。','抉择','银钱 +8 · 叶青蘅 −1');}
   if(id==='leave'){note(s,'你绕过受伤的采药人，未作停留便循旧路返回。','抉择','保留本月时间、口粮与灵草');return s;}
   turn(s);
  }
  if(event==='yeFollowup'){
   s.story.yeFollowup=id;
   if(id==='accompany'){add(s,{focus:-18,...(s.origin==='herbalist'?{herbs:1}:{})});favor(s,'ye',1);s.story.yeClue='trust';note(s,`叶青蘅记得你当初分药相救，与你重访泉径。${s.origin==='herbalist'?'你辨出路旁一株可用的灵草。':''}她答应替你带路，寻仙品华池时可以少备银钱。`,'人情','叶青蘅 +1 · 寻泉少花 2 银'+(s.origin==='herbalist'?' · 灵草 +1':''));}
   if(id==='part'){add(s,{focus:-12,herbs:2});note(s,'你替叶青蘅采好一程药，各自告别。灵草可供换钱或求法，你仍可凭已有的人情自行寻泉。','抉择','灵草 +2');}
   if(id==='buyMap'){const price=s.social>=5?3:4;add(s,{silver:-price,focus:-12,...(s.wit>=5||s.talent==='clarity'?{insight:1}:{})});s.story.yeClue='map';note(s,`叶青蘅记得你上次索酬，按商路规矩卖给你一张旧图。${s.wit>=5||s.talent==='clarity'?'你还读出一行蚀文批注。':''}这张图能代替她本人引你寻泉，却要另备银钱。`,'抉择',`银钱 −${price} · 得旧图${s.wit>=5||s.talent==='clarity'?' · 心得 +1':''}`);}
   if(id==='cash'){add(s,{silver:5,focus:-16});note(s,'叶青蘅记得你愿以钱物相易，介绍了一份山下短工。你带走工钱，没有再问泉径。','抉择','银钱 +5');}
   if(id==='solo'){const cost=soloFocus(s),injury=effectiveBody(s)<5&&s.talent!=='vitality'?1:0;add(s,{focus:-cost,wounds:injury});s.story.yeClue='solo';note(s,`你记得初遇时绕过叶青蘅的药径，循${s.root>=4?'山势':s.wit>=5?'旧文字记':'心中所悟'}独自找出一条泉路。${injury?'岩石割伤了你。':'你避开了险处。'}不用仰赖人情和银钱，深入时仍需耗费更多心神。`,'抉择',`得独行线索 · 心神 −${cost}${injury?' · 暗伤 +1':''}`);}
   if(id==='forage'){add(s,{focus:-12,herbs:2,grain:2});note(s,'你记得初遇时绕道保住了时间与灵草，如今仍避开险径，采药添粮以备修行。','抉择','灵草 +2 · 口粮 +2（本月消耗 1）');}
   turn(s);
  }
  if(event==='trueText'){
   if(id==='undertake'){add(s,{focus:-20});s.story.trueTextReady=true;note(s,'程上师见你已勤修导脉经，又曾替他校订旧卷，便托你核对一部未署名的密卷。你守约校毕，他才说出其中藏着《太微玉脉真章》，准你备足资粮后再来求法。','法门','心神 −20 · 获准求取真章');turn(s);}
   if(id==='defer'){s.story.trueTextNextMonth=s.month+6;note(s,'你没有贸然应下校卷之约。上师收起密卷，约你半年后再谈。','抉择');}
  }
  if(event==='guFollowup'){
   s.story.guRoute=id;s.story.guMonth=s.month;
   if(id==='compare'){add(s,{focus:-16,insight:2});favor(s,'gu',1);note(s,`${s.story.guFirst==='hide'?'顾闻溪记得你曾私藏关键一页，校卷时仍留了三分谨慎。':s.story.guFirst==='selltext'?'顾闻溪知道你曾卖过释文，这次请你把每一行来历说清。':'顾闻溪记得你分享残卷时的坦诚。'}你们对读旧页，校出一段新的行气注解。`,'人情','心得 +2 · 顾闻溪 +1');turn(s);}
   if(id==='commission'){add(s,{silver:8});note(s,`${s.story.guFirst==='selltext'?'顾闻溪记得你熟悉书商，这回索性托你去交稿。':'顾闻溪请你把修订稿交给山下书商。'}你换得一笔酬劳，也把两家的生意搭上了线。`,'抉择','银钱 +8');turn(s);}
   if(id==='decline')note(s,'你谢绝顾闻溪的邀约，保留时间打磨自己的功行。她记下了你的选择。','抉择');
  }
  if(event==='guReturn'){
   s.story.guReturn=id;
   if(id==='joint'){add(s,{focus:-18,insight:1});favor(s,'gu',1);s.story.guSpringDiscount=true;note(s,'顾闻溪带来新校的泉脉旧注。你们合力辨清一处错标，寻访深谷泉时可少花一两。','人情','心得 +1 · 顾闻溪 +1 · 寻泉少花 1 银');turn(s);}
   if(id==='private'){add(s,{insight:1});favor(s,'gu',-1);note(s,'你借顾闻溪的旧注自行参悟，没有把所得再告知她。','抉择','心得 +1 · 顾闻溪 −1');}
   if(id==='copy'){add(s,{herbs:2});favor(s,'gu',1);note(s,'山下书商寄来一纸药方，顾闻溪请你誊录，你顺带辨出两株草药。','人情','灵草 +2 · 顾闻溪 +1');turn(s);}
   if(id==='wage'){add(s,{silver:6});note(s,'你替书商送回誊好的旧卷，带着酬金回山，药方留给了顾闻溪。','抉择','银钱 +6');turn(s);}
  }
  if(event==='chengFollowup'){
   s.story.chengRoute=id;s.story.chengMonth=s.month;
   if(id==='guard'){add(s,{focus:-20,dao:1});favor(s,'cheng',1);note(s,'程上师托你守藏书阁一夜。你没有翻阅不该看的卷册，他对你的道心更有把握。','人情','道心 +1 · 程上师 +1');turn(s);}
   if(id==='copyForPay'){add(s,{silver:8,insight:1});note(s,'你替程上师抄完旧卷，收下一笔润笔银，也辨明了卷末蚀文。','抉择','银钱 +8 · 心得 +1');turn(s);}
   if(id==='pass')note(s,'你婉拒程上师的差事。上师点头放你继续修行，旧卷便交给了旁人。','抉择');
  }
  if(event==='chengReturn'){
   s.story.chengReturn=id;
   if(id==='askMethod'){const gain=eventProgressGain(s,8);add(s,{focus:-18});s.progress=Math.round((s.progress+gain)*100)/100;s.totalProgress=Math.round((s.totalProgress+gain)*100)/100;favor(s,'cheng',1);note(s,'程上师见你守卷周全，亲自为你梳理一段行气疑难。','人情',`功行 +${gain.toFixed(2)} · 程上师 +1`);turn(s);if(!s.ending&&s.stage<3&&s.progress>=cap(s))s.pending='stage';}
   if(id==='askSupply'){add(s,{grain:5});favor(s,'cheng',-1);note(s,'你向上师领走闭关所需的米粮，暂缓谈法。','抉择','口粮 +5 · 程上师 −1');}
   if(id==='settle'){add(s,{silver:5});favor(s,'cheng',-1);note(s,'你结清抄卷剩余的酬劳，往后仍可凭本事求法。','抉择','银钱 +5 · 程上师 −1');}
   if(id==='gift'){favor(s,'cheng',1);note(s,'你将誊好的卷册留给程上师，没有再索酬。他记住这份心意。','人情','程上师 +1');}
  }
  if(event.startsWith('scene-')){
   if(id==='ignore'){note(s,'你把刚才的偶遇留在身后，继续原定的修行。','抉择');return s;}
   const key=event.slice(6);if(key==='mountainHerbs'&&id==='engageApe'){startSceneCombat(s,'ape');return s;}if(key==='mountainHerbs'&&id==='bypassApe'){s.story.apeEncounter='bypassed';add(s,{grain:1});note(s,'你循着猿踪绕过药丛，平安回到山径，改在别处采得些许口粮。','见闻','口粮 +1');return s;}
   const cost={keep:{focus:-12,insight:1},rest:{focus:16,grain:-1},audit:{focus:-12,grain:3},deliver:{grain:-2,silver:7},argue:{focus:-14,insight:1},listen:{focus:12},trace:{focus:-16,herbs:2},shelter:{focus:12,grain:1},harvest:{focus:-12,herbs:2},replant:{grain:3,dao:1},shortcut:{focus:-15,silver:5,wounds:effectiveBody(s)<5?1:0},wait:{focus:12,grain:2},bargain:{focus:-12,silver:4},stock:{silver:-2,grain:5},decode:{silver:-2,insight:1},sell:{silver:5,focus:-10}};
   const advanced={sortPulse:{focus:-18,insight:2},sortStore:{focus:-10,grain:6},readPulse:{focus:-18,progress:8},leadGroup:{focus:-10,silver:8},tapVein:{focus:-18,herbs:3},drawVein:{grain:-2,progress:7},buyScript:{silver:-5,progress:9},sellScript:{herbs:-1,silver:8},repairSeal:{herbs:-1,focus:-18},readSeal:{focus:-20,progress:11},forceFlow:{wounds:1,progress:12},holdArray:{insight:-1,focus:20},healCave:{herbs:-2,wounds:-2},seekCave:{focus:-20,herbs:4},buyPact:{silver:-6,progress:12},tradePact:{focus:-22,silver:10},closeBreath:{herbs:-1,focus:35,wounds:-1},openBreath:{focus:-24,progress:15},observeSky:{focus:-20,insight:2},guideSky:{focus:-20,silver:12},washSpring:{herbs:-2,wounds:-2,focus:20},gatherSpring:{focus:-20,herbs:4},buyRations:{silver:-7,grain:16},sellGoods:{herbs:-2,silver:12}};
   const delta=cost[id]||advanced[id],gained=eventProgressGain(s,delta.progress||0);
   if(delta.progress){delete delta.progress;add(s,{totalProgress:gained,progress:gained});}
   add(s,delta);if(id==='listen')study(s);
   if(id==='repairSeal')s.foundationStrain=Math.max(0,(s.foundationStrain||0)-1);
   const option=opt.label;note(s,`${LOCATIONS[s.location].name}的一桩小事：你选择${option}。`,'抉择',opt.detail.replace('刚才的行动已耗一月；',''));
   if(key==='mountainMist'&&id==='shortcut'&&effectiveBody(s)<5)note(s,'山雾遮住石阶，跌伤留下一点暗伤。','伤病');
   if(s.wounds>=6)end(s,'death','旧伤在动用灵息时一齐发作，你终究未能走出这次历练。');
   else if(s.stage<3&&s.progress>=cap(s))s.pending='stage';
  }
  if(event==='mentor'){
   if(id==='serve'){s.flags.mentor=true;add(s,{insight:1,silver:2});favor(s,'cheng',1+(s.social>=5?1:0));note(s,'你替程上师整理旧卷。他记住了你的耐心，留你讨论一道蚀文疑题。','人情');turn(s);s.story.chengMonth=s.month;}
   if(id==='guidance'){earnManual(s,2,'程上师见你根骨与悟性足以承法，将经卷相授');turn(s);}
   if(id==='raretext'){earnManual(s,3,'你以灵草与心得换得密卷');add(s,{herbs:-2});favor(s,'cheng',-1);note(s,`你以灵草与心得换来${ITEMS.manual[3].name}。上师告诫：真章虽妙，还需相配的华池。`,'法门');turn(s);}
  }
  if(event==='manual'){
   if(id==='back')return s;
   const chosen=Number(id.slice(6));if(!s.manuals.includes(chosen)||affinityMissing(s,ITEMS.manual[chosen]).length)return s;s.manual=chosen;note(s,`你转修${ITEMS.manual[chosen].name}，本层功行上限变为 ${cap(s)}。`,'法门');
   if(s.stage<3&&s.progress>=cap(s))s.pending='stage';return s;
  }
  if(event==='spring'){
   if(id==='common'){s.spring=1;note(s,`你选定${ITEMS.spring[1].name}。泉气清和，是初求开脉的依凭。`,'华池');turn(s);}
   if(id==='deep'){s.spring=2;add(s,{focus:-25});note(s,`你循地脉穿过幽涧，寻得${ITEMS.spring[2].name}，泉中灵气隐隐流转。`,'华池');turn(s);}
   if(id==='hidden'){const path=springPath(s);s.spring=3;add(s,{silver:-path.silver,focus:-path.focus});note(s,`${path.name==='叶青蘅旧图'?'你与顾闻溪辨读叶青蘅卖给你的旧图':path.name==='独行泉径'?'你独自越过深谷险径':`顾闻溪与叶青蘅${path.name==='叶青蘅同行'?'按约与你同行':'替你辨认泉脉'}`}，终寻得${ITEMS.spring[3].name}。`,'华池',`银钱 −${path.silver} · 心神 −${path.focus}`);turn(s);}
   if(id==='sealed'){s.spring=4;add(s,{herbs:-2,focus:-20,wounds:-1});note(s,'你持池契走入照骨玄泉，泉气洗去一层暗伤；开脉若要求极高品相，仍需自行稳固元基。','华池','灵草 −2 · 暗伤 −1');turn(s);}
   if(id==='stone'){const herbCost=s.story.stonePriority?1:2;s.spring=5;add(s,{herbs:-herbCost,focus:-30,wounds:effectiveBody(s)>=6||s.talent==='vitality'?0:1});s.story.stonePriority=false;note(s,'你以灵草导引石髓池中炽烈泉气。根骨得到回响，体魄不足者也会留下暗伤。','华池',`灵草 −${herbCost}${effectiveBody(s)>=6||s.talent==='vitality'?'':' · 暗伤 +1'}`);turn(s);}
  }
  if(event==='stage'){
   if(id==='defer')return s;
   if(id==='restore'){add(s,{herbs:-1,focus:-12});turn(s);if(s.ending)return s;turn(s);if(s.ending)return s;s.foundationStrain=Math.max(0,(s.foundationStrain||0)-1);note(s,'你以灵草缓缓温养破损的元基，裂隙合拢一层。暗伤仍须另行调养。','突破',`元基裂隙 ${s.foundationStrain}`);return s;}
   const old=s.stage,odds=stageChance(s,id),expected=stageGrade(s,id),drop=downgradeChance(s,id);
   if(id==='patient')add(s,{focus:-10});
   turn(s);if(s.ending)return s;
   if(id==='patient'){turn(s);if(s.ending)return s;}
   if(rand(rng)<odds/100){const lowered=drop>0&&rand(rng)<drop/100,grade=Math.max(1,expected-(lowered?1:0));s.stage++;s.progress=0;s.foundationGrades.push(grade);s.foundationStrain=0;
    if(id==='patient')add(s,{foundation:1,dao:1});else add(s,{wounds:1});
    note(s,`你依${ITEMS.manual[s.manual].name}冲开第${old+1}道筑元关，${lowered?'旧日冲关留下的元基裂隙在合脉时复发，品级跌落一档，':''}凝成${['','下品','中品','上品'][grade]}元基，踏入${STAGES[s.stage]}。`,'突破');
    if(s.month%12===0){const current=s.books.find(b=>b.year===year(s.month));if(current)current.stage=STAGES[s.stage];}
    if(s.wounds>=6)end(s,'death','仓促冲关留下的暗伤齐发，你终究未能走出这一关。');
   }else {s.progress=Math.round(Math.min(s.progress,cap(s))*.75*100)/100;add(s,{wounds:id==='hasty'?2:1});s.foundationStrain=Math.min(3,(s.foundationStrain||0)+(id==='hasty'?2:1));
    note(s,`第${old+1}道筑元关未破，功行损失四分之一，暗伤加深，元基留下 ${s.foundationStrain} 层裂隙。再冲关即使成功，也可能较预期降一品；可用灵草静养修补。`,'突破');
    if(s.wounds>=6)end(s,'death','筑元失利，旧伤尽数复发，此生道途戛然而止。');
   }
  }
  if(event==='attempt'){
   if(id==='back'){note(s,'你收回冲关之念，决定再作准备。');return s;}
   const odds=chance(s,id);add(s,{focus:-35});note(s,`你在${LOCATIONS[s.location].name}闭目运气，尝试冲击开脉。`,'开脉');turn(s);if(s.ending)return s;
   if(rand(rng)<odds/100){const g=grade(s,rand(rng),id);s.lifeLimitMonths+=30*12;end(s,'success',`仙脉豁然贯通，脉象定为${g}，寿限也延长了三十年。你终于真正踏入玄门，第一章至此结束。`,g);}
   else if(s.wounds>=2||rand(rng)<.32){end(s,'death','冲关时气机倒卷，仙脉未成，你重伤不治，求道一生止于苍梧山。');}
   else {end(s,'mortal','仙脉闭塞，强求再无余地。你下山归于凡俗，将未竟道途写进余生的旧卷。');}
  }
 }
 return s;
}
function discover(s,category,id){s.codex=s.codex||{people:[],beasts:[],gear:[],elixirs:[]};s.codex[category]=s.codex[category]||[];if(!s.codex[category].includes(id))s.codex[category].push(id);}
function discoverCombatant(s,id){const foe=SPAR_OPPONENTS[id];if(!foe)return;s.codex=s.codex||{};s.codex.combatants=s.codex.combatants||[];s.codex.combatantNotes=s.codex.combatantNotes||{};if(!s.codex.combatants.includes(id))s.codex.combatants.push(id);const note=s.codex.combatantNotes[id]||(s.codex.combatantNotes[id]={kind:foe.kind||'human',seenArts:[],seenGear:[],observations:[]});note.seenArts=note.seenArts||[];note.seenGear=note.seenGear||[];note.observations=note.observations||[];for(const slot of Object.keys(foe.gear||{}))if(!note.seenGear.includes(slot))note.seenGear.push(slot);if(foe.kind==='beast')discover(s,'beasts',id);}
function recordCombatantArt(s,id,art){if(!FOE_ARTS[art])return;discoverCombatant(s,id);const seen=s.codex.combatantNotes[id].seenArts;if(!seen.includes(art))seen.push(art);}
function recordCombatantObservation(s,id,text){discoverCombatant(s,id);const seen=s.codex.combatantNotes[id].observations;if(!seen.includes(text))seen.push(text);}
function step(input,command,rng=Math.random){const s=stepInternal(input,command,rng),pending=s.pending||'',action=command.split(':');
 if(s.location==='market')discover(s,'elixirs',ITEMS.elixir.id);
 if(pending==='scroll'||pending.startsWith('gu')||pending.startsWith('after-gu'))discover(s,'people','gu');
 if(pending==='herbalist'||pending.startsWith('ye')||pending.startsWith('after-ye'))discover(s,'people','ye');
 if(pending==='mentor'||pending==='trueText'||pending.startsWith('cheng')||pending.startsWith('after-cheng'))discover(s,'people','cheng');
 if(pending==='luMeet'||pending.startsWith('lu')||pending.startsWith('after-lu'))discover(s,'people','lu');
 if(action[0]==='action'&&action[1]==='mentor')discover(s,'people','cheng');
 return syncIds(s); }
return {KEY,STAGES,NEED,openingStory,ELEMENTS,ELEMENT_BEATS,POLARITIES,AFFINITY_KEYS,points,affinityMissing,affinityTrainingNeed,techniqueMissing,techniqueProgress,techniqueEffect,foeArtEffect,proficiencyName,aspectCompatible,compatibleElements,matchup,ORIGINS,TALENTS,LOCATIONS,ITEMS,SPAR_OPPONENTS,TECHNIQUES,FOE_ARTS,EQUIPMENT,create,migrate,cap,cultivationGain,studyNeed,stageChance,stageGrade,effectiveBody,combatStats,combatOptions,step,available,options,chance,quality,grade,year,time,lifeSummary};
});
