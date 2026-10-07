import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:80]; s=s.replace(a,b)
# third button + account panel
rep('<span id="notesLab">My notes</span></button></div>',
    '<span id="notesLab">My notes</span></button><button class="toolbtn" type="button" id="acctBtn" aria-expanded="false"><span aria-hidden="true">&#128100;</span> <span id="acctLab">Sign in</span></button></div>\n'
    '  <div class="notesbox acctbox" id="acctBox" hidden>\n'
    '    <div id="acctOut"><b id="acctHd">Sign in to MannaFish</b><p class="rnote" id="acctWhy">Keep your notes on every device, and see your decal orders. No password: we email you a code.</p>\n'
    '      <form id="acctEmailF" class="acctrow"><input id="acctEmail" type="email" required autocomplete="email" placeholder="you@email.com"><button class="toolbtn" type="submit" id="acctSend">Email me a code</button></form>\n'
    '      <form id="acctCodeF" class="acctrow" hidden><input id="acctCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Code from the email"><button class="toolbtn" type="submit" id="acctGo">Sign in</button></form>\n'
    '      <p class="rnote" id="acctMsg"></p></div>\n'
    '    <div id="acctIn" hidden><div class="nhd"><b id="acctMe"></b><button class="toolbtn" type="button" id="acctOutBtn">Sign out</button></div>\n'
    '      <h4 id="acctNotesH">My notes</h4><div id="acctNotes" class="acctlist"></div>\n'
    '      <h4 id="acctOrdersH">My decal orders</h4><div id="acctOrders" class="acctlist"></div>\n'
    '      <h4 id="acctActH">Recently viewed</h4><div id="acctAct" class="acctlist"></div></div>\n'
    '  </div>')
