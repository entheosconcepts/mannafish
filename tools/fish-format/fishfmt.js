// MannaFish format builder (Ken, 26 Oct: "all fish like the other 24 in Hobo, positioned and proper size ... printable").
// Draws a fish from {word, top, bot, ref} with Ken's body and MannaFish(TM) tail, and every letter as an outline
// (no font needed to show it or print it). The rule (sizes and places) comes from the standard fish Ken picks of his 24.
// Works in the browser (window.MFfmt) and in node (module.exports). Needs an opentype.js Font of Hobo.
(function(root){
  // Ken's fish, measured: the eye (the black middle), the two verse curves (sampled), the tail reference spot
  var GEO=null;
  function setGeo(g){ GEO=g; }
  // the rule: word.size (largest letters, short words), word.fill (share of the eye's width a long word fills),
  // word.min (smallest letters; a longer word is narrowed instead), word.sx (Ken's usual widening), word.cx/cy (centre),
  // word.stroke (the white outline that makes his letters bold); verse.size, verse.cond (his usual narrowing),
  // verse.start/end (how far along each curve the line may run), verse.mid (its centre), verse.stroke; ref.*
  var RULE={word:{size:880,fill:0.80,min:560,sx:1,cx:1677,cy:975,stroke:27.8},
    verse:{size:222,cond:0.95,start:0.027,end:0.978,mid:0.5,stroke:3},
    ref:{size:192,avail:980,stroke:7,cond:1}};

  function f1(n){ return Math.round(n*10)/10; }
  // an opentype path's commands, each point moved by fn(x,y) -> [x,y], as SVG path data
  function pathD(cmds,fn){ var s='';
    cmds.forEach(function(c){ var p;
      if(c.type==='M'||c.type==='L'){ p=fn(c.x,c.y); s+=c.type+f1(p[0])+' '+f1(p[1]); }
      else if(c.type==='C'){ var a=fn(c.x1,c.y1),b=fn(c.x2,c.y2); p=fn(c.x,c.y); s+='C'+f1(a[0])+' '+f1(a[1])+' '+f1(b[0])+' '+f1(b[1])+' '+f1(p[0])+' '+f1(p[1]); }
      else if(c.type==='Q'){ var q=fn(c.x1,c.y1); p=fn(c.x,c.y); s+='Q'+f1(q[0])+' '+f1(q[1])+' '+f1(p[0])+' '+f1(p[1]); }
      else if(c.type==='Z') s+='Z'; });
    return s; }
  // each glyph of a run: its outline at the origin, where it starts and how wide it is
  function glyphs(font,text,size){ var out=[];
    font.forEachGlyph(text,0,0,size,{kerning:true},function(g,x,y,fs){ out.push({x:x,adv:g.advanceWidth*fs/font.unitsPerEm,cmds:g.getPath(0,0,fs).commands}); });
    return out; }
  function advance(font,text,size){ return font.getAdvanceWidth(text,size,{kerning:true}); }
  function inkBox(font,text,size){ var b=font.getPath(text,0,0,size,{kerning:true}).getBoundingBox(); return b; }
  // a point and direction along a sampled curve, at length s
  function along(c,s){ var n=c.pts.length-1, t=Math.max(0,Math.min(n-1e-6,s/c.L*n)), i=Math.floor(t), f=t-i, a=c.pts[i], b=c.pts[Math.min(n,i+1)];
    var j=Math.max(0,Math.min(n-1,i)), p=c.pts[j], q=c.pts[j+1];
    return {x:a[0]+(b[0]-a[0])*f, y:a[1]+(b[1]-a[1])*f, ang:Math.atan2(q[1]-p[1],q[0]-p[0])}; }

  // ── the word in the middle ──
  function wordLayout(font,word,R){ R=R||RULE; var W=R.word, b=inkBox(font,word,100), iw=(b.x2-b.x1)/100, ih=(b.y2-b.y1)/100;
    var room=W.fill*GEO.eyeW-W.stroke, size=Math.min(W.size,room/(iw*W.sx)), sx=W.sx;
    if(size<W.min){ size=W.min; sx=room/(iw*size); }       // a long word keeps its letter height and is narrowed instead
    return {size:size,sx:sx,box:b}; }
  function wordSvg(font,word,R){ R=R||RULE; var W=R.word, L=wordLayout(font,word,R), s=L.size/100, b=L.box;
    var cap=font.charToGlyph('H').getBoundingBox().y2/font.unitsPerEm*L.size;   // centre on the capital height, so descenders hang below
    var mx=(b.x1+b.x2)/2*s, base=W.cy+cap/2;
    var d=pathD(font.getPath(word,0,0,L.size,{kerning:true}).commands,function(x,y){ return [W.cx+(x-mx)*L.sx,base+y]; });
    return '<path fill="#fff" stroke="#fff" stroke-width="'+W.stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }

  // ── a verse line along its curve ──
  function lineLayout(font,text,which,R){ R=R||RULE; var V=R.verse, c=GEO[which], span=(V.end-V.start)*c.L, nat=advance(font,text,V.size);
    var k=nat*V.cond>span?span/nat:V.cond, used=nat*k, st=(V.mid*c.L)-used/2; st=Math.max(V.start*c.L,Math.min(V.end*c.L-used,st));
    return {k:k,used:used,start:st,nat:nat,cover:used/c.L}; }
  function lineSvg(font,text,which,R){ R=R||RULE; var V=R.verse, c=GEO[which], L=lineLayout(font,text,which,R), d='';
    glyphs(font,text,V.size).forEach(function(g){ var mid=L.start+(g.x+g.adv/2)*L.k, P=along(c,mid), co=Math.cos(P.ang), si=Math.sin(P.ang), ox=g.adv/2;
      d+=pathD(g.cmds,function(x,y){ var lx=(x-ox)*L.k; return [P.x+lx*co-y*si, P.y+lx*si+y*co]; }); });
    return '<path fill="#000" stroke="#000" stroke-width="'+V.stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }

  // ── the reference on the lower tail, with (KJV) ──
  // Ken, 19 Oct: a short book name (6 letters or fewer) is always written out; a long one is shortened only when it doesn't fit
  function refText(font,ref,short,R){ R=R||RULE; var r=ref+' (KJV)', book=ref.replace(/\s*\d+[:.,]\d.*$/,'').replace(/^\d\s*/,'');
    if(short&&book.length>6&&advance(font,r,R.ref.size)*R.ref.cond>R.ref.avail) r=short+' (KJV)'; return r; }
  function refSvg(font,ref,short,R){ R=R||RULE; var F=R.ref, t=refText(font,ref,short,R), nat=advance(font,t,F.size), k=Math.min(F.cond,F.avail/nat);
    var g=GEO.ref, a=g.rot*Math.PI/180, co=Math.cos(a), si=Math.sin(a), half=nat*k/2;
    var d=pathD(font.getPath(t,0,0,F.size,{kerning:true}).commands,function(x,y){ var lx=x*k-half, X=g.x+lx, Y=g.y+y;   // laid out flat, then turned with the tail
      var dx=X-g.ox, dy=Y-g.oy; return [g.ox+dx*co-dy*si, g.oy+dx*si+dy*co]; });
    return '<path fill="#000" stroke="#000" stroke-width="'+F.stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }

  // the whole fish, as one SVG (Ken's body and tail from GEO.base)
  function svg(font,f,R){ R=R||RULE;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4000 2000">'+GEO.base+wordSvg(font,f.word,R)+lineSvg(font,f.top,'top',R)+lineSvg(font,f.bot,'bot',R)+refSvg(font,f.ref,f.refShort,R)+'</svg>'; }

  var API={setGeo:setGeo,RULE:RULE,svg:svg,wordLayout:wordLayout,lineLayout:lineLayout,refText:refText,inkBox:inkBox,advance:advance};
  if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.MFfmt=API;
})(this);
