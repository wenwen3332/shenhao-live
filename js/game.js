'use strict';
(()=>{
const $=s=>document.querySelector(s);
const R=(a,b)=>a+Math.random()*(b-a),P=a=>a[Math.floor(Math.random()*a.length)];
const fmt=n=>{n=Math.floor(n);if(n>=1e8)return(n/1e8).toFixed(n>=1e9?1:2).replace(/\.?0+$/,'')+'億';if(n>=1e4)return(n/1e4).toFixed(n>=1e6?0:1).replace(/\.0$/,'')+'萬';return n.toLocaleString('en-US')};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>Date.now();
const mmss=ms=>{ms=Math.max(0,ms);const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const N=STREAMERS.length;

/* ================= 狀態 ================= */
const KEY='shenhao_v2';
const DEF=()=>({v:2,nick:'',coins:CFG.START_COINS,spent:0,recharges:0,maxCombo:0,maxSingle:0,likes:0,ach:{},sfx:true,voice:true,cur:0,visited:{},top1Rooms:{},dmSent:0,rooms:{},dms:{},unread:{},mem:{},role:'',roleStart:{},rebornBase:null,mysteryNo:0,recharged:0,nobleOn:true,entSeen:{},pg:'m',shake:true});
let S;
try{S=Object.assign(DEF(),JSON.parse(localStorage.getItem(KEY)||'null')||{})}catch(e){S=DEF()}
// 舊版存檔轉移
try{const o=JSON.parse(localStorage.getItem('shenhao_v1')||'null');if(o&&!S.migrated){S.migrated=1;if(!S.nick&&o.nick)S.nick=o.nick;if(o.coins)S.coins=Math.max(S.coins,o.coins);S.spent+=o.spent||0;S.ach=Object.assign({},o.ach||{},S.ach);S.recharges+=o.recharges||0;S.likes+=o.likes||0;S.maxCombo=Math.max(S.maxCombo,o.maxCombo||0);room('s1').aff+=o.aff||0;room('s1').total+=o.spent||0}}catch(e){}
let saveT=0;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},250)}
function room(id){if(!S.rooms[id])S.rooms[id]={aff:0,total:0,follow:false,giftCount:{},lastGift:null,miles:{},sess:null,lastDM:0};return S.rooms[id]}
const cs=()=>STREAMERS[S.cur],cr=()=>room(cs().id);
const mood=id=>{const a=room(id).aff;return a>=13140?2:a>=520?1:0};
const myName=id=>S.role==='mystery'?'神秘人'+S.mysteryNo:(S.mem[id]&&S.mem[id].name)||S.nick||'神豪';
const isF=()=>S.pg==='f';
const callFor=(st,n,m)=>isF()?st.callF(n,m):st.call(n,m);
const callN=(st)=>callFor(st,myName(st.id),mood(st.id));
// 女神豪：把「大哥/哥哥」等稱呼轉為「姐姐」
function femT(t){if(!isF()||!t)return t;return String(t).replace(/(姐姐|大小姐|姐|妹妹|醬)(大哥哥|大哥|哥哥|哥)/g,'$1').replace(/小哥哥/g,'小姐姐').replace(/榜一大哥/g,'榜一姐姐').replace(/大哥哥/g,'大姐姐').replace(/大哥/g,'姐姐').replace(/哥哥/g,'姐姐').replace(/帥哥/g,'美女').replace(/哥們/g,'姐妹').replace(/兄弟(?!們)/g,'姐妹').replace(/金主爸爸/g,'金主大人').replace(/(姐姐)+/g,'姐姐')}
const applyShake=()=>{window.SHAKE_OFF=!S.shake;document.body.classList.toggle('noshake',!S.shake)};

/* ================= 音效 ================= */
let AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d=.12,type='sine',vol=.12,when=0,slide=0){if(!S.sfx)return;const a=ac();if(!a)return;const t=a.currentTime+when;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02)}
function noise(d=.6,vol=.15,when=0,hp=800,lp=0){if(!S.sfx)return;const a=ac();if(!a)return;const t=a.currentTime+when;const b=a.createBuffer(1,Math.floor(a.sampleRate*d),a.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*Math.pow(1-i/c.length,1.5);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type=lp?'lowpass':'highpass';f.frequency.value=lp||hp;const g=a.createGain();g.gain.value=vol;s.connect(f);f.connect(g);g.connect(a.destination);s.start(t)}
const SFX=window.SFX={
 pop:(c=1)=>{const f=520*Math.pow(1.035,Math.min(c,40));tone(f,.08,'triangle',.11);tone(f*1.5,.06,'sine',.05,.03)},
 like:()=>tone(R(900,1300),.04,'sine',.04),
 mid:()=>{[660,880,1175].forEach((f,i)=>tone(f,.18,'triangle',.1,i*.06))},
 coin:()=>{tone(1318,.08,'square',.05);tone(1760,.25,'square',.05,.08)},
 big:(p)=>{noise(1.4,.1,0,300);const base=p>=20000?[392,494,587,784,988]:[392,523,659,784,1046];base.forEach((f,i)=>tone(f,.6,'sawtooth',.035,.1+i*.09));tone(base[4]*1,.9,'triangle',.08,.6)},
 rocket:()=>{noise(2.6,.2,0,0,500);tone(70,2.2,'sawtooth',.06,0,5)},
 boom:()=>{if(!S.sfx)return;noise(.6,.12,0,0,900);tone(R(90,140),.4,'sine',.1,0,.4)},
 roar:(w=0)=>{if(!S.sfx)return;noise(1.8,.28,w,0,420);tone(140,1.6,'sawtooth',.12,w,.4);tone(70,1.9,'square',.06,w+.05,.6);tone(210,1.1,'sawtooth',.05,w+.1,.35);if(S.shake&&navigator.vibrate)try{navigator.vibrate([80,40,120])}catch(e){}},
 ach:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,.2,'triangle',.09,i*.08))},
 pk:()=>{tone(220,.22,'square',.06);tone(180,.3,'square',.06,.18)},
 dm:()=>{tone(1046,.09,'sine',.09);tone(1568,.16,'sine',.08,.09)},
 swipe:()=>noise(.25,.05,0,1500),
};