css='''
.acctbox h4{font:600 .75rem 'Archivo',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--foam-dim,#aaa);margin:14px 0 6px}
.acctrow{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.acctrow input{flex:1 1 200px;min-width:0;font:1rem 'Archivo',sans-serif;background:rgba(255,255,255,.04);color:inherit;border:1px solid var(--line,#333);border-radius:6px;padding:9px 10px}
.acctlist{font:.9rem/1.5 'Archivo',sans-serif}
.acctlist .it{padding:6px 0;border-bottom:1px solid var(--line,#333)}
.acctlist .it:last-child{border-bottom:0}
.acctlist button{font:inherit;background:none;border:0;color:var(--brass-soft,#7fb0ff);cursor:pointer;padding:0;text-decoration:underline}
.acctlist .mu{color:var(--foam-dim,#aaa)}
:root[data-mode="light"] .acctrow input{background:#fff}
'''
s=s.replace('</style>',css+'</style>',1)
s=s.replace("#langBtn,#modeBtn,#cmpBtn,#cmpCap,#cmpMenu,.cmp,.toolrow,#notesBox'","#langBtn,#modeBtn,#cmpBtn,#cmpCap,#cmpMenu,.cmp,.toolrow,#notesBox,#acctBox'")
js=r'''  // ── Accounts (Ken's Yadah Supabase project). Sign in with an emailed code or link; notes follow the person
  // to every device, decal orders and recently viewed words show in "My MannaFish". Every row is private
  // to its owner by the database's own rules; the key below is the public one, safe in a web page.
  var SB_URL='https://oblttpxqjvaglwfdszdg.supabase.co', SB_KEY='sb_publishable_Nl4EDkBHlrnEqFVcL_oGvQ_J-X-t3Wc', SITE='mannafish';
  var sb=null, me=null, sbLoading=null, seen={};
  function T(en,es){ return MF.lang==='es'?es:en; }
  function loadSb(){ if(sb) return Promise.resolve(sb); if(sbLoading) return sbLoading;
    sbLoading=new Promise(function(ok,no){ if(window.supabase&&window.supabase.createClient) return ok();
      var sc=document.createElement('script'); sc.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; sc.onload=ok; sc.onerror=no; document.head.appendChild(sc); })
      .then(function(){ sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,detectSessionInUrl:true}});
        sb.auth.onAuthStateChange(function(ev,session){ setMe(session&&session.user||null); }); return sb.auth.getSession(); })
      .then(function(r){ setMe(r&&r.data&&r.data.session&&r.data.session.user||null); return sb; });
    return sbLoading; }
  function setMe(u){ var was=me; me=u; acctUi(); if(u && (!was || was.id!==u.id)){ moveDeviceNotes().then(function(){ if(!$('acctBox').hidden) fillAcct(); if(!$('notesBox').hidden) showNotes(); }); logView(cur); } }
  function acctUi(){ $('acctLab').textContent=me?T('My MannaFish','Mi MannaFish'):T('Sign in','Iniciar sesión');
    $('acctOut').hidden=!!me; $('acctIn').hidden=!me; if(me) $('acctMe').textContent=me.email||'';
    $('acctHd').textContent=T('Sign in to MannaFish','Inicia sesión en MannaFish');
    $('acctWhy').textContent=T('Keep your notes on every device, and see your decal orders. No password: we email you a code.','Guarda tus notas en todos tus dispositivos y ve tus pedidos de calcomanías. Sin contraseña: te enviamos un código por correo.');
    $('acctSend').textContent=T('Email me a code','Envíame un código'); $('acctGo').textContent=T('Sign in','Entrar'); $('acctOutBtn').textContent=T('Sign out','Salir');
    $('acctCode').placeholder=T('Code from the email','Código del correo');
    $('acctNotesH').textContent=T('My notes','Mis notas'); $('acctOrdersH').textContent=T('My decal orders','Mis pedidos de calcomanías'); $('acctActH').textContent=T('Recently viewed','Visto recientemente');
    $('notesWhere').textContent=me?T('Saved to your account','Guardado en tu cuenta'):T('Saved on this device','Guardado en este dispositivo'); }
  function esc2(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function when(d){ try{ return new Date(d).toLocaleDateString(MF.lang==='es'?'es':'en',{month:'short',day:'numeric',year:'numeric'}); }catch(e){ return ''; } }
  function fillAcct(){ if(!me||!sb) return;
    sb.from('notes').select('word_key,body,updated_at').eq('site',SITE).order('updated_at',{ascending:false}).limit(20).then(function(r){
      var rows=(r.data||[]).filter(function(n){return n.body&&DATA[n.word_key];});
      $('acctNotes').innerHTML=rows.length?rows.map(function(n){return '<div class="it"><button type="button" data-k="'+n.word_key+'">'+esc2(wordName(n.word_key))+'</button> <span class="mu">'+when(n.updated_at)+'</span><br>'+esc2(n.body.length>140?n.body.slice(0,140)+'…':n.body)+'</div>';}).join(''):'<div class="mu">'+T('No notes yet.','Aún no hay notas.')+'</div>'; });
    sb.from('orders').select('created_at,status,order_items(word_key,language,qty)').eq('site',SITE).order('created_at',{ascending:false}).limit(20).then(function(r){
      var rows=r.data||[];
      $('acctOrders').innerHTML=rows.length?rows.map(function(o){ var it=(o.order_items||[]).map(function(i){return (i.qty||'')+' × '+esc2(DATA[i.word_key]?wordName(i.word_key):i.word_key)+' ('+esc2(i.language||'')+')';}).join(', ');
        return '<div class="it">'+when(o.created_at)+' · '+it+' <span class="mu">· '+esc2(o.status)+'</span></div>';}).join(''):'<div class="mu">'+T('No orders yet.','Aún no hay pedidos.')+'</div>'; });
    sb.from('activity').select('word_key,at').eq('site',SITE).eq('kind','viewed').order('at',{ascending:false}).limit(30).then(function(r){
      var out=[],got={}; (r.data||[]).forEach(function(a){ if(!got[a.word_key]&&DATA[a.word_key]){got[a.word_key]=1;out.push(a);} });
      $('acctAct').innerHTML=out.length?out.slice(0,8).map(function(a){return '<button type="button" data-k="'+a.word_key+'">'+esc2(wordName(a.word_key))+'</button>';}).join(' · '):'<div class="mu">—</div>'; }); }
  function logView(k){ if(!me||!sb||seen[k]) return; seen[k]=1; sb.from('activity').insert({site:SITE,kind:'viewed',word_key:k}).then(function(){}); }
  // notes: one per word; device copy first so typing is never lost, then the account copy
  function cloudGet(k){ return sb.from('notes').select('id,body').eq('site',SITE).eq('word_key',k).order('updated_at',{ascending:false}).limit(1).then(function(r){ return (r.data||[])[0]||null; }); }
  function cloudPut(k,text){ return cloudGet(k).then(function(row){
      if(row) return text.trim()? sb.from('notes').update({body:text}).eq('id',row.id) : sb.from('notes').delete().eq('id',row.id);
      if(text.trim()) return sb.from('notes').insert({site:SITE,word_key:k,body:text}); }); }
  function moveDeviceNotes(){ var n=notes(), ks=Object.keys(n).filter(function(k){return n[k].text;});
    return Promise.all(ks.map(function(k){ return cloudGet(k).then(function(row){ if(!row) return sb.from('notes').insert({site:SITE,word_key:k,body:n[k].text}); }); })).catch(function(){}); }
  window.MFnoteSaved=function(k,text){ if(me&&sb) cloudPut(k,text).then(function(r){ if(r&&r.error) $('notesMsg').textContent=T('Saved on this device; account save failed','Guardado aquí; no se pudo guardar en la cuenta'); }); };
  window.MFnoteLoad=function(k,cb){ if(!(me&&sb)) return; cloudGet(k).then(function(row){ if(row&&k===cur) cb(row.body); }); };
  $('acctBtn').addEventListener('click',function(){ var open=$('acctBox').hidden; $('acctBox').hidden=!open; $('acctBtn').setAttribute('aria-expanded',String(open));
    if(open){ loadSb().then(fillAcct).catch(function(){ $('acctMsg').textContent=T('Could not reach sign-in. Try again shortly.','No se pudo conectar. Inténtalo en un momento.'); }); } });
  $('acctEmailF').addEventListener('submit',function(e){ e.preventDefault(); var em=$('acctEmail').value.trim(); if(!em) return;
    $('acctMsg').textContent=T('Sending…','Enviando…');
    loadSb().then(function(){ return sb.auth.signInWithOtp({email:em,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname}}); })
      .then(function(r){ if(r.error) throw r.error; $('acctCodeF').hidden=false; $('acctCode').focus();
        $('acctMsg').textContent=T('Check your email for a code (or tap the link in it).','Revisa tu correo: escribe el código (o toca el enlace).'); })
      .catch(function(err){ $('acctMsg').textContent=T('Could not send the email','No se pudo enviar el correo')+(err&&err.message?': '+err.message:''); }); });
  $('acctCodeF').addEventListener('submit',function(e){ e.preventDefault(); var code=$('acctCode').value.replace(/\s/g,''); if(!code) return;
    sb.auth.verifyOtp({email:$('acctEmail').value.trim(),token:code,type:'email'}).then(function(r){ if(r.error) throw r.error; $('acctMsg').textContent=''; $('acctCodeF').hidden=true; $('acctCode').value=''; })
      .catch(function(){ $('acctMsg').textContent=T('That code did not work. Check it, or send a new one.','Ese código no funcionó. Revísalo o pide uno nuevo.'); }); });
  $('acctOutBtn').addEventListener('click',function(){ sb&&sb.auth.signOut(); });
  ['acctNotes','acctAct'].forEach(function(id){ $(id).addEventListener('click',function(e){ var b=e.target.closest('button[data-k]'); if(b){ pick(b.dataset.k,true); } }); });
  // returning visitors who signed in before: start quietly, so their notes and history are ready
  try{ if(Object.keys(localStorage).some(function(k){return /^sb-.*-auth-token$/.test(k);}) || /access_token=|[?&]code=/.test(location.href)) loadSb().catch(function(){}); }catch(e){}
  acctUi(); MF.onChange(function(){ acctUi(); if(!$('acctBox').hidden) fillAcct(); });
'''
anchor="  // Ken, 7 Oct: \"Select language\""
rep(anchor, js+anchor)
# notes: also save to / read from the account
rep("    $('notesMsg').textContent=saveNotes(n)?(MF.lang==='es'?'Guardado':'Saved'):(MF.lang==='es'?'No se pudo guardar en este navegador':'Could not save in this browser'); },400); });",
    "    $('notesMsg').textContent=saveNotes(n)?(MF.lang==='es'?'Guardado':'Saved'):(MF.lang==='es'?'No se pudo guardar en este navegador':'Could not save in this browser'); if(window.MFnoteSaved) MFnoteSaved(cur,t); },400); });")
