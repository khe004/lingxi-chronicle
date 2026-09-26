(() => {
  'use strict';
  const KEY = 'lingxi-chronicle-v1';
  const $ = (id) => document.getElementById(id);
  const levels = [
    ...Array.from({length: 9}, (_, i) => `炼气${'一二三四五六七八九'[i]}层`),
    ...Array.from({length: 3}, (_, i) => `筑基${'初中后'[i]}期`),
    ...Array.from({length: 3}, (_, i) => `金丹${'初中后'[i]}期`),
    ...Array.from({length: 3}, (_, i) => `元婴${'初中后'[i]}期`)
  ];
  const initial = () => ({version:1, level:0, exp:0, hp:100, energy:100, stones:12, pills:1, herbs:0, month:0, pending:null, logs:[{month:0, body:'你辞别山下故人，沿着灵溪走进云深处。破旧洞府里，只有一卷无字道经和一枚聚气丹。修仙之路，从今日开始。', special:true}]});
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && raw.version === 1 && Number.isInteger(raw.level) && raw.level >= 0 && raw.level < levels.length && Array.isArray(raw.logs) && raw.logs.length && Number.isFinite(raw.month)) return raw;
    } catch (_) {}
    return initial();
  }
  let s = load();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rand = (min,max) => min + Math.floor(Math.random()*(max-min+1));
  const cap = (n,min,max) => Math.max(min, Math.min(max,n));
  const need = () => 65 + s.level*27 + Math.floor(s.level*s.level*2.5);
  const year = () => Math.floor(s.month/12)+1;
  const date = (m) => `仙历第 ${Math.floor(m/12)+1} 年 · ${['孟春','仲春','季春','孟夏','仲夏','季夏','孟秋','仲秋','季秋','孟冬','仲冬','季冬'][m%12]}`;
  const esc = (v) => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notify = (msg) => { $('toast').textContent=msg; clearTimeout(notify.t); notify.t=setTimeout(()=>{$('toast').textContent='';},3000); };
  function save(){ try{localStorage.setItem(KEY,JSON.stringify(s));}catch(_){ notify('浏览器存储不可用，本次进度无法保存'); } }
  function log(body,result='',special=false,negative=false){ s.logs.push({month:s.month,body,result,special,negative}); s.logs=s.logs.slice(-60); }
  function advance(){ s.month++; }
  function apply(o){ if(o.exp) s.exp+=o.exp; if(o.hp) s.hp=cap(s.hp+o.hp,1,100); if(o.energy) s.energy=cap(s.energy+o.energy,0,100); if(o.stones) s.stones=Math.max(0,s.stones+o.stones); if(o.pills) s.pills=Math.max(0,s.pills+o.pills); if(o.herbs) s.herbs=Math.max(0,s.herbs+o.herbs); }
  function result(o){return Object.entries({exp:'修为',hp:'气血',energy:'灵气',stones:'灵石',pills:'聚气丹',herbs:'灵草'}).filter(([k])=>o[k]).map(([k,label])=>`${label} ${o[k]>0?'+':''}${o[k]}`).join(' · ');}
  function commit(body,o={},special=false){apply(o);log(body,result(o),special,Object.values(o).some(n=>n<0));save();render();}
  const encounters = [
    {title:'古道旁的求助',text:'一位受伤的采药人坐在树下。他说前方有妖兽出没，请你护送一程。',choices:[
      {label:'护送下山 · 耗 15 灵气',minEnergy:15,body:'你以灵气开路，护送采药人回村。他奉上一篮新采的灵草。',gain:{energy:-15,herbs:2,exp:16}},
      {label:'赠他伤药 · 耗 1 灵草',minHerbs:1,body:'你留下灵草，采药人告诉你一处隐秘的山泉。',gain:{herbs:-1,exp:30,energy:12}},
      {label:'绕路离去',body:'你记下那条危险的古道，独自踏着晚霞返回洞府。',gain:{exp:8}}]},
    {title:'山门旧碑',text:'一块残碑刻着半段吐纳法诀，碑后石匣似乎设有禁制。',choices:[
      {label:'参悟法诀',body:'你盘坐碑前，直到晨露落满衣襟，终于领会了其中的行气之法。',gain:{exp:rand(24,39),energy:-12}},
      {label:'打开石匣 · 耗 20 灵气',minEnergy:20,body:'禁制应声而散。匣中灵石微光流转，险些让你忘了天色。',gain:{stones:rand(8,15),energy:-20,hp:-6}},
      {label:'谨慎离开',body:'你拓下一角碑文，带回洞府慢慢揣摩。',gain:{exp:12}}]},
    {title:'雨夜灵狐',text:'一只白狐躲在松根下避雨，嘴里衔着一株带露的灵草。',choices:[
      {label:'以灵气为它疗伤 · 耗 18 灵气',minEnergy:18,body:'白狐痊愈，轻轻放下灵草。它转身前，带你寻得一处藏有灵石的岩穴。',gain:{energy:-18,herbs:2,stones:5,exp:12}},
      {label:'在雨中观察',body:'你静立许久，悟得山野生灵与天地灵气的呼应。',gain:{exp:22}},
      {label:'返回洞府',body:'雨势渐大，你将斗笠压低，踏上归途。',gain:{energy:8}}]},
    {title:'坊市偶遇',text:'一名游方炼丹师正要收摊，匣中还有一枚品相尚好的聚气丹。',choices:[
      {label:'买下丹药 · 耗 7 灵石',minStones:7,body:'炼丹师见你爽快，低价让出丹药，还指点了一句修行关窍。',gain:{stones:-7,pills:1,exp:10}},
      {label:'请教炼丹之道',body:'你听他谈火候与药性，虽暂不能开炉，却对灵气运转有了新理解。',gain:{exp:20}},
      {label:'闲逛坊市',body:'你帮摊主搬运货箱，换得几枚灵石。',gain:{stones:4}}]},
    {title:'林间妖影',text:'密林里一只黑背妖狼挡住去路，眼中闪着幽绿的光。',choices:[
      {label:'运气迎战 · 耗 20 灵气',minEnergy:20,body:'你稳住心神，以灵气震开妖狼。它逃入林中，身后留下守护的药圃。',gain:{energy:-20,hp:-rand(4,12),herbs:2,exp:28}},
      {label:'避其锋芒',body:'你藏身石后，待妖狼离开才继续赶路。谨慎也是修行。',gain:{exp:10}},
      {label:'撒灵石引开 · 耗 4 灵石',minStones:4,body:'妖狼被灵石的气息吸引，你趁机穿过密林。',gain:{stones:-4,exp:14}}]}
  ];
  function render(){
    $('season').textContent=date(s.month); $('realm').textContent=levels[s.level]; $('age').textContent=`第 ${year()} 年`;
    $('chapter').textContent=s.level<9?'第一章 · 初入仙途':s.level<12?'第二章 · 道基初成':s.level<15?'第三章 · 丹成一粒':'第四章 · 神游天地';
    const required=need(), max=s.level===levels.length-1;
    $('cultivation-text').textContent=max?'圆满':`${s.exp} / ${required}`; $('cultivation-bar').style.width=`${max?100:cap(s.exp/required*100,0,100)}%`;
    $('health-text').textContent=`${s.hp} / 100`; $('health-bar').style.width=`${s.hp}%`;
    $('energy-text').textContent=`${s.energy} / 100`; $('energy-bar').style.width=`${s.energy}%`;
    $('stones').textContent=s.stones; $('pills').textContent=s.pills; $('herbs').textContent=s.herbs; $('pill-count').textContent=`剩 ${s.pills}`;
    const busy=s.pending!==null;
    document.querySelectorAll('[data-action]').forEach(b=>{let a=b.dataset.action;b.disabled=busy || (a==='meditate'&&s.energy<12) || (a==='explore'&&s.energy<18) || (a==='gather'&&s.energy<10) || (a==='pill'&&s.pills<1) || (a==='buy'&&s.stones<8) || (a==='sell'&&s.herbs<1);});
    $('breakthrough').disabled=busy||s.exp<required||max; $('breakthrough').firstChild.textContent=max?'此境已圆满 ':s.exp<required?'修为未满 ': '冲击下一境 ';
    $('breakthrough-hint').textContent=max?'此生已臻化境':s.exp<required?`尚需 ${required-s.exp} 修为`:`成功率 ${cap(67+Math.floor(s.hp/10)-Math.floor((100-s.energy)/12),45,85)}% · 失败损失修为`;
    $('log').innerHTML=s.logs.map(e=>`<article class="entry${e.special?' special':''}"><div class="date">${esc(date(e.month))}</div><div class="body">${esc(e.body)}</div>${e.result?`<div class="result${e.negative?' negative':''}">${esc(e.result)}</div>`:''}</article>`).join('');
    $('log').scrollTop=$('log').scrollHeight;
    const box=$('encounter'); box.hidden=!busy;
    if(busy){let e=encounters[s.pending];box.innerHTML=`<h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><div class="choices">${e.choices.map((c,i)=>`<button type="button" data-choice="${i}" ${((c.minEnergy||0)>s.energy||(c.minStones||0)>s.stones||(c.minHerbs||0)>s.herbs)?'disabled':''}>${esc(c.label)}</button>`).join('')}</div>`;}
  }
  function action(type){
    if(s.pending)return;
    if(type==='meditate'){
      if(s.energy<12)return notify('灵气不足，先静养调息');
      advance();const bonus=rand(18,28)+s.level*4, cost=Math.min(22,s.energy);
      commit(pick(['你闭目观想，溪水声渐渐与呼吸合拍。','晨光穿过竹帘，你运转周天，灵台愈发澄明。','一夜山雨之后，你在洞府中捕捉到一缕清灵之气。']),{exp:bonus,energy:-cost});
    } else if(type==='gather'){
      if(s.energy<10)return notify('灵气不足，先静养调息');
      advance();const count=rand(1,3),extra=Math.random()<.26?3:0;
      commit(pick(['你循着药香深入山谷，在岩缝里发现几株灵草。','你拂去叶上晨露，采下药性正盛的灵草。','后山雾散，一片不起眼的草坡竟藏着灵植。']),{herbs:count,energy:-10,exp:7,stones:extra});
    } else if(type==='rest'){
      advance();const hp=Math.min(100-s.hp,rand(20,32)), energy=Math.min(100-s.energy,rand(36,48));
      commit(pick(['你煮一壶山泉茶，听松风过檐，伤势渐渐平复。','你暂且放下功课，让经脉与心神一同休憩。']),{hp,energy});
    } else if(type==='explore'){
      if(s.energy<18)return notify('灵气不足，先静养调息');
      advance();s.energy-=18;s.pending=rand(0,encounters.length-1);
      log('你收好行囊，沿着山路往云雾深处行去。','灵气 -18');save();render();
      $('encounter').scrollIntoView({behavior:'smooth',block:'nearest'});
    } else if(type==='pill'){
      if(!s.pills)return;commit('丹药入口，一股温润的灵气在经脉间缓缓化开。',{pills:-1,exp:45+s.level*4,energy:12});
    } else if(type==='buy'){
      if(s.stones<8)return notify('灵石不足');commit('你在山下坊市购得一枚聚气丹。',{stones:-8,pills:1});
    } else if(type==='sell'){
      if(!s.herbs)return notify('没有灵草可售');commit('你将灵草交给坊市药铺，换来三枚灵石。',{herbs:-1,stones:3});
    }
  }
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
  $('encounter').addEventListener('click',ev=>{
    const b=ev.target.closest('[data-choice]');if(!b||s.pending===null)return;
    const c=encounters[s.pending].choices[Number(b.dataset.choice)];if(!c)return;
    if((c.minEnergy||0)>s.energy||(c.minStones||0)>s.stones||(c.minHerbs||0)>s.herbs)return;
    s.pending=null;commit(c.body,c.gain,true);
  });
  $('breakthrough').addEventListener('click',()=>{
    if(s.pending||s.level===levels.length-1||s.exp<need())return;
    const cost=need(),chance=cap(67+Math.floor(s.hp/10)-Math.floor((100-s.energy)/12),45,85);
    advance();s.energy=cap(s.energy-18,0,100);
    if(rand(1,100)<=chance){s.exp-=cost;s.level++;s.hp=cap(s.hp+20,1,100);log(`天地灵气奔涌而来，丹田壁垒应声而开。你踏入${levels[s.level]}。`,'突破成功 · 气血 +20',true);}
    else{s.exp=Math.max(0,s.exp-Math.ceil(cost*.28));s.hp=cap(s.hp-14,1,100);log('你凝神冲关，却在最后一刻灵气逆行。虽未突破，来日仍可再试。',`突破失败 · 修为 -${Math.ceil(cost*.28)} · 气血 -14`,true,true);}
    save();render();
  });
  $('reset').addEventListener('click',()=>$('reset-dialog').showModal());
  $('reset-dialog').addEventListener('close',()=>{if($('reset-dialog').returnValue==='confirm'){s=initial();save();render();notify('新的一生开始了');}});
  render();
})();
