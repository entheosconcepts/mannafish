const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h,n] of [[1300,900,'d'],[390,844,'m']]){
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ window.__said=[]; const V=[{lang:'en-US',name:'Google US English'},{lang:'es-US',name:'Google español'},{lang:'zh-CN',name:'Google 普通话'},{lang:'el-GR',name:'Google Ελληνικά'}];
  const SS={getVoices:()=>V,cancel(){},speak(u){ __said.push([u.lang,u.voice&&u.voice.name,u.text]); let i=0; const words=u.text.split(' '); let ci=0;
    const t=setInterval(()=>{ if(i>=words.length){clearInterval(t);u.onend&&u.onend();return;} u.onboundary&&u.onboundary({charIndex:ci}); ci+=words[i].length+1; i++; },60);} };
  Object.defineProperty(window,'speechSynthesis',{value:SS,configurable:true}); Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(t){this.text=t;},configurable:true,writable:true}); });
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test'){
  if(u.pathname==='/api/tts') return r.fulfill({status:501,body:''});
  if(u.pathname.startsWith('/fish-lang/')) return r.fulfill({body:fs.readFileSync('/home/user/mannafish'+u.pathname)});
  return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});}return r.abort();});
await p.goto('http://mf.test/');await p.waitForTimeout(600);
await p.click('#spkMain .spk[data-part=verse]');await p.waitForTimeout(250);
const mid=await p.evaluate(()=>[document.getElementById('stage').classList.contains('on'),document.getElementById('sayMain').hidden,document.querySelectorAll('#sayMain .w.on').length,document.getElementById('sayMain').innerText.slice(0,60)]);
await p.screenshot({path:__dirname+`/sp${n}1.png`});
await p.waitForTimeout(1500);
await p.click('#spkMain .spk[data-part=word]');await p.waitForTimeout(300);
await p.click('#cmpBtn');await p.click('#cmpMenu button[data-l=zh]');await p.click('#cmpMenu button[data-l=hi]');await p.click('#cmpMenu button[data-l=es]');
await p.waitForTimeout(800);
const menuOpen=await p.evaluate(()=>!document.getElementById('cmpMenu').hidden);
await p.mouse.click(5,h-5); await p.waitForTimeout(200);
const figs=await p.$$eval('#cmp figure',fs=>fs.map(f=>f.dataset.l));
await p.click('#cmp figure[data-l=zh] .spk[data-part=verse]');await p.waitForTimeout(300);
await p.screenshot({path:__dirname+`/sp${n}2.png`,fullPage:false});
await p.waitForTimeout(1200);
await p.click('#cmp figure[data-l=hi] .spk[data-part=word]');await p.waitForTimeout(300);
const hiNote=await p.evaluate(()=>document.querySelector('#cmp figure[data-l=hi] .saybox').innerText);
console.log(n,JSON.stringify({mid,menuOpen,figs,said:await p.evaluate(()=>__said),hiNote,errs}));}
await b.close();})();
