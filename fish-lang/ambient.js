/* MannaFish ambient music: soft pads, bells and rain made in the browser (no music files, nothing to license).
   Ken, 13 Nov: his daughter's idea, under the devotional narrator, "it can't overpower the narrator"; then "a little rounder, change notes sooner,
   12 sounds + acoustic guitar, jazz and lo-fi, and a way to turn it off or on".
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
    {k:'strings',n:'Sunday Strings',d:'Slow, smooth strings',ch:[[43,50,55,59,62],[40,47,52,55,59],[45,52,57,60,64],[41,48,53,57,60]],len:5.5,w:'triangle',cut:520,h:0.25},
    /* Ken, 14 Nov: "acoustic guitar instrumental ... jazz ... lo-fi" instead of the hymns. All made in the browser: plucked strings, electric-piano chords, soft drums, vinyl crackle. */
    {k:'guitar1',n:'Acoustic Morning',d:'Fingerpicked guitar, easy and bright',g:1,kind:'guitar',bpm:76,pat:[0,2,1,3,2,1,3,1],prog:[[48,55,60,64],[43,50,55,59],[45,52,57,60],[41,48,53,57]],win:40,cut:4200},
    {k:'guitar2',n:'Acoustic Porch',d:'Slow folk guitar',g:1,kind:'guitar',bpm:62,pat:[0,3,2,3,1,3,2,3],prog:[[43,50,55,59],[40,47,52,55],[48,55,60,64],[50,57,62,66]],win:40,cut:3600},
    {k:'jazz1',n:'Late Night Jazz',d:'Soft piano, upright bass, brushes',g:1,kind:'jazz',bpm:78,prog:[{b:38,c:[53,57,60,64],w:[38,41,45,43]},{b:43,c:[53,59,62,64],w:[43,47,50,46]},{b:36,c:[52,59,62,67],w:[36,40,43,45]},{b:45,c:[55,61,64,70],w:[45,49,52,50]}],win:36,cut:5200},
    {k:'jazz2',n:'Café Jazz',d:'Lighter, a little quicker',g:1,kind:'jazz',bpm:104,prog:[{b:36,c:[52,59,62,67],w:[36,40,43,47]},{b:45,c:[55,61,64,67],w:[45,49,52,48]},{b:38,c:[53,57,60,64],w:[38,41,45,47]},{b:43,c:[53,59,62,65],w:[43,47,50,48]}],win:36,cut:5600},
    {k:'lofi1',n:'Lo-fi Study',d:'Mellow keys, soft beat, vinyl crackle',g:1,kind:'lofi',bpm:74,drums:1,prog:[{b:41,c:[57,60,64,67]},{b:40,c:[55,59,62,67]},{b:38,c:[53,57,60,64]},{b:36,c:[55,59,62,64]}],win:36,cut:2300},
    {k:'lofi2',n:'Lo-fi Rain',d:'Dreamy keys, rain and crackle, no drums',g:1,kind:'lofi',bpm:58,rain:1,prog:[{b:45,c:[60,64,67,71]},{b:41,c:[57,60,64,67]},{b:36,c:[55,59,64,67]},{b:43,c:[53,59,62,65]}],win:36,cut:2000}
  ];
  /* ── the instrument sounds ── */
  function cache(c){ if(!c.__mfa) c.__mfa={ks:{},nz:null,vx:null}; return c.__mfa; }
  function noise1(c){ var K=cache(c); if(!K.nz){ var n=c.sampleRate*2, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(var i=0;i<n;i++) d[i]=Math.random()*2-1; K.nz=b; } return K.nz; }
  function crackleBuf(c){ var K=cache(c); if(!K.vx){ var n=c.sampleRate*6, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(var i=0;i<n;i++){ var x=(Math.random()*2-1)*0.04; if(Math.random()<0.0006) x+=(Math.random()*2-1)*(0.5+Math.random()*0.8); d[i]=x; } K.vx=b; } return K.vx; }
  /* a plucked string (Karplus-Strong): a burst of noise in a loop that loses its high notes as it rings, like a guitar string */
  function ksBuf(c,m){ var K=cache(c); if(K.ks[m]) return K.ks[m]; var sr=c.sampleRate, N=Math.max(2,Math.round(sr/hz(m))), len=Math.floor(sr*3.4), b=c.createBuffer(1,len,sr), d=b.getChannelData(0), i, lastv=0, pk=0;
    for(i=0;i<N;i++){ var x=Math.random()*2-1; lastv=d[i]=0.45*x+0.55*lastv; }
    var g=m<50?0.9985:0.9965; for(i=N;i<len;i++){ d[i]=g*0.5*(d[i-N]+(i>N?d[i-N-1]:d[i-N])); }
    for(i=0;i<len;i++) pk=Math.max(pk,Math.abs(d[i])); var k=0.8/(pk||1); for(i=0;i<len;i++) d[i]*=k; K.ks[m]=b; return b; }
  function pluck(c,dest,t,m,v,nodes){ var s=c.createBufferSource(); s.buffer=ksBuf(c,m); var g=c.createGain(); g.gain.value=v; s.connect(g); g.connect(dest); s.start(t); nodes.push(s); }
  function rhodes(c,dest,t,m,dur,v,nodes,wob){ var f=hz(m), g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(v,t+0.01); g.gain.exponentialRampToValueAtTime(Math.max(v*0.4,0.0002),t+0.6); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); g.connect(dest);
    [[1,1],[2,0.22]].forEach(function(h,i){ var o=c.createOscillator(), og=c.createGain(); o.type='sine'; o.frequency.value=f*h[0]; o.detune.value=Math.random()*6-3; og.gain.setValueAtTime(h[1],t); if(i) og.gain.exponentialRampToValueAtTime(0.01,t+0.7); o.connect(og); og.connect(g); if(wob) wob.connect(o.detune); o.start(t); o.stop(t+dur+0.1); nodes.push(o); }); }
  function bassNote(c,dest,t,m,dur,v,nodes){ var o=c.createOscillator(), g=c.createGain(); o.type='triangle'; o.frequency.value=hz(m); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(v,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t+dur+0.05); nodes.push(o); }
  function hit(c,dest,t,dur,v,hp,lp,nodes){ var s=c.createBufferSource(); s.buffer=noise1(c); var f=c.createBiquadFilter(); f.type=lp?'bandpass':'highpass'; f.frequency.value=lp||hp; f.Q.value=lp?0.8:0.3; var g=c.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(dest); s.start(t,Math.random()); s.stop(t+dur+0.02); nodes.push(s); }
  function kick(c,dest,t,v,nodes){ var o=c.createOscillator(), g=c.createGain(); o.frequency.setValueAtTime(125,t); o.frequency.exponentialRampToValueAtTime(42,t+0.16); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.34); o.connect(g); g.connect(dest); o.start(t); o.stop(t+0.4); nodes.push(o); }
  function snare(c,dest,t,v,nodes){ hit(c,dest,t,0.16,v,0,1900,nodes); var o=c.createOscillator(), g=c.createGain(); o.type='triangle'; o.frequency.value=190; g.gain.setValueAtTime(v*0.5,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.1); o.connect(g); g.connect(dest); o.start(t); o.stop(t+0.12); nodes.push(o); }
  function buildKind(c,dest,sec,t0,st){ var nodes=[], out=c.createGain(), E=30/st.bpm, bar=E*8, N=st.prog.length, cyc=bar*N; out.gain.value=1; sec=Math.max(cyc,Math.ceil(sec/cyc)*cyc); var END=t0+sec;
    var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=st.cut; lp.Q.value=0.3;
    var rev=c.createConvolver(); rev.buffer=impulse(c,st.kind==='guitar'?1.8:2.4); var wet=c.createGain(); wet.gain.value=st.kind==='lofi'?0.3:0.22; var dry=c.createGain(); dry.gain.value=0.8; out.connect(lp); lp.connect(dry); lp.connect(rev); rev.connect(wet); dry.connect(dest); wet.connect(dest);
    var bars=Math.round(sec/bar), wob=null, r=function(a){ return a*(0.85+Math.random()*0.3); };
    if(st.kind==='lofi'){ wob=c.createGain(); wob.gain.value=9; var wl=c.createOscillator(); wl.frequency.value=0.5; wl.connect(wob); wl.start(t0); wl.stop(END+4); nodes.push(wl);
      var vx=c.createBufferSource(); vx.buffer=crackleBuf(c); vx.loop=true; var vh=c.createBiquadFilter(); vh.type='highpass'; vh.frequency.value=1800; var vg=c.createGain(); vg.gain.setValueAtTime(0.0001,t0); vg.gain.linearRampToValueAtTime(0.5,t0+2); vg.gain.setValueAtTime(0.5,END); vg.gain.linearRampToValueAtTime(0.0001,END+2); vx.connect(vh); vh.connect(vg); vg.connect(dest); vx.start(t0); vx.stop(END+2.2); nodes.push(vx);
      if(st.rain){ var rn=c.createBufferSource(); rn.buffer=noiseBuf(c,6); rn.loop=true; var rf=c.createBiquadFilter(); rf.type='lowpass'; rf.frequency.value=3200; var rg=c.createGain(); rg.gain.setValueAtTime(0.0001,t0); rg.gain.linearRampToValueAtTime(0.11,t0+2); rg.gain.setValueAtTime(0.11,END); rg.gain.linearRampToValueAtTime(0.0001,END+2); rn.connect(rf); rf.connect(rg); rg.connect(dest); rn.start(t0); rn.stop(END+2.2); nodes.push(rn); } }
    for(var k=0;k<bars;k++){ var ch=st.prog[k%N], T=t0+k*bar, i;
      if(st.kind==='guitar'){ var notes=ch; for(i=0;i<8;i++){ var m=notes[st.pat[i]]; pluck(c,out,T+i*E+(Math.random()*0.012),m,(st.pat[i]===0?0.62:0.36)*r(1),nodes); } }
      else if(st.kind==='jazz'){ var bt=E*2;   /* a beat */
        [0,1.67,3].forEach(function(b,hi){ ch.c.forEach(function(m,j){ rhodes(c,out,T+b*bt+j*0.012,m,bt*2.2,(hi===0?0.15:0.11)*r(1),nodes,null); }); });
        for(i=0;i<4;i++) bassNote(c,out,T+i*bt,ch.w[i],bt*0.95,0.42*r(1),nodes);
        [0,1,1.67,2,3,3.67].forEach(function(b){ hit(c,out,T+b*bt,0.07,0.028*r(1),7000,0,nodes); }); hit(c,out,T+bt,0.09,0.03,5500,0,nodes); hit(c,out,T+3*bt,0.09,0.03,5500,0,nodes); }
      else { ch.c.forEach(function(m,j){ rhodes(c,out,T+j*0.022,m,bar*1.05,0.13*r(1),nodes,wob); }); bassNote(c,out,T,ch.b,E*3.5,0.4,nodes); bassNote(c,out,T+E*4.5,ch.b,E*3,0.3,nodes);
        if(st.drums){ for(i=0;i<8;i++){ var sw=(i%2)?E*0.14:0, tt=T+i*E+sw; if(i===0||i===3||i===6&&k%2) kick(c,out,tt,0.55,nodes); if(i===2||i===6) snare(c,out,tt,0.2*r(1),nodes); hit(c,out,tt,0.035,(i%2?0.02:0.035)*r(1),7500,0,nodes); } } } }
    return { end:END, stop:function(tt){ nodes.forEach(function(o){ try{ o.stop(tt); }catch(e){} }); } };
  }
  function find(k){ for(var i=0;i<S.length;i++) if(S[i].k===k) return S[i]; return S[0]; }
  function raw(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function on(){ var r=raw(); return r!=='0'&&r!=='off'; }
  function style(){ var r=raw(); return find(r&&r!=='0'&&r!=='1'?r:DEF); }
  function put(v){ try{ localStorage.setItem(KEY,v); }catch(e){} }
  /* the volume slider 0..100 (default 55): gain = 0.30 x (v/100)^2, so 55 is about 0.09 and 100 is 0.30 (still under the voice) */
  function vol(){ try{ var v=parseFloat(localStorage.getItem(VKEY)); return isFinite(v)?Math.max(0,Math.min(100,v)):85; }catch(e){ return 85; } }
  function gainOf(v){ return 0.36*Math.pow(v/100,2); }   /* 85 is the starting point (Ken, 14 Nov: halfway was too quiet to hear) */
  function setVol(v){ try{ localStorage.setItem(VKEY,String(v)); }catch(e){} if(run&&run.m&&run.c){ run.m.gain.cancelScheduledValues(run.c.currentTime); run.m.gain.setTargetAtTime(Math.max(gainOf(v),0.0001),run.c.currentTime,0.08); } }
  function hz(m){ return 440*Math.pow(2,(m-69)/12); }
  function impulse(c,sec){ var n=Math.floor(c.sampleRate*sec), b=c.createBuffer(2,n,c.sampleRate); for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch); for(var i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6); } return b; }
  function noiseBuf(c,sec){ var n=Math.floor(c.sampleRate*sec), b=c.createBuffer(2,n,c.sampleRate); for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch), l=0; for(var i=0;i<n;i++){ var x=Math.random()*2-1; l=(l+0.04*x)/1.04; d[i]=l*8; } } return b; }
  /* the sound for `sec` seconds into dest, starting at time t0 (the same code renders the samples offline) */
  function build(c,dest,sec,t0,st){
    st=st||style(); t0=t0||0; if(st.kind) return buildKind(c,dest,sec,t0,st); var CL=st.len, nodes=[], out=c.createGain(); out.gain.value=1; var cyc=CL*st.ch.length; sec=Math.max(cyc,Math.ceil(sec/cyc)*cyc); var END=t0+sec;
    var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=st.cut; lp.Q.value=0.2;
    var rev=c.createConvolver(); rev.buffer=impulse(c,3); var wet=c.createGain(); wet.gain.value=0.5; var dry=c.createGain(); dry.gain.value=0.65;
    out.connect(lp); lp.connect(dry); lp.connect(rev); rev.connect(wet); dry.connect(dest); wet.connect(dest);
    var lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=0.08; lg.gain.value=st.cut*0.25; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t0); lfo.stop(END+3); nodes.push(lfo);
    var n=Math.ceil(sec/CL);
    for(var k=0;k<n;k++){ var ch=st.ch[k%st.ch.length], s=t0+k*CL, e=s+CL+2.2, att=Math.min(2.2,CL*0.45);
      ch.forEach(function(m,j){ [-3,3].forEach(function(det){ var o=c.createOscillator(), g=c.createGain(); o.type=st.w; o.frequency.value=hz(m); o.detune.value=det+(Math.random()*3-1.5);
        var v=(j<1?0.26:0.12)/2; g.gain.setValueAtTime(0.0001,s); g.gain.linearRampToValueAtTime(v,s+att); g.gain.setValueAtTime(v,s+CL-0.2); g.gain.linearRampToValueAtTime(0.0001,e);
        o.connect(g); g.connect(out); o.start(s); o.stop(e+0.1); nodes.push(o);
        if(st.h){ var o2=c.createOscillator(), g2=c.createGain(); o2.type='sine'; o2.frequency.value=hz(m)*2; o2.detune.value=det; g2.gain.setValueAtTime(0.0001,s); g2.gain.linearRampToValueAtTime(v*st.h,s+att); g2.gain.setValueAtTime(v*st.h,s+CL-0.2); g2.gain.linearRampToValueAtTime(0.0001,e); o2.connect(g2); g2.connect(out); o2.start(s); o2.stop(e+0.1); nodes.push(o2); } }); }); }
    if(st.arp){ var a=st.arp; for(var t=t0+1.2;t<t0+sec;t+=a.t*(0.8+Math.random()*0.5)){ var m=a.n[Math.floor(Math.random()*a.n.length)], o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=hz(m);
        g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(a.bell?0.2:0.28,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+a.dec); o.connect(g); g.connect(lp); o.start(t); o.stop(t+a.dec+0.1); nodes.push(o);
        if(a.bell){ var o3=c.createOscillator(), g3=c.createGain(); o3.type='sine'; o3.frequency.value=hz(m)*2.76; g3.gain.setValueAtTime(0.0001,t); g3.gain.linearRampToValueAtTime(0.05,t+0.01); g3.gain.exponentialRampToValueAtTime(0.0001,t+a.dec*0.5); o3.connect(g3); g3.connect(lp); o3.start(t); o3.stop(t+a.dec); nodes.push(o3); } } }
    if(st.noise){ var nb=c.createBufferSource(); nb.buffer=noiseBuf(c,10); nb.loop=true; var nf=c.createBiquadFilter(); nf.type='lowpass'; nf.frequency.value=st.noise.cut; var ng=c.createGain(); ng.gain.value=st.noise.lvl*0.5;
      var nl=st.noise.lvl*0.5; ng.gain.setValueAtTime(0.0001,t0); ng.gain.linearRampToValueAtTime(nl,t0+2); ng.gain.setValueAtTime(nl,END); ng.gain.linearRampToValueAtTime(0.0001,END+2);
      nb.connect(nf); nf.connect(ng); ng.connect(dest); nb.start(t0); nb.stop(END+2.2); nodes.push(nb);
      if(st.noise.sw){ var sl=c.createOscillator(), sg=c.createGain(); sl.frequency.value=st.noise.sw; sg.gain.value=st.noise.lvl*0.35; sl.connect(sg); sg.connect(ng.gain); sl.start(t0); sl.stop(END+2.2); nodes.push(sl); } }
    return { end:END, stop:function(t){ nodes.forEach(function(o){ try{ o.stop(t); }catch(e){} }); } };
  }
  /* phones only let sound start from a tap: the first tap anywhere wakes the audio so the music can start later by itself */
  function unlock(){ var c=ensure(); if(c&&c.state==='suspended') c.resume(); }
  ['pointerdown','touchend','click','keydown'].forEach(function(ev){ document.addEventListener(ev,unlock,{passive:true}); });
  function ensure(){ if(ctx) return ctx; var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; try{ ctx=new AC(); }catch(e){ return null; } return ctx; }
  function start(){ if(!on()||run||held) return; var c=ensure(); if(!c) return; clearTimeout(stopT); if(c.state==='suspended') c.resume();
    master=c.createGain(); master.gain.setValueAtTime(0.0001,c.currentTime); master.gain.linearRampToValueAtTime(Math.max(gainOf(vol()),0.0001),c.currentTime+4); master.connect(c.destination);
    /* the sound is scheduled a minute at a time and the next minute is added before this one ends (thousands of notes at once made phones glitch) */
    var R={c:c,m:master,st:style(),hs:[],next:c.currentTime+0.05}; run=R; sched(R); R.timer=setInterval(function(){ if(R!==run){ clearInterval(R.timer); return; } if(R.next-c.currentTime<(R.st.win||60)/2) sched(R); },3000); }
  function sched(R){ var h=build(R.c,R.m,R.st.win||60,R.next,R.st); R.hs.push(h); R.next=h.end; }
  function stop(fast){ if(!run) return; var R=run; run=null; clearInterval(R.timer); var f=fast===true?0.25:(typeof fast==='number'?fast:2.2); try{ R.m.gain.cancelScheduledValues(R.c.currentTime); R.m.gain.setValueAtTime(Math.max(R.m.gain.value,0.0001),R.c.currentTime); R.m.gain.linearRampToValueAtTime(0.0001,R.c.currentTime+f); }catch(e){}
    setTimeout(function(){ try{ R.hs.forEach(function(h){ h.stop(R.c.currentTime); }); R.m.disconnect(); }catch(e){} },f*1000+300); }
  /* follow the narrator: any long audio that starts playing starts the music; when none is playing for 2 seconds it fades out */
  var live=[]; function chk(el,ev){ if(window.MFambientNoAuto) return; var i=live.indexOf(el);
    if(ev==='playing'){ if(el.duration>8&&!el.loop){ if(i<0) live.push(el); clearTimeout(stopT); clearTimeout(prevT); prevT=0; start(); } }
    else if(i>=0) live.splice(i,1);
    if(!live.length&&!nar&&run&&!prevT){ clearTimeout(stopT); stopT=setTimeout(function(){ if(!live.length&&!nar) stop(0.7); },350); } }
  /* Ken, 13 Nov: "the music's not playing behind the narrator still": the page now tells the music directly when it starts and stops reading a devotional
     or chapter (MFambient.narr(true/false)), instead of guessing from the audio. It runs inside the tap on Listen, so phones allow the sound. */
  var nar=false;
  function narr(on2){ if(window.MFambientNoAuto) return; nar=!!on2; if(nar){ held=false; clearTimeout(stopT); clearTimeout(prevT); prevT=0; unlock(); start(); } else if(!live.length&&run&&!prevT){ clearTimeout(stopT); stopT=setTimeout(function(){ if(!nar&&!live.length) stop(0.7); },350); } }
  /* Ken, 14 Nov: "if a user pauses the narration the music keeps playing for a second": pausing the voice (any pause button) fades the music out at once; resuming brings it back */
  var held=false, holdT=null;
  function hold(h){ held=!!h; if(held){ if(run) stop(0.5); } else if(nar||live.length){ clearTimeout(stopT); start(); } }
  function watch(){ var P=window.HTMLMediaElement&&HTMLMediaElement.prototype; if(!P||P.__mfAmb) return; P.__mfAmb=1;
    var play=P.play; P.play=function(){ var el=this; if(!el.__mfAmbW){ el.__mfAmbW=1; ['playing','pause','ended','emptied'].forEach(function(ev){ el.addEventListener(ev,function(){ chk(el,ev); if(window.MFambientNoAuto) return;
          if(ev==='pause'&&!el.ended&&(nar||live.length)){ clearTimeout(holdT); holdT=setTimeout(function(){ if(el.paused&&!el.ended) hold(true); },120); }
          else if(ev==='playing'){ clearTimeout(holdT); if(held) hold(false); } }); }); } return play.apply(this,arguments); }; }
  function css(){ if(document.getElementById('mfambcss')) return; var s=document.createElement('style'); s.id='mfambcss';
    s.textContent='.mfamb{position:fixed;z-index:200;width:min(300px,calc(100vw - 20px));max-height:70vh;overflow:auto;background:#0e1116;color:#eaf0f0;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:8px;box-shadow:0 18px 40px -10px #000;font:15px/1.3 Archivo,system-ui,sans-serif}.mfamb[hidden]{display:none}'
     +'.mfambp{position:static!important;width:auto!important;max-height:none!important;border:0!important;box-shadow:none!important;background:none!important;padding:0!important;overflow:visible!important;color:inherit!important}.mfamb h4{margin:6px 8px 6px;font:800 .72rem Archivo,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.7}.mfamb button{display:flex;width:100%;align-items:center;gap:10px;text-align:left;border:0;background:none;color:inherit;border-radius:10px;padding:9px 10px;font:inherit;cursor:pointer}'
     +'.mfamb button:hover{background:rgba(255,255,255,.08)}.mfamb button b{display:block;font-weight:700}.mfamb button small{display:block;opacity:.65;font-size:.78rem}.mfamb button[aria-checked=true]{background:rgba(245,215,110,.16)}.mfamb .tk{width:18px;flex:none;color:#f5d76e;font-weight:800}'
     +':root[data-mode=light] .mfamb{background:#fbfaf6;color:#1c2228;border-color:rgba(0,0,0,.15)}'; document.head.appendChild(s); }
  /* the list (Off, the sounds, the volume): used by the 🎵 button's popup and, in two columns beside the narrators, by the narrator window */
  function panelHtml(){ var cur=on()?style().k:'off';
    return '<h4>Background music</h4><div style="display:flex;align-items:center;gap:10px;padding:4px 10px 10px"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="1" value="'+vol()+'" class="mfambV" id="mfambV" aria-label="Music volume" style="flex:1;min-width:0"><span aria-hidden="true">🔊</span></div>'
      +'<button type="button" role="menuitemradio" aria-checked="'+(cur==='off')+'" data-k="off"><span class="tk">'+(cur==='off'?'✓':'')+'</span><span><b>Off</b><small>Just the voice</small></span></button>'
      +S.map(function(x,i){ return (x.g&&!S[i-1].g?'<h4>Instrumental</h4>':'')+'<button type="button" role="menuitemradio" aria-checked="'+(cur===x.k)+'" data-k="'+x.k+'"><span class="tk">'+(cur===x.k?'✓':'')+'</span><span><b>'+x.n+'</b><small>'+x.d+'</small></span></button>'; }).join(''); }
  var PAN=[];
  function draw(){ if(menu) menu.innerHTML=panelHtml(); PAN=PAN.filter(function(e){ return document.body.contains(e); }); PAN.forEach(function(e){ var y=e.scrollTop; e.innerHTML=panelHtml(); e.scrollTop=y; }); }
  function volInput(e){ if(e.target.classList&&e.target.classList.contains('mfambV')){ setVol(+e.target.value); if(!run&&on()){ start(); clearTimeout(prevT); prevT=setTimeout(function(){ prevT=0; if(!live.length&&!nar) stop(); },9000); } } }
  function bindPanel(el){ css(); el.classList.add('mfamb','mfambp'); el.innerHTML=panelHtml(); if(PAN.indexOf(el)<0) PAN.push(el); if(el.__mfb) return; el.__mfb=1;
    el.addEventListener('input',volInput); el.addEventListener('click',function(e){ var x=e.target.closest('[data-k]'); if(!x) return; e.stopPropagation(); pick(x.dataset.k); }); }
  function openMenu(b){ css(); if(!menu){ menu=document.createElement('div'); menu.className='mfamb'; menu.setAttribute('role','menu'); menu.hidden=true; document.body.appendChild(menu);
      menu.addEventListener('input',volInput);
      menu.addEventListener('click',function(e){ e.stopPropagation(); var x=e.target.closest('[data-k]'); if(!x) return; pick(x.dataset.k); });
      document.addEventListener('click',function(e){ if(!menu.hidden&&!menu.contains(e.target)&&!btns.some(function(q){ return q.contains(e.target); })){ menu.hidden=true; ui(); } }); }
    draw(); var r=b.getBoundingClientRect(); menu.hidden=false; menu.style.left=Math.max(10,Math.min(r.left,window.innerWidth-menu.offsetWidth-10))+'px'; var top=r.bottom+8; if(top+menu.offsetHeight>window.innerHeight-10) top=Math.max(10,r.top-menu.offsetHeight-8); menu.style.top=top+'px'; }
  /* choose: Off, or a sound (a few seconds of it play so you can hear it, unless the voice is already playing) */
  var GEN=0;
  function pick(k){ var g=++GEN; clearTimeout(prevT); prevT=0;
    if(k==='off'){ put('0'); stop(); }
    else { put(k); var had=!!run; if(had) stop(true);   /* the old sound is cut off quickly so only one plays */
      setTimeout(function(){ if(g!==GEN) return; start(); if(!live.length&&!nar){ prevT=setTimeout(function(){ prevT=0; if(g===GEN&&!live.length&&!nar) stop(); },9000); } },had?420:0); }
    draw(); ui(); }
  function ui(){ btns.forEach(function(b){ var o=on(); b.setAttribute('aria-expanded',menu&&!menu.hidden?'true':'false'); b.title=o?'Background music: '+style().n+' (tap to change or turn off)':'Background music is off (tap to choose one)'; b.style.opacity=o?'1':'.55'; }); }
  function bind(b){ if(!b||btns.indexOf(b)>=0) return; btns.push(b); b.setAttribute('aria-haspopup','menu'); b.addEventListener('click',function(e){ e.stopPropagation(); if(menu&&!menu.hidden){ menu.hidden=true; ui(); return; } openMenu(b); ui(); }); ui(); }
  /* for other pages (Time with God): play a sound into any node, a minute at a time; returns {stop()} */
  function loop(c,dest,st){ var R={c:c,m:dest,st:st,hs:[],next:c.currentTime+0.05,dead:false}; sched(R); R.timer=setInterval(function(){ if(R.dead){ clearInterval(R.timer); return; } if(R.next-c.currentTime<(st.win||60)/2) sched(R); },3000);
    return { stop:function(){ R.dead=true; clearInterval(R.timer); R.hs.forEach(function(h){ try{ h.stop(c.currentTime); }catch(e){} }); } }; }
  window.MFambient={ loop:loop, on:on, style:function(){ return style().k; }, set:function(v){ if(v){ if(!on()) put(DEF); } else { put('0'); stop(); } ui(); }, pick:pick, volume:function(v){ if(v!=null) setVol(v); return vol(); }, list:S, start:start, stop:stop, narr:narr, hold:hold, running:function(){ return !!run; }, build:build, bind:bind, panel:bindPanel, level:LEVEL };
  watch();
  function auto(){ bind(document.getElementById('dgMusic')); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',auto); else auto();
})();
