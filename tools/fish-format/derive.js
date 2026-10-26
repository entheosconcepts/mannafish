// the rule from the standard fish Ken picks (same code goes in the page)
function med(a){ a=a.slice().sort((x,y)=>x-y); const n=a.length; return n?(n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2):NaN; }
function derive(K,picks,base){ const R=JSON.parse(JSON.stringify(base)), P=picks.map(k=>K[k]).filter(Boolean); if(!P.length) return R;
  const short=P.filter(v=>v.n<=4), long=P.filter(v=>v.n>=5), longest=P.slice().sort((a,b)=>b.n-a.n)[0];
  if(short.length) R.word.size=Math.round(med(short.map(v=>v.size)));
  if(long.length) R.word.fill=+med(long.map(v=>v.fill)).toFixed(3);
  R.word.min=longest.n>=7?longest.size:Math.min(R.word.min,longest.size);
  R.word.sx=+med(P.map(v=>v.sx)).toFixed(3); R.word.cx=Math.round(med(P.map(v=>v.cx))); R.word.cy=Math.round(med(P.map(v=>v.cy)));
  R.word.room=Math.round(med(P.map(v=>v.clr.min)));
  const full=[]; P.forEach(v=>['top','bot'].forEach(t=>{ if(v[t].cover>=0.9) full.push(v[t]); }));
  if(full.length){ R.verse.start=+med(full.map(l=>l.start)).toFixed(3); R.verse.end=+med(full.map(l=>l.end)).toFixed(3); }
  return R; }
if(typeof module!=='undefined') module.exports={derive,med};
