import numpy as np,json,glob,os,sys
from PIL import Image
from scipy import ndimage
P=json.load(open('paths.json'))
body=np.array(Image.open('r24/body.png').convert('L'))>128
lab,_=ndimage.label(~body); eye=lab==lab[497,852]
band=body.copy(); band[:,1540:]=False   # the body ring only (not the tail)
# eye extents
ys,xs=np.nonzero(eye); EYE=dict(x0=xs.min()*2,x1=xs.max()*2,y0=ys.min()*2,y1=ys.max()*2)
def eyerow(y): r=np.nonzero(eye[int(y/2)])[0]; return r.min()*2,r.max()*2
def eyecol(x): c=np.nonzero(eye[:,int(x/2)])[0]; return c.min()*2,c.max()*2
from scipy.spatial import cKDTree
T={k:cKDTree(np.array(P[k]['pts'])/2) for k in ('top','bot')}
def ink(a):
  ys,xs=np.nonzero(a); return xs.min()*2,xs.max()*2+2,ys.min()*2,ys.max()*2+2
def one(f):
  im=np.array(Image.open(f).convert('L'))>128
  w=im&ndimage.binary_erosion(eye,iterations=3)
  x0,x1,y0,y1=ink(w); cy=(y0+y1)/2; cx=(x0+x1)/2
  ex0,ex1=eyerow(cy); ey0,ey1=eyecol(cx)
  r=dict(word=dict(x0=x0,x1=x1,y0=y0,y1=y1,w=x1-x0,h=y1-y0,cx=cx,cy=cy,fillW=(x1-x0)/(ex1-ex0),gapL=x0-ex0,gapR=ex1-x1,gapT=y0-ey0,gapB=ey1-y1,area=int(w.sum())))
  v=(~im)&ndimage.binary_erosion(band,iterations=2)
  ys,xs=np.nonzero(v)
  for k in('top','bot'):
    d,i=T[k].query(np.c_[xs,ys]); m=d<60
    # each verse pixel goes to the nearer curve
    other=T['bot' if k=='top' else 'top'].query(np.c_[xs,ys])[0]; m&=d<other
    t=i[m]/1000; t.sort()
    if len(t)<50: r[k]=None; continue
    s,e=np.percentile(t,1),np.percentile(t,99)
    # letter height: per arc-sample bucket, spread of distances from the curve (signed would be better; use distance range)
    dd=d[m]; ii=i[m]; hs=[]
    for b0 in range(int(s*1000)+50,int(e*1000)-50,10):
      sel=(ii>=b0)&(ii<b0+10)
      if sel.sum()>20: hs.append(np.percentile(dd[sel],97))
    r[k]=dict(start=round(s,3),end=round(e,3),cover=round(e-s,3),mid=round((s+e)/2,3),lh=round(float(np.median(hs))*2,1) if hs else None)
  return r
out={}
for f in sys.argv[1:]: out[os.path.basename(f)[:-4]]=one(f)
json.dump(dict(eye=EYE,fish=out),open(sys.argv[0].replace('.py','')+'_'+os.path.basename(os.path.dirname(sys.argv[1]))+'.json','w'),indent=1,default=float)
for k,r in out.items():
  w=r['word'];print(f"{k:10} w{w['w']:5} h{w['h']:5} fill{w['fillW']:.2f} gL{w['gapL']:4} gR{w['gapR']:4} gT{w['gapT']:4} gB{w['gapB']:4} cx{w['cx']:.0f} cy{w['cy']:.0f} |", *[f"{t}:{r[t]['start']}-{r[t]['end']} lh{r[t]['lh']}" if r[t] else f'{t}:-' for t in('top','bot')])
print(EYE)
