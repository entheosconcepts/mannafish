import sys,re
p=sys.argv[1]; SAY=open(sys.argv[2],encoding='utf-8').read(); s=open(p,encoding='utf-8').read()
def rep(a,b,n=1):
    global s; assert s.count(a)==n,(s.count(a),a[:90]); s=s.replace(a,b)
# 1. the Listen button gives way to speakers on each fish
i=s.index('<button class="toolbtn" type="button" id="listenBtn"'); j=s.index('</button>',i)+len('</button>'); s=s[:i]+s[j:]
SPK='<div class="fishspk"><button class="spk" type="button" data-part="word"><span aria-hidden="true">&#128266;</span> <span class="spkw">Word</span></button><button class="spk" type="button" data-part="verse"><span aria-hidden="true">&#128266;</span> <span class="spkv">Verse</span></button></div>'
rep('          <div class="fishbox" id="fishbox"></div>\n','          <div class="fishbox" id="fishbox"></div>\n          '+SPK+'\n')
rep('  <div class="sharerow"><span class="rnote" id="shareMsg"></span></div>\n','  <div class="saybox" id="sayMain" hidden></div>\n  <div class="sharerow"><span class="rnote" id="shareMsg"></span></div>\n')
# 2. styles
css='''
/* Ken, 7 Oct: two speakers on every fish -- the word in the middle, or the verse -- in that fish's language;
   the words light up as they are read. Several languages can be compared at once. */
.fishspk{position:absolute;top:10px;left:10px;display:flex;gap:6px;z-index:4}
.spk{font:600 .74rem 'Archivo',sans-serif;display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.62);color:#fff;cursor:pointer;line-height:1.2}
.spk:hover{border-color:var(--brass)}
.spk[aria-pressed="true"]{background:#2a5fb0;border-color:#2a5fb0}
.cmpf .fishspk{top:6px;left:6px}.cmpf .spk{font-size:.68rem;padding:4px 8px}
.saybox{max-width:720px;margin:10px auto 0;padding:10px 16px;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid var(--line,#333);font:1.08rem/1.65 'Spectral',serif;text-align:center}
.saybox[hidden]{display:none}
.saybox .w{border-radius:3px;transition:background .12s}
.saybox .w.on{background:#f5d76e;color:#111}
.saybox .sref{display:block;font:600 .8rem 'Archivo',sans-serif;letter-spacing:.04em;color:var(--foam-dim,#aaa);margin-top:4px}
.saybox .snote{display:block;font:.82rem 'Archivo',sans-serif;color:var(--foam-dim,#aaa);margin-top:6px}
.cmp{flex-wrap:wrap}
.cmp figure{flex:1 1 calc(50% - 18px);max-width:calc(50% - 9px)}
.cmp figure:only-child{max-width:100%}
.cmp .saybox{font-size:.98rem}
.cmpmenu button[role="menuitemcheckbox"]::before{content:'';display:inline-block;width:14px;height:14px;border:1.5px solid currentColor;border-radius:3px;margin-right:10px;vertical-align:-2px;opacity:.7}
.cmpmenu button[role="menuitemcheckbox"][aria-checked="true"]::before{background:#2a5fb0;border-color:#2a5fb0;opacity:1;box-shadow:inset 0 0 0 2px var(--panel,#0b1620)}
@media(max-width:900px){.cmp figure{max-width:min(520px,100%)}}
'''
s=s.replace('</style>',css+'</style>',1)
s=s.replace("#cmpMenu,.cmp,.toolrow,#notesBox,#acctBox'","#cmpMenu,.cmp,.toolrow,#notesBox,#acctBox,.fishspk,.saybox'")
# 3. the speaking engine replaces the old Listen code
a=s.index("  // ── Listen: a natural voice"); b=s.index("  // ── My notes:")
eng=r'''  // ── Speak a fish: the word in the middle, or the verse, in that fish's language. A natural voice from
  // /api/tts once a voice key is added in Netlify; until then the device's own voice. The words light up as read.
  var SAY=__SAY__;
  var LCODE={en:'en-US',es:'es-US',tl:'fil-PH',zh:'zh-CN',hi:'hi-IN',el:'el-GR'}, LPRE={en:['en'],es:['es'],tl:['fil','tl'],zh:['zh','cmn'],hi:['hi'],el:['el']};
  var sp={on:false,id:0,btn:null,box:null,audio:null,timer:null};
  function ui(){ var es=MF.lang==='es';
    $('notesLab').textContent=es?'Mis notas':'My notes'; $('micLab').textContent=recOn?(es?'Detener':'Stop'):(es?'Dictar una nota':'Speak a note');
    $('notesWhere').textContent=es?'Guardado en este dispositivo':'Saved on this device';
    $('notesText').placeholder=es?'¿Qué te muestra Dios en esta palabra?':'What is God showing you in this word?';
    document.querySelectorAll('.spkw').forEach(function(e){e.textContent=es?'Palabra':'Word';});
    document.querySelectorAll('.spkv').forEach(function(e){e.textContent=es?'Versículo':'Verse';}); }
  function stopSpeak(){ sp.id++; clearInterval(sp.timer); if(sp.audio){ sp.audio.pause(); sp.audio=null; } if(window.speechSynthesis) speechSynthesis.cancel();
    if(sp.btn) sp.btn.setAttribute('aria-pressed','false');
    var box=sp.box, id=sp.id; if(box) setTimeout(function(){ if(sp.id===id && !sp.on){ box.hidden=true; } },1800);
    sp.on=false; sp.btn=null; }
  function voiceFor(l){ var vs=(window.speechSynthesis&&speechSynthesis.getVoices())||[];
    var m=vs.filter(function(v){ var c=(v.lang||'').toLowerCase().replace('_','-'); return LPRE[l].some(function(p){return c.indexOf(p)===0;}); });
    m.sort(function(a,b){ var q=function(v){return /natural|neural|premium|enhanced|siri|google/i.test(v.name)?0:1;}; return q(a)-q(b); });
    return {any:vs.length>0, v:m[0]||null}; }
  function renderSay(box,text,l,ref){ var h='', i=0, parts=l==='zh'?text.split(''):text.split(/(\s+)/);
    parts.forEach(function(t){ if(/^\s+$/.test(t)||t===''){ h+=t; } else { h+='<span class="w" data-s="'+i+'" data-e="'+(i+t.length)+'">'+esc(t)+'</span>'; } i+=t.length; });
    box.innerHTML=h+(ref?'<span class="sref">'+esc(ref)+'</span>':''); box.hidden=false;
    return Array.prototype.map.call(box.querySelectorAll('.w'),function(e){return {e:e,s:+e.dataset.s,x:+e.dataset.e};}); }
  function mark(spans,ci){ spans.forEach(function(w){ w.e.classList.toggle('on', ci>=w.s && ci<w.x); }); }
  function sayNote(box,t){ var n=document.createElement('span'); n.className='snote'; n.textContent=t; box.appendChild(n); }
  function speakFish(l,part,btn,box){
    if(sp.on && sp.btn===btn){ stopSpeak(); return; }
    stopSpeak(); var id=sp.id, d=(SAY[l]||{})[cur]; if(!d||!box) return;
    sp.on=true; sp.btn=btn; sp.box=box; btn.setAttribute('aria-pressed','true');
    var verse=part==='verse', shown=verse?d[1]:d[0], spoken=verse?d[1]+(l==='zh'?'。':' ')+d[2]:d[0], spans=renderSay(box,shown,l,verse?d[2]:'');
    fetch('/api/tts?w='+cur+'&lang='+l+'&part='+part).then(function(r){ if(!r.ok) throw 0; return r.blob(); }).then(function(b){
      if(id!==sp.id) return; var a=new Audio(URL.createObjectURL(b)); sp.audio=a;
      a.ontimeupdate=function(){ if(a.duration) mark(spans, a.currentTime/a.duration*spoken.length); };
      a.onended=function(){ if(id===sp.id) stopSpeak(); }; return a.play();
    }).catch(function(){ if(id!==sp.id) return; deviceSay(l,spoken,spans,id,box); });
  }
  function deviceSay(l,text,spans,id,box){
    var es=MF.lang==='es';
    if(!window.speechSynthesis){ sayNote(box,es?'Este navegador no puede leer en voz alta.':'This browser cannot read aloud.'); sp.on=false; stopSpeak(); return; }
    var vv=voiceFor(l);
    if(vv.any && !vv.v){ sayNote(box,(es?'Este dispositivo aún no tiene voz en ':'This device has no voice for ')+cmpName(l)+(es?'. Con la voz natural del sitio sí se podrá.':' yet. The site’s natural voice will cover it once it is turned on.')); sp.on=false; stopSpeak(); return; }
    var u=new SpeechSynthesisUtterance(text); u.lang=LCODE[l]||'en-US'; if(vv.v) u.voice=vv.v; u.rate=.9;
    var got=false, t0=Date.now(), cps=l==='zh'?4:l==='hi'?11:13;
    u.onboundary=function(e){ got=true; mark(spans,e.charIndex); };
    sp.timer=setInterval(function(){ if(!got) mark(spans,(Date.now()-t0)/1000*cps); },150);
    u.onend=u.onerror=function(){ if(id===sp.id) stopSpeak(); };
    speechSynthesis.speak(u); }
  // one listener for every speaker button, caught before the card's own tap-to-flip
  document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('.spk'); if(!b) return;
    e.stopPropagation(); e.preventDefault(); var fig=b.closest('figure[data-l]');
    speakFish(fig?fig.dataset.l:MF.lang, b.dataset.part, b, fig?fig.querySelector('.saybox'):$('sayMain')); },true);
'''.replace('__SAY__',SAY)
s=s[:a]+eng+s[b:]
# 4. several languages at once
a=s.index("  window.MFcmp=function(){ if(!cmpLang) return;"); b=s.index("  document.addEventListener('keydown',function(e){ if(e.key==='Escape') menu(false); });")
cmp=r'''  var cmpSel=[];
  function cmpLangs(){ return [MF.lang].concat(CMPL.map(function(o){return o[0];}).filter(function(l){return l!==MF.lang && cmpSel.indexOf(l)>=0;})); }
  window.MFcmp=function(){ if(!cmpSel.length) return; var spk=document.querySelector('#stage .fishspk').outerHTML;
    $('cmp').innerHTML=cmpLangs().map(function(l){ return '<figure data-l="'+l+'"><div class="cmpf">'+(fishFor(l,cur)||'<p class="cmpwait">…</p>')+spk+'</div><figcaption>'+cmpName(l)+'</figcaption><div class="saybox" hidden></div></figure>'; }).join(''); };
  function setCmp(list){ stopSpeak(); cmpSel=(list||[]).filter(function(l){return l && l!==MF.lang;}); cmpLang=cmpSel[0]||null; var on=cmpSel.length>0;
    $('cmp').hidden=!on; $('stage').hidden=on; $('sayMain').hidden=true; $('cmpBtn').setAttribute('aria-pressed',String(on)); buildMenu();
    if(on){ closeReader(); MFcmp(); cmpSel.forEach(function(l){ loadLang(l).then(function(){ MFcmp(); }).catch(function(){}); }); }
    else sizeStage(); if(window.MFsave) MFsave(); }
  window.MFsetCmp=setCmp; window.MFcmpSel=function(){ return cmpSel.slice(); };
  function buildMenu(){ var es=MF.lang==='es', h='<div class="cmphd">'+(es?'Elegir idiomas':'Select languages')+'</div>';
    CMPL.forEach(function(o){ if(o[0]===MF.lang) return;
      h+='<button type="button" role="menuitemcheckbox" aria-checked="'+(cmpSel.indexOf(o[0])>=0)+'" data-l="'+o[0]+'"'+(o[2]?' disabled':'')+'>'+o[1]+(o[2]?' <small>'+(es?'pronto':'soon')+'</small>':'')+'</button>'; });
    if(cmpSel.length) h+='<button type="button" class="cmpoff" data-l="">'+(es?'Solo un pez':'Just one fish')+'</button>';
    $('cmpMenu').innerHTML=h; }
  function menu(open){ $('cmpMenu').hidden=!open; $('cmpBtn').setAttribute('aria-expanded',String(open)); if(open) buildMenu(); }
  $('cmpBtn').addEventListener('click',function(e){ e.stopPropagation(); menu($('cmpMenu').hidden); });
  $('cmpMenu').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b||b.disabled) return; e.stopPropagation();
    var l=b.dataset.l; if(!l){ menu(false); setCmp([]); return; }
    var next=cmpSel.slice(), i=next.indexOf(l); if(i>=0) next.splice(i,1); else next.push(l); setCmp(next); });
  document.addEventListener('click',function(e){ if(!$('cmpMenu').hidden && !e.target.closest('#cmpMenu')) menu(false); });
'''
s=s[:a]+cmp+s[b:]
rep("  MF.onChange(function(){ cmpCaps(); if(cmpLang===MF.lang) setCmp(null); else { buildMenu(); MFcmp(); } });",
    "  MF.onChange(function(){ cmpCaps(); setCmp(cmpSel); ui(); });")
rep("$('cmpBtn').setAttribute('aria-pressed','false');\n","$('cmpBtn').setAttribute('aria-pressed','false');\n",0) if False else None
# word change: stop and hide the caption
s=s.replace("  window.MFword=function(){ stopSpeak(); if(!$('notesBox').hidden) showNotes();","  window.MFword=function(){ stopSpeak(); $('sayMain').hidden=true; if(!$('notesBox').hidden) showNotes();")
open(p,'w',encoding='utf-8').write(s)
