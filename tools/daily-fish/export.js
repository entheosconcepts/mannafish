// node export.js [ids]  -- draws every Bible-in-a-year fish the way the edit sheet does and saves plan/fish/<id>.svg
// (Chromium from Playwright; the site is read straight from this folder, nothing goes online)
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const ROOT=path.join(__dirname,'..','..'); const OUT=path.join(ROOT,'plan','fish');
(async()=>{ const b=await chromium.launch({executablePath:process.env.CHROME||'/opt/pw-browsers/chromium'}); const p=await b.newPage({viewport:{width:1200,height:900}});
  p.on('pageerror',e=>console.log('page error',e.message));
  await p.route('**/*',r=>{ const u=new URL(r.request().url()); if(u.host!=='mf.local') return r.abort(); if(u.pathname.startsWith('/api/')) return r.fulfill({status:501,body:'{}'});
    let f=path.join(ROOT,decodeURIComponent(u.pathname)); if(f.endsWith('/')) f+='index.html'; if(!fs.existsSync(f)) return r.fulfill({status:404,body:''});
    r.fulfill({body:fs.readFileSync(f),contentType:{svg:'image/svg+xml',json:'application/json',js:'text/javascript',html:'text/html',woff2:'font/woff2'}[f.split('.').pop()]||'application/octet-stream'}); });
  await p.goto('http://mf.local/edit/?set=daily'); await p.waitForFunction(()=>document.querySelectorAll('#list .card').length>0);
  const ids=JSON.parse(fs.readFileSync(path.join(ROOT,'edit','daily','data.json'),'utf8')).fish.filter(f=>f.inplan).map(f=>f.k).filter(k=>process.argv.length<3||process.argv.includes(k));   // node export.js D372 D427 ... draws only those
  fs.mkdirSync(OUT,{recursive:true}); let n=0;
  for(const id of ids){ const svg=await p.evaluate(id=>window.MFeditSvg(id),id); fs.writeFileSync(path.join(OUT,id+'.svg'),svg.replace(/\s+id="[a-z]?"/g,'')); n++; }
  console.log(n,'fish saved in plan/fish/'); await b.close(); })();