/* ================= 語音：預錄神經語音（audio/，edge-tts 產生），缺檔時退回 Web Speech ================= */
const TTS={ok:'speechSynthesis' in window,voices:[],cur:null,q:null,wd:0,fail:0};
const AU=new Audio();AU.preload='auto';AU.setAttribute('playsinline','');let auOK=false;
function auUnlock(){if(auOK||TTS.cur)return;auOK=true;try{AU.src='assets/silence.mp3';const p=AU.play();if(p)p.catch(()=>{auOK=false})}catch(e){auOK=false}}
document.addEventListener('pointerdown',auUnlock,true);
function ttsStop(){try{AU.onended=AU.onerror=AU.onplaying=null;AU.pause()}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function loadVoices(){if(!TTS.ok)return;TTS.voices=speechSynthesis.getVoices()||[]}
if(TTS.ok){loadVoices();try{speechSynthesis.onvoiceschanged=loadVoices}catch(e){}}
const FEMALE=/(mei-?jia|ting-?ting|xiaoxiao|xiaoyi|xiaohan|xiaomo|hsiaochen|hsiaoyu|hanhan|yaoyao|huihui|sin-?ji|lili|yu-?shu|female|女)/i;
const MALE=/(li-?mu|yunxi|yunyang|yunjian|yunjhe|kangkang|zhiwei|male|男)/i;
function pickVoice(g){const zh=TTS.voices.filter(v=>/^(zh|cmn|yue)/i.test(v.lang));if(!zh.length)return null;
 const rank=v=>{let s=0;if(/TW|Hant/i.test(v.lang))s+=30;else if(/CN|Hans/i.test(v.lang))s+=20;else s+=5;
  if(g==='m'){if(MALE.test(v.name))s+=40;else if(FEMALE.test(v.name))s-=5}else{if(FEMALE.test(v.name))s+=40;if(MALE.test(v.name))s-=40}
  if(/google|microsoft|enhanced|premium|neural/i.test(v.name))s+=6;return s};
 return zh.slice().sort((a,b)=>rank(b)-rank(a))[0]}
const cleanTTS=VOICE.clean;
/* 文字→語音文字對照（對話引擎產生的句子） */
const VFOR=new Map();function vfor(t,v){if(!t)return;VFOR.set(t,v==null?'':v);if(VFOR.size>80)VFOR.delete(VFOR.keys().next().value)}
function talk(on){const sl=document.querySelector('.slide.cur');if(sl)sl.classList.toggle('talk',on);$('#hostPill').classList.toggle('talking',on)}
function speak(text,st,o={}){
 const prio=o.prio||1;
 if(!S.voice){fakeTalk(text);return}
 let v=o.v;if(v==null&&VFOR.has(text))v=VFOR.get(text);if(v==='')v=null;
 const item={text,st,prio,ex:!!o.ex,cap:o.cap!==false,v};
 if(TTS.cur){
  if(prio>TTS.cur.prio){TTS.q=item;TTS.cur=null;clearTimeout(TTS.wd);ttsStop();setTimeout(()=>{if(!TTS.cur){const q=TTS.q;TTS.q=null;if(q)doSpeak(q)}},90);return}
  if(!TTS.q||prio>=TTS.q.prio)TTS.q=item;return}
 doSpeak(item)}
/* 語音來源：① 即時 TTS 伺服器（念得出暱稱）② 預錄音檔 audio/ ③ 瀏覽器語音
   伺服器網址：網址參數 ?tts=https://xxx（會記住，?tts=off 關閉）、或 window.TTS_BASE；非 github.io 時預設同站 /tts */
const TTS_BASE=(()=>{try{const q=new URLSearchParams(location.search).get('tts');if(q!=null){if(q==='off'||q==='')localStorage.removeItem('shenhao_tts');else localStorage.setItem('shenhao_tts',q.replace(/\/+$/,'')+'/')}const v=localStorage.getItem('shenhao_tts');if(v)return v}catch(e){}
 if(window.TTS_BASE)return window.TTS_BASE.replace(/\/+$/,'')+'/';return /github\.io$/.test(location.hostname)||location.protocol==='file:'?null:''})();
TTS.srvDown=0;
function doSpeak(it){
 if(TTS.fail>=3){ssSpeak(it);return}
 const t=cleanTTS(it.text).slice(0,160);if(!t){fakeTalk(it.text);return}
 const k=VOICE.key(it.st.id,it.v!=null?it.v:it.text),srcs=[];
 if(TTS_BASE!==null&&Date.now()>TTS.srvDown)srcs.push(['srv',TTS_BASE+'tts?s='+encodeURIComponent(it.st.id)+'&e='+(it.ex?1:0)+'&t='+encodeURIComponent(t)]);
 if(k&&VOICE.has(it.st.id,k))srcs.push(['clip','audio/'+it.st.id+'/'+k+'.mp3']);
 if(!srcs.length){ssSpeak(it);return} // 沒有可用音源 → 退回瀏覽器語音
 TTS.cur=it;
 const end=()=>{if(TTS.cur!==it)return;clearTimeout(TTS.wd);TTS.cur=null;talk(false);hideCapSoon();const q=TTS.q;TTS.q=null;if(q)setTimeout(()=>doSpeak(q),120)};
 const play=i=>{const [kind,url]=srcs[i];const pr=(it.ex&&kind==='clip')?1.06:1;
  const fb=()=>{if(TTS.cur!==it)return;clearTimeout(TTS.wd);if(kind==='srv')TTS.srvDown=Date.now()+60000;if(i+1<srcs.length){play(i+1);return}TTS.fail++;TTS.cur=null;ssSpeak(it)};
  AU.onplaying=()=>{if(TTS.cur===it){talk(true);TTS.fail=0;TTS.src=kind}};AU.onended=end;AU.onerror=fb;
  AU.src=url;try{AU.defaultPlaybackRate=pr;AU.playbackRate=pr;AU.preservesPitch=false}catch(e){}
  try{const p=AU.play();if(p)p.catch(err=>{if(TTS.cur!==it)return;if(err&&err.name==='NotAllowedError'){clearTimeout(TTS.wd);TTS.cur=null;auOK=false;fakeTalk(it.text)}else if(!err||err.name!=='AbortError')fb()})}catch(e){fb()}
  clearTimeout(TTS.wd);TTS.wd=setTimeout(end,Math.min(22000,t.length*420+6000));
  clearTimeout(TTS.stall);if(kind==='srv'&&i+1<srcs.length)TTS.stall=setTimeout(()=>{if(TTS.cur===it&&AU.src===url&&AU.currentTime===0){AU.onerror=null;fb()}},4500)};
 play(0);
}
function ssSpeak(it){if(!TTS.ok){fakeTalk(it.text);return}
 let u;try{u=new SpeechSynthesisUtterance(cleanTTS(it.text))}catch(e){fakeTalk(it.text);return}
 const v=pickVoice(it.st.gender);if(v){u.voice=v;u.lang=v.lang}else u.lang='zh-TW';
 let pitch=it.st.voice.pitch,rate=it.st.voice.rate;
 if(it.st.gender==='m'&&v&&!MALE.test(v.name))pitch=Math.min(pitch,.62); // 沒有男聲時壓低音調
 if(it.ex){pitch*=1.12;rate*=1.12}
 u.pitch=Math.max(.1,Math.min(2,pitch));u.rate=Math.max(.5,Math.min(1.6,rate));u.volume=1;
 TTS.cur=it;
 const end=()=>{if(TTS.cur!==it)return;clearTimeout(TTS.wd);TTS.cur=null;talk(false);hideCapSoon();const q=TTS.q;TTS.q=null;if(q)setTimeout(()=>doSpeak(q),80)};
 u.onstart=()=>{if(TTS.cur===it)talk(true)};u.onend=end;u.onerror=end;
 clearTimeout(TTS.wd);TTS.wd=setTimeout(end,Math.min(15000,it.text.length*380+2500));
 try{speechSynthesis.speak(u)}catch(e){end()}
 if(!isIOS())talk(true);
}
const isIOS=()=>/iP(hone|ad|od)/.test(navigator.userAgent);
let fakeT=0;function fakeTalk(text){talk(true);clearTimeout(fakeT);fakeT=setTimeout(()=>{talk(false);hideCapSoon()},Math.min(6000,text.length*170+700))}
/* 字幕 */
const cap=$('#caption');let capT=0;
function caption(st,text){cap.innerHTML=`<span class="who"></span><span class="tx"></span>`;cap.querySelector('.who').textContent=st.name;cap.querySelector('.tx').textContent=text;cap.style.setProperty('--sc',st.color);cap.classList.add('show');clearTimeout(capT);capT=setTimeout(()=>cap.classList.remove('show'),Math.max(2600,text.length*260+1200))}
function hideCapSoon(){clearTimeout(capT);capT=setTimeout(()=>cap.classList.remove('show'),700)}
/* 主播說話（字幕 + 語音） */
function line(st,key,vars={},o={}){const pool=st.L[key];if(!pool)return;const tp=P(pool);const t=fill(tp,st,vars);o.v=vfill(key==='bye'?vBye(tp):tp,st,{...vars,g:vgift(key,vars.gObj)||vars.g});say(st,t,o);return t}
const vaddr=st=>(VA[st.id]||['大哥','姐姐'])[isF()?1:0];
function vgift(key,g){if(!g)return null;if(key==='combo')return '禮物';if(key==='b'&&g.price<1000)return '禮物';return g.name}
function vfill(t,st,v={}){return femT(t.replace(/\{n\}/g,vaddr(st)).replace(/\{who\}/g,v.who||'').replace(/\{npc\}/g,v.npc||'').replace(/\{g\}/g,v.g||'禮物').replace(/\{x\}/g,v.x||'').replace(/\{t[123]\}/g,''))}
function sysSay(st,tp,v={},o={},vt){if(o.npc){const f=x=>x.replace(/\{npc\}/g,v.npc).replace(/\{g\}/g,v.g);o.v=f(tp);say(st,f(tp),o);return}
 const t=fill(tp.replace(/\{who\}/g,v.who||''),st,v);o.v=vfill(vt||tp,st,v);say(st,t,o)}
function fill(t,st,v={}){return femT(t.replace(/\{n\}/g,callN(st)).replace(/\{g\}/g,v.g||'禮物').replace(/\{x\}/g,v.x||'').replace(/\{t1\}/g,v.t1||'').replace(/\{t2\}/g,v.t2||'').replace(/\{t3\}/g,v.t3||'').replace(/\{likes\}/g,v.likes||''))}
function say(st,t,o={}){if(st!==cs()||!started)return;if(!o.npc)t=femT(t);if(o.prio===0&&(TTS.cur||cap.classList.contains('show')))return;caption(st,t);speak(t,st,o)}

/* ================= 表情 ================= */
const EXP=['idle','happy','shocked','shy','excited'];
let faceT=0;
function face(e,ms=1800,then){const sl=document.querySelector('.slide.cur');if(!sl)return;sl.querySelectorAll('.cam img').forEach(im=>im.classList.toggle('on',im.dataset.e===e));clearTimeout(faceT);if(ms)faceT=setTimeout(()=>{if(then)face(then,2200);else face(mood(cs().id)>=2&&Math.random()<.3?'shy':'idle',0)},ms)}

/* ================= 直播場次 ================= */
function newSession(id,elapsed=0){const r=room(id);const t=now()-elapsed;const names=[...NPC_POOL].sort(()=>Math.random()-.5).slice(0,6);let top=R(30000,90000);
 r.sess={start:t,end:t+CFG.SESSION_SEC*1000,offUntil:0,me:0,wave:Math.floor(R(3000,20000)+elapsed/1000*R(50,200)),gifts:Math.floor(R(30,200)),likes:Math.floor(R(2000,9000)+elapsed/30),npc:names.map(([n,a],i)=>{const v=Math.floor(top);top*=R(.35,.7);return{n,a,v:i<2?v:Math.floor(v*R(.6,1))}}),ended:false,stats:null,lastRank:99,viewBase:Math.floor(R(3000,30000))};
 r.sess.npc.sort((a,b)=>b.v-a.v);return r.sess}
function initSessions(){STREAMERS.forEach((st,i)=>{const r=room(st.id);if(!r.sess){if(st.id==='s4'){const s=newSession(st.id,CFG.SESSION_SEC*1000);s.end=now()-1000;s.ended=true;s.offUntil=now()+75000;s.stats=snap(st.id)}else newSession(st.id,i===0?0:R(.1,.6)*CFG.SESSION_SEC*1000)}})}
const isLive=id=>{const s=room(id).sess;return s&&!s.ended&&now()<s.end};
function ranking(id){const r=room(id),s=r.sess;const arr=s.npc.map((x,i)=>({name:x.n,av:x.a,v:x.v,npc:i}));arr.push({name:myName(id),av:myAv(),v:s.me,me:true});return arr.sort((a,b)=>b.v-a.v)}
function snap(id){const s=room(id).sess,rk=ranking(id);const my=rk.findIndex(x=>x.me)+1;return{wave:s.wave,gifts:s.gifts,likes:s.likes,me:s.me,myRank:s.me?my:0,top:rk.slice(0,3).map(x=>({name:x.name,v:x.v,me:!!x.me})),dur:s.end-s.start}}
let ending=null;
function tick(){
 STREAMERS.forEach((st,i)=>{const r=room(st.id),s=r.sess;if(!s)return;
  if(!s.ended&&now()>=s.end)endSession(st.id,i===S.cur&&started);
  else if(s.ended&&now()>=s.offUntil&&ending!==st.id)startAgain(st.id);
 });
 if(started)updTimer();
 if(!$('#lobby').classList.contains('show'))return;renderLobby();
}
function endSession(id,live){const r=room(id),s=r.sess,st=SM[id];s.ended=true;s.offUntil=s.end+CFG.OFFLINE_SEC*1000;s.stats=snap(id);
 const st0=s.stats;if(st0.me>0){if(st0.myRank===1){S.top1Rooms[id]=1;unlock('guard')}
  setTimeout(()=>dmPush(id,dmT(st0.myRank===1?'afterTop':'after',id)),live?9000:1500)}
 if(live){ending=id;endCombo();const t=st0.top.map(x=>x.name);while(t.length<3)t.push('大家');
  face('shy',0);say(st,fill(st.L.bye[0],st),{prio:4,v:vfill(st.L.bye[0],st)});setTimeout(()=>{if(S.cur!==STREAMERS.findIndex(x=>x.id===id)){ending=null;return}say(st,fill(st.L.bye[1],st,{t1:t[0],t2:t[1],t3:t[2]}),{prio:4,v:vfill(vBye(st.L.bye[1]),st)});face('happy',3000,'shy')},2600);
  setTimeout(()=>{ending=null;if(cs().id===id)showEnd()},8000)}
 save()}
function startAgain(id){const st=SM[id];newSession(id,0);const r=room(id);
 if(r.follow)dmPush(id,dmT('online',id),{silent:cs().id===id});
 if(cs().id===id&&started){hideEnd();toast(`🔴 ${st.name} 開播啦！`);enterRoom(true)}save()}
function updTimer(){const s=cr().sess,el=$('#timerTag');if(!s)return;if(isLive(cs().id)){const left=s.end-now();el.textContent='⏱ 剩餘 '+mmss(left);el.classList.toggle('warn',left<30000)}else{el.textContent='已下播';el.classList.remove('warn')}
 if(!$('#endScreen').classList.contains('hide')){const cd=$('#esCd');if(cd)cd.textContent='預計 '+cdText(s.offUntil-now())+' 後開播'}}
const cdText=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s>=60?Math.floor(s/60)+' 分 '+(s%60)+' 秒':s+' 秒'};

