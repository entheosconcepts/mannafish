// The MannaFish basket, on every page (Ken, 21 Oct: "I need to build out the fish basket, this is a cool feature").
// Five loaves, two fish, and twelve baskets left over (John 6:9-13): any fish goes in -- the main fish, the year fish, the Bible in a
// Year fish, One Word, a fish caught in My pace -- each with how many (1 to 12) and, for the main fish, the language. Never sold:
// the basket becomes a free request, for me, as a gift to a friend (with a note), or for a church or a Free Fish Embassy.
// It goes to /api/basket (kept, and emailed to MannaFish); the requests show under You -> Orders.
//   MFbasket.add({id:'M:HOPE'|'D:D123'|'Y:W01a', word, ref, svg, main})   MFbasket.open()   MFbasket.count()
(function(){
  if(window.MFbasket) return;
  var KEY='mf-basket', SENT='mf-basket-sent', SHIP='mf-ship', MAXQ=12, MAXN=60;
  var LANGS=[['en','English'],['es','Español'],['tl','Tagalog'],['zh','中文'],['hi','हिन्दी'],['el','Ελληνικά'],['de','Deutsch'],['ko','한국어'],['he','עברית'],['ar','العربية']];
  function get(k,d){ try{ var v=JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }catch(e){ return d; } }
  function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function word(k){ k=String(k||''); return k.charAt(0)+k.slice(1).toLowerCase(); }
  // the basket; the Today page's older one ({k:'HOPE', l:'en'}) comes along
  function items(){ var a=get(KEY,[]); if(!Array.isArray(a)) a=[]; return a.filter(Boolean).map(function(x){ return x.id?x:{id:'M:'+x.k,word:word(x.k),l:x.l||'en',q:2,main:true}; }); }
  function save(a){ put(KEY,a); fab(); if(window.MFacct) MFacct.touch('basket'); try{ window.dispatchEvent(new CustomEvent('mf-basket')); }catch(e){} }
  function total(a){ return (a||items()).reduce(function(t,x){ return t+(+x.q||0); },0); }

  // ── look ── (Ken, 24 Oct: "The x at top right on mobile view cannot be reached without scrolling down": the sheet fits the screen a phone
  // really shows (dvh), and its title and ✕ stay at the top while the rest scrolls)
  function css(){ if(document.getElementById('mfBkCss')) return; var s=document.createElement('style'); s.id='mfBkCss';
    s.textContent='.mfbkfab{position:fixed;right:14px;bottom:max(16px,env(safe-area-inset-bottom));z-index:80;border:0;border-radius:999px;background:#f5d76e;color:#111;font:800 1rem Archivo,system-ui,sans-serif;padding:10px 16px;cursor:pointer;box-shadow:0 10px 30px -8px #000}'
      +'.mfbkfab[hidden]{display:none}body.mftabbed .mfbkfab{bottom:calc(92px + env(safe-area-inset-bottom));right:12px;padding:8px 14px}'
      +'.mfbkfab.bump{animation:mfbump .5s ease}@keyframes mfbump{40%{transform:scale(1.18)}}'
      +'.mfbk{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.66);display:flex;align-items:flex-end;justify-content:center}.mfbk[hidden]{display:none}'
      +'.mfbk .in{background:#0e1116;color:#eaf0f0;border:1px solid rgba(255,255,255,.14);border-radius:22px 22px 0 0;width:100%;max-width:560px;max-height:92vh;max-height:calc(100dvh - 12px);overflow:auto;overscroll-behavior:contain;padding:0 16px max(18px,env(safe-area-inset-bottom));font:16px/1.45 Archivo,system-ui,sans-serif;text-align:left}'
      +'@media(min-width:640px){.mfbk{align-items:center}.mfbk .in{border-radius:22px}}'
      +':root[data-mode=light] .mfbk .in{background:#fbfaf6;color:#1c2228;border-color:rgba(0,0,0,.12)}'
      +'.mfbk .hd{display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:3;background:inherit;margin:0 -16px;padding:14px 16px 8px;border-radius:22px 22px 0 0}.mfbk h3{flex:1;margin:0;font:400 1.9rem MFHobo,cursive}.mfbk .x{border:1px solid rgba(128,128,128,.4);background:none;color:inherit;border-radius:50%;width:38px;height:38px;font-size:1rem;cursor:pointer}'
      +'.mfbk .sub{font:italic .95rem Spectral,Georgia,serif;opacity:.8;margin:4px 0 12px}'
      +'.mfbk .row{display:grid;grid-template-columns:116px 1fr;gap:4px 10px;align-items:center;border:1px solid rgba(128,128,128,.28);border-radius:14px;padding:8px;margin:0 0 8px}'
      +'.mfbk .th{position:relative;width:116px;aspect-ratio:2/1;border-radius:8px;overflow:hidden;background:#000;grid-row:span 2}.mfbk .th svg{position:absolute;inset:0;width:100%;height:100%}'
      +'.mfbk .nm{display:flex;align-items:baseline;gap:8px;min-width:0}.mfbk .nm b{font:400 1.25rem MFHobo,cursive}.mfbk .nm small{opacity:.65;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      +'.mfbk .ct{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.mfbk select,.mfbk input,.mfbk textarea{font:inherit;color:inherit;background:rgba(128,128,128,.12);border:1px solid rgba(128,128,128,.35);border-radius:10px;padding:7px 9px}'
      +'.mfbk .ct select{max-width:120px;font-size:.85rem;padding:5px 6px}.mfbk .qt{display:inline-flex;align-items:center;border:1px solid rgba(128,128,128,.35);border-radius:999px}'
      +'.mfbk .qt button{border:0;background:none;color:inherit;width:32px;height:32px;font:800 1.1rem Archivo,sans-serif;cursor:pointer}.mfbk .qt span{min-width:26px;text-align:center;font-weight:800}'
      +'.mfbk .rm{margin-left:auto;border:0;background:none;color:inherit;opacity:.6;font-size:1.2rem;cursor:pointer}'
      +'.mfbk .seg{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.mfbk .seg button{flex:1 1 auto;border:1px solid rgba(128,128,128,.4);background:none;color:inherit;border-radius:999px;padding:9px 12px;font:700 .88rem Archivo,sans-serif;cursor:pointer}'
      +'.mfbk .seg button[aria-pressed=true]{background:#2a5fb0;border-color:#2a5fb0;color:#fff}'
      +'.mfbk h4{margin:16px 0 6px;font:800 .72rem Archivo,sans-serif;letter-spacing:.16em;text-transform:uppercase;opacity:.7}'
      +'.mfbk *{box-sizing:border-box}.mfbk .f input,.mfbk .f textarea,.mfbk .f select{width:100%;min-width:0}'
      +'.mfbk .f{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.mfbk .f label{display:flex;flex-direction:column;gap:3px;font-size:.82rem;font-weight:700}.mfbk .f .w{grid-column:1/-1}'
      +'.mfbk .go{margin-top:14px;width:100%;border:0;border-radius:999px;background:#2a5fb0;color:#fff;font:800 1.02rem Archivo,sans-serif;padding:14px;cursor:pointer}.mfbk .go[disabled]{opacity:.5}'
      +'.mfbk .keep{display:block;margin:8px auto 0;border:0;background:none;color:inherit;opacity:.75;font:600 .9rem Archivo,sans-serif;text-decoration:underline;cursor:pointer}'
      +'.mfbk .tot{display:flex;justify-content:space-between;gap:10px;font-weight:700;margin:10px 2px 0}.mfbk .tot small{font-weight:400;opacity:.7}'
      +'.mfbk .msg{margin:8px 0 0;font-size:.9rem}.mfbk .ok{text-align:center;padding:10px 4px}.mfbk .ok .big{font-size:3rem}.mfbk .ok h3{margin:4px 0}'
      +'.mfbk .empty{opacity:.75;text-align:center;padding:16px 4px}.mfbk a{color:#6f9bff}';
    s.textContent+=[['MFHobo','hobo'],['ZCOOL KuaiLe','zh'],['Baloo 2','hi'],['Ubuntu','el'],['Jua','ko'],['Fredoka','he'],['Cairo','ar']].map(function(f){ return "@font-face{font-family:'"+f[0]+"';src:url(/fish-lang/"+f[1]+".woff2) format('woff2');font-weight:100 900;font-display:swap}"; }).join('');   // the letters on the fish
    document.head.appendChild(s); }
  // a fish's picture: the real fish, from /fish/ where every fish picture lives (Ken, 22 Oct: "the fish are not actual images");
  // the outline with its word only shows while it loads. The main fish come in the language chosen for them.
  var SV={}, UQ=0;
  function src(x){ var id=String(x.id||''), k=id.slice(2);
    if(id.indexOf('M:')===0) return '/fish/'+(x.l||'en')+'/'+k+'.svg';
    if(/^[DY]:[WD]\d/.test(id)) return '/fish/'+k+'.svg';
    return x.svg||''; }
  // two fish on one page must not share the names inside them (the curve each verse line runs along)
  function uniq(t){ var p='bk'+(++UQ)+'_'; return t.replace(/\bid="([^"]+)"/g,'id="'+p+'$1"').replace(/href="#([^"]+)"/g,'href="#'+p+'$1"').replace(/url\(#([^)]+)\)/g,'url(#'+p+'$1)'); }
  function outline(w){ return '<svg viewBox="0 0 200 100" aria-hidden="true"><path d="M8 50 C48 6 120 6 152 50 C120 94 48 94 8 50 Z M152 50 L192 18 M152 50 L192 82" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><text x="80" y="60" text-anchor="middle" font-family="MFHobo,Arial Black,sans-serif" font-size="'+(w.length>7?20:26)+'" fill="#fff">'+esc(w)+'</text></svg>'; }
  function thumb(el,x){ el.innerHTML=outline(x.word); var u=src(x); if(!u) return; (SV[u]||(SV[u]=fetch(u).then(function(r){ if(!r.ok) throw 0; return r.text(); }))).then(function(t){ el.innerHTML=uniq(t); var s=el.querySelector('svg'); if(s){ s.removeAttribute('style'); s.setAttribute('aria-hidden','true'); } }).catch(function(){}); }

  // ── the button ──
  var FAB=null;
  function fab(){ if(!document.body) return; css(); if(!FAB){ FAB=document.createElement('button'); FAB.type='button'; FAB.className='mfbkfab'; FAB.addEventListener('click',open); document.body.appendChild(FAB); }
    var n=items().length; FAB.hidden=!n; FAB.textContent='🧺 '+n; FAB.setAttribute('aria-label','Your basket: '+n+' fish'); }
  function bump(){ if(!FAB) return; FAB.classList.remove('bump'); void FAB.offsetWidth; FAB.classList.add('bump'); }
  var TOAST=null;
  function toast(t){ if(!TOAST){ TOAST=document.createElement('div'); TOAST.setAttribute('role','status'); TOAST.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:130;background:#16171b;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:9px 16px;font:700 .9rem Archivo,sans-serif;max-width:calc(100% - 32px);text-align:center;display:none'; document.body.appendChild(TOAST); }
    TOAST.textContent=t; TOAST.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(function(){ TOAST.style.display='none'; },2200); }

  function add(f){ if(!f||!f.id) return; var a=items(), at=a.filter(function(x){ return x.id===f.id; })[0];
    if(at){ at.q=Math.min(MAXQ,(+at.q||0)+1); } else a.push({id:f.id,word:f.word,ref:f.ref||'',svg:f.svg||'',main:!!f.main,l:f.l||'en',q:2});
    save(a); bump(); toast('🧺 '+f.word+(at?' · '+at.q+' in your basket':' is in your basket')); }

  // ── the sheet ──
  var BOX=null, FOR='me', DONE=null;
  function open(){ css(); if(!BOX){ BOX=document.createElement('div'); BOX.className='mfbk'; BOX.setAttribute('role','dialog'); BOX.setAttribute('aria-modal','true'); BOX.setAttribute('aria-label','Your basket'); BOX.innerHTML='<div class="in"></div>'; document.body.appendChild(BOX);
      BOX.addEventListener('click',click); BOX.addEventListener('change',change); BOX.addEventListener('submit',function(e){ e.preventDefault(); send(); }); document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!BOX.hidden) close(); }); }
    DONE=null; draw(); BOX.hidden=false; document.documentElement.style.overflow='hidden'; }
  function close(){ if(BOX) BOX.hidden=true; document.documentElement.style.overflow=''; }
  function val(id){ var e=BOX.querySelector('#'+id); return e?e.value.trim():''; }
  function draw(){ var a=items(), S=get(SHIP,{}), me=window.MFacct&&MFacct.me&&MFacct.me(), n=total(a), h;
    if(DONE){ h='<div class="ok"><div class="big">🧺</div><h3>Thank you!</h3><p>Your request for '+DONE.n+' MannaFish is in. '+(DONE.for==='gift'?'We will send them to '+esc(DONE.to)+', with your note.':DONE.for==='church'?'We will be in touch about your baskets.':'We will mail them to you.')+'</p><p style="opacity:.75;font-size:.9rem">Free, postage included. Someone already paid for it.</p>'
        +'<p><a href="/you/#or">See it under You &rarr; Orders</a></p><button type="button" class="go" data-a="close">Keep fishing</button></div>'; BOX.firstChild.innerHTML=h; return; }
    h='<div class="hd"><h3>Your basket</h3><button type="button" class="x" data-a="close" aria-label="Close">&#10005;</button></div><p class="sub">Five loaves, two fish, and twelve baskets left over (John 6:9–13). MannaFish is always free.</p>';
    if(!a.length){ BOX.firstChild.innerHTML=h+'<p class="empty">Your basket is empty. Tap 🧺 on any fish to put it in.</p><button type="button" class="keep" data-a="close">Keep looking</button>'; return; }
    h+=a.map(function(x,i){ return '<div class="row" data-i="'+i+'"><span class="th"></span><span class="nm"><b>'+esc(x.word)+'</b><small>'+esc(x.ref||'')+'</small></span>'
      +'<span class="ct">'+(x.main?'<select data-f="l" aria-label="Language">'+LANGS.map(function(L){ return '<option value="'+L[0]+'"'+(L[0]===x.l?' selected':'')+'>'+L[1]+'</option>'; }).join('')+'</select>':'')
      +'<span class="qt"><button type="button" data-a="dn" aria-label="One less">&minus;</button><span>'+x.q+'</span><button type="button" data-a="up" aria-label="One more">+</button></span><button type="button" class="rm" data-a="rm" aria-label="Take out">&#10005;</button></span></div>'; }).join('');
    h+='<div class="tot"><span>'+n+' MannaFish decal'+(n===1?'':'s')+'</span><small>free, postage included</small></div>'
      +'<h4>Who is it for?</h4><div class="seg" role="group"><button type="button" data-for="me" aria-pressed="'+(FOR==='me')+'">For me</button><button type="button" data-for="gift" aria-pressed="'+(FOR==='gift')+'">A gift for a friend</button><button type="button" data-for="church" aria-pressed="'+(FOR==='church')+'">A church or Free Fish Embassy</button></div>'
      +'<form novalidate><div class="f">'
      +'<label>Your name<input id="bkName" autocomplete="name" value="'+esc(S.name||'')+'" required></label><label>Your email<input id="bkEmail" type="email" autocomplete="email" value="'+esc(S.email||(me&&me.email)||'')+'" required></label>'
      +(FOR==='church'?'<label class="w">Church or ministry<input id="bkOrg" value="'+esc(S.org||'')+'" required></label><label>How many baskets?<select id="bkBaskets">'+[1,2,3,4,5,6,7,8,9,10,11,12].map(function(k){ return '<option'+(k===2?' selected':'')+'>'+k+'</option>'; }).join('')+'</select></label><label>Phone (optional)<input id="bkPhone" type="tel" autocomplete="tel" value="'+esc(S.phone||'')+'"></label>':'')
      +(FOR==='gift'?'<label class="w">Your friend&rsquo;s name<input id="bkTo" autocomplete="off" required></label>':'')
      +'<label class="w">'+(FOR==='gift'?'Their street address':'Street address')+'<input id="bkStreet" autocomplete="'+(FOR==='gift'?'off':'street-address')+'" value="'+esc(FOR==='gift'?'':S.street||'')+'" required></label>'
      +'<label>City<input id="bkCity" autocomplete="'+(FOR==='gift'?'off':'address-level2')+'" value="'+esc(FOR==='gift'?'':S.city||'')+'" required></label><label>State and ZIP<input id="bkZip" autocomplete="'+(FOR==='gift'?'off':'postal-code')+'" value="'+esc(FOR==='gift'?'':S.zip||'')+'" required></label>'
      +'<label class="w">Country<input id="bkCountry" value="'+esc(FOR==='gift'?'United States':S.country||'United States')+'"></label>'
      +(FOR!=='me'?'<label class="w">'+(FOR==='gift'?'A note to go in the envelope':'Tell us about it (where the baskets will be, who they are for)')+'<textarea id="bkNote" rows="3" maxlength="600"></textarea></label>':'')
      +'</div><input type="text" id="bkHp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'
      +'<button type="submit" class="go" id="bkGo">'+(FOR==='church'?'Ask for these baskets · free':'Request these MannaFish · free')+'</button><p class="msg" id="bkMsg" aria-live="polite"></p></form>'
      +'<button type="button" class="keep" data-a="close">Keep looking</button>';
    BOX.firstChild.innerHTML=h; [].forEach.call(BOX.querySelectorAll('.row'),function(r){ thumb(r.querySelector('.th'),a[+r.dataset.i]); }); }
  function click(e){ var t=e.target, b=t.closest('[data-a],[data-for]');
    if(t===BOX){ close(); return; } if(!b) return;
    if(b.dataset.for){ keepForm(); FOR=b.dataset.for; draw(); return; }
    var a=items(), r=b.closest('.row'), i=r?+r.dataset.i:-1, act=b.dataset.a;
    if(act==='close'){ close(); return; }
    if(act==='up'&&a[i]){ keepForm(); a[i].q=Math.min(MAXQ,a[i].q+1); save(a); draw(); return; }
    if(act==='dn'&&a[i]){ keepForm(); a[i].q=Math.max(1,a[i].q-1); save(a); draw(); return; }
    if(act==='rm'&&a[i]){ keepForm(); a.splice(i,1); save(a); draw(); return; } }
  function change(e){ var r=e.target.closest('.row'); if(r&&e.target.dataset.f==='l'){ var a=items(), x=a[+r.dataset.i]; x.l=e.target.value; save(a); thumb(r.querySelector('.th'),x); } }   // the picture follows the language
  // what was typed stays when the list is drawn again
  function keepForm(){ if(!BOX||!BOX.querySelector('#bkName')) return; var S=get(SHIP,{}); S.name=val('bkName')||S.name; S.email=val('bkEmail')||S.email;
    if(FOR!=='gift'){ ['street','city','zip','country'].forEach(function(k){ var v=val('bk'+{street:'Street',city:'City',zip:'Zip',country:'Country'}[k]); if(v) S[k]=v; }); }
    if(FOR==='church'){ S.org=val('bkOrg')||S.org; S.phone=val('bkPhone')||S.phone; } put(SHIP,S); }
  function send(){ var a=items(), m=BOX.querySelector('#bkMsg'), go=BOX.querySelector('#bkGo'); if(!a.length) return;
    var need=['bkName','bkEmail','bkStreet','bkCity','bkZip'].concat(FOR==='gift'?['bkTo']:[]).concat(FOR==='church'?['bkOrg']:[]);
    for(var i=0;i<need.length;i++){ if(!val(need[i])){ var el=BOX.querySelector('#'+need[i]); el.focus(); m.textContent='Please fill this in.'; return; } }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('bkEmail'))){ BOX.querySelector('#bkEmail').focus(); m.textContent='Please check your email address.'; return; }
    if(total(a)>MAXN&&FOR!=='church'){ m.textContent='That is a lot of fish! For more than '+MAXN+', choose “A church or Free Fish Embassy”.'; return; }
    keepForm(); var body={for:FOR,name:val('bkName'),email:val('bkEmail'),street:val('bkStreet'),city:val('bkCity'),zip:val('bkZip'),country:val('bkCountry'),note:val('bkNote'),to:val('bkTo'),org:val('bkOrg'),baskets:val('bkBaskets'),phone:val('bkPhone'),hp:val('bkHp'),
      lang:(function(){ try{ return localStorage.getItem('mf-lang')||'en'; }catch(e){ return 'en'; } })(),
      items:a.map(function(x){ return {id:x.id,word:x.word,ref:x.ref||'',l:x.main?x.l:'en',q:x.q}; })};
    go.disabled=true; m.textContent='Sending…';
    (window.MFacct&&MFacct.token?MFacct.token():Promise.resolve('')).then(function(tok){ var H={'content-type':'application/json'}; if(tok) H.authorization='Bearer '+tok;
      return fetch('/api/basket',{method:'POST',headers:H,body:JSON.stringify(body)}); })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok||!j.ok) throw new Error(j.error||('HTTP '+r.status)); return j; }); })
      .then(function(j){ var L=get(SENT,[]); L.unshift({id:j.id,at:Date.now(),for:FOR,to:FOR==='gift'?body.to:FOR==='church'?body.org:body.name,city:body.city,items:body.items,status:'requested'}); put(SENT,L.slice(0,100));
        DONE={n:total(a),for:FOR,to:body.to}; save([]); draw(); if(window.MFacct) MFacct.touch('basketSent'); })
      .catch(function(err){ go.disabled=false; m.textContent='It could not be sent just now. Please try again in a moment.'+(err&&err.message?' ('+err.message+')':''); }); }

  window.MFbasket={add:add,open:open,close:close,items:items,count:function(){ return items().length; },sent:function(){ return get(SENT,[]); },refresh:fab};
  window.addEventListener('storage',function(e){ if(e.key===KEY) fab(); });
  if(document.body) fab(); else document.addEventListener('DOMContentLoaded',fab);
})();
