// The MannaFish tabs along the bottom (Ken, 20 Oct: "add the Bible tab bar" -- like the Bible App: Home · Bible · Plans · Discover · You)
// Today · Bible · Plans · Pond · You, on every main page. Not inside the devotional's Bible window (?embed=1) or another frame.
(function(){
  if(/[?&]embed=1\b/.test(location.search)||window.top!==window.self) return;
  // "Tell us what you think" (fish-lang/feedback.js), on every page with the tabs
  if(!window.MFfeedback){ var fb=document.createElement('script'); fb.src='/fish-lang/feedback.js'; fb.defer=true; document.head.appendChild(fb); }
  var L='en'; try{ L=localStorage.getItem('mf-lang')||'en'; }catch(e){}
  // Ken, 25 Oct (one clear path for launch): Pray (Time with God) in place of the game's Pond, which stays in the ••• menu
  var T={en:['Today','Bible','Plans','Pray','You'],es:['Hoy','Biblia','Planes','Orar','Tú'],tl:['Ngayon','Biblia','Plano','Manalangin','Ikaw'],zh:['今天','圣经','计划','祷告','我'],
    hi:['आज','बाइबल','योजनाएँ','प्रार्थना','आप'],el:['Σήμερα','Βίβλος','Πλάνα','Προσευχή','Εσύ'],de:['Heute','Bibel','Pläne','Beten','Du'],ko:['오늘','성경','계획','기도','나'],
    he:['היום','תנ״ך','תוכניות','תפילה','אני'],ar:['اليوم','الكتاب','الخطط','الصلاة','أنت']}[L]||null;
  T=T||['Today','Bible','Plans','Pray','You'];
  var P=location.pathname, at=/^\/bible/.test(P)?1:/^\/plan/.test(P)?2:/^\/pray/.test(P)?3:/^\/you/.test(P)?4:/^\/(go|match)/.test(P)?-1:0;
  var I=[
    '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
    '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M12 7v5M9.5 9.5h5"/>',
    '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16M9 3v4M15 3v4"/><path d="m9 14 2 2 4-4"/>',
    '<path d="M12 3c-1.5 2-2 5-2 8v6l-3 3M12 3c1.5 2 2 5 2 8v6l3 3"/><path d="M10 11l-3 2M14 11l3 2"/>',
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'];
  // the Bible tab opens the contents (books, versions, recent), unless the person chose "where I left off" (You → Settings)
  var SET={}; try{ SET=JSON.parse(localStorage.getItem('mf-set')||'{}')||{}; }catch(e){}
  var H=['/',SET.tab==='last'?'/bible/':'/bible/?toc=1','/plan/','/pray/','/you/'];
  var css='.mftabs{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom));z-index:21;display:flex;gap:2px;padding:5px;border-radius:999px;'
    +'background:rgba(20,22,26,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12);box-shadow:0 10px 30px -10px rgba(0,0,0,.7);width:min(460px,calc(100% - 16px))}'
    +'.mftabs a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 2px 6px;border-radius:999px;color:#c9d3d6;text-decoration:none;font:700 .7rem Archivo,system-ui,sans-serif;letter-spacing:.01em}'
    +'.mftabs a svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}'
    +'.mftabs a[aria-current=page]{background:rgba(255,255,255,.12);color:#fff}'
    +':root[data-mode=light] .mftabs{background:rgba(255,255,255,.94);border-color:rgba(0,0,0,.1)}:root[data-mode=light] .mftabs a{color:#4b5560}:root[data-mode=light] .mftabs a[aria-current=page]{background:rgba(42,95,176,.12);color:#1c2a3a}'
    +'body.mftabbed{padding-bottom:calc(84px + env(safe-area-inset-bottom))!important}'
    +'@media print{.mftabs{display:none}}';
  function put(){ if(document.querySelector('.mftabs')) return; var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var n=document.createElement('nav'); n.className='mftabs'; n.setAttribute('aria-label','MannaFish');
    n.innerHTML=T.map(function(t,i){ return '<a href="'+H[i]+'"'+(i===at?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+I[i]+'</svg><span>'+t+'</span></a>'; }).join('');
    document.body.appendChild(n); document.body.classList.add('mftabbed'); }
  if(document.body) put(); else document.addEventListener('DOMContentLoaded',put);
  window.MFtabs={hide:function(on){ var n=document.querySelector('.mftabs'); if(n) n.style.display=on?'none':''; }};
})();