/* ================= 上下滑動 ================= */
const feed=$('#feed'),roomEl=$('#room');
let slides=[];
function slideEl(st){const d=document.createElement('div');d.className='slide'+(st.anime?' anime':'');d.innerHTML=`<div class="cam">${EXP.map(e=>`<img data-e="${e}" src="assets/${st.id}_${e}.webp" class="${e==='idle'?'on':''}" alt="" draggable="false">`).join('')}</div><div class="shade"></div><div class="offline"></div><div class="peek"><img src="assets/${st.id}_av.webp" alt=""><div>${esc(st.name)}<span>${isLive(st.id)?'直播中':'已下播'}</span></div></div>`;d.classList.toggle('isOff',!isLive(st.id));return d}
function buildFeed(){feed.innerHTML='';slides=[-1,0,1].map(o=>{const st=STREAMERS[(S.cur+o+N)%N];const el=slideEl(st);el.dataset.o=o;if(o===0)el.classList.add('cur');feed.appendChild(el);return el});layoutFeed(0,false)}
function layoutFeed(dy,anim){const H=innerHeight;slides.forEach(el=>{const o=+el.dataset.o;el.style.transition=anim?'transform .36s cubic-bezier(.2,.8,.3,1)':'none';el.style.transform=`translate3d(0,${o*H+dy}px,0)`});roomEl.style.transition=anim?'transform .36s cubic-bezier(.2,.8,.3,1),opacity .2s':'none';roomEl.style.transform=dy?`translate3d(0,${dy}px,0)`:''}
let swiping=false;
function go(dir){if(swiping)return;swiping=true;SFX.swipe();const H=innerHeight;layoutFeed(-dir*H,true);ttsStop();clearTimeout(TTS.wd);TTS.cur=null;TTS.q=null;talk(false);cap.classList.remove('show');
 setTimeout(()=>{S.cur=(S.cur+dir+N)%N;save();buildFeed();roomEl.style.opacity='0';requestAnimationFrame(()=>{roomEl.style.transition='opacity .25s';roomEl.style.opacity='1'});enterRoom();swiping=false},370)}
function jumpTo(i){if(i===S.cur){closePanels();return}closePanels();ttsStop();TTS.cur=null;TTS.q=null;S.cur=i;save();buildFeed();roomEl.style.opacity='0';requestAnimationFrame(()=>{roomEl.style.transition='opacity .3s';roomEl.style.opacity='1'});enterRoom()}
// 觸控/滑鼠拖曳
let drag=null;
function onDown(e){if(e.target.closest('button,input,.es-btns'))return;ac();drag={y:e.clientY,x:e.clientY,x0:e.clientX,t:performance.now(),moved:false,id:e.pointerId};}
function onMove(e){if(!drag||swiping)return;const dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dy)>10&&Math.abs(dy)>Math.abs(e.clientX-drag.x0)){drag.moved=true;$('#swipeHint').classList.add('hide')}if(drag.moved){e.preventDefault();layoutFeed(dy*0.98,false)}}
function onUp(e){if(!drag)return;const d=drag;drag=null;const dy=e.clientY-d.y;if(d.moved){const v=Math.abs(dy)/(performance.now()-d.t);if(Math.abs(dy)>innerHeight*.16||v>.55)go(dy<0?1:-1);else layoutFeed(0,true)}else if(e.type==='pointerup'&&e.currentTarget===$('#tapLayer'))tapLike(e)}
['tapLayer','endScreen'].forEach(id=>{const el=$('#'+id);el.addEventListener('pointerdown',onDown);el.addEventListener('pointermove',onMove,{passive:false});el.addEventListener('pointerup',onUp);el.addEventListener('pointercancel',onUp)});
let wheelAcc=0,wheelT=0;addEventListener('wheel',e=>{if(document.querySelector('.panel.show,.sheet.show,.modal.show'))return;wheelAcc+=e.deltaY;clearTimeout(wheelT);wheelT=setTimeout(()=>wheelAcc=0,200);if(Math.abs(wheelAcc)>60&&!swiping){go(wheelAcc>0?1:-1);wheelAcc=0}},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(document.querySelector('.panel.show,.modal.show'))return;if(e.key==='ArrowDown'||e.key==='PageDown')go(1);if(e.key==='ArrowUp'||e.key==='PageUp')go(-1)});
addEventListener('resize',()=>layoutFeed(0,false));

/* ================= 進入直播間 ================= */
let started=false;
function enterRoom(fresh,skipWelcome){const st=cs(),r=cr();S.visited[st.id]=1;if(Object.keys(S.visited).length>=N)unlock('visit');
 $('#comments').innerHTML='';$('#banners').innerHTML='';slots.clear();endCombo();cap.classList.remove('show');
 $('#hostAv').src=`assets/${st.id}_av.webp`;$('#hostName').innerHTML=esc(st.name)+'<span class="wave"><i></i><i></i><i></i></span>';
 document.documentElement.style.setProperty('--sc',st.color);
 r.sess.lastRank=r.sess.me?ranking(st.id).findIndex(x=>x.me)+1:99;
 if(!isLive(st.id)){if(r.sess.ended&&ending!==st.id)showEnd();hud();return}
 hideEnd();
 comment('',`歡迎來到 ${st.name} 的直播間！提倡文明發言、理性消費（本遊戲金幣皆為模擬）`,'sys');
 for(let i=0;i<4;i++)comment(P(USERS),P(CHAT));
 setTimeout(()=>enterNotice(myName(st.id),true),300);if(started)setTimeout(()=>myEntrance(st),450);
 if(!skipWelcome)setTimeout(()=>{if(cs()===st&&isLive(st.id)){line(st,'welcome',{},{prio:2});face('happy',2200)}},fresh?1200:700);else face('happy',2200);
 hud()}
function myEntrance(st,force){if(!isLive(st.id)||cs()!==st)return;const k=st.id,t=now();if(!force&&S.entSeen[k]&&t-S.entSeen[k]<60000)return;
 const n=noble(),rl=S.role?ROLES[S.role]:null;if(!n&&!rl)return;S.entSeen[k]=t;
 if(n){FX.queue({fx:n.fx,name:n.name,entrance:true,img:n.icon,color:n.color,price:30000},myName(k));comment('',`${n.emo} 尊貴的「${n.name}」${myName(k)} 進入直播間`,'sys nob')}
 if(rl){FX.queue({fx:'role',role:S.role,name:`${rl.name}・${roleStage()}階`,entrance:true,img:rl.icon,color:rl.color,price:10000},myName(k));if(!n)comment('',`${rl.emo} ${rl.name}${roleStage()}階 ${myName(k)} 進入直播間`,'sys nob')}
 setTimeout(()=>{if(cs()!==st)return;const who=n?n.name:rl.name;sysSay(st,S.role==='mystery'&&!n?P(SYS_T.mystery):P(SYS_T.enter),{who},{prio:3,ex:true});face('shocked',900,'excited')},1300)}
function showEnd(){const st=cs(),s=cr().sess,x=s.stats||snap(st.id);const el=$('#endScreen');
 el.innerHTML=`<img class="es-av" src="assets/${st.id}_av.webp"><h2>主播已下播</h2><div class="es-sub">${esc(st.name)} · ${esc(st.tag)} · 本場直播 ${mmss(x.dur)}</div>
 <div class="es-stats"><div><b>${fmt(x.wave)}</b>本場音浪</div><div><b>${fmt(x.gifts)}</b>收到禮物</div><div><b>${fmt(x.likes)}</b>本場點讚</div></div>
 <div class="es-top">${x.top.map((t,i)=>`<div class="${t.me?'me':''}"><span>${['🥇','🥈','🥉'][i]} ${esc(t.name)}${t.me?'（你）':''}</span><span>${fmt(t.v)}</span></div>`).join('')}
 <div class="me"><span>你的本場貢獻${x.myRank?'・第 '+x.myRank+' 名':''}</span><span>${fmt(x.me)}</span></div></div>
 <div class="es-cd" id="esCd">預計 ${cdText(s.offUntil-now())} 後開播</div>
 <div class="es-btns"><button id="esDm">私信主播</button><button class="pri" id="esLobby">看看其他直播</button></div><div class="es-hint">︿ 上滑切換直播間</div>`;
 el.classList.remove('hide');document.querySelector('.slide.cur')?.classList.add('isOff');
 $('#esDm').onclick=()=>openThread(st.id);$('#esLobby').onclick=()=>openPanel('lobby');hud()}
