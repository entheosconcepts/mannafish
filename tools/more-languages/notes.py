import sys,json
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:80]; s=s.replace(a,b)
SPEAK=json.load(open('/home/user/mannafish/netlify/functions/lib/speak.json',encoding='utf-8'))
rep('  <div class="sharerow"><span class="rnote" id="shareMsg"></span></div>\n',
'''  <div class="sharerow"><span class="rnote" id="shareMsg"></span></div>
  <!-- Ken, 7 Oct: hear the verse, and keep notes (typed or spoken). Notes stay on this device until accounts come. -->
  <div class="toolrow"><button class="toolbtn" type="button" id="listenBtn" aria-pressed="false"><span aria-hidden="true">&#128266;</span> <span id="listenLab">Listen</span></button><button class="toolbtn" type="button" id="notesBtn" aria-expanded="false"><span aria-hidden="true">&#9998;</span> <span id="notesLab">My notes</span></button></div>
  <div class="notesbox" id="notesBox" hidden>
    <div class="nhd"><b id="notesWord"></b><span class="rnote" id="notesWhere">Saved on this device</span></div>
    <textarea id="notesText" rows="5" placeholder="What is God showing you in this word?"></textarea>
    <div class="nrow"><button class="toolbtn" type="button" id="micBtn" aria-pressed="false"><span aria-hidden="true">&#127908;</span> <span id="micLab">Speak a note</span></button><span class="rnote" id="notesMsg"></span></div>
    <div class="nrecent" id="notesRecent"></div>
  </div>
''')
css='''
.toolrow{display:flex;gap:10px;justify-content:center;margin:10px 0 2px}
.toolbtn{font:600 .85rem 'Archivo',sans-serif;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1px solid var(--line,#333);background:transparent;color:inherit;cursor:pointer}
.toolbtn:hover,.toolbtn[aria-pressed="true"],.toolbtn[aria-expanded="true"]{border-color:var(--brass)}
.toolbtn[aria-pressed="true"]{background:rgba(42,95,176,.25)}
.notesbox{width:100%;max-width:720px;margin:8px auto 0;border:1px solid var(--line,#333);border-radius:8px;padding:14px;text-align:left}
.notesbox[hidden]{display:none}
.notesbox .nhd{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:8px;font-family:'Archivo',sans-serif}
.notesbox textarea{width:100%;box-sizing:border-box;font:1rem/1.5 'Spectral',serif;background:rgba(255,255,255,.04);color:inherit;border:1px solid var(--line,#333);border-radius:6px;padding:10px;resize:vertical}
.notesbox .nrow{display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap}
.notesbox .nrecent{margin-top:12px;font:.82rem 'Archivo',sans-serif;color:var(--foam-dim,#aaa)}
.notesbox .nrecent button{font:inherit;background:none;border:0;color:var(--brass-soft,#7fb0ff);cursor:pointer;padding:0 4px;text-decoration:underline}
:root[data-mode="light"] .notesbox textarea{background:#fff}
'''
s=s.replace('</style>',css+'</style>',1)
s=s.replace("#langBtn,#modeBtn,#cmpBtn,#cmpCap,#cmpMenu,.cmp'","#langBtn,#modeBtn,#cmpBtn,#cmpCap,#cmpMenu,.cmp,.toolrow,#notesBox'")
js='''  // ── Listen: a natural voice from /api/tts once a voice key is added in Netlify; until then the device's own voice ──
  var SPEAK=%s, audio=null, speaking=false;
  function ui(){ var es=MF.lang==='es';
    $('listenLab').textContent=speaking?(es?'Detener':'Stop'):(es?'Escuchar':'Listen');
    $('notesLab').textContent=es?'Mis notas':'My notes'; $('micLab').textContent=recOn?(es?'Detener':'Stop'):(es?'Dictar una nota':'Speak a note');
    $('notesWhere').textContent=es?'Guardado en este dispositivo':'Saved on this device';
    $('notesText').placeholder=es?'¿Qué te muestra Dios en esta palabra?':'What is God showing you in this word?'; }
  function stopSpeak(){ speaking=false; if(audio){audio.pause();audio=null;} if(window.speechSynthesis) speechSynthesis.cancel(); $('listenBtn').setAttribute('aria-pressed','false'); ui(); }
  function bestVoice(lang){ var vs=(window.speechSynthesis&&speechSynthesis.getVoices())||[], want=lang==='es'?'es':'en';
    var pick=vs.filter(function(v){return v.lang.toLowerCase().indexOf(want)===0;});
    pick.sort(function(a,b){ var q=function(v){return /natural|neural|premium|enhanced|siri|google/i.test(v.name)?0:1;}; return q(a)-q(b); });
    return pick[0]||null; }
  function deviceSpeak(text,lang){ if(!window.speechSynthesis){ stopSpeak(); return; } var u=new SpeechSynthesisUtterance(text);
    u.lang=lang==='es'?'es-US':'en-US'; var v=bestVoice(lang); if(v) u.voice=v; u.rate=.92; u.onend=u.onerror=stopSpeak; speechSynthesis.speak(u); }
  $('listenBtn').addEventListener('click',function(){
    if(speaking){ stopSpeak(); return; }
    var lang=MF.lang==='es'?'es':'en', text=(SPEAK[lang]||{})[cur]; if(!text) return;
    speaking=true; $('listenBtn').setAttribute('aria-pressed','true'); ui();
    fetch('/api/tts?w='+cur+'&lang='+lang).then(function(r){ if(!r.ok) throw 0; return r.blob(); })
      .then(function(b){ if(!speaking) return; audio=new Audio(URL.createObjectURL(b)); audio.onended=stopSpeak; return audio.play(); })
      .catch(function(){ if(speaking) deviceSpeak(text,lang); });
  });
  // ── My notes: one note per word, kept in this browser; spoken notes use the device's dictation ──
  var NKEY='mf-notes', recOn=false, rec=null;
  function notes(){ try{ return JSON.parse(localStorage.getItem(NKEY)||'{}')||{}; }catch(e){ return {}; } }
  function saveNotes(n){ try{ localStorage.setItem(NKEY,JSON.stringify(n)); return true; }catch(e){ return false; } }
  function wordName(k){ return MF.lang==='es'&&MF.es&&MF.es.titles?(MF.es.titles[k]||DATA[k].title):DATA[k].title; }
  function showNotes(){ var n=notes(), es=MF.lang==='es'; $('notesWord').textContent=wordName(cur); $('notesText').value=(n[cur]&&n[cur].text)||'';
    var keys=Object.keys(n).filter(function(k){return k!==cur && n[k].text && DATA[k];}).sort(function(a,b){return (n[b].at||0)-(n[a].at||0);}).slice(0,6);
    $('notesRecent').innerHTML=keys.length?((es?'Notas recientes: ':'Recent notes: ')+keys.map(function(k){return '<button type="button" data-k="'+k+'">'+wordName(k)+'</button>';}).join(' ')):''; }
  var nt; $('notesText').addEventListener('input',function(){ clearTimeout(nt); nt=setTimeout(function(){ var n=notes(), t=$('notesText').value;
    if(t.trim()) n[cur]={text:t,at:Date.now()}; else delete n[cur];
    $('notesMsg').textContent=saveNotes(n)?(MF.lang==='es'?'Guardado':'Saved'):(MF.lang==='es'?'No se pudo guardar en este navegador':'Could not save in this browser'); },400); });
  $('notesRecent').addEventListener('click',function(e){ var b=e.target.closest('button[data-k]'); if(b) pick(b.dataset.k,false); });
  $('notesBtn').addEventListener('click',function(){ var open=$('notesBox').hidden; $('notesBox').hidden=!open; $('notesBtn').setAttribute('aria-expanded',String(open)); if(open) showNotes(); });
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) $('micBtn').hidden=true;
  $('micBtn').addEventListener('click',function(){
    if(recOn){ rec&&rec.stop(); return; }
    rec=new SR(); rec.lang=MF.lang==='es'?'es-US':'en-US'; rec.interimResults=false; rec.continuous=true;
    rec.onresult=function(ev){ var t=''; for(var i=ev.resultIndex;i<ev.results.length;i++) if(ev.results[i].isFinal) t+=ev.results[i][0].transcript;
      if(t){ var box=$('notesText'); box.value=(box.value&&!/\\s$/.test(box.value)?box.value+' ':box.value)+t.trim(); box.dispatchEvent(new Event('input')); } };
    rec.onend=function(){ recOn=false; $('micBtn').setAttribute('aria-pressed','false'); ui(); };
    rec.onerror=function(){ $('notesMsg').textContent=MF.lang==='es'?'Permite el micrófono para dictar':'Allow the microphone to speak a note'; };
    recOn=true; $('micBtn').setAttribute('aria-pressed','true'); ui(); rec.start(); });
  ui();
  MF.onChange(function(){ stopSpeak(); ui(); if(!$('notesBox').hidden) showNotes(); });
''' % json.dumps(SPEAK,ensure_ascii=False,separators=(',',':'))
anchor="  // Ken, 7 Oct: \"Select language\""
rep(anchor, js+anchor)
# a new word: stop reading, refresh the note
old="    if(window.MFcmp) MFcmp();\n"
rep(old, old+"    if(window.MFword) MFword();\n")
s=s.replace("  MF.onChange(function(){ stopSpeak(); ui();","  window.MFword=function(){ stopSpeak(); if(!$('notesBox').hidden) showNotes(); };\n  MF.onChange(function(){ stopSpeak(); ui();")
open(p,'w',encoding='utf-8').write(s)
