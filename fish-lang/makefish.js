// Make it a MannaFish (Ken, 2 Nov: "when you get in the word, pick one verse, one statement, one thing out of that and share it with
// somebody ... every chapter somebody can select a word and it will automatically generate a MannaFish design for that word"). The fish
// is drawn on the phone by the same builder as every MannaFish (/fish-lang/fishfmt.js, with the rule in fishgeo.json): the word the
// reader picked, in the middle, and its own verse along the two curves, so the word is always in the verse. Share it as a picture, or
// keep it in My MannaFish (/my-fish/), where the fish they love are too, and every fish they shared is listed (Ken: "I want them to
// know which fish or words they chose to share").
//   MFmake.open({word, verse, ref, refShort, tag, href})   MFmake.render(f) -> Promise<svg>   MFmake.share(f)   MFmake.mine()   MFmake.shared()
// Kept on the device and with the account: mf-myfish (fish they made), mf-myfish-shared (every share: id, word, ref, when, how).
(function(){
  if(window.MFmake) return;
  var MINE='mf-myfish', SHARED='mf-myfish-shared';
  function get(k,d){ try{ var v=JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }catch(e){ return d; } }
  function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} if(window.MFacct&&MFacct.touch) try{ MFacct.touch(k===MINE?'myfish':'myshared'); }catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function title(w){ w=String(w||'').trim(); return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); }
  // the builder, loaded the first time it is needed
  function script(u,ok){ return ok()?Promise.resolve():new Promise(function(res,rej){ var s=document.createElement('script'); s.src=u; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  var DEP=null;
  function load(){ return DEP||(DEP=Promise.all([script('/fish-lang/opentype.min.js',function(){ return !!window.opentype; }).then(function(){ return script('/fish-lang/fishfmt.js',function(){ return !!window.MFfmt; }); }),
      fetch('/fish-lang/fishgeo.json').then(function(r){ return r.json(); }),fetch('/fish-lang/hobo.otf').then(function(r){ return r.arrayBuffer(); })])
    .then(function(x){ MFfmt.setGeo(x[1]); return {E:MFfmt.otEngine(opentype.parse(x[2])),R:x[1].rule}; }).catch(function(e){ DEP=null; throw e; })); }
  // Hobo has Latin letters only (English, Spanish, Tagalog, German ...)
  function latin(t){ return /^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{S}]*$/u.test(String(t||'')); }
  // the verse along the two curves: the part with the word in it when the verse is long (… where it is cut), split near the middle
  function lines(verse,word){ var v=String(verse||'').replace(/\s+/g,' ').trim(), MAX=96, w=String(word||'').toLowerCase();
    if(v.length>MAX){ var at=v.toLowerCase().indexOf(w); if(at<0) at=0; var s=at, e=at+w.length;
      // grow by whole clauses around the word, then by words, while it fits
      var cut=function(i,dir){ var re=/[,;:.?!]/; if(dir<0){ for(var j=i-1;j>0;j--) if(re.test(v[j-1])&&v[j]===' ') return j; return 0; } for(var k=i;k<v.length;k++) if(re.test(v[k])) return k+1; return v.length; };
      var grew=true; while(grew){ grew=false; var a=cut(s,-1), b=cut(e,1); if(b-a<=MAX&&(a<s||b>e)){ s=a; e=b; grew=true; } }
      while(e-s<MAX-12){ var sp=v.indexOf(' ',e+1); if(e<v.length&&(sp<0?v.length:sp)-s<=MAX){ e=sp<0?v.length:sp; continue; } var ps=v.lastIndexOf(' ',s-2); if(s>0&&e-(ps+1)<=MAX){ s=ps+1; continue; } break; }
      v=(s>0?'…':'')+v.slice(s,e).trim().replace(/[,;:]$/,'')+(e<v.length?'…':''); }
    var mid=Math.round(v.length*0.46), best=-1, bd=1e9;
    for(var i=8;i<v.length-8;i++){ if(v[i]!==' ') continue; var d=Math.abs(i-mid)-(/[,;:]/.test(v[i-1])?12:0); if(d<bd){ bd=d; best=i; } }
    if(best<0) return {top:v,bot:''}; return {top:v.slice(0,best).trim(),bot:v.slice(best+1).trim()}; }
  function render(f){ return load().then(function(B){ return MFfmt.svg(B.E,{word:f.word,top:f.top||' ',bot:f.bot||' ',ref:f.ref||'',refShort:f.refShort||'',tag:f.tag==null?' (KJV)':f.tag},B.R); }); }
  // a picture of a fish (the outlines need no font): black, 2000 x 1000
  function png(svg){ return new Promise(function(res,rej){ var img=new Image(), u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    img.onload=function(){ var c=document.createElement('canvas'); c.width=2000; c.height=1000; var g=c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,2000,1000); g.drawImage(img,0,0,2000,1000); URL.revokeObjectURL(u); c.toBlob(function(b){ b?res(b):rej(0); },'image/png'); };
    img.onerror=function(){ URL.revokeObjectURL(u); rej(0); }; img.src=u; }); }
  /* Ken, 12 Nov: a fish can only carry the words of its own verse. The two curves must be pieces of the verse, in order ("..." marks a cut), and the middle word must be in it. */
  function nrm(t){ return String(t||'').toLowerCase().replace(/[“”"‘’]/g,'').replace(/[^\p{L}\p{N}' ]+/gu,' ').replace(/\s+/g,' ').trim(); }
  function fromVerse(f){ var v=nrm(f.verse); if(!v) return true; var from=0, ok=true;
    [f.top,f.bot].forEach(function(x){ x=nrm(String(x||'').replace(/\.{2,}|…/g,' ')); if(!x||!ok) return; var i=v.indexOf(x,from); if(i<0){ ok=false; return; } from=i+x.length; });
    var w=nrm(f.word); if(ok&&w&&(' '+v+' ').indexOf(' '+w+' ')<0&&!new RegExp('(^| )'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es|ed|ing|eth|est)?( |$)','u').test(v)) ok=false;
    return ok; }
  var WHY='A MannaFish can only carry the words of its verse. Please use the verse’s own words.';
  /* every fish someone keeps or shares is reported to Ken with its picture (/api/fish-made); once per fish */
  function report(f){ try{ var id=idOf(f), done=get('mf-myfish-reported',[]); if(done.indexOf(id)>=0) return; done.push(id); put('mf-myfish-reported',done.slice(-300));
      (f._svg?Promise.resolve(f._svg):render(f)).then(function(svg){ return new Promise(function(res){ var img=new Image(), u=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
        img.onload=function(){ var c=document.createElement('canvas'); c.width=1000; c.height=500; var g=c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,1000,500); g.drawImage(img,0,0,1000,500); URL.revokeObjectURL(u); res(c.toDataURL('image/png')); }; img.onerror=function(){ URL.revokeObjectURL(u); res(''); }; img.src=u; }); })
      .then(function(png){ var me=window.MFacct&&MFacct.me&&MFacct.me(); return fetch('/api/fish-made',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({word:f.word,top:f.top,bot:f.bot,ref:f.ref,tag:f.tag,verse:f.verse,png:png,email:(me&&me.email)||''})}); }).catch(function(){}); }catch(e){} }
  function mine(){ var a=get(MINE,[]); return Array.isArray(a)?a:[]; }
  function shared(){ var a=get(SHARED,[]); return Array.isArray(a)?a:[]; }
  function idOf(f){ return f.id||('U:'+(f.word+'|'+f.ref).toLowerCase()); }
  function keep(f){ var a=mine(), id=idOf(f); if(a.some(function(x){ return x.id===id; })) return false;
    a.unshift({id:id,word:f.word,top:f.top,bot:f.bot,ref:f.ref,refShort:f.refShort||'',tag:f.tag==null?' (KJV)':f.tag,verse:f.verse||'',href:f.href||'',at:Date.now()}); put(MINE,a.slice(0,500)); report(f); return true; }
  function drop(id){ put(MINE,mine().filter(function(x){ return x.id!==id; })); }
  function noteShare(f,how){ report(f); var a=shared(); a.unshift({id:idOf(f),word:f.word,ref:f.ref||'',how:how,at:Date.now()}); put(SHARED,a.slice(0,1000)); }
  // share a fish: f.svg (its picture) or drawn from f; the words go with it, and a link to read the verse
  function share(f,svg){ var go=svg?Promise.resolve(svg):f.src?fetch(f.src).then(function(r){ if(!r.ok) throw 0; return r.text(); }):render(f);
    var link=f.href?(/^https?:/.test(f.href)?f.href:location.origin+f.href):location.origin+'/', text=(f.verse?'“'+f.verse+'” ':'')+(f.ref?f.ref+' ':'')+'· a MannaFish for you · '+link;
    return go.then(png).then(function(b){ var file=new File([b],'MannaFish-'+String(f.word).replace(/\W+/g,'')+'.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})) return navigator.share({files:[file],text:text}).then(function(){ noteShare(f,'shared'); return 'shared'; },function(e){ if(e&&e.name==='AbortError') return 'cancelled'; throw e; });
      var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },4000);
      try{ if(navigator.clipboard) navigator.clipboard.writeText(text).catch(function(){}); }catch(e){} noteShare(f,'saved the picture'); return 'saved'; }); }

  // ── the sheet ──
  var EL=null, CUR=null;
  function css(){ if(document.getElementById('mfmkCss')) return; var s=document.createElement('style'); s.id='mfmkCss';
    s.textContent="@font-face{font-family:'MFHobo';src:url(/fish-lang/hobo.woff2) format('woff2')}"
      +'.mfmk{position:fixed;inset:0;z-index:140;background:rgba(0,0,0,.94);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:max(14px,env(safe-area-inset-top)) 14px 30px;color:#eaf0f0;font:16px/1.45 Archivo,system-ui,sans-serif}.mfmk[hidden]{display:none}'
      +'.mfmk .in{width:100%;max-width:640px;text-align:center;position:relative}.mfmk h2{font:400 1.7rem/1.1 MFHobo,cursive;margin:8px 40px 4px}.mfmk .sub{color:#9fb2b6;font-size:.86rem;margin:0 0 12px}'
      +'.mfmk .x{position:absolute;top:0;right:0;width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(200,215,218,.3);background:#11161c;color:#fff;font-size:1rem;cursor:pointer}'
      +'.mfmk .fb{width:100%;aspect-ratio:2/1;background:#000;border:1px solid rgba(200,215,218,.2);border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center}.mfmk .fb svg{width:100%;height:100%;display:block}'
      +'.mfmk .wd{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:12px 0 4px}.mfmk .wd button{border:1px solid rgba(200,215,218,.22);background:#0b1620;color:#eaf0f0;border-radius:999px;padding:5px 10px;font:700 .85rem Archivo,sans-serif;cursor:pointer}'
      +'.mfmk .wd button[aria-pressed=true]{background:#f5d76e;color:#1a1400;border-color:#f5d76e}.mfmk .k{font:800 .7rem Archivo,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6f9bff;margin:14px 0 4px}'
      +'.mfmk .ln{display:grid;gap:6px;margin:6px 0 0}.mfmk .ln input{width:100%;border:1px solid rgba(200,215,218,.22);background:#0b1620;color:#eaf0f0;border-radius:10px;padding:9px 11px;font:16px Archivo,sans-serif}'
      +'.mfmk .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:14px 0 0}.mfmk .row button,.mfmk .row a{border:1px solid rgba(200,215,218,.22);background:#0b1620;color:#eaf0f0;border-radius:999px;padding:11px 16px;font:800 .95rem Archivo,sans-serif;cursor:pointer;text-decoration:none}'
      +'.mfmk .row .p{background:#2a5fb0;border-color:#2a5fb0}.mfmk .msg{min-height:1.4em;color:#9fd3a6;font-weight:700;margin:10px 0 0}';
    document.head.appendChild(s); }
  function build(){ css(); EL=document.createElement('div'); EL.className='mfmk'; EL.hidden=true; EL.setAttribute('role','dialog'); EL.setAttribute('aria-label','Make it a MannaFish');
    EL.innerHTML='<div class="in"><button type="button" class="x" data-x aria-label="Close">&#10005;</button><h2>Make it a MannaFish</h2><p class="sub" data-ref></p>'
      +'<div class="fb" data-fish></div><p class="k">The word in the middle</p><div class="wd" data-words></div>'
      +'<details><summary class="sub" style="cursor:pointer;margin:10px 0 0">✏️ Change the lines</summary><div class="ln"><input data-top aria-label="Top line"><input data-bot aria-label="Bottom line"></div></details>'
      +'<div class="row"><button type="button" class="p" data-share>📤 Share it</button><button type="button" data-keep>⭐ Keep in My MannaFish</button><a href="/my-fish/">My MannaFish</a></div><p class="msg" aria-live="polite" data-msg></p></div>';
    document.body.appendChild(EL);
    EL.addEventListener('click',function(e){ var t=e.target;
      if(t.closest('[data-x]')||t===EL){ close(); return; }
      var w=t.closest('[data-w]'); if(w){ CUR.word=title(w.dataset.w); draw(); return; }
      if((t.closest('[data-keep]')||t.closest('[data-share]'))&&!fromVerse(CUR)){ msg(WHY); return; }
      if(t.closest('[data-keep]')){ msg(keep(CUR)?'Kept in My MannaFish':'Already in My MannaFish'); return; }
      if(t.closest('[data-share]')){ msg('…'); share(CUR,CUR._svg).then(function(r){ msg(r==='shared'?'Shared · listed in My MannaFish':r==='saved'?'The picture is saved · the words are copied to paste with it':''); }).catch(function(){ msg('Couldn’t make the picture just now'); }); } });
    EL.addEventListener('input',function(e){ if(e.target.matches('[data-top]')) CUR.top=e.target.value; else if(e.target.matches('[data-bot]')) CUR.bot=e.target.value; else return; clearTimeout(EL._t); EL._t=setTimeout(draw,200); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&EL&&!EL.hidden) close(); }); }
  function msg(t){ EL.querySelector('[data-msg]').textContent=t; }
  function draw(){ var f=CUR; EL.querySelector('[data-words]').innerHTML=f.words.map(function(w){ return '<button type="button" data-w="'+esc(w)+'" aria-pressed="'+(title(w)===f.word)+'">'+esc(w)+'</button>'; }).join('');
    var box=EL.querySelector('[data-fish]'); render(f).then(function(svg){ if(CUR!==f) return; f._svg=svg; box.innerHTML=svg; }).catch(function(){ box.innerHTML='<p class="sub">Couldn’t draw the fish just now</p>'; }); }
  // the words of the verse worth a fish (not "the", "and", "unto" ...)
  var SMALL=/^(the|a|an|and|of|to|in|on|at|by|for|with|from|but|or|nor|so|as|is|are|was|were|be|been|am|it|its|he|him|his|she|her|they|them|their|we|us|our|you|ye|thee|thou|thy|thine|i|me|my|mine|that|which|who|whom|this|these|those|unto|upon|not|shall|will|hath|have|had|doth|did|do|all|there|then|than|when|what|also|into|out|up|el|la|los|las|de|del|y|que|en|un|una|por|para|con|se|su|sus|lo|al|ang|ng|sa|at|mga|der|die|das|und|zu|den|ist|nicht)$/i;
  function wordsOf(t){ var seen={}, out=[]; (String(t).match(/[\p{L}’']+/gu)||[]).forEach(function(w){ w=w.replace(/[’']s$/,''); var k=w.toLowerCase(); if(k.length<3||SMALL.test(k)||seen[k]) return; seen[k]=1; out.push(w); }); return out.slice(0,40); }
  function open(o){ if(!EL) build(); var L=lines(o.verse,o.word);
    CUR={word:title(o.word),verse:String(o.verse||'').trim(),top:L.top,bot:L.bot,ref:o.ref||'',refShort:o.refShort||'',tag:o.tag==null?' (KJV)':o.tag,href:o.href||'',words:wordsOf(o.verse)};
    if(CUR.words.map(title).indexOf(CUR.word)<0) CUR.words.unshift(o.word);
    EL.querySelector('[data-ref]').textContent=(o.ref||'')+' · tap another word to change it'; EL.querySelector('[data-top]').value=L.top; EL.querySelector('[data-bot]').value=L.bot; msg('');
    EL.hidden=false; document.documentElement.style.overflow='hidden'; draw(); }
  function close(){ if(!EL) return; EL.hidden=true; document.documentElement.style.overflow=''; }
  window.MFmake={fromVerse:fromVerse,open:open,close:close,render:render,share:share,mine:mine,shared:shared,keep:keep,drop:drop,latin:latin,lines:lines,png:png};
})();
