// The voice menu (Ken, 26 Oct: "On the listen button I would like a drop down option with several voices to choose from and give
// the user the option to select whichever one as default wherever the play button is available").
// A small ▾ beside a play button opens the voices; ▶ beside each one plays a sample; picking one makes it the voice everywhere.
//   MFvoice.attach(button, {mode:'natural'|'device', lang:function(){ return 'es'; }, wrap:true (button and ▾ kept together)})
//     natural: MannaFish's natural voices (Today, Time with God, the game; mf-voice, kept with the account)
//     device:  this phone's own voices for that language (the Bible and Plans read whole chapters with them; mf-dvoice-<lang>)
//   MFvoice.get()  MFvoice.device(lang) -> the chosen SpeechSynthesisVoice or null
//   window event 'mfvoice' {detail:{v}} when the natural voice changes, so a page can update its own voice lists
(function(){
  if(window.MFvoice) return;
  var NAT=[['thunder','Thunder','very deep, grand','muy grave, solemne'],['narrator','Narrator','classic Bible reader','lector bíblico clásico'],['highland','Highlander','Scottish gentleman','caballero escocés'],['onyx','Onyx','deep','grave'],['ash','Ash','gentle','amable'],['fable','Fable','storyteller','narrador'],['grace','Grace','deep, mature','grave, madura'],['magnolia','Magnolia','Southern, sweet','sureña, dulce'],['heather','Heather','Scottish lady','dama escocesa'],['sage','Sage','calm','tranquila'],['coral','Coral','warm','cálida'],['ballad','Ballad','expressive','expresiva']];
  var TX={en:['Choose a voice','Your pick is used everywhere you press play.','My phone’s voice','Hear it','is your voice now','This phone’s voices. Your pick is used for the Bible and Plans.','No voices on this phone for this language.','Close'],
    es:['Elige una voz','Tu elección se usa en todo lugar donde tocas reproducir.','La voz de mi teléfono','Escuchar','es tu voz ahora','Las voces de este teléfono. Tu elección se usa en la Biblia y los Planes.','Este teléfono no tiene voces para este idioma.','Cerrar'],
    tl:['Pumili ng boses','Gagamitin ang pinili mo saan ka man pumindot ng play.','Boses ng aking telepono','Pakinggan','ang boses mo ngayon','Mga boses ng teleponong ito. Para sa Bibliya at Mga Plano.','Walang boses sa teleponong ito para sa wikang ito.','Isara'],
    zh:['选择声音','你的选择会用在所有播放按钮上。','我手机的声音','试听','现在是你的声音','这部手机的声音。用于圣经和计划。','这部手机没有这种语言的声音。','关闭'],
    hi:['आवाज़ चुनें','आपकी चुनी आवाज़ हर जगह चलेगी जहाँ आप प्ले दबाते हैं।','मेरे फ़ोन की आवाज़','सुनें','अब आपकी आवाज़ है','इस फ़ोन की आवाज़ें। बाइबल और योजनाओं के लिए।','इस फ़ोन पर इस भाषा की कोई आवाज़ नहीं है।','बंद करें'],
    el:['Διαλέξτε φωνή','Η επιλογή σας ισχύει παντού όπου πατάτε αναπαραγωγή.','Η φωνή του κινητού μου','Ακούστε','είναι τώρα η φωνή σας','Οι φωνές αυτού του κινητού. Για τη Βίβλο και τα Πλάνα.','Δεν υπάρχουν φωνές για αυτή τη γλώσσα.','Κλείσιμο'],
    de:['Stimme wählen','Deine Wahl gilt überall, wo du auf Abspielen tippst.','Die Stimme meines Telefons','Anhören','ist jetzt deine Stimme','Die Stimmen dieses Telefons. Für die Bibel und die Pläne.','Keine Stimmen für diese Sprache auf diesem Telefon.','Schließen'],
    ko:['목소리 선택','고른 목소리는 재생 버튼이 있는 모든 곳에서 쓰입니다.','내 휴대폰 목소리','듣기','이(가) 이제 내 목소리입니다','이 휴대폰의 목소리. 성경과 계획에 쓰입니다.','이 휴대폰에는 이 언어의 목소리가 없습니다.','닫기'],
    he:['בחרו קול','הבחירה שלכם תשמש בכל מקום שבו לוחצים על הפעלה.','הקול של הטלפון שלי','האזינו','הוא עכשיו הקול שלכם','הקולות של הטלפון הזה. לתנ״ך ולתוכניות.','אין בטלפון הזה קולות לשפה הזו.','סגירה'],
    ar:['اختر صوتًا','يُستخدم اختيارك في كل مكان تضغط فيه تشغيل.','صوت هاتفي','استمع','هو صوتك الآن','أصوات هذا الهاتف. للكتاب المقدس والخطط.','لا توجد أصوات لهذه اللغة على هذا الهاتف.','إغلاق'],ru:["Выберите голос","Ваш выбор будет звучать везде, где вы нажимаете «Слушать».","Голос моего телефона","Послушать","теперь ваш голос","Голоса этого телефона. Ваш выбор используется для Библии и Планов.","На этом телефоне нет голосов для этого языка.","Закрыть"]};
  var LP={en:'en',es:'es',tl:'(fil|tl)',zh:'(zh|cmn)',hi:'hi',el:'el',de:'de',ko:'ko',he:'(he|iw)',ar:'ar',ru:"ru"};
  var SAMPLE={en:'The Lord is my shepherd; I shall not want.',es:'El Señor es mi pastor; nada me faltará.',tl:'Ang Panginoon ay aking pastor; hindi ako mangangailangan.',zh:'耶和华是我的牧者，我必不致缺乏。',
    hi:'यहोवा मेरा चरवाहा है, मुझे कुछ घटी न होगी।',el:'Ο Κύριος με ποιμαίνει· δεν θα μου λείψει τίποτα.',de:'Der Herr ist mein Hirte; mir wird nichts mangeln.',ko:'여호와는 나의 목자시니 내게 부족함이 없으리로다',
    he:'יהוה רעי לא אחסר.',ar:'الرب راعيّ فلا يعوزني شيء.',ru:"Господь — Пастырь мой; я ни в чем не буду нуждаться."};
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
  function uiLang(){ var l=(window.MF&&window.MF.lang)||ls('mf-lang')||(document.documentElement.lang||'en').slice(0,2); return TX[l]?l:'en'; }
  function T(i){ return (TX[uiLang()]||TX.en)[i]; }
  function get(){ var v=ls('mf-voice')||''; return v==='device'||NAT.some(function(o){ return o[0]===v; })?v:'sage'; }
  function setNat(v){ ls('mf-voice',v); if(window.MFacct&&MFacct.touch) MFacct.touch('set');
    try{ window.dispatchEvent(new CustomEvent('mfvoice',{detail:{v:v}})); }catch(e){} }
  function devVoices(lang){ if(!window.speechSynthesis) return []; var re=new RegExp('^'+(LP[lang]||lang),'i');
    return (speechSynthesis.getVoices()||[]).filter(function(v){ return re.test(v.lang); }); }
  function device(lang){ var name=ls('mf-dvoice-'+lang); if(!name) return null; return devVoices(lang).filter(function(v){ return v.voiceURI===name||v.name===name; })[0]||null; }
  if(window.speechSynthesis&&speechSynthesis.getVoices) speechSynthesis.getVoices();

  // ── hearing a sample ──
  var au=null;
  function hush(){ if(au){ try{ au.pause(); }catch(e){} au=null; } if(window.speechSynthesis) try{ speechSynthesis.cancel(); }catch(e){} }
  function sayDevice(text,lang,voice){ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(text); if(voice){ u.voice=voice; u.lang=voice.lang; } else u.lang=lang; speechSynthesis.speak(u); }
  function sample(mode,id,lang){ hush();
    if(mode==='device'){ sayDevice(SAMPLE[lang]||SAMPLE.en,lang,devVoices(lang).filter(function(v){ return v.voiceURI===id; })[0]); return; }
    if(id==='device'){ sayDevice(SAMPLE[lang]||SAMPLE.en,lang,null); return; }
    // the HOPE fish's verse, in the page's language, in that voice (made once, then kept)
    fetch('/api/tts?lang='+lang+'&w=HOPE&part=verse&v='+id).then(function(r){ if(!r.ok) throw 0; return r.blob(); })
      .then(function(b){ au=new Audio(URL.createObjectURL(b)); return au.play(); })
      .catch(function(){ sayDevice(SAMPLE[lang]||SAMPLE.en,lang,null); }); }

  // ── the menu ──
  var css=false, open=null;
  function style(){ if(css) return; css=true; var s=document.createElement('style');
    s.textContent='.vpc{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;margin-left:4px;padding:0 8px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:inherit;font:700 .95rem/1 system-ui,sans-serif;cursor:pointer;vertical-align:middle}'
      +'.vpwrap{display:inline-flex;align-items:center}.vpc:focus-visible,.vpw button:focus-visible{outline:3px solid #6c9cf0;outline-offset:2px}'
      +'.vpw{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.45);font-family:system-ui,-apple-system,"Segoe UI",sans-serif}'
      +'.vpw .vpin{width:min(440px,100%);max-height:min(80dvh,620px);overflow:auto;background:#121a24;color:#eef3f8;border:1px solid #2b3a4d;border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.4)}'
      +'@media(min-width:640px){.vpw{align-items:center}.vpw .vpin{border-radius:20px}}'
      +'.vpw .vph{display:flex;align-items:center;justify-content:space-between;gap:10px}.vpw h2{margin:0;font-size:1.2rem}.vpw .vpx{border:0;background:none;color:inherit;font-size:1.4rem;cursor:pointer;padding:4px 8px}'
      +'.vpw .vpn{margin:6px 0 12px;color:#9fb0c2;font-size:.92rem;line-height:1.4}'
      +'.vpw .vpr{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;border:1px solid transparent}.vpw .vpr+.vpr{margin-top:4px}'
      +'.vpw .vpr[aria-checked=true]{border-color:#3370ff;background:rgba(51,112,255,.12)}'
      +'.vpw .vpk{flex:1;display:flex;align-items:center;gap:10px;border:0;background:none;color:inherit;text-align:left;font:inherit;cursor:pointer;padding:0;min-height:36px}'
      +'.vpw .vpo{width:20px;height:20px;border-radius:50%;border:2px solid #6b7c8f;flex:none;display:grid;place-items:center}.vpw .vpr[aria-checked=true] .vpo{border-color:#3370ff}.vpw .vpr[aria-checked=true] .vpo::after{content:"";width:10px;height:10px;border-radius:50%;background:#3370ff}'
      +'.vpw .vpk b{font-weight:700}.vpw .vpk small{color:#9fb0c2;margin-left:6px}'
      +'.vpw .vpp{border:1px solid #2b3a4d;background:none;color:inherit;border-radius:999px;padding:6px 12px;font:600 .85rem system-ui,sans-serif;cursor:pointer;flex:none}'
      +'.vpw .vpt{margin-top:10px;min-height:1.2em;color:#7fd18b;font-weight:600;font-size:.9rem}'
      +':root[data-mode=light] .vpw .vpin{background:#fbfaf6;color:#1c2228;border-color:#d8d4c8}:root[data-mode=light] .vpw .vpn,:root[data-mode=light] .vpw .vpk small{color:#5b6570}:root[data-mode=light] .vpw .vpp{border-color:#d8d4c8}:root[data-mode=light] .vpw .vpt{color:#1f7a35}:root[data-mode=light] .vpc{border-color:rgba(0,0,0,.2);background:rgba(0,0,0,.04)}';
    document.head.appendChild(s); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function close(){ hush(); if(open){ var b=open.back; open.el.remove(); open=null; if(b) try{ b.focus(); }catch(e){} } }
  function menu(opts,back){ style(); close(); var mode=opts.mode||'natural', lang=(typeof opts.lang==='function'?opts.lang():opts.lang)||uiLang(), es=uiLang()==='es';
    var rows, cur;
    if(mode==='device'){ var vs=devVoices(lang); cur=(device(lang)||{}).voiceURI||''; rows=vs.map(function(v){ return [v.voiceURI,v.name.replace(/\s*\(.*\)$/,''),v.lang]; }); }
    else { cur=get(); rows=NAT.map(function(o){ return [o[0],o[1],es?o[3]:o[2]]; }).concat([['device',T(2),'']]); }
    var w=document.createElement('div'); w.className='vpw'; w.setAttribute('role','dialog'); w.setAttribute('aria-modal','true'); w.setAttribute('aria-label',T(0));
    w.innerHTML='<div class="vpin"><div class="vph"><h2>'+esc(T(0))+'</h2><button type="button" class="vpx" aria-label="'+esc(T(7))+'">✕</button></div>'
      +'<p class="vpn">'+esc(mode==='device'?T(5):T(1))+'</p>'
      +(rows.length?rows.map(function(r){ return '<div class="vpr" role="radio" aria-checked="'+(r[0]===cur)+'" data-id="'+esc(r[0])+'"><button type="button" class="vpk"><span class="vpo" aria-hidden="true"></span><span><b>'+esc(r[1])+'</b>'+(r[2]?'<small>'+esc(r[2])+'</small>':'')+'</span></button><button type="button" class="vpp" aria-label="'+esc(T(3)+': '+r[1])+'">▶ '+esc(T(3))+'</button></div>'; }).join(''):'<p class="vpn">'+esc(T(6))+'</p>')
      +'<p class="vpt" role="status"></p></div>';
    document.body.appendChild(w); open={el:w,back:back};
    w.addEventListener('click',function(e){ if(e.target===w||e.target.closest('.vpx')){ close(); return; }
      var r=e.target.closest('.vpr'); if(!r) return; var id=r.dataset.id;
      if(e.target.closest('.vpp')){ sample(mode,id,lang); return; }
      [].forEach.call(w.querySelectorAll('.vpr'),function(x){ x.setAttribute('aria-checked',String(x===r)); });
      if(mode==='device') ls('mf-dvoice-'+lang,id); else setNat(id);
      w.querySelector('.vpt').textContent=r.querySelector('b').textContent+' '+T(4)+'.';
      if(opts.onPick) try{ opts.onPick(id); }catch(er){}
      sample(mode,id,lang); });
    w.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
    var f=w.querySelector('.vpr[aria-checked=true] .vpk')||w.querySelector('.vpk')||w.querySelector('.vpx'); if(f) f.focus(); }
  // a ▾ right after the play button
  function attach(btn,opts){ if(!btn||btn._vp) return; btn._vp=1; opts=opts||{}; style();
    var c=document.createElement('button'); c.type='button'; c.className='vpc'+(opts.cls?' '+opts.cls:''); c.textContent='▾'; c.setAttribute('aria-haspopup','dialog');
    // name:true shows the voice's name on the button ("Sage ▾"), kept up to date
    function nm(){ if(!opts.name) return; var v=opts.mode==='device'?(device((typeof opts.lang==='function'?opts.lang():opts.lang)||uiLang())||{}).name:get(), o=NAT.filter(function(x){ return x[0]===v; })[0];
      c.textContent=(opts.mode==='device'?(v||T(2)):(o?o[1]:T(2)))+' ▾'; }
    function lab(){ c.setAttribute('aria-label',T(0)); c.title=T(0); nm(); } lab();
    window.addEventListener('mfvoice',nm);
    c.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); lab(); menu(opts,c); });
    if(opts.wrap){ var w=document.createElement('span'); w.className='vpwrap'; btn.parentNode.insertBefore(w,btn); w.appendChild(btn); w.appendChild(c); }   // keep the two together in a grid
    else btn.insertAdjacentElement('afterend',c); return c; }
  window.MFvoice={attach:attach,menu:function(o){ menu(o||{},document.activeElement); },get:get,set:setNat,device:device,voices:NAT};
})();
