// MannaFish spelling help (Ken, 20 Oct: "need not AI but word spell correction suggestions for typos ... I'm all thumbs and sometimes
// speech to text can get it wrong"). No AI and nothing leaves the phone: a word list (SCOWL, en.txt, common words first, with every word
// of the KJV so thee, thou and the Bible's names count as words) and the usual typo rules -- a letter missed, doubled, swapped, or a key
// next to the right one ("peay" -> pray), and two words run together ("thatbinfluence" -> that influence).
// Under each field it watches, a row of the words it does not know, each with up to three suggestions; a tap puts the word in.
// "Keep" remembers a word on this device (mf-spell-mine), for names and the like.
//   MFspell.watch('#notesText, #psB')   -- any field matching, now or later, when it is typed in
(function(){
  var SET=null, LOAD=null, MINE={};
  try{ (JSON.parse(localStorage.getItem('mf-spell-mine')||'[]')||[]).forEach(function(w){ MINE[w.toLowerCase()]=1; }); }catch(e){}
  function load(){ return LOAD||(LOAD=fetch('/fish-lang/spell/en.txt').then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(function(t){
    SET=new Map(); t.split('\n').forEach(function(w,i){ if(w&&!SET.has(w)) SET.set(w,i); var l=w.toLowerCase(); if(l!==w&&!SET.has(l+'\u0001')) SET.set(l+'\u0001',i); }); return SET; }).catch(function(){ LOAD=null; return null; })); }
  // rank of a word as written (or lower-cased); -1 when it is not a word
  function rank(w){ if(SET.has(w)) return SET.get(w); var l=w.toLowerCase(); if(SET.has(l)) return SET.get(l); if(SET.has(l+'\u0001')) return SET.get(l+'\u0001'); return -1; }
  function known(w){ if(MINE[w.toLowerCase()]) return true; if(rank(w)>=0) return true;
    var b=w.replace(/'s$|s'$|'$/i,''); if(b!==w&&rank(b)>=0) return true;   // possessives
    return false; }
  var ROWS=['qwertyuiop','asdfghjkl','zxcvbnm'], NEAR={};
  ROWS.forEach(function(r,y){ for(var x=0;x<r.length;x++){ var c=r[x], n=''; [[y,x-1],[y,x+1],[y-1,x],[y-1,x+1],[y+1,x-1],[y+1,x]].forEach(function(p){ var rr=ROWS[p[0]]; if(rr&&rr[p[1]]) n+=rr[p[1]]; }); NEAR[c]=n; } });
  var AZ='abcdefghijklmnopqrstuvwxyz';
  // every spelling one typo away, with its cost (a neighbouring key or a swap is the likeliest slip)
  function edits1(w,out,base){ var n=w.length, i, j, c;
    for(i=0;i<n;i++){ add(out,w.slice(0,i)+w.slice(i+1),base+1); }
    for(i=0;i<n-1;i++){ add(out,w.slice(0,i)+w[i+1]+w[i]+w.slice(i+2),base+0.75); }
    for(i=0;i<n;i++){ for(j=0;j<26;j++){ c=AZ[j]; if(c===w[i]) continue; add(out,w.slice(0,i)+c+w.slice(i+1),base+((NEAR[w[i]]||'').indexOf(c)>=0?0.65:1)); } }
    for(i=0;i<=n;i++){ for(j=0;j<26;j++){ c=AZ[j]; add(out,w.slice(0,i)+c+w.slice(i),base+((w[i]===c||w[i-1]===c)?0.8:1)); } } }
  function add(o,w,c){ if(!(w in o)||o[w]>c) o[w]=c; }
  function best1(w){ var o={}, b=null; edits1(w,o,0); Object.keys(o).forEach(function(x){ var r=rank(x); if(r<0) return; var s=o[x]*100000+r; if(!b||s<b.s) b={w:x,s:s,c:o[x]}; }); return b; }
  // how likely a word is: common words cost little (the list is in order, commonest first)
  function rc(w){ return 0.3*Math.log(Math.max(0,rank(w))+10)/Math.LN10; }
  function suggest(word,full){ var w=word.toLowerCase(), cand={}, e1={};
    edits1(w,e1,0); Object.keys(e1).forEach(function(x){ if(rank(x)>=0) add(cand,x,e1[x]); });
    // the common slips with endings: mercys -> mercies, beleiving -> believing is left to the rules above
    [[/ys$/,'ies'],[/ie$/,'y'],[/eing$/,'ing'],[/ful$/,'full'],[/full$/,'ful']].forEach(function(r){ if(r[0].test(w)){ var x=w.replace(r[0],r[1]); if(rank(x)>=0) add(cand,x,0.6); } });
    var low=Object.keys(cand).reduce(function(m,x){ return Math.min(m,cand[x]); },9);
    if((Object.keys(cand).length<3||low>=1)&&w.length>3&&w.length<12){   /* nothing one easy slip away: look two typos away too ("mercys" -> mercies) */ Object.keys(e1).forEach(function(x){ if(e1[x]>1) return; var e2={}; edits1(x,e2,e1[x]); Object.keys(e2).forEach(function(y){ if(e2[y]<=2&&rank(y)>=0) add(cand,y,e2[y]); }); }); }
    // two words run together ("thatinfluence"), or the space bar missed for a key just above it ("thatbinfluence"), one of them maybe a typo too ("Jeusnname")
    var ok=function(x){ return (x.length>1||x==='a'||x==='i')&&rank(x)>=0&&rank(x)<25000; };
    for(var i=1;i<w.length;i++){ var sp=[[w.slice(0,i),w.slice(i),0.9]]; if('cvbnm'.indexOf(w[i])>=0) sp.push([w.slice(0,i),w.slice(i+1),0.6]);
      sp.forEach(function(p){ var a=p[0], b=p[1]; if(!a||!b) return;
        var ka=ok(a)?{w:a,c:0}:(a.length>3?best1(a):null), kb=ok(b)?{w:b,c:0}:(b.length>3?best1(b):null);
        if(ka&&kb&&ka.c+kb.c<=1) add(cand,ka.w+' '+kb.w,p[2]+ka.c+kb.c); }); }
    var list=Object.keys(cand).map(function(x){ return {w:x,c:cand[x],s:cand[x]+x.split(' ').reduce(function(t,y){ return t+rc(y); },0)}; }).sort(function(a,b){ return a.s-b.s; }).slice(0,3);
    list.forEach(function(o){ o.w=word[0]===word[0].toUpperCase()&&word.slice(1)!==word.slice(1).toUpperCase()?o.w[0].toUpperCase()+o.w.slice(1):(word===word.toUpperCase()&&word.length>1?o.w.toUpperCase():o.w); });
    return full?list:list.map(function(o){ return o.w; }); }
  // the words in a text that are not words, with where they are
  function check(text){ var out=[], re=/[A-Za-z][A-Za-z']*/g, m, seen={};
    while((m=re.exec(text))){ var w=m[0].replace(/'+$/,''); if(w.length<2) continue; if(/^[A-Z]{2,5}$/.test(w)) continue;   // short capitals: initials
      if(known(w)) continue; var prev=text.slice(0,m.index).trim(), start=!prev||/[.!?:\n]$/.test(prev);
      var sg=suggest(w,true), sug=sg.map(function(o){ return o.w; });
      // a capitalised word in mid-sentence is likely a name: only a near slip (a neighbouring key, two letters swapped) or a long run-together word is shown
      if(w[0]===w[0].toUpperCase()&&!start&&!(sg.length&&(sg[0].c<1||w.length>7))) continue;
      if(!sug.length) continue;
      var k=w.toLowerCase(); if(seen[k]) continue; seen[k]=1; out.push({w:w,at:m.index,sug:sug}); }
    return out; }
  function css(){ if(document.getElementById('mfSpellCss')) return; var s=document.createElement('style'); s.id='mfSpellCss';
    s.textContent='.mfsp{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin:6px 0 2px;font:600 .82rem Archivo,system-ui,sans-serif;text-align:left}.mfsp[hidden]{display:none}'
      +'.mfsp .h{opacity:.6;font-weight:700}.mfsp .x{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:center;border:1px solid rgba(128,128,128,.35);border-radius:12px;padding:3px 4px 3px 9px}'
      +'.mfsp s{text-decoration:wavy underline #e8735c;text-decoration-skip-ink:none;text-underline-offset:3px;opacity:.85;margin-right:2px}.mfsp button{font:inherit;color:inherit;border:0;border-radius:9px;padding:4px 9px;cursor:pointer;background:rgba(51,112,255,.22)}'
      +'.mfsp button.k{background:none;opacity:.6;padding:4px 6px}'; document.head.appendChild(s); }
  function bar(el){ if(el._mfsp) return el._mfsp; css(); var b=document.createElement('div'); b.className='mfsp'; b.hidden=true; b.setAttribute('aria-live','polite'); el.insertAdjacentElement('afterend',b); el._mfsp=b;
    b.addEventListener('mousedown',function(e){ e.preventDefault(); });   // the field keeps the keyboard
    b.addEventListener('click',function(e){ var t=e.target.closest('button'); if(!t) return; var w=t.dataset.w;
      if(t.classList.contains('k')){ MINE[w.toLowerCase()]=1; try{ localStorage.setItem('mf-spell-mine',JSON.stringify(Object.keys(MINE))); }catch(er){} run(el); return; }
      var v=el.value, re=new RegExp("(^|[^A-Za-z'])("+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+")(?=$|[^A-Za-z])",'g'), pos=el.selectionStart;
      el.value=v.replace(re,function(m,a){ return a+t.dataset.to; }); try{ el.setSelectionRange(pos+(t.dataset.to.length-w.length),pos+(t.dataset.to.length-w.length)); }catch(er){}
      el.dispatchEvent(new Event('input',{bubbles:true})); run(el); });
    return b; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var LBL={en:['Spelling','Keep'],es:['Ortografía','Dejar']};
  function run(el){ var b=bar(el); if(!SET){ load().then(function(s){ if(s) run(el); }); return; }
    var L=LBL[(document.documentElement.lang||'en').slice(0,2)]||LBL.en, bad=check(el.value).slice(0,6);
    if(!bad.length){ b.hidden=true; b.innerHTML=''; return; }
    b.innerHTML='<span class="h">'+L[0]+'</span>'+bad.map(function(x){ return '<span class="x"><s>'+esc(x.w)+'</s>'+x.sug.map(function(s){ return '<button type="button" data-w="'+esc(x.w)+'" data-to="'+esc(s)+'">'+esc(s)+'</button>'; }).join('')
      +'<button type="button" class="k" data-w="'+esc(x.w)+'" aria-label="'+L[1]+' '+esc(x.w)+'">'+L[1]+'</button></span>'; }).join(''); b.hidden=false; }
  function watch(sel){ var T=new WeakMap();
    function hook(el){ if(el._mfspw) return; el._mfspw=1; el.setAttribute('spellcheck','true'); el.setAttribute('autocorrect','on'); if(el.tagName==='TEXTAREA') el.setAttribute('autocapitalize','sentences');
      load(); el.addEventListener('input',function(){ clearTimeout(T.get(el)); T.set(el,setTimeout(function(){ run(el); },650)); });
      el.addEventListener('blur',function(){ setTimeout(function(){ run(el); },50); }); if(el.value) run(el); }
    document.addEventListener('focusin',function(e){ var el=e.target; if(el&&el.matches&&el.matches(sel)) hook(el); });
    [].forEach.call(document.querySelectorAll(sel),function(el){ if(el.value) hook(el); }); }
  window.MFspell={watch:watch,check:function(t){ return load().then(function(){ return check(t); }); },suggest:function(w){ return load().then(function(){ return suggest(w); }); }};
})();
