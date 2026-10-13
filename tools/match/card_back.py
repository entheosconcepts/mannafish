# The memory-match card back, approved by Ken 13 Oct:  python3 tools/match/card_back.py 22 1550 60 back 1550
# Ken, 13 Oct: version B (each letter of Manna reaching up to the curve, each letter of Fish down to it), but the M's
# second arch brought up close to the top inside edge: the M alone is bent to follow the curve, so its left side stays
# clear of the lower part of the curve while its right arch rises with it.
import json, sys, re
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
import os
A=os.path.dirname(os.path.abspath(__file__))+'/'   # lens.json (the inside edge of the fish) and fish.svg (Ken's fish)
GAP=float(sys.argv[1]) if len(sys.argv)>1 else 22; WIDTH=float(sys.argv[2]) if len(sys.argv)>2 else 1550
SPLIT=float(sys.argv[3]) if len(sys.argv)>3 else 60; OUT=sys.argv[4] if len(sys.argv)>4 else 'brand10'
WF=float(sys.argv[5]) if len(sys.argv)>5 else 0   # Ken, 13 Oct: "stretch Fish" -- how wide Fish is (0: as before)
lens={int(k):v for k,v in json.load(open(A+'lens.json')).items()}; xs=sorted(lens)
def edge(x,i):
    x=min(max(x,xs[0]),xs[-1]); a=max(k for k in xs if k<=x); b=min(k for k in xs if k>=x)
    if a==b: return lens[a][i]
    t=(x-a)/(b-a); return lens[a][i]*(1-t)+lens[b][i]*t
top=lambda x: edge(x,0); bot=lambda x: edge(x,1)
f=TTFont('/home/user/mannafish/fish-lang/hobo.woff2'); gs=f.getGlyphSet(); cmap=f.getBestCmap()
def letters(word):
    out=[]; x=0
    for ch in word:
        g=cmap[ord(ch)]; pen=RecordingPen(); gs[g].draw(pen)
        ops=[(op,[(px+x,py) for px,py in pts]) for op,pts in pen.value]
        P=[p for op,pts in ops for p in pts]
        out.append({'ch':ch,'ops':ops,'l':min(p[0] for p in P),'r':max(p[0] for p in P),'b':min(p[1] for p in P),'t':max(p[1] for p in P)})
        x+=gs[g].width
    return out
cx=(xs[0]+xs[-1])/2; mid=(top(cx)+bot(cx))/2
M=letters('Manna'); F=letters('Fish')
sc=WIDTH/(M[-1]['r']-M[0]['l'])                     # font units -> fish units, from Manna's width
def X(word,px): return cx+(px-(word[0]['l']+word[-1]['r'])/2)*sc
def span(l,r,fn,hi):
    v=None
    for x in range(int(l-GAP),int(r+GAP)+1,4):
        y=fn(x); v=y if v is None else (max(v,y) if hi else min(v,y))
    return v
def path(ops,fx):
    s=''
    for op,pts in ops:
        s+={'moveTo':'M','lineTo':'L','curveTo':'C','qCurveTo':'Q','closePath':'Z','endPath':''}[op]+' '.join('%.1f %.1f'%fx(px,py) for px,py in pts)
    return s
base=mid-SPLIT/2; tl=mid+SPLIT/2; dM=''; dF=''
for o in M:
    l,r=X(M,o['l']),X(M,o['r'])
    if True:   # Ken, 13 Oct: every letter of Manna follows the curve point by point, as close to the edge as the M
        fx=lambda px,py,o=o: (X(M,px), base-(py/o['t'])*(base-(top(X(M,px))+GAP)))
    else:              # the other letters keep a flat top, as high as the curve allows over their width
        T=span(l,r,top,True)+GAP; fx=lambda px,py,T=T,o=o: (X(M,px), base-(py/o['t'])*(base-T))
    dM+=path(o['ops'],fx)
fw=(F[-1]['r']-F[0]['l'])*sc; fsx=(WF/fw) if WF else 1      # stretch Fish across
def XF(px): return cx+(px-(F[0]['l']+F[-1]['r'])/2)*sc*fsx
print('Fish natural width',round(fw),'->',round(fw*fsx))
for o in F:   # every letter of Fish reaches down to the curve below it, point by point, like Manna
    fx=lambda px,py,o=o: (XF(px), tl+((o['t']-py)/(o['t']-o['b']))*((bot(XF(px))-GAP)-tl))
    dF+=path(o['ops'],fx)
body=re.sub(r'<text[\s\S]*?</text>','',open(A+'fish.svg').read())
open(A+'../../match/back.svg' if OUT=='back' else A+OUT+'.svg','w').write(body.replace('</g>','<path fill="#fff" d="%s"/><path fill="#2A5FB0" d="%s"/></g>'%(dM,dF),1))
print('ok',OUT)
