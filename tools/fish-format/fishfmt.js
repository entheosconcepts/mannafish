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
  var RULE={word:{size:880,fill:0.80,min:560,sx:1,cx:1677,cy:975,stroke:27.8,room:40,tall:0.15},
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
  // Ken, 26 Oct: "Bless is touching the walls of the inside. With is too tall. Keep is off balance to the left, because the p
  // is not as close to the edge as the K is. Atone is too close to the edge at the bottom. Tend needs to come off the edge."
  // So the word is placed by rules, each measured from the letters (with their white outline) to the eye's inside edge:
  //  1. size: as big as the rule allows (short words: the standards' letter height; longer: fill the eye's width; too long: narrowed)
  //  2. tall letters: a word made mostly of tall letters (With: W, i, t, h) looks bigger, so it is set smaller, by up to
  //     word.tall (15%) when every letter is tall; half or fewer tall letters (Rest, Love, Hope) are not changed
  //  3. balance: as much room on the left as on the right, and above as below
  //  4. room: no letter closer than word.room to the inside edge; if one is, the word gets smaller until none is
  //     (a long word at its smallest letters is narrowed instead)
  var TALLAT=750;   // a letter reaching above this (Hobo units of 1000) is tall: capitals, b d f h i j k l t; not a c e m n o r s u v w x z
  function tallShare(font,word){ var n=0,t=0; Array.from(word).forEach(function(ch){ if(!/\S/.test(ch)||/[.,;:!?'"’‘“”…-]/.test(ch)) return; n++; if(font.charToGlyph(ch).getBoundingBox().y2>TALLAT) t++; }); return n?t/n:0; }
  // the outline of a path as points (each curve at quarter steps), in font units at the origin
  function points(cmds){ var out=[], px=0, py=0;
    cmds.forEach(function(c){
      if(c.type==='M'||c.type==='L'){ px=c.x; py=c.y; out.push([px,py]); }
      else if(c.type==='C'){ for(var i=1;i<=4;i++){ var t=i/4,u=1-t; out.push([u*u*u*px+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x, u*u*u*py+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y]); } px=c.x; py=c.y; }
      else if(c.type==='Q'){ for(var j=1;j<=4;j++){ var s=j/4,v=1-s; out.push([v*v*px+2*v*s*c.x1+s*s*c.x, v*v*py+2*v*s*c.y1+s*s*c.y]); } px=c.x; py=c.y; } });
    return out; }
  // the eye's inside edge: across each row, and down each column
  function rowAt(y){ var E=GEO.eye, i=Math.round((y-E.y0)/E.step); return E.rows[i]||null; }
  function colAt(x){ var E=GEO.eye, i=Math.round((x-E.x0)/E.step); return E.cols[i]||null; }
  function sides(P){ var L=1e9,R=1e9,T=1e9,B=1e9;
    P.forEach(function(p){ var r=rowAt(p[1]), c=colAt(p[0]);
      if(!r||!c){ L=R=T=B=-1e9; return; }
      L=Math.min(L,p[0]-r[0]); R=Math.min(R,r[1]-p[0]); T=Math.min(T,p[1]-c[0]); B=Math.min(B,c[1]-p[1]); });
    return {L:L,R:R,T:T,B:B}; }
  // the nearest any point comes to the inside edge (straight-line distance), counting only the points that are near it
  function nearest(P,limit){ var poly=GEO.eye.poly, n=poly.length, best=1e9, out=false;
    P.forEach(function(p){ if(out) return; var r=rowAt(p[1]), c=colAt(p[0]); if(!r||!c||p[0]<=r[0]||p[0]>=r[1]||p[1]<=c[0]||p[1]>=c[1]){ out=true; return; }
      if(Math.min(p[0]-r[0],r[1]-p[0],p[1]-c[0],c[1]-p[1])>limit) return;
      for(var i=0;i<n;i++){ var a=poly[i], b=poly[(i+1)%n], dx=b[0]-a[0], dy=b[1]-a[1], l2=dx*dx+dy*dy||1, t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2;
        t=t<0?0:t>1?1:t; var ex=a[0]+t*dx-p[0], ey=a[1]+t*dy-p[1], d=ex*ex+ey*ey; if(d<best*best) best=Math.sqrt(d); } });
    return out?-1:best; }
  function wordLayout(font,word,R){ R=R||RULE; var W=R.word, b=inkBox(font,word,100), iw=(b.x2-b.x1)/100;
    var share=tallShare(font,word), tf=share>0.5?1-(W.tall||0)*(share-0.5)/0.5:1;
    var fillW=W.fill*GEO.eyeW-W.stroke, size0=Math.min(W.size*tf,fillW/(iw*W.sx)), sx0=W.sx;
    if(size0<W.min){ size0=W.min; sx0=fillW/(iw*size0); }       // a long word keeps its letter height and is narrowed instead
    var raw=points(font.getPath(word,0,0,100,{kerning:true}).commands), mx=(b.x1+b.x2)/2, half=W.stroke/2;
    // the word at a given size, balanced left/right and top/bottom
    function place(size,sx){ var s=size/100, cap=font.charToGlyph('H').getBoundingBox().y2/font.unitsPerEm*size, base=W.cy+cap/2, dx=0, dy=0, P;
      function at(){ return raw.map(function(p){ return [W.cx+(p[0]-mx)*s*sx+dx, base+p[1]*s+dy]; }); }
      for(var k=0;k<4;k++){ P=at(); var S=sides(P); if(S.L<-1e8) break; dx+=(S.R-S.L)/2; P=at(); S=sides(P); dy+=(S.B-S.T)/2; }
      P=at(); return {size:size,sx:sx,dx:dx,dy:dy,base:base,room:nearest(P,(W.room||0)+200)-half}; }
    var f=1, best=place(size0,sx0);
    function scaled(f){ var sz=size0*f, sx=sx0; if(sz<W.min){ sx=sx0*sz/W.min; sz=W.min; } return place(sz,sx); }
    if(W.room&&best.room<W.room){ var lo=0.5, hi=1; for(var i=0;i<14;i++){ var m=(lo+hi)/2, t=scaled(m); if(t.room>=W.room){ lo=m; best=t; } else hi=m; } if(best.room<W.room) best=scaled(lo); }
    best.box=b; best.mx=mx; best.tall=share; best.tf=tf; return best; }
  function wordSvg(font,word,R){ R=R||RULE; var W=R.word, L=wordLayout(font,word,R), s=L.size/100;
    var d=pathD(font.getPath(word,0,0,L.size,{kerning:true}).commands,function(x,y){ return [W.cx+(x-L.mx*s)*L.sx+L.dx,L.base+y+L.dy]; });
    return '<path fill-rule="nonzero" fill="#fff" stroke="#fff" stroke-width="'+W.stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }

  // ── a verse line along its curve ──
  function lineLayout(font,text,which,R){ R=R||RULE; var V=R.verse, c=GEO[which], span=(V.end-V.start)*c.L, nat=advance(font,text,V.size);
    var k=nat*V.cond>span?span/nat:V.cond, used=nat*k, st=(V.mid*c.L)-used/2; st=Math.max(V.start*c.L,Math.min(V.end*c.L-used,st));
    return {k:k,used:used,start:st,nat:nat,cover:used/c.L}; }
  function lineSvg(font,text,which,R){ R=R||RULE; var V=R.verse, c=GEO[which], L=lineLayout(font,text,which,R), d='';
    glyphs(font,text,V.size).forEach(function(g){ var mid=L.start+(g.x+g.adv/2)*L.k, P=along(c,mid), co=Math.cos(P.ang), si=Math.sin(P.ang), ox=g.adv/2;
      d+=pathD(g.cmds,function(x,y){ var lx=(x-ox)*L.k; return [P.x+lx*co-y*si, P.y+lx*si+y*co]; }); });
    return '<path fill-rule="nonzero" fill="#000" stroke="#000" stroke-width="'+V.stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }

  // ── the reference on the lower tail, with (KJV) ──
  // Ken, 19 Oct: a short book name (6 letters or fewer) is always written out; a long one is shortened only when it doesn't fit
  function refText(font,ref,short,R){ R=R||RULE; var r=ref+' (KJV)', book=ref.replace(/\s*\d+[:.,]\d.*$/,'').replace(/^\d\s*/,'');
    if(short&&book.length>6&&advance(font,r,R.ref.size)*R.ref.cond>R.ref.avail) r=short+' (KJV)'; return r; }
  function refSvg(font,ref,short,R){ R=R||RULE; var F=R.ref, t=refText(font,ref,short,R), nat=advance(font,t,F.size), k=Math.min(F.cond,F.avail/nat);
    var g=GEO.ref, a=g.rot*Math.PI/180, co=Math.cos(a), si=Math.sin(a), half=nat*k/2;
    var d=pathD(font.getPath(t,0,0,F.size,{kerning:true}).commands,function(x,y){ var lx=x*k-half, X=g.x+lx, Y=g.y+y;   // laid out flat, then turned with the tail
      var dx=X-g.ox, dy=Y-g.oy; return [g.ox+dx*co-dy*si, g.oy+dx*si+dy*co]; });
    return '<path fill-rule="nonzero" fill="#000" stroke="#000" stroke-width="'+F.stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }

  // the whole fish, as one SVG (Ken's body and tail from GEO.base)
  function svg(font,f,R){ R=R||RULE;
    return '<svg viewBox="0 0 4000 2000" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;shape-rendering:geometricPrecision;fill-rule:evenodd;clip-rule:evenodd" role="img" aria-label="'+String(f.word).replace(/[&<>"]/g,'')+' fish">'+GEO.base+wordSvg(font,f.word,R)+lineSvg(font,f.top,'top',R)+lineSvg(font,f.bot,'bot',R)+refSvg(font,f.ref,f.refShort,R)+'</svg>'; }

  var API={setGeo:setGeo,RULE:RULE,svg:svg,wordLayout:wordLayout,lineLayout:lineLayout,refText:refText,inkBox:inkBox,advance:advance};
  if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.MFfmt=API;
})(this);
