// MannaFish format builder (Ken, 26 Oct: "all fish like the other 24 in Hobo, positioned and proper size ... printable").
// Draws a fish from {word, top, bot, ref} with Ken's body and MannaFish(TM) tail, and every letter as an outline
// (no font needed to show it or print it). The rule (sizes and places) comes from the standard fish Ken picks of his 24.
// Works in the browser (window.MFfmt) and in node (module.exports).
//
// The letters come from a text engine: MFfmt.otEngine(font) for an opentype.js font (Hobo: English, Spanish, Tagalog,
// German), or tools/fish-format/hbengine.js (HarfBuzz) for the languages whose letters join or reorder (Arabic, Hindi) and
// for every other script. An engine gives: run(text,size) -> {glyphs:[{x,adv,cmds}],adv} (cmds: opentype-style path
// commands at the glyph's origin, y down, in visual order), capH (the script's letter height per unit of size: Hobo's
// capital H), and tall(ch) (true for a tall Latin letter; only Hobo has the tall-letter rule).
(function(root){
  // Ken's fish, measured: the eye (the black middle), the two verse curves (sampled), the tail reference spot
  var GEO=null;
  function setGeo(g){ GEO=g; }
  // the rule: word.size (largest letters, short words), word.fill (share of the eye's width a long word fills),
  // word.min (smallest letters; a longer word is narrowed instead), word.sx (Ken's usual widening), word.cx/cy (centre),
  // word.stroke (the white outline that makes his letters bold); verse.size, verse.cond (his usual narrowing),
  // verse.start/end (how far along each curve the line may run), verse.mid (its centre), verse.stroke; ref.*
  // band: where letters may reach, from the line they sit on (minus a margin): the white ring reaches about 218 out and
  // 60 in from each verse curve, the tail about 218 and 84 from the reference's line. Hobo stays well inside.
  var RULE={word:{size:880,fill:0.80,min:560,sx:1,cx:1677,cy:975,stroke:27.8,room:40,tall:0.15},
    verse:{size:222,cond:0.95,start:0.027,end:0.978,mid:0.5,stroke:3,up:200,down:42},
    ref:{size:192,avail:980,stroke:7,cond:1,up:200,down:66}};
  var HOBOCAP=832.3333333333333/1000;   // Hobo's capital H, per unit of size: every script's letters are matched to this height

  // path commands, each point moved by fn(x,y) -> [x,y], as compact SVG path data: whole units (a fish is 4,000 wide, so a
  // unit is a few hundredths of a millimetre on a decal), and each point written from the last one (rounded first, so nothing drifts)
  function nums(a){ var s=''; a.forEach(function(n,i){ s+=(i&&n>=0?' ':'')+n; }); return s; }
  function pathD(cmds,fn){ var s='', cx=0, cy=0, sx=0, sy=0;
    function r(p){ return [Math.round(p[0]),Math.round(p[1])]; }
    cmds.forEach(function(c){ var p, a, b;
      if(c.type==='M'){ p=r(fn(c.x,c.y)); s+='M'+nums(p); cx=sx=p[0]; cy=sy=p[1]; }
      else if(c.type==='L'){ p=r(fn(c.x,c.y)); if(p[0]!==cx||p[1]!==cy) s+='l'+nums([p[0]-cx,p[1]-cy]); cx=p[0]; cy=p[1]; }
      else if(c.type==='C'){ a=r(fn(c.x1,c.y1)); b=r(fn(c.x2,c.y2)); p=r(fn(c.x,c.y)); s+='c'+nums([a[0]-cx,a[1]-cy,b[0]-cx,b[1]-cy,p[0]-cx,p[1]-cy]); cx=p[0]; cy=p[1]; }
      else if(c.type==='Q'){ a=r(fn(c.x1,c.y1)); p=r(fn(c.x,c.y)); s+='q'+nums([a[0]-cx,a[1]-cy,p[0]-cx,p[1]-cy]); cx=p[0]; cy=p[1]; }
      else if(c.type==='Z'){ s+='z'; cx=sx; cy=sy; } });
    return s; }
  // the outline of a path as points (each curve at quarter steps)
  function points(cmds){ var out=[], px=0, py=0;
    cmds.forEach(function(c){
      if(c.type==='M'||c.type==='L'){ px=c.x; py=c.y; out.push([px,py]); }
      else if(c.type==='C'){ for(var i=1;i<=4;i++){ var t=i/4,u=1-t; out.push([u*u*u*px+3*u*u*t*c.x1+3*u*t*t*c.x2+t*t*t*c.x, u*u*u*py+3*u*u*t*c.y1+3*u*t*t*c.y2+t*t*t*c.y]); } px=c.x; py=c.y; }
      else if(c.type==='Q'){ for(var j=1;j<=4;j++){ var s=j/4,v=1-s; out.push([v*v*px+2*v*s*c.x1+s*s*c.x, v*v*py+2*v*s*c.y1+s*s*c.y]); } px=c.x; py=c.y; } });
    return out; }
  function shift(cmds,dx){ return cmds.map(function(c){ var o={type:c.type}; ['x','x1','x2'].forEach(function(k){ if(c[k]!=null) o[k]=c[k]+dx; }); ['y','y1','y2'].forEach(function(k){ if(c[k]!=null) o[k]=c[k]; }); return o; }); }
  // a whole run as one list of commands, and its ink box
  function runCmds(E,text,size){ var r=E.run(text,size), out=[]; r.glyphs.forEach(function(g){ out=out.concat(shift(g.cmds,g.x)); }); return {cmds:out,adv:r.adv,glyphs:r.glyphs}; }
  function box(cmds){ var b={x1:1e9,y1:1e9,x2:-1e9,y2:-1e9}; points(cmds).forEach(function(p){ if(p[0]<b.x1) b.x1=p[0]; if(p[0]>b.x2) b.x2=p[0]; if(p[1]<b.y1) b.y1=p[1]; if(p[1]>b.y2) b.y2=p[1]; });
    if(b.x1>b.x2) b={x1:0,y1:0,x2:0,y2:0}; return b; }

  // opentype.js as an engine (Hobo)
  function otEngine(font,opt){ opt=opt||{}; var upm=font.unitsPerEm;
    return {name:opt.name||'hobo', hobo:opt.hobo!==false,
      capH:opt.capH||font.charToGlyph('H').getBoundingBox().y2/upm,
      run:function(text,size){ var gl=[]; font.forEachGlyph(text,0,0,size,{kerning:true},function(g,x){ gl.push({x:x,adv:g.advanceWidth*size/upm,cmds:g.getPath(0,0,size).commands}); });
        return {glyphs:gl,adv:font.getAdvanceWidth(text,size,{kerning:true})}; },
      tall:function(ch){ return font.charToGlyph(ch).getBoundingBox().y2>750*upm/1000; }}; }
  function eng(x){ return x&&typeof x.run==='function'?x:otEngine(x); }   // a plain opentype font still works

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
  //     word.tall (15%) when every letter is tall; half or fewer tall letters (Rest, Love, Hope) are not changed (Hobo only)
  //  3. balance: as much room on the left as on the right, and above as below
  //  4. room: no letter closer than word.room to the inside edge; if one is, the word gets smaller until none is
  //     (a long word at its smallest letters is narrowed instead)
  function tallShare(E,word){ if(!E.hobo||!E.tall) return 0; var n=0,t=0;
    Array.from(word).forEach(function(ch){ if(!/\S/.test(ch)||/[.,;:!?'"’‘“”…-]/.test(ch)) return; n++; if(E.tall(ch)) t++; }); return n?t/n:0; }
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
  function wordLayout(E,word,R){ E=eng(E); R=R||RULE; var W=R.word, run=runCmds(E,word,100), b=box(run.cmds), iw=(b.x2-b.x1)/100;
    var k=HOBOCAP/E.capH;   // another script's letters are matched to Hobo's letter height
    var share=tallShare(E,word), tf=share>0.5?1-(W.tall||0)*(share-0.5)/0.5:1, min=W.min*k;
    var fillW=W.fill*GEO.eyeW-W.stroke, size0=Math.min(W.size*k*tf,fillW/(iw*W.sx)), sx0=W.sx;
    if(size0<min){ size0=min; sx0=fillW/(iw*size0); }       // a long word keeps its letter height and is narrowed instead
    var raw=points(run.cmds), mx=(b.x1+b.x2)/2, half=W.stroke/2;
    // the word at a given size, balanced left/right and top/bottom
    function place(size,sx){ var s=size/100, base=W.cy+E.capH*size/2, dx=0, dy=0, P;
      function at(){ return raw.map(function(p){ return [W.cx+(p[0]-mx)*s*sx+dx, base+p[1]*s+dy]; }); }
      for(var i=0;i<10;i++){ P=at(); var S=sides(P); if(S.L<-1e8) break; dx+=(S.R-S.L)/2; P=at(); S=sides(P); dy+=(S.B-S.T)/2; if(Math.abs(S.B-S.T)<1&&Math.abs(S.R-S.L)<1) break; }
      P=at(); var S2=sides(P); if(S2.L>-1e8) dx+=(S2.R-S2.L)/2;   // end level left to right
      P=at(); return {size:size,sx:sx,hh:1,ox:W.cx-mx*s*sx+dx,oy:base+dy,room:nearest(P,(W.room||0)+200)-half}; }
    var best=place(size0,sx0);
    function scaled(f){ var sz=size0*f, sx=sx0; if(sz<min){ sx=sx0*sz/min; sz=min; } return place(sz,sx); }
    if(W.room&&best.room<W.room){ var lo=0.5, hi=1; for(var i=0;i<14;i++){ var m=(lo+hi)/2, t=scaled(m); if(t.room>=W.room){ lo=m; best=t; } else hi=m; } if(best.room<W.room) best=scaled(lo); }
    best.tall=share; best.tf=tf; return best; }

  // ── a verse line along its curve ──
  // the same letter height as Hobo; a script whose letters reach further above or below the line than the white band allows
  // (Arabic, Hindi) is set a little smaller and lifted, so every letter stays on the white
  function fitBand(E,text,size0,Z){ var b=box(runCmds(E,text,size0).cmds), up=-b.y1, dn=Math.max(0,b.y2), size=size0;
    if(up+dn>Z.up+Z.down){ var f=(Z.up+Z.down)/(up+dn); size*=f; up*=f; dn*=f; }
    var lift=dn>Z.down?dn-Z.down:0; if(up+lift>Z.up) lift=Math.max(0,Z.up-up);
    return {size:size,lift:lift}; }
  function lineLayout(E,text,which,R){ E=eng(E); R=R||RULE; var V=R.verse, c=GEO[which], fb=fitBand(E,text,V.size*HOBOCAP/E.capH,V);
    var span=(V.end-V.start)*c.L, nat=E.run(text,fb.size).adv;
    var k=nat*V.cond>span?span/nat:V.cond, used=nat*k, st=(V.mid*c.L)-used/2; st=Math.max(V.start*c.L,Math.min(V.end*c.L-used,st));
    return {size:fb.size,lift:fb.lift,k:k,used:used,start:st,nat:nat,cover:used/c.L}; }

  // ── the reference on the lower tail ──
  // Ken, 19 Oct: a short book name (6 letters or fewer) is always written out; a long one is shortened only when it doesn't fit.
  // f.tag is added after it (" (KJV)" unless the fish says otherwise; the other languages carry their version in the reference)
  function refText(E,ref,short,R,tag){ E=eng(E); R=R||RULE; tag=tag==null?' (KJV)':tag; var r=ref+tag, book=ref.replace(/\s*\d+[:.,]\d.*$/,'').replace(/^\d\s*/,'');
    if(short&&book.length>6&&E.run(r,R.ref.size).adv*R.ref.cond>R.ref.avail) r=short+tag; return r; }
  function refLayout(E,f,R){ E=eng(E); R=R||RULE; var F=R.ref, t=refText(E,f.ref,f.refShort,R,f.tag), fb=fitBand(E,t,F.size*HOBOCAP/E.capH,F), nat=E.run(t,fb.size).adv;
    return {text:t,size:fb.size,lift:fb.lift,k:Math.min(F.cond,F.avail/nat)}; }

  // ── the whole layout, then the drawing ──
  // A layout says exactly where everything goes, so the edit sheet can hand over its own (a fish Ken adjusted by hand):
  //   word {size, sx, hh, ox, oy}: a letter's point (x,y) at that size lands at (ox + x*sx, oy + y*hh)
  //   top / bot {size, k, start, lift}: each letter's middle sits at start + (its place in the line)*k along the curve, lifted out
  //   ref {text, size, k, lift}: centred on the tail
  function layout(E,f,R){ E=eng(E); R=R||RULE;
    return {word:wordLayout(E,f.word,R),top:lineLayout(E,f.top,'top',R),bot:lineLayout(E,f.bot,'bot',R),ref:refLayout(E,f,R)}; }
  // the word and the lines carry data-part (and each verse word its place in the line, data-s/data-e), so a page can light
  // them up while the verse is read aloud (index.html fishHi)
  function wordPath(E,word,L,stroke){ var run=runCmds(E,word,L.size);
    var d=pathD(run.cmds,function(x,y){ return [L.ox+x*L.sx, L.oy+y*(L.hh||1)]; });
    return '<path data-part="word" fill-rule="nonzero" fill="#fff" stroke="#fff" stroke-width="'+stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }
  // the line's words, in reading order, with where each starts and ends in the text (Chinese: each character is a word)
  function wordsOf(text,cjk){ var out=[], i=0; (cjk?Array.from(text):text.split(/(\s+)/)).forEach(function(t){ if(t&&!/^\s+$/.test(t)) out.push({s:i,e:i+t.length}); i+=t.length; }); return out; }
  function linePath(E,text,which,L,stroke){ var c=GEO[which], gl=E.run(text,L.size).glyphs, cjk=/[\u3040-\u30ff\u3400-\u9fff]/.test(text) && !/\s/.test(text.trim());
    function one(g){ var mid=L.start+(g.x+g.adv/2)*L.k, P=along(c,mid), co=Math.cos(P.ang), si=Math.sin(P.ang), ox=g.adv/2, up=L.lift||0;
      return pathD(g.cmds,function(x,y){ var lx=(x-ox)*L.k, ly=y-up; return [P.x+lx*co-ly*si, P.y+lx*si+ly*co]; }); }
    // glyphs grouped into words where the spaces are (a space has no outline); right-to-left lines are seen last word first
    var groups=[], cur=[]; gl.forEach(function(g){ if(!g.cmds.length&&!cjk){ if(cur.length) groups.push(cur); cur=[]; } else if(g.cmds.length) { if(cjk){ groups.push([g]); } else cur.push(g); } });
    if(cur.length) groups.push(cur);
    var words=wordsOf(text,cjk), att=' fill-rule="nonzero" fill="#000" stroke="#000" stroke-width="'+stroke+'" stroke-linejoin="round"';
    if(E.rtl) groups.reverse();
    if(groups.length!==words.length) return '<path data-part="'+which+'" data-s="0" data-e="'+text.length+'"'+att+' d="'+gl.map(one).join('')+'"/>';
    return groups.map(function(gr,i){ return '<path data-part="'+which+'" data-s="'+words[i].s+'" data-e="'+words[i].e+'"'+att+' d="'+gr.map(one).join('')+'"/>'; }).join(''); }
  function refPath(E,L,stroke){ var g=GEO.ref, a=g.rot*Math.PI/180, co=Math.cos(a), si=Math.sin(a), run=runCmds(E,L.text,L.size), half=run.adv*L.k/2, up=L.lift||0;
    var d=pathD(run.cmds,function(x,y){ var X=g.x+x*L.k-half, Y=g.y+y-up;   // laid out flat, then turned with the tail
      var dx=X-g.ox, dy=Y-g.oy; return [g.ox+dx*co-dy*si, g.oy+dx*si+dy*co]; });
    return '<path data-part="ref" fill-rule="nonzero" fill="#000" stroke="#000" stroke-width="'+stroke+'" stroke-linejoin="round" d="'+d+'"/>'; }
  function draw(E,f,P,R){ E=eng(E); R=R||RULE;
    return '<svg viewBox="0 0 4000 2000" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;shape-rendering:geometricPrecision;fill-rule:evenodd;clip-rule:evenodd" role="img" aria-label="'+String(f.word).replace(/[&<>"‪-‮]/g,'')+' fish">'
      +GEO.base+wordPath(E,f.word,P.word,R.word.stroke)+linePath(E,f.top,'top',P.top,R.verse.stroke)+linePath(E,f.bot,'bot',P.bot,R.verse.stroke)+refPath(E,P.ref,R.ref.stroke)+'</svg>'; }
  function svg(E,f,R){ E=eng(E); return draw(E,f,layout(E,f,R),R); }

  // ── the edit sheet (edit/index.html) ──
  // The sheet draws the fish with live text so Ken can drag and pinch, in its own terms; these turn its numbers into a
  // layout and back, so what he sees there is what the builder draws (and exports).
  //  Bible-in-a-year and year fish: word {size, dx, dy, ww, hh} from the eye's centre (1705, 993.6), the text centred on its
  //  advance and its ink centred up and down; a line {size, slide (% of the curve), lw (width, 1 = natural)}
  var SHEET={cx:1705,cy:993.6};
  function inkUD(E,text,size){ var b=box(runCmds(E,text,size).cmds); return {asc:-b.y1,desc:b.y2}; }
  function toSheet(E,f,P,R){ E=eng(E); R=R||RULE; var V=R.verse, w=P.word, adv=E.run(f.word,w.size).adv, m=inkUD(E,f.word,w.size), out={};
    out.wl={size:w.size,dx:w.ox+adv*w.sx/2-SHEET.cx,dy:w.oy-SHEET.cy-(m.asc-m.desc)/2,ww:w.sx,hh:w.hh||1};
    ['top','bot'].forEach(function(t){ var l=P[t], c=GEO[t], span=(V.end-V.start)*c.L, filled=l.used>=span-0.5;
      out[t==='top'?'tl':'bl']={size:l.size,lw:filled?1:l.k,slide:((l.start+l.used/2)/c.L-(V.start+V.end)/2)*100}; });
    return out; }
  function fromSheet(E,f,o,R,auto){ E=eng(E); R=R||RULE; var V=R.verse, P=auto||layout(E,f,R), Q={word:P.word,top:P.top,bot:P.bot,ref:P.ref};
    if(o.wl){ var v=o.wl, adv=E.run(f.word,v.size).adv, m=inkUD(E,f.word,v.size), my=SHEET.cy+v.dy, yb=SHEET.cy+(m.asc-m.desc)/2+v.dy, hh=v.hh||1;
      Q.word={size:v.size,sx:v.ww,hh:hh,ox:SHEET.cx+v.dx-adv*v.ww/2,oy:my+(yb-my)*hh}; }
    ['top','bot'].forEach(function(t){ var v=o[t==='top'?'tl':'bl']; if(!v) return; var c=GEO[t], L=c.L, span=L*(V.end-V.start), len=E.run(f[t],v.size).adv;
      var want=Math.min(span,Math.min(len,span)*(v.lw||1)), mid=L*((V.start+V.end)/2+(v.slide||0)/100), lo=L*V.start+want/2, hi=L*V.end-want/2; mid=Math.max(lo,Math.min(hi,mid));
      Q[t]={size:v.size,k:want/len,start:mid-want/2,used:want,lift:0}; });
    return Q; }
  //  the main 24 in the other languages: word {s, w, h, x, y} (size, width, height, moved), a line {size, slide, w}, all
  //  relative to the fish as built (the sheet's text copies, edit/lang/<code>.json)
  function applyRel(E,f,P,o){ E=eng(E); var Q={word:P.word,top:P.top,bot:P.bot,ref:P.ref};
    if(o.wl){ var a=o.wl, w=P.word, adv=E.run(f.word,w.size).adv, X0=w.ox+adv*w.sx/2, size=w.size*(a.s||1), sx=w.sx*(a.w||1);
      Q.word={size:size,sx:sx,hh:(w.hh||1)*(a.h||1),ox:X0+(a.x||0)-adv*(a.s||1)*sx/2,oy:w.oy+(a.y||0)}; }
    ['top','bot'].forEach(function(t){ var a=o[t==='top'?'tl':'bl']; if(!a) return; var l=P[t];
      Q[t]={size:a.size,k:l.k*(a.w||1),start:l.start+(a.slide||0),used:l.used*(a.size/l.size)*(a.w||1),lift:l.lift*(a.size/l.size)}; });
    return Q; }
  // the same layout as live text in the sheet: base is edit/new/base.svg (with its g_top / g_bot curves); fam/weight the face
  function textSvg(E,f,P,R,base,fam,weight,rtl){ E=eng(E); R=R||RULE; function x(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function t(s){ return x(rtl?'\u202b'+s+'\u202c':s); }
    var ff=' font-family="'+fam+'"'+(weight?' font-weight="'+weight+'"':''), w=P.word, adv=E.run(f.word,w.size).adv, g=GEO.ref, rr=P.ref, radv=E.run(rr.text,rr.size).adv;
    var inner=base.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<\/g>\s*$/,'');
    var out='<svg viewBox="0 0 4000 2000" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="width:100%;height:100%;display:block;shape-rendering:geometricPrecision;fill-rule:evenodd;clip-rule:evenodd">'+inner;
    out+='<text'+ff+' fill="#fff" stroke="#fff" stroke-width="'+R.word.stroke+'" stroke-linejoin="round" text-anchor="middle" font-size="'+f1(w.size)+'" x="'+f1(w.ox+adv*w.sx/2)+'" y="'+f1(w.oy)+'" textLength="'+f1(adv*w.sx)+'" lengthAdjust="spacingAndGlyphs">'+t(f.word)+'</text>';
    ['top','bot'].forEach(function(k){ var l=P[k];
      out+='<text'+ff+' fill="#000" stroke="#000" stroke-width="'+R.verse.stroke+'" font-size="'+f1(l.size)+'"'+(l.lift?' dy="'+f1(-l.lift)+'"':'')+'><textPath href="#g_'+k+'" text-anchor="start" startOffset="'+f1(l.start)+'" textLength="'+f1(l.used)+'" lengthAdjust="spacingAndGlyphs">'+t(f[k])+'</textPath></text>'; });
    out+='<text'+ff+' fill="#000" stroke="#000" stroke-width="'+R.ref.stroke+'" stroke-linejoin="round" text-anchor="middle" x="'+g.x+'" y="'+f1(g.y-(rr.lift||0))+'" transform="rotate('+g.rot+' '+g.ox+' '+g.oy+')" font-size="'+f1(rr.size)+'" textLength="'+f1(radv*rr.k)+'" lengthAdjust="spacingAndGlyphs">'+t(rr.text)+'</text>';
    return out+'</g></svg>'; }
  function f1(n){ return Math.round(n*10)/10; }

  var API={setGeo:setGeo,toSheet:toSheet,fromSheet:fromSheet,applyRel:applyRel,textSvg:textSvg,RULE:RULE,HOBOCAP:HOBOCAP,otEngine:otEngine,svg:svg,draw:draw,layout:layout,wordLayout:wordLayout,lineLayout:lineLayout,refLayout:refLayout,refText:refText,
    runBox:function(E,text,size){ return box(runCmds(eng(E),text,size).cmds); }};
  if(typeof module!=='undefined'&&module.exports) module.exports=API; else root.MFfmt=API;
})(this);
