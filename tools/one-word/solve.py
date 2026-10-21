import json,math,time,sys,numpy as np
from scipy.optimize import milp,LinearConstraint,Bounds
from scipy.sparse import coo_matrix
import os; W=os.environ.get('ONEWORD_WORK','work/')   # the work folder (DATA.json: the main fish, from index.html)
J=json.load(open(W+'inc.json')); CH=J['CH']; INC=J['INC']; WD=J['words']; NCH=len(CH)
NT=lambda i: CH[i]['b']>=39
words=sorted(INC); nw=len(words)
import os
BAN=set(tuple(x) for x in json.load(open(W+'ban.json'))) if os.path.exists(W+'ban.json') else set()
BANW=set(json.load(open(W+'banwords.json'))) if os.path.exists(W+'banwords.json') else set()
GOOD=set(tuple(x) for x in json.load(open(W+'good.json'))) if os.path.exists(W+'good.json') else set()
pairs=[]   # (word idx, chapter idx, score)
for wi,w in enumerate(words):
    m=INC[w]; df=len(m)
    if df<4 or w in BANW: continue   # BANW: words that mostly mean something else in the KJV (Table: stone tablets, Tend: "tendeth to")
    idf=math.log(NCH/df)
    bonus={'main':1.0,'year':0.6,'daily':0.3}[WD[w]['src']]
    for i,(n,fv) in m.items():
        if (w,int(i)) in BAN: continue
        pairs.append((wi,int(i),math.log(1+n)*(0.5+idf)+bonus+(1.5 if (w,int(i)) in GOOD else 0)))
P=len(pairs); print('pairs',P,'words',nw)
# variables: x (P) | y (nw) | e (nw) | z (nw): a second New Testament chapter on that day (allowed, but costs)
nv=P+3*nw
c=np.zeros(nv); c[:P]=[-p[2] for p in pairs]; c[P+2*nw:]=4.0
rows=[];cols=[];vals=[];lo=[];hi=[];r=0
# each chapter once
for p,(wi,i,s) in enumerate(pairs): rows.append(i); cols.append(p); vals.append(1)
lo+= [1]*NCH; hi+=[1]*NCH; r=NCH
# per word: sum x - 4y - e = 0 ; NT <= y ; e<=y
for p,(wi,i,s) in enumerate(pairs): rows.append(r+wi); cols.append(p); vals.append(1)
for wi in range(nw): rows+= [r+wi,r+wi]; cols+=[P+wi,P+nw+wi]; vals+=[-4,-1]
lo+=[0]*nw; hi+=[0]*nw; r+=nw
for p,(wi,i,s) in enumerate(pairs):
    if NT(i): rows.append(r+wi); cols.append(p); vals.append(1)
for wi in range(nw): rows+=[r+wi,r+wi]; cols+=[P+wi,P+2*nw+wi]; vals+=[-1,-1]
lo+=[-np.inf]*nw; hi+=[0]*nw; r+=nw
for wi in range(nw): rows+=[r+wi,r+wi]; cols+=[P+nw+wi,P+wi]; vals+=[1,-1]
lo+=[-np.inf]*nw; hi+=[0]*nw; r+=nw
# exactly one five-chapter day
for wi in range(nw): rows.append(r); cols.append(P+nw+wi); vals.append(1)
lo.append(1); hi.append(1); r+=1
ub=np.ones(nv); ub[P+2*nw:]=3
# the main fish words are all in the year
lob=np.zeros(nv)
for wi,w in enumerate(words):
    if WD[w]['src']=='main' and len(INC[w])>=4: lob[P+wi]=1
A=coo_matrix((vals,(rows,cols)),shape=(r,nv)).tocsr()
t=time.time()
res=milp(c,constraints=LinearConstraint(A,lo,hi),integrality=np.ones(nv),bounds=Bounds(lob,ub),options={'time_limit':float(sys.argv[1]) if len(sys.argv)>1 else 300,'disp':False,'mip_rel_gap':0.01})
print('status',res.status,res.message,'time',round(time.time()-t,1))
if res.x is None: sys.exit()
x=res.x
days={}
for p,(wi,i,s) in enumerate(pairs):
    if x[p]>0.5: days.setdefault(words[wi],[]).append(i)
print('days',len(days), 'sizes',sorted(set(len(v) for v in days.values())))
json.dump(days,open(W+'days.json','w'))
