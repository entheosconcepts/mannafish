// The MannaFish prayer basket, on every page (Ken, 21 Oct: "I need to build out the fish basket"; 31 Oct: "when someone likes a word and
// adds it to their basket ... they add it to their prayer basket for that word to be added to a local fishery, or MannaFish Station,
// and when other users add and it collectively reaches 100, that MannaFish Station gets a notice ... I fill the pond, and the user can
// go to that location and get a free decal, or shirt or key chain").
// Nothing is mailed to anyone's home and nothing is sold. A fish in the basket is a prayer that it be multiplied at a MannaFish Hub
// (John 6:11: he gave thanks, and there was enough for all). Ken calls these places Fisheries or Hatcheries; on the site they are
// MannaFish Hubs. One name and email, a Hub, one tap: /api/hubs/pray. When the fish is there, the person gets an email to come and get
// it. The fish prayed for are kept here (mf-praying) with their Hub. Below the Hubs, the places people are asking to become Hubs
// (one request per account per place, signed in), and a way to sponsor one. window.MFhubs is shared with /hubs/.
//   MFbasket.add({id:'M:HOPE'|'D:D123'|'Y:W01a'|'X:X001', word, ref, svg, main})   MFbasket.open()   MFbasket.count()   MFbasket.praying()
(function(){
  if(window.MFbasket) return;
  var KEY='mf-basket', SENT='mf-basket-sent', PRAY='mf-praying', SHIP='mf-ship', STN='mf-station', NEAR='mf-near', MAXN=24;
  var LANGS=[['en','English'],['es','Español'],['tl','Tagalog'],['zh','中文'],['hi','हिन्दी'],['el','Ελληνικά'],['de','Deutsch'],['ko','한국어'],['he','עברית'],['ar','العربية'],['ru','Русский']];
  function get(k,d){ try{ var v=JSON.parse(localStorage.getItem(k)||'null'); return v==null?d:v; }catch(e){ return d; } }
  function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function word(k){ k=String(k||''); return k.charAt(0)+k.slice(1).toLowerCase(); }
  // the basket; the Today page's older one ({k:'HOPE', l:'en'}) comes along
  function items(){ var a=get(KEY,[]); if(!Array.isArray(a)) a=[]; return a.filter(Boolean).map(function(x){ return x.id?x:{id:'M:'+x.k,word:word(x.k),l:x.l||'en',main:true}; }); }
  function save(a){ put(KEY,a); fab(); if(window.MFacct) MFacct.touch('basket'); try{ window.dispatchEvent(new CustomEvent('mf-basket')); }catch(e){} }

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
      +'.mfbk .th{cursor:zoom-in}.mfbkz{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;color:#eaf0f0;font:16px/1.4 Archivo,system-ui,sans-serif;text-align:center;cursor:zoom-out}'
      +'.mfbkz .zf{position:relative;width:min(94vw,760px);aspect-ratio:2/1;background:#000;border-radius:14px;overflow:hidden}.mfbkz .zf svg{position:absolute;inset:0;width:100%;height:100%}'
      +'.mfbkz .zb{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.mfbkz .zb button,.mfbkz .zb a{border:1px solid rgba(255,255,255,.45);background:none;color:#fff;border-radius:999px;padding:8px 14px;font:700 .88rem Archivo,sans-serif;cursor:pointer;text-decoration:none}'
      +'.mfbkz p{margin:6px 0 0}.mfbkz b{font:400 1.6rem MFHobo,cursive}.mfbkz small{opacity:.6}.mfbkz .zx{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;border:1px solid rgba(255,255,255,.4);background:none;color:#fff;border-radius:50%;width:42px;height:42px;font-size:1.1rem;cursor:pointer}'
      +'.mfbk .empty{opacity:.75;text-align:center;padding:16px 4px}.mfbk a{color:#6f9bff}'
      +'.mfbk .pr{font-size:.82rem;opacity:.85}.mfbk .bar{display:block;height:6px;border-radius:999px;background:rgba(128,128,128,.25);overflow:hidden;margin:4px 0 0;max-width:220px}.mfbk .bar i{display:block;height:100%;background:#f5d76e}'
      +'.mfbk .stn{display:grid;gap:6px;margin:6px 0 4px}.mfbk .stn label{display:flex;gap:10px;align-items:flex-start;border:1px solid rgba(128,128,128,.3);border-radius:12px;padding:9px 10px;cursor:pointer}.mfbk .stn label:has(input:checked){border-color:#2a5fb0;background:rgba(42,95,176,.12)}.mfbk .stn input{margin-top:4px}.mfbk .stn small{display:block;opacity:.7;font-size:.8rem}'
      +'.mfbk .stn .d{float:right;opacity:.7;font-size:.8rem;font-weight:700}.mfbk .near{border:1px solid rgba(128,128,128,.4);background:none;color:inherit;border-radius:999px;padding:4px 10px;font:700 .78rem Archivo,sans-serif;cursor:pointer;margin-left:8px;letter-spacing:0;text-transform:none}'
      +'.mfbk details.ask{border:1px solid rgba(245,215,110,.45);border-radius:14px;padding:4px 12px 12px;margin:16px 0 0}.mfbk details.ask summary{cursor:pointer;font-weight:800;padding:8px 0;list-style:none}.mfbk details.ask summary::-webkit-details-marker{display:none}'
      +'.mfbk .stn label.mine{border-color:rgba(127,211,160,.6)}.mfbk .ok2{color:#7fd3a0;font-weight:800;font-size:.8rem}.mfbk .si{display:flex;gap:6px;margin-top:8px}.mfbk .si input{flex:1;min-width:0}.mfbk .si button{border:0;border-radius:999px;background:#2a5fb0;color:#fff;font:800 .9rem Archivo,sans-serif;padding:8px 14px;cursor:pointer}'
      +'.mfbk .go.y{background:#f5d76e;color:#111}'
      +'.mfbk .was{border-top:1px solid rgba(128,128,128,.25);margin-top:16px;padding-top:4px}.mfbk .was .row{grid-template-columns:72px 1fr}.mfbk .was .th{width:72px}';
    s.textContent+=[['MFHobo','hobo'],['ZCOOL KuaiLe','zh'],['Baloo 2','hi'],['Ubuntu','el'],['Jua','ko'],['Fredoka','he'],['Cairo','ar'],['Ubuntu Cyrillic','ru']].map(function(f){ return "@font-face{font-family:'"+f[0]+"';src:url(/fish-lang/"+f[1]+".woff2) format('woff2');font-weight:100 900;font-display:swap}"; }).join('');   // the letters on the fish
    document.head.appendChild(s); }
  // a fish's picture: the real fish, from /fish/ where every fish picture lives (Ken, 22 Oct: "the fish are not actual images");
  // the outline with its word only shows while it loads. The main fish come in the language chosen for them.
  var SV={}, UQ=0;
  function src(x){ var id=String(x.id||''), k=id.slice(2);
    if(id.indexOf('M:')===0) return '/fish/'+(x.l||'en')+'/'+k+'.svg';
    if(/^[DYX]:[WDX]\d/.test(id)) return '/fish/'+k+'.svg';
    return x.svg||''; }
  // two fish on one page must not share the names inside them (the curve each verse line runs along)
  function uniq(t){ var p='bk'+(++UQ)+'_'; return t.replace(/\bid="([^"]+)"/g,'id="'+p+'$1"').replace(/href="#([^"]+)"/g,'href="#'+p+'$1"').replace(/url\(#([^)]+)\)/g,'url(#'+p+'$1)'); }
  function outline(w){ return '<svg viewBox="0 0 200 100" aria-hidden="true"><path d="M8 50 C48 6 120 6 152 50 C120 94 48 94 8 50 Z M152 50 L192 18 M152 50 L192 82" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><text x="80" y="60" text-anchor="middle" font-family="MFHobo,Arial Black,sans-serif" font-size="'+(w.length>7?20:26)+'" fill="#fff">'+esc(w)+'</text></svg>'; }
  function thumb(el,x){ el.innerHTML=outline(x.word); var u=src(x); if(!u) return; (SV[u]||(SV[u]=fetch(u).then(function(r){ if(!r.ok) throw 0; return r.text(); }))).then(function(t){ el.innerHTML=uniq(t); var s=el.querySelector('svg'); if(s){ s.removeAttribute('style'); s.setAttribute('aria-hidden','true'); } }).catch(function(){}); }

  // ── the button ──
  var FAB=null;
  function fab(){ if(!document.body) return; css(); if(!FAB){ FAB=document.createElement('button'); FAB.type='button'; FAB.className='mfbkfab'; FAB.addEventListener('click',open); document.body.appendChild(FAB); }
    var n=items().length; FAB.hidden=!n; FAB.textContent='🧺 '+n; FAB.setAttribute('aria-label','Your prayer basket: '+n+' fish'); }
  function bump(){ if(!FAB) return; FAB.classList.remove('bump'); void FAB.offsetWidth; FAB.classList.add('bump'); }
  var TOAST=null;
  function toast(t){ if(!TOAST){ TOAST=document.createElement('div'); TOAST.setAttribute('role','status'); TOAST.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));z-index:130;background:#16171b;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:9px 16px;font:700 .9rem Archivo,sans-serif;max-width:calc(100% - 32px);text-align:center;display:none'; document.body.appendChild(TOAST); }
    TOAST.textContent=t; TOAST.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(function(){ TOAST.style.display='none'; },2200); }

  function add(f){ if(!f||!f.id) return; var a=items(), at=a.filter(function(x){ return x.id===f.id; })[0];
    if(!at) a.push({id:f.id,word:f.word,ref:f.ref||'',svg:f.svg||'',main:!!f.main||String(f.id).indexOf('M:')===0,l:f.l||'en'});
    save(a); bump(); toast('🧺 '+f.word+(at?' is already in your prayer basket':' is in your prayer basket')); }

  // ── the Hubs, shared with /hubs/ (window.MFhubs) ──
  // the open Hubs and the places asked for come from /api/hubs; "Wherever it's needed most" is always the last Hub
  var ST=null, PR=[], GOAL=50, MINE={}, STP=null, ICON={coffee:'☕',store:'🏪',church:'⛪',books:'📚',food:'🍽️',other:'📍'};
  function stations(){ return STP||(STP=fetch('/api/hubs',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(j){ ST=j.stations||[]; PR=j.proposed||[]; GOAL=j.goal||50; return ST; })
    .catch(function(){ STP=null; ST=ST||[{id:'anywhere',name:'Wherever it’s needed most',where:'MannaFish places these fish where they are needed.',threshold:100,total:0,fish:{},stock:[]}]; return ST; })); }
  function reload(){ STP=null; return stations(); }
  function stn(id){ return (ST||[]).filter(function(x){ return x.id===id; })[0]; }
  // where this person is, only if they tap 📍 (kept on this device, roughly: two decimals is about half a mile)
  function near(){ return get(NEAR,null); }
  function locate(){ return new Promise(function(ok,no){ if(!navigator.geolocation) return no(new Error('none'));
    navigator.geolocation.getCurrentPosition(function(p){ var n={lat:+p.coords.latitude.toFixed(2),lng:+p.coords.longitude.toFixed(2)}; put(NEAR,n); ok(n); },function(e){ no(e); },{timeout:12000,maximumAge:3600000}); }); }
  function miles(x){ var n=near(); if(!n||x.lat==null||x.lng==null) return null; var R=3958.8, r=Math.PI/180, dl=(x.lat-n.lat)*r, dg=(x.lng-n.lng)*r,
    h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(n.lat*r)*Math.cos(x.lat*r)*Math.sin(dg/2)*Math.sin(dg/2); return 2*R*Math.asin(Math.sqrt(h)); }
  function mi(x){ var d=miles(x); return d==null?'':(d<10?d.toFixed(1):Math.round(d))+' mi'; }
  function byNear(L){ var n=near(); return L.slice().sort(function(a,b){ if(a.id==='anywhere') return 1; if(b.id==='anywhere') return -1; if(!n) return 0; var x=miles(a), y=miles(b); return (x==null?1e9:x)-(y==null?1e9:y); }); }
  // the MannaFish account: the one on this page, or the shared one loaded now (the Today page keeps its own; the sign-in is the same)
  var AP=null;
  function acct(){ return AP||(AP=new Promise(function(ok,no){ if(window.MFacct) return ok(); var s=document.createElement('script'); s.src='/fish-lang/account.js'; s.onload=ok; s.onerror=function(){ AP=null; no(new Error('offline')); }; document.head.appendChild(s); })
    .then(function(){ return MFacct.load(); }).then(function(){ return MFacct; })); }
  // the account's key: from the account on this page, or (the Today page, which keeps its own) straight from where every page keeps it,
  // so nothing else is loaded just to ask; account.js is only loaded here to sign in
  function rawToken(){ try{ var t=JSON.parse(localStorage.getItem('sb-oblttpxqjvaglwfdszdg-auth-token')||'null'); return t&&t.access_token&&(!t.expires_at||t.expires_at*1000>Date.now()+30000)?t.access_token:''; }catch(e){ return ''; } }
  function token(){ if(window.MFacct) return MFacct.load().then(function(){ return MFacct.me()?MFacct.token():''; }).catch(function(){ return rawToken(); }); return Promise.resolve(rawToken()); }
  function signedIn(){ return token().then(function(t){ return !!t; }); }
  function mine(){ return token().then(function(t){ if(!t) return MINE; return fetch('/api/hubs/mine',{headers:{authorization:'Bearer '+t},cache:'no-store'}).then(function(r){ return r.ok?r.json():{votes:[]}; })
    .then(function(j){ MINE={}; (j.votes||[]).forEach(function(id){ MINE[id]=1; }); return MINE; }); }).catch(function(){ return MINE; }); }
  function vote(ids,on){ return token().then(function(t){ if(!t) throw new Error('signin');
    return fetch('/api/hubs/vote',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+t},body:JSON.stringify({ids:ids,on:on!==false})}); })
    .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j.error||('HTTP '+r.status)); return j; }); })
    .then(function(j){ MINE={}; (j.mine||[]).forEach(function(id){ MINE[id]=1; }); PR.forEach(function(p){ if(j.votes&&j.votes[p.id]!=null){ p.votes=j.votes[p.id]; p.qualified=p.votes>=GOAL; } }); return j; }); }
  // sign in with a code by email, in place: el gets the form; done() runs once signed in
  function signin(el,done,why){ el.innerHTML='<p class="pr" style="margin:8px 0 0">'+esc(why||'Sign in to MannaFish to ask (free, no password: we email you a code).')+'</p><div class="si"><input type="email" data-si="em" autocomplete="email" placeholder="Your email" value="'+esc(get(SHIP,{}).email||'')+'"><button type="button" data-si="send">Email me a code</button></div><p class="pr" data-si="msg" aria-live="polite"></p>';
    var m=el.querySelector('[data-si=msg]'), email='';
    el.onclick=function(e){ var b=e.target.closest('[data-si]'); if(!b) return;
      if(b.dataset.si==='send'){ email=el.querySelector('[data-si=em]').value.trim(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ m.textContent='Please check your email address.'; return; }
        b.disabled=true; m.textContent='Sending…'; acct().then(function(A){ return A.send(email,location.href); }).then(function(){
          el.querySelector('.si').outerHTML='<div class="si"><input data-si="code" inputmode="numeric" autocomplete="one-time-code" placeholder="Code from the email"><button type="button" data-si="ok">Sign in</button></div>'; m.textContent='We sent a code to '+email+'.'; el.querySelector('[data-si=code]').focus(); })
          .catch(function(err){ b.disabled=false; m.textContent='It could not be sent just now. '+(err&&err.message||''); }); }
      if(b.dataset.si==='ok'){ var code=el.querySelector('[data-si=code]').value.trim(); if(!code) return; b.disabled=true; m.textContent='Signing in…';
        acct().then(function(A){ return A.verify(email,code).then(function(){ return new Promise(function(ok){ var n=0; (function w(){ if(A.me()||n++>30) return ok(); setTimeout(w,100); })(); }); }); })
          .then(function(){ el.innerHTML=''; done(); }).catch(function(err){ b.disabled=false; m.textContent='That code did not work. '+(err&&err.message||''); }); } }; }
  window.MFhubs={load:stations,reload:reload,hubs:function(){ return ST||[]; },proposed:function(){ return PR; },goal:function(){ return GOAL; },mine:mine,isMine:function(id){ return !!MINE[id]; },
    vote:vote,signin:signin,signedIn:signedIn,token:token,near:near,locate:locate,miles:miles,mi:mi,byNear:byNear,icon:function(k){ return ICON[k]||ICON.other; }};

  // ── the sheet ──
  var BOX=null, DONE=null, PICK={}, ASKMSG='';
  function pick(){ var p=get(STN,''); try{ var q=new URLSearchParams(location.search).get('hub')||new URLSearchParams(location.search).get('station'); if(q){ p=q; put(STN,q); } }catch(e){} return stn(p)?p:(ST&&ST.length===1?ST[0].id:p&&!ST?p:''); }
  function key(x){ return x.id+'|'+(x.main?(x.l||'en'):'en'); }
  // how a fish is doing at its Hub: there now, on the way, or how many are praying with the Hub's number
  function how(x,sid){ var S=stn(sid); if(!S) return ''; var k=key(x), n=(S.fish||{})[k]||0, th=S.threshold||100, t=S.total||0,
      got=(S.stock||[]).filter(function(y){ return y.fish===x.id&&(y.l||'en')===(x.main?(x.l||'en'):'en'); })[0];
    if(got&&got.status==='in') return '<span class="pr">✅ Here now at '+esc(S.name)+': come and get yours</span>';
    if(got) return '<span class="pr">🚚 On the way to '+esc(S.name)+'</span>';
    return '<span class="pr">🙏 '+n+' praying for this fish · '+t+' of '+th+' at '+esc(S.name)+'</span><span class="bar"><i style="width:'+Math.min(100,Math.round(t*100/th))+'%"></i></span>'; }
  function open(){ css(); if(!BOX){ BOX=document.createElement('div'); BOX.className='mfbk'; BOX.setAttribute('role','dialog'); BOX.setAttribute('aria-modal','true'); BOX.setAttribute('aria-label','Your prayer basket'); BOX.innerHTML='<div class="in"></div>'; document.body.appendChild(BOX);
      BOX.addEventListener('click',click); BOX.addEventListener('change',change); BOX.addEventListener('submit',function(e){ e.preventDefault(); send(); }); document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&ZM){ unzoom(); return; } if(e.key==='Escape'&&!BOX.hidden) close(); if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.a==='zoom') e.target.click(); }); }
    DONE=null; draw(); BOX.hidden=false; document.documentElement.style.overflow='hidden';
    stations().then(function(){ if(!BOX.hidden&&!DONE) draw(); }); if(window.MFacct&&MFacct.me&&MFacct.me()||hasSession()) mine().then(function(){ if(!BOX.hidden&&!DONE) draw(); }); }
  function hasSession(){ try{ return !!localStorage.getItem('sb-oblttpxqjvaglwfdszdg-auth-token'); }catch(e){ return false; } }
  function close(){ if(BOX) BOX.hidden=true; document.documentElement.style.overflow=''; }
  function val(id){ var e=BOX.querySelector('#'+id); return e?e.value.trim():''; }
  function prayed(){ var a=get(PRAY,[]); return Array.isArray(a)?a:[]; }
  // the places people are asking for, nearest first: tick any, then one tap asks for all of them
  function askHTML(open){ if(!PR.length) return '';
    var L=byNear(PR), n=0; L.forEach(function(p){ if(PICK[p.id]) n++; });
    return '<details class="ask"'+(open?' open':'')+'><summary>🙋 Ask for a MannaFish Hub near you</summary>'
      +'<p class="pr" style="margin:0 0 8px">Places that may host MannaFish, so people can pick up free fish there. Choose as many as you like. When enough people ask, we talk with them; a Hub can also draw new people through their door.</p>'
      +'<div class="stn">'+L.slice(0,12).map(function(p){ var m=!!MINE[p.id];
        return '<label class="'+(m?'mine':'')+'"><input type="checkbox" name="bkAsk" value="'+esc(p.id)+'"'+(m||PICK[p.id]?' checked':'')+(m?' disabled':'')+'><span style="flex:1"><span class="d">'+esc(mi(p))+'</span><b>'+ICON[p.kind||'other']+' '+esc(p.name)+'</b>'
          +'<small>'+esc(p.address||p.city||'')+'</small><small>'+(m?'<span class="ok2">✓ You asked</span> · ':'')+p.votes+' of '+GOAL+' asking'+(p.qualified?' · <b>ready to become a Hub</b>':p.status==='talking'?' · we are talking with them':'')+(p.sponsored?' · sponsored':'')+'</small>'
          +'<span class="bar"><i style="width:'+Math.min(100,Math.round(p.votes*100/GOAL))+'%"></i></span></span></label>'; }).join('')+'</div>'
      +(L.length>12?'<p class="pr"><a href="/hubs/#ask">See all '+L.length+' places</a></p>':'')
      +'<button type="button" class="go y" data-a="ask"'+(n?'':' disabled')+'>🙋 I would like '+(n===1?'this place':n?'these '+n+' places':'these places')+' as MannaFish Hubs</button><div id="bkSi"></div><p class="msg" id="bkAskMsg" aria-live="polite">'+esc(ASKMSG)+'</p>'
      +'<p class="pr" style="margin-top:10px">A church or business can also <a href="/hubs/#sponsor">sponsor a Hub</a>: you give the fish for a place, and we set it up with them.</p></details>'; }
  function draw(){ var a=items(), S=get(SHIP,{}), me=window.MFacct&&MFacct.me&&MFacct.me(), sid=pick(), P=prayed(), H=ST?byNear(ST):null, real=(H||[]).filter(function(x){ return x.id!=='anywhere'; }).length, h;
    if(DONE){ var D=stn(DONE.station)||{name:DONE.name};
      BOX.firstChild.innerHTML='<div class="ok"><div class="big">🙏</div><h3>Thank you for praying</h3><p>You prayed for '+DONE.n+' fish to be multiplied '+(DONE.station==='anywhere'?'wherever it is needed most':'at <b>'+esc(D.name)+'</b>')+'.</p>'
        +'<p>When enough people pray, we fill the pond'+(DONE.station==='anywhere'?'':' there')+'. We will email you when your fish is in'+(DONE.station==='anywhere'?'.':', so you can come and get it, free.')+'</p>'
        +'<p style="font:italic .95rem Spectral,Georgia,serif;opacity:.8">He took the loaves; and when he had given thanks, he distributed … as much as they would (John 6:11).</p>'
        +askHTML(!real)+'<p><a href="/hubs/">See every MannaFish Hub</a></p><button type="button" class="go" data-a="close">Keep fishing</button></div>'; return; }
    h='<div class="hd"><h3>Your prayer basket</h3><button type="button" class="x" data-a="close" aria-label="Close">&#10005;</button></div>'
      +'<p class="sub">Pray the Lord of the harvest (Matthew 9:38). Every fish here is a prayer that it be multiplied at a MannaFish Hub near you. When enough people pray, we fill the pond, and you pick yours up there, free.</p>';
    var was=P.length?'<div class="was"><h4>You are praying for</h4>'+P.slice(0,24).map(function(x,i){ return '<div class="row" data-p="'+i+'"><span class="th" data-a="zoom" role="button" tabindex="0" aria-label="See '+esc(x.word)+' bigger"></span><span class="nm"><b>'+esc(x.word)+'</b><small>'+esc(x.sname||'')+'</small></span><span class="ct">'+(ST?how(x,x.station):'')+'</span></div>'; }).join('')+'</div>':'';
    if(!a.length){ BOX.firstChild.innerHTML=h+'<p class="empty">Your prayer basket is empty. Tap 🧺 on any fish to put it in.</p>'+askHTML(false)+was+'<p style="text-align:center"><a href="/hubs/">See every MannaFish Hub</a></p><button type="button" class="keep" data-a="close">Keep looking</button>'; thumbs(P); return; }
    h+=a.map(function(x,i){ return '<div class="row" data-i="'+i+'"><span class="th" data-a="zoom" role="button" tabindex="0" aria-label="See '+esc(x.word)+' bigger"></span><span class="nm"><b>'+esc(x.word)+'</b><small>'+esc(x.ref||'')+'</small></span>'
      +'<span class="ct">'+(x.main?'<select data-f="l" aria-label="Language">'+LANGS.map(function(L){ return '<option value="'+L[0]+'"'+(L[0]===x.l?' selected':'')+'>'+L[1]+'</option>'; }).join('')+'</select>':'')
      +'<button type="button" class="rm" data-a="rm" aria-label="Take out">&#10005;</button></span></div>'; }).join('');
    h+='<h4>Which MannaFish Hub?'+(near()?'':'<button type="button" class="near" data-a="near">📍 Nearest to me</button>')+'</h4>'
      +(H?'<div class="stn" role="radiogroup">'+H.map(function(x){ return '<label><input type="radio" name="bkStn" value="'+esc(x.id)+'"'+(x.id===sid?' checked':'')+'><span style="flex:1"><span class="d">'+esc(mi(x))+'</span><b>'+esc(x.name)+'</b>'+(x.city?' · '+esc(x.city):'')
      +'<small>'+(x.address?esc(x.address)+' · ':x.where?esc(x.where)+' · ':'')+(x.total||0)+' of '+(x.threshold||100)+' praying</small></span></label>'; }).join('')+'</div>'
      +(real?'':'<p class="pr" style="margin:6px 0 0">No Hub is open yet. Pray for your fish to go wherever it is needed most, and ask for a Hub near you below.</p>'):'<p class="pr">Finding the Hubs…</p>')
      +'<form novalidate><div class="f">'
      +'<label>Your name<input id="bkName" autocomplete="name" value="'+esc(S.name||'')+'"></label><label>Your email<input id="bkEmail" type="email" autocomplete="email" value="'+esc(S.email||(me&&me.email)||'')+'" required></label>'
      +'</div><p class="pr" style="margin:6px 0 0">Only to tell you when your fish is in. One prayer per fish per person.</p><input type="text" id="bkHp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'
      +'<button type="submit" class="go" id="bkGo">🙏 Pray for '+(a.length===1?'this fish':'these '+a.length+' fish')+'</button><p class="msg" id="bkMsg" aria-live="polite"></p></form>'
      +askHTML(!real)+was+'<button type="button" class="keep" data-a="close">Keep looking</button>';
    BOX.firstChild.innerHTML=h; [].forEach.call(BOX.querySelectorAll('.row[data-i]'),function(r){ thumb(r.querySelector('.th'),a[+r.dataset.i]); }); thumbs(P); }
  function thumbs(P){ [].forEach.call(BOX.querySelectorAll('.row[data-p]'),function(r){ thumb(r.querySelector('.th'),P[+r.dataset.p]); }); }
  // tap a fish to see it big (Ken, 25 Oct: "click on the fish and it blows it up so the user can see it better"); a tap anywhere closes it
  var ZM=null;
  function zoom(x){ unzoom(); var lang=(LANGS.filter(function(l){ return l[0]===(x.l||'en'); })[0]||[])[1]||'';
    ZM=document.createElement('div'); ZM.className='mfbkz'; ZM.setAttribute('role','dialog'); ZM.setAttribute('aria-label',x.word);
    var main=String(x.id).indexOf('M:')===0, admin=''; try{ admin=localStorage.getItem('mf-admin-key')||''; }catch(e){}
    ZM.innerHTML='<button type="button" class="zx" aria-label="Close">&#10005;</button><div class="zf"></div><p><b>'+esc(x.word)+'</b>'+(x.ref?' · '+esc(x.ref):'')+(main&&lang?' · '+esc(lang):'')+'</p>'
      +'<span class="zb">'+(window.MFfeedback?'<button type="button" data-z="fb">🎨 Something looks wrong</button>':'')+(admin&&main?'<a href="/edit/?find='+encodeURIComponent(x.word)+'&code='+encodeURIComponent(x.l||'en')+'">✏️ Fix it in the edit sheet</a>':'')+'</span><small>Tap anywhere to close</small>';
    document.body.appendChild(ZM); var f=ZM.querySelector('.zf'); thumb(f,x);
    ZM.addEventListener('click',function(e){ if(e.target.closest('a')) return; if(e.target.closest('[data-z=fb]')){ unzoom(); MFfeedback.open({kind:'design',feature:'The fish',fish:x.word+(main&&lang?' · '+lang:'')}); return; } unzoom(); }); }
  function unzoom(){ if(ZM){ ZM.remove(); ZM=null; } }
  function redraw(){ var d=BOX.querySelector('details.ask'), o=d&&d.open, y=BOX.firstChild.scrollTop; keepForm(); draw(); var d2=BOX.querySelector('details.ask'); if(d2&&o) d2.open=true; BOX.firstChild.scrollTop=y; }
  function click(e){ var t=e.target, b=t.closest('[data-a]');
    if(t===BOX){ close(); return; } if(!b) return;
    var a=items(), r=b.closest('.row'), act=b.dataset.a;
    if(act==='close'){ close(); return; }
    if(act==='zoom'&&r){ var x=r.dataset.i!=null?a[+r.dataset.i]:prayed()[+r.dataset.p]; if(x) zoom(x); return; }
    if(act==='rm'&&r&&r.dataset.i!=null){ keepForm(); a.splice(+r.dataset.i,1); save(a); draw(); return; }
    if(act==='near'){ b.disabled=true; b.textContent='📍 Finding you…'; locate().then(redraw,function(){ b.textContent='📍 Location is off'; }); return; }
    if(act==='ask'){ var ids=Object.keys(PICK).filter(function(k){ return PICK[k]&&!MINE[k]; }); if(!ids.length) return;
      var go=function(){ b.disabled=true; ASKMSG='Asking…'; BOX.querySelector('#bkAskMsg').textContent=ASKMSG;
        vote(ids,true).then(function(){ PICK={}; ASKMSG='Thank you! You asked for '+ids.length+(ids.length===1?' place':' places')+'. We will let you know when one becomes a Hub.'; redraw(); })
          .catch(function(err){ b.disabled=false; if(err&&err.message==='signin'){ ASKMSG=''; BOX.querySelector('#bkAskMsg').textContent=''; signin(BOX.querySelector('#bkSi'),go); return; } ASKMSG='It could not be sent just now. '+(err&&err.message||''); BOX.querySelector('#bkAskMsg').textContent=ASKMSG; }); };
      go(); return; } }
  function change(e){ if(e.target.name==='bkStn'){ put(STN,e.target.value); keepForm(); return; }
    if(e.target.name==='bkAsk'){ PICK[e.target.value]=e.target.checked; var n=Object.keys(PICK).filter(function(k){ return PICK[k]&&!MINE[k]; }).length, g=BOX.querySelector('[data-a=ask]');
      if(g){ g.disabled=!n; g.textContent='🙋 I would like '+(n===1?'this place':n?'these '+n+' places':'these places')+' as MannaFish Hubs'; } return; }
    var r=e.target.closest('.row'); if(r&&e.target.dataset.f==='l'){ var a=items(), x=a[+r.dataset.i]; x.l=e.target.value; save(a); thumb(r.querySelector('.th'),x); } }   // the picture follows the language
  // what was typed stays when the list is drawn again
  function keepForm(){ if(!BOX||!BOX.querySelector('#bkEmail')) return; var S=get(SHIP,{}); S.name=val('bkName')||S.name; S.email=val('bkEmail')||S.email; put(SHIP,S); }
  function send(){ var a=items(), m=BOX.querySelector('#bkMsg'), go=BOX.querySelector('#bkGo'), c=BOX.querySelector('input[name=bkStn]:checked'); if(!a.length) return;
    if(!c){ m.textContent='Please choose a MannaFish Hub.'; var f=BOX.querySelector('input[name=bkStn]'); if(f) f.focus(); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('bkEmail'))){ BOX.querySelector('#bkEmail').focus(); m.textContent='Please check your email address.'; return; }
    keepForm(); var sid=c.value, S=stn(sid)||{name:''}, list=a.slice(0,MAXN);
    var body={station:sid,name:val('bkName'),email:val('bkEmail'),hp:val('bkHp'),items:list.map(function(x){ return {fish:x.id,word:x.word,l:x.main?(x.l||'en'):'en'}; })};
    go.disabled=true; m.textContent='Praying…';
    fetch('/api/hubs/pray',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok||!j.ok) throw new Error(j.error||('HTTP '+r.status)); return j; }); })
      .then(function(j){ var P=prayed().filter(function(p){ return !(p.station===sid&&list.some(function(x){ return key(x)===key(p); })); });
        list.forEach(function(x){ P.unshift({id:x.id,word:x.word,ref:x.ref||'',svg:x.svg||'',main:x.main,l:x.l||'en',station:sid,sname:S.name,at:Date.now()}); }); put(PRAY,P.slice(0,100));
        S.total=j.total; S.fish=S.fish||{}; (j.items||[]).forEach(function(y){ S.fish[y.fish+'|'+y.l]=y.n; });
        DONE={n:list.length,station:sid,name:S.name}; save(a.slice(MAXN)); draw(); if(window.MFacct) MFacct.touch('praying'); })
      .catch(function(err){ go.disabled=false; m.textContent='It could not be sent just now. Please try again in a moment.'+(err&&err.message?' ('+err.message+')':''); }); }

  window.MFbasket={add:add,open:open,close:close,items:items,count:function(){ return items().length; },sent:function(){ return get(SENT,[]); },praying:prayed,stations:stations,refresh:fab};
  window.addEventListener('storage',function(e){ if(e.key===KEY) fab(); });
  if(document.body) fab(); else document.addEventListener('DOMContentLoaded',fab);
})();
