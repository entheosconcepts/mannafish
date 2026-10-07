const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript({path:__dirname+'/fakesb.js'});
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.host==='mf.test'){
  if(u.pathname.startsWith('/api/')) return r.fulfill({status:501,body:''});
  return r.fulfill({body:fs.readFileSync('/home/user/mannafish/index.html'),contentType:'text/html'});}return r.abort();});
await p.goto('http://mf.test/');await p.waitForTimeout(500);
// a note written before signing in
await p.click('#notesBtn');await p.fill('#notesText','Device note on hope');await p.waitForTimeout(600);
await p.click('#acctBtn');await p.waitForTimeout(300);
await p.fill('#acctEmail','Ann@x.com');await p.click('#acctSend');await p.waitForTimeout(300);
const codeShown=await p.evaluate(()=>!document.getElementById('acctCodeF').hidden);
await p.fill('#acctCode','000000');await p.click('#acctGo');await p.waitForTimeout(200);
const badMsg=await p.textContent('#acctMsg');
await p.fill('#acctCode','123456');await p.click('#acctGo');await p.waitForTimeout(800);
const st=await p.evaluate(()=>({lab:document.getElementById('acctLab').textContent,me:document.getElementById('acctMe').textContent,notes:document.getElementById('acctNotes').innerText,orders:document.getElementById('acctOrders').innerText,act:document.getElementById('acctAct').innerText,db:__db.notes.map(n=>n.word_key+':'+n.body),acts:__db.activity.length,where:document.getElementById('notesWhere').textContent}));
await p.fill('#notesText','Edited after sign-in');await p.waitForTimeout(800);
const after=await p.evaluate(()=>__db.notes.map(n=>n.body));
await p.locator('#acctBox').scrollIntoViewIfNeeded();await p.screenshot({path:__dirname+'/a1.png'});
await p.click('#acctOutBtn');await p.waitForTimeout(200);
const out=await p.textContent('#acctLab');
console.log(JSON.stringify({codeShown,badMsg,st,after,out,calls:await p.evaluate(()=>__calls.filter(c=>c[0]!=='insert')),errs},null,1));
await b.close();})();
