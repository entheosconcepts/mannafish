// adds ru to every language table found by dump.js (tables.json), from strings.json; checks the shape against the English
const fs=require('fs'), path=require('path'), ROOT='/home/user/mannafish';
const T=JSON.parse(fs.readFileSync(process.argv[2])), R=JSON.parse(fs.readFileSync(process.argv[3])), DRY=process.argv[4]==='dry';
const ev=(s)=>Function('"use strict";return ('+s+')')();
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function shape(a,b){ if(Array.isArray(a)) return Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>shape(x,b[i]));
  if(a&&typeof a==='object') return b&&typeof b==='object'&&!Array.isArray(b)&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>k in b&&shape(a[k],b[k]));
  if(typeof a==='string'){ const ph=(s)=>(s.match(/\{\w+\}/g)||[]).sort().join(); return typeof b==='string'&&ph(a)===ph(b)&&(a.startsWith('*')===b.startsWith('*'))&&(a.startsWith('#')===b.startsWith('#')); }
  return typeof a===typeof b; }
const edits={}, report=[];
T.forEach((t,i)=>{ if(t.hasru) { report.push([i,'has ru']); return; }
  const en=t.en!=null?ev(t.en):undefined, ar=ev(t.ar), es=t.es!=null?ev(t.es):undefined; let ru, why;
  const src=fs.readFileSync(path.join(ROOT,t.file),'utf8'), before=src.slice(Math.max(0,t.pos-40),t.pos);
  if(typeof en==='string'&&/^[a-z]{2,3}-[A-Z]{2}$/.test(en)) { ru=R.LOCALE; why='locale'; }
  else if(Array.isArray(en)&&en.length===1&&en[0]==='en') { ru=R.LPRE; why='lpre'; }
  else if(en==='en') { ru=R.VOICE_LP; why='voice lang'; }
  else if(t.keys.includes('zh')&&ar==='Cairo') { ru=R.FONT; why='font'; }
  else if(/SITENOTE=\s*$/.test(before)) { ru=R.NOEN.find(x=>x[0]==='SITENOTE')[1]; why='sitenote'; }
  else if(es==='rv1909') { ru='synodal'; why='bible code'; }
  else if(same(es,['Palabra','Versículo'])) { ru=['Слово','Стих']; why='labels'; }
  else if(en&&typeof en==='object'&&!Array.isArray(en)&&en.REST) { ru=R.FISH24; why='fish24'; }
  else if(en&&typeof en==='object'&&en.en==='English'&&typeof en.es==='string') { ru=R.NAMES_RU; why='LNAME outer'; }
  else if(t.parent&&R.NAME_IN[t.parent]&&/^(English|Inglés|Ingles|英语|अंग्रेज़ी|Αγγλικά|Englisch|영어|אנגלית|الإنجليزية)$/.test(en||ar)) { ru=R.NAME_IN[t.parent]; why='LNAME '+t.parent; }
  else if(ar==='Modern Standard Arabic') { ru='Russian'; why='names in English'; }
  else if(ar==='العربية'||ar==='Arabic'||/^العربية · /.test(ar)) { ru=ar==='Arabic'?'Russian':ar==='العربية'?R.NAME_RU:R.NAME_RU+' · Russian'; why='lang name'; }
  else if(es==='Spanish'&&ar==='Arabic'||t.parent==='en'&&ar==='Arabic') { ru='Russian'; why='names in English'; }
  else if(en==='Inglés'||t.parent==='es'&&ar==='Árabe') { ru='Ruso'; why='names in Spanish'; }
  else if(en&&typeof en==='object'&&!Array.isArray(en)) {
    const k=en.b&&en.b[0]==='Today’s devotional'?'devo':en.b&&en.b[0]==='The vision'?'vision':en.k_welcome?'pts':en.k_cast?'cast':en.q==='Quick'?'len':en.today==='today'?'plan':en.btn&&en.s?'tour':null;
    if(k){ ru=R.OBJ[k]; why='obj '+k; } }
  else if(Array.isArray(en)&&en[0]==='This fishing trip is sponsored by {s}') { ru=R.OBJ.pond; why='obj pond'; }
  if(ru===undefined){ const m=R.BY_EN.find(x=>same(x[0],en)); if(m){ ru=m[1]; why='by en'; } }
  if(ru===undefined){ report.push([i,'MISSING',t.file,t.line,JSON.stringify(en||es||ar).slice(0,80)]); return; }
  if(en!==undefined&&!/LNAME|lang name|names in|locale|lpre|voice|font/.test(why)&&!shape(en,ru)) { report.push([i,'SHAPE',t.file,t.line,why]); return; }
  const key=t.arKeyQuoted?'"ru"':'ru', sep=/\n\s*$/.test(src.slice(t.arEnd-40,t.arEnd))?',\n':',';
  (edits[t.file]=edits[t.file]||[]).push([t.arEnd, sep+key+':'+JSON.stringify(ru)]); report.push([i,why]);
});
for(const f in edits){ let s=fs.readFileSync(path.join(ROOT,f),'utf8'); edits[f].sort((a,b)=>b[0]-a[0]).forEach(([p,txt])=>{ s=s.slice(0,p)+txt+s.slice(p); }); if(!DRY) fs.writeFileSync(path.join(ROOT,f),s); }
console.log(report.filter(r=>/MISSING|SHAPE/.test(r[1])).map(r=>r.join(' ')).join('\n')||'all matched');
console.log(report.length,'tables;',Object.values(edits).reduce((a,b)=>a+b.length,0),'edits', DRY?'(dry run)':'');
