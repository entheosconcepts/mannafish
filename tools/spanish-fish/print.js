// Numbered print set: 01-24 in the 2-week order, Spanish + English pairs.
const {chromium}=require('playwright'); const fs=require('fs'); const D=__dirname;
const V=JSON.parse(fs.readFileSync(D+'/verses_es.json','utf8'));
const font=fs.readFileSync(D+'/hobo.txt','utf8').trim();
const FF=`<style>@font-face{font-family:MFHobo;src:url(${font})}*{margin:0;padding:0}</style>`;
const fix=s=>s.replace(/style="width:100%;height:100%;position:absolute;top:0;left:0;/,'style="width:100%;height:100%;display:block;');
const pad=n=>String(n).padStart(2,'0');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const out=D+'/print'; fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out+'/espanol',{recursive:true}); fs.mkdirSync(out+'/english',{recursive:true});
 // high-res PNGs: 6000 x 3000 px (1000 dpi at 6 in wide), white art on a clear background like his originals
 const p=await b.newPage({viewport:{width:2000,height:1000},deviceScaleFactor:3});
 for(const [i,v] of V.entries()){
  for(const [lang,src] of [['espanol',D+'/out/'+v.key+'.svg'],['english',D+'/en/'+v.key+'.svg']]){
   await p.setContent(FF+`<div style="width:2000px;height:1000px">${fix(fs.readFileSync(src,'utf8'))}</div>`);
   await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(50);
   const name=lang==='espanol'?`${pad(i+1)}-${v.word}`:`${pad(i+1)}-${v.key}`;
   await p.locator('div').first().screenshot({path:`${out}/${lang}/${name}.png`,omitBackground:true});
  }
 }
 // proof PDF (vector, prints sharp at any size): one page per number, Spanish over English
 const pages=V.map((v,i)=>`<section><h1>${i+1} &nbsp;·&nbsp; ${v.word} &nbsp;/&nbsp; ${v.key[0]+v.key.slice(1).toLowerCase()}</h1>
  <div class="f"><span>Español</span>${fix(fs.readFileSync(D+'/out/'+v.key+'.svg','utf8'))}</div>
  <div class="f"><span>English</span>${fix(fs.readFileSync(D+'/en/'+v.key+'.svg','utf8'))}</div></section>`).join('');
 const css=`<style>@page{size:8.5in 11in;margin:0.5in}body{font-family:Helvetica,Arial,sans-serif}section{page-break-after:always;height:10in;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly}
  h1{font-size:28pt}.f{width:7in;height:3.5in;position:relative;background:#000}.f span{position:absolute;top:-18pt;left:0;font-size:11pt;color:#555}</style>`;
 await p.setContent(FF+css+pages); await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:out+'/MannaFish-Espanol-English-proofs.pdf',width:'8.5in',height:'11in',printBackground:true});
 // numbered side-by-side sheet for chat
 const tile=(v,i)=>`<div class="t"><b>${i+1}</b><img src="data:image/png;base64,${fs.readFileSync(`${out}/espanol/${pad(i+1)}-${v.word}.png`).toString('base64')}"><img src="data:image/png;base64,${fs.readFileSync(`${out}/english/${pad(i+1)}-${v.key}.png`).toString('base64')}"></div>`;
 const q=await b.newPage({viewport:{width:1640,height:800}});
 await q.setContent(`<style>body{margin:0;background:#222;color:#fff;font:bold 30px Helvetica;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}.t{display:flex;align-items:center;gap:6px}.t b{width:44px;text-align:right}.t img{width:370px;height:185px;background:#000}</style>${V.map(tile).join('')}`);
 await q.screenshot({path:D+'/pairs.png',fullPage:true});
 await b.close();})();
