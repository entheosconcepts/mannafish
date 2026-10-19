# python3 -I build_plan.py -> /home/user/mannafish/plan/plan.json and edit/daily/data.json (the old 364 keep their ids; new fish from D365)
import json,glob,os,re,collections
D=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D,'..','daily','verify.py')).read().split('bad=0')[0].replace('sys.argv','[]').replace("os.path.join(D,'weeks.json')","os.path.join(D,'..','daily','weeks.json')"))
S=json.load(open(os.path.join(D,'slots.json'))); PL=json.load(open(os.path.join(D,'plan.json')))
OLD=json.load(open('/home/user/mannafish/tools/daily-fish/data364.json'))['fish']
byk={f['k']:f for f in OLD}
NEW=[x for f in sorted(glob.glob(os.path.join(D,'out','*.json'))) for x in json.load(open(f))]
NEW.sort(key=lambda x:x['slot'])
DAYN=['Sun','Mon','Tue','Wed','Thu','Fri']
def nice_ch(c):
    b,n=c.rsplit(' ',1); b=re.sub(r'^(\d)',r'\1 ',b); b={'Psalms':'Psalm','Song':'Song of Solomon'}.get(b,b); return [b,int(n)]
def verse_of(ref):
    b,c,t=verses(ref); return re.sub(r'\s+([.,;:!?])',r'\1',re.sub(r'\s+',' ',t)).strip()
series={f['w']:f['series'] for f in OLD}
fish=[]; n=365
slotfish={}
for x in NEW:
    s=S[x['slot']]; k='D%03d'%n; n+=1
    slotfish[x['slot']]=k
    fish.append({'k':k,'word':x['word'],'top':x['top'],'bot':x['bottom'],'ref':x['ref'],'refShort':x['refShort'],'verse':verse_of(x['ref']),'src':'plan'})
for i,s in enumerate(S):
    if s['keep']: slotfish[i]=s['keep']
allf={f['k']:f for f in OLD}; allf.update({f['k']:f for f in fish})
# where each fish sits in the plan
pos={}
for i,s in enumerate(S):
    k=slotfish.get(i)
    if not k: raise SystemExit('reading without a fish: %d'%i)
    pos[k]=s
out=[]
for k in sorted(allf):
    f=dict(allf[k]); s=pos.get(k)
    for drop in ('w','day','slot','read','series'): f.pop(drop,None)
    if s: f.update({'w':s['week'],'day':DAYN.index(s['day'])+1,'half':s['half'],'read':s['label'],'series':series.get(s['week'],''),'inplan':True})
    else:
        o=byk[k]; f.update({'w':o['w'],'day':0,'half':'','read':o['read'],'series':o['series'],'inplan':False})
    out.append(f)
out.sort(key=lambda f:(not f['inplan'],f['w'],f['day'],f['half'],f['k']))
json.dump({'tag':' (KJV)','fish':out},open('/home/user/mannafish/edit/daily/data.json','w'),ensure_ascii=False)
# the plan
i=0; weeks=[]
for W in PL:
    days=[]
    for d in W['days']:
        dd={}
        for h in ('am','pm'):
            s=S[i]; f=allf[slotfish[i]]; i+=1
            r=d[h]; dd[h]={'label':r['label'],'ch':[nice_ch(c) for c in r['chapters']],'words':r['words'],'f':{'id':f['k'],'word':f['word'],'top':f['top'],'bot':f['bot'],'ref':f['ref'],'verse':f['verse']}}
        days.append(dd)
    weeks.append({'w':W['week'],'reading':W['reading'],'days':days})
os.makedirs('/home/user/mannafish/plan',exist_ok=True)
json.dump({'weeks':weeks},open('/home/user/mannafish/plan/plan.json','w'),ensure_ascii=False,separators=(',',':'))
c=collections.Counter(f['word'] for f in out)
print(len(out),'fish,',sum(1 for f in out if f['inplan']),'in the plan,',sum(1 for f in out if not f['inplan']),'spare;',len(c),'different words; repeats:',[w for w,v in c.items() if v>1])
