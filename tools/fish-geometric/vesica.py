# The MannaFish fish on the vesica piscis (Ken, 19 Oct: "can you geometrically perfect this fish?")
# Everything follows from four rules inside the 4000 x 2000 frame:
#  1. the body is a vesica piscis: two equal circles (radius 1700 on the middle of the band), each passing through the
#     other's centre (centres 1700 apart, at y = 150 and y = 1850)
#  2. the band is 300 wide everywhere (outer circles 1850, eye circles 1550, all on the same two centres), so it touches
#     the top and bottom of the frame, and the nose touches the left edge
#  3. the two tail bars, also 300 wide, point at the frame's corners, and their inner edges meet exactly at the eye's back point
#  4. the bar ends touch the right edge of the frame; nose and tail-end corners are rounded with one radius (a quarter of the band)
import math
FW,FH=4000.0,2000.0; W=300.0; R=FH*0.85; h=R/2; Y0=FH/2; r=W/4
RO,RI=R+W/2,R-W/2
cU,cL=Y0+h,Y0-h                                    # centres of the upper arc (below it) and the lower arc (above it)
xc=math.sqrt(RO*RO-h*h)                            # outer nose at x = 0
eyeR=xc+math.sqrt(RI*RI-h*h); eyeL=xc-math.sqrt(RI*RI-h*h)
# rule 3: bars aimed at the corners, inner edges meeting at the eye point
th=math.radians(49)
for _ in range(60):
    xx=eyeR+(W/2)/math.sin(th); th=math.atan2(Y0,FW-xx)
s,c=math.sin(th),math.cos(th); X=(xx,Y0)
notch=xx+(W/2)/s
u=(c,-s); n=(s,c)                                   # upper bar: direction up-right; n points to its lower-right side
# rule 4: the end's far corner arc touches x = FW
Lb=(FW-r-X[0]-(W/2-r)*s)/c+r
f=lambda v:('%.3f'%v).rstrip('0').rstrip('.')
P=lambda p:f(p[0])+' '+f(p[1])
mir=lambda p:(p[0],FH-p[1])
def pt(al,off): return (X[0]+al*u[0]+off*n[0],X[1]+al*u[1]+off*n[1])
b1,b2,b3,b4=pt(Lb-r,-W/2),pt(Lb,-W/2+r),pt(Lb,W/2-r),pt(Lb-r,W/2)
# where the upper outer circle meets the upper bar's upper-left edge (the line through the eye point along u)
E=(eyeR,Y0); dx,dy=E[0]-xc,E[1]-cU; B_=2*(dx*u[0]+dy*u[1]); C_=dx*dx+dy*dy-RO*RO; t1=(-B_+math.sqrt(B_*B_-4*C_))/2
Q=(E[0]+t1*u[0],E[1]+t1*u[1])
# nose fillet: circle of radius r inside both outer circles, tangent to each (centre on the axis)
# distance from the upper centre to the fillet centre = RO - r
fx=xc-math.sqrt((RO-r)**2-h*h); F=(fx,Y0)
def toward(cen,p,R_):   # point on the circle (cen,R_) in the direction of p
    vx,vy=p[0]-cen[0],p[1]-cen[1]; d=math.hypot(vx,vy); return (cen[0]+vx/d*R_,cen[1]+vy/d*R_)
tU=toward((xc,cU),F,RO); tU=(2*F[0]-tU[0],tU[1]) if False else toward((xc,cU),(F[0]-(xc-F[0]),F[1]-(cU-F[1])),RO)
# simpler: tangent point lies on the line from the big centre through the fillet centre, at distance RO
vx,vy=F[0]-xc,F[1]-cU; d=math.hypot(vx,vy); tU=(xc+vx/d*RO,cU+vy/d*RO); tL=mir(tU)
d_=['M'+P(tU),
 'A%s %s 0 0 1 %s'%(f(RO),f(RO),P(Q)),
 'L'+P(b1),'A%s %s 0 0 1 %s'%(f(r),f(r),P(b2)),'L'+P(b3),'A%s %s 0 0 1 %s'%(f(r),f(r),P(b4)),
 'L'+P((notch,Y0)),
 'L'+P(mir(b4)),'A%s %s 0 0 1 %s'%(f(r),f(r),P(mir(b3))),'L'+P(mir(b2)),'A%s %s 0 0 1 %s'%(f(r),f(r),P(mir(b1))),
 'L'+P(mir(Q)),
 'A%s %s 0 0 1 %s'%(f(RO),f(RO),P(tL)),
 'A%s %s 0 0 1 %s'%(f(r),f(r),P(tU)),'Z',
 'M'+P((eyeL,Y0)),'A%s %s 0 0 1 %s'%(f(RI),f(RI),P(E)),'A%s %s 0 0 1 %s'%(f(RI),f(RI),P((eyeL,Y0))),'Z']
path=''.join(d_)
print('centres x %.1f, y %.0f and %.0f; radii outer %.0f, middle %.0f, eye %.0f'%(xc,cU,cL,RO,R,RI))
print('eye points %.1f %.1f; bars cross at %.1f, angle %.2f deg; right notch %.1f; bar length from crossing %.1f'%(eyeL,eyeR,xx,math.degrees(th),notch,Lb))
print('upper-left corner of the tail top at y = %.1f'%(min(b1[1],b2[1])-0))
open('fish-vesica.svg','w').write('''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="4in" height="2in" viewBox="0 0 4000 2000" style="shape-rendering:geometricPrecision;fill-rule:evenodd;clip-rule:evenodd">
 <!-- MannaFish fish on the vesica piscis: two equal circles (radius 1700 on the middle of the band) each through the other's centre;
      band 300 wide (circles 1850 and 1550 on the same centres); tail bars 300 wide aimed at the frame corners, their inner edges
      meeting at the eye's point; nose and tail corners rounded 75 (a quarter of the band). -->
 <path fill="white" fill-rule="evenodd" d="%s"/>
</svg>
'''%path)
