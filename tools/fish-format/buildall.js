const ot=require('./nm/package/dist/opentype.js'),fs=require('fs'),F=require('./fishfmt.js'),{derive}=require('./derive.js'),{chromium}=require('playwright');
const font=ot.parse(fs.readFileSync('hobo.ttf').buffer.slice(0));F.setGeo(JSON.parse(fs.readFileSync('geo.json')));
F.RULE.verse.size=222;F.RULE.verse.cond=0.95;
const K=JSON.parse(fs.readFileSync('ken24.json')),L=JSON.parse(fs.readFileSync('lines24.json'));
const picks=(process.env.PICKS||'REST,GROW,LOVE,TRUST,LISTEN,LAUGH,BELIEVE,BREATHE,REMEMBER').split(',');
const R=derive(K,picks,F.RULE);console.log(JSON.stringify(R));
const Y=JSON.parse(fs.readFileSync('/home/user/mannafish/tools/year-fish/lines.json')).en.fish;
const out=process.argv[2]||'b';fs.mkdirSync(out,{recursive:true});
const jobs=[];for(const k in L) jobs.push(['K_'+k,{word:L[k].word,top:L[k].top,bot:L[k].bot,ref:L[k].ref}]);
for(const y of Y) jobs.push(['Y_'+y.key,{word:y.word,top:y.top,bot:y.bottom,ref:y.ref,refShort:y.refShort}]);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:2000,height:1000}});
for(const [id,f] of jobs){const s=F.svg(font,f,R);fs.writeFileSync(`${out}/${id}.svg`,s);
 await p.setContent(`<style>body{margin:0;background:#000}svg{width:2000px;height:1000px;display:block}</style>${s}`);await p.screenshot({path:`${out}/${id}.png`});}
await b.close();console.log(jobs.length,'built');})();
