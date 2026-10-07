// Spanish MannaFish, all 24, built on Ken's own artwork: the fish body and the MannaFish(TM)
// tail are taken unchanged from his HOPE file (all 24 English files share the identical body
// and tail). Only the word, the verse and the reference are new, set in his Hobo face.
// Sizes: never larger than on the English HOPE fish; smaller only when a line is longer.
const { chromium } = require('playwright'); const fs=require('fs');
const V=JSON.parse(fs.readFileSync(__dirname+'/verses_es.json','utf8'));
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const page=await b.newPage({viewport:{width:1200,height:600}});
 const font=fs.readFileSync(__dirname+'/hobo.txt','utf8'); const base=fs.readFileSync(__dirname+'/en/HOPE.svg','utf8');
 fs.mkdirSync(__dirname+'/out',{recursive:true});
 for (const v of V) {
  await page.setContent(`<style>@font-face{font-family:MFHobo;src:url(${font})}</style><body style="margin:0;background:#000">${base.replace(/style="width:100%;height:100%;position:absolute;top:0;left:0;/,'id="fish" style="width:1200px;height:600px;')}</body>`);
  await page.evaluate(()=>document.fonts.ready);
  const r=await page.evaluate((v)=>{
   const NS='http://www.w3.org/2000/svg', svg=document.getElementById('fish'), g=svg.querySelector('g');
   const els=[...svg.querySelectorAll('path, line')];
   // calibration from the English HOPE artwork
   const bb=i=>els[i].getBBox();
   const wordBox=(()=>{let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;[3,4,5,6].forEach(i=>{const r=bb(i);x1=Math.min(x1,r.x);y1=Math.min(y1,r.y);x2=Math.max(x2,r.x+r.width);y2=Math.max(y2,r.y+r.height);});return {cx:(x1+x2)/2,cy:(y1+y2)/2};})();
   const l=els[11]; const rp=document.createElementNS(NS,'path'); rp.setAttribute('id','g_ref'); rp.setAttribute('fill','none');
   rp.setAttribute('d',`M${l.getAttribute('x1')} ${l.getAttribute('y1')}L${l.getAttribute('x2')} ${l.getAttribute('y2')}`); g.appendChild(rp);
   els[1].setAttribute('id','g_top'); els[1].setAttribute('style','fill:none'); els[2].setAttribute('id','g_bot');
   const L={top:els[1].getTotalLength(), bot:els[2].getTotalLength(), ref:rp.getTotalLength()};
   function onPath(id,txt,size,fill){const t=document.createElementNS(NS,'text'); t.setAttribute('font-family','MFHobo'); t.setAttribute('font-size',size.toFixed(1)); t.setAttribute('fill',fill);
     const tp=document.createElementNS(NS,'textPath'); tp.setAttribute('href','#'+id); tp.setAttribute('startOffset','50%'); tp.setAttribute('text-anchor','middle'); tp.textContent=txt; t.appendChild(tp); g.appendChild(t); return t;}
   function plain(txt,size){const t=document.createElementNS(NS,'text'); t.setAttribute('font-family','MFHobo'); t.setAttribute('font-size',size.toFixed(1)); t.setAttribute('fill','#fff');
     t.setAttribute('x',wordBox.cx); t.setAttribute('y',wordBox.cy); t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','central'); t.textContent=txt; g.appendChild(t); return t;}
   function fit(make,max,cap,measure){let lo=10,hi=cap,el; for(let k=0;k<28;k++){const m=(lo+hi)/2; el=make(m); const v=measure(el); el.remove(); if(v>max) hi=m; else lo=m;} return lo;}
   const len=e=>e.getComputedTextLength(), wid=e=>e.getBBox().width;
   // English HOPE sizes (solved against his artwork earlier): word 867, top 220, bottom 237, ref 129
   // Ken, 7 Oct: "keep the heights of each word the same and uniform, and just adjust the
   // width to make it fit" -- verse lines and the tail reference are one height on every fish;
   // a long line is narrowed (textLength + spacingAndGlyphs), never made shorter.
   const H={top:220, bot:220, ref:129};
   const sWord=fit(s=>plain(v.word,s), 1900, 867, wid);
   function squeeze(t,max){const n=t.getComputedTextLength(); if(n>max){const tp=t.firstChild; tp.setAttribute('textLength',max.toFixed(1)); tp.setAttribute('lengthAdjust','spacingAndGlyphs');} return n/max;}
   [3,4,5,6,7,8,9,10,12,13,14,15,16,17].forEach(i=>els[i].remove());
   plain(v.word,sWord);
   const qTop=squeeze(onPath('g_top',v.top,H.top,'#000'), L.top*0.86);
   const qBot=squeeze(onPath('g_bot',v.bottom,H.bot,'#000'), L.bot*0.80);
   // Ken, 7 Oct: the tail reference the same size as "MannaFish" on the other side of the tail,
   // centred the same way (its mirror image across the fish), with the book shortened if needed.
   const mf=els[20].getBBox(), mfC={x:mf.x+mf.width/2,y:mf.y+mf.height/2};
   const up=els[18], lo=els[11];
   const ang=(l)=>Math.atan2(+l.getAttribute('y2')-+l.getAttribute('y1'), +l.getAttribute('x2')-+l.getAttribute('x1'))*180/Math.PI;
   const aUp=ang(up), aLo=ang(lo);
   function rotText(txt,size,cx,cy,deg){const t=document.createElementNS(NS,'text'); t.setAttribute('font-family','MFHobo'); t.setAttribute('font-size',size.toFixed(1)); t.setAttribute('fill','#000');
     t.setAttribute('x',cx); t.setAttribute('y',cy); t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','central');
     t.setAttribute('transform',`rotate(${deg.toFixed(2)} ${cx} ${cy})`); t.textContent=txt; g.appendChild(t); return t;}
   // the size "MannaFish" is drawn at: solve against Ken's own lettering on the upper tail
   const degUp=aUp+180; // that text reads from the tail tip inward
   let lo2=10,hi2=400; for(let k=0;k<28;k++){const m=(lo2+hi2)/2; const t=rotText('MannaFish',m,mfC.x,mfC.y,degUp); const w=t.getBBox(); t.remove(); if(w.width>mf.width) hi2=m; else lo2=m;}
   const sMF=124; /* solved against his MannaFish lettering; the first pass can run before the font settles */ const mfLen=(()=>{const t=rotText('MannaFish\u2122',sMF,0,0,0); const n=t.getComputedTextLength(); t.remove(); return n;})();
   // mirror point across the fish's middle line (half-way between where the two tail lines meet the body)
   const axis=(+up.getAttribute('y1') + +lo.getAttribute('y1'))/2;
   const rc={x:mfC.x, y:2*axis-mfC.y};
   const ABBR={'Deuteronomio':'Deut.','Eclesiastés':'Ecl.','Proverbios':'Prov.','Lamentaciones':'Lam.','Ezequiel':'Ez.','Romanos':'Rom.','Efesios':'Ef.','Hebreos':'Heb.','Salmos':'Sal.','Mateo':'Mat.','Lucas':'Luc.','Juan':'Jn.','2 Pedro':'2 Ped.','Génesis':'Gén.','Éxodo':'Éx.'};
   const avail=mfLen*1.12;
   let refTxt=v.ref, t0=rotText(refTxt,sMF,rc.x,rc.y,aLo), n0=t0.getComputedTextLength(); t0.remove();
   if(n0>avail){ const m=v.ref.match(/^(.*?)\s+(\d.*)$/); if(m && ABBR[m[1]]) refTxt=ABBR[m[1]]+' '+m[2]; }
   const rt=rotText(refTxt,sMF,rc.x,rc.y,aLo); const n1=rt.getComputedTextLength();
   if(n1>avail){ rt.setAttribute('textLength',avail.toFixed(1)); rt.setAttribute('lengthAdjust','spacingAndGlyphs'); }
   const qRef=n1/avail;
   const sTop=H.top,sBot=H.bot;
   return {sWord:Math.round(sWord),topWidth:Math.round(100/Math.max(1,qTop))+'%',bottomWidth:Math.round(100/Math.max(1,qBot))+'%',refWidth:Math.round(100/Math.max(1,qRef))+'%',ref:refTxt,size:Math.round(sMF)};
  }, v);
  await page.screenshot({path:`${__dirname}/out/${v.key}.png`});
  let xml=await page.evaluate(()=>document.getElementById('fish').outerHTML);
  xml=xml.replace('id="fish" style="width:1200px;height:600px;','style="width:100%;height:100%;position:absolute;top:0;left:0;');
  fs.writeFileSync(`${__dirname}/out/${v.key}.svg`,xml);
  console.log(v.key, v.word, JSON.stringify(r));
 }
 // contact sheet
 const imgs=V.map(v=>`<img src="data:image/png;base64,${fs.readFileSync(__dirname+'/out/'+v.key+'.png').toString('base64')}" style="width:390px;height:195px;margin:4px">`).join('');
 await page.setViewportSize({width:1600,height:1700}); await page.setContent(`<body style="margin:0;background:#222;width:1600px">${imgs}</body>`);
 await page.screenshot({path:__dirname+'/sheet.png',fullPage:true}); await b.close();})();