function hideEnd(){$('#endScreen').classList.add('hide');document.querySelector('.slide.cur')?.classList.remove('isOff')}

/* ================= HUD ================= */
const lvOf=sp=>{let l=0;for(let i=0;i<LEVELS.length;i++){if(sp>=LEVELS[i])l=i+1;else break}return l};
const realLv=()=>lvOf(S.spent);
const myLv=()=>S.role==='reborn'&&S.rebornBase!=null?lvOf(S.spent-S.rebornBase):realLv();
const roleStage=()=>{if(!S.role)return 0;const d=S.spent-(S.roleStart[S.role]||0);let k=1;ROLE_STEPS.forEach((v,i)=>{if(d>=v)k=i+1});return k};
const noble=()=>{if(!S.nobleOn)return null;let n=null;NOBLES.forEach(x=>{if(S.recharged>=x.need)n=x});return n};
const hasNoble=id=>{const x=NOBLES.find(n=>n.id===id);return x&&S.recharged>=x.need};
const icoB=(src,emo,cls)=>!(window.HAVE||{})[src.slice(7,-5)]?`<b class="${cls} emo">${emo}</b>`:`<img class="${cls}" src="${src}" onerror="this.outerHTML='<b class=&quot;${cls} emo&quot;>${emo}</b>'">`;
const myBadges=()=>{let h='';const n=noble();if(n)h+=`<span class="nb" style="--nc:${n.color}"><b class="emo">${n.emo}</b>${n.name}</span>`;if(S.role){const r=ROLES[S.role];h+=`<span class="rb" style="--rc:${r.color}"><b class="emo">${r.emo}</b>${r.name}${roleStage()}階</span>`}return h};
const lvColor=l=>l>=70?'linear-gradient(90deg,#ff004c,#ffcc00,#00e1ff)':l>=60?'linear-gradient(90deg,#d4001c,#ffb300)':l>=50?'linear-gradient(90deg,#ff3d00,#ff9a00)':l>=40?'linear-gradient(90deg,#ff9a00,#ffc94d)':l>=30?'linear-gradient(90deg,#a23cff,#d27bff)':l>=20?'linear-gradient(90deg,#ff3f8e,#ff7ab0)':l>=10?'linear-gradient(90deg,#1f8fff,#5bc0ff)':'linear-gradient(90deg,#4a7cff,#7aa4ff)';
const lvBadge=l=>`<span class="lv" style="background:${lvColor(l)}">◆${l}</span>`;
const fanLv=id=>Math.min(30,1+Math.floor(Math.sqrt(room(id).aff/60)));
const fanBadge=id=>room(id).follow?`<span class="fb">${esc(SM[id].fan)}<i>${fanLv(id)}</i></span>`:'';
const myAv=()=>S.role==='mystery'?'🎭':realLv()>=40?'👑':realLv()>=25?'💎':isF()?'💃':'😎';
const MILES=[[520,'主播記住你了'],[5200,'專屬稱呼解鎖'],[13140,'主播看你的眼神不一樣了'],[52000,'成為主播的守護者'],[131400,'本命神豪'],[520000,'傳說級・唯一神豪'],[1314000,'天長地久・永恆守護']];
function hud(){const st=cs(),r=cr(),s=r.sess;if(!s)return;
 const rk=ranking(st.id),my=rk.findIndex(x=>x.me)+1;
 $('#hostLikes').textContent=fmt(s.likes)+'本場點讚';
 $('#followBtn').textContent=r.follow?'💗 '+fanLv(st.id):'關注';$('#followBtn').classList.toggle('on',r.follow);
 const cols=['#ffd700','#d9d9d9','#e0a060'];
 $('#audience').innerHTML=rk.slice(0,3).map((x,i)=>`<div class="ua" style="border-color:${cols[i]};background:${x.me?'#6a3a00':'#2a2a2a'}">${x.av}<b style="background:${cols[i]}">${fmt(x.v)}</b></div>`).join('');
 $('#viewerCnt').textContent=isLive(st.id)?fmt(s.viewBase+Math.floor(s.wave/40)):'0';
 const hr=Math.max(1,99-Math.floor(Math.log2(1+s.wave/800))*9);$('#hourTag').textContent=`小時榜 第${hr}名 ›`;
 $('#fanTag').textContent=r.follow?`💗 ${st.fan} Lv${fanLv(st.id)}`:`💗 加入${st.fan}`;
 const next=MILES.find(m=>r.aff<m[0]),prev=[...MILES].reverse().find(m=>r.aff>=m[0]);const lo=prev?prev[0]:0,hi=next?next[0]:1;
 $('#affFill').style.width=(next?((r.aff-lo)/(hi-lo)*100):100)+'%';$('#affTxt').textContent=`好感度 ${fmt(r.aff)}`+(next?` / ${fmt(next[0])}`:' MAX')+` · 你本場第${s.me?my:'-'}名`;
 $('#sheetCoins').textContent=fmt(S.coins);$('#gsFan').textContent=`財富等級 Lv${myLv()} · ${st.fan}`;
 updTimer();badge();
 if(s.me&&my<s.lastRank&&s.lastRank!==99){const passed=rk[my];if(passed&&!passed.me)toast(`🔥 你超越了「${passed.name}」，升至本場第 ${my} 名！`);if(my===1){setTimeout(()=>{line(st,'top1',{},{prio:3,ex:true});face('excited',2200)},500);unlock('top1')}}
 if(s.me)s.lastRank=my}
function toast(t,cls='',onTap){const tb=$('#toasts');while(tb.children.length>=3)tb.firstChild.remove();const d=document.createElement('div');d.className='toast '+cls;if(typeof t==='string')d.textContent=t;else d.appendChild(t);if(onTap)d.onclick=onTap;tb.appendChild(d);setTimeout(()=>d.remove(),3100)}

/* ================= 評論 / 進場 ================= */
function comment(u,t,cls='',lv,fan){const d=document.createElement('div');d.className='cm '+cls;if(u){d.innerHTML=`${lvBadge(lv==null?Math.ceil(R(1,35)):lv)}${/\bme\b/.test(cls)?myBadges():''}${fan||''}<span class="u"></span><span class="t"></span>`;d.querySelector('.u').textContent=u+'：';d.querySelector('.t').textContent=t}else d.textContent=t;const box=$('#comments');box.appendChild(d);while(box.children.length>30)box.firstChild.remove()}
function enterNotice(name,me){const bar=$('#enterBar');bar.innerHTML='';const d=document.createElement('div');const nb=me&&noble();d.className='ent'+(me&&(realLv()>=20||nb||S.role)?' vip':'')+(nb?' nob-'+nb.id:'')+(me&&S.role?' role-'+S.role:'');const l=me?myLv():Math.ceil(R(1,30));d.innerHTML=`${lvBadge(l)}${me?myBadges()+fanBadge(cs().id):''}<span></span>`;d.querySelector('span').textContent=name+' 來了';bar.appendChild(d)}
setInterval(()=>{if(!started||document.hidden||!isLive(cs().id))return;if(Math.random()<.6)comment(P(USERS),P(CHAT));if(Math.random()<.18)enterNotice(P(USERS));const s=cr().sess;s.likes+=Math.floor(R(5,60));s.wave+=Math.random()<.2?Math.floor(R(1,60)):0;if(Math.random()<.3)hud()},1800);
// 主播閒聊
(function idle(){setTimeout(()=>{if(started&&!document.hidden&&isLive(cs().id)&&!FX.busy()&&!ending){line(cs(),'idle',{},{prio:0});if(Math.random()<.5)face(P(['happy','idle','shy']),2000)}idle()},R(22000,40000))})();

/* ================= 橫幅 / 連擊 ================= */
const banners=$('#banners'),slots=new Map();
function banner(key,user,av,g,x,avImg){let b=slots.get(key);
 if(!b){if(banners.children.length>=2){const old=banners.firstChild;slots.forEach((v,k)=>{if(v.el===old)slots.delete(k)});old.remove()}
  const el=document.createElement('div');el.className='banner '+(g.tier>=2?'t3':g.tier===1?'t2':'');
  el.innerHTML=`<div class="bav">${avImg?`<img src="${avImg}">`:av}</div><div class="bt"><div class="bn"></div><div class="bg"></div></div><img class="bi" src="${g.img}"><div class="bx"></div>`;
  el.querySelector('.bn').textContent=user;el.querySelector('.bg').textContent='送出 '+g.name;banners.appendChild(el);requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('in')));b={el,t:0};slots.set(key,b)}
 const bx=b.el.querySelector('.bx');bx.innerHTML='<small>x</small>'+x;bx.classList.remove('pop');void bx.offsetWidth;bx.classList.add('pop');
 clearTimeout(b.t);b.t=setTimeout(()=>{b.el.classList.add('out');setTimeout(()=>b.el.remove(),300);slots.delete(key)},3200)}
