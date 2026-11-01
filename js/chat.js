/* 私信對話引擎：腳本式、無 AI。資料在 assets/dlg/*.js（延遲載入） */
(function(){
const STYLE={
 s1:{me:'柚子',P:['呀','嘛','啦','喔','～','呢',''],E:['💕','🥺','😊','🍊','✨','🥰'],cool:0},
 s2:{me:'我',P:['。','','呢'],E:['🌙','','',''],cool:1},
 s3:{me:'小桃',P:['！','啦！','耶！','欸！',''],E:['🎮','😆','🔥','🍑','✌️'],cool:0},
 s4:{me:'我',P:['呢','喔','呀','～',''],E:['🌸','☕','🎸','😌'],cool:0},
 s5:{me:'阿傑',P:['啦','欸','啦！','哈哈',''],E:['🤣','😎','👍','🍗'],cool:0},
 s6:{me:'我',P:['','。','嗯'],E:['🎤','🎧','',''],cool:1},
 a1:{me:'喵喵',P:['喵','喵～','喵！',''],E:['🐱','💕','✨','🎀','🐾'],cool:0,tail:'喵',tp:.55},
 a2:{me:'奈奈',P:['的說！','！','耶！','啦！',''],E:['🎮','✌️','🔥','🧡','⚡'],cool:0,tail:'的說',tp:.25},
 a3:{me:'琉璃',P:['。','','呢'],E:['🌙','✨','',''],cool:1,pre:'哼，',pp:.1},
 a4:{me:'我',P:['','！','啦',''],E:['🎸','😎','',''],cool:0},
};
const NAMES={s1:['柚子'],s2:['冷月'],s3:['小桃'],s4:['婉清'],s5:['阿傑'],s6:['星野'],a1:['喵喵'],a2:['奈奈'],a3:['琉璃'],a4:['蒼空']};
const MALE_ASSUME=/(女朋友|老婆|娶|男子漢|刮鬍|鬍子|嫁給你|嫁你|當你女|你的女人|大丈夫)/;
const W='[^\\s，,。！!？?、~～]';
const X=(s,f='')=>new RegExp(s,f);
// 優先序：安全 > 記憶 > 意圖
const INT=[
 ['unsafe',/(裸|色色|脫衣|做愛|約炮|開房|內衣|私密照|上床|胸部)/],
 ['contact',/(微信|wechat|line|賴|ig\b|instagram|電話|手機號|地址|住哪|見面|線下|約會|出來玩|面基|加好友)/i],
 ['photo',/(照片|自拍|發張|傳張|看看你)/],
 ['voice_call',/(語音|打電話|視訊|通話)/],
 ['rude',/(醜|難看|垃圾|滾|閉嘴|討厭你|噁心|騙子|騙錢|智障|白痴|爛)/],
 ['apology',/(對不起|抱歉|不好意思|我錯了|sorry)/i],
 ['birthday',/生日/],
 ['holiday',/(新年|過年|春節|元旦|中秋|聖誕|耶誕|情人節|七夕|端午|萬聖|跨年|元宵|母親節|父親節|連假)/],
 ['night',/(晚安|去睡|睡覺了|要睡了|我睡了|good ?night)/i],
 ['insomnia',/(睡不著|失眠)/],
 ['morning',/(早安|早上好|早啊|早呀|morning|起床了)/i],
 ['bye',/(掰|拜拜|再見|下線了|先走|bye|回頭聊|先這樣)/i],
 ['sick',/(感冒|生病|發燒|頭痛|頭疼|不舒服|咳嗽|看醫生|住院)/],
 ['sad',/(難過|傷心|想哭|哭了|心情不好|不開心|鬱悶|失戀|分手|崩潰|壓力|焦慮|emo)/i],
 ['lonely',/(孤單|寂寞|沒人陪|沒朋友)/],
 ['angry',/(生氣|氣死|火大|煩死|好煩|超煩|不爽)/],
 ['tired',/(好累|很累|累死|累了|好忙|加班|疲|沒睡|熬夜|好睏|想睡)/],
 ['happy',/(好開心|很開心|好消息|升職|加薪|考上|通過了|中獎|錄取|太爽|好高興)/],
 ['crush',/(我有喜歡的人|暗戀|喜歡上一個)/],
 ['love',/(愛你|愛妳|喜歡你|喜歡妳|嫁給我|在一起|做我女朋友|做我男朋友|老婆|老公|表白|告白|心動)/],
 ['missyou',/(想你|想妳|想念|好久不見)/],
 ['ask_real',/(真人|機器人|\bAI\b|ai嗎|假的吧|是不是真的)/i],
 ['ask_age',/(幾歲|多大了|年紀)/],
 ['ask_home',/(哪裡人|老家|家鄉)/],
 ['ask_single',/(單身|有男朋友|有女朋友|有對象|戀愛過)/],
 ['ask_type',/(喜歡什麼樣|理想型|擇偶|喜歡哪種)/],
 ['ask_hobby',/(興趣|愛好|嗜好|平常喜歡|平時喜歡|有空都)/],
 ['ask_fav',/(最喜歡|最愛).*(什麼|啥|哪)/],
 ['joke',/(笑話|講個|逗我|段子)/],
 ['compliment_voice',/(聲音|嗓音|好聽)/],
 ['sing',/(唱|歌|吉他|鋼琴|演唱會)/],
 ['compliment',/(好看|漂亮|美|可愛|帥|顏值|仙女|女神|男神|氣質|迷人|好甜|萌)/],
 ['praise_stream',/(直播.*(好看|好玩|有趣|精彩)|喜歡看你直播)/],
 ['thanks',/(謝謝|感謝|謝啦|多謝|thx|thank)/i],
 ['newbie',/(第一次來|新來的|新人|剛關注)/],
 ['fanclub',/(粉絲團|燈牌|團長)/],
 ['rank',/(榜一|上榜|排名|榜單)/],
 ['pk',/(pk|對手|打榜|衝榜|搶榜)/i],
 ['broke',/(沒錢|窮|月光|吃土)/],
 ['rich',/(有錢|我很富|土豪|神豪)/],
 ['gift',/(禮物|刷|送你|嘉年華|火箭|跑車|音浪|打賞|守護)/],
 ['schedule',/(幾點開播|什麼時候開播|何時開播|開播|下播|直播時間|明天播|今天播)/],
 ['coffee',/(咖啡|拿鐵|美式)/],
 ['cook',/(做菜|煮飯|料理|下廚)/],
 ['food',/(吃|喝|餓|飯|宵夜|早餐|午餐|晚餐|奶茶|火鍋|零食|甜點|蛋糕|外送|麵)/],
 ['weather',/(天氣|下雨|好熱|好冷|颱風|下雪|太陽|曬|冷氣|颳風|潮濕|降溫)/],
 ['season',/(春天|夏天|秋天|冬天|季節)/],
 ['work',/(上班|工作|老闆|同事|公司|開會|薪水|辭職|面試|下班|業績|客戶)/],
 ['study',/(上課|考試|作業|讀書|學校|期末|期中|老師|報告|論文|寒假|暑假|大學|高中)/],
 ['game',/(遊戲|打game|開黑|手遊|王者|吃雞|原神|lol|英雄聯盟|switch|ps5|上分|排位|抽卡)/i],
 ['movie',/(電影|追劇|劇|動漫|番|綜藝|netflix|影集|漫畫)/i],
 ['book',/(看書|小說|書)/],
 ['pet',/(貓|狗|寵物|喵|汪|倉鼠|兔子)/],
 ['travel',/(旅遊|旅行|出國|去玩|日本|韓國|海邊|爬山|機票|景點)/],
 ['sport',/(健身|運動|跑步|籃球|游泳|瑜伽|打球|重訓|減肥|胖)/],
 ['shopping',/(買|逛街|購物|衣服|包包|口紅|化妝|穿搭|網購)/],
 ['weekend',/(週末|周末|假日|禮拜六|禮拜天|星期六|星期天|休假)/],
 ['family',/(爸|媽|家人|兄弟|姐姐|妹妹|弟弟|哥哥們)/],
 ['friends',/(朋友|閨蜜|死黨)/],
 ['advice',/(怎麼辦|該不該|要不要|給我建議|好糾結)/],
 ['encourage',/(加油|好緊張|沒信心|怕失敗|不敢)/],
 ['dream',/(夢想|理想|目標)/],
 ['you_busy',/(你忙嗎|忙不忙|有空嗎|打擾)/],
 ['whatdoing',/(在幹嘛|在做什麼|在忙什麼|幹嘛呢|在做啥|做什麼呢)/],
 ['howareyou',/(你好嗎|最近好嗎|還好嗎|過得怎樣|最近怎麼樣|今天怎麼樣|心情如何)/],
 ['bored',/(無聊|好閒|沒事做)/],
 ['tease',/(哈哈|笑死|xd|呵呵|😂|🤣|好好笑)/i],
 ['agree',/^(對啊|沒錯|同意|真的|就是說)/],
 ['greet',/^(在嗎|在不在|嗨|hi|hello|哈囉|你好|安安|嘿|喂|hey|妳好)/i],
 ['short',/^(嗯+|喔+|哦+|好+|對+|是+|ok|欸|噢|恩+|好的|是啊|好啊|沒事|沒有|還好|普通)[。！!~～.]*$/i],
];
const MEM=[
 ['name',X('(?:我叫|叫我|我的名字是)\\s*('+W+'{1,8})')],
 ['job',X('我(?:是做|做)('+W+'{1,8})的')],
 ['job',X('我是(?:一名|一個|個)?('+W+'{1,6}(?:師|員|生|工|長|家|手|商|醫|警|官|者|闆|模|編|廚))')],
 ['job',X('我在('+W+'{2,8})(?:上班|工作)')],
 ['food',X('我(?:最)?(?:愛吃|喜歡吃|想吃)('+W+'{1,8})')],
 ['pet',X('我(?:家)?(?:有)?養了?(?:一隻|一只|隻|只|兩隻|一條)?('+W+'{1,6})')],
 ['age',/我(\d{1,2})歲/],
 ['study',X('我(?:在)?(?:讀|唸|念)('+W+'{1,8})')],
 ['bday',/我(?:的)?生日(?:是|在)?\s*(\d{1,2}月\d{1,2}[日號]?)/],
 ['city',X('我(?:住在|住|人在)('+W+'{2,6})')],
 ['city',X('我是('+W+'{2,4})人')],
 ['like',X('我(?:最)?喜歡(?!你|妳|吃)('+W+'{1,10})')],
];
const TOPIC_SLOT={food:'food',work:'job',city:'city',pet:'pet',hobby:'like'};
const CORE=['unsafe','contact','rude','apology','sad','sick','love','night','bye','birthday'];
const loaded={};let commonP=null;
function load(src){return new Promise(r=>{const s=document.createElement('script');s.src=src;s.onload=()=>r(true);s.onerror=()=>r(false);document.head.appendChild(s)})}
function ensure(id){if(!commonP)commonP=load('assets/dlg/common.js?v=6');if(!loaded[id])loaded[id]=commonP.then(()=>load(`assets/dlg/${id}.js?v=6`));return loaded[id]}
const ready=id=>!!(window.DLGB&&DLGB.shared&&DLGB[id]);
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function tod(){const h=new Date().getHours();return h<5?'late':h<11?'morning':h<14?'noon':h<18?'afternoon':'evening'}
// 解析一行的標記
function meta(l){let m=0,only0=false,f=false,b=false,w=false,t=l;const mm=l.match(/^~([fbw]*)(\d?)\s/);if(mm){f=mm[1].includes('f');b=mm[1].includes('b');w=mm[1].includes('w');if(mm[2]==='0')only0=true;else if(mm[2])m=+mm[2];t=l.slice(mm[0].length)}return{t,m,only0,f,b,w}}
function okLine(l,ctx){const x=meta(l);if(x.f&&ctx.male)return null;if(x.b&&!ctx.male)return null;if(x.w&&!ctx.fp)return null;if(ctx.fp&&MALE_ASSUME.test(x.t))return null;if(x.only0&&ctx.mood>0)return null;if(x.m>ctx.mood)return null;
 const need=x.t.match(/\{(\w+)\}/g)||[];for(const k of need){const key=k.slice(1,-1);if(['n','me','P','E'].includes(key))continue;if(ctx.v[key]==null||ctx.v[key]==='')return null}return x.t}
function pool(id,key,ctx){const per=(DLGB[id]||{})[key]||[],sh=(DLGB.shared||{})[key]||[];
 const W_=l=>/^~[fb]*w/.test(l);const a=per.map(l=>[okLine(l,ctx),W_(l)]).filter(x=>x[0]).map(([t,w])=>({t,w})),b=sh.map(l=>[okLine(l,ctx),W_(l)]).filter(x=>x[0]).map(([t,w])=>({t,sh:1,w}));
 return{a,b}}
function pick(id,key,ctx,mem){const {a,b}=pool(id,key,ctx);const rc=mem.rc||(mem.rc=[]);
 const fa=a.filter(x=>!rc.includes(x.t)),fb=b.filter(x=>!rc.includes(x.t));
 let c=(fa.length&&(Math.random()<.6||!fb.length))?fa:fb.length?fb:(a.length?a:b);
 if(ctx.fp&&Math.random()<.5){const wl=fa.concat(fb).filter(x=>x.w);if(wl.length)c=wl}
 if(!c.length)return null;const it=rnd(c);rc.push(it.t);if(rc.length>60)rc.shift();return it}
function render(id,it,ctx){const s=STYLE[id];let t=it.t;
 t=t.replace(/(嗎|呢|吧|喔|啦|呀|嘛|～|？|\?|！|!|。)\{P\}/g,'$1').replace(/\{P\}/g,()=>rnd(s.P)).replace(/\{E\}/g,()=>s.cool&&Math.random()<.7?'':rnd(s.E)).replace(/\{me\}/g,s.me).replace(/\{(\w+)\}/g,(m,k)=>ctx.v[k]!=null?ctx.v[k]:m);
 if(it.sh&&s.cool)t=t.replace(/！/g,'。').replace(/～/g,'').replace(/喔/g,'').replace(/呀/g,'');
 t=t.replace(/([。！？?!～])[。]+/g,'$1').replace(/^[，。]/,'').replace(/，([？?！!。])/g,'$1');
 if(s.me!=='我')t=t.replace(new RegExp(s.me+s.me,'g'),s.me);
 t=t.replace(/(好?)兄弟\/好?姐妹/g,(m,h)=>h+(ctx.fp?'姐妹':'兄弟'));
 if(s.tail&&!t.includes(s.tail)&&!/，$/.test(t)&&Math.random()<s.tp)t=t.replace(/([。！？?!～…]*)$/,s.tail+'$1');
 if(s.pre&&!t.startsWith(s.pre)&&!/，$/.test(t)&&Math.random()<s.pp)t=s.pre+t;
 return t}
// 語音版：不念暱稱（用通用稱呼）、不加隨機語氣詞；含記憶欄位的句子不配音
function renderV(id,it,ctx){const s=STYLE[id];let t=it.t;if(/\{(?!(?:n|me|P|E)\})\w+\}/.test(t))return null;
 t=t.replace(/\{P\}/g,'').replace(/\{E\}/g,'').replace(/\{me\}/g,s.me).replace(/\{n\}/g,ctx.va||'');
 if(it.sh&&s.cool)t=t.replace(/！/g,'。').replace(/～/g,'').replace(/喔/g,'').replace(/呀/g,'');
 t=t.replace(/([。！？?!～])[。]+/g,'$1').replace(/^[，。]/,'').replace(/，([？?！!。])/g,'$1');
 if(s.me!=='我')t=t.replace(new RegExp(s.me+s.me,'g'),s.me);
 t=t.replace(/(好?)兄弟\/好?姐妹/g,(m,h)=>h+(ctx.fp?'姐妹':'兄弟'));return t}
function extract(text,mem){const got=[];for(const [k,re] of MEM){const m=text.match(re);if(m&&!got.some(g=>g[0]===k)){let v=m[1].replace(/[的了啦喔呀耶]$/,'');if(!v)continue;if(k==='like'&&/^(這|那|你|妳)/.test(v))continue;mem[k]=v;got.push([k,v])}}return got}
function rivalOf(id,text){for(const k in NAMES){if(k===id)continue;for(const n of NAMES[k])if(text.includes(n))return n}if(/(別的主播|其他主播|隔壁|別人家)/.test(text))return'別的主播';return null}
/* 主回覆函式
 opt: {mood, male, call, gift, live, nick} 由 game.js 提供 */
function reply(id,text,mem,opt){
 text=(text||'').trim();const t=text.toLowerCase();
 const v={n:opt.call,g:opt.gift,name:mem.name,job:mem.job,food:mem.food,like:mem.like,city:mem.city,pet:mem.pet,age:mem.age,study:mem.study,bday:mem.bday};
 const ctx={mood:opt.mood,male:opt.male,fp:!!opt.fp,va:opt.va,v};
 const out=[],VO=[];window.DLGE.lastV=VO;let intent=null;
 // 1. 安全優先
 for(const [k,re] of INT.slice(0,2))if(re.test(t)){intent=k;break}
 // 2. 記憶抽取
 let mems=[];if(!intent){mems=extract(text,mem);v.name=mem.name;Object.assign(v,{job:mem.job,food:mem.food,like:mem.like,city:mem.city,pet:mem.pet,age:mem.age,study:mem.study,bday:mem.bday});if(mem.name)v.n=opt.callOf(mem.name)}
 // 3. 意圖
 const rival=rivalOf(id,text);
 if(!intent){if(rival){intent='jealous';v.rival=rival}else for(const [k,re] of INT.slice(2)){if(re.test(t)){intent=k;break}}}
 if(!intent&&/^[\p{Extended_Pictographic}\s❤️]+$/u.test(text))intent='emoji';
 if(!intent&&/[?？]|嗎$|呢$/.test(text))intent='askback';
 // 4. 上一題的回答（多輪）
 const weak=!intent||['short','agree','askback','emoji'].includes(intent);
 let answered=false;
 if(mem.topic&&weak&&!mems.length){const tp=mem.topic;mem.topic=null;answered=true;
  const slot=TOPIC_SLOT[tp];if(slot&&text.length>=1&&text.length<=10&&!/^(沒有|不知道|沒|不)/.test(text)&&intent!=='short'){mem[slot]=text.replace(/[。！!～~]+$/,'');v[slot]=mem[slot]}
  const it=pick(id,'ans_'+tp,ctx,mem);if(it){out.push(render(id,it,ctx));VO.push(renderV(id,it,ctx))}else answered=false;intent=answered?null:(intent||'fallback')}
 else if(mems.length&&!['unsafe','contact','love','sad','sick'].includes(intent)){
  const [k]=mems[0];mem.setAt=mem.turns||0;const it=pick(id,'mem_'+k,ctx,mem);if(it){out.push(render(id,it,ctx));VO.push(renderV(id,it,ctx))}if(!intent||weak)intent='__done'}
 if(intent==='__done')intent=null;
 if(!out.length||intent){
  let key=intent||'fallback';
  if(key==='greet'&&Math.random()<.55)key='greet_'+tod();
  if(key==='morning'&&tod()!=='morning'&&Math.random()<.5)key='greet_'+tod();
  let it=pick(id,key,ctx,mem)||pick(id,'fallback',ctx,mem);
  if(it){let s=render(id,it,ctx);if(!CORE.includes(key)&&!/^(greet|morning)/.test(key)&&Math.random()<.22&&!out.length){const op=pick(id,'open',ctx,mem);if(op&&!s.startsWith(v.n))s=render(id,op,ctx)+s}out.push(s);VO.push(renderV(id,it,ctx))}
  intent=key}
 // 5. 附加：禮物回憶、記憶回想、追問
 const noTail=['unsafe','contact','night','bye','rude','apology','short'].includes(intent);
 const last=out[out.length-1]||'';const asked=/[？?]$/.test(last);
 if(!noTail&&!opt.live){const r=Math.random();
  if(opt.gift&&r<.12){out.push(render(id,{t:rnd(['對了，你送的{g}{me}很喜歡{P}','剛剛的{g}，謝謝你{P}','{g}{me}還記得喔{P}'])},ctx));VO.push(null)}
  else if(r<.24&&(mem.turns||0)-(mem.setAt||0)>3){const it=pick(id,'recall',ctx,mem);if(it){out.push(render(id,it,ctx));VO.push(renderV(id,it,ctx))}}
  else if(!asked&&r<.62&&!['sad','sick','lonely','angry','love','rude','unsafe','contact'].includes(intent)){const it=pick(id,'followup',ctx,mem);if(it){const [tp,q]=it.t.split('|');mem.topic=tp;out.push(render(id,{t:q},ctx));VO.push(renderV(id,{t:q,sh:it.sh},ctx))}}
  if(opt.mood>=2&&!STYLE[id].cool&&Math.random()<.25)out[out.length-1]+=rnd(STYLE[id].E)}
 if(asked&&!mem.topic){const k=Object.keys(TOPIC_SLOT).find(k=>({food:/吃|餓/,work:/工作|上班/,city:/城市|住/,pet:/寵物|養/,hobby:/喜歡做|興趣/})[k].test(last));if(k)mem.topic=k}
 mem.turns=(mem.turns||0)+1;mem.lastIntent=intent;
 return opt.live?out[0]:out.join('|')}
function dm(id,kind,opt,mem){const map={giftS:'dm_gift_s',giftB:'dm_gift_b',after:'dm_after',afterTop:'dm_after_top',followBack:'dm_follow',online:'dm_online',role:'dm_role'};
 if(!ready(id))return null;const ctx={mood:opt.mood,male:opt.male,fp:!!opt.fp,va:opt.va,v:{n:opt.call,g:opt.gift}};const it=pick(id,map[kind]||kind,ctx,mem);window.DLGE.lastV=[it?renderV(id,it,ctx):null];return it?render(id,it,ctx):null}
function stats(){if(!window.DLGB||!DLGB.shared)return null;const c=o=>Object.values(o).reduce((a,b)=>a+b.length,0);const r={shared:c(DLGB.shared)};for(const k in STYLE)if(DLGB[k])r[k]=c(DLGB[k]);return r}
window.DLGE={ensure,ready,reply,dm,stats,STYLE,meta,okLine,renderV,lastV:[]};
})();
