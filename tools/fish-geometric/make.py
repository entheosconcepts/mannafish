# The MannaFish fish, rebuilt from exact geometry (Ken's CorelDRAW outline measured, then made true):
#  - one stroke 300 wide everywhere: the body bands and the tail bars
#  - the body: circles (outer radius R, inner R-300, the same centre); top at y=0, bottom at y=2000, mirror-symmetric about y=1000
#  - every straight part at the same angle, 49 degrees: the nose, the eye's two points, and the tail bars, which carry on
#    straight from the body curves (each band runs into the opposite tail bar)
#  - rounded nose (radius 100) and rounded tail ends (corners radius 80); the other corners sharp, as drawn
import math, sys
A=math.radians(49); s,c,t=math.sin(A),math.cos(A),math.tan(A)
W=300; RN=100; RC=80; NOSE_TIP=0.0; CROSS=3117.0; L=1223.4
k=s-(1-c)/t
apex=NOSE_TIP-RN*(1/s-1)
e1=apex+1000/t; e2=CROSS-1000/t+(W/2)*s+(W/2)*c/t
cx=(e1+e2)/2; RO=(e2-e1)/2/k; RI=RO-W; RM=RO-W/2
Y=lambda y:2000-y
def tan_pt(R,side): return (cx+side*R*s, RO-R*c)          # upper circles, centre (cx,RO)
def axis_x(R,side): x,y=tan_pt(R,side); return x+side*(1000-y)/t   # its 49-degree line meets y=1000
def inter(p,d,q,e):   # p+u d = q+v e
    det=d[0]*(-e[1])-d[1]*(-e[0]); u=((q[0]-p[0])*(-e[1])-(q[1]-p[1])*(-e[0]))/det; return (p[0]+u*d[0],p[1]+u*d[1])
f=lambda v:('%.2f'%v).rstrip('0').rstrip('.')
P=lambda p:f(p[0])+' '+f(p[1])
# key points
To_L,To_R=tan_pt(RO,-1),tan_pt(RO,1); Ti_L,Ti_R=tan_pt(RI,-1),tan_pt(RI,1)
nose=(axis_x(RO,-1),1000.0); eyeL=(axis_x(RI,-1),1000.0); eyeR=(axis_x(RI,1),1000.0); notchR=(axis_x(RO,1),1000.0)
cross=(axis_x(RM,1),1000.0)
dn=(c,s); up=(c,-s)                       # down-right, up-right
# top notch: the upper band's outer line meets the upper bar's inner (upper-left) edge = mirrored inner line
mi=(Ti_R[0],Y(Ti_R[1]))
notchT=inter(To_R,dn,mi,up)
# the upper tail bar: centre line from the crossing going up-right; edges at +-150; end at L, corners RC
nU=(s,c)   # unit normal of 'up' pointing down-right (to the bar's lower-right side)
def bar_pts(dirv,nrm):
    e=(cross[0]+L*dirv[0],cross[1]+L*dirv[1])
    a=lambda al,off:(cross[0]+al*dirv[0]+off*nrm[0],cross[1]+al*dirv[1]+off*nrm[1])
    return a(L-RC,-W/2), a(L,-W/2+RC), a(L,W/2-RC), a(L-RC,W/2)
# nose fillet tangent points
dt=RN/math.tan(A)   # distance from apex along each line... half-angle at the nose is 49 deg
nU1=(nose[0]+dt*c,1000-dt*s); nL1=(nose[0]+dt*c,1000+dt*s)
b1,b2,b3,b4=bar_pts(up,nU)                # upper bar: inner edge (offset -150, upper-left) ... outer edge (+150)
mir=lambda p:(p[0],Y(p[1]))
d=[]
d.append('M'+P(nU1))
d.append('L'+P(To_L))
d.append('A%s %s 0 0 1 %s'%(f(RO),f(RO),P(To_R)))
d.append('L'+P(notchT))
d.append('L'+P(b1)); d.append('A%s %s 0 0 1 %s'%(f(RC),f(RC),P(b2))); d.append('L'+P(b3)); d.append('A%s %s 0 0 1 %s'%(f(RC),f(RC),P(b4)))
d.append('L'+P(notchR))
d.append('L'+P(mir(b4))); d.append('A%s %s 0 0 1 %s'%(f(RC),f(RC),P(mir(b3)))); d.append('L'+P(mir(b2))); d.append('A%s %s 0 0 1 %s'%(f(RC),f(RC),P(mir(b1))))
d.append('L'+P(mir(notchT)))
d.append('L'+P(mir(To_R)))
d.append('A%s %s 0 0 1 %s'%(f(RO),f(RO),P(mir(To_L))))
d.append('L'+P(nL1))
d.append('A%s %s 0 0 1 %s'%(f(RN),f(RN),P(nU1)))
d.append('Z')
# the eye (a hole)
d.append('M'+P(eyeL)); d.append('L'+P(Ti_L)); d.append('A%s %s 0 0 1 %s'%(f(RI),f(RI),P(Ti_R))); d.append('L'+P(eyeR))
d.append('L'+P(mir(Ti_R))); d.append('A%s %s 0 0 1 %s'%(f(RI),f(RI),P(mir(Ti_L)))); d.append('Z')
path=''.join(d)
xs=[nose[0],b2[0],b3[0]]; 
info=dict(cx=cx,R_outer=RO,R_inner=RI,R_centre=RM,nose_apex=nose,eye=(eyeL[0],eyeR[0]),crossing=cross,notch_right=notchR,notch_top=notchT)
for k2,v in info.items(): print(k2, tuple(round(x,1) for x in v) if isinstance(v,tuple) else round(v,1))
svg='''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="4in" height="2in" viewBox="0 0 4000 2000" style="shape-rendering:geometricPrecision;fill-rule:evenodd;clip-rule:evenodd">
 <!-- MannaFish fish, geometric. One 300-wide stroke: body circles R %s / %s (centre %s, %s and mirrored), every straight part at 49 degrees,
      tail bars continuing straight from the body curves, nose radius %d, tail corners radius %d. Symmetric about y = 1000. -->
 <path fill="white" fill-rule="evenodd" d="%s"/>
</svg>
'''%(f(RO),f(RI),f(cx),f(RO),RN,RC,path)
open('fish-geometric.svg','w').write(svg); print(len(path),'chars')