const comboEl=$('#combo'),ring=$('#comboRing');let combo={g:null,n:0,count:1,raf:0,end:0,total:0};
function comboTick(){const left=combo.end-performance.now();if(left<=0){endCombo(true);return}ring.style.strokeDashoffset=264*(1-left/CFG.COMBO_MS);combo.raf=requestAnimationFrame(comboTick)}
function startCombo(g,count){combo.g=g;combo.count=count;combo.end=performance.now()+CFG.COMBO_MS;$('#comboIcon').src=g.img;comboEl.classList.add('show');cancelAnimationFrame(combo.raf);comboTick()}
function endCombo(natural){cancelAnimationFrame(combo.raf);comboEl.classList.remove('show');
 if(natural&&combo.g&&combo.n>=5){const st=cs(),x=combo.n*combo.count;sysSay(st,SYS_T.comboEnd,{x,g:combo.g.name},{prio:2,ex:true},SYS_T.comboEndV);face('excited',1800);giftDM(st.id,combo.g,combo.total)}
 else if(natural&&combo.g)giftDM(cs().id,combo.g,combo.total);
 combo.g=null;combo.n=0;combo.total=0}
comboEl.addEventListener('pointerdown',e=>{e.preventDefault();comboEl.classList.add('press');if(combo.g)send(combo.g,combo.count,true)});
['pointerup','pointercancel','pointerleave'].forEach(t=>comboEl.addEventListener(t,()=>comboEl.classList.remove('press')));

/* ================= 送禮 ================= */
const MS_COMBO=[10,30,66,99,188,300,520,1314];
function send(g,count=1,isCombo=false){const st=cs(),r=cr(),s=r.sess;
 if(!isLive(st.id)){toast('主播已下播，等她開播再送吧');return false}
 if(g.noble&&!hasNoble(g.noble)){const nb=NOBLES.find(x=>x.id===g.noble);toast(`🔒 累積充值滿 ${fmt(nb.need)} 金幣解鎖「${nb.name}」身份後才能贈送`);return false}
 const cost=g.price*count;if(S.coins<cost){toast('金幣不足！快去充值當神豪 💰');SFX.pk();openModal('mRecharge');endCombo();return false}
 S.coins-=cost;S.spent+=cost;r.total+=cost;r.aff+=cost;s.me+=cost;s.wave+=cost;s.gifts+=count;r.giftCount[g.id]=(r.giftCount[g.id]||0)+count;r.lastGift=g.name;S.maxSingle=Math.max(S.maxSingle,g.price);
 if(!isCombo||!combo.g||combo.g.id!==g.id||combo.count!==count){if(combo.g)endCombo(true);combo.n=0;combo.total=0}
 combo.n++;combo.total+=cost;const shown=combo.n*count;S.maxCombo=Math.max(S.maxCombo,shown);
 banner('me-'+g.id+'-'+count,myName(st.id),myAv(),g,shown);startCombo(g,count);
 if(combo.n===1||g.price>=99)comment(myName(st.id),`送出了 ${g.name} x${count}`,'me gift',myLv(),fanBadge(st.id));
 // 特效
 if(g.fx)FX.queue(g,myName(st.id));else if(g.price>=99){FX.mid(g);SFX.mid()}else{FX.small(g,count);SFX.pop(combo.n)}
 react(st,g,count,combo.n);
 if(cost>=1000||Math.random()<.22)setTimeout(()=>comment(P(USERS),femT(P(cost>=10000?['神豪！！！','大哥大氣！','我滴媽呀','跪了跪了','這就是榜一的實力','截圖了！']:cost>=1000?['大哥牛啊','老闆大氣','666666','有錢真好','膜拜']:['謝謝大哥','好暖','跟上跟上','哇']))),400);
 if(Math.random()<.16)npcCounter();
 hud();checkAch();save();return true}
function react(st,g,count,n){const v=g.price*count,vars={g:g.name,x:n*count,gObj:g};
 if(v>=10000){face('shocked',1600,'excited');setTimeout(()=>line(st,'b',vars,{prio:3,ex:true}),900)}
 else if(v>=1000){face('shocked',900,'excited');setTimeout(()=>line(st,'b',vars,{prio:3,ex:true}),500)}
 else if(MS_COMBO.includes(n*count)&&n>1){line(st,'combo',vars,{prio:2,ex:true});face('excited',1500)}
 else if(n>1)return;
 else if(v>=99){line(st,'m',vars,{prio:2});face('happy',2000)}
 else{line(st,'s',vars,{prio:1});face(mood(st.id)>=1&&Math.random()<.4?'shy':'happy',1400)}}

/* ================= NPC ================= */
function npcSend(i,g,count=1){const st=cs(),s=cr().sess;if(!isLive(st.id))return;const x=s.npc[i];x.v+=g.price*count;s.wave+=g.price*count;s.gifts+=count;banner('npc'+i+g.id,x.n,x.a,g,count);comment(x.n,`送出了 ${g.name} x${count}`,'gift',Math.ceil(R(20,50)));
 if(g.fx)FX.queue(g,x.n);else if(g.price>=99)FX.mid(g);else FX.small(g,count);
 if(g.price*count>=1000)setTimeout(()=>{sysSay(st,SYS_T.npc,{npc:x.n,g:g.name},{prio:2,npc:1});face('happy',1800)},600);hud();save()}
function npcRandom(){if(!started||document.hidden||!isLive(cs().id)||ending)return;const s=cr().sess,i=Math.floor(Math.random()*s.npc.length);if(Math.random()<.12)npcSend(i,G[P(NPC_BIG)]);else npcSend(i,G[P(NPC_SMALL)],P([1,1,1,5,10]))}
function npcCounter(){const id=cs().id,rk=ranking(id),my=rk.findIndex(x=>x.me);const rv=rk[my+1];if(!rv||rv.me||rv.v<cr().sess.me*.55)return;
 setTimeout(()=>{if(cs().id!==id||!isLive(id))return;const gap=cr().sess.me-rk[my+1].v;const g=[...GIFTS].reverse().find(x=>x.fx&&x.price<=gap*1.25+1500&&x.price<=10000)||G.car;toast(`⚔️ PK！「${rv.name}」不服，送出了 ${g.name}！`,'pk');SFX.pk();npcSend(rv.npc,g);comment(rv.name,P(['榜一是我的！','不服來戰','小老弟還嫩','加錢！']),'',35)},R(1500,3500))}
(function loop(){setTimeout(()=>{npcRandom();loop()},R(6000,14000))})();

/* ================= 點讚 ================= */
let likeN=0;
function tapLike(e){if(!started||!isLive(cs().id))return;const st=cs(),r=cr();const d=document.createElement('img');d.src='assets/i_heart.webp';d.className='like';d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';d.style.setProperty('--r',R(-25,25)+'deg');$('#app').appendChild(d);setTimeout(()=>d.remove(),1000);
 if(Math.random()<.5)FX.small(G.heart,1);r.sess.likes++;S.likes++;likeN++;SFX.like();if(likeN%10===0){r.aff+=1}if(likeN%60===0){sysSay(st,SYS_T.like,{},{prio:1});face('happy',1000)}if(likeN%5===0)hud();checkAch();save()}

/* ================= 禮物面板 ================= */
const TABS=[['熱門',g=>!g.excl],['小禮物',g=>g.price<99],['精品',g=>g.price>=99&&g.price<1000],['豪華',g=>g.price>=1000&&g.price<10000],['至尊',g=>g.price>=10000&&!g.excl],['身份專屬',g=>g.excl]];
let tab=0,sel=null,cnt=1;
function renderSheet(){$('#tabs').innerHTML=TABS.map((t,i)=>`<button class="tab ${i===tab?'on':''}" data-i="${i}">${t[0]}</button>`).join('');
 const list=GIFTS.filter(TABS[tab][1]);const pages=[];for(let i=0;i<list.length;i+=8)pages.push(list.slice(i,i+8));
 $('#pages').innerHTML=pages.map(p=>`<div class="page">${p.map(g=>`<div class="g ${sel===g?'sel':''} ${g.noble&&!hasNoble(g.noble)?'locked':''}" data-id="${g.id}">${g.noble&&!hasNoble(g.noble)?`<span class="tag lock">🔒${NOBLES.find(n=>n.id===g.noble).name}</span>`:g.noble?`<span class="tag excl">${NOBLES.find(n=>n.id===g.noble).name}</span>`:g.fx?'<span class="tag">特效</span>':''}<img src="${g.img}" alt=""><div class="gn">${g.name}</div><div class="gp"><img src="assets/i_coin.webp">${fmt(g.price)}</div><button class="send">贈送</button></div>`).join('')}</div>`).join('');
 $('#dots').innerHTML=pages.length>1?pages.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join(''):'';renderCnt()}
