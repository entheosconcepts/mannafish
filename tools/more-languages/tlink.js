const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const h of ['goodhash','badhash']){const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript({path:__dirname+'/fakesb.js'});
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test') return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});return r.abort();});
await p.goto('http://mf.test/?token_hash='+h+'&type=email');await p.waitForTimeout(900);
console.log(h,await p.evaluate(()=>[document.getElementById('acctLab').textContent,document.getElementById('acctMe').textContent,document.getElementById('acctMsg').textContent,location.search]),errs);}
await b.close();})();
