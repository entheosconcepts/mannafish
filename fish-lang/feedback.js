// "Tell us what you think" (Ken, 25 Oct), and the testers' feedback for the tweak launch (Ken, 26 Oct: "How can I launch with people to
// help me ... so it's easy for everyone to click a button and audio record changes needed, suggestions, bugs, thoughts about each
// feature"). MFfeedback.open({kind, fish, feature}) shows a sheet: what kind (bug, idea, fish design, thought, love it), which part of
// MannaFish (filled in from the page), a voice note, a screenshot, a few words, a name. Sent to /api/feedback, which writes the voice
// note out and emails MannaFish. A ?feedback=1 link opens it (the devotional email's link). A ?tester=1 link makes this phone a
// tester's: a 🎙 Feedback button stays on every page (?tester=0 takes it away).
(function(){
  if(window.MFfeedback) return;
  var es=false; try{ es=(localStorage.getItem('mf-lang')||'')==='es'; }catch(e){}
  var T=es?{h:'Cuéntanos qué piensas',sub:'Estás entre los primeros en usar MannaFish. ¿Qué te gusta? ¿Qué te confundió? ¿Qué cambiarías?',
      k:[['bug','🐞','Error'],['idea','💡','Idea'],['design','🎨','Diseño del pez'],['thought','💭','Opinión'],['love','❤️','Me encanta']],
      f:'¿Sobre qué parte?',rec:'🎙 Grabar un mensaje de voz',stop:'⏹ Parar',again:'Grabar otra vez',del:'Quitar',pic:'📷 Añadir una captura de pantalla',picx:'Quitar la imagen',
      ph:'O escríbelo aquí…',name:'Tu nombre',email:'Tu correo (opcional, para responderte)',send:'Enviar',sending:'Enviando…',
      thanks:'¡Gracias! Lo leemos y escuchamos todo.',need:'Elige un tipo, graba o escribe unas palabras.',err:'No se pudo enviar. Inténtalo de nuevo en un momento.',x:'Cerrar',
      mic:'No se pudo usar el micrófono. Permite el micrófono para este sitio, o escríbelo.',big:'El mensaje de voz es muy largo. Graba uno más corto (hasta 3 minutos).',
      fab:'🎙 Opinión',hi:'¡Gracias por probar MannaFish! Toca 🎙 Opinión cuando quieras decirnos algo.',fish:'Pez',feat:['Hoy','Devocional','Los peces','Biblia','Planes','Tiempo con Dios','Mis cosas','Juego','Canasta','Traductor','Correo','Otra cosa']}
    :{h:'Tell us what you think',sub:'You are one of the first to use MannaFish. What do you like? What confused you? What would you change?',
      k:[['bug','🐞','Bug'],['idea','💡','Idea'],['design','🎨','Fish design'],['thought','💭','Thought'],['love','❤️','Love it']],
      f:'About which part?',rec:'🎙 Record a voice note',stop:'⏹ Stop',again:'Record again',del:'Remove',pic:'📷 Add a screenshot',picx:'Remove the picture',
      ph:'Or write it here…',name:'Your name',email:'Your email (optional, for a reply)',send:'Send',sending:'Sending…',
      thanks:'Thank you! We read and listen to every one.',need:'Pick a kind, record, or write a few words.',err:'It could not be sent. Please try again in a moment.',x:'Close',
      mic:'The microphone could not be used. Allow the microphone for this site, or write it instead.',big:'That voice note is too long. Record a shorter one (up to 3 minutes).',
      fab:'🎙 Feedback',hi:'Thank you for testing MannaFish! Tap 🎙 Feedback any time to tell us something.',fish:'Fish',feat:['Today','Devotional','The fish','Bible','Plans','Time with God','My stuff','Game','Basket','Translator','Email','Something else']};
  var FEAT=['Today','Devotional','The fish','Bible','Plans','Time with God','My stuff','Game','Basket','Translator','Email','Other'], MAXS=180;
  function get(k){ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }
  function set(k,v){ try{ if(v) localStorage.setItem(k,v); else localStorage.removeItem(k); }catch(e){} }
  var q=location.search; if(/[?&]tester=1\b/.test(q)) set('mf-tester','1'); else if(/[?&]tester=0\b/.test(q)) set('mf-tester','');
  var TESTER=get('mf-tester')==='1';
  // which part of MannaFish this page is (a page can say better: window.MFfeedbackWhere)
  function where(){ try{ if(window.MFfeedbackWhere){ var w=MFfeedbackWhere(); if(w) return w; } }catch(e){}
    if(document.querySelector('.mfbk:not([hidden])')) return 'Basket';
    var p=location.pathname; return /^\/bible/.test(p)?'Bible':/^\/plan/.test(p)?'Plans':/^\/pray/.test(p)?'Time with God':/^\/you/.test(p)?'My stuff':/^\/(go|match)/.test(p)?'Game':/^\/translate/.test(p)?'Translator':/feedback=1/.test(q)?'Email':'Today'; }
  var BOX=null, S0={}, REC=null;
  function css(){ if(document.getElementById('mfFbCss')) return; var s=document.createElement('style'); s.id='mfFbCss';
    s.textContent='.mffb{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}.mffb[hidden]{display:none}'
      +'.mffb .in{position:relative;width:100%;max-width:520px;max-height:calc(100dvh - 12px);overflow:auto;background:#12161c;color:#eaf0f0;border:1px solid rgba(255,255,255,.14);border-radius:22px 22px 0 0;padding:18px 18px max(18px,env(safe-area-inset-bottom));font:16px/1.45 Archivo,system-ui,sans-serif;text-align:left}'
      +'@media(min-width:640px){.mffb{align-items:center}.mffb .in{border-radius:22px}}:root[data-mode=light] .mffb .in{background:#fbfaf6;color:#1c2228;border-color:rgba(0,0,0,.12)}'
      +'.mffb h3{margin:0 44px 4px 0;font:800 1.25rem Archivo,sans-serif}.mffb p{margin:0 0 12px;opacity:.85;font-size:.95rem}.mffb .x{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:none;color:inherit;font-size:1rem;cursor:pointer}'
      +'.mffb .mo{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:0 0 10px}.mffb .mo button{border:1px solid rgba(128,128,128,.4);background:none;color:inherit;border-radius:14px;padding:7px 1px;font:700 .68rem Archivo,sans-serif;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1.15}'
      +'.mffb .mo button b{font-size:1.4rem;line-height:1.1}.mffb .mo button[aria-pressed=true]{background:#2a5fb0;border-color:#2a5fb0;color:#fff}'
      +'.mffb label.ft{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-weight:700;font-size:.9rem}.mffb select{flex:1;min-width:0;font:inherit;color:inherit;background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.35);border-radius:999px;padding:7px 10px}'
      +'.mffb .fishc{display:inline-block;margin:0 0 10px;padding:5px 10px;border-radius:999px;background:rgba(68,143,241,.18);font-weight:700;font-size:.85rem}'
      +'.mffb .rec{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}.mffb .rec button,.mffb .pk{border:1px solid rgba(128,128,128,.45);background:none;color:inherit;border-radius:999px;padding:9px 14px;font:700 .92rem Archivo,sans-serif;cursor:pointer}'
      +'.mffb .rec .on{background:#e5484d;border-color:#e5484d;color:#fff}.mffb .rec audio{flex:1 1 100%;width:100%;height:38px}.mffb .rec .t{font-variant-numeric:tabular-nums;font-weight:800}'
      +'.mffb .shot{display:flex;align-items:center;gap:10px;margin:0 0 10px}.mffb .shot img{width:64px;height:64px;object-fit:cover;border-radius:10px}.mffb .shot input{display:none}'
      +'.mffb textarea,.mffb input.tx{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.35);border-radius:12px;padding:10px 12px;margin:0 0 8px}.mffb textarea{min-height:80px;resize:vertical}'
      +'.mffb .go{width:100%;border:0;border-radius:999px;background:#2a5fb0;color:#fff;font:800 1.02rem Archivo,sans-serif;padding:13px;cursor:pointer;margin-top:4px}.mffb .go[disabled]{opacity:.5}.mffb .msg{margin:8px 0 0;font-size:.92rem;min-height:1.2em}'
      +'.mffbfab{position:fixed;left:12px;bottom:max(16px,env(safe-area-inset-bottom));z-index:80;border:0;border-radius:999px;background:#e5484d;color:#fff;font:800 .92rem Archivo,system-ui,sans-serif;padding:9px 14px;cursor:pointer;box-shadow:0 10px 30px -8px #000}'
      +'body.mftabbed .mffbfab{bottom:calc(92px + env(safe-area-inset-bottom))}.mffbhi{position:fixed;left:50%;transform:translateX(-50%);top:calc(14px + env(safe-area-inset-top));z-index:131;max-width:calc(100% - 24px);background:#fff;color:#111;border-radius:16px;padding:10px 16px;font:700 .92rem Archivo,sans-serif;box-shadow:0 10px 30px -8px #000}';
    document.head.appendChild(s); }
  function esc(v){ return String(v||'').replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function close(){ stopRec(true); if(BOX) BOX.hidden=true; }
  function open(o){ o=o||{}; css(); var S={}; try{ S=JSON.parse(localStorage.getItem('mf-ship')||'{}')||{}; }catch(e){} var me=window.MFacct&&MFacct.me&&MFacct.me();
    var fish=o.fish; if(!fish&&window.MFfeedbackFish) try{ fish=MFfeedbackFish(); }catch(e){}
    S0={kind:o.kind||'',fish:fish||'',audio:null,image:null};
    if(!BOX){ BOX=document.createElement('div'); BOX.className='mffb'; BOX.setAttribute('role','dialog'); BOX.setAttribute('aria-modal','true'); BOX.setAttribute('aria-label',T.h); document.body.appendChild(BOX);
      BOX.addEventListener('click',click); BOX.addEventListener('change',pickImage);
      BOX.addEventListener('submit',function(e){ e.preventDefault(); send(); });
      document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&BOX&&!BOX.hidden) close(); }); }
    var w=o.feature||where();
    BOX.innerHTML='<form class="in" novalidate><button type="button" class="x" aria-label="'+T.x+'">&#10005;</button><h3>'+(TESTER?'🎙 ':'💬 ')+T.h+'</h3><p>'+T.sub+'</p>'
      +'<div class="mo" role="group">'+T.k.map(function(k){ return '<button type="button" data-kind="'+k[0]+'" aria-pressed="'+(S0.kind===k[0])+'"><b>'+k[1]+'</b>'+k[2]+'</button>'; }).join('')+'</div>'
      +'<label class="ft">'+T.f+'<select id="mfFbF">'+FEAT.map(function(f,i){ return '<option value="'+f+'"'+(f===w?' selected':'')+'>'+T.feat[i]+'</option>'; }).join('')+'</select></label>'
      +(S0.fish?'<span class="fishc">🐟 '+T.fish+': '+esc(S0.fish)+'</span>':'')
      +'<div class="rec" id="mfFbRec"></div>'
      +'<div class="shot" id="mfFbShot"></div>'
      +'<textarea id="mfFbT" maxlength="3000" placeholder="'+T.ph+'"></textarea><input class="tx" id="mfFbN" autocomplete="name" placeholder="'+T.name+'" value="'+esc(get('mf-fb-name')||S.name||'')+'"><input class="tx" id="mfFbE" type="email" autocomplete="email" placeholder="'+T.email+'" value="'+esc(S.email||(me&&me.email)||'')+'">'
      +'<input id="mfFbH" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit" class="go">'+T.send+'</button><p class="msg" aria-live="polite"></p></form>';
    recUI(); shotUI(); BOX.hidden=false; }
  function msg(t){ var m=BOX&&BOX.querySelector('.msg'); if(m) m.textContent=t; }
  function click(e){ if(e.target===BOX||e.target.closest('.x')){ close(); return; }
    var k=e.target.closest('[data-kind]'); if(k){ S0.kind=S0.kind===k.dataset.kind?'':k.dataset.kind; [].forEach.call(BOX.querySelectorAll('[data-kind]'),function(b){ b.setAttribute('aria-pressed',String(b.dataset.kind===S0.kind)); }); return; }
    var a=e.target.closest('[data-rec]'); if(a){ var d=a.dataset.rec; if(d==='go') startRec(); else if(d==='stop') stopRec(); else if(d==='del'){ S0.audio=null; recUI(); } return; }
    if(e.target.closest('[data-picx]')){ S0.image=null; shotUI(); } }
  // ── a voice note (up to 3 minutes) ──
  function recUI(){ var el=BOX&&BOX.querySelector('#mfFbRec'); if(!el) return;
    if(REC) el.innerHTML='<button type="button" class="on" data-rec="stop">'+T.stop+'</button><span class="t" id="mfFbTm">0:00</span>';
    else if(S0.audio) el.innerHTML='<audio controls src="'+S0.audio.url+'"></audio><button type="button" data-rec="go">'+T.again+'</button><button type="button" data-rec="del">'+T.del+'</button>';
    else el.innerHTML=window.MediaRecorder&&navigator.mediaDevices?'<button type="button" data-rec="go">'+T.rec+'</button>':''; }
  function startRec(){ navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
      var mt=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg'].filter(function(m){ return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m); })[0]||'';
      var mr=new MediaRecorder(st,mt?{mimeType:mt}:undefined), parts=[], t0=Date.now();
      REC={mr:mr,st:st,t0:t0,tick:setInterval(function(){ var s=Math.floor((Date.now()-t0)/1000), el=BOX.querySelector('#mfFbTm'); if(el) el.textContent=Math.floor(s/60)+':'+('0'+s%60).slice(-2); if(s>=MAXS) stopRec(); },500)};
      mr.ondataavailable=function(e){ if(e.data&&e.data.size) parts.push(e.data); };
      mr.onstop=function(){ var r=REC; REC=null; if(r){ clearInterval(r.tick); r.st.getTracks().forEach(function(x){ x.stop(); }); }
        if(!r||r.drop||!parts.length){ recUI(); return; } var b=new Blob(parts,{type:(mr.mimeType||mt||'audio/webm').split(';')[0]});
        S0.audio={blob:b,url:URL.createObjectURL(b),sec:Math.round((Date.now()-t0)/1000)}; recUI(); };
      mr.start(1000); recUI(); }).catch(function(){ msg(T.mic); }); }
  function stopRec(drop){ if(!REC) return; REC.drop=!!drop; try{ REC.mr.stop(); }catch(e){} }
  // ── a screenshot, made smaller before it is sent ──
  function shotUI(){ var el=BOX&&BOX.querySelector('#mfFbShot'); if(!el) return;
    el.innerHTML=S0.image?'<img src="'+S0.image.url+'" alt=""><button type="button" class="pk" data-picx="1">'+T.picx+'</button>':'<label class="pk">'+T.pic+'<input type="file" accept="image/*" id="mfFbP"></label>'; }
  function pickImage(e){ if(e.target.id!=='mfFbP'||!e.target.files||!e.target.files[0]) return; var f=e.target.files[0], im=new Image(), u=URL.createObjectURL(f);
    im.onload=function(){ var k=Math.min(1,1600/Math.max(im.width,im.height)), c=document.createElement('canvas'); c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height); URL.revokeObjectURL(u); c.toBlob(function(b){ if(!b) return; S0.image={blob:b,url:URL.createObjectURL(b)}; shotUI(); },'image/jpeg',.82); };
    im.src=u; }
  function b64(blob){ return new Promise(function(res){ if(!blob) return res(null); var r=new FileReader(); r.onload=function(){ res(String(r.result).split(',')[1]||''); }; r.readAsDataURL(blob); }); }
  function send(){ var v=function(id){ var e=BOX.querySelector('#'+id); return e?e.value.trim():''; }, go=BOX.querySelector('.go');
    if(REC){ stopRec(); setTimeout(send,400); return; }
    if(!S0.kind&&!v('mfFbT')&&!S0.audio&&!S0.image){ msg(T.need); return; }
    if(S0.audio&&S0.audio.blob.size>4.4*1024*1024){ msg(T.big); return; }
    set('mf-fb-name',v('mfFbN')); go.disabled=true; msg(T.sending);
    Promise.all([b64(S0.audio&&S0.audio.blob),b64(S0.image&&S0.image.blob)]).then(function(B){
      return fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({kind:S0.kind,feature:v('mfFbF'),fish:S0.fish,text:v('mfFbT'),name:v('mfFbN'),email:v('mfFbE'),hp:v('mfFbH'),
        page:location.pathname+location.search,lang:es?'es':'en',tester:TESTER,audio:B[0]?{b64:B[0],mime:S0.audio.blob.type,sec:S0.audio.sec}:null,image:B[1]?{b64:B[1],mime:'image/jpeg'}:null})}); })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok||!j.ok) throw new Error(j.error||''); }); })
      .then(function(){ BOX.querySelector('.in').innerHTML='<button type="button" class="x" aria-label="'+T.x+'">&#10005;</button><h3>🐟 '+T.thanks+'</h3><button type="button" class="go x" style="position:static;width:100%;height:auto;border-radius:999px">OK</button>'; },
            function(err){ go.disabled=false; msg((err&&err.message)||T.err); }); }
  // ── testers: the 🎙 button on every page, and a word of thanks the first time ──
  function fab(){ if(!TESTER||document.querySelector('.mffbfab')) return; css(); var b=document.createElement('button'); b.type='button'; b.className='mffbfab'; b.textContent=T.fab;
    b.addEventListener('click',function(){ open(); }); document.body.appendChild(b);
    if(!get('mf-tester-hi')){ set('mf-tester-hi','1'); var h=document.createElement('div'); h.className='mffbhi'; h.textContent=T.hi; document.body.appendChild(h); setTimeout(function(){ h.remove(); },6000); } }
  window.MFfeedback={open:open,close:close,tester:TESTER,label:'💬 '+T.h};
  function ready(fn){ if(document.body) fn(); else document.addEventListener('DOMContentLoaded',fn); }
  ready(function(){ setTimeout(fab,300); if(/[?&]feedback=1\b/.test(q)) setTimeout(function(){ open(); },600); });
})();