function renderCnt(){const cs_=sel&&sel.price<99?[1,10,66,188,520,1314]:[1];if(!cs_.includes(cnt))cnt=1;$('#cnts').innerHTML=cs_.length>1?cs_.map(c=>`<button class="cnt ${c===cnt?'on':''}" data-c="${c}">${c}</button>`).join(''):''}
$('#pages').addEventListener('scroll',()=>{const p=$('#pages'),i=Math.round(p.scrollLeft/p.clientWidth);$('#dots').querySelectorAll('i').forEach((d,k)=>d.classList.toggle('on',k===i))},{passive:true});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;tab=+b.dataset.i;renderSheet();$('#pages').scrollLeft=0});
$('#pages').addEventListener('click',e=>{const c=e.target.closest('.g');if(!c)return;const g=G[c.dataset.id];if(e.target.closest('.send')||sel===g){if(send(g,cnt,false))closeAll();return}sel=g;SFX.like();document.querySelectorAll('.g.sel').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');renderCnt()});
$('#cnts').addEventListener('click',e=>{const b=e.target.closest('.cnt');if(!b)return;cnt=+b.dataset.c;renderCnt()});
function openSheet(id){ac();closeAll();$('#mask').classList.add('show');$('#'+id).classList.add('show');if(id==='giftSheet'){if(!sel)sel=G.heart;renderSheet();hud()}if(id==='moreSheet')renderMore()}
function closeAll(){$('#mask').classList.remove('show');document.querySelectorAll('.sheet.show').forEach(x=>x.classList.remove('show'));document.querySelectorAll('.modal.show').forEach(m=>{if(m.id!=='mWelcome')m.classList.remove('show')})}
$('#giftBtn').addEventListener('click',()=>{if(!isLive(cs().id)){toast('主播已下播');return}openSheet('giftSheet')});
$('#moreBtn').addEventListener('click',()=>openSheet('moreSheet'));
$('#mask').addEventListener('click',()=>{if(!$('#mWelcome').classList.contains('show'))closeAll()});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeAll));
$('#walletBtn').addEventListener('click',()=>openModal('mRecharge'));
function renderMore(){$('#gIc').textContent=isF()?'🙋‍♀️':'🙋‍♂️';$('#gLb').textContent='我是：'+(isF()?'神豪姐姐':'神豪大哥');$('#shIc').textContent=S.shake?'📳':'📴';$('#shLb').textContent='畫面震動 '+(S.shake?'開':'關');$('#sfxIc').textContent=S.sfx?'🔊':'🔇';$('#sfxLb').textContent='音效 '+(S.sfx?'開':'關');$('#voiceIc').textContent=S.voice?'🗣️':'🤐';$('#voiceLb').textContent='主播語音 '+(S.voice?'開':'關')}
$('#moreSheet').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='recharge')openModal('mRecharge');else if(a==='role'){renderRole();openModal('mRole')}else if(a==='rank')openModal('mRank');else if(a==='ach')openModal('mAch');else if(a==='lobby'){closeAll();openPanel('lobby')}
 else if(a==='sfx'){S.sfx=!S.sfx;renderMore();save();SFX.like()}else if(a==='voice'){S.voice=!S.voice;if(!S.voice){ttsStop();TTS.cur=null;TTS.q=null}else sysSay(cs(),SYS_T.voiceOn,{},{prio:2});renderMore();save()}
 else if(a==='gender'){S.pg=isF()?'m':'f';save();renderMore();hud();toast(isF()?'已切換為「神豪姐姐」，主播會叫你姐姐囉':'已切換為「神豪大哥」');sysSay(cs(),P(SYS_T.gender),{},{prio:2})}
 else if(a==='shake'){S.shake=!S.shake;applyShake();renderMore();save();if(S.shake)FX.shake(.25)}
 else if(a==='nick')openModal('mNick');else if(a==='reset'){if(confirm('確定要清除所有進度嗎？')){localStorage.removeItem(KEY);localStorage.removeItem('shenhao_v1');location.reload()}}});
/* modals */
function openModal(id){ac();closeAll();$('#mask').classList.add('show');$('#'+id).classList.add('show');if(id==='mRank')renderRank();if(id==='mAch')renderAch();if(id==='mNick')$('#nickInput').value=S.nick}
function renderRank(){const st=cs(),cols=['#ffd700','#d9d9d9','#e0a060'];$('#rankTitle').textContent='本場貢獻榜 · '+st.name;$('#rankList').innerHTML=ranking(st.id).map((x,i)=>`<div class="rk ${x.me?'me':''}"><div class="no" style="color:${cols[i]||'#888'}">${i+1}</div><div class="ra">${x.av}</div><div class="rn">${esc(x.name)}${x.me?'（你）':''}</div><div class="rv">${fmt(x.v)}</div></div>`).join('')}
$('#hourTag').addEventListener('click',()=>openModal('mRank'));$('#popTag').addEventListener('click',()=>openModal('mRank'));$('#audience').addEventListener('click',()=>openModal('mRank'));
const PKGS=[[60000,'小試身手'],[666666,'六六大順'],[3000000,'煤老闆套餐'],[10000000,'千萬神豪'],[52000000,'五千萬我愛你'],[100000000,'一個小目標']];
$('#pkgs').innerHTML=PKGS.map(([v,n],i)=>`<button class="pkg" data-i="${i}"><img src="assets/i_coin.webp"><div class="pc">${fmt(v)}</div><div class="pd">${n}・免費模擬</div></button>`).join('');
$('#pkgs').addEventListener('click',e=>{const b=e.target.closest('.pkg');if(!b)return;const v=PKGS[+b.dataset.i][0];const before=noble();S.coins+=v;S.recharges++;S.recharged=(S.recharged||0)+v;SFX.coin();setTimeout(SFX.coin,150);setTimeout(SFX.coin,300);FX.coins(1.2,5);toast(`💰 充值成功！+${fmt(v)} 金幣（模擬）`);closeAll();if(isLive(cs().id)){sysSay(cs(),P(SYS_T.recharge),{},{prio:2});face('shocked',900,'happy')}hud();checkAch();save();const after=noble();if(after&&(!before||after.id!==before.id))setTimeout(()=>nobleUp(after),900)});
$('#nickSave').addEventListener('click',()=>{const v=$('#nickInput').value.trim();if(v){S.nick=v.slice(0,12);save();hud();toast('暱稱已更新：'+S.nick);closeAll();sysSay(cs(),SYS_T.nick,{},{prio:2})}});
$('#followBtn').addEventListener('click',()=>{const st=cs(),r=cr();if(r.follow){toast(`你是${st.fan} Lv${fanLv(st.id)}，送禮可提升好感度`);return}r.follow=true;SFX.mid();line(st,'follow',{},{prio:2});face('shy',2200);comment('',`🎉 ${myName(st.id)} 關注了主播，加入了${st.fan}`,'sys');setTimeout(()=>dmPush(st.id,dmT('followBack',st.id)),4500);hud();save()});
$('#closeBtn').addEventListener('click',()=>openPanel('lobby'));
$('#say').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const v=e.target.value.trim();const st=cs();if(v&&isLive(st.id)){comment(myName(st.id),v,'me',myLv(),fanBadge(st.id));e.target.value='';setTimeout(()=>{const rep=dlgReply(st.id,v,true);say(st,rep,{prio:2});face('happy',1600)},900)}e.target.blur()});

/* ================= 直播廣場 ================= */
function openPanel(id){closeAll();$('#'+id).classList.add('show');if(id==='lobby')renderLobby();if(id==='inbox')renderInbox()}
function closePanels(){document.querySelectorAll('.panel.show').forEach(p=>p.classList.remove('show'));threadId=null}
document.querySelectorAll('[data-pclose]').forEach(b=>b.addEventListener('click',closePanels));
function renderLobby(){$('#lobbyGrid').innerHTML=STREAMERS.map((st,i)=>{const live=isLive(st.id),s=room(st.id).sess;return `<div class="lc ${live?'':'off'}" data-i="${i}"><img src="assets/${st.id}_idle.webp" alt=""><span class="st">${live?'直播中 · 剩 '+mmss(s.end-now()):'已下播 · '+cdText(s.offUntil-now())+'後開播'}</span>${live?`<span class="vw" style="left:auto">${fmt(s.viewBase+s.wave/40)}人</span>`:''}<div class="lb"><b>${esc(st.name)}${i===S.cur?' · 觀看中':''}</b><small>${esc(st.tag)} · ${esc(st.bio)}</small></div></div>`}).join('')}
$('#lobbyGrid').addEventListener('click',e=>{const c=e.target.closest('.lc');if(c)jumpTo(+c.dataset.i)});

/* ================= 私信 ================= */
let threadId=null;
function dm(id){if(!S.dms[id])S.dms[id]=[];return S.dms[id]}
function badge(){const n=Object.values(S.unread).reduce((a,b)=>a+b,0);const b=$('#dmBadge');b.textContent=n>99?'99+':n;b.classList.toggle('on',n>0)}
function dmPush(id,text,o={}){const st=SM[id];dm(id).push({f:'h',t:text,ts:now()});if(dm(id).length>200)dm(id).splice(0,dm(id).length-200);room(id).lastDM=now();
 if(threadId===id){renderMsgs();if(S.voice)speak(text,st,{prio:1})}else{S.unread[id]=(S.unread[id]||0)+1;if(!o.silent){const t=document.createElement('div');t.innerHTML=`<img src="assets/${id}_av.webp"><div><b class="dt"></b><div class="dx"></div></div>`;t.style.display='contents';t.querySelector('.dt').textContent=st.name+' 傳來私信';t.querySelector('.dx').textContent=text.length>22?text.slice(0,22)+'…':text;toast(t,'dm',()=>openThread(id));SFX.dm()}}
 if($('#inbox').classList.contains('show'))renderInbox();badge();save()}
function giftDM(id,g,total){const r=room(id),st=SM[id];if(!total)return;const since=now()-r.lastDM;
 if(total>=1000&&since>30000)setTimeout(()=>dmPush(id,dmT('giftB',id,{g:g.name})),R(6000,12000));
 else if(total>=52&&since>90000)setTimeout(()=>dmPush(id,dmT('giftS',id,{g:g.name})),R(5000,10000))}
const tstr=ts=>{const d=new Date(ts),n=new Date();const hm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return d.toDateString()===n.toDateString()?hm:(d.getMonth()+1)+'/'+d.getDate()+' '+hm};
function renderInbox(){const list=STREAMERS.map(st=>{const m=dm(st.id),last=m[m.length-1];return{st,last,ts:last?last.ts:0}}).sort((a,b)=>b.ts-a.ts);
 $('#inboxList').innerHTML=list.map(({st,last})=>`<div class="ib" data-id="${st.id}"><div class="ia"><img src="assets/${st.id}_av.webp">${isLive(st.id)?'<span class="live">直播中</span>':''}</div><div class="im"><b>${esc(st.name)}</b><p>${last?esc((last.f==='m'?'你：':'')+last.t):'打個招呼吧～ '+esc(st.bio)}</p></div><div class="it">${last?tstr(last.ts):''}${S.unread[st.id]?`<br><span class="ub">${S.unread[st.id]}</span>`:''}</div></div>`).join('')}
