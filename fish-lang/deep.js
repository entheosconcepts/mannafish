// "Go deeper" on a word (Ken, 26 Oct): the Hebrew or Greek behind it, how many verses use it and where it is first used, the English
// words the KJV uses for it, and its senses with a short verse for each (shama: hear, obey, proclaim ...), from
// fish-lang/bible/deep/ (tools/bible-orig/deep.py; STEPBible.org data, CC BY 4.0), plus the fish it is on, if any.
//   MFdeep.show(element, 'H8085' | 'G26', {fish:{key,title}, onRef:function(book,ch,v){}})  -> fills the element
(function(){
  if(window.MFdeep) return;
  var BOOKS=["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  // [go deeper, used in {n} verses, Old Testament, New Testament, most in, first used, one word with more than one meaning,
  //  the KJV says it as, times, on the {f} fish, more at, loading, nothing found, Hebrew, Greek]
  var TX={en:['Go deeper','Used in {n} verses','Old Testament','New Testament','Most in','First used','One word, more than one meaning','The KJV says it as','times','This is the word on the {f} fish','More at','Loading…','No more about this word yet.','Hebrew','Greek'],
    es:['Profundizar','Aparece en {n} versículos','Antiguo Testamento','Nuevo Testamento','Más en','Primera vez','Una palabra, más de un sentido','La KJV la traduce','veces','Es la palabra del pez {f}','Más en','Cargando…','Aún no hay más sobre esta palabra.','Hebreo','Griego'],
    tl:['Palalimin','Nasa {n} talata','Lumang Tipan','Bagong Tipan','Pinakamarami sa','Unang gamit','Isang salita, higit sa isang kahulugan','Isinalin ito ng KJV bilang','beses','Ito ang salita sa isdang {f}','Higit pa sa','Naglo-load…','Wala pang dagdag tungkol sa salitang ito.','Hebreo','Griyego'],
    zh:['深入了解','出现在 {n} 节经文中','旧约','新约','最多见于','首次出现','一个词，不止一个意思','KJV 译作','次','这是 {f} 鱼上的词','更多见','加载中…','暂无更多资料。','希伯来文','希腊文'],
    hi:['और गहराई में','{n} पदों में प्रयुक्त','पुराना नियम','नया नियम','सबसे अधिक','पहली बार','एक शब्द, एक से अधिक अर्थ','KJV इसे कहती है','बार','यह {f} मछली का शब्द है','और देखें','लोड हो रहा है…','इस शब्द के बारे में अभी और नहीं है।','इब्रानी','यूनानी'],
    el:['Πιο βαθιά','Σε {n} εδάφια','Παλαιά Διαθήκη','Καινή Διαθήκη','Περισσότερο στο','Πρώτη φορά','Μία λέξη, περισσότερες σημασίες','Η KJV το αποδίδει','φορές','Είναι η λέξη του ψαριού {f}','Περισσότερα στο','Φόρτωση…','Δεν υπάρχουν ακόμη περισσότερα.','Εβραϊκά','Ελληνικά'],
    de:['Tiefer gehen','In {n} Versen','Altes Testament','Neues Testament','Am meisten in','Zuerst in','Ein Wort, mehr als eine Bedeutung','Die KJV übersetzt es mit','Mal','Das ist das Wort auf dem Fisch {f}','Mehr bei','Wird geladen…','Noch nichts weiter zu diesem Wort.','Hebräisch','Griechisch'],
    ko:['더 깊이','{n}개 구절에 쓰임','구약','신약','가장 많이','처음 쓰인 곳','한 단어, 여러 뜻','KJV 번역','번','{f} 물고기의 단어입니다','더 보기','불러오는 중…','이 단어에 대한 자료가 아직 없습니다.','히브리어','헬라어'],
    he:['להעמיק','מופיע ב־{n} פסוקים','הברית הישנה','הברית החדשה','הכי הרבה ב','הופעה ראשונה','מילה אחת, יותר ממשמעות אחת','ה־KJV מתרגם','פעמים','זו המילה על הדג {f}','עוד ב','טוען…','אין עדיין עוד על מילה זו.','עברית','יוונית'],
    ar:['تعمّق أكثر','وردت في {n} آية','العهد القديم','العهد الجديد','أكثر ما وردت في','أول ورود','كلمة واحدة، أكثر من معنى','ترجمتها KJV','مرة','هذه كلمة سمكة {f}','المزيد في','جارٍ التحميل…','لا مزيد عن هذه الكلمة بعد.','العبرية','اليونانية']};
  function ul(){ var l=(window.MF&&window.MF.lang)||(function(){ try{ return localStorage.getItem('mf-lang'); }catch(e){ return ''; } })()||'en'; return TX[l]?l:'en'; }
  function T(i){ return (TX[ul()]||TX.en)[i]; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function num(n){ try{ return Number(n).toLocaleString(); }catch(e){ return String(n); } }
  var FILES={};
  function file(k){ var f=k[0]+Math.floor(+k.slice(1)/100); if(!FILES[f]) FILES[f]=fetch('/fish-lang/bible/deep/'+f+'.json').then(function(r){ if(!r.ok) throw 0; return r.json(); }); FILES[f].catch(function(){ delete FILES[f]; }); return FILES[f]; }
  function norm(sn){ var m=/^([HG])0*(\d+)/.exec(String(sn||'').toUpperCase()); return m?m[1]+m[2]:null; }
  var css=false;
  function style(){ if(css) return; css=true; var s=document.createElement('style');
    s.textContent='.mfdeep{display:grid;gap:10px;text-align:left;font-size:.95rem;line-height:1.45;margin-top:6px;border-top:1px solid rgba(127,140,160,.3);padding-top:12px}'
      +'.mfdeep .dh{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}.mfdeep .dh b{font-size:1.5rem;font-weight:600}.mfdeep .dh i{opacity:.85}.mfdeep .dh small{opacity:.7}'
      +'.mfdeep .dd{margin:0;opacity:.9}.mfdeep .dn{margin:0;opacity:.85}.mfdeep h5{margin:4px 0 0;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;opacity:.75}'
      +'.mfdeep .ds{border-left:3px solid #3370ff;padding:2px 0 2px 10px}.mfdeep .ds b{font-size:1.02rem}.mfdeep .ds small{opacity:.75}.mfdeep .ds q{display:block;margin-top:3px;font-style:italic;quotes:"“" "”"}'
      +'.mfdeep mark{background:#f5d76e;color:#1c2228;border-radius:3px;padding:0 2px;font-style:normal}.mfdeep a{color:#6c9cf0}.mfdeep .dk{margin:0;opacity:.85}'
      +'.mfdeep .df{background:rgba(51,112,255,.12);border-radius:10px;padding:8px 10px;font-weight:600}.mfdeep .dl{display:flex;flex-wrap:wrap;gap:12px;font-size:.88rem}'
      +':root[data-mode=light] .mfdeep a{color:#2a5fb0}';
    document.head.appendChild(s); }
  // the main 24 fish and their Greek and Hebrew (the same as STRONGS in index.html), so a word study can say which fish it is on
  var FISH={REST:['373','7673'],HOPE:['1680','8615'],LOVE:['26','160'],TRUST:['3982','982'],PRAY:['4336','6419'],BELIEVE:['4100','539'],FORGIVE:['863','5545'],
    GIVE:['1325','5414'],SEEK:['2212','1875'],ASK:['154','7592'],KNOCK:['2925','1849'],FOLLOW:['190','1980'],LISTEN:['191','8085'],REMEMBER:['3421','2142'],
    CHOOSE:['1586','977'],HONOR:['5091','3513'],GROW:['837','1431'],GATHER:['4863','6908'],ACCEPT:['1209','7521'],BREATHE:['1720','5397'],ENJOY:['','8055'],
    LIVE:['2198','2421'],SING:['103','7891'],LAUGH:['1070','6711']};
  function fishOf(k){ var f=Object.keys(FISH).filter(function(x){ return 'G'+FISH[x][0]===k||'H'+FISH[x][1]===k; })[0]; return f?{key:f,title:f.charAt(0)+f.slice(1).toLowerCase()}:null; }
  function ref(r){ return BOOKS[r[0]]+' '+r[1]+':'+r[2]; }
  function link(r){ return '<a href="/bible/?r='+encodeURIComponent(ref(r))+'" data-ref="'+r.join(',')+'">'+esc(ref(r))+'</a>'; }
  function show(el,sn,opt){ opt=opt||{}; style(); var k=norm(sn); el.innerHTML='<div class="mfdeep"><p class="dn">'+esc(T(11))+'</p></div>'; if(!k){ el.firstChild.innerHTML='<p class="dn">'+esc(T(12))+'</p>'; return Promise.resolve(null); }
    return file(k).then(function(d){ var e=d[k]; if(!e) throw 0; var he=k[0]==='H', h='';
      h+='<div class="dh"><b lang="'+(he?'he':'el')+'" dir="'+(he?'rtl':'ltr')+'">'+esc(e.l)+'</b><i>'+esc(e.t)+'</i><small>'+esc(T(he?13:14))+' · Strong’s '+esc(k)+'</small></div>';
      if(e.d) h+='<p class="dd">'+esc(e.d.replace(/^[a-z]{1,4};\s*/,''))+'</p>';
      var where=e.ot&&e.nt?T(2)+' '+num(e.ot)+' · '+T(3)+' '+num(e.nt):(e.ot?T(2):T(3));
      h+='<p class="dn">'+esc(T(1).replace('{n}',num(e.v)))+' ('+esc(where)+'). '+esc(T(4))+' '+e.b.map(function(x){ return esc(BOOKS[x[0]])+' ('+num(x[1])+')'; }).join(', ')+'. '+esc(T(5))+': '+link(e.f)+'.</p>';
      var fish=opt.fish===undefined?fishOf(k):opt.fish;
      if(fish) h+='<p class="df">🐟 '+esc(T(9).replace('{f}',fish.title))+'</p>';
      if(e.s&&e.s.length){ h+='<h5>'+esc(e.one?T(7):T(6))+'</h5>';
        e.s.forEach(function(s){ var ex=s[3], q=ex?esc(ex[3]).replace(/«([^»]*)»/g,'<mark>$1</mark>'):'';
          h+='<div class="ds"><b>'+esc(s[0])+'</b> <small>· '+num(s[1])+' '+esc(T(8))+(e.one?'':' · '+esc(s[2].join(', ')))+'</small>'+(ex?'<q>'+q+'</q>'+link(ex):'')+'</div>'; }); }
      if(!e.one&&e.k&&e.k.length) h+='<p class="dk"><b>'+esc(T(7))+':</b> '+e.k.map(function(x){ return esc(x[0])+' ('+num(x[1])+')'; }).join(', ')+'</p>';
      var n=k.slice(1), blb=(he?'h':'g')+n;
      h+='<div class="dl">'+esc(T(10))+' <a href="https://www.blueletterbible.org/lexicon/'+blb+'/kjv/" target="_blank" rel="noopener">Blue Letter Bible ›</a><a href="https://www.stepbible.org/?q=strong='+k+'" target="_blank" rel="noopener">STEP Bible ›</a></div>';
      el.firstChild.innerHTML=h;
      if(opt.onRef) el.firstChild.addEventListener('click',function(ev){ var a=ev.target.closest('a[data-ref]'); if(!a) return; var r=a.dataset.ref.split(',').map(Number); if(opt.onRef(r[0],r[1],r[2])!==false) return; ev.preventDefault(); });
      return e; })
      .catch(function(){ el.firstChild.innerHTML='<p class="dn">'+esc(T(12))+'</p>'; return null; }); }
  window.MFdeep={show:show,label:function(){ return T(0); },norm:norm,books:BOOKS};
})();
