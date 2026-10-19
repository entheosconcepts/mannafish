import json,re
K=json.loads(open('../kjvdl/kjv.json',encoding='utf-8-sig').read())
B="Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth 1Samuel 2Samuel 1Kings 2Kings 1Chronicles 2Chronicles Ezra Nehemiah Esther Job Psalms Proverbs Ecclesiastes Song Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi Matthew Mark Luke John Acts Romans 1Corinthians 2Corinthians Galatians Ephesians Philippians Colossians 1Thessalonians 2Thessalonians 1Timothy 2Timothy Titus Philemon Hebrews James 1Peter 2Peter 1John 2John 3John Jude Revelation".split()
NICE={'Psalms':'Psalm','Song':'Song of Solomon'}
def nice(b): b=re.sub(r'^(\d)',r'\1 ',b); return NICE.get(b,b)
ch=[]
for bi,bk in enumerate(K):
    for ci,c in enumerate(bk['chapters']):
        w=sum(len(re.sub(r'\{[^}]*\}','',v).split()) for v in c)
        ch.append((B[bi],ci+1,w,len(c)))
N=len(ch); G=52*6*2; tot=sum(c[2] for c in ch); T=tot/G
print(N,'chapters',tot,'words, target',round(T),'words a reading')
pre=[0]
for c in ch: pre.append(pre[-1]+c[2])
INF=float('inf'); MAXW=12
cost=[[INF]*(N+1) for _ in range(G+1)]; back=[[0]*(N+1) for _ in range(G+1)]
cost[0][0]=0
for g in range(1,G+1):
    lo=max(g, N-(G-g)*MAXW); hi=min(N, g*MAXW)
    for j in range(lo,hi+1):
        best=INF;bk=0
        for i in range(max(g-1,j-MAXW),j):
            if cost[g-1][i]==INF: continue
            v=cost[g-1][i]+(pre[j]-pre[i]-T)**2
            if v<best: best=v;bk=i
        cost[g][j]=best; back[g][j]=bk
cuts=[N]; j=N
for g in range(G,0,-1): j=back[g][j]; cuts.append(j)
cuts=cuts[::-1]
def label(a,b):
    s,e=ch[a],ch[b-1]
    if s[0]==e[0]: return f"{nice(s[0])} {s[1]}" if s[1]==e[1] else f"{nice(s[0])} {s[1]}–{e[1]}"
    return f"{nice(s[0])} {s[1]} – {nice(e[0])} {e[1]}"
R=[]
for g in range(G):
    a,b=cuts[g],cuts[g+1]
    R.append({'chapters':[f"{ch[k][0]} {ch[k][1]}" for k in range(a,b)],'label':label(a,b),'words':pre[b]-pre[a],'verses':sum(ch[k][3] for k in range(a,b))})
DAYS=['Sun','Mon','Tue','Wed','Thu','Fri']
W=[]
for w in range(52):
    days=[]
    for d in range(6):
        i=(w*6+d)*2; days.append({'day':DAYS[d],'am':R[i],'pm':R[i+1]})
    W.append({'week':w+1,'reading':label(cuts[w*12],cuts[w*12+12]),'days':days})
json.dump(W,open('plan.json','w'),ensure_ascii=False,indent=1)
ws=sorted(r['words'] for r in R); print('words a reading: min',ws[0],'median',ws[len(ws)//2],'max',ws[-1],'| minutes at 200 wpm: ',round(ws[0]/200,1),'-',round(ws[-1]/200,1))
print('biggest:',[ (r['label'],r['words']) for r in sorted(R,key=lambda r:-r['words'])[:4]])
print('smallest:',[ (r['label'],r['words']) for r in sorted(R,key=lambda r:r['words'])[:4]])
for k in (0,22,51): print(W[k]['week'],W[k]['reading'],' | '.join(d['day']+' '+d['am']['label']+' / '+d['pm']['label'] for d in W[k]['days'][:3]))
