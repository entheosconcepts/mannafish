// node build-lang.js [es,de,...]  -- draws the 24 main fish in the other languages by the format rule, into fish/<l>/<KEY>.svg,
// and the same fish as live text for the edit sheet, edit/lang/<l>.json (then: python3 tools/fish/sync.py, which copies /fish/
// into the pages that keep their own copy). A fish Ken adjusted on the edit sheet: put its numbers in lang-lines.json as
// "edit": {"wl": {"s":1.05,"w":1,"h":1,"x":0,"y":-20}, "tl": {"size":200,"slide":0,"w":0.95}} (what the sheet's email lists).
// The words and lines are lang-lines.json (from each fish's last picture). Spanish, Tagalog and German are in Ken's Hobo;
// the others in their own face (fonts/: the site's own fish-lang/<l>.woff2, saved as TTF), shaped with HarfBuzz.
const fs=require('fs'), path=require('path'), ot=require(process.env.OPENTYPE||'opentype.js'), F=require('./fishfmt.js'), {derive}=require('./derive.js'), HB=require('./hbengine.js');
const ROOT=path.join(__dirname,'..','..');
F.setGeo(JSON.parse(fs.readFileSync(path.join(__dirname,'geo.json'))));
const PICKS=(process.env.PICKS||'REST,GROW,LOVE,TRUST,LISTEN,LAUGH,BELIEVE,BREATHE,REMEMBER').split(',');
const R=derive(JSON.parse(fs.readFileSync(path.join(__dirname,'ken24.json'))),PICKS,F.RULE);
const LINES=JSON.parse(fs.readFileSync(path.join(__dirname,'lang-lines.json')));
// each language's face, and the letters whose height is matched to Hobo's capital H
// Ken's bold white outline on the word, and the thin black one on the verse, suit Hobo; letters with many close strokes
// (Chinese, Korean, Hindi) fill in under them, so those get thinner outlines, and their verse letters a little smaller
// (wstroke: the word's outline; vstroke / rstroke: the verse's and reference's; vsize: verse letter height against Hobo's)
const FACE={el:{f:'el.ttf',cap:'ΑΗΙΤΠ',fam:'Ubuntu',w:700}, zh:{f:'zh.ttf',cap:'安息爱',wstroke:8,vstroke:0,rstroke:2,vsize:0.85,fam:'ZCOOL KuaiLe'},
  ko:{f:'ko.ttf',cap:'가나다라',wstroke:14,vstroke:1,rstroke:2,vsize:0.9,fam:'Jua'}, he:{f:'he.ttf',cap:'הבמנח',rtl:true,vsize:0.92,fam:'Fredoka',w:700},
  ar:{f:'ar.ttf',cap:'اكل',rtl:true,fam:'Cairo',w:800}, hi:{f:'hi.ttf',cap:'कमरन',wstroke:12,vstroke:0,rstroke:2,vsize:0.92,fam:'Baloo 2',w:800}};
const BASE=fs.readFileSync(path.join(ROOT,'edit','new','base.svg'),'utf8');
function ruleFor(fc){ const r=JSON.parse(JSON.stringify(R)); if(!fc) return r;
  if(fc.wstroke!=null) r.word.stroke=fc.wstroke; if(fc.vstroke!=null) r.verse.stroke=fc.vstroke; if(fc.rstroke!=null) r.ref.stroke=fc.rstroke;
  if(fc.vsize) r.verse.size*=fc.vsize; return r; }
(async()=>{
  const want=(process.argv[2]||Object.keys(LINES).join(',')).split(',');
  const hobo=F.otEngine(ot.parse(fs.readFileSync(process.env.HOBO).buffer.slice(0)));
  for(const l of want){ const fc=FACE[l];
    const E=fc?await HB.load(path.join(__dirname,'fonts',fc.f),{rtl:!!fc.rtl,capChars:fc.cap,name:l}):hobo;
    const RL=ruleFor(fc), TX={};
    for(const [key,f0] of Object.entries(LINES[l])){ const f=Object.assign({tag:''},f0); let P=F.layout(E,f,RL); if(f.edit) P=F.applyRel(E,f,P,f.edit);
      fs.writeFileSync(path.join(ROOT,'fish',l,key+'.svg'),F.draw(E,f,P,RL));
      TX[key]=F.textSvg(E,f,P,RL,BASE,fc?fc.fam:'MFHobo',fc?fc.w:'',!!(fc&&fc.rtl)); }
    fs.mkdirSync(path.join(ROOT,'edit','lang'),{recursive:true}); fs.writeFileSync(path.join(ROOT,'edit','lang',l+'.json'),JSON.stringify(TX));
    console.log(l,Object.keys(LINES[l]).length,'fish','capH',E.capH.toFixed(3)); }
})();
