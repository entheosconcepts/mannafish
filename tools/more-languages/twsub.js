const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test'){ if(u.pathname.startsWith('/fish-lang/')) return r.fulfill({body:fs.readFileSync('/home/user/mannafish'+u.pathname)}); return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});}return r.abort();});
await p.goto('http://mf.test/');await p.waitForTimeout(400);await p.click('#cmpBtn');await p.click('#cmpMenu button[data-l=zh]');await p.click('#cmpMenu button[data-l=el]');await p.mouse.click(2,2);await p.waitForTimeout(300);
console.log(await p.evaluate(()=>[...document.querySelectorAll('#cmp figure')].map(f=>f.dataset.l+':'+((f.querySelector('.wsub')||{}).textContent||'-'))));await b.close();})();
