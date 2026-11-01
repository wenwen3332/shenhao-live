/* 靜態語音：文字 → 音檔鍵（與 tools/gen_voice.js 共用） */
(function(g){
const clean=t=>String(t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B00}-\u{2BFF}]/gu,'').replace(/[～~]+/g,'，').replace(/x(\d+)/gi,'$1個').trim();
const norm=t=>clean(t).replace(/[^\p{L}\p{N}]/gu,'');
const cyrb53=(s,seed=0)=>{let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<s.length;i++){ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)};
const key=(sid,t)=>{const n=norm(t);return n?cyrb53(sid+'|'+n):null};
let sets=null;
function has(sid,k){if(!g.VM)return false;if(!sets)sets={};if(!sets[sid])sets[sid]=new Set((g.VM[sid]||'').split(' '));return sets[sid].has(k)}
g.VOICE={clean,norm,key,has};
})(typeof window!=='undefined'?window:globalThis);
