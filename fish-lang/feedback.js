// "Tell us what you think" (Ken, 25 Oct: before launch, a simple way for the first readers to say what they like, what confused them,
// and what they would change). MFfeedback.open() shows a small sheet: how is it going (one tap), a few words, a name and email if they
// like; sent to /api/feedback, which emails MannaFish. Any page can open it; a link with ?feedback=1 opens it at once (the email's link).
(function(){
  if(window.MFfeedback) return;
  var es=false; try{ es=(localStorage.getItem('mf-lang')||'')==='es'; }catch(e){}
  var T=es?{h:'Cuéntanos qué piensas',sub:'Estás entre los primeros en usar MannaFish. ¿Qué te gusta? ¿Qué te confundió? ¿Qué cambiarías?',
      m:[['love','😊','Me encanta'],['good','🙂','Bien'],['confused','😕','Confuso'],['broken','🐞','Algo no funciona']],
      ph:'Escribe aquí…',name:'Tu nombre (opcional)',email:'Tu correo (opcional, para responderte)',send:'Enviar',sending:'Enviando…',
      thanks:'¡Gracias! Lo leemos todo.',need:'Toca una cara o escribe unas palabras.',err:'No se pudo enviar. Inténtalo de nuevo en un momento.',x:'Cerrar'}
    :{h:'Tell us what you think',sub:'You are one of the first to use MannaFish. What do you like? What confused you? What would you change?',
      m:[['love','😊','Love it'],['good','🙂','Good'],['confused','😕','Confusing'],['broken','🐞','Something broke']],
      ph:'Write here…',name:'Your name (optional)',email:'Your email (optional, for a reply)',send:'Send',sending:'Sending…',
      thanks:'Thank you! We read every one.',need:'Tap a face or write a few words.',err:'It could not be sent. Please try again in a moment.',x:'Close'};
  var BOX=null, MOOD='';
  function css(){ if(document.getElementById('mfFbCss')) return; var s=document.createElement('style'); s.id='mfFbCss';
    s.textContent='.mffb{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}.mffb[hidden]{display:none}'
      +'.mffb .in{position:relative;width:100%;max-width:520px;max-height:calc(100dvh - 12px);overflow:auto;background:#12161c;color:#eaf0f0;border:1px solid rgba(255,255,255,.14);border-radius:22px 22px 0 0;padding:18px 18px max(18px,env(safe-area-inset-bottom));font:16px/1.45 Archivo,system-ui,sans-serif;text-align:left}'
      +'@media(min-width:640px){.mffb{align-items:center}.mffb .in{border-radius:22px}}:root[data-mode=light] .mffb .in{background:#fbfaf6;color:#1c2228;border-color:rgba(0,0,0,.12)}'
      +'.mffb h3{margin:0 44px 4px 0;font:800 1.25rem Archivo,sans-serif}.mffb p{margin:0 0 12px;opacity:.85;font-size:.95rem}.mffb .x{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(128,128,128,.45);background:none;color:inherit;font-size:1rem;cursor:pointer}'
      +'.mffb .mo{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 10px}.mffb .mo button{border:1px solid rgba(128,128,128,.4);background:none;color:inherit;border-radius:14px;padding:8px 2px;font:700 .74rem Archivo,sans-serif;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}'
      +'.mffb .mo button b{font-size:1.5rem;line-height:1.1}.mffb .mo button[aria-pressed=true]{background:#2a5fb0;border-color:#2a5fb0;color:#fff}'
      +'.mffb textarea,.mffb input{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.35);border-radius:12px;padding:10px 12px;margin:0 0 8px}.mffb textarea{min-height:110px;resize:vertical}'
      +'.mffb .go{width:100%;border:0;border-radius:999px;background:#2a5fb0;color:#fff;font:800 1.02rem Archivo,sans-serif;padding:13px;cursor:pointer;margin-top:4px}.mffb .go[disabled]{opacity:.5}.mffb .msg{margin:8px 0 0;font-size:.92rem;min-height:1.2em}';
    document.head.appendChild(s); }
  function close(){ if(BOX) BOX.hidden=true; }
  function open(){ css(); var S={}; try{ S=JSON.parse(localStorage.getItem('mf-ship')||'{}')||{}; }catch(e){} var me=window.MFacct&&MFacct.me&&MFacct.me();
    if(!BOX){ BOX=document.createElement('div'); BOX.className='mffb'; BOX.setAttribute('role','dialog'); BOX.setAttribute('aria-modal','true'); BOX.setAttribute('aria-label',T.h); document.body.appendChild(BOX);
      BOX.addEventListener('click',function(e){ if(e.target===BOX||e.target.closest('.x')){ close(); return; } var m=e.target.closest('[data-mood]'); if(m){ MOOD=MOOD===m.dataset.mood?'':m.dataset.mood; [].forEach.call(BOX.querySelectorAll('[data-mood]'),function(b){ b.setAttribute('aria-pressed',String(b.dataset.mood===MOOD)); }); } });
      BOX.addEventListener('submit',function(e){ e.preventDefault(); send(); });
      document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&BOX&&!BOX.hidden) close(); }); }
    MOOD=''; var esc=function(v){ return String(v||'').replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
    BOX.innerHTML='<form class="in" novalidate><button type="button" class="x" aria-label="'+T.x+'">&#10005;</button><h3>💬 '+T.h+'</h3><p>'+T.sub+'</p>'
      +'<div class="mo" role="group">'+T.m.map(function(m){ return '<button type="button" data-mood="'+m[0]+'" aria-pressed="false"><b>'+m[1]+'</b>'+m[2]+'</button>'; }).join('')+'</div>'
      +'<textarea id="mfFbT" maxlength="3000" placeholder="'+T.ph+'"></textarea><input id="mfFbN" autocomplete="name" placeholder="'+T.name+'" value="'+esc(S.name||'')+'"><input id="mfFbE" type="email" autocomplete="email" placeholder="'+T.email+'" value="'+esc(S.email||(me&&me.email)||'')+'">'
      +'<input id="mfFbH" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit" class="go">'+T.send+'</button><p class="msg" aria-live="polite"></p></form>';
    BOX.hidden=false; setTimeout(function(){ var t=BOX.querySelector('#mfFbT'); if(t) t.focus(); },120); }
  function send(){ var v=function(id){ var e=BOX.querySelector('#'+id); return e?e.value.trim():''; }, m=BOX.querySelector('.msg'), go=BOX.querySelector('.go');
    if(!MOOD&&!v('mfFbT')){ m.textContent=T.need; return; }
    go.disabled=true; m.textContent=T.sending;
    fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mood:MOOD,text:v('mfFbT'),name:v('mfFbN'),email:v('mfFbE'),hp:v('mfFbH'),page:location.pathname+location.search,lang:es?'es':'en'})})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok||!j.ok) throw 0; }); })
      .then(function(){ BOX.querySelector('.in').innerHTML='<button type="button" class="x" aria-label="'+T.x+'">&#10005;</button><h3>🐟 '+T.thanks+'</h3><button type="button" class="go x" style="position:static;width:100%;height:auto;border-radius:999px">OK</button>'; },
            function(){ go.disabled=false; m.textContent=T.err; }); }
  window.MFfeedback={open:open,close:close,label:'💬 '+T.h};
  if(/[?&]feedback=1\b/.test(location.search)){ var go=function(){ open(); }; if(document.body) setTimeout(go,600); else document.addEventListener('DOMContentLoaded',function(){ setTimeout(go,600); }); }
})();
