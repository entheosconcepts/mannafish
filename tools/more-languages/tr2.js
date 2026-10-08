const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h,n] of [[1300,900,'d'],[390,844,'m']]){
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{ const V=[{lang:'en-US',name:'Google US English'},{lang:'es-US',name:'Google español'},{lang:'zh-CN',name:'Google 普通话'}];
  const SS={getVoices:()=>V,cancel(){},speak(u){ let ci=0; const words=u.text.split(u.lang==='zh-CN'?'':' '); let i=0;
    const t=setInterval(()=>{ if(i>=words.length){clearInterval(t);u.onend&&u.onend();return;} u.onboundary&&u.onboundary({charIndex:ci}); ci+=words[i].length+(u.lang==='zh-CN'?0:1); i++; },120);} };
  Object.defineProperty(window,'speechSynthesis',{value:SS,configurable:true}); Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(t){this.text=t;},configurable:true,writable:true}); });
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test'){ if(u.pathname.startsWith('/api/')) return r.fulfill({status:501,body:''}); if(u.pathname.startsWith('/fish-lang/')) return r.fulfill({body:fs.readFileSync('/home/user/mannafish'+u.pathname)}); return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});}return r.abort();});
await p.goto('http://mf.test/');await p.waitForTimeout(500);
await p.screenshot({path:__dirname+`/h${n}0.png`,clip:{x:0,y:0,width:w,height:90}});
// English fish, verse: a line lights up
await p.click('#spkMain .spk[data-part=verse]');await p.waitForTimeout(300);
const enLit=await p.evaluate(()=>{const e=[...document.querySelectorAll('#fishbox svg path,#fishbox svg line')];return [e[14].style.fill,e[16].style.fill];});
await p.waitForTimeout(1400);
const enAfter=await p.evaluate(()=>{const e=[...document.querySelectorAll('#fishbox svg path,#fishbox svg line')];return [e[14].style.fill,e[16].style.fill,document.getElementById('sayMain').hidden];});
await p.click('#spkMain .spk[data-part=word]');await p.waitForTimeout(150);
const wordLit=await p.evaluate(()=>[...document.querySelectorAll('#fishbox svg path')][3].style.fill);
await p.waitForTimeout(500);
// menu: page language and compare
await p.click('#cmpBtn');await p.waitForTimeout(150);
const menu=await p.$$eval('#cmpMenu > *',a=>a.map(e=>(e.className||'')+':'+e.textContent));
await p.screenshot({path:__dirname+`/h${n}1.png`});
await p.click('#cmpMenu button[data-l=zh]');await p.mouse.click(3,h-3);await p.waitForTimeout(500);
const lab=await p.textContent('#cmpLab');
await p.click('#cmp figure[data-l=zh] .spk[data-part=verse]');await p.waitForTimeout(500);
const zhLit=await p.evaluate(()=>[...document.querySelectorAll('#cmp figure[data-l=zh] svg tspan')].filter(t=>t.getAttribute('fill')).map(t=>t.textContent).join(''));
await p.locator('#cmp figure[data-l=zh]').scrollIntoViewIfNeeded();await p.screenshot({path:__dirname+`/h${n}2.png`});
await p.waitForTimeout(2500);
// page language from the same menu
await p.click('#cmpBtn');await p.click('#cmpMenu button[data-pg=es]');await p.waitForTimeout(400);
const es=await p.evaluate(()=>[MF.lang,document.getElementById('cmpLab').textContent,[...document.querySelectorAll('#cmp figure')].map(f=>f.dataset.l).join()]);
await p.click('#cmp figure[data-l=es] .spk[data-part=verse]');await p.waitForTimeout(400);
const esLit=await p.evaluate(()=>[...document.querySelectorAll('#cmp figure[data-l=es] svg tspan')].filter(t=>t.getAttribute('fill')).map(t=>t.textContent).join('|'));
console.log(n,JSON.stringify({enLit,enAfter,wordLit,menu,lab,zhLit,es,esLit,errs}));}
await b.close();})();
