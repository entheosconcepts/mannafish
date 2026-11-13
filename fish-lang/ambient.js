/* MannaFish ambient music: a soft, slow pad made in the browser (no music files, nothing to license).
   Ken, 13 Nov: "my daughter thinks ... some ambient music in the background when you're reading the devotional, it can't overpower the narrator".
   It starts by itself whenever a long recording (more than 8 seconds: the devotional, a chapter) starts playing, stays far under the voice,
   and fades out when the voice stops. Short clips (one word, one verse) never start it. On by default; the 🎵 button turns it off (kept in mf-ambient).
   window.MFambient = { on(), set(bool), start(), stop(), build(ctx, dest, seconds) } */
(function(){
  var KEY='mf-ambient', LEVEL=0.055, ctx=null, master=null, run=null, playing=0, stopT=null, btns=[];
  function get(){ try{ return localStorage.getItem(KEY)!=='0'; }catch(e){ return true; } }
  function put(v){ try{ localStorage.setItem(KEY,v?'1':'0'); }catch(e){} }
  var CH=[[48,55,59,62,64],[45,52,57,60,64],[41,48,55,57,60],[43,50,55,59,62]];   /* Cmaj9, Am9, Fmaj7(add9), G6: calm, no tension */
  function hz(m){ return 440*Math.pow(2,(m-69)/12); }
  function impulse(c,sec){ var n=Math.floor(c.sampleRate*sec), b=c.createBuffer(2,n,c.sampleRate); for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch); for(var i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6); } return b; }
  /* build the pad into dest for `sec` seconds (offline rendering uses the same code); returns {stop(t)} */
  function build(c,dest,sec,t0){
    t0=t0||c.currentTime; var out=c.createGain(); out.gain.value=1; var lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1100; lp.Q.value=0.4;
    var rev=c.createConvolver(); rev.buffer=impulse(c,3.2); var wet=c.createGain(); wet.gain.value=0.55; var dry=c.createGain(); dry.gain.value=0.6;
    out.connect(lp); lp.connect(dry); lp.connect(rev); rev.connect(wet); dry.connect(dest); wet.connect(dest);
    var lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=0.07; lg.gain.value=320; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t0);
    var CHL=9, nodes=[lfo], n=Math.ceil(sec/CHL)+1;
    for(var k=0;k<n;k++){ var ch=CH[k%CH.length], s=t0+k*CHL, e=s+CHL+3.5;
      ch.forEach(function(m,j){ [-4,4].forEach(function(det){ var o=c.createOscillator(), g=c.createGain(); o.type=j<1?'sine':'triangle'; o.frequency.value=hz(m+(j>2?12:0)); o.detune.value=det+(Math.random()*4-2);
        var v=(j<1?0.22:0.1)/2; g.gain.setValueAtTime(0.0001,s); g.gain.linearRampToValueAtTime(v,s+3.5); g.gain.setValueAtTime(v,s+CHL-0.5); g.gain.linearRampToValueAtTime(0.0001,e);
        o.connect(g); g.connect(out); o.start(s); o.stop(e+0.1); nodes.push(o); }); }); }
    return { out:out, stop:function(t){ nodes.forEach(function(o){ try{ o.stop(t); }catch(e){} }); } };
  }
  function ensure(){ if(ctx) return ctx; var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; try{ ctx=new AC(); }catch(e){ return null; } return ctx; }
  function start(){ if(!get()||run) return; var c=ensure(); if(!c) return; clearTimeout(stopT); if(c.state==='suspended') c.resume();
    master=c.createGain(); master.gain.setValueAtTime(0.0001,c.currentTime); master.gain.linearRampToValueAtTime(LEVEL,c.currentTime+4); master.connect(c.destination);
    var r=build(c,master,3600), loopT=setInterval(function(){},60000); run={r:r,loop:loopT}; ui(); }
  function stop(){ if(!run) return; var c=ctx, m=master, r=run.r; clearInterval(run.loop); run=null; try{ m.gain.cancelScheduledValues(c.currentTime); m.gain.setValueAtTime(m.gain.value,c.currentTime); m.gain.linearRampToValueAtTime(0.0001,c.currentTime+2.5); }catch(e){}
    setTimeout(function(){ try{ r.stop(c.currentTime); m.disconnect(); }catch(e){} },2800); ui(); }
  /* follow the narrator: any long audio that starts playing starts the music; when none is playing for 2 seconds it fades out */
  function watch(){ var P=HTMLMediaElement&&HTMLMediaElement.prototype; if(!P||P.__mfAmb) return; P.__mfAmb=1;
    var play=P.play; P.play=function(){ var el=this; if(!el.__mfAmbW){ el.__mfAmbW=1; ['playing','pause','ended','emptied'].forEach(function(ev){ el.addEventListener(ev,function(){ chk(el,ev); }); }); } return play.apply(this,arguments); }; }
  var live=[]; function chk(el,ev){ var i=live.indexOf(el);
    if(ev==='playing'){ if(el.duration>8&&!el.loop&&el.dataset.noamb==null){ if(i<0) live.push(el); clearTimeout(stopT); start(); } }
    else if(i>=0) live.splice(i,1);
    if(!live.length&&run){ clearTimeout(stopT); stopT=setTimeout(function(){ if(!live.length) stop(); },2000); } }
  function ui(){ btns.forEach(function(b){ var on=get(); b.setAttribute('aria-pressed',on?'true':'false'); b.title=on?'Background music is on: tap to turn it off':'Background music is off: tap to turn it on'; b.style.opacity=on?'1':'.55'; }); }
  function bind(b){ if(!b||btns.indexOf(b)>=0) return; btns.push(b); b.addEventListener('click',function(){ MFambient.set(!get()); }); ui(); }
  window.MFambient={ on:get, set:function(v){ put(!!v); if(!v) stop(); ui(); }, start:start, stop:stop, build:build, bind:bind, level:LEVEL };
  watch();
  function auto(){ bind(document.getElementById('dgMusic')); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',auto); else auto();
})();
