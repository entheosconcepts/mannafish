const ts=require('/opt/node22/lib/node_modules/typescript'), fs=require('fs'), path=require('path');
const ROOT='/home/user/mannafish';
function scripts(file){ const t=fs.readFileSync(file,'utf8');
  if(!/\.html$/.test(file)) return [{off:0,code:t}];
  const out=[]; const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; while((m=re.exec(t))) out.push({off:m.index+m[0].indexOf('>')+1,code:m[1]}); return out; }
function key(p){ const n=p.name; if(!n) return null; if(ts.isIdentifier(n)||ts.isStringLiteral(n)) return n.text; return null; }
const res=[];
for(const file of process.argv.slice(2)){ const full=fs.readFileSync(file,'utf8'); for(const s of scripts(file)){ const sf=ts.createSourceFile('x.js',s.code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  (function walk(n){ if(ts.isObjectLiteralExpression(n)){ const ks=n.properties.map(key); if(ks.includes('ar')){ const ip=(k)=>n.properties[ks.indexOf(k)];
      const ar=ip('ar'), last=n.properties[n.properties.length-1];
      res.push({file:path.relative(ROOT,file),pos:s.off+n.getStart(),line:full.slice(0,s.off+n.getStart()).split('\n').length,keys:ks,
        en:ip('en')?ip('en').initializer.getText():null, es:ip('es')?ip('es').initializer.getText():null, ar:ar.initializer.getText(), arEnd:s.off+ar.getEnd(), lastEnd:s.off+last.getEnd(),
        arKeyQuoted:ts.isStringLiteral(ar.name), hasru:ks.includes('ru'), parent:(ts.isPropertyAssignment(n.parent)&&n.parent.name&&(ts.isIdentifier(n.parent.name)||ts.isStringLiteral(n.parent.name)))?n.parent.name.text:null}); } }
    ts.forEachChild(n,walk); })(sf); } }
fs.writeFileSync(process.env.OUT,JSON.stringify(res,null,1));
