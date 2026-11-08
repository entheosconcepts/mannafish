// Admin view (Ken, 3 Nov: "an admin button on this user side so when I get help testing ... toggle between admin and user to make
// initial tweaks before launching a family and friends version"). Anyone with the admin password (MF_ADMIN_KEY, the edit sheet's
// password; it is checked by the server, never kept in the page) can switch a phone or computer to Admin view: a small 🛠 Admin
// button stays in the corner with Edit this fish, the edit sheet, the admin pages and the test checklist, and "Switch to user view"
// puts everything back exactly as a visitor sees it. Loaded on every page by basket.js.
//   MFadmin.on()  MFadmin.toggle()  window.MFadminFish = function(){ return {word, key} }   (the fish on screen, for Edit this fish)
(function(){
  if(window.MFadmin) return;
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k)||''; if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){ return ''; } }
  function on(){ return ls('mf-admin-on')==='1'&&!!ls('mf-admin-key'); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var CHECK='https://claude.ai/artifact/2gfCAuZVbo3gFVsn2o3HVn';
  function css(){ if(document.getElementById('mfAdmCss')) return; var s=document.createElement('style'); s.id='mfAdmCss';
    s.textContent='.mfadm{position:fixed;left:10px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:95;font:700 .85rem Archivo,system-ui,sans-serif}'
      +'.mfadm>button{border:0;border-radius:999px;background:#c0392b;color:#fff;padding:8px 13px;font:800 .82rem Archivo,system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 20px -8px #000}'
      +'.mfadm .p{position:absolute;left:0;bottom:44px;width:min(290px,86vw);max-height:70vh;overflow:auto;background:#15191f;color:#eaf0f0;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:8px;box-shadow:0 20px 50px -10px #000}'
      +'.mfadm .p[hidden]{display:none}.mfadm .p a,.mfadm .p button{display:block;width:100%;text-align:left;border:0;background:none;color:inherit;text-decoration:none;padding:9px 10px;border-radius:10px;font:700 .9rem Archivo,system-ui,sans-serif;cursor:pointer}'
      +'.mfadm .p a:hover,.mfadm .p button:hover{background:rgba(255,255,255,.08)}.mfadm .p small{display:block;color:#9fb2b6;font-weight:400;font-size:.76rem}.mfadm .p hr{border:0;border-top:1px solid rgba(255,255,255,.12);margin:6px 0}'
      +'.mfadm .p .u{color:#f5d76e}';
    document.head.appendChild(s); }
  var EL=null;
  function bar(){ if(!on()){ if(EL){ EL.remove(); EL=null; } document.documentElement.classList.remove('mf-admin'); return; }
    document.documentElement.classList.add('mf-admin'); css(); if(EL) return;
    EL=document.createElement('div'); EL.className='mfadm'; EL.setAttribute('translate','no');
    EL.innerHTML='<button type="button" data-a="tog" aria-expanded="false">🛠 Admin</button><div class="p" hidden></div>'; document.body.appendChild(EL);
    EL.addEventListener('click',function(e){ var b=e.target.closest('[data-a]'); if(!b) return; var a=b.dataset.a, p=EL.querySelector('.p');
      if(a==='tog'){ var open=p.hidden; p.hidden=!open; b.setAttribute('aria-expanded',String(open)); if(open) fill(p); }
      else if(a==='user'){ toggle(); }
      else if(a==='fb'&&window.MFfeedback){ p.hidden=true; MFfeedback.open(); } }); }
  function fill(p){ var f=window.MFadminFish?window.MFadminFish():null, ed='';
    if(f&&f.word){ var k=String(f.key||''), set=/^D\d/.test(k)?'daily':/^[WX]\d/.test(k)?'new':'';
      ed='<a href="/edit/?find='+encodeURIComponent(f.word)+(set?'&set='+set:'&code=en')+'">✏️ Edit this fish: '+esc(f.word)+'<small>Word size, place, lines, on the edit sheet</small></a><hr>'; }
    p.innerHTML=ed
      +'<a href="/edit/">✏️ Edit sheet<small>Every fish; templates for word size and place</small></a>'
      +'<a href="/fish/review/">✅ Review all fish<small>Tick Edit or Remove on every fish</small></a>'
      +'<a href="/fish/">🐟 The 153<small>Print, edit or ask for a change</small></a><a href="/fish/?year=1">📅 The 365</a>'
      +'<a href="/voices/">🎙 Voices<small>Hear every voice, pick favorites (ElevenLabs too)</small></a>'
      +'<a href="/hubs/admin/">📍 Hubs admin</a><a href="/pond/admin/">🎣 Pond admin</a><a href="/stories/admin/">💬 Fish stories to approve</a>'
      +'<a href="/print/orders/">🛒 Card orders<small>Requests from Make the back yours</small></a>'+'<a href="/print/admin/">🖨 Print runs</a><a href="/prayers/admin/">🙏 Prayers<small>Approve prayers, add your own</small></a><a href="/flip/">🔄 Show a customer: card flip<small>Front and back, English or Spanish</small></a><a href="/proof/">🔍 Proofreading</a>'
      +'<a href="'+CHECK+'" target="_blank" rel="noopener">✅ Test checklist<small>Opens in Claude</small></a>'
      +(window.MFfeedback?'<button type="button" data-a="fb">📝 Note something to change</button>':'')
      +'<hr><button type="button" class="u" data-a="user">👤 Switch to user view<small>See it exactly as visitors do</small></button>'; }
  // turning it on asks for the admin password once; the server checks it (the same password as the edit sheet)
  function toggle(){ if(on()){ ls('mf-admin-on',''); bar(); try{ window.dispatchEvent(new CustomEvent('mf-admin')); }catch(e){} return Promise.resolve(false); }
    var k=ls('mf-admin-key'); var ask=function(){ var v=window.prompt('Admin password (the edit sheet’s password):'); return v?v.trim():''; };
    var go=function(key){ if(!key) return Promise.resolve(false);
      return fetch('/api/edit-save',{headers:{'x-mf-key':key},cache:'no-store'}).then(function(r){
        if(r.status===401){ ls('mf-admin-key',null); window.alert('That password is not right.'); return false; }
        ls('mf-admin-key',key); ls('mf-admin-on','1'); bar(); try{ window.dispatchEvent(new CustomEvent('mf-admin')); }catch(e){} return true; })
        .catch(function(){ window.alert('Can’t reach the server just now.'); return false; }); };
    return go(k||ask()); }
  window.MFadmin={on:on,toggle:toggle,refresh:bar};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bar); else bar();
})();
