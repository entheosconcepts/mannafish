import sys,json
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
def rep(a,b):
    global s; assert s.count(a)==1,(s.count(a),a[:90]); s=s.replace(a,b)
FL=json.load(open('/home/user/mannafish/netlify/functions/lib/fishlines.json',encoding='utf-8'))
ENTOP={k:len(v['top']) for k,v in FL['en'].items()}
# ── 1. one language button, top left ──
rep('<button class="langbtn" type="button" id="langBtn"','<button class="langbtn" type="button" id="langBtn" hidden')
rep('<span class="cmpcap" id="cmpCap">','<span class="cmpcap" id="cmpCap" hidden>')
i=s.index('aria-label="Select a language to compare">'); j=s.index('</svg>',i)+len('</svg>')
s=s[:j]+'<span id="cmpLab">English</span><span class="caret" aria-hidden="true">&#9662;</span>'+s[j:]
s=s.replace('aria-label="Select a language to compare">','aria-label="Language">',1)
css='''
/* Ken, 8 Oct: one language button, top left -- read the site in English or Español, and compare the fish in any language */
.langbtn[hidden],.cmpcap[hidden]{display:none!important}
.nav .cmpbtn{left:16px;right:auto;width:auto;height:38px;border-radius:999px;padding:0 12px;gap:7px;font:600 .82rem 'Archivo',sans-serif}
.nav .cmpbtn .caret{font-size:.7rem;opacity:.7}
.nav .cmpbtn::after{content:none!important}
.cmpmenu{left:16px;right:auto;min-width:220px}
.cmpmenu .cmphd+.cmphd{margin-top:0}
.cmpmenu button.pg::before{content:'';display:inline-block;width:14px;height:14px;border:1.5px solid currentColor;border-radius:50%;margin-right:10px;vertical-align:-2px;opacity:.7}
.cmpmenu button.pg[aria-checked="true"]::before{background:#2a5fb0;border-color:#2a5fb0;opacity:1;box-shadow:inset 0 0 0 3px var(--panel,#0b1620)}
.cmpmenu .sep{border-top:1px solid var(--line,#333);margin:6px 4px}
@media(max-width:480px){.nav .cmpbtn{left:12px;height:34px;padding:0 10px;font-size:.76rem}.nav .cmpbtn svg{width:18px;height:9px}}
'''
s=s.replace('</style>',css+'</style>',1)
old_menu_start=s.index("  function buildMenu(){ var es=MF.lang==='es', h='<div class=\"cmphd\">'+(es?'Elegir idiomas':'Select languages')+'</div>';")
old_menu_end=s.index("    $('cmpMenu').innerHTML=h; }",old_menu_start)+len("    $('cmpMenu').innerHTML=h; }")
s=s[:old_menu_start]+r'''  function buildMenu(){ var es=MF.lang==='es', h='<div class="cmphd">'+(es?'Leer el sitio en':'Read the site in')+'</div>';
    [['en','English'],['es','Español']].forEach(function(o){ h+='<button type="button" role="menuitemradio" class="pg" aria-checked="'+(MF.lang===o[0])+'" data-pg="'+o[0]+'">'+o[1]+'</button>'; });
    h+='<div class="sep"></div><div class="cmphd">'+(es?'Comparar el pez en':'Compare the fish in')+'</div>';
    CMPL.forEach(function(o){ if(o[0]===MF.lang) return;
      h+='<button type="button" role="menuitemcheckbox" aria-checked="'+(cmpSel.indexOf(o[0])>=0)+'" data-l="'+o[0]+'"'+(o[2]?' disabled':'')+'>'+o[1]+(o[2]?' <small>'+(es?'pronto':'soon')+'</small>':'')+'</button>'; });
    if(cmpSel.length) h+='<button type="button" class="cmpoff" data-l="">'+(es?'Solo un pez':'Just one fish')+'</button>';
    $('cmpMenu').innerHTML=h; cmpCaps(); }'''+s[old_menu_end:]
rep("    var l=b.dataset.l; if(!l){ menu(false); setCmp([]); return; }",
    "    if(b.dataset.pg){ menu(false); if(b.dataset.pg!==MF.lang) MF.set(b.dataset.pg); return; }\n    var l=b.dataset.l; if(!l){ menu(false); setCmp([]); return; }")
rep("  function cmpCaps(){ var es=MF.lang==='es'; $('cmpCap').innerHTML=es?'Elegir<br>idioma':'Select<br>language'; $('cmpBtn').setAttribute('data-cap',es?'Idioma':'Language'); }",
    "  function cmpCaps(){ var es=MF.lang==='es'; $('cmpLab').textContent=(es?'Español':'English')+(cmpSel.length?' +'+cmpSel.length:''); $('cmpBtn').setAttribute('aria-label',es?'Idioma':'Language'); }")
