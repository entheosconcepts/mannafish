/* Card back editor (Ken, 17 Nov: "a tool for all the text on the back of the decal so I can determine what size it is and where it's positioned
   for each line ... spread the width of the definition or the height and location of each section ... in line").
   The page is written by tools/print/make.mjs: the real back (the same HTML, fonts and fit code the printer files use) with every line marked data-b.
   Here each block gets: size %, width %, height %, and a shift in mm. Saved to /api/print-adjust; the next build of the run applies them. */
(function(){
  var MM=96/25.4, RUN=window.MF_RUN||'', A=JSON.parse(JSON.stringify(window.MF_ADJ||{})), sel='', k=1, zoomMode='fit';
  var NAMES={title:'Title',gword:'Greek word',glabel:'GREEK + sound',gdef:'Greek definition',gstrong:'Greek Strong’s',hword:'Hebrew word',hlabel:'HEBREW + sound',hdef:'Hebrew definition',hstrong:'Hebrew Strong’s',
    r1n:'Verse 1 reference',r1q:'Verse 1 words',r2n:'Verse 2 reference',r2q:'Verse 2 words',r3n:'Verse 3 reference',r3q:'Verse 3 words',r4n:'Verse 4 reference',r4q:'Verse 4 words',
    r5n:'Verse 5 reference',r5q:'Verse 5 words',r6n:'Verse 6 reference',r6q:'Verse 6 words',kickL:'MannaFish logo (top left)',kickN:'Not for resale (top left)',kickR:'Word Study Devotional (top right)',sponsor:'SPONSORED BY',logo:'Sponsor logo',qrL:'Left QR code',labL:'Left QR words',qrR:'Right QR code',labR:'Right QR words'};
  var DEF={s:100,sx:100,sy:100,dx:0,dy:0};
  function $(id){ return document.getElementById(id); }
  function el(n){ return document.querySelector('[data-b="'+n+'"]'); }
  var names=Object.keys(NAMES).filter(function(n){ return el(n); });
  var stage=$('stage'), card=document.querySelector('.card'), pg=document.querySelector('.pg');
  var base={};
  function measure(){ names.forEach(function(n){ var e=el(n), cs=getComputedStyle(e); base[n]={fs:parseFloat(cs.fontSize), w:e.offsetWidth, h:e.offsetHeight, text:!/^(qr|logo)/.test(n)}; }); }
  function val(n,key){ var a=A[n]; return a&&a[key]!=null?a[key]:DEF[key]; }
  function apply(n){ var e=el(n), a=A[n]; if(!a||!Object.keys(a).length){ e.style.transform=''; return; }
    var s=val(n,'s')/100, x=s*val(n,'sx')/100, y=s*val(n,'sy')/100; e.style.transformOrigin='center center';
    e.style.transform='translate('+val(n,'dx')+'mm,'+val(n,'dy')+'mm) scale('+x+','+y+')'; }
  function setv(n,key,v){ v=+v; if(!isFinite(v)) return; A[n]=A[n]||{}; if(Math.abs(v-DEF[key])<1e-9) delete A[n][key]; else A[n][key]=+v.toFixed(2); if(!Object.keys(A[n]).length) delete A[n]; apply(n); refresh(); }
  function mmOf(px){ return px/MM; }
  function box(n){ var e=el(n), r=e.getBoundingClientRect(), c=card.getBoundingClientRect(); return {x:(r.left-c.left)/k/MM, y:(r.top-c.top)/k/MM, w:r.width/k/MM, h:r.height/k/MM}; }
  function f1(v){ return (Math.round(v*10)/10).toFixed(1); }
  function size(n){ var b=base[n]; if(!b) return null; var m=mmOf(b.fs)*val(n,'s')/100*val(n,'sy')/100; return m; }

  /* ---- the page around the card ---- */
  var css=document.createElement('style'); css.textContent=
   ':root{--bg:#0f1318;--panel:#171d24;--line:#2b3540;--text:#eef2f4;--dim:#9fb0c2;--acc:#f5d76e;--blue:#2a5fb0;color-scheme:dark}'+
   '@media (prefers-color-scheme:light){:root:not([data-theme=dark]){--bg:#f3f1ea;--panel:#fff;--line:#d8d4c8;--text:#1c2228;--dim:#5b6570;--acc:#8a6a00;color-scheme:light}}'+
   'body{margin:0;background:var(--bg);color:var(--text);font:15px/1.4 system-ui,sans-serif;padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:max(12px,env(safe-area-inset-right,0px))}'+
   '#ui{max-width:1500px;margin:0 auto;padding:12px 0 40px}h1{font-size:1.15rem;margin:.2rem 0}.sub{color:var(--dim);font-size:.85rem;margin:0 0 10px}'+
   '.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 12px}.bar button,.bar select{font:600 .9rem system-ui;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:10px;padding:9px 13px;cursor:pointer}'+
   '.bar button.go{background:var(--blue);border-color:var(--blue);color:#fff}.msg{color:var(--acc);font-weight:700;min-height:1.3em}'+
   '.cols{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:14px;align-items:start}@media (max-width:900px){.cols{grid-template-columns:1fr}}'+
   '#wrap{background:#000;border:1px solid var(--line);border-radius:12px;padding:10px;overflow:auto}#stage{transform-origin:top left;position:relative;display:inline-block}'+
   '.panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px}.panel h2{font-size:1rem;margin:0 0 6px}'+
   '.row{display:grid;grid-template-columns:92px 1fr 74px;gap:8px;align-items:center;margin:7px 0}.row label{font-size:.85rem;color:var(--dim)}.row input[type=number]{width:100%;box-sizing:border-box;font:inherit;padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--text)}.row input[type=range]{width:100%}'+
   '.read{font-size:.88rem;line-height:1.55}.read b{color:var(--acc)}.hint{font-size:.8rem;color:var(--dim)}'+
   'table{border-collapse:collapse;width:100%;font-size:.78rem}th,td{padding:4px 5px;text-align:right;border-bottom:1px solid var(--line)}th:first-child,td:first-child{text-align:left}tr.t{cursor:pointer}tr.t:hover,tr.on{background:rgba(245,215,110,.14)}td.ch{color:var(--acc);font-weight:700}'+
   '[data-b]{cursor:move}.sel{outline:.25mm solid #ffd23f;outline-offset:.3mm}.guide{position:absolute;pointer-events:none}.hideg .guide{display:none}'+
   '@page{size:4.75in 3in;margin:0}@media print{body{background:#fff;padding:0}#ui .bar,#ui h1,#ui .sub,#ui .panel,.cols>div:last-child{display:none!important}#ui{padding:0;max-width:none}.cols{display:block}#wrap{border:0;padding:0;background:none;overflow:visible}#stage{transform:none!important}.guide{display:none!important}.sel{outline:0}}';
  document.head.appendChild(css);
  var ui=document.createElement('div'); ui.id='ui'; var wrap=document.createElement('div'); wrap.id='wrap'; stage.parentNode.insertBefore(ui,stage.parentNode.firstChild);
  wrap.appendChild(stage);
  ui.innerHTML='<h1>Card back editor · '+RUN+'</h1><p class="sub">Click a line (or pick it in the list), then change its size, width, height or place. Drag it, or use the arrow keys (0.1 mm; Shift 0.5 mm). What you see is what prints.</p>'+
    '<div class="bar"><button class="go" id="bSave">Save</button><button id="bCopy">Copy settings</button><button id="bPrint">Print actual size</button><button id="bResetAll">Reset all lines</button><button id="bGuides">Guides: on</button>'+
    '<select id="zoom"><option value="fit">Zoom: fit</option><option value="2">2x</option><option value="3">3x</option><option value="1">1x (actual)</option></select><span class="msg" id="msg" role="status"></span></div>'+
    '<div class="cols"><div id="left"></div><div id="right"><div class="panel" id="ctl"></div><div class="panel"><h2>Every line</h2><div style="overflow:auto"><table id="tbl"></table></div><p class="hint">Size is the text size in mm (and points). x and y are where the line’s box starts, measured from the card’s top-left corner (card = 4.5 x 2.75 in = 114.3 x 69.85 mm).</p></div></div></div>';
  $('left').appendChild(wrap);
  var g1=document.createElement('div'); g1.className='guide'; g1.style.cssText='inset:0;border:.2mm dashed #ff4dff'; card.appendChild(g1);
  var g2=document.createElement('div'); g2.className='guide'; g2.style.cssText='inset:3mm;border:.15mm dotted #ffd23f'; card.appendChild(g2);

  function ctl(){ var h='<h2 id="cname"></h2><div class="read" id="read"></div>';
    [['s','Size %',30,250,1],['sx','Width %',30,250,1],['sy','Height %',30,250,1],['dx','Left / right mm',-30,30,.1],['dy','Up / down mm',-30,30,.1]].forEach(function(r){
      h+='<div class="row"><label>'+r[1]+'</label><input type="range" id="r_'+r[0]+'" min="'+r[2]+'" max="'+r[3]+'" step="'+r[4]+'"><input type="number" id="n_'+r[0]+'" step="'+r[4]+'"></div>'; });
    h+='<div class="bar"><button id="bReset">Reset this line</button></div><p class="hint">Size scales the whole line. Width and height stretch it on top of that. Left/right and up/down move it (+ is right and down).</p>';
    $('ctl').innerHTML=h;
    ['s','sx','sy','dx','dy'].forEach(function(key){ var r=$('r_'+key), n=$('n_'+key);
      r.addEventListener('input',function(){ if(sel) setv(sel,key,r.value); }); n.addEventListener('input',function(){ if(sel) setv(sel,key,n.value); }); });
    $('bReset').addEventListener('click',function(){ if(sel){ delete A[sel]; apply(sel); refresh(); } }); }
  function refresh(){
    var has=!!sel; $('cname').textContent=has?NAMES[sel]:'Pick a line';
    ['s','sx','sy','dx','dy'].forEach(function(key){ var v=has?val(sel,key):DEF[key]; $('r_'+key).value=v; if(document.activeElement!==$('n_'+key)) $('n_'+key).value=v; $('r_'+key).disabled=!has; $('n_'+key).disabled=!has; });
    if(has){ var b=box(sel), sz=size(sel), t=base[sel];
      $('read').innerHTML=(t.text?'Text size <b>'+f1(sz)+' mm</b> ('+f1(sz*72/25.4)+' pt; the capital letters are about 70% of that)<br>':'Picture size <b>'+f1(b.w)+' x '+f1(b.h)+' mm</b><br>')+'Width <b>'+val(sel,'sx')+'%</b> · height <b>'+val(sel,'sy')+'%</b> · size <b>'+val(sel,'s')+'%</b><br>Box starts <b>x '+f1(b.x)+'</b> · <b>y '+f1(b.y)+' mm</b>, '+f1(b.w)+' x '+f1(b.h)+' mm<br>Moved <b>'+f1(val(sel,'dx'))+'</b> right, <b>'+f1(val(sel,'dy'))+'</b> down'; }
    else $('read').textContent='Click a line on the card, or a row in the list below.';
    var rows='<tr><th>Line</th><th>size mm</th><th>pt</th><th>wide</th><th>high</th><th>x</th><th>y</th></tr>';
    names.forEach(function(n){ var b=box(n), t=base[n], sz=size(n), ch=A[n]&&Object.keys(A[n]).length;
      rows+='<tr class="t'+(n===sel?' on':'')+'" data-n="'+n+'"><td'+(ch?' class="ch"':'')+'>'+NAMES[n]+'</td><td>'+(t.text?f1(sz):f1(b.w)+'×'+f1(b.h))+'</td><td>'+(t.text?f1(sz*72/25.4):'')+'</td><td>'+Math.round(val(n,'s')*val(n,'sx')/100)+'%</td><td>'+Math.round(val(n,'s')*val(n,'sy')/100)+'%</td><td>'+f1(b.x)+'</td><td>'+f1(b.y)+'</td></tr>'; });
    $('tbl').innerHTML=rows; }
  function select(n){ if(sel){ var o=el(sel); if(o) o.classList.remove('sel'); } sel=n||''; if(sel) el(sel).classList.add('sel'); refresh(); }
  function layoutZoom(){ var pw=pg.offsetWidth, ph=pg.offsetHeight; var av=wrap.clientWidth-22; k=zoomMode==='fit'?Math.max(.3,av/pw):+zoomMode; stage.style.transform='scale('+k+')'; stage.style.marginBottom=(ph*(k-1))+'px'; stage.style.marginRight=(pw*(k-1))+'px'; refresh(); }
  ctl(); measure(); names.forEach(apply); layoutZoom();
  window.addEventListener('resize',layoutZoom); $('zoom').addEventListener('change',function(){ zoomMode=this.value; layoutZoom(); });
  $('tbl').addEventListener('click',function(e){ var r=e.target.closest('tr.t'); if(r) select(r.getAttribute('data-n')); });
  /* click and drag on the card */
  var drag=null;
  stage.addEventListener('pointerdown',function(e){ try{ document.activeElement.blur(); }catch(x){} var t=e.target.closest('[data-b]'); if(!t) { select(''); return; } var n=t.getAttribute('data-b'); select(n);
    drag={n:n,x:e.clientX,y:e.clientY,dx:val(n,'dx'),dy:val(n,'dy')}; try{ stage.setPointerCapture(e.pointerId); }catch(x){} e.preventDefault(); });
  stage.addEventListener('pointermove',function(e){ if(!drag) return; var dx=drag.dx+(e.clientX-drag.x)/k/MM, dy=drag.dy+(e.clientY-drag.y)/k/MM; setv(drag.n,'dx',Math.round(dx*20)/20); setv(drag.n,'dy',Math.round(dy*20)/20); });
  stage.addEventListener('pointerup',function(){ drag=null; });
  document.addEventListener('keydown',function(e){ if(!sel||/INPUT|SELECT|TEXTAREA/.test((e.target.tagName||''))) return; var st=e.shiftKey?.5:.1, m={ArrowLeft:['dx',-st],ArrowRight:['dx',st],ArrowUp:['dy',-st],ArrowDown:['dy',st]}[e.key];
    if(m){ setv(sel,m[0],Math.round((val(sel,m[0])+m[1])*100)/100); e.preventDefault(); } });
  function say(t){ $('msg').textContent=t; }
  $('bGuides').addEventListener('click',function(){ var on=document.body.classList.toggle('hideg'); this.textContent='Guides: '+(on?'off':'on'); });
  $('bPrint').addEventListener('click',function(){ select(''); window.print(); });
  $('bResetAll').addEventListener('click',function(){ if(!confirm('Put every line back to the standard layout?')) return; Object.keys(A).forEach(function(n){ delete A[n]; apply(n); }); refresh(); say('All lines reset. Press Save to keep it.'); });
  $('bCopy').addEventListener('click',function(){ var t=JSON.stringify({run:RUN,adj:A}); var done=function(){ say('Copied. Paste it to Claude if Save is not working.'); };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done,function(){ window.prompt('Copy this:',t); }); else window.prompt('Copy this:',t); });
  function key(){ try{ return localStorage.getItem('mf-admin-key')||''; }catch(e){ return ''; } }
  $('bSave').addEventListener('click',function(){ var kk=key(); if(!kk){ kk=(window.prompt('Admin password (the edit sheet’s password):')||'').trim(); if(!kk) return; }
    fetch('/api/print-adjust',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({k:kk,run:RUN,adj:A})}).then(function(r){ return r.json().then(function(j){ return {r:r,j:j}; }); }).then(function(o){
      if(o.r.status===401){ try{ localStorage.removeItem('mf-admin-key'); }catch(e){} say('That password is not right.'); return; }
      if(!o.r.ok){ say('Not saved: '+(o.j&&o.j.error||o.r.status)); return; } try{ localStorage.setItem('mf-admin-key',kk); }catch(e){} say('Saved. Tell Claude “rebuild '+RUN+'” and the print files use it.'); }).catch(function(){ say('Could not reach the server. Use Copy settings instead.'); }); });
  /* the newest saved layout wins */
  if(location.protocol!=='file:') fetch('/api/print-adjust?run='+encodeURIComponent(RUN),{cache:'no-store'}).then(function(r){ return r.ok?r.json():null; }).then(function(j){
    if(j&&j.adj&&Object.keys(j.adj).length){ names.forEach(function(n){ delete A[n]; apply(n); }); Object.keys(j.adj).forEach(function(n){ if(el(n)) A[n]=j.adj[n]; }); names.forEach(apply); refresh(); say('Loaded your saved layout.'); } }).catch(function(){});
})();
