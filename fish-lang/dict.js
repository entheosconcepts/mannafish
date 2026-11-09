// An English dictionary for any page (Ken, 9 Nov: "some people do not know what naive means"): Webster's Unabridged (public domain, Project Gutenberg),
// loaded one small file at a time from /fish-lang/dict/<first two letters>.json (made by tools/dict/build.py).
//   MFdict.lookup('abideth').then(function(r){ r = {word, base, text} or null })   -- tries the word, then its likely base ("abide")
//   MFdict.words('love the Father')  -> ['love','the','Father']
(function(){
  var SH={};
  function norm(w){ try{ w=String(w).normalize('NFD').replace(/[̀-ͯ]/g,''); }catch(e){ w=String(w); } return w.toLowerCase().replace(/[^a-z]/g,''); }
  function shard(k){ return SH[k]||(SH[k]=fetch('/fish-lang/dict/'+k+'.json').then(function(r){ return r.ok?r.json():{}; }).catch(function(){ delete SH[k]; return {}; })); }
  // likely base forms of an inflected word, most likely first (the King James has many: abideth, hath, loveth, knoweth, wilt, shalt)
  function cands(w){ var o=[w]; function add(x){ if(x.length>=2&&o.indexOf(x)<0) o.push(x); }
    var R=[['eth',''],['eth','e'],['th',''],['est',''],['est','e'],['st',''],['ied','y'],['ies','y'],['ing',''],['ing','e'],['ed',''],['ed','e'],['es',''],['s',''],['d',''],['ly',''],['ness',''],['ers',''],['er',''],['er','e'],['ier','y'],['iest','y'],['ful','']];
    R.forEach(function(r){ if(w.length>r[0].length+2&&w.slice(-r[0].length)===r[0]){ var b=w.slice(0,-r[0].length)+r[1]; add(b); if(/(.)\1$/.test(b)) add(b.slice(0,-1)); } });
    var IRR={hath:'have',hast:'have',art:'be',wast:'be',wert:'be',wilt:'will',shalt:'shall',doth:'do',dost:'do',didst:'do',saith:'say',saidst:'say',knew:'know',known:'know',gave:'give',given:'give',went:'go',gone:'go',came:'come',took:'take',taken:'take',saw:'see',seen:'see',heard:'hear',made:'make',said:'say',spake:'speak',spoken:'speak',sat:'sit',rose:'rise',risen:'rise',wrote:'write',written:'write',bore:'bear',born:'bear',borne:'bear',begat:'beget',begotten:'beget',brethren:'brother',children:'child',men:'man',women:'woman',feet:'foot',thee:'thou',thy:'thou',thine:'thou',ye:'you',unto:'to'};
    if(IRR[w]) add(IRR[w]); return o; }
  function lookup(word){ var w=norm(word); if(w.length<2) return Promise.resolve(null); var c=cands(w);
    return (function next(i){ if(i>=c.length) return Promise.resolve(null); var k=c[i]; return shard(k.slice(0,2)).then(function(d){ if(d&&d[k]){ var t=d[k], m=/\bof ([A-Z][a-z]+)\.?(?:\s*\(old\))?\s*$/.exec(t);
          var sp=/^([A-Z][a-z]+)\.\s*[\[(]?(?:old|Archaic|Obs)[^\])]*[\])]?\.?$/.exec(t); if(sp&&t.length<40&&norm(sp[1])!==k) return lookup(sp[1]).then(function(r){ return r?{word:word,base:r.base,text:verbPart(r.text)}:{word:word,base:k,text:t}; });   // "Has. [Archaic.]"
          if(m&&t.length<90&&norm(m[1])!==k) return lookup(m[1]).then(function(r){ return r?{word:word,base:r.base,text:verbPart(r.text)}:{word:word,base:k,text:t}; });   // "p. p. of Beget": show Beget's meaning
          return {word:word,base:k,text:t}; } return next(i+1); }); })(0); }
  function verbPart(t){ var ps=String(t).split(' | '); for(var i=0;i<ps.length;i++) if(/^(\d\. )?To /.test(ps[i])) return ps[i]; return t; }   // for "saith" (present of Say): the verb's meaning, not the noun's
  function words(t){ return String(t||'').match(/[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ'’-]*/g)||[]; }
  window.MFdict={lookup:lookup,words:words,norm:norm};
})();
