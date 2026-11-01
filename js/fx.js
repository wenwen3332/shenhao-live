'use strict';
/* ====== 粒子引擎 + 大禮物特效 ====== */
const FX=(()=>{
 const cv=document.getElementById('fxCanvas'),cx=cv.getContext('2d');
 const layer=document.getElementById('fxLayer');
 let W=0,H=0,DPR=1;
 function size(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;cx.setTransform(DPR,0,0,DPR,0,0)}
 size();addEventListener('resize',size);
 const R=(a,b)=>a+Math.random()*(b-a),P=a=>a[Math.floor(Math.random()*a.length)];
 // 預渲染精靈
 function sprite(r,stops){const c=document.createElement('canvas');c.width=c.height=r*2;const g=c.getContext('2d');const gr=g.createRadialGradient(r,r,0,r,r,r);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,r*2,r*2);return c}
 const COLORS={rose:'255,40,90',cyan:'90,230,255',gold:'255,200,80',pink:'255,90,160',blue:'90,180,255',purple:'180,110,255',white:'255,255,255',orange:'255,140,40',green:'120,255,160',red:'255,60,60'};
 const GLOW={};for(const k in COLORS){const c=COLORS[k];GLOW[k]=sprite(32,[[0,`rgba(255,255,255,1)`],[.15,`rgba(${c},.95)`],[.45,`rgba(${c},.35)`],[1,`rgba(${c},0)`]])}
 const SMOKE=sprite(64,[[0,'rgba(235,235,240,.55)'],[.5,'rgba(200,200,210,.25)'],[1,'rgba(180,180,190,0)']]);
 const SMOKE_G=sprite(64,[[0,'rgba(255,236,190,.6)'],[.5,'rgba(255,205,120,.25)'],[1,'rgba(255,190,90,0)']]);
 const SMOKE_P=sprite(64,[[0,'rgba(190,140,255,.55)'],[.5,'rgba(120,70,200,.25)'],[1,'rgba(80,40,160,0)']]);
 const SMOKE_D=sprite(64,[[0,'rgba(120,110,110,.5)'],[.6,'rgba(90,80,80,.2)'],[1,'rgba(60,60,60,0)']]);
 const FLAME=sprite(48,[[0,'rgba(255,255,230,1)'],[.25,'rgba(255,210,90,.9)'],[.6,'rgba(255,110,20,.45)'],[1,'rgba(255,40,0,0)']]);
 const coinImg=new Image();coinImg.src='assets/i_coin.webp';
 const petalR=(()=>{const c=document.createElement('canvas');c.width=24;c.height=16;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,24,16);gr.addColorStop(0,'#ff4d6d');gr.addColorStop(1,'#a3001f');g.fillStyle=gr;g.beginPath();g.ellipse(12,8,11,6,0,0,Math.PI*2);g.fill();return c})();
 const petalG=(()=>{const c=document.createElement('canvas');c.width=24;c.height=16;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,24,16);gr.addColorStop(0,'#fff1b8');gr.addColorStop(1,'#f0a020');g.fillStyle=gr;g.beginPath();g.ellipse(12,8,11,6,0,0,Math.PI*2);g.fill();return c})();
 const petal=(()=>{const c=document.createElement('canvas');c.width=24;c.height=16;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,24,16);gr.addColorStop(0,'#ff9ec2');gr.addColorStop(1,'#e8306f');g.fillStyle=gr;g.beginPath();g.ellipse(12,8,11,6,0,0,Math.PI*2);g.fill();return c})();
 const CONF=['#ff3d7f','#ffd76a','#4fc3ff','#b388ff','#7dff9a','#ffffff','#ff9a00'];
 let parts=[],emitters=[],raf=0,last=0,shakeT=0,flashA=0,flashC='255,255,255';
 const MAX=1100;
 function add(p){if(parts.length<MAX)parts.push(p)}
 function loop(now){
  const dt=Math.min(.05,(now-last)/1000||0.016);last=now;
  cx.clearRect(0,0,W,H);
  for(let i=emitters.length-1;i>=0;i--){const e=emitters[i];e.t+=dt;if(e.t>e.dur){emitters.splice(i,1);continue}e.fn(dt,e.t,e)}
  // normal blend first (smoke, confetti, coins, petals)
  for(let pass=0;pass<2;pass++){
   cx.globalCompositeOperation=pass?'lighter':'source-over';
   for(const p of parts){if((p.add?1:0)!==pass)continue;drawP(p)}
  }
  cx.globalCompositeOperation='source-over';cx.globalAlpha=1;
  if(flashA>0){cx.fillStyle=`rgba(${flashC},${flashA})`;cx.fillRect(0,0,W,H);flashA=Math.max(0,flashA-dt*2.2)}
  // update
  let j=0;for(const p of parts){p.life-=dt;if(p.life<=0)continue;
   if(p.type==='shell'){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;add({type:'glow',add:1,x:p.x,y:p.y,vx:R(-10,10),vy:R(10,30),g:20,drag:.96,s:R(4,7),life:.35,max:.35,c:'gold'});if(p.vy>=-20||p.life<0.02){explode(p.x,p.y,p.color,p.n,p.kind);continue}}
   else{p.vx*=p.drag;p.vy*=p.drag;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.rot!==undefined)p.rot+=p.vr*dt;if(p.grow)p.s+=p.grow*dt}
   parts[j++]=p}
  parts.length=j;
  if(shakeT>0){shakeT-=dt;const a=window.SHAKE_OFF?0:Math.min(1,shakeT/.3)*3.5;document.getElementById('app').style.transform=`translate(${R(-a,a)}px,${R(-a,a)}px)`;if(shakeT<=0)document.getElementById('app').style.transform=''}
  if(parts.length||emitters.length||flashA>0||shakeT>0)raf=requestAnimationFrame(loop);else{raf=0;cx.clearRect(0,0,W,H)}
 }
 function drawP(p){
  const a=Math.max(0,Math.min(1,p.life/p.max*(p.fadeIn?Math.min(1,(p.max-p.life)/p.fadeIn):1)));
  cx.globalAlpha=a*(p.alpha||1);
  switch(p.type){
   case 'glow':case 'spark':{const tw=p.tw?(.55+.45*Math.sin(p.life*p.tw)):1;const s=p.s*tw;cx.drawImage(GLOW[p.c]||GLOW.gold,p.x-s,p.y-s,s*2,s*2);break}
   case 'smoke':cx.drawImage(p.dark?SMOKE_D:p.gold?SMOKE_G:p.tint?SMOKE_P:SMOKE,p.x-p.s,p.y-p.s,p.s*2,p.s*2);break;
   case 'flame':cx.drawImage(FLAME,p.x-p.s,p.y-p.s,p.s*2,p.s*2);break;
   case 'conf':{cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.scale(1,Math.cos(p.rot*2.3));cx.fillStyle=p.c;cx.fillRect(-p.s,-p.s*.45,p.s*2,p.s*.9);cx.restore();break}
   case 'coin':{if(!coinImg.complete)break;cx.save();cx.translate(p.x,p.y);cx.scale(Math.cos(p.rot),1);cx.drawImage(coinImg,-p.s,-p.s,p.s*2,p.s*2);cx.restore();break}
   case 'petal':{cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.scale(1,.6+.4*Math.sin(p.rot*3));cx.drawImage(p.red?petalR:p.goldp?petalG:petal,-p.s,-p.s*.66,p.s*2,p.s*1.33);cx.restore();break}
   case 'bolt':{cx.strokeStyle=`rgba(${COLORS[p.c]||COLORS.purple},1)`;cx.shadowColor=`rgba(${COLORS[p.c]||COLORS.purple},1)`;cx.shadowBlur=18;cx.lineWidth=p.w;cx.beginPath();p.pts.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.stroke();cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=p.w*.35;cx.stroke();cx.shadowBlur=0;break}
   case 'streak':{cx.strokeStyle=`rgba(${COLORS[p.c]},1)`;cx.lineWidth=p.w||2;cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx*p.len,p.y-p.vy*p.len);cx.stroke();break}
   case 'flare':{const s=p.s;if(!GLOW[p.c])p.c='gold';cx.drawImage(GLOW[p.c],p.x-s,p.y-s,s*2,s*2);cx.drawImage(GLOW.white,p.x-s*3,p.y-s*.12,s*6,s*.24);cx.drawImage(GLOW[p.c],p.x-s*.15,p.y-s*1.6,s*.3,s*3.2);
     const dx=W/2-p.x,dy=H/2-p.y;[[.6,.25],[1.2,.15],[1.6,.35]].forEach(([k,r])=>{const gs=s*r;cx.globalAlpha=a*.35;cx.drawImage(GLOW.purple,p.x+dx*k-gs,p.y+dy*k-gs,gs*2,gs*2)});break}
  }
 }
 function run(){if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}}
 function emit(dur,fn){emitters.push({t:0,dur,fn});run()}
 /* --- 基本效果 --- */
 function explode(x,y,color,n=80,kind){
  const c=color||P(Object.keys(COLORS));
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+R(-.05,.05),sp=kind==='ring'?220:R(60,280);
   add({type:'spark',add:1,x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:90,drag:.965,s:R(5,9),life:R(1.1,1.8),max:1.8,c,tw:R(10,30)})}
  add({type:'glow',add:1,x,y,vx:0,vy:0,g:0,drag:1,s:120,life:.35,max:.35,c});
  if(window.SFX)SFX.boom();
 }
 function firework(x,y,color,kind){const ty=y??R(H*.12,H*.4),tx=x??R(W*.15,W*.85);const vy=-Math.sqrt(2*260*(H-ty));
  add({type:'shell',x:tx+R(-30,30),y:H,vx:R(-20,20),vy,g:260,life:4,max:4,color:color||P(['gold','pink','blue','purple','green','red','white']),n:Math.floor(R(70,110)),kind});run()}
 function fireworks(n,spanMs,colors){for(let i=0;i<n;i++)setTimeout(()=>firework(null,null,colors?P(colors):null,Math.random()<.25?'ring':null),i*spanMs/n)}
 function confetti(dur=2,rate=12,from='top'){emit(dur,()=>{for(let i=0;i<rate;i++){if(from==='top')add({type:'conf',x:R(0,W),y:-10,vx:R(-30,30),vy:R(80,200),g:40,drag:.995,s:R(4,7),life:R(3,4.5),max:4.5,c:P(CONF),rot:R(0,6),vr:R(-8,8)});else{const l=Math.random()<.5;add({type:'conf',x:l?0:W,y:H*.95,vx:(l?1:-1)*R(150,420),vy:R(-750,-450),g:420,drag:.985,s:R(4,7),life:R(2.5,3.5),max:3.5,c:P(CONF),rot:R(0,6),vr:R(-10,10)})}}})}
 function coins(dur=2,rate=3,x,y){emit(dur,()=>{for(let i=0;i<rate;i++){if(x==null)add({type:'coin',x:R(0,W),y:-30,vx:R(-20,20),vy:R(150,320),g:300,drag:.99,s:R(12,20),life:3,max:3,rot:R(0,6),vr:R(6,14)});else add({type:'coin',x:x+R(-20,20),y:y,vx:R(-260,260),vy:R(-700,-350),g:900,drag:.99,s:R(12,20),life:2.2,max:2.2,rot:R(0,6),vr:R(6,14)})}})}
 function petals(dur=3,rate=2){emit(dur,()=>{for(let i=0;i<rate;i++)add({type:'petal',x:R(-20,W),y:-20,vx:R(20,70),vy:R(60,130),g:10,drag:1,s:R(8,13),life:R(4,6),max:6,rot:R(0,6),vr:R(-3,3)})})}
 function sparkleAround(el,dur,rate=4,c='gold'){emit(dur,()=>{const b=el.getBoundingClientRect();for(let i=0;i<rate;i++)add({type:'spark',add:1,x:R(b.left,b.right),y:R(b.top,b.bottom),vx:R(-15,15),vy:R(-30,5),g:-10,drag:.98,s:R(4,10),life:R(.5,1.2),max:1.2,c:Math.random()<.3?'white':c,tw:R(15,35)})})}
 function burstAt(x,y,c='gold',n=30){for(let i=0;i<n;i++){const a=R(0,6.28),s=R(80,260);add({type:'spark',add:1,x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:120,drag:.95,s:R(4,8),life:R(.6,1.1),max:1.1,c,tw:20})}add({type:'glow',add:1,x,y,vx:0,vy:0,g:0,drag:1,s:90,life:.4,max:.4,c});run()}
 function flash(a=.6,c='255,255,255'){flashA=a;flashC=c;run()}
 function shake(t=.3){if(window.SHAKE_OFF)return;shakeT=Math.min(.35,t);run()}
 /* --- DOM 圖層 --- */
 function img(src,cls,style){const e=document.createElement('img');e.src=src;e.className='fxImg '+(cls||'');e.draggable=false;if(style)Object.assign(e.style,style);layer.appendChild(e);return e}
 function div(cls,style){const e=document.createElement('div');e.className=cls;if(style)Object.assign(e.style,style);layer.appendChild(e);return e}
 function shine(el,src,delay=600){const s=div('fxShine');const sync=()=>{const b=el.getBoundingClientRect();Object.assign(s.style,{left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px',webkitMaskImage:`url(${src})`,maskImage:`url(${src})`})};
  let on=true;const tick=()=>{if(!on)return;sync();requestAnimationFrame(tick)};tick();
  s.animate([{backgroundPosition:'-150% 0'},{backgroundPosition:'250% 0'}],{duration:1100,delay,iterations:2,easing:'ease-in-out'});return ()=>{on=false;s.remove()}}
 function rays(color='255,215,120',dur=4000){const r=div('fxRays');r.style.setProperty('--rc',color);r.animate([{opacity:0,transform:'translate(-50%,-50%) rotate(0deg) scale(.6)'},{opacity:1,offset:.15},{opacity:1,offset:.85},{opacity:0,transform:'translate(-50%,-50%) rotate(70deg) scale(1.1)'}],{duration:dur,easing:'linear',fill:'forwards'});return r}
 function dim(dur){const d=div('fxDim');d.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.88},{opacity:0}],{duration:dur,fill:'forwards'});return d}
 function title(g,who,dur){const t=div('fxTitle');t.innerHTML=`<img src="${g.img}"><div><b></b><small></small></div>`;t.querySelector('b').textContent=g.name;t.querySelector('small').textContent=`${who} 送出 · ${g.price.toLocaleString()} 金幣`;
  t.animate([{transform:'translate(-50%,-30px) scale(.7)',opacity:0},{transform:'translate(-50%,0) scale(1.05)',opacity:1,offset:.08},{transform:'translate(-50%,0) scale(1)',opacity:1,offset:.12},{opacity:1,offset:.88},{opacity:0,transform:'translate(-50%,-10px) scale(.95)'}],{duration:dur,fill:'forwards'})}
 // 追蹤元素上某點（比例座標）
 const at=(el,fx,fy)=>{const b=el.getBoundingClientRect();return [b.left+b.width*fx,b.top+b.height*fy]};

 // 圖片缺失時以 emoji 代替
 function imgOr(src,emo,cls,style){const key=(src.match(/assets\/([^.\/]+)\.webp/)||[])[1];const e=(window.HAVE||{})[key]?img(src,cls,style):(()=>{const x=document.createElement('img');layer.appendChild(x);setTimeout(()=>x.onerror&&x.onerror(),0);return x})();e.onerror=()=>{const d=document.createElement('div');d.className='fxImg fxEmo '+(cls||'');Object.assign(d.style,style||{});d.textContent=emo;const w=parseFloat((style||{}).width)||40;d.style.fontSize=(style&&style.width&&style.width.endsWith('vw')?w*0.8+'vw':'40vw');d.getAnimations&&e.getAnimations().forEach(a=>{try{d.animate(a.effect.getKeyframes(),{duration:a.effect.getTiming().duration,fill:'forwards',delay:-a.currentTime||0})}catch(_){}});e.replaceWith(d)};return e}
 function clouds(dur,rate,gold){emit(dur,()=>{for(let i=0;i<rate;i++){const left=Math.random()<.5;add({type:'smoke',x:left?R(-40,W*.3):R(W*.7,W+40),y:R(H*.55,H*1.02),vx:(left?1:-1)*R(20,70),vy:R(-30,-6),g:-4,drag:.985,s:R(40,70),grow:30,life:R(2,3),max:3,light:1,gold})}})}
 function entTitle(name,who,dur,src,color){const t=div('fxTitle ent');t.style.setProperty('--ec',color||'#ffd36b');t.innerHTML=`${HAVE[(src||'').slice(7,-5)]?`<img src="${src}">`:''}<div><b></b><small></small></div>`;t.querySelector('b').textContent=name;t.querySelector('small').textContent=who+' 駕到';
  t.animate([{transform:'translate(-50%,-30px) scale(.7)',opacity:0},{transform:'translate(-50%,0) scale(1.05)',opacity:1,offset:.08},{transform:'translate(-50%,0) scale(1)',opacity:1,offset:.12},{opacity:1,offset:.88},{opacity:0}],{duration:dur,fill:'forwards'})}

 /* ---- 程序化中國龍（生成圖片缺失時使用） ---- */
 const IMGOK={};['g_dragon','g_rider','e_rose','e_guard','e_mystery','e_reborn'].forEach(k=>{if(!(window.HAVE||{})[k])return;const i=new Image();i.onload=()=>IMGOK[k]=i.naturalWidth>0;i.onerror=()=>IMGOK[k]=false;i.src='assets/'+k+'.webp'});
 const PAL={gold:{hi:'#fff4c2',mid:'#f5b62a',lo:'#8a4b05',belly:'#ffe6a0',spike:'#ff6a1a',mane:'#fff8e8',eye:'#ff3b1f',glow:'gold'},
            jade:{hi:'#e6fff4',mid:'#2fbf86',lo:'#0b4a35',belly:'#d8f5e6',spike:'#c9d6d1',mane:'#f2fffb',eye:'#ffe14a',glow:'green'}};
 const scaleSpr={};function scaleSprite(pk){if(scaleSpr[pk])return scaleSpr[pk];const P=PAL[pk],c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');
  const gr=g.createRadialGradient(36,34,4,48,48,48);gr.addColorStop(0,P.hi);gr.addColorStop(.45,P.mid);gr.addColorStop(1,P.lo);g.fillStyle=gr;g.beginPath();g.arc(48,48,47,0,7);g.fill();
  g.globalAlpha=.55;g.strokeStyle=P.lo;g.lineWidth=2.2;for(let r=0;r<4;r++)for(let k=-3;k<=3;k++){const x=48+k*14+(r%2)*7,y=22+r*16;g.beginPath();g.arc(x,y,9,Math.PI*.1,Math.PI*.9);g.stroke()}
  g.globalAlpha=.8;g.strokeStyle=P.hi;g.lineWidth=1.2;for(let r=0;r<4;r++)for(let k=-3;k<=3;k++){const x=48+k*14+(r%2)*7,y=20+r*16;g.beginPath();g.arc(x,y,8,Math.PI*.25,Math.PI*.6);g.stroke()}
  g.globalCompositeOperation='destination-in';g.globalAlpha=1;g.beginPath();g.arc(48,48,47,0,7);g.fill();return scaleSpr[pk]=c}
 function procDragon(dur,path,pk,o={}){const P=PAL[pk],spr=scaleSprite(pk),base=Math.min(W,H*.6)*(o.size||.075),N=74,gap=base*.5;const hist=[];let head={x:0,y:0,a:0},mouth=0;
  const st={head:()=>head,mouthPos:()=>[head.x+Math.cos(head.a)*base*2.6,head.y+Math.sin(head.a)*base*2.6+base*.3],breath:v=>mouth=v};
  emit(dur,(dt,t)=>{const u=Math.min(1,t/dur);const [x,y]=path(u);if(!hist.length||Math.hypot(x-hist[0].x,y-hist[0].y)>1.5)hist.unshift({x,y});if(hist.length>3000)hist.pop();
   const pts=[];let acc=0,j=0;pts.push(hist[0]);for(let i=1;i<hist.length&&pts.length<N;i++){acc+=Math.hypot(hist[i].x-hist[i-1].x,hist[i].y-hist[i-1].y);if(acc>=gap){pts.push(hist[i]);acc=0}}
   while(pts.length<N)pts.push({x:pts[pts.length-1].x-gap*.01,y:pts[pts.length-1].y});
   const ang=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];return Math.atan2(a.y-b.y,a.x-b.x)};
   head={x:pts[0].x,y:pts[0].y,a:ang(0)};
   cx.save();cx.globalCompositeOperation='source-over';
   const rad=i=>base*(i<4?.75+i*.08:1.05-Math.pow(i/N,1.25)*.82)*(1+.04*Math.sin(i*.7-t*6));
   // 尾巴鬃毛
   const tl=pts[N-1],ta=ang(N-1);cx.strokeStyle=P.mane;cx.lineCap='round';for(let k=0;k<9;k++){cx.globalAlpha=.75;cx.lineWidth=base*.12;cx.beginPath();cx.moveTo(tl.x,tl.y);const L=base*(1.8+k%3*.4),aa=ta+Math.PI+(k-4)*.16+Math.sin(t*5+k)*.15;cx.quadraticCurveTo(tl.x+Math.cos(aa)*L*.5+Math.sin(t*4+k)*base*.3,tl.y+Math.sin(aa)*L*.5,tl.x+Math.cos(aa)*L,tl.y+Math.sin(aa)*L);cx.stroke()}cx.globalAlpha=1;
   // 腿（身後）
   const leg=(i,side)=>{const p0=pts[i],a=ang(i),n=a+side*Math.PI/2,sw=Math.sin(t*7+i)*.5,r=rad(i);const k1={x:p0.x+Math.cos(n+sw*.4)*r*1.5,y:p0.y+Math.sin(n+sw*.4)*r*1.5};const k2={x:k1.x+Math.cos(n-.8+sw)*r*1.2,y:k1.y+Math.sin(n-.8+sw)*r*1.2};
    cx.strokeStyle=P.mid;cx.lineWidth=r*.55;cx.beginPath();cx.moveTo(p0.x,p0.y);cx.lineTo(k1.x,k1.y);cx.lineTo(k2.x,k2.y);cx.stroke();cx.strokeStyle=P.lo;cx.lineWidth=r*.14;for(let c=-1;c<=1;c++){cx.beginPath();cx.moveTo(k2.x,k2.y);const ca=n-.8+sw+c*.45;cx.quadraticCurveTo(k2.x+Math.cos(ca)*r*.5,k2.y+Math.sin(ca)*r*.5,k2.x+Math.cos(ca+.5)*r*.7,k2.y+Math.sin(ca+.5)*r*.7);cx.stroke()}};
   [10,36].forEach(i=>leg(i,1));
   // 身體
   for(let i=N-1;i>=1;i--){const p=pts[i],r=rad(i);if(i%2===0){const a=ang(i)-Math.PI/2,sl=r*(.9+.25*Math.sin(i));cx.fillStyle=P.spike;cx.beginPath();cx.moveTo(p.x+Math.cos(a)*r*.7+Math.cos(a+1.6)*r*.35,p.y+Math.sin(a)*r*.7+Math.sin(a+1.6)*r*.35);cx.lineTo(p.x+Math.cos(a-.25)*(r+sl),p.y+Math.sin(a-.25)*(r+sl));cx.lineTo(p.x+Math.cos(a)*r*.7-Math.cos(a+1.6)*r*.35,p.y+Math.sin(a)*r*.7-Math.sin(a+1.6)*r*.35);cx.fill()}
    cx.drawImage(spr,p.x-r,p.y-r,r*2,r*2);if(i%3===0){const a=ang(i)+Math.PI/2;cx.fillStyle=P.belly;cx.globalAlpha=.55;cx.beginPath();cx.ellipse(p.x+Math.cos(a)*r*.55,p.y+Math.sin(a)*r*.55,r*.45,r*.28,ang(i),0,7);cx.fill();cx.globalAlpha=1}}
   [6,32].forEach(i=>leg(i,1));
   // 頭
   const h=pts[0],a=head.a,sc=base*1.45;cx.translate(h.x,h.y);cx.rotate(a);if(Math.cos(a)<0)cx.scale(1,-1);
   // 鬃毛
   cx.strokeStyle=P.mane;cx.lineCap='round';for(let k=0;k<12;k++){cx.globalAlpha=.85;cx.lineWidth=sc*.13;cx.beginPath();const sy=(k-5.5)*sc*.14;cx.moveTo(-sc*.2,sy);cx.bezierCurveTo(-sc*1,sy-sc*.6+Math.sin(t*6+k)*sc*.25,-sc*1.6,sy+Math.sin(t*5+k)*sc*.4,-sc*(2.2+k%3*.3),sy*1.6+Math.sin(t*4+k)*sc*.5);cx.stroke()}cx.globalAlpha=1;
   // 角
   cx.strokeStyle=P.hi;cx.lineWidth=sc*.16;[[-.55,0],[-.35,.25]].forEach(([y0,dx])=>{cx.beginPath();cx.moveTo(sc*(.2+dx),sc*y0);cx.quadraticCurveTo(-sc*.6,sc*(y0-1.1),-sc*1.4,sc*(y0-1.3));cx.stroke();cx.beginPath();cx.moveTo(-sc*.5,sc*(y0-.75));cx.lineTo(-sc*.2,sc*(y0-1.35));cx.stroke()});
   // 下顎
   const mo=.12+mouth*.5+.05*Math.sin(t*8);cx.fillStyle=P.lo;cx.beginPath();cx.moveTo(-sc*.3,sc*.2);cx.quadraticCurveTo(sc*1.2,sc*(.35+mo),sc*2.3,sc*(.25+mo*1.2));cx.lineTo(sc*2.1,sc*(.1+mo*.4));cx.quadraticCurveTo(sc*1,sc*.15,-sc*.2,sc*.05);cx.fill();
   cx.fillStyle='#ffd0c0';for(let k=0;k<5;k++){cx.beginPath();cx.moveTo(sc*(.7+k*.32),sc*(.12+mo*.5));cx.lineTo(sc*(.8+k*.32),sc*(.28+mo*.6));cx.lineTo(sc*(.9+k*.32),sc*(.12+mo*.5));cx.fill()}
   // 上顎＋頭骨
   const hg=cx.createLinearGradient(0,-sc*.8,0,sc*.4);hg.addColorStop(0,P.hi);hg.addColorStop(.5,P.mid);hg.addColorStop(1,P.lo);cx.fillStyle=hg;
   cx.beginPath();cx.moveTo(-sc*.6,sc*.15);cx.quadraticCurveTo(-sc*.5,-sc*.85,sc*.5,-sc*.65);cx.quadraticCurveTo(sc*1.4,-sc*.45,sc*2.5,-sc*.1);cx.quadraticCurveTo(sc*2.7,sc*.05,sc*2.45,sc*.15);cx.quadraticCurveTo(sc*1.2,sc*.18,-sc*.6,sc*.15);cx.fill();
   cx.strokeStyle=P.lo;cx.lineWidth=sc*.05;cx.beginPath();cx.moveTo(sc*.4,-sc*.62);cx.quadraticCurveTo(sc*.9,-sc*.9,sc*1.2,-sc*.5);cx.stroke();
   // 鼻孔、眼睛
   cx.fillStyle=P.lo;cx.beginPath();cx.ellipse(sc*2.25,-sc*.12,sc*.1,sc*.06,0,0,7);cx.fill();
   const eg=cx.createRadialGradient(sc*.75,-sc*.38,0,sc*.75,-sc*.38,sc*.28);eg.addColorStop(0,'#fff');eg.addColorStop(.4,P.eye);eg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=eg;cx.beginPath();cx.arc(sc*.75,-sc*.38,sc*.28,0,7);cx.fill();
   cx.fillStyle='#200';cx.beginPath();cx.ellipse(sc*.78,-sc*.38,sc*.04,sc*.11,0,0,7);cx.fill();
   // 鬍鬚
   cx.strokeStyle=P.mane;cx.lineWidth=sc*.06;[[-1,0],[1,1.3]].forEach(([d,ph])=>{cx.beginPath();cx.moveTo(sc*2.2,-sc*.05);cx.bezierCurveTo(sc*2.8,sc*(.2*d)+Math.sin(t*5+ph)*sc*.5,sc*1.6,sc*(1.2+.3*d)+Math.sin(t*4+ph)*sc*.6,sc*(.4+Math.sin(t*3+ph)*.4),sc*(2+.3*d));cx.stroke()});
   // 鬍子
   cx.lineWidth=sc*.08;for(let k=0;k<5;k++){cx.beginPath();cx.moveTo(sc*(.4+k*.2),sc*(.3+mo));cx.quadraticCurveTo(sc*(.2+k*.2),sc*(.9+mo),sc*(-.1+k*.18)+Math.sin(t*5+k)*sc*.15,sc*(1.2+mo));cx.stroke()}
   cx.restore();
   // 光暈＋龍珠
   if(Math.random()<.9)add({type:'glow',add:1,x:h.x,y:h.y,vx:0,vy:0,g:0,drag:1,s:base*2.4,life:.05,max:.05,c:P.glow});
   if(o.pearl!==false){const px=h.x+Math.cos(a)*base*4.2,py=h.y+Math.sin(a)*base*4.2+Math.sin(t*3)*base*.4;add({type:'glow',add:1,x:px,y:py,vx:0,vy:0,g:0,drag:1,s:base*1.3,life:.05,max:.05,c:'white'});add({type:'glow',add:1,x:px,y:py,vx:0,vy:0,g:0,drag:1,s:base*2.2,life:.05,max:.05,c:P.glow})}
  });return st}
 /* --- 各禮物特效 --- 回傳時長 ms */
 const BIG={
  dragon(g){if(IMGOK.g_dragon)return BIG._dragonImg(g);dim(7600);rays('255,200,80',7400);clouds(7,1,1);if(window.SFX)SFX.roar(0.2);
   const D=procDragon(7.2,u=>[-W*.45+u*W*1.9,H*(.92-.8*u)+Math.sin(u*Math.PI*3.2)*H*.16],'gold',{size:.085});
   emit(7.2,(dt,t)=>{if(t>2.1&&t<4.6){D.breath(1);const h=D.head(),[mx,my]=D.mouthPos();for(let i=0;i<10;i++)add({type:'flame',add:1,x:mx,y:my,vx:Math.cos(h.a)*R(380,720)+R(-60,60),vy:Math.sin(h.a)*R(380,720)+R(-90,90),g:-20,drag:.93,s:R(18,34),life:R(.35,.6),max:.6});shakeT=window.SHAKE_OFF?0:Math.max(shakeT,.12)}else D.breath(0);
    if(t>1&&Math.random()<.3)add({type:'coin',x:R(0,W),y:-20,vx:R(-30,30),vy:R(120,260),g:300,drag:.99,s:R(10,16),rot:R(0,6),vr:R(-8,8),life:3,max:3})});
   setTimeout(()=>{if(window.SFX)SFX.roar(0)},2100);setTimeout(()=>{flash(.5,'255,220,140');shake(.9)},2200);
   setTimeout(()=>fireworks(9,2200,['gold','red','white']),4800);setTimeout(()=>coins(2,6),5200);return 7600},
  _dragonImg(g){dim(7600);rays('255,200,80',7400);clouds(7,2,1);if(window.SFX)SFX.roar(0.2);
   const e=imgOr('assets/g_dragon.webp','🐉','dragonImg',{width:'150vw',left:'-25vw',top:'34%'});
   e.animate([{transform:'translate(-120vw,40vh) rotate(-18deg) scale(.6)'},{transform:'translate(-10vw,6vh) rotate(-8deg) scale(.9)',offset:.22,easing:'ease-out'},{transform:'translate(8vw,-6vh) rotate(4deg) scale(1)',offset:.42},{transform:'translate(-4vw,-2vh) rotate(-3deg) scale(1.02)',offset:.6},{transform:'translate(10vw,-10vh) rotate(2deg) scale(1.05)',offset:.74},{transform:'translate(130vw,-70vh) rotate(-22deg) scale(1.2)',easing:'ease-in'}],{duration:7200,fill:'forwards'});
   e.animate([{filter:'drop-shadow(0 0 10px rgba(255,190,60,.6)) brightness(1)'},{filter:'drop-shadow(0 0 30px rgba(255,200,80,.95)) brightness(1.25)'},{filter:'drop-shadow(0 0 10px rgba(255,190,60,.6)) brightness(1)'}],{duration:900,iterations:8});
   const stop=shine(e,'assets/g_dragon.webp',1600);
   emit(7,(dt,t)=>{const [hx,hy]=at(e,.86,.36);const [bx,by]=at(e,.45,.55);const [px,py]=at(e,.82,.78);
    if(Math.random()<.6)add({type:'spark',add:1,x:bx+R(-120,120),y:by+R(-40,40),vx:R(-60,60),vy:R(-60,60),g:30,drag:.96,s:R(2,4),life:R(.6,1.1),max:1.1,c:'gold'});
    add({type:'glow',add:1,x:px,y:py,vx:0,vy:0,g:0,drag:1,s:R(36,50),life:.08,max:.08,c:'gold'});
    if(t>2.1&&t<4.4){for(let i=0;i<9;i++)add({type:'flame',add:1,x:hx,y:hy,vx:R(380,720),vy:R(-90,90),g:-20,drag:.93,s:R(18,34),life:R(.35,.6),max:.6});shakeT=window.SHAKE_OFF?0:Math.max(shakeT,.12)}
    if(t>1&&Math.random()<.3)add({type:'coin',x:R(0,W),y:-20,vx:R(-30,30),vy:R(120,260),g:300,drag:.99,s:R(10,16),rot:R(0,6),vr:R(-8,8),life:3,max:3})});
   setTimeout(()=>{if(window.SFX)SFX.roar(0)},2100);setTimeout(()=>{flash(.5,'255,220,140');shake(.9)},2200);
   setTimeout(()=>fireworks(9,2200,['gold','red','white']),4800);setTimeout(()=>coins(2,6),5200);setTimeout(stop,7000);return 7600},
  rider(g){if(IMGOK.g_rider)return BIG._riderImg(g);dim(6200);clouds(5.8,1,0);if(window.SFX)SFX.roar(0.1);
   const D=procDragon(5.8,u=>[W*1.4-u*W*1.9,H*(.42+.12*Math.sin(u*Math.PI*2.6))],'jade',{size:.075});
   emit(5.8,(dt,t)=>{const h=D.head();for(let i=0;i<2;i++)add({type:'smoke',x:h.x+R(60,200),y:h.y+R(-40,40),vx:R(80,200),vy:R(-20,20),g:0,drag:.97,s:R(22,40),grow:50,life:R(1,1.8),max:1.8,light:1});
    if(Math.random()<.6)add({type:'spark',add:1,x:h.x+R(0,300),y:h.y+R(-80,80),vx:R(-40,40),vy:R(-40,40),g:10,drag:.96,s:R(2,3.5),life:.9,max:.9,c:'green'});
    if(t>1.8&&t<3.4&&Math.random()<.5){const [mx,my]=D.mouthPos();add({type:'flare',add:1,x:mx,y:my,vx:0,vy:0,g:0,drag:1,s:R(30,60),life:.1,max:.1,c:'white'})}});
   setTimeout(()=>{flash(.35,'200,255,230');shake(.5)},1700);setTimeout(()=>fireworks(5,1500,['green','white','gold']),3800);return 6200},
  _riderImg(g){dim(6200);clouds(5.8,2,0);if(window.SFX)SFX.roar(0.1);
   const e=imgOr('assets/g_rider.webp','🐲','riderImg',{width:'135vw',left:'-10vw',top:'30%'});
   e.animate([{transform:'translate(110vw,25vh) rotate(10deg) scale(.7)'},{transform:'translate(0,0) rotate(0) scale(1)',offset:.3,easing:'cubic-bezier(.2,.8,.3,1)'},{transform:'translate(-3vw,-2vh) rotate(-2deg) scale(1.02)',offset:.55},{transform:'translate(2vw,-1vh) rotate(1deg)',offset:.72},{transform:'translate(-140vw,-45vh) rotate(14deg) scale(1.15)',easing:'ease-in'}],{duration:5800,fill:'forwards'});
   const stop=shine(e,'assets/g_rider.webp',1500);
   emit(5.6,(dt,t)=>{const [sx,sy]=at(e,.88,.06);const [tx,ty]=at(e,.95,.7);
    if(t>1.6&&t<3.6&&Math.random()<.7)add({type:'flare',add:1,x:sx,y:sy,vx:0,vy:0,g:0,drag:1,s:R(30,60),life:.1,max:.1,c:'white'});
    for(let i=0;i<2;i++)add({type:'smoke',x:tx+R(-30,30),y:ty+R(-20,20),vx:R(80,200),vy:R(-20,20),g:0,drag:.97,s:R(22,40),grow:50,life:R(1,1.8),max:1.8,light:1});
    if(Math.random()<.5)add({type:'spark',add:1,x:tx+R(-200,0),y:ty+R(-80,40),vx:R(-40,40),vy:R(-40,40),g:10,drag:.96,s:R(2,3.5),life:.9,max:.9,c:'green'})});
   setTimeout(()=>{flash(.35,'200,255,230');shake(.5)},1700);setTimeout(()=>fireworks(5,1500,['green','white','gold']),3800);setTimeout(stop,5600);return 6200},
  rosed(g){dim(4600);rays('255,90,120',4400);petals(4,5);
   const e=imgOr('assets/e_rose.webp','🌹','',{width:'70vw',left:'15vw',top:'24%'});
   e.animate([{transform:'scale(0) rotate(-30deg)',opacity:0},{transform:'scale(1.12) rotate(3deg)',opacity:1,offset:.18,easing:'ease-out'},{transform:'scale(1)',offset:.28},{transform:'scale(1.04) translateY(-6px)',offset:.65},{transform:'scale(1)',opacity:1,offset:.85},{transform:'scale(1.4)',opacity:0}],{duration:4400,fill:'forwards'});
   const stop=HAVE.e_rose?shine(e,'assets/e_rose.webp',900):()=>{};
   setTimeout(()=>{const [x,y]=at(e,.5,.5);burstAt(x,y,'pink',60);explode(x,y,'gold',60)},700);
   emit(4,()=>{const [x,y]=at(e,.5,.55);if(Math.random()<.5)add({type:'spark',add:1,x:x+R(-W*.35,W*.35),y:y+R(-W*.3,W*.3),vx:0,vy:R(-30,-10),g:0,drag:1,s:R(2,4),life:.8,max:.8,c:'gold'})});
   setTimeout(stop,4200);return 4600},
  role(g){const C={guardian:['assets/e_guard.webp','🛡️','255,210,90','gold'],mystery:['assets/e_mystery.webp','🎭','170,110,255','purple'],reborn:['assets/e_reborn.webp','🔥','255,120,50','orange']}[g.role];
   dim(3400);rays(C[2],3200);const e=imgOr(C[0],C[1],'',{width:'52vw',left:'24vw',top:'28%'});
   e.animate([{transform:'scale(.2)',opacity:0},{transform:'scale(1.15)',opacity:1,offset:.2},{transform:'scale(1)',offset:.3},{transform:'scale(1)',opacity:1,offset:.8},{transform:'scale(1.3)',opacity:0}],{duration:3200,fill:'forwards'});
   const stop=HAVE[C[0].slice(7,-5)]?shine(e,C[0],700):()=>{};setTimeout(()=>{const [x,y]=at(e,.5,.5);explode(x,y,C[3],70)},600);
   if(g.role==='reborn')emit(3,()=>{const [x,y]=at(e,.5,.8);for(let i=0;i<4;i++)add({type:'flame',add:1,x:x+R(-60,60),y,vx:R(-40,40),vy:R(-300,-160),g:0,drag:.94,s:R(16,28),life:R(.3,.6),max:.6})});
   if(g.role==='mystery')emit(3,()=>{const [x,y]=at(e,.5,.6);add({type:'smoke',x:x+R(-120,120),y:y+R(-40,60),vx:R(-30,30),vy:R(-20,0),g:0,drag:.98,s:R(30,50),grow:40,life:1.6,max:1.6,tint:'purple'})});
   if(g.role==='guardian')sparkleAround(e,3000,6,'gold');
   setTimeout(stop,3000);return 3400},

  /* ===== 尊貴身份專屬禮物 ===== */
  _big(src,emo,style,kf,dur){const e=imgOr(src,emo,'exGift',style);e.animate(kf,{duration:dur,fill:'forwards'});return e},
  rosepact(g){dim(5800);rays('255,70,120',5600);
   const e=BIG._big('assets/g_rosepact.webp','💝',{width:'66vw',left:'17vw',top:'26%'},[{transform:'scale(0) rotate(-20deg)',opacity:0},{transform:'scale(1.12)',opacity:1,offset:.2,easing:'ease-out'},{transform:'scale(1)',offset:.3},{transform:'scale(1.06)',offset:.5},{transform:'scale(1)',offset:.7},{transform:'scale(1.35)',opacity:0}],5600);
   const stop=shine(e,'assets/g_rosepact.webp',1000);
   // 花瓣風暴向心匯聚
   emit(2.2,()=>{for(let i=0;i<6;i++){const a=R(0,6.28),r=Math.max(W,H)*.7,cx0=W/2,cy0=H*.42;add({type:'petal',red:Math.random()<.6,x:cx0+Math.cos(a)*r,y:cy0+Math.sin(a)*r,vx:-Math.cos(a)*R(260,420),vy:-Math.sin(a)*R(260,420),g:0,drag:.985,s:R(8,14),life:1.6,max:1.6,rot:R(0,6),vr:R(-6,6)})}});
   setTimeout(()=>{const [x,y]=at(e,.5,.45);burstAt(x,y,'rose',70);explode(x,y,'pink',90);
    for(let i=0;i<60;i++){const t=i/60*6.283,hx=16*Math.pow(Math.sin(t),3),hy=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));add({type:'spark',add:1,x,y,vx:hx*16,vy:hy*16,g:0,drag:.93,s:R(5,8),life:1.6,max:1.6,c:'pink',tw:20})}},1500);
   setTimeout(()=>{emit(3,()=>{for(let i=0;i<4;i++)add({type:'petal',red:Math.random()<.5,x:R(-20,W),y:-20,vx:R(-40,80),vy:R(90,180),g:12,drag:1,s:R(8,14),life:R(3,5),max:5,rot:R(0,6),vr:R(-4,4)})});fireworks(5,2000,['pink','rose','gold'])},2200);
   setTimeout(stop,5400);return 6000},
  dawn(g){const d=div('fxDawn');d.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.85},{opacity:0}],{duration:5200,fill:'forwards'});rays('255,210,120',5000);
   const e=BIG._big('assets/g_dawnduke.webp','🌅',{width:'58vw',left:'21vw',top:'30%'},[{transform:'translateY(60vh) scale(.7)',opacity:0},{transform:'translateY(0) scale(1.05)',opacity:1,offset:.35,easing:'cubic-bezier(.2,.8,.3,1)'},{transform:'translateY(-1vh) scale(1)',offset:.6},{transform:'scale(1)',opacity:1,offset:.85},{transform:'translateY(-8vh) scale(1.2)',opacity:0}],5000);
   const stop=shine(e,'assets/g_dawnduke.webp',1400);
   emit(4.6,(dt,t)=>{const [x,y]=at(e,.5,.5);if(Math.random()<.7)add({type:'spark',add:1,x:x+R(-W*.4,W*.4),y:y+R(-60,H*.3),vx:0,vy:R(-80,-30),g:0,drag:1,s:R(2,5),life:1,max:1,c:'gold',tw:20});if(t>1.6&&Math.random()<.5)add({type:'petal',goldp:1,x:R(0,W),y:-20,vx:R(-30,60),vy:R(80,150),g:8,drag:1,s:R(7,12),life:4,max:4,rot:R(0,6),vr:R(-3,3)})});
   setTimeout(()=>{const [x,y]=at(e,.5,.5);explode(x,y,'gold',80);flash(.3,'255,230,160')},1800);setTimeout(stop,4800);return 5300},
  nebula(g){dim(5600);
   emit(5.2,(dt,t)=>{if(Math.random()<.5)add({type:'smoke',x:R(0,W),y:R(H*.15,H*.75),vx:R(-15,15),vy:R(-10,10),g:0,drag:1,s:R(60,110),grow:12,life:2.2,max:2.2,tint:1,alpha:.7,fadeIn:.8});for(let i=0;i<2;i++)add({type:'spark',add:1,x:R(0,W),y:R(0,H*.85),vx:0,vy:0,g:0,drag:1,s:R(1.5,3.5),life:R(.8,1.6),max:1.6,c:Math.random()<.5?'white':'purple',tw:R(10,30)})});
   const e=BIG._big('assets/g_nebuladuke.webp','🔮',{width:'56vw',left:'22vw',top:'27%'},[{transform:'scale(.1) rotate(-90deg)',opacity:0},{transform:'scale(1.08) rotate(5deg)',opacity:1,offset:.3,easing:'ease-out'},{transform:'scale(1) rotate(0)',offset:.4},{transform:'scale(1.04)',offset:.7},{transform:'scale(1)',opacity:1,offset:.86},{transform:'scale(.2) rotate(60deg)',opacity:0}],5400);
   const stop=shine(e,'assets/g_nebuladuke.webp',1300);
   emit(4.8,(dt,t)=>{const [x,y]=at(e,.5,.55);for(let i=0;i<3;i++){const a=t*3+i*2.09,r=W*.34;add({type:'glow',add:1,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.4,vx:0,vy:0,g:0,drag:1,s:R(6,10),life:.4,max:.4,c:i%2?'pink':'purple'})}});
   setTimeout(()=>{const [x,y]=at(e,.5,.55);burstAt(x,y,'purple',60);fireworks(4,1600,['purple','pink','white'])},1900);setTimeout(stop,5200);return 5700},
  roseisle(g){rays('255,170,210',6400);const glow=div('fxGlowPink');glow.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.85},{opacity:0}],{duration:6600,fill:'forwards'});
   const e=BIG._big('assets/g_roseisle.webp','🏝️',{width:'72vw',left:'14vw',top:'16%'},[{transform:'translateY(70vh) scale(.6)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1,offset:.3,easing:'cubic-bezier(.2,.9,.3,1.05)'},{transform:'translateY(-2vh)',offset:.5},{transform:'translateY(0)',offset:.7},{transform:'translateY(-1vh)',opacity:1,offset:.88},{transform:'translateY(-30vh) scale(.8)',opacity:0}],6400);
   const stop=shine(e,'assets/g_roseisle.webp',1500);
   emit(6,(dt,t)=>{const [x,y]=at(e,.5,.92);for(let i=0;i<2;i++)add({type:'petal',red:Math.random()<.3,x:x+R(-W*.25,W*.25),y,vx:R(-20,20),vy:R(60,160),g:30,drag:.99,s:R(6,11),life:2.5,max:2.5,rot:R(0,6),vr:R(-4,4)});if(Math.random()<.4)add({type:'spark',add:1,x:R(0,W),y:R(H*.1,H*.6),vx:0,vy:R(-20,0),g:0,drag:1,s:R(2,4),life:1,max:1,c:'pink',tw:20})});
   setTimeout(()=>{if(!HAVE.g_carriage)return;const c=img('assets/g_carriage.webp','',{width:'90vw',left:'5vw',top:'56%'});c.animate([{transform:'translateX(110vw)'},{transform:'translateX(0)',offset:.45,easing:'ease-out'},{transform:'translateX(-2vw) translateY(-4px)',offset:.6},{transform:'translateX(-120vw)'}],{duration:3400,easing:'ease-in-out',fill:'forwards'});emit(3.2,()=>{const [x,y]=at(c,.95,.7);for(let i=0;i<3;i++)add({type:'petal',red:Math.random()<.5,x:x+R(-10,30),y:y+R(-40,30),vx:R(60,200),vy:R(-30,30),g:20,drag:.98,s:R(7,12),life:1.8,max:1.8,rot:R(0,6),vr:R(-6,6)})})},2400);
   setTimeout(()=>fireworks(5,2000,['pink','gold','white']),1800);setTimeout(stop,6200);return 6700},
  rosepalace(g){dim(6600);rays('255,150,200',6400);
   const e=BIG._big('assets/g_rosepalace.webp','🏰',{width:'80vw',left:'10vw',top:'20%'},[{transform:'translateY(60vh) scale(.6)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1,offset:.32,easing:'cubic-bezier(.2,.9,.3,1.1)'},{transform:'translateY(-4px) scale(1.02)',offset:.6},{transform:'scale(1)',opacity:1,offset:.88},{transform:'scale(1.25)',opacity:0}],6400);
   const stop=shine(e,'assets/g_rosepalace.webp',1600);
   if(HAVE.e_rose)setTimeout(()=>{const c=img('assets/e_rose.webp','',{width:'34vw',left:'33vw',top:'8%'});c.animate([{transform:'scale(0)',opacity:0},{transform:'scale(1.1)',opacity:1,offset:.25},{transform:'scale(1)',offset:.35},{transform:'scale(1)',opacity:1,offset:.85},{opacity:0}],{duration:3800,fill:'forwards'});const st2=shine(c,'assets/e_rose.webp',600);setTimeout(st2,3600)},1900);
   emit(6,(dt,t)=>{if(t>1)for(let i=0;i<3;i++)add({type:'petal',red:Math.random()<.4,x:R(-20,W),y:-20,vx:R(-30,70),vy:R(80,160),g:10,drag:1,s:R(8,13),life:R(3.5,5),max:5,rot:R(0,6),vr:R(-3,3)})});
   setTimeout(()=>{flash(.3,'255,200,230');fireworks(9,3000,['pink','gold','rose','white']);confetti(1.4,6)},2000);setTimeout(stop,6200);return 6800},
  rosestar(g){dim(7000);
   emit(6.6,(dt,t)=>{for(let i=0;i<6;i++){const a=R(0,6.28),sp=R(250,700);add({type:'streak',add:1,x:W/2+Math.cos(a)*20,y:H*.42+Math.sin(a)*20,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:0,drag:1.03,len:.05,w:R(1,2),life:.7,max:.7,c:Math.random()<.6?'white':'purple'})}
    for(let k=0;k<2;k++)for(let i=0;i<4;i++){const arm=i%2,a=t*1.6+arm*Math.PI+R(-.2,.2),r=R(20,W*.55);add({type:'petal',red:arm===0,x:W/2+Math.cos(a+r/90)*r,y:H*.42+Math.sin(a+r/90)*r*.55,vx:-Math.sin(a)*60,vy:Math.cos(a)*30,g:0,drag:.98,s:R(5,10),life:.9,max:.9,rot:R(0,6),vr:R(-6,6)})}});
   const e=BIG._big('assets/g_rosestar.webp','🌹',{width:'62vw',left:'19vw',top:'25%'},[{transform:'scale(0) rotate(-180deg)',opacity:0},{transform:'scale(1.1) rotate(8deg)',opacity:1,offset:.3,easing:'ease-out'},{transform:'scale(1) rotate(0)',offset:.4},{transform:'scale(1.05) rotate(-3deg)',offset:.65},{transform:'scale(1)',opacity:1,offset:.88},{transform:'scale(1.6) rotate(20deg)',opacity:0}],6800);
   const stop=shine(e,'assets/g_rosestar.webp',1500);
   setTimeout(()=>{const [x,y]=at(e,.5,.5);explode(x,y,'purple',90);explode(x,y,'pink',70);flash(.35,'230,190,255');shake(.25)},2100);
   setTimeout(()=>fireworks(12,3600,['purple','pink','white','gold']),2600);setTimeout(stop,6600);return 7200},
  _ylEmblem(id,c,at0){setTimeout(()=>{const e=imgOr('assets/g_'+id+'.webp','🐉','exGift',{width:'54vw',left:'23vw',top:'26%'});e.animate([{transform:'scale(.2)',opacity:0},{transform:'scale(1.15)',opacity:1,offset:.22},{transform:'scale(1)',offset:.32},{transform:'scale(1)',opacity:1,offset:.82},{transform:'scale(1.4)',opacity:0}],{duration:2600,fill:'forwards'});const st=HAVE['g_'+id]?shine(e,'assets/g_'+id+'.webp',300):()=>{};setTimeout(()=>{const [x,y]=at(e,.5,.5);explode(x,y,c,90)},500);setTimeout(st,2400)},at0)},
  zhenhai(g){const sea=div('fxSea');sea.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.9},{opacity:0}],{duration:8000,fill:'forwards'});const d=BIG.rider(g);
   emit(7.5,()=>{for(let i=0;i<4;i++)add({type:'glow',add:1,x:R(0,W),y:H*R(.7,.98),vx:R(-60,60),vy:R(-420,-160),g:520,drag:.99,s:R(4,8),life:1.2,max:1.2,c:Math.random()<.5?'cyan':'white'})});
   BIG._ylEmblem('yl_zhenhai','cyan',d-600);return d+2200},
  lingxiao(g){const d=BIG.rider(g);clouds(7.5,2,1);rays('255,240,200',d+2000);
   emit(7.5,()=>{if(Math.random()<.6)add({type:'spark',add:1,x:R(0,W),y:R(0,H*.6),vx:R(-20,20),vy:R(-40,-10),g:0,drag:1,s:R(2,5),life:1.2,max:1.2,c:Math.random()<.5?'gold':'white',tw:20})});
   BIG._ylEmblem('yl_lingxiao','gold',d-600);return d+2200},
  poqiong(g){const dd=dim(8200);const d=BIG.rider(g);
   const bolt=()=>{let x=R(W*.1,W*.9),y=-10;const pts=[[x,y]];while(y<H*R(.5,.85)){x+=R(-40,40);y+=R(30,70);pts.push([x,y])}add({type:'bolt',add:1,pts,w:R(3,6),x:0,y:0,vx:0,vy:0,g:0,drag:1,life:.22,max:.22,c:'purple'});flash(.18,'200,160,255');if(window.SFX)SFX.boom()};
   [600,1500,2300,3200,4400,5300].forEach(t=>setTimeout(bolt,t));
   BIG._ylEmblem('yl_poqiong','purple',d-600);return d+2200},

  car(g){const e=img('assets/g_car.webp','',{width:'94vw',left:'3vw',top:'48%'});
   e.animate([{transform:'translateX(110vw) skewX(-8deg)',filter:'blur(3px)'},{transform:'translateX(0) skewX(0)',filter:'blur(0)',offset:.32,easing:'cubic-bezier(.2,.8,.3,1)'},{transform:'translateX(-2vw) translateY(-3px)',offset:.4},{transform:'translateX(0)',offset:.7},{transform:'translateX(-130vw) skewX(10deg)',filter:'blur(4px)'}],{duration:3800,easing:'ease-in',fill:'forwards'});
   const stop=shine(e,'assets/g_car.webp',1300);
   emit(3.6,(dt,t)=>{const [hx,hy]=at(e,.12,.52);const [hx2,hy2]=at(e,.47,.57);if(Math.random()<.5){add({type:'flare',add:1,x:hx,y:hy,vx:0,vy:0,g:0,drag:1,s:R(28,40),life:.08,max:.08,c:'blue'});add({type:'flare',add:1,x:hx2,y:hy2,vx:0,vy:0,g:0,drag:1,s:R(20,30),life:.08,max:.08,c:'white'})}
    if(t<1.2||t>2.7){for(let i=0;i<3;i++)add({type:'streak',add:1,x:R(0,W),y:R(H*.45,H*.75),vx:t<1.2?-900:900,vy:0,g:0,drag:1,len:.05,w:R(1,2.5),life:.25,max:.25,c:'white'})}
    const [wx,wy]=at(e,.6,.98);if(t>.9&&t<1.6)for(let i=0;i<3;i++)add({type:'smoke',x:wx+R(-30,30),y:wy,vx:R(60,160),vy:R(-40,-10),g:-5,drag:.97,s:R(14,24),grow:40,life:R(.8,1.4),max:1.4})});
   setTimeout(stop,3600);return 3900},
  lovers(g){const e=img('assets/i_lovers.webp','',{width:'62vw',left:'19vw',top:'30%'});
   e.animate([{transform:'scale(0) rotate(-20deg)',opacity:0},{transform:'scale(1.15) rotate(4deg)',opacity:1,offset:.15},{transform:'scale(1) rotate(0)',offset:.25},{transform:'scale(1.04) translateY(-6px)',offset:.6},{transform:'scale(1)',opacity:1,offset:.85},{transform:'scale(1.3)',opacity:0}],{duration:3600,fill:'forwards'});
   rays('255,140,190',3600);
   emit(3.2,()=>{for(let i=0;i<2;i++)add({type:'glow',add:1,x:R(W*.1,W*.9),y:H+10,vx:R(-20,20),vy:R(-260,-140),g:0,drag:.995,s:R(8,16),life:R(1.5,2.5),max:2.5,c:'pink',tw:8})});
   petals(3,1);return 3700},
  heli(g){const wrap=div('fxWrap',{width:'90vw',left:'5vw',top:'20%'});const e=document.createElement('img');e.src='assets/g_heli.webp';e.className='fxImg';e.style.position='relative';e.style.width='100%';wrap.appendChild(e);
   const rotor=document.createElement('div');rotor.className='rotor';wrap.appendChild(rotor);
   const beam=document.createElement('div');beam.className='beam';wrap.appendChild(beam);
   wrap.animate([{transform:'translate(70vw,-50vh) rotate(-6deg) scale(.6)'},{transform:'translate(0,0) rotate(3deg) scale(1)',offset:.35,easing:'ease-out'},{transform:'translate(0,-10px) rotate(-1deg)',offset:.5},{transform:'translate(0,6px) rotate(2deg)',offset:.65},{transform:'translate(0,0) rotate(0)',offset:.75},{transform:'translate(-110vw,-30vh) rotate(-10deg) scale(.7)'}],{duration:4200,easing:'ease-in-out',fill:'forwards'});
   emit(4,(dt,t)=>{const [x,y]=at(e,.45,1.3);if(t>1&&t<3.2)for(let i=0;i<3;i++)add({type:'smoke',x:x+R(-80,80),y:Math.min(H-20,y+R(60,140)),vx:R(-180,180),vy:R(-20,20),g:0,drag:.95,s:R(16,28),grow:30,life:1.2,max:1.2});
    const [lx,ly]=at(e,.14,.62);if(Math.random()<.4)add({type:'flare',add:1,x:lx,y:ly,vx:0,vy:0,g:0,drag:1,s:22,life:.07,max:.07,c:'red'})});
   const stop=shine(e,'assets/g_heli.webp',1500);setTimeout(stop,4000);return 4300},
  jet(g){const e=img('assets/g_jet.webp','',{width:'88vw',left:'0',top:'0'});
   e.animate([{transform:'translate(-70vw,75vh) rotate(-14deg) scale(.5)'},{transform:'translate(6vw,36vh) rotate(-10deg) scale(1.05)',offset:.5},{transform:'translate(110vw,-25vh) rotate(-14deg) scale(.6)'}],{duration:4200,easing:'cubic-bezier(.4,.1,.6,.9)',fill:'forwards'});
   for(let i=0;i<8;i++)add({type:'smoke',x:R(-50,W+50),y:R(H*.1,H*.7),vx:R(-50,-20),vy:0,g:0,drag:1,s:R(70,130),life:4,max:4,alpha:.6,fadeIn:1});
   emit(4,(dt,t)=>{const [x,y]=at(e,.29,.43);for(let i=0;i<4;i++)add({type:'smoke',x:x+R(-6,6),y:y+R(-6,6),vx:R(-40,-10),vy:R(0,25),g:0,drag:.97,s:R(6,10),grow:26,life:R(1.4,2.2),max:2.2,alpha:.9});
    const [fx,fy]=at(e,.9,.45);if(Math.random()<.35)add({type:'flare',add:1,x:fx,y:fy,vx:0,vy:0,g:0,drag:1,s:R(26,40),life:.08,max:.08,c:'gold'})});
   const stop=shine(e,'assets/g_jet.webp',1200);setTimeout(stop,4100);run();return 4300},
  cruise(g){const sea=div('fxSea');sea.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.9},{opacity:0}],{duration:5200,fill:'forwards'});
   const e=img('assets/g_cruise.webp','',{width:'112vw',left:'-6vw',top:'50%'});
   e.animate([{transform:'translateX(-120vw) translateY(0)'},{transform:'translateX(0) translateY(-4px)',offset:.35,easing:'ease-out'},{transform:'translateX(-3vw) translateY(3px)',offset:.65},{transform:'translateX(120vw) translateY(0)'}],{duration:5200,easing:'ease-in-out',fill:'forwards'});
   setTimeout(()=>fireworks(5,1800,['gold','pink','blue','white']),1600);
   emit(5,()=>{const [x,y]=at(e,.15,.92);for(let i=0;i<3;i++)add({type:'smoke',x:x+R(-30,60),y:y+R(-6,6),vx:R(-80,-20),vy:R(-10,10),g:0,drag:.96,s:R(8,14),grow:16,life:1,max:1,alpha:.9});
    if(Math.random()<.5)add({type:'spark',add:1,x:R(0,W),y:R(H*.68,H*.95),vx:0,vy:0,g:0,drag:1,s:R(3,7),life:.5,max:.5,c:'white',tw:30})});
   const stop=shine(e,'assets/g_cruise.webp',1900);setTimeout(stop,5000);return 5300},
  rocket(g){const e=img('assets/g_rocket.webp','',{height:'56vh',left:'50%',top:'22%',marginLeft:'-8vh'});
   e.animate([{transform:'translateY(80vh)'},{transform:'translateY(4vh)',offset:.28,easing:'ease-out'},{transform:'translateY(5vh) translateX(2px)',offset:.33},{transform:'translateY(4vh) translateX(-2px)',offset:.38},{transform:'translateY(3vh)',offset:.48,easing:'cubic-bezier(.6,0,.9,.5)'},{transform:'translateY(-150vh)'}],{duration:4400,fill:'forwards'});
   if(window.SFX)SFX.rocket();
   emit(4.2,(dt,t)=>{const [x,y]=at(e,.5,.93);const n=t>1.2&&t<2.2?12:7;
    for(let i=0;i<n;i++)add({type:'flame',add:1,x:x+R(-8,8),y:y+R(0,10),vx:R(-50,50),vy:R(280,520),g:0,drag:.9,s:R(14,26),life:R(.18,.35),max:.35});
    if(t>1&&t<2.6){shakeT=window.SHAKE_OFF?0:Math.max(shakeT,.15);for(let i=0;i<5;i++){const d=Math.random()<.5?-1:1;add({type:'smoke',x:x+R(-20,20),y:Math.min(H-10,y+R(40,120)),vx:d*R(120,380),vy:R(-60,-5),g:-8,drag:.96,s:R(26,44),grow:50,life:R(1.6,2.6),max:2.6,dark:Math.random()<.3})}}
    else for(let i=0;i<2;i++)add({type:'smoke',x:x+R(-10,10),y:y+R(30,60),vx:R(-40,40),vy:R(60,140),g:0,drag:.97,s:R(12,20),grow:40,life:R(1,1.6),max:1.6})});
   setTimeout(()=>flash(.35,'255,220,160'),1300);
   setTimeout(()=>{fireworks(7,2000);coins(1.6,3)},2700);return 5200},
  no1(g){const e=img('assets/i_no1.webp','',{width:'70vw',left:'15vw',top:'34%'});
   emit(4,(dt,t)=>{for(let i=0;i<10;i++){const a=R(0,6.28),s=R(300,900);add({type:'streak',add:1,x:W/2+Math.cos(a)*20,y:H*.45+Math.sin(a)*20,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:0,drag:1.02,len:.06,w:R(1,2.5),life:.6,max:.6,c:Math.random()<.5?'blue':'white'})}});
   e.animate([{transform:'scale(.05) rotate(-30deg)',opacity:0,filter:'drop-shadow(0 0 0 #4fc3ff)'},{transform:'scale(1.1) rotate(0)',opacity:1,offset:.35,filter:'drop-shadow(0 0 30px #4fc3ff)'},{transform:'scale(1) translateY(-8px)',offset:.7},{transform:'translate(60vw,-60vh) scale(.3) rotate(25deg)',opacity:0}],{duration:4200,easing:'ease-in-out',fill:'forwards'});
   setTimeout(()=>{flash(.5,'150,210,255');fireworks(5,1400,['blue','white','purple'])},2900);return 4600},
  airship(g){rays('255,210,120',5600);const e=img('assets/g_airship.webp','',{width:'100vw',left:'0',top:'18%'});
   e.animate([{transform:'translateX(100vw) translateY(0)'},{transform:'translateX(0) translateY(-12px)',offset:.4,easing:'ease-out'},{transform:'translateX(-4vw) translateY(8px)',offset:.7},{transform:'translateX(-110vw) translateY(0)'}],{duration:5600,easing:'ease-in-out',fill:'forwards'});
   emit(5.2,()=>{const [x,y]=at(e,.6,.75);if(Math.random()<.5)add({type:'coin',x:x+R(-60,60),y,vx:R(-40,40),vy:R(40,120),g:420,drag:.99,s:R(12,18),life:2.2,max:2.2,rot:R(0,6),vr:R(6,14)});add({type:'conf',x:x+R(-80,80),y,vx:R(-50,50),vy:R(30,100),g:120,drag:.99,s:R(4,6),life:2.5,max:2.5,c:P(CONF),rot:R(0,6),vr:R(-8,8)});
    const [gx,gy]=at(e,.6,.62);if(Math.random()<.3)add({type:'flare',add:1,x:gx,y:gy,vx:0,vy:0,g:0,drag:1,s:30,life:.1,max:.1,c:'gold'})});
   const stop=shine(e,'assets/g_airship.webp',1800);setTimeout(stop,5400);return 5800},
  carriage(g){const glow=div('fxGlowPink');glow.animate([{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.85},{opacity:0}],{duration:5600,fill:'forwards'});
   const e=img('assets/g_carriage.webp','',{width:'104vw',left:'-2vw',top:'44%'});
   e.animate([{transform:'translateX(110vw)'},{transform:'translateX(0) translateY(0)',offset:.38,easing:'ease-out'},{transform:'translateX(0) translateY(-5px)',offset:.48},{transform:'translateX(0) translateY(0)',offset:.6},{transform:'translateX(-120vw)'}],{duration:5600,easing:'ease-in-out',fill:'forwards'});
   petals(5,3);
   emit(5.2,()=>{const [x,y]=at(e,.95,.75);for(let i=0;i<4;i++)add({type:'spark',add:1,x:x+R(-10,40),y:y+R(-80,40),vx:R(40,160),vy:R(-30,30),g:20,drag:.97,s:R(4,9),life:R(.8,1.6),max:1.6,c:Math.random()<.5?'gold':'pink',tw:25})});
   const stop=shine(e,'assets/g_carriage.webp',2000);setTimeout(stop,5400);setTimeout(()=>fireworks(4,1500,['pink','gold']),2200);return 5800},
  castle(g){rays('255,170,220',5600);const e=img('assets/g_castle.webp','',{width:'86vw',left:'7vw',top:'18%'});
   e.animate([{transform:'translateY(70vh) scale(.6)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1,offset:.35,easing:'cubic-bezier(.2,.9,.3,1.1)'},{transform:'translateY(-6px) scale(1.02)',offset:.65},{transform:'translateY(0) scale(1)',opacity:1,offset:.88},{transform:'scale(1.25)',opacity:0}],{duration:5600,fill:'forwards'});
   sparkleAround(e,5,5,'pink');
   emit(5,()=>{const [x,y]=at(e,.5,.85);for(let i=0;i<2;i++)add({type:'smoke',x:x+R(-W*.4,W*.4),y:y+R(-10,30),vx:R(-30,30),vy:R(-10,10),g:0,drag:.98,s:R(30,50),grow:10,life:1.5,max:1.5,alpha:.8})});
   setTimeout(()=>{fireworks(6,2400,['pink','gold','white','purple']);confetti(1.5,6)},1800);return 5800},
  carnival(g){dim(6800);rays('255,215,120',6800);const e=img('assets/g_carnival.webp','',{width:'84vw',left:'8vw',top:'20%'});
   e.animate([{transform:'scale(0) rotate(-25deg)',opacity:0},{transform:'scale(1.12) rotate(3deg)',opacity:1,offset:.18,easing:'cubic-bezier(.2,.9,.3,1.3)'},{transform:'scale(1) rotate(0)',offset:.26},{transform:'scale(1.04)',offset:.6},{transform:'scale(1)',opacity:1,offset:.9},{transform:'scale(1.4)',opacity:0}],{duration:6800,fill:'forwards'});
   sparkleAround(e,6,6,'gold');
   setTimeout(()=>{flash(.6,'255,230,170');shake(.9);burstAt(W/2,H*.4,'gold',80)},700);
   setTimeout(()=>{fireworks(16,5200);confetti(2.4,10,'bottom')},900);
   setTimeout(()=>coins(2.5,4),1600);
   const stop=shine(e,'assets/g_carnival.webp',1200);setTimeout(stop,6400);return 7000},
 };
 /* --- 佇列 --- */
 let Q=[],busy=false,skipFn=null;
 function queue(g,who){if(Q.length>5)Q.shift();Q.push([g,who]);if(!busy)next()}
 function next(){const it=Q.shift();if(!it){busy=false;layer.classList.remove('on');return}busy=true;play(...it)}
 function play(g,who){layer.classList.add('on');let dur=1000;try{dur=BIG[g.fx](g);if(g.entrance)entTitle(g.name,who,dur,g.img,g.color);else title(g,who,dur);if(window.SFX)SFX.big(g.price||20000)}catch(err){console.warn(err)}
  let ended=false;const done=(skipped)=>{if(ended)return;ended=true;skipFn=null;if(skipped){emitters.length=0}[...layer.children].forEach(c=>c.remove());setTimeout(next,120)};
  const tm=setTimeout(()=>done(false),dur);skipFn=()=>{clearTimeout(tm);done(true)};
 }
 layer.addEventListener('pointerdown',()=>{if(skipFn)skipFn()});
 /* --- 中小禮物 --- */
 function mid(g){const e=img(g.img,'midGift',{});e.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:0},{transform:'translate(-50%,-50%) scale(1.25)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1)',offset:.4},{transform:'translate(-50%,-56%) scale(1.03)',opacity:1,offset:.8},{transform:'translate(-50%,-80%) scale(.7)',opacity:0}],{duration:1700,easing:'ease-out',fill:'forwards'}).onfinish=()=>e.remove();
  setTimeout(()=>burstAt(W/2,H*.42,P(['gold','pink','purple']),36),250);if(g.price>=299)setTimeout(()=>confetti(.6,6),300)}
 function small(g,n){const box=document.getElementById('app');for(let i=0;i<Math.min(5,n);i++)setTimeout(()=>{const e=document.createElement('img');e.src=g.img;e.className='flyGift';e.style.setProperty('--x',R(-140,10)+'px');box.appendChild(e);setTimeout(()=>e.remove(),2000)},i*70)}
 return {queue,mid,small,burstAt,fireworks,confetti,coins,flash,shake,busy:()=>busy,clear:()=>{Q=[];if(skipFn)skipFn()}};
})();
