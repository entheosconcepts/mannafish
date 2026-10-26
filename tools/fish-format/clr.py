import numpy as np,sys,glob,os
from PIL import Image
from scipy import ndimage
body=np.array(Image.open('r24/body.png').convert('L'))>128
lab,_=ndimage.label(~body); eye=lab==lab[497,852]
edt=ndimage.distance_transform_edt(eye)*2
inner=ndimage.binary_erosion(eye,iterations=3)
def clr(f):
  im=np.array(Image.open(f).convert('L'))>128; w=im&inner
  ys,xs=np.nonzero(w); d=edt[ys,xs]
  cx=(xs.min()+xs.max())/2; cy=(ys.min()+ys.max())/2
  L=[];R=[];T=[];B=[]
  for y in np.unique(ys):
    r=np.nonzero(eye[y])[0]; wx=xs[ys==y]; L.append(wx.min()-r.min()); R.append(r.max()-wx.max())
  for x in np.unique(xs):
    c=np.nonzero(eye[:,x])[0]; wy=ys[xs==x]; T.append(wy.min()-c.min()); B.append(c.max()-wy.max())
  return dict(min=d.min(),L=min(L)*2,R=min(R)*2,T=min(T)*2,B=min(B)*2, h=(ys.max()-ys.min())*2)
for f in sys.argv[1:]:
  c=clr(f); print(f"{os.path.basename(f)[:-4]:10} min{c['min']:5.0f}  L{c['L']:4} R{c['R']:4} T{c['T']:4} B{c['B']:4} h{c['h']}")
