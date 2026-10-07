import sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,a[:80]; s=s.replace(a,b)
lines=s.split('\n')
# replace the old two-language JS block
start=s.index("  // side-by-side languages: the page's language first")
end=s.index("  MF.applyPage();",start)
gift='''  var langPicked=false; $('giftLang').addEventListener('change',function(){langPicked=true;});
  function giftLangDefault(){ if(langPicked) return; var v=MF.lang==='es'?'Español':'English'; $('giftLang').querySelector('input[value="'+v+'"]').checked=true; }
  giftLangDefault(); MF.onChange(giftLangDefault);
'''
js='''  // Ken, 7 Oct: "Select language" -- the page stays English (Spanish second); a viewer may pick
  // another language to see the same word's fish beside it. Nothing is compared until they pick one.
  var CMPL=[['en','English'],['es','Español'],['tl','Tagalog'],['zh','中文'],['hi','हिन्दी'],['el','Ελληνικά'],['he','עברית',1]];
  // each language's lettering is a small trimmed font kept on this site, so the fish draw exactly as made
  var CMPFONT={zh:'ZCOOL KuaiLe',hi:'Baloo 2',el:'Ubuntu'}, LFISH={}, cmpLang=null;
  function cmpName(l){for(var i=0;i<CMPL.length;i++) if(CMPL[i][0]===l) return CMPL[i][1]; return l;}
  function fishFor(l,k){ return l==='en'?(FISH[k]||''):l==='es'?(MF.fish[k]||''):((LFISH[l]||{})[k]||''); }
  function loadLang(l){ if(l==='en'||l==='es'||LFISH[l]) return Promise.resolve();
    if(CMPFONT[l] && !document.getElementById('mf-font-'+l)){var k=document.createElement('style'); k.id='mf-font-'+l; k.textContent="@font-face{font-family:'"+CMPFONT[l]+"';src:url(/fish-lang/"+l+".woff2) format('woff2');font-weight:100 900;font-display:block}"; document.head.appendChild(k);}
    return fetch('/fish-lang/'+l+'.json').then(function(r){return r.json();}).then(function(j){LFISH[l]=j;}); }
  window.MFcmp=function(){ if(!cmpLang) return; var k=cur;
    $('cmpA').innerHTML=fishFor(MF.lang,k); $('cmpAL').textContent=cmpName(MF.lang);
    $('cmpB').innerHTML=fishFor(cmpLang,k)||'<p class="cmpwait">…</p>'; $('cmpBL').textContent=cmpName(cmpLang); };
  function setCmp(l){ if(l===MF.lang) l=null; cmpLang=l; var on=!!l;
    $('cmp').hidden=!on; $('stage').hidden=on; $('cmpBtn').setAttribute('aria-pressed',String(on)); buildMenu();
    if(on){ closeReader(); MFcmp(); loadLang(l).then(function(){ if(cmpLang===l) MFcmp(); }).catch(function(){ $('cmpB').innerHTML='<p class="cmpwait">Could not load '+cmpName(l)+'.</p>'; }); }
    else sizeStage(); }
  function buildMenu(){ var es=MF.lang==='es', h='<div class="cmphd">'+(es?'Elegir idioma':'Select language')+'</div>';
    CMPL.forEach(function(o){ if(o[0]===MF.lang) return;
      h+='<button type="button" role="menuitemradio" aria-checked="'+(cmpLang===o[0])+'" data-l="'+o[0]+'"'+(o[2]?' disabled':'')+'>'+o[1]+(o[2]?' <small>'+(es?'pronto':'soon')+'</small>':'')+'</button>'; });
    if(cmpLang) h+='<button type="button" class="cmpoff" data-l="">'+(es?'Solo un pez':'Just one fish')+'</button>';
    $('cmpMenu').innerHTML=h; }
  function menu(open){ $('cmpMenu').hidden=!open; $('cmpBtn').setAttribute('aria-expanded',String(open)); if(open) buildMenu(); }
  $('cmpBtn').addEventListener('click',function(e){ e.stopPropagation(); menu($('cmpMenu').hidden); });
  $('cmpMenu').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b||b.disabled) return; e.stopPropagation(); menu(false); setCmp(b.dataset.l||null); });
  document.addEventListener('click',function(e){ if(!$('cmpMenu').hidden && !e.target.closest('#cmpMenu')) menu(false); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') menu(false); });
'''+gift+'''  function cmpCaps(){ var es=MF.lang==='es'; $('cmpCap').innerHTML=es?'Elegir<br>idioma':'Select<br>language'; $('cmpBtn').setAttribute('data-cap',es?'Idioma':'Language'); }
  cmpCaps();
  MF.onChange(function(){ cmpCaps(); if(cmpLang===MF.lang) setCmp(null); else { buildMenu(); MFcmp(); } });
'''
s=s[:start]+js+s[end:]
# menu element right after the button
rep('aria-pressed="false" aria-label="Show both languages side by side">','aria-pressed="false" aria-haspopup="true" aria-expanded="false" aria-label="Select a language to compare">')
i=s.index('id="cmpBtn"'); j=s.index('</button>',i)+len('</button>')
s=s[:j]+'<div class="cmpmenu" id="cmpMenu" role="menu" hidden></div>'+s[j:]
rep('<span class="cmpcap" id="cmpCap">Side-by-side<br>languages</span>','<span class="cmpcap" id="cmpCap">Select<br>language</span>')
css='''.cmpmenu{position:absolute;right:16px;top:calc(100% + 6px);z-index:60;min-width:190px;background:var(--panel,#0b1620);border:1px solid var(--line,#333);border-radius:10px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.45);display:flex;flex-direction:column}
.cmpmenu[hidden]{display:none}
.cmpmenu .cmphd{font:600 .7rem 'Archivo',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--foam-dim,#aaa);padding:6px 10px 4px}
.cmpmenu button{font:500 .95rem 'Archivo',sans-serif;text-align:left;background:none;border:0;color:inherit;padding:9px 10px;border-radius:7px;cursor:pointer}
.cmpmenu button:hover:not([disabled]){background:rgba(42,95,176,.22)}
.cmpmenu button[aria-checked="true"]{background:rgba(42,95,176,.32)}
.cmpmenu button[disabled]{opacity:.45;cursor:default}
.cmpmenu small{font-size:.7rem;color:var(--foam-dim,#aaa);margin-left:4px}
.cmpmenu .cmpoff{border-top:1px solid var(--line,#333);border-radius:0 0 7px 7px;margin-top:4px;color:var(--foam-dim,#aaa)}
.cmpwait{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;margin:0;color:var(--foam-dim,#aaa);font:600 .9rem 'Archivo',sans-serif}
.cmp figure{cursor:default}
:root[data-mode="light"] .cmpmenu{background:#fff}
'''
s=s.replace('</style>',css+'</style>',1)
s=s.replace("#langBtn,#modeBtn,#cmpBtn,#cmpCap,.cmp'","#langBtn,#modeBtn,#cmpBtn,#cmpCap,#cmpMenu,.cmp'")
open(p,'w',encoding='utf-8').write(s)