# ── 2. the caption stays after reading ──
rep("    var box=sp.box, id=sp.id; if(box) setTimeout(function(){ if(sp.id===id && !sp.on){ box.hidden=true; } },1800);\n",
    "    if(sp.fh){ sp.fh.reset(); sp.fh=null; }\n")
# ── 3. light up the words on the fish itself ──
js=r'''  // the fish's own lettering lights up with the reading: word by word where the fish is drawn as text
  // (Spanish and the other languages), line by line on the English fish (drawn as outlines)
  var ENTOP=__ENTOP__;
  function fishHi(svg,part,l){ var none={mark:function(){},reset:function(){}}; if(!svg) return none; var NS='http://www.w3.org/2000/svg';
    if(svg.querySelector('textPath')){
      if(part==='word'){ var w=[].filter.call(svg.querySelectorAll('text'),function(t){ return !t.querySelector('textPath') && (t.getAttribute('fill')||'').toLowerCase()==='#fff'; })[0];
        return w?{mark:function(){ w.setAttribute('fill','#f5d76e'); },reset:function(){ w.setAttribute('fill','#fff'); }}:none; }
      var ws=[], off=0;
      ['#g_top','#g_bot'].forEach(function(h){ var tp=svg.querySelector('textPath[href="'+h+'"]'); if(!tp) return;
        if(!tp.getAttribute('data-wrapped')){ var txt=tp.textContent, parts=l==='zh'?txt.split(''):txt.split(/(\s+)/); tp.textContent='';
          parts.forEach(function(t){ if(t==='') return; var e=document.createElementNS(NS,'tspan'); e.textContent=t; tp.appendChild(e); }); tp.setAttribute('data-wrapped','1'); }
        var i=0; [].forEach.call(tp.childNodes,function(e){ var n=e.textContent.length; if(e.nodeType===1 && e.textContent.trim()) ws.push({e:e,s:off+i,x:off+i+n}); i+=n; });
        off+=tp.textContent.length+(l==='zh'?0:1); });
      return {mark:function(ci){ ws.forEach(function(w){ if(ci>=w.s&&ci<w.x) w.e.setAttribute('fill','#2a5fb0'); else w.e.removeAttribute('fill'); }); },
              reset:function(){ ws.forEach(function(w){ w.e.removeAttribute('fill'); }); }}; }
    var els=[].slice.call(svg.querySelectorAll('path,line')); if(els.length<18) return none;
    var paint=function(list,c){ list.forEach(function(e){ if(e.getAttribute('data-f0')===null) e.setAttribute('data-f0',e.style.fill||''); e.style.fill=c||e.getAttribute('data-f0'); }); };
    if(part==='word'){ var wl=els.slice(3,11); return {mark:function(){ paint(wl,'#f5d76e'); },reset:function(){ paint(wl,''); }}; }
    var topL=[els[14],els[15]], botL=[els[16],els[17]], cut=ENTOP[cur]||0;
    return {mark:function(ci){ if(ci<cut){ paint(topL,'#2a5fb0'); paint(botL,''); } else { paint(topL,''); paint(botL,'#2a5fb0'); } },
            reset:function(){ paint(topL,''); paint(botL,''); }}; }
'''.replace('__ENTOP__',json.dumps(ENTOP,separators=(',',':')))
rep("  function speakFish(l,part,btn,box){\n", js+"  function speakFish(l,part,btn,box){\n")
rep("    var verse=part==='verse', shown=verse?d[1]:d[0],",
    "    var fig=btn.closest('figure[data-l]'), fh=fishHi(fig?fig.querySelector('.cmpf svg'):$('fishbox').querySelector('svg'),part,l); sp.fh=fh;\n    var verse=part==='verse', shown=verse?d[1]:d[0],")
rep("spans=renderSay(box,shown,l,verse?d[2]:'');","spans=renderSay(box,shown,l,verse?d[2]:''), mk=function(ci){ mark(spans,ci); fh.mark(ci); };")
rep("      a.ontimeupdate=function(){ if(a.duration) mark(spans, a.currentTime/a.duration*spoken.length); };","      a.ontimeupdate=function(){ if(a.duration) mk(a.currentTime/a.duration*spoken.length); };")
rep("deviceSay(l,spoken,spans,id,box); });","deviceSay(l,spoken,mk,id,box); });")
rep("  function deviceSay(l,text,spans,id,box){","  function deviceSay(l,text,mk,id,box){")
rep("    u.onboundary=function(e){ got=true; mark(spans,e.charIndex); };","    u.onboundary=function(e){ got=true; mk(e.charIndex); };")
rep("    sp.timer=setInterval(function(){ if(!got) mark(spans,(Date.now()-t0)/1000*cps); },150);","    sp.timer=setInterval(function(){ if(!got) mk((Date.now()-t0)/1000*cps); },150);")
open(p,'w',encoding='utf-8').write(s)