$('#inboxList').addEventListener('click',e=>{const c=e.target.closest('.ib');if(c)openThread(c.dataset.id)});
$('#dmBtn').addEventListener('click',()=>openPanel('inbox'));
function openThread(id){closeAll();window.DLGE&&DLGE.ensure(id);const st=SM[id];threadId=id;S.unread[id]=0;badge();$('#thAv').src=`assets/${id}_av.webp`;$('#thName').textContent=st.name;$('#thStatus').textContent=isLive(id)?'● 直播中':'已下播 · '+st.style;$('#thread').classList.add('show');
 $('#quick').innerHTML=QUICK.map(q=>`<button>${q}</button>`).join('');renderMsgs();save()}
$('#threadBack').addEventListener('click',()=>{$('#thread').classList.remove('show');threadId=null;if($('#inbox').classList.contains('show'))renderInbox()});
let typingEl=null;
function renderMsgs(){const id=threadId;if(!id)return;const box=$('#msgs');let h='',lastTs=0;
 dm(id).forEach(m=>{if(m.ts-lastTs>5*60000)h+=`<div class="ts">${tstr(m.ts)}</div>`;lastTs=m.ts;
  h+=m.f==='m'?`<div class="msg me"><div class="me-av">${myAv()}</div><div class="bub">${esc(m.t)}</div></div>`:`<div class="msg"><img src="assets/${id}_av.webp"><div class="bub">${esc(m.t)}</div></div>`});
 if(!dm(id).length)h=`<div class="ts">和 ${esc(SM[id].name)} 開始聊天吧～（對方為虛構角色）</div>`;
 box.innerHTML=h;if(typingEl)box.appendChild(typingEl);box.scrollTop=box.scrollHeight}
function dmSend(text){const id=threadId;if(!id||!text.trim())return;text=text.trim().slice(0,60);dm(id).push({f:'m',t:text,ts:now()});S.dmSent++;checkAch();renderMsgs();save();SFX.like();
 const rep=dlgReply(id,text);const parts=rep.split('|');
 setTimeout(()=>{if(threadId!==id)return;typingEl=document.createElement('div');typingEl.className='msg typing';typingEl.innerHTML=`<img src="assets/${id}_av.webp"><div class="bub"><i></i><i></i><i></i></div>`;renderMsgs()},R(500,900));
 let delay=R(1200,1800)+parts[0].length*55;
 parts.forEach((p,k)=>{setTimeout(()=>{if(k===parts.length-1)typingEl=null;if(threadId===id){dm(id).push({f:'h',t:p,ts:now()});renderMsgs();if(S.voice)speak(p,SM[id],{prio:1});SFX.dm()}else{typingEl=null;dmPush(id,p)}save()},delay);delay+=R(1000,1600)+(parts[k+1]||'').length*50})}
$('#dmSend').addEventListener('click',()=>{dmSend($('#dmInput').value);$('#dmInput').value=''});
$('#dmInput').addEventListener('keydown',e=>{if(e.key==='Enter'){dmSend(e.target.value);e.target.value=''}});
$('#quick').addEventListener('click',e=>{const b=e.target.closest('button');if(b)dmSend(b.textContent)});
/* --- 對話引擎 --- */
const FOLLOW={s1:['你呢你呢？','{n}今天開心嗎？','你在做什麼呀？'],s2:['你呢？','今晚有什麼心事嗎','說說你吧'],s3:['你呢你呢！','要不要一起打遊戲！','你今天做了什麼好玩的！'],s4:['你今天過得好嗎？','你呢？','有什麼想跟我說的嗎'],s5:['老鐵你呢？','你今天有沒有被笑到','說個你的糗事來聽聽'],s6:['你呢？','最近有在聽什麼歌嗎','你今天好嗎']};
const recent={};
function dlgReplyOld(id,text,live){const st=SM[id],D=DLG[id],m=mood(id),mem=S.mem[id]||(S.mem[id]={});
 let intent='fallback';for(const [k,re] of INTENTS){if(re.test(text)){intent=k;break}}
 // 記憶
 let mName=text.match(/(?:我叫|叫我)\s*([^\s，,。！!？?]{1,8})/);if(mName){mem.name=mName[1];save();return fill(P(['好呀，以後就叫你{n}','{n}，記住了','嗯嗯，{n}，好名字']),st)}
 let mLike=text.match(/我(?:最)?喜歡(?!你)([^\s，,。！!？?]{1,10})/);if(mLike&&intent!=='love'){mem.likes=mLike[1];save();return fill(P(['{likes}嗎？記住了，原來{n}喜歡這個','我也喜歡{likes}耶','{likes}！下次直播跟大家聊聊這個']),st,{likes:mem.likes})}
 if(intent==='question')intent='fallback';
 let pool=D[intent]||D.fallback;if(pool&&!Array.isArray(pool))pool=pool[m];
 const rc=recent[id]||(recent[id]=[]);let cand=pool.filter(x=>!rc.includes(x));if(!cand.length)cand=pool;const pick=P(cand);rc.push(pick);if(rc.length>6)rc.shift();
 const r=room(id);let out=fill(pick,st,{g:r.lastGift||'禮物',likes:mem.likes});
 if(live)return out.replace(/\|/g,'');
 if(intent!=='unsafe'&&intent!=='contact'){
  const roll=Math.random();
  if(r.lastGift&&roll<.18)out+='|'+fill(P(['對了，你送的{g}我很喜歡','剛剛的{g}謝謝你喔','{g}我還記得喔']),st,{g:r.lastGift});
  else if(mem.likes&&roll<.3)out+='|'+fill(P(['你上次說喜歡{likes}，我有記住喔','說到這個，你不是喜歡{likes}嗎']),st,{likes:mem.likes});
  else if(roll<.5&&!['bye','night'].includes(intent))out+='|'+fill(P(FOLLOW[id]),st);
  if(m>=2&&Math.random()<.35&&id!=='s5')out+=P(['💕','～','😊']);
  if(!isLive(id)&&Math.random()<.2)out+='|'+P(['現在下播休息中，跟你聊天剛好','等等開播記得來喔']);
 }
 return out}

function dlgReply(id,text,live){if(!window.DLGE||!DLGE.ready(id))return dlgReplyOld(id,text,live);
 const st=SM[id],m=mood(id),mem=S.mem[id]||(S.mem[id]={}),r=room(id);
 const out=DLGE.reply(id,text,mem,{mood:m,male:st.gender==='m',fp:isF(),va:vaddr(st),call:callFor(st,myName(id),m),callOf:n=>callFor(st,n,m),gift:r.lastGift||'',live});
 save();const res=femT(out),VO=DLGE.lastV||[];res.split('|').forEach((p,k)=>vfor(p,VO[k]!=null?femT(VO[k]):''));return res}
function dmT(kind,id,v={}){const st=SM[id],m=mood(id),mem=S.mem[id]||(S.mem[id]={});
 const t=window.DLGE&&DLGE.dm(id,kind,{mood:m,male:st.gender==='m',fp:isF(),va:vaddr(st),call:callFor(st,myName(id),m),gift:v.g||''},mem);
 const pool=(DM_T[kind]&&DM_T[kind][id])||['{n}，謝謝你'];const res=femT(t||fill(P(pool),st,v));vfor(res,t&&DLGE.lastV&&DLGE.lastV[0]!=null?femT(DLGE.lastV[0]):'');return res}
function nobleUp(n){toast(`👑 解鎖尊貴身份「${n.name}」！進場特效與專屬徽章已啟用`,'ach');SFX.ach();const st=cs();
 if(isLive(st.id))myEntrance(st,true);if(now()-(S.lastRoleDM||0)>60000){S.lastRoleDM=now();setTimeout(()=>dmPush(st.id,dmT('role',st.id)),6000)}unlock('noble_'+n.id);renderRole()}
/* ================= 角色系統 ================= */
function renderRole(){const el=$('#roleBody');if(!el)return;const rl=realLv(),dl=myLv(),nx=LEVELS[rl]||null;
 let h=`<div class="lvcard"><div class="lvbig">${lvBadge(dl)}${S.role==='reborn'?'<small>（重生顯示等級）</small>':''}</div><div>真實財富等級 <b>Lv${rl}</b> · 累積消費 <b>${fmt(S.spent)}</b> 金幣</div>${nx?`<div class="lvbar"><i style="width:${Math.min(100,(S.spent-(LEVELS[rl-1]||0))/(nx-(LEVELS[rl-1]||0))*100)}%"></i></div><div class="sub">距離 Lv${rl+1} 還差 ${fmt(nx-S.spent)} 金幣</div>`:'<div class="sub">已達最高 75 級</div>'}</div>`;
 h+='<div class="sec">角色身份（財富等級 50 級以上解鎖）</div>';
 h+=`<button class="rcard ${!S.role?'on':''}" data-role=""><b class="remo">😎</b><div><div class="rn">一般身份</div><div class="rd">顯示真實等級與暱稱</div></div><span class="rs">${!S.role?'使用中':'切換'}</span></button>`;
 for(const k in ROLES){const r=ROLES[k],ok=rl>=r.lv,on=S.role===k;const d=on?S.spent-(S.roleStart[k]||0):0;const st=on?roleStage():0;const nxt=on&&ROLE_STEPS[st]?ROLE_STEPS[st]-d:0;
  h+=`<button class="rcard ${on?'on':''} ${ok?'':'locked'}" data-role="${k}" style="--rc:${r.color}">${icoB(r.icon,r.emo,'ricon')}<div><div class="rn">${r.name}${on?` · ${st}階`:''}</div><div class="rd">${r.desc}</div>${on?`<div class="rd">${nxt?`再消費 ${fmt(nxt)} 升 ${st+1} 階`:'已達 7 階'}</div>`:''}${k==='reborn'&&S.rebornBase!=null?`<div class="rd">重生後顯示 Lv${lvOf(S.spent-S.rebornBase)}（原等級 Lv${rl}）</div>`:''}</div><span class="rs">${!ok?`🔒 Lv${r.lv}`:on?'使用中':'切換'}</span></button>`}
 h+=`<div class="sec">尊貴身份（累積充值解鎖） · 已充值 ${fmt(S.recharged||0)}</div>`;
 NOBLES.forEach(n=>{const ok=(S.recharged||0)>=n.need;h+=`<div class="rcard ${ok?'on':'locked'}" style="--rc:${n.color}">${icoB(n.icon,n.emo,'ricon')}<div><div class="rn">${n.name}</div><div class="rd">累積充值 ${fmt(n.need)} 金幣 · 專屬徽章＋進場特效＋專屬禮物：${GIFTS.filter(g=>g.noble===n.id).map(g=>g.name).join('、')}</div></div><span class="rs">${ok?'已解鎖':'差 '+fmt(n.need-(S.recharged||0))}</span></div>`});
 h+=`<button class="btn sm" id="nobleTog">${S.nobleOn?'隱藏尊貴身份（關閉進場特效）':'顯示尊貴身份'}</button><button class="btn sm ghost" id="entPrev">預覽我的進場特效</button>`;
 el.innerHTML=h}