rep("  function showNotes(){ var n=notes(), es=MF.lang==='es'; $('notesWord').textContent=wordName(cur); $('notesText').value=(n[cur]&&n[cur].text)||'';",
    "  function showNotes(){ var n=notes(), es=MF.lang==='es'; $('notesWord').textContent=wordName(cur); $('notesText').value=(n[cur]&&n[cur].text)||'';\n    if(window.MFnoteLoad) MFnoteLoad(cur,function(body){ if(document.activeElement!==$('notesText')) $('notesText').value=body; });")
# record each word viewed, for signed-in people
rep("  window.MFword=function(){ stopSpeak(); if(!$('notesBox').hidden) showNotes(); };",
    "  window.MFword=function(){ stopSpeak(); if(!$('notesBox').hidden) showNotes(); if(window.MFview) MFview(cur); };")
s=s.replace("  acctUi(); MF.onChange(function(){ acctUi();","  window.MFview=logView;\n  acctUi(); MF.onChange(function(){ acctUi();")
# decal requests also become orders in the account system
rep("        .then(function(r){if(!r.ok) throw 0; f.reset();",
    "        .then(function(r){if(!r.ok) throw 0; if(f.id==='giftForm') fetch('/api/order-record',{method:'POST',headers:H,body:body}).catch(function(){}); f.reset();")
open(p,'w',encoding='utf-8').write(s)
