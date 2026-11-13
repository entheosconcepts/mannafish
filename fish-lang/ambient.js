/* MannaFish ambient music: soft pads, bells and rain made in the browser (no music files, nothing to license).
   Ken, 13 Nov: his daughter's idea, under the devotional narrator, "it can't overpower the narrator"; then "a little rounder, change notes sooner,
   10 or 12 different sounds to choose from, and a way to turn it off or on".
   It starts by itself whenever a long recording (over 8 seconds: the devotional, a chapter) plays, stays far under the voice, and fades out when the
   voice stops. Short clips (one word, one verse) never start it. The 🎵 button opens the list: Off, or one of 12 sounds (tap one to hear a few seconds).
   Kept in localStorage mf-ambient ('0' = off, otherwise the sound's key). window.MFambient = { on(), style(), set(bool), pick(key), list, start(), stop(), build(), bind(btn) } */
(function(){
  var KEY='mf-ambient', VKEY='mf-ambient-vol', DEF='dawn', LEVEL=0.05, ctx=null, master=null, run=null, stopT=null, prevT=null, btns=[], menu=null;
  /* each sound: ch = chords (MIDI notes, low and round: nothing above the middle of the piano), len = seconds before the chord changes, w = wave,
     cut = low-pass (lower is rounder), h = second harmonic amount (organ-like), arp = notes of a soft bell/harp line (every arp.t seconds), noise = soft rain/ocean */
  var S=[
    {k:'dawn',n:'Calm Dawn',d:'Warm and even',ch:[[48,55,59,62,64],[45,52,57,60,64],[41,48,55,57,60],[43,50,55,59,62]],len:5,w:'sine',cut:700},
    {k:'water',n:'Still Water',d:'Slow, deep and smooth',ch:[[43,50,55,59],[40,47,52,56],[41,48,53,57],[38,45,50,54]],len:6,w:'sine',cut:520},
    {k:'hearth',n:'Warm Hearth',d:'Cozy, like a fireside',ch:[[41,48,52,57,60],[38,45,50,53,57],[34,41,46,50,53],[36,43,48,52,55]],len:5,w:'triangle',cut:560},
    {k:'light',n:'Morning Light',d:'Bright but soft',ch:[[50,57,62,66,69],[47,54,59,62,66],[43,50,55,59,62],[45,52,57,61,64]],len:4.5,w:'sine',cut:900},
    {k:'chapel',n:'Quiet Chapel',d:'Gentle organ',ch:[[43,50,55,59],[48,55,60,64],[45,52,57,60],[41,48,53,57]],len:6,w:'sine',cut:800,h:0.5},
    {k:'rain',n:'Soft Rain',d:'Rain with a low pad',ch:[[41,48,53,57],[43,50,55,59]],len:8,w:'sine',cut:450,noise:{lvl:0.2,cut:3500}},
    {k:'evening',n:'Evening Peace',d:'Quiet and thoughtful',ch:[[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62],[40,47,52,55,59]],len:5,w:'sine',cut:600},
    {k:'sky',n:'Open Sky',d:'Wide and hopeful',ch:[[48,55,59,66],[50,57,62,66],[43,50,55,62],[45,52,57,64]],len:4.5,w:'sine',cut:850},
    {k:'ocean',n:'Deep Ocean',d:'Slow waves and low tones',ch:[[36,43,48,52],[34,41,46,50],[31,38,43,47]],len:9,w:'sine',cut:380,noise:{lvl:0.2,cut:900,sw:0.09}},
    {k:'harp',n:'Harp Garden',d:'Soft plucked notes',ch:[[43,50,55,59],[45,52,57,60],[41,48,53,57],[43,50,55,62]],len:6,w:'sine',cut:600,arp:{n:[67,69,71,74,76,79],t:1.7,dec:3.2}},
    {k:'bells',n:'Bells at Rest',d:'Sparse, gentle chimes',ch:[[41,48,53,57],[43,50,55,59]],len:8,w:'sine',cut:480,arp:{n:[72,74,76,79,81],t:3.4,dec:5,bell:1}},
    {k:'strings',n:'Sunday Strings',d:'Slow, smooth strings',ch:[[43,50,55,59,62],[40,47,52,55,59],[45,52,57,60,64],[41,48,53,57,60]],len:5.5,w:'triangle',cut:520,h:0.25}
  ];
  function find(k){ for(var i=0;i<S.length;i++) if(S[i].k===k) return S[i]; return S[0]; }
  function raw(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function on(){ var r=raw(); return r!=='0'&&r!=='off'; }
  function style(){ var r=raw(); return find(r&&r!=='0'&&r!=='1'?r:DEF); }
  function put(v){ try{ localStorage.setItem(KEY,v); }catch(e){} }
  /* the volume slider 0..100 (default 55): gain = 0.30 x (v/100)^2, so 55 is about 0.09 and 100 is 0.30 (still under the voice) */
  function vol(){ try{ var v=parseFloat(localStorage.getItem(VKEY)); return isFinite(v)?Math.max(0,Math.min(100,v)):55; }catch(e){ return 55; } }
  function gainOf(v){ return 0.3*Math.pow(v/100,2); }
  function setVol(v){ try{ localStorage.setItem(VKEY,String(v)); }catch(e){} if(run&&run.m&&run.c){ run.m.gain.cancelScheduledValues(run.c.currentTime); run.m.gain.setTargetAtTime(Math.max(gainOf(v),0.0001),run.c.currentTime,0.08); } }
  function hz(m){ return 440*Math.pow(2,(m-69)/12); }
  function impulse(c,sec){ var n=Math.floor(c.sampleRate*sec), b=c.createBuffer(2,n,c.sampleRate); for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch); for(var i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6); } return b; }
  function noiseBuf(c,sec){ var n=Math.floor(c.sampleRate*sec), b=c.createBuffer(2,n,c.sampleRate); for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch), l=0; for(var i=0;i<n;i++){ var x=Math.random()*2-1; l=(l+0.04*x)/1.04; d[i]=l*8; } } return b; }
  /* the sound for `sec` seconds into dest, starting at time t0 (the same code renders the samples offline) */
  function build(c,dest,sec,t0,st){
    st=st||style(); t0=t0||0; var CL=st.len, nodes=[], out=c.createGain(); out.gain.value=1;
    var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=st.cut; lp.Q.value=0.2;
    var rev=c.createConvolver(); rev.buffer=impulse(c,3); var wet=c.createGain(); wet.gain.value=0.5; var dry=c.createGain(); dry.gain.value=0.65;
    out.connect(lp); lp.connect(dry); lp.connect(rev); rev.connect(wet); dry.connect(dest); wet.connect(dest);
    var lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=0.08; lg.gain.value=st.cut*0.25; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t0); nodes.push(lfo);
    var n=Math.ceil(sec/CL)+1;
    for(var k=0;k<n;k++){ var ch=st.ch[k%st.ch.length], s=t0+k*CL, e=s+CL+2.2, att=Math.min(2.2,CL*0.45);
      ch.forEach(function(m,j){ [-3,3].forEach(function(det){ var o=c.createOscillator(), g=c.createGain(); o.type=st.w; o.frequency.value=hz(m); o.detune.value=det+(Math.random()*3-1.5);
        var v=(j<1?0.26:0.12)/2; g.gain.setValueAtTime(0.0001,s); g.gain.linearRampToValueAtTime(v,s+att); g.gain.setValueAtTime(v,s+CL-0.2); g.gain.linearRampToValueAtTime(0.0001,e);
        o.connect(g); g.connect(out); o.start(s); o.stop(e+0.1); nodes.push(o);
        if(st.h){ var o2=c.createOscillator(), g2=c.createGain(); o2.type='sine'; o2.frequency.value=hz(m)*2; o2.detune.value=det; g2.gain.setValueAtTime(0.0001,s); g2.gain.linearRampToValueAtTime(v*st.h,s+att); g2.gain.setValueAtTime(v*st.h,s+CL-0.2); g2.gain.linearRampToValueAtTime(0.0001,e); o2.connect(g2); g2.connect(out); o2.start(s); o2.stop(e+0.1); nodes.push(o2); } }); }); }
    if(st.arp){ var a=st.arp; for(var t=t0+1.2;t<t0+sec;t+=a.t*(0.8+Math.random()*0.5)){ var m=a.n[Math.floor(Math.random()*a.n.length)], o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=hz(m);
        g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(a.bell?0.2:0.28,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+a.dec); o.connect(g); g.connect(lp); o.start(t); o.stop(t+a.dec+0.1); nodes.push(o);
        if(a.bell){ var o3=c.createOscillator(), g3=c.createGain(); o3.type='sine'; o3.frequency.value=hz(m)*2.76; g3.gain.setValueAtTime(0.0001,t); g3.gain.linearRampToValueAtTime(0.05,t+0.01); g3.gain.exponentialRampToValueAtTime(0.0001,t+a.dec*0.5); o3.connect(g3); g3.connect(lp); o3.start(t); o3.stop(t+a.dec); nodes.push(o3); } } }
    if(st.noise){ var nb=c.createBufferSource(); nb.buffer=noiseBuf(c,10); nb.loop=true; var nf=c.createBiquadFilter(); nf.type='lowpass'; nf.frequency.value=st.noise.cut; var ng=c.createGain(); ng.gain.value=st.noise.lvl*0.5;
      nb.connect(nf); nf.connect(ng); ng.connect(dest); nb.start(t0); nodes.push(nb);
      if(st.noise.sw){ var sl=c.createOscillator(), sg=c.createGain(); sl.frequency.value=st.noise.sw; sg.gain.value=st.noise.lvl*0.35; sl.connect(sg); sg.connect(ng.gain); sl.start(t0); nodes.push(sl); } }
    return { stop:function(t){ nodes.forEach(function(o){ try{ o.stop(t); }catch(e){} }); } };
  }
  /* phones only let sound start from a tap: the first tap anywhere wakes the audio so the music can start later by itself */
  function unlock(){ var c=ensure(); if(c&&c.state==='suspended') c.resume(); }
  ['pointerdown','touchend','click','keydown'].forEach(function(ev){ document.addEventListener(ev,unlock,{passive:true}); });
  function ensure(){ if(ctx) return ctx; var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; try{ ctx=new AC(); }catch(e){ return null; } return ctx; }
  function start(){ if(!on()||run) return; var c=ensure(); if(!c) return; clearTimeout(stopT); if(c.state==='suspended') c.resume();
    master=c.createGain(); master.gain.setValueAtTime(0.0001,c.currentTime); master.gain.linearRampToValueAtTime(Math.max(gainOf(vol()),0.0001),c.currentTime+4); master.connect(c.destination);
    run={r:build(c,master,1800,c.currentTime,style()),m:master,c:c}; }
  function stop(){ if(!run) return; var R=run; run=null; try{ R.m.gain.cancelScheduledValues(R.c.currentTime); R.m.gain.setValueAtTime(Math.max(R.m.gain.value,0.0001),R.c.currentTime); R.m.gain.linearRampToValueAtTime(0.0001,R.c.currentTime+2.2); }catch(e){}
    setTimeout(function(){ try{ R.r.stop(R.c.currentTime); R.m.disconnect(); }catch(e){} },2500); }
  /* follow the narrator: any long audio that starts playing starts the music; when none is playing for 2 seconds it fades out */
  var live=[]; function chk(el,ev){ var i=live.indexOf(el);
    if(ev==='playing'){ if(el.duration>8&&!el.loop){ if(i<0) live.push(el); clearTimeout(stopT); clearTimeout(prevT); prevT=0; start(); } }
    else if(i>=0) live.splice(i,1);
    if(!live.length&&run&&!prevT){ clearTimeout(stopT); stopT=setTimeout(function(){ if(!live.length) stop(); },2000); } }
  function watch(){ var P=window.HTMLMediaElement&&HTMLMediaElement.prototype; if(!P||P.__mfAmb) return; P.__mfAmb=1;
    var play=P.play; P.play=function(){ var el=this; if(!el.__mfAmbW){ el.__mfAmbW=1; ['playing','pause','ended','emptied'].forEach(function(ev){ el.addEventListener(ev,function(){ chk(el,ev); }); }); } return play.apply(this,arguments); }; }
  function css(){ if(document.getElementById('mfambcss')) return; var s=document.createElement('style'); s.id='mfambcss';
    s.textContent='.mfamb{position:fixed;z-index:200;width:min(300px,calc(100vw - 20px));max-height:70vh;overflow:auto;background:#0e1116;color:#eaf0f0;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:8px;box-shadow:0 18px 40px -10px #000;font:15px/1.3 Archivo,system-ui,sans-serif}.mfamb[hidden]{display:none}'
     +'.mfamb h4{margin:6px 8px 6px;font:800 .72rem Archivo,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.7}.mfamb button{display:flex;width:100%;align-items:center;gap:10px;text-align:left;border:0;background:none;color:inherit;border-radius:10px;padding:9px 10px;font:inherit;cursor:pointer}'
     +'.mfamb button:hover{background:rgba(255,255,255,.08)}.mfamb button b{display:block;font-weight:700}.mfamb button small{display:block;opacity:.65;font-size:.78rem}.mfamb button[aria-checked=true]{background:rgba(245,215,110,.16)}.mfamb .tk{width:18px;flex:none;color:#f5d76e;font-weight:800}'
     +':root[data-mode=light] .mfamb{background:#fbfaf6;color:#1c2228;border-color:rgba(0,0,0,.15)}'; document.head.appendChild(s); }
  function draw(){ if(!menu) return; var cur=on()?style().k:'off';
    menu.innerHTML='<h4>Background music</h4><div style="display:flex;align-items:center;gap:10px;padding:4px 10px 10px"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="1" value="'+vol()+'" id="mfambV" aria-label="Music volume" style="flex:1"><span aria-hidden="true">🔊</span></div>'+'<button type="button" role="menuitemradio" aria-checked="'+(cur==='off')+'" data-k="off"><span class="tk">'+(cur==='off'?'✓':'')+'</span><span><b>Off</b><small>Just the voice</small></span></button>'
      +S.map(function(x){ return '<button type="button" role="menuitemradio" aria-checked="'+(cur===x.k)+'" data-k="'+x.k+'"><span class="tk">'+(cur===x.k?'✓':'')+'</span><span><b>'+x.n+'</b><small>'+x.d+'</small></span></button>'; }).join(''); }
  function openMenu(b){ css(); if(!menu){ menu=document.createElement('div'); menu.className='mfamb'; menu.setAttribute('role','menu'); menu.hidden=true; document.body.appendChild(menu);
      menu.addEventListener('input',function(e){ if(e.target.id==='mfambV'){ setVol(+e.target.value); if(!run&&on()){ start(); clearTimeout(prevT); prevT=setTimeout(function(){ prevT=0; if(!live.length) stop(); },9000); } } });
      menu.addEventListener('click',function(e){ e.stopPropagation(); var x=e.target.closest('[data-k]'); if(!x) return; pick(x.dataset.k); });
      document.addEventListener('click',function(e){ if(!menu.hidden&&!menu.contains(e.target)&&!btns.some(function(q){ return q.contains(e.target); })){ menu.hidden=true; ui(); } }); }
    draw(); var r=b.getBoundingClientRect(); menu.hidden=false; menu.style.left=Math.max(10,Math.min(r.left,window.innerWidth-menu.offsetWidth-10))+'px'; var top=r.bottom+8; if(top+menu.offsetHeight>window.innerHeight-10) top=Math.max(10,r.top-menu.offsetHeight-8); menu.style.top=top+'px'; }
  /* choose: Off, or a sound (a few seconds of it play so you can hear it, unless the voice is already playing) */
  function pick(k){ if(k==='off'){ put('0'); stop(); clearTimeout(prevT); prevT=0; } else { put(k); var had=!!run; if(had) stop();
      setTimeout(function(){ start(); if(!live.length){ clearTimeout(prevT); prevT=setTimeout(function(){ prevT=0; if(!live.length) stop(); },9000); } },had?400:0); }
    draw(); ui(); }
  function ui(){ btns.forEach(function(b){ var o=on(); b.setAttribute('aria-expanded',menu&&!menu.hidden?'true':'false'); b.title=o?'Background music: '+style().n+' (tap to change or turn off)':'Background music is off (tap to choose one)'; b.style.opacity=o?'1':'.55'; }); }
  function bind(b){ if(!b||btns.indexOf(b)>=0) return; btns.push(b); b.setAttribute('aria-haspopup','menu'); b.addEventListener('click',function(e){ e.stopPropagation(); if(menu&&!menu.hidden){ menu.hidden=true; ui(); return; } openMenu(b); ui(); }); ui(); }
  window.MFambient={ on:on, style:function(){ return style().k; }, set:function(v){ if(v){ if(!on()) put(DEF); } else { put('0'); stop(); } ui(); }, pick:pick, volume:function(v){ if(v!=null) setVol(v); return vol(); }, list:S, start:start, stop:stop, build:build, bind:bind, level:LEVEL };
  watch();
  function auto(){ bind(document.getElementById('dgMusic')); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',auto); else auto();
})();