document.addEventListener('click',e=>{const b=e.target.closest('#roleBody [data-role]');if(b){const k=b.dataset.role;if(k&&realLv()<ROLES[k].lv){toast(`財富等級達到 Lv${ROLES[k].lv} 才能解鎖${ROLES[k].name}`);return}
  if(k==='reborn'&&S.rebornBase==null){if(!confirm('確定要「重生」嗎？\n重生後顯示等級從 0 開始重新升級，\n但你的累積消費仍會計入原本的真實等級。'))return;S.rebornBase=S.spent}
  if(k==='mystery'&&!S.mysteryNo)S.mysteryNo=Math.floor(R(1000,9999));
  if(k&&S.roleStart[k]==null)S.roleStart[k]=S.spent;S.role=k;save();renderRole();hud();toast(k?`已切換為「${ROLES[k].name}」`:'已切換為一般身份');if(k){unlock('role_'+k);const st=cs();if(isLive(st.id))myEntrance(st,true);if(now()-(S.lastRoleDM||0)>60000){S.lastRoleDM=now();setTimeout(()=>dmPush(st.id,dmT('role',st.id)),5000)}}return}
 if(e.target.id==='nobleTog'){S.nobleOn=!S.nobleOn;save();renderRole();return}
 if(e.target.id==='entPrev'){closeAll();const st=cs();if(!noble()&&!S.role){toast('還沒有尊貴身份或角色喔');return}myEntrance(st,true)}});
/* ================= 成就 ================= */
const ACH=[
 ['first','🎁','初次見面','送出第一份禮物',()=>S.spent>0],
 ['combo66','⚡','手速驚人','連擊達到 66',()=>S.maxCombo>=66],
 ['combo520','🌀','連擊之神','連擊達到 520',()=>S.maxCombo>=520],
 ['qianjin','💰','一擲千金','單次送出 1000 金幣以上的禮物',()=>S.maxSingle>=1000],
 ['rocket','🚀','第一枚火箭','送出火箭',()=>anyGift('rocket')],
 ['carnival','🎡','嘉年華之夜','送出嘉年華',()=>anyGift('carnival')],
 ['princess','👸','公主三件套','在同一間送出浪漫馬車＋嘉年華＋夢幻城堡',()=>Object.values(S.rooms).some(r=>r.giftCount.carriage&&r.giftCount.carnival&&r.giftCount.castle)],
 ['top1','🏆','榜一大哥','登上本場貢獻榜第一',()=>false],
 ['guard','🛡️','下播守護','在主播下播時是榜一',()=>false],
 ['top3rooms','👑','全網榜一','在 3 個不同直播間下播時是榜一',()=>Object.keys(S.top1Rooms).length>=3],
 ['visit','🌙','夜貓巡房','逛遍所有直播間',()=>Object.keys(S.visited).length>=N],
 ['dm20','💌','私信達人','發送 20 則私信',()=>S.dmSent>=20],
 ['million','💎','百萬神豪','累計消費 100 萬金幣',()=>S.spent>=1e6],
 ['tenm','🤑','千萬富翁','累計消費 1000 萬金幣',()=>S.spent>=1e7],
 ['recharge','🏧','充值狂魔','充值 5 次',()=>S.recharges>=5],
 ['lv50','🌟','五十級大佬','真實財富等級達到 Lv50',()=>realLv()>=50],
 ['role_reborn','🔥','浴火重生','成為重生者',()=>false],
 ['role_guardian','🛡️','守護之盾','成為守護者',()=>false],
 ['role_mystery','🎭','神秘大佬','成為神秘人',()=>false],
 ['noble_rose','🌹','玫瑰公爵','累積充值 10 萬解鎖',()=>false],
 ['noble_rider','🐲','御龍游俠','累積充值 20 萬解鎖',()=>false],
 ['noble_dragon','🐉','龍騰九天','累積充值 30 萬解鎖',()=>false],
 ['likes','❤️','點讚狂人','點讚 1000 次',()=>S.likes>=1000],
 ['love','💞','本命神豪','任一主播好感度達 131400',()=>Object.values(S.rooms).some(r=>r.aff>=131400)],
];
const anyGift=id=>Object.values(S.rooms).some(r=>r.giftCount[id]);
function unlock(id){if(S.ach[id])return;const a=ACH.find(x=>x[0]===id);if(!a)return;S.ach[id]=now();save();setTimeout(()=>{toast(`🏅 成就解鎖：${femT(a[2])}`,'ach');SFX.ach()},300)}
function checkAch(){ACH.forEach(a=>{if(!S.ach[a[0]]&&a[4]())unlock(a[0])});const st=cs(),r=cr();MILES.forEach(([v,t])=>{if(r.aff>=v&&!r.miles[v]){r.miles[v]=1;setTimeout(()=>{toast(`💗 ${st.name} 好感度 ${fmt(v)}：${t}`,'ach');face('shy',2500)},1200);if(v>=5200)setTimeout(()=>dmPush(st.id,fill(P(DLG[st.id].love[2]),st)),15000)}})}
function renderAch(){const n=Object.keys(S.ach).length,st=cs(),r=cr();$('#stats').innerHTML=`<div><b>${fmt(S.spent)}</b>累計消費</div><div><b>${fmt(S.coins)}</b>金幣餘額</div><div><b>Lv${myLv()}</b>財富等級</div><div><b>${fmt(r.aff)}</b>${esc(st.name)}好感</div><div><b>${S.maxCombo}</b>最高連擊</div><div><b>${n}/${ACH.length}</b>成就</div>`;
 $('#mileList').innerHTML=MILES.map(([v,t])=>`<div class="mst ${r.aff>=v?'ok':''}"><span>${r.aff>=v?'💗':'🤍'} ${t}</span><span>${fmt(v)}</span></div>`).join('');
 $('#achList').innerHTML=ACH.map(a=>`<div class="ach ${S.ach[a[0]]?'ok':''}"><div class="ae">${a[1]}</div><div><div class="an">${femT(a[2])}</div><div class="ad">${a[3]}</div></div></div>`).join('')}

/* ================= iOS 防縮放 ================= */
['gesturestart','gesturechange','dblclick'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(!e.target.closest('#pages,.mBody,.tabs,#msgs,#inboxList,.lobbyGrid,#quick'))e.preventDefault()},{passive:false});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});

/* ================= 啟動 ================= */
STREAMERS.forEach(st=>EXP.concat(['av']).forEach(e=>{const i=new Image();i.src=`assets/${st.id}_${e}.webp`}));
['car','jet','heli','cruise','rocket','castle','carriage','airship','carnival'].forEach(k=>{const i=new Image();i.src=`assets/g_${k}.webp`});
initSessions();buildFeed();hud();badge();setInterval(tick,1000);
$('#welAvs').innerHTML=STREAMERS.map(s=>`<img src="assets/${s.id}_av.webp">`).join('');
function start(){started=true;$('#mWelcome').classList.remove('show');$('#mask').classList.remove('show');ac();
 const st=cs();
 // iOS：在使用者手勢內直接說第一句，解鎖語音
 if(S.voice&&isLive(st.id)){const tp=P(st.L.welcome),t=fill(tp,st);caption(st,t);try{loadVoices();doSpeak({text:t,st,prio:2,ex:false,v:vfill(tp,st)})}catch(e){}}
 enterRoom(true,true);if(!S.seenHint){S.seenHint=1;setTimeout(()=>{$('#swipeHint').classList.remove('hide');setTimeout(()=>$('#swipeHint').classList.add('hide'),4000)},2500)}save()}
const renderG=()=>{document.querySelectorAll('#genderPick button').forEach(b=>b.classList.toggle('on',b.dataset.g===S.pg));$('#nickFirst').placeholder=isF()?'取個霸氣的暱稱，例如：富婆小美':'取個霸氣的暱稱，例如：龍哥'};
$('#genderPick').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.pg=b.dataset.g;save();renderG()});renderG();applyShake();
$('#startBtn').addEventListener('click',()=>{const v=$('#nickFirst').value.trim();S.nick=(v||S.nick||'神豪本豪').slice(0,12);save();start()});
if(S.nick)$('#nickFirst').value=S.nick;
$('#mask').classList.add('show');$('#mWelcome').classList.add('show');
window.__game={ttsStop,vaddr,VFOR,myLv,realLv,renderRole,myEntrance,LEVELS,S,send,G,FX,go,jumpTo,end:()=>{const s=cr().sess;s.end=now();tick()},offSoon:()=>{const s=cr().sess;s.offUntil=now()+1500},dmSend,openThread,isLive,cs,dlgReply,speak,TTS,AU,femT,callFor,callN,fill,dmT,FXq:FX};
})();
