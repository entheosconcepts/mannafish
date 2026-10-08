import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
# banner above the fish
rep('  <div class="stage-col">','  <div class="resumebar" id="resumeBar" hidden><span id="resumeTxt"></span><span class="rbtns"><button type="button" class="toolbtn" id="resumeGo">Pick up where I left off</button><button type="button" class="rx" id="resumeX" aria-label="Dismiss">&#215;</button></span></div>\n  <div class="stage-col">')
# a "pick up" line inside My MannaFish too
rep('<h4 id="acctNotesH">My notes</h4>','<div id="acctResume" class="acctresume" hidden></div><h4 id="acctNotesH">My notes</h4>')
css='''
/* Ken, 8 Oct: pick up where I left off -- the word, the flipped card, the open verse or Strong's entry, the languages */
.resumebar{display:flex;align-items:center;justify-content:center;gap:10px 14px;flex-wrap:wrap;max-width:720px;margin:4px auto 14px;padding:10px 14px;border:1px solid var(--brass,#2a5fb0);border-radius:10px;background:rgba(42,95,176,.12);font:.92rem 'Archivo',sans-serif;text-align:center}
.resumebar[hidden]{display:none}
.resumebar .rbtns{display:inline-flex;gap:8px;align-items:center}
.resumebar .rx{background:none;border:0;color:inherit;font-size:1.3rem;line-height:1;cursor:pointer;opacity:.7;padding:4px 6px}
.acctresume{margin-top:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;font:.9rem 'Archivo',sans-serif}
.acctresume[hidden]{display:none}
'''
s=s.replace('</style>',css+'</style>',1)
s=s.replace("#notesBox,#acctBox,.fishspk,.saybox'","#notesBox,#acctBox,.fishspk,.saybox,#resumeBar'")
# remember what is open in the verse panel
rep("  function closeReader(){reader.classList.remove('open');","  function closeReader(){window.MFreader=null; if(window.MFsave) MFsave(); reader.classList.remove('open');")
rep("  function openStrongs(k,gk){\n","  function openStrongs(k,gk){\n    window.MFreader={kind:'strongs',k:k,gk:!!gk}; if(window.MFsave) setTimeout(MFsave,0);\n")
rep("  function openReader(k,i){\n","  function openReader(k,i){\n    window.MFreader={kind:'ref',k:k,i:i}; if(window.MFsave) setTimeout(MFsave,0);\n")
rep("    b.addEventListener('click',function(e){e.stopPropagation();stage.classList.toggle('on');sizeStage();});","    b.addEventListener('click',function(e){e.stopPropagation();stage.classList.toggle('on');sizeStage();if(window.MFsave)MFsave();});")
rep("  $('flip').addEventListener('click',function(){stage.classList.toggle('on');sizeStage();});","  $('flip').addEventListener('click',function(){stage.classList.toggle('on');sizeStage();if(window.MFsave)MFsave();});")
rep("  window.MFword=function(){ stopSpeak(); $('sayMain').hidden=true; cmpOn={};","  window.MFword=function(){ stopSpeak(); $('sayMain').hidden=true; cmpOn={}; if(window.MFsave) MFsave();")
# signed-in: the account's copy is checked when the person signs in
rep("  function setMe(u){ var was=me; me=u; acctUi(); if(u && (!was || was.id!==u.id)){","  function setMe(u){ var was=me; me=u; acctUi(); if(u && (!was || was.id!==u.id)){ if(window.MFresumeCloud) MFresumeCloud(u.user_metadata&&u.user_metadata.mf_resume);")
js=r'''  // ── Pick up where I left off (Ken, 8 Oct). The page keeps a note of where the person is: the word, the card
  // turned over, the verse or Strong's entry open, the languages side by side. Kept on the device, and in the
  // person's account when signed in, so it follows them to another phone or computer.
  var RKEY2='mf-resume', saveReady=false, resumeState=null, cloudT=null, lastSaved='';
  function readResume(){ try{ return JSON.parse(localStorage.getItem(RKEY2)||'null'); }catch(e){ return null; } }
  function snapshot(){ var r=window.MFreader, on=[]; for(var l in cmpOn) if(cmpOn[l]) on.push(l);
    return {w:cur, lang:MF.lang, flipped:$('stage').classList.contains('on'), cmp:cmpSel.slice(), cmpOn:on,
      reader:r&&r.k===cur?{kind:r.kind,i:r.i,gk:r.gk}:null, at:Date.now()}; }
  window.MFsave=function(){ if(!saveReady) return; var st=snapshot(), sig=JSON.stringify([st.w,st.lang,st.flipped,st.cmp,st.cmpOn,st.reader]);
    if(sig===lastSaved) return; lastSaved=sig; resumeState=st;
    try{ localStorage.setItem(RKEY2,JSON.stringify(st)); }catch(e){}
    clearTimeout(cloudT); cloudT=setTimeout(function(){ if(me&&sb) sb.auth.updateUser({data:{mf_resume:st}}).catch(function(){}); },3000);
    fillResumeLink(); };
  function describe(st){ var es=MF.lang==='es', d=DATA[st.w]; if(!d) return ''; var t=wordTitle(st.w);
    if(st.reader&&st.reader.kind==='ref'&&d.refs[st.reader.i]){ var r=d.refs[st.reader.i][0]; t+=' · '+(es?esRef(r):r); }
    else if(st.reader&&st.reader.kind==='strongs'){ var sg=STRONGS[st.w]||['','']; t+=' · Strong’s '+(st.reader.gk?'G'+sg[0]:'H'+sg[1]); }
    else if(st.flipped) t+=' · '+(es?'estudio de la palabra':'word study');
    if(st.cmp&&st.cmp.length) t+=' · '+(st.cmp.length+1)+(es?' idiomas':' languages');
    return t; }
  function worthIt(st){ return st && DATA[st.w] && (Date.now()-(st.at||0) < 60*86400000) &&
    (st.w!==cur || st.flipped || st.reader || (st.cmp&&st.cmp.length)); }
  function resumeTo(st){ if(!st||!DATA[st.w]) return; saveReady=false;
    if(st.lang && st.lang!==MF.lang) MF.set(st.lang);
    pick(st.w,false);
    if(st.cmp&&st.cmp.length){ setCmp(st.cmp); (st.cmpOn||[]).forEach(function(l){ cmpOn[l]=true; }); MFcmp(); }
    else if(st.flipped){ $('stage').classList.add('on'); sizeStage(); }
    if(st.reader&&st.reader.kind==='ref') openReader(st.w,st.reader.i);
    else if(st.reader&&st.reader.kind==='strongs') openStrongs(st.w,st.reader.gk);
    $('resumeBar').hidden=true; saveReady=true; lastSaved=''; MFsave();
    setTimeout(function(){ var t=(st.reader&&reader.classList.contains('inline'))?reader:(st.cmp&&st.cmp.length?$('cmp'):$('stage')); t.scrollIntoView({behavior:'smooth',block:'start'}); },250); }
  function resumeLabels(){ var es=MF.lang==='es'; $('resumeGo').textContent=es?'Continuar donde lo dejé':'Pick up where I left off';
    if(resumeState && !$('resumeBar').hidden) $('resumeTxt').textContent=(es?'Bienvenido de nuevo — ':'Welcome back — ')+describe(resumeState); fillResumeLink(); }
  function fillResumeLink(){ var box=$('acctResume'); if(!box) return; var st=resumeState||readResume();
    if(!st||!DATA[st.w]){ box.hidden=true; return; } var es=MF.lang==='es';
    box.innerHTML='<span class="mu">'+(es?'Donde lo dejaste: ':'Where you left off: ')+esc2(describe(st))+'</span><button type="button" class="toolbtn" id="acctResumeGo">'+(es?'Continuar donde lo dejé':'Pick up where I left off')+'</button>';
    box.hidden=false; }
  function offer(st){ if(!worthIt(st)) return; resumeState=st; $('resumeBar').hidden=false; resumeLabels(); }
  $('resumeGo').addEventListener('click',function(){ resumeTo(resumeState); });
  $('resumeX').addEventListener('click',function(){ $('resumeBar').hidden=true; });
  $('acctResume').addEventListener('click',function(e){ if(e.target.closest('#acctResumeGo')) resumeTo(resumeState||readResume()); });
  // when the person signs in: the account's place, if it is newer than this device's
  window.MFresumeCloud=function(st){ var local=readResume(); if(st && (!local || (st.at||0)>(local.at||0))){ try{ localStorage.setItem(RKEY2,JSON.stringify(st)); }catch(e){} if(!saveReady||$('resumeBar').hidden) offer(st); else { resumeState=st; resumeLabels(); } } fillResumeLink(); };
  // after the page has set itself up: offer the last place (not when a link asked for a particular word)
  window.MFresumeInit=function(){ var st=readResume(); resumeState=st;
    if(!/[?&#]w=|[?&]token_hash=/.test(location.search+location.hash)) offer(st);
    saveReady=true; fillResumeLink(); };
  MF.onChange(resumeLabels);
'''
anchor="  // Ken, 7 Oct: \"Select language\""
# the resume code needs cmpSel/setCmp/cmpOn, which come later; put it just before MF.applyPage()
rep("  MF.applyPage();\n  document.querySelectorAll('.offerbtn')", js+"  MF.applyPage();\n  document.querySelectorAll('.offerbtn')")
rep("  pick(cur,false);\n  restoreReturn();","  pick(cur,false);\n  restoreReturn();\n  if(window.MFresumeInit) MFresumeInit();")
open(p,'w',encoding='utf-8').write(s)
