// Highlights in prayers and devotional words (Ken, 23 Oct: "I would like to be able to highlight prayers in the devotional ...
// this is a prayer from the Bible app and I would want to be able to highlight it, but that option is not there").
// Any block marked data-hl="<where it is from>" (a prayer, a verse, a line of the devotional) can be highlighted: select words,
// tap Highlight. Kept in mf-hl-pr as {id: {b: the block's words (a short fingerprint), s, e: where in it, c: colour, text, src, link, at}},
// painted again whenever the same words come back, listed in My stuff -> Highlights, and kept with the account (SYNC:prhl).
// Painted with the CSS Highlight API, so the page's own words and read-aloud are not touched.
(function(){
  if(window.MFprhl) return;
  var KEY='mf-hl-pr', HLC={gold:'#f5d76e',green:'#8ddca4',blue:'#93bff5',pink:'#f5a9cb',orange:'#f8b273'};
  function get(){ try{ var h=JSON.parse(localStorage.getItem(KEY)||'{}'); return h&&typeof h==='object'?h:{}; }catch(e){ return {}; } }
  function put(h){ try{ localStorage.setItem(KEY,JSON.stringify(h)); }catch(e){} if(window.MFacct&&MFacct.touch) MFacct.touch('prhl'); }
  function color(){ var c='gold'; try{ c=localStorage.getItem('mf-hl-color')||'gold'; }catch(e){} return HLC[c]?c:'gold'; }
  function fp(t){ var h=5381; for(var i=0;i<t.length;i++) h=((h<<5)+h+t.charCodeAt(i))|0; return (h>>>0).toString(36)+'.'+t.length; }
  function blockOf(n){ var el=n&&(n.nodeType===1?n:n.parentElement); return el&&el.closest?el.closest('[data-hl]'):null; }
  function at(b,node,off){ var r=document.createRange(); r.setStart(b,0); r.setEnd(node,off); return r.toString().length; }
  // the words now selected, if they are in one highlightable block  -> {b, s, e, text} | null
  function sel(){ var S=window.getSelection&&getSelection(); if(!S||!S.rangeCount||S.isCollapsed) return null;
    var r=S.getRangeAt(0), b=blockOf(r.startContainer); if(!b) return null;
    var s=at(b,r.startContainer,r.startOffset), e=b.contains(r.endContainer)?at(b,r.endContainer,r.endOffset):b.textContent.length, all=b.textContent;
    var W=/[\p{L}\p{N}'’-]/u;   // a phone's selection often cuts a word in half: take the whole word
    while(s>0&&W.test(all.charAt(s-1))&&W.test(all.charAt(s))) s--; while(e<all.length&&W.test(all.charAt(e))&&W.test(all.charAt(e-1))) e++;
    while(s<e&&/\s/.test(all.charAt(s))) s++; while(e>s&&/\s/.test(all.charAt(e-1))) e--;
    return e-s>=2?{b:b,s:s,e:e,text:all.slice(s,e)}:null; }
  function over(x){ var H=get(), f=fp(x.b.textContent); return Object.keys(H).filter(function(k){ var y=H[k]; return y.b===f&&y.s<x.e&&x.s<y.e; }); }
  // highlight the selection, or take away the highlights it touches  -> true (now highlighted) | false (removed)
  function toggle(x){ var H=get(), o=over(x);
    if(o.length){ o.forEach(function(k){ delete H[k]; }); put(H); paint(); return false; }
    H['p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)]={b:fp(x.b.textContent),s:x.s,e:x.e,c:color(),text:x.text.slice(0,600),
      src:x.b.getAttribute('data-hl')||'Prayer',link:x.b.getAttribute('data-hl-link')||(location.pathname+location.search),at:Date.now()};
    put(H); paint(); return true; }
  function rangeAt(b,s,e){ var w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT), n, pos=0, r=document.createRange(), a=false;
    while((n=w.nextNode())){ var L=n.data.length;
      if(!a&&s<=pos+L){ r.setStart(n,s-pos); a=true; }
      if(a&&e<=pos+L){ r.setEnd(n,e-pos); return r; }
      pos+=L; }
    return null; }
  var styled=false;
  function paint(){ if(!window.CSS||!CSS.highlights||!window.Highlight) return;
    if(!styled){ styled=true; var st=document.createElement('style'); st.textContent=Object.keys(HLC).map(function(c){ return '::highlight(mfpr-'+c+'){background-color:'+HLC[c]+';color:#14181d}'; }).join(''); document.head.appendChild(st); }
    var H=get(), by={}, groups={};
    Object.keys(H).forEach(function(k){ var x=H[k]; (by[x.b]=by[x.b]||[]).push(x); });
    if(Object.keys(by).length) [].forEach.call(document.querySelectorAll('[data-hl]'),function(b){ var L=by[fp(b.textContent)]; if(!L) return;
      L.forEach(function(x){ var r=rangeAt(b,x.s,x.e); if(r) (groups[x.c]=groups[x.c]||[]).push(r); }); });
    Object.keys(HLC).forEach(function(c){ var g=groups[c]; if(g&&g.length){ var h=new Highlight(); g.forEach(function(r){ h.add(r); }); CSS.highlights.set('mfpr-'+c,h); } else CSS.highlights.delete('mfpr-'+c); }); }
  // whenever the page draws new words (the next step, another prayer), paint what was highlighted there before
  var pt=null; function soon(){ clearTimeout(pt); pt=setTimeout(paint,150); }
  function watch(){ try{ new MutationObserver(soon).observe(document.body,{childList:true,subtree:true,characterData:true}); }catch(e){} soon(); }
  if(document.body) watch(); else document.addEventListener('DOMContentLoaded',watch);
  window.addEventListener('storage',function(e){ if(e.key===KEY) soon(); });

  // a small Highlight button by the selection, for pages that do not have their own (Time with God)
  function bubble(){ var b=document.createElement('button'); b.type='button'; b.hidden=true;
    b.style.cssText='position:fixed;z-index:9999;border:0;border-radius:999px;background:#f5d76e;color:#14181d;font:800 .9rem system-ui,sans-serif;padding:9px 16px;box-shadow:0 8px 24px -6px rgba(0,0,0,.6);cursor:pointer';
    document.body.appendChild(b); var cur=null, t=null;
    function place(){ cur=sel(); if(!cur){ b.hidden=true; return; } var es=(document.documentElement.lang||'').indexOf('es')===0;
      b.textContent=over(cur).length?(es?'Quitar resaltado':'Remove highlight'):(es?'🖍 Resaltar':'🖍 Highlight'); b.hidden=false;
      var r=getSelection().getRangeAt(0).getBoundingClientRect(), w=b.offsetWidth, top=r.bottom+12; if(top+44>innerHeight) top=Math.max(8,r.top-54);
      b.style.top=top+'px'; b.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px'; }
    document.addEventListener('selectionchange',function(){ clearTimeout(t); t=setTimeout(place,300); });
    b.addEventListener('pointerdown',function(e){ e.preventDefault(); });
    b.addEventListener('click',function(){ if(!cur) return; var on=toggle(cur); try{ getSelection().removeAllRanges(); }catch(e){} b.hidden=true;
      if(window.MFprhlSaid) MFprhlSaid(on); });
    window.addEventListener('scroll',function(){ b.hidden=true; },{passive:true,capture:true}); }

  window.MFprhl={KEY:KEY,colors:HLC,get:get,put:put,sel:sel,over:over,toggle:toggle,paint:paint,bubble:bubble};
})();
