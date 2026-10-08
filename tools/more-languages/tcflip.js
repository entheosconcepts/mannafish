const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h,n] of [[1300,900,'d'],[390,844,'m']]){const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test'){ if(u.pathname.startsWith('/fish-lang/')) return r.fulfill({body:fs.readFileSync('/home/user/mannafish'+u.pathname)}); return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});}return r.abort();});
await p.goto('http://mf.test/');await p.waitForTimeout(500);
await p.click('#cmpBtn');await p.click('#cmpMenu button[data-l=zh]');await p.mouse.click(3,h-3);await p.waitForTimeout(500);
await p.click('#cmp figure[data-l=zh] .cmpf');await p.waitForTimeout(500);
const r1=await p.evaluate(()=>[...document.querySelectorAll('#cmp figure')].map(f=>f.dataset.l+':'+f.classList.contains('on')+':'+(f.querySelector('.cmpb .wtitle')||{}).textContent));
await p.locator('#cmp figure[data-l=zh]').scrollIntoViewIfNeeded();await p.screenshot({path:__dirname+`/cf${n}.png`});
await p.click('#cmp figure[data-l=zh] .cmpb .ref >> nth=2');await p.waitForTimeout(400);
const r2=await p.evaluate(()=>[document.getElementById('reader').classList.contains('open'),document.getElementById('rRef').textContent]);
await p.evaluate(()=>{document.getElementById('rClose').click();});
await p.click('#cmp figure[data-l=zh] .cmpb .wtitle');await p.waitForTimeout(300);
const r3=await p.evaluate(()=>document.querySelector('#cmp figure[data-l=zh]').classList.contains('on'));
// another word keeps the fish face-up and shows the new word on the back
await p.evaluate(()=>{ document.querySelector('#cmp figure[data-l=en] .cmpf').click(); });
await p.evaluate(()=>{ const b=[...document.querySelectorAll('#words .wbtn')].find(x=>x.dataset.w==='LOVE'); b&&b.click(); });await p.waitForTimeout(300);
const r4=await p.evaluate(()=>[...document.querySelectorAll('#cmp figure')].map(f=>f.dataset.l+':'+f.classList.contains('on')+':'+f.querySelector('.cmpb .wtitle').textContent));
console.log(n,JSON.stringify({r1,r2,r3,r4,errs}));}
await b.close();})();
