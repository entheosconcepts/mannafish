// Ken, 18 Oct: "The word in the middle needs an easy adjustment tool that allows me to select, pinch and move, with size and
// position settings, a letter count for the tool, and a 'use this as a learning tool for all fish' button ... for any particular
// word in any particular language."
// One tool for both edit sheets. Tap the word to select it, drag to move, pinch (or drag the corner handle) to size.
// The numbers are the fish's own units: the fish is 4000 wide and 2000 high; size is the letter size (font size).
//   MFWordTool.attach({svg, text, panel, get, set, n, word, lang, langName, learned, onLearn})
//     get() -> {size, dx, dy, ww}   set(v) redraws the word   learned() -> a short note when a rule is in use
(function(){
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  function r1(x){ return Math.round(x*10)/10; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var CSS='.wt{border:1px dashed rgba(255,255,255,.18);border-radius:12px;padding:8px 10px;margin:8px 0}'
    +'.wt h4{margin:0 0 6px;font:700 .72rem Archivo,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#9fb2b6;display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}'
    +'.wt h4 i{font-style:normal;color:#f5d76e;letter-spacing:0;text-transform:none}'
    +'.wt .nums{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}@media(max-width:560px){.wt .nums{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    +'.wt label{display:block;font:700 .66rem Archivo,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#9fb2b6}'
    +'.wt input{display:block;width:100%;margin-top:3px;background:#000;border:1px solid rgba(255,255,255,.18);color:#eaf0f0;border-radius:8px;padding:7px 8px;font:700 1rem Archivo,sans-serif}'
    +'.wt .row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}'
    +'.wt .row button{min-width:42px;height:38px;border:1px solid rgba(255,255,255,.18);background:#000;color:#eaf0f0;border-radius:10px;font:800 .9rem Archivo,sans-serif;cursor:pointer;padding:0 9px}'
    +'.wt .row button.learn{background:#f5d76e;color:#1a1400;border-color:#f5d76e}'
    +'.wt .hint{font:.8rem Archivo,sans-serif;color:#9fb2b6;margin:6px 0 0}.wt .note{font:600 .8rem Archivo,sans-serif;color:#7fd18b;margin:4px 0 0;min-height:1em}'
    +'.wtsel{fill:none;stroke:#f5d76e;stroke-width:10;stroke-dasharray:40 26;pointer-events:none}.wth{fill:#f5d76e;stroke:#000;stroke-width:8;cursor:nwse-resize}';
  var styled=false;
  function style(){ if(styled) return; styled=true; var s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s); }

  function attach(o){
    style();
    var svg=o.svg, sel=null, handle=null, on=false, ptrs={}, start=null;
    var p=o.panel;
    p.classList.add('wt');
    p.innerHTML='<h4>Word in the middle <i class="wtn"></i></h4>'
      +'<div class="nums"><label>Size<input type="number" step="5" data-k="size" inputmode="decimal"></label><label>Left (−) / right (+)<input type="number" step="10" data-k="dx" inputmode="decimal"></label>'
      +'<label>Up (−) / down (+)<input type="number" step="10" data-k="dy" inputmode="decimal"></label><label>Width %<input type="number" step="1" data-k="ww" inputmode="decimal"></label></div>'
      +'<div class="row"><button type="button" data-b="s-">A−</button><button type="button" data-b="s+">A+</button><button type="button" data-b="x-">←</button><button type="button" data-b="x+">→</button>'
      +'<button type="button" data-b="y-">↑</button><button type="button" data-b="y+">↓</button><button type="button" data-b="w-">↔−</button><button type="button" data-b="w+">↔+</button><button type="button" data-b="0">↺</button>'
      +'<button type="button" class="learn" data-b="learn"></button></div>'
      +'<p class="hint">Tap the word on the fish to select it, then drag to move it. Pinch with two fingers to size it, or drag the yellow corner on a computer.</p><p class="note" aria-live="polite"></p>';
    var inputs={}; [].forEach.call(p.querySelectorAll('input[data-k]'),function(i){ inputs[i.dataset.k]=i; });
    function head(){ var n=o.n(); p.querySelector('.wtn').textContent=n+' letter'+(n===1?'':'s')+(o.learned&&o.learned()?' · '+o.learned():'');
      p.querySelector('.learn').textContent='📚 Use for all '+n+'-letter words'+(o.langName?' in '+o.langName:''); }
    function fill(){ var v=o.get(); inputs.size.value=Math.round(v.size); inputs.dx.value=Math.round(v.dx); inputs.dy.value=Math.round(v.dy); inputs.ww.value=Math.round(v.ww*100); head(); box(); }
    function put(v){ v.size=Math.max(60,Math.min(1600,v.size)); v.ww=Math.max(.3,Math.min(2,v.ww)); o.set(v); if(o.done) o.done(); fill(); }
    function cur(){ return o.get(); }
    p.addEventListener('input',function(e){ var i=e.target.closest('input[data-k]'); if(!i||i.value==='') return; var v=cur(), x=+i.value; if(isNaN(x)) return;
      if(i.dataset.k==='ww') v.ww=x/100; else v[i.dataset.k]=x; o.set(v); if(o.done) o.done(); head(); box(); });
    p.addEventListener('change',function(){ fill(); });
    p.addEventListener('click',function(e){ var b=e.target.closest('button[data-b]'); if(!b) return; var v=cur(), k=b.dataset.b;
      if(k==='learn'){ var msg=o.onLearn&&o.onLearn(v); p.querySelector('.note').textContent=msg||''; head(); return; }
      if(k==='0'){ o.reset(); fill(); return; }
      if(k==='s-') v.size*=0.96; else if(k==='s+') v.size*=1.04; else if(k==='x-') v.dx-=20; else if(k==='x+') v.dx+=20;
      else if(k==='y-') v.dy-=20; else if(k==='y+') v.dy+=20; else if(k==='w-') v.ww-=0.03; else if(k==='w+') v.ww+=0.03;
      put(v); });

    // ── on the fish: select, drag, pinch ──
    function pt(e){ var m=svg.getScreenCTM(); if(!m) return {x:0,y:0}; var q=svg.createSVGPoint(); q.x=e.clientX; q.y=e.clientY; q=q.matrixTransform(m.inverse()); return {x:q.x,y:q.y}; }
    function bboxSvg(){ var t=o.text(); if(!t) return null; var r=t.getBoundingClientRect(), m=svg.getScreenCTM(); if(!m||!r.width) return null; var inv=m.inverse(), a=svg.createSVGPoint(), b=svg.createSVGPoint();
      a.x=r.left; a.y=r.top; b.x=r.right; b.y=r.bottom; a=a.matrixTransform(inv); b=b.matrixTransform(inv); return {x:a.x,y:a.y,w:b.x-a.x,h:b.y-a.y}; }
    function box(){ if(!on){ if(sel){ sel.remove(); handle.remove(); sel=handle=null; } return; } var bb=bboxSvg(); if(!bb) return;
      if(!sel){ sel=document.createElementNS(NS,'rect'); sel.setAttribute('class','wtsel'); handle=document.createElementNS(NS,'circle'); handle.setAttribute('class','wth'); handle.setAttribute('r','46'); svg.appendChild(sel); svg.appendChild(handle); }
      sel.setAttribute('x',r1(bb.x-30)); sel.setAttribute('y',r1(bb.y-30)); sel.setAttribute('width',r1(bb.w+60)); sel.setAttribute('height',r1(bb.h+60));
      handle.setAttribute('cx',r1(bb.x+bb.w+30)); handle.setAttribute('cy',r1(bb.y+bb.h+30)); }
    function select(x){ on=x; svg.style.touchAction=x?'none':''; box(); }
    function inWord(q){ var bb=bboxSvg(); return bb&&q.x>=bb.x-60&&q.x<=bb.x+bb.w+60&&q.y>=bb.y-60&&q.y<=bb.y+bb.h+60; }
    svg.addEventListener('pointerdown',function(e){ var q=pt(e), onHandle=on&&handle&&e.target===handle;
      if(!onHandle&&!inWord(q)){ if(on&&!Object.keys(ptrs).length) select(false); return; }
      if(!on) select(true);
      e.preventDefault(); try{ svg.setPointerCapture(e.pointerId); }catch(x){}
      ptrs[e.pointerId]=q; var v=cur(), ids=Object.keys(ptrs), bb=bboxSvg();
      start={v:v,mode:onHandle?'handle':ids.length>=2?'pinch':'drag',q:q,c:bb?{x:bb.x+bb.w/2,y:bb.y+bb.h/2}:q};
      if(start.mode==='pinch'){ var a=ptrs[ids[0]], b=ptrs[ids[1]]; start.d=Math.hypot(a.x-b.x,a.y-b.y)||1; }
      if(start.mode==='handle') start.d=Math.hypot(q.x-start.c.x,q.y-start.c.y)||1; });
    svg.addEventListener('pointermove',function(e){ if(!start||!ptrs[e.pointerId]) return; e.preventDefault(); var q=pt(e); ptrs[e.pointerId]=q; var v=Object.assign({},start.v), ids=Object.keys(ptrs);
      if(start.mode==='pinch'&&ids.length>=2){ var a=ptrs[ids[0]], b=ptrs[ids[1]]; v.size=start.v.size*Math.hypot(a.x-b.x,a.y-b.y)/start.d; }
      else if(start.mode==='handle'){ v.size=start.v.size*Math.hypot(q.x-start.c.x,q.y-start.c.y)/start.d; }
      else { v.dx=start.v.dx+(q.x-start.q.x); v.dy=start.v.dy+(q.y-start.q.y); }
      v.size=Math.max(60,Math.min(1600,v.size)); o.set(v); fill(); });
    function up(e){ if(!ptrs[e.pointerId]) return; delete ptrs[e.pointerId]; var ids=Object.keys(ptrs);
      if(ids.length===1){ var q=ptrs[ids[0]]; start={v:cur(),mode:'drag',q:q}; } else if(!ids.length){ start=null; if(o.done) o.done(); } }
    svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',up);
    svg.addEventListener('wheel',function(e){ if(!on) return; e.preventDefault(); var v=cur(); v.size*=e.deltaY<0?1.03:0.97; put(v); if(o.done) o.done(); },{passive:false});
    document.addEventListener('pointerdown',function(e){ if(on&&!svg.contains(e.target)&&!p.contains(e.target)) select(false); });
    fill();
    return {refresh:fill};
  }
  // the learned rule for a word of n letters: the same letter count if there is one, otherwise between the two nearest
  function ruleFor(rules,n){ if(!rules) return null; var ks=Object.keys(rules).map(Number).sort(function(a,b){ return a-b; }); if(!ks.length) return null;
    if(rules[n]) return Object.assign({exact:true,n:n},rules[n]);
    var lo=null,hi=null; ks.forEach(function(k){ if(k<n) lo=k; if(k>n&&hi==null) hi=k; });
    if(lo!=null&&hi!=null){ var A=rules[lo],B=rules[hi],t=(n-lo)/(hi-lo); return {size:A.size+(B.size-A.size)*t,dx:A.dx+(B.dx-A.dx)*t,dy:A.dy+(B.dy-A.dy)*t,ww:A.ww+(B.ww-A.ww)*t,n:n,between:[lo,hi]}; }
    var k=lo!=null?lo:hi, R=rules[k]; return Object.assign({n:n,near:k},R); }
  window.MFWordTool={attach:attach,ruleFor:ruleFor};
})();
