// Other-language MannaFish (node gen3.js tl|zh|hi|el), the same way as the Spanish gen2.js:
// Ken's fish body and MannaFish(TM) tail, with the word, verse and reference in a face that has the letters.
// Spanish MannaFish, all 24, built on Ken's own artwork: the fish body and the MannaFish(TM)
// tail are taken unchanged from his HOPE file (all 24 English files share the identical body
// and tail). Only the word, the verse and the reference are new, set in his Hobo face.
// Sizes: never larger than on the English HOPE fish; smaller only when a line is longer.
const { chromium } = require('playwright'); const fs=require('fs');
const LG=process.argv[2]; const ALL=JSON.parse(fs.readFileSync(__dirname+'/lines.json','utf8')); const V=ALL[LG].fish, TAG=ALL[LG].tag;
const FONTS={tl:{fam:'MFHobo',w:'normal',file:null}, zh:{fam:'ZCOOL KuaiLe',w:'normal',file:'ZCOOLKuaiLe-Regular.ttf'}, hi:{fam:'Baloo 2',w:'800',file:'Baloo2[wght].ttf'}, el:{fam:'Ubuntu',w:'700',file:'Ubuntu-Bold.ttf'}, de:{fam:'MFHobo',w:'normal',file:null}, ko:{fam:'Jua',w:'normal',file:'Jua-Regular.ttf'}};
const F=FONTS[LG]; const OUT=__dirname+'/out-'+LG;
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const page=await b.newPage({viewport:{width:1200,height:600}});
 const font=fs.readFileSync(__dirname+'/hobo.txt','utf8'); const base=fs.readFileSync(__dirname+'/en/HOPE.svg','utf8');
 fs.mkdirSync(OUT,{recursive:true}); const ff=F.file?`@font-face{font-family:'${F.fam}';src:url(data:font/ttf;base64,${fs.readFileSync(__dirname+'/../fonts/'+F.file).toString('base64')});font-weight:100 900}`:'';
 for (const v of V) {
  await page.setContent(`<style>@font-face{font-family:MFHobo;src:url(${font})}${ff}</style><div style="font-family:'${F.fam}';font-weight:${F.w};position:absolute;opacity:0">${v.word}${v.top}${v.bottom}${v.ref}${TAG}</div><body style="margin:0;background:#000">${base.replace(/style="width:100%;height:100%;position:absolute;top:0;left:0;/,'id="fish" style="width:1200px;height:600px;')}</body>`);
  await page.evaluate(()=>document.fonts.ready);
  const r=await page.evaluate(([v,F,TAG])=>{
   const NS='http://www.w3.org/2000/svg', svg=document.getElementById('fish'), g=svg.querySelector('g');
   const els=[...svg.querySelectorAll('path, line')];
   // calibration from the English HOPE artwork
   const bb=i=>els[i].getBBox();
   const wordBox=(()=>{let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;[3,4,5,6].forEach(i=>{const r=bb(i);x1=Math.min(x1,r.x);y1=Math.min(y1,r.y);x2=Math.max(x2,r.x+r.width);y2=Math.max(y2,r.y+r.height);});return {cx:(x1+x2)/2,cy:(y1+y2)/2,h:y2-y1};})();
   const l=els[11]; const rp=document.createElementNS(NS,'path'); rp.setAttribute('id','g_ref'); rp.setAttribute('fill','none');
   rp.setAttribute('d',`M${l.getAttribute('x1')} ${l.getAttribute('y1')}L${l.getAttribute('x2')} ${l.getAttribute('y2')}`); g.appendChild(rp);
   els[1].setAttribute('id','g_top'); els[1].setAttribute('style','fill:none'); els[2].setAttribute('id','g_bot');
   const L={top:els[1].getTotalLength(), bot:els[2].getTotalLength(), ref:rp.getTotalLength()};
   function onPath(id,txt,size,fill){const t=document.createElementNS(NS,'text'); t.setAttribute('font-family',"'"+F.fam+"'"); t.setAttribute('font-weight',F.w); t.setAttribute('font-size',size.toFixed(1)); t.setAttribute('fill',fill);
     const tp=document.createElementNS(NS,'textPath'); tp.setAttribute('href','#'+id); tp.setAttribute('startOffset','50%'); tp.setAttribute('text-anchor','middle'); tp.textContent=txt; t.appendChild(tp); g.appendChild(t); return t;}
   function plain(txt,size){const t=document.createElementNS(NS,'text'); t.setAttribute('font-family',"'"+F.fam+"'"); t.setAttribute('font-weight',F.w); t.setAttribute('font-size',size.toFixed(1)); t.setAttribute('fill','#fff');
     t.setAttribute('x',wordBox.cx); t.setAttribute('y',wordBox.cy); t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','central'); t.textContent=txt; g.appendChild(t); return t;}
   function fit(make,max,cap,measure){let lo=10,hi=cap,el; for(let k=0;k<28;k++){const m=(lo+hi)/2; el=make(m); const v=measure(el); el.remove(); if(v>max) hi=m; else lo=m;} return lo;}
   const len=e=>e.getComputedTextLength(), wid=e=>e.getBBox().width;
   // English HOPE sizes (solved against his artwork earlier): word 867, top 220, bottom 237, ref 129
   // Ken, 7 Oct: "keep the heights of each word the same and uniform, and just adjust the
   // width to make it fit" -- verse lines and the tail reference are one height on every fish;
   // a long line is narrowed (textLength + spacingAndGlyphs), never made shorter.
   const H={top:220, bot:220, ref:129};
   const sWord=fit(s=>plain(v.word,s), 1900, 867, wid);
   // tall scripts (accents above, hooks below): keep the word's real letter height within the English word's
   { const c2=document.createElement('canvas').getContext('2d'); c2.font=F.w+' 100px "'+F.fam+'"'; const m2=c2.measureText(v.word);
     const gh=(m2.actualBoundingBoxAscent+m2.actualBoundingBoxDescent)/100; var sWordH=Math.min(sWord, wordBox.h*1.0/gh); }

   function squeeze(t,max){const n=t.getComputedTextLength(); if(n>max){const tp=t.firstChild; tp.setAttribute('textLength',max.toFixed(1)); tp.setAttribute('lengthAdjust','spacingAndGlyphs');} return n/max;}
   [3,4,5,6,7,8,9,10,12,13,14,15,16,17].forEach(i=>els[i].remove());
   { const w=plain(v.word,sWordH); w.setAttribute('dominant-baseline','alphabetic'); const c3=document.createElement('canvas').getContext('2d'); c3.font=F.w+' 100px "'+F.fam+'"'; const m3=c3.measureText(v.word);
     w.setAttribute('y',(wordBox.cy+(m3.actualBoundingBoxAscent-m3.actualBoundingBoxDescent)/2/100*sWordH).toFixed(1)); }
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
   // measure his lettering along its own line: turn a copy back level, take its width, size our font to match
   const sMF=(()=>{const P=els[20], L=P.getTotalLength(), pts=[]; for(let i=0;i<=4000;i++) pts.push(P.getPointAtLength(L*i/4000));
     let best=1e9; for(let d=0; d<180; d+=0.25){const r=d*Math.PI/180, c=Math.cos(r), sn=Math.sin(r); let lo=1e9,hi=-1e9,wl=1e9,wh=-1e9;
       for(const q of pts){const y=-q.x*sn+q.y*c, x=q.x*c+q.y*sn; if(y<lo)lo=y; if(y>hi)hi=y; if(x<wl)wl=x; if(x>wh)wh=x;}
       if(wh-wl>hi-lo && hi-lo<best) best=hi-lo;}
     return best/0.90;})(); /* "MannaFish" in MFHobo stands 0.90 of the font size; match his letter height */ /* "MannaFish" in MFHobo stands 0.90 of the font size, top of the h to the foot of the s */ const mfLen=(()=>{const t=rotText('MannaFish\u2122',sMF,0,0,0); const n=t.getComputedTextLength(); t.remove(); return n;})();
   // mirror point across the fish's middle line (half-way between where the two tail lines meet the body)
   const axis=(+up.getAttribute('y1') + +lo.getAttribute('y1'))/2;
   const rc={x:mfC.x, y:2*axis-mfC.y};
   // Ken, 7 Oct: centre it side to side on the tail -- find the white band's two edges straight across, take the middle
   { const r=aLo*Math.PI/180, nx=-Math.sin(r), ny=Math.cos(r), body=els[0], P=svg.createSVGPoint();
     const inside=(d)=>{P.x=rc.x+nx*d; P.y=rc.y+ny*d; return body.isPointInFill(P);};
     const s0=inside(0); let a1=0; while(a1<600 && inside(a1+1)===s0) a1++; let a2=0; while(a2<600 && inside(-(a2+1))===s0) a2++; 
     const mid=(a1-a2)/2; rc.x+=nx*mid; rc.y+=ny*mid; }
   const ABBR={'Deuteronomio':'Deut.','Eclesiastés':'Ecl.','Proverbios':'Prov.','Lamentaciones':'Lam.','Ezequiel':'Ez.','Romanos':'Rom.','Efesios':'Ef.','Hebreos':'Heb.','Salmos':'Sal.','Mateo':'Mat.','Lucas':'Luc.','Juan':'Jn.','2 Pedro':'2 Ped.','Génesis':'Gén.','Éxodo':'Éx.'};
   const avail=mfLen*0.95;
   // Ken, 7 Oct: add (RVR60), the same height as the reference; narrow the whole line to fit.
      const cx=document.createElement('canvas').getContext('2d'); cx.font=F.w+' 100px "'+F.fam+'"'; const mm=cx.measureText(v.ref+TAG); const mid=(mm.actualBoundingBoxAscent-mm.actualBoundingBoxDescent)/2/100;
   function refText(txt){const t=rotText(txt,sMF,rc.x,rc.y,aLo); t.setAttribute('font-family',"'"+F.fam+"'"); t.setAttribute('font-weight',F.w); t.setAttribute('dominant-baseline','alphabetic'); t.setAttribute('y',(rc.y+mid*sMF).toFixed(1)); /* letters stand 0.86 above the line and 0.04 below: this puts their middle on the band's middle */ t.textContent+=TAG; return t;}
   let refTxt=v.ref, t0=refText(refTxt), n0=t0.getComputedTextLength(); t0.remove();
   if(n0>avail) refTxt=v.refShort;
   const rt=refText(refTxt); const n1=rt.getComputedTextLength();
   if(n1>avail){ rt.setAttribute('textLength',avail.toFixed(1)); rt.setAttribute('lengthAdjust','spacingAndGlyphs'); }
   refTxt+=TAG;
   const qRef=n1/avail;
   const sTop=H.top,sBot=H.bot;
   return {sWord:Math.round(sWordH),topWidth:Math.round(100/Math.max(1,qTop))+'%',bottomWidth:Math.round(100/Math.max(1,qBot))+'%',refWidth:Math.round(100/Math.max(1,qRef))+'%',ref:refTxt,size:Math.round(sMF)};
  }, [v,F,TAG]);
  await page.screenshot({path:`${OUT}/${v.key}.png`});
  let xml=await page.evaluate(()=>document.getElementById('fish').outerHTML);
  xml=xml.replace('id="fish" style="width:1200px;height:600px;','style="width:100%;height:100%;position:absolute;top:0;left:0;');
  fs.writeFileSync(`${OUT}/${v.key}.svg`,xml);
  console.log(v.key, v.word, JSON.stringify(r));
 }
 // contact sheet
 const imgs=V.map(v=>`<img src="data:image/png;base64,${fs.readFileSync(OUT+'/'+v.key+'.png').toString('base64')}" style="width:390px;height:195px;margin:4px">`).join('');
 await page.setViewportSize({width:1600,height:1700}); await page.setContent(`<body style="margin:0;background:#222;width:1600px">${imgs}</body>`);
 await page.screenshot({path:__dirname+'/sheet-'+LG+'.png',fullPage:true}); await b.close();})();
