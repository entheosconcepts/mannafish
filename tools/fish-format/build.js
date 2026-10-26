// node build.js  -- draws the Go Fish net fish (fish/net.json: the 128 year fish and Tend) by the format rule and saves fish/<id>.svg
// Needs opentype.js (OPENTYPE=path to opentype.js) and Hobo as an OTF (HOBO=path; from fish-lang/hobo.woff2 with fontTools, flavor=None).
// The standard fish are the nine Ken's builder page recommended (Ken, 26 Oct: "go ahead and update all 128 with this new rule").
const fs=require('fs'), path=require('path'), ot=require(process.env.OPENTYPE||'opentype.js'), F=require('./fishfmt.js'), {derive}=require('./derive.js');
const ROOT=path.join(__dirname,'..','..'), font=ot.parse(fs.readFileSync(process.env.HOBO).buffer.slice(0));
F.setGeo(JSON.parse(fs.readFileSync(path.join(__dirname,'geo.json'))));
const PICKS=(process.env.PICKS||'REST,GROW,LOVE,TRUST,LISTEN,LAUGH,BELIEVE,BREATHE,REMEMBER').split(',');
const R=derive(JSON.parse(fs.readFileSync(path.join(__dirname,'ken24.json'))),PICKS,F.RULE);
// each fish's own lines, as they were on its last picture (so edits made on the edit sheet are kept)
const lines=JSON.parse(fs.readFileSync(path.join(__dirname,'net-lines.json')));
for(const f of lines){ fs.writeFileSync(path.join(ROOT,'fish',f.k+'.svg'),F.svg(font,f,R)); }
console.log(lines.length,'fish drawn', JSON.stringify(R.word));
