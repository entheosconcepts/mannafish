const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844}});
const route=async p=>{ await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test'){ if(u.pathname.startsWith('/api/')) return r.fulfill({status:501,body:''}); if(u.pathname.startsWith('/fish-lang/')) return r.fulfill({body:fs.readFileSync('/home/user/mannafish'+u.pathname)}); return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});}return r.abort();}); };
const errs=[];
let p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript({path:__dirname+'/fakesb.js'});await route(p);
await p.goto('http://mf.test/');await p.waitForTimeout(500);
const fresh=await p.evaluate(()=>document.getElementById('resumeBar').hidden);
await p.evaluate(()=>{ [...document.querySelectorAll('#words .wbtn')].find(x=>x.dataset.w==='LOVE').click(); });
await p.click('#flip');await p.waitForTimeout(400);
await p.click('#refs .ref >> nth=2');await p.waitForTimeout(400);
const saved=await p.evaluate(()=>localStorage.getItem('mf-resume'));
// come back later
await p.close(); p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript({path:__dirname+'/fakesb.js'});await route(p);
await p.goto('http://mf.test/');await p.waitForTimeout(600);
const bar=await p.evaluate(()=>[document.getElementById('resumeBar').hidden,document.getElementById('resumeTxt').textContent]);
await p.screenshot({path:__dirname+'/rs1.png'});
await p.click('#resumeGo');await p.waitForTimeout(600);
const back=await p.evaluate(()=>[document.getElementById('wTitle').textContent,document.getElementById('stage').classList.contains('on'),document.getElementById('reader').classList.contains('open'),document.getElementById('rRef').textContent,document.getElementById('resumeBar').hidden]);
// side by side, Chinese turned over
await p.click('#cmpBtn');await p.click('#cmpMenu button[data-l=zh]');await p.mouse.click(3,840);await p.waitForTimeout(400);
await p.click('#cmp figure[data-l=zh] .cmpf');await p.waitForTimeout(300);
await p.close(); p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.addInitScript({path:__dirname+'/fakesb.js'});await route(p);
await p.goto('http://mf.test/');await p.waitForTimeout(600);
const bar2=await p.evaluate(()=>document.getElementById('resumeTxt').textContent);
await p.click('#resumeGo');await p.waitForTimeout(800);
const cmp=await p.evaluate(()=>[...document.querySelectorAll('#cmp figure')].map(f=>f.dataset.l+':'+f.classList.contains('on')));
// a different phone: nothing saved there, but the account has the place
const ctx2=await b.newContext({viewport:{width:390,height:844}});let q=await ctx2.newPage();q.on('pageerror',e=>errs.push(e.message));
await q.addInitScript(()=>{window.__meta={mf_resume:{w:'SEEK',lang:'en',flipped:true,cmp:[],cmpOn:[],reader:{kind:'strongs',gk:true},at:Date.now()}};});
await q.addInitScript({path:__dirname+'/fakesb.js'});await route(q);
await q.goto('http://mf.test/?token_hash=goodhash&type=email');await q.waitForTimeout(900);
const other=await q.evaluate(()=>[document.getElementById('resumeBar').hidden,document.getElementById('resumeTxt').textContent,document.getElementById('acctResume').innerText]);
await q.click('#resumeGo');await q.waitForTimeout(600);
const other2=await q.evaluate(()=>[document.getElementById('wTitle').textContent,document.getElementById('rKicker').textContent]);
await q.evaluate(()=>{ [...document.querySelectorAll('#words .wbtn')].find(x=>x.dataset.w==='GIVE').click(); });await q.waitForTimeout(3600);
const up=await q.evaluate(()=>__calls.filter(c=>c[0]==='updateUser').map(c=>JSON.parse(c[1]).mf_resume.w));
console.log(JSON.stringify({fresh,saved:!!saved,bar,back,bar2,cmp,other,other2,up,errs},null,1));await b.close();})();
