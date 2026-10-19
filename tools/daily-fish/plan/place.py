import json,re,collections
W=json.load(open('plan.json')); F=json.load(open('/home/user/mannafish/edit/daily/data.json'))['fish']
def bc(ref):
    m=re.match(r'^(.+?) (\d+):',ref); b={'Psalm':'Psalms','Song of Solomon':'Song'}.get(m.group(1),m.group(1)).replace(' ','')
    return f"{b} {m.group(2)}"
slot={}
S=[]
for w in W:
    for d in w['days']:
        for h in ('am','pm'):
            s={'week':w['week'],'day':d['day'],'half':h,'chapters':d[h]['chapters'],'label':d[h]['label'],'fish':[]}; S.append(s)
            for c in d[h]['chapters']: slot[c]=s
for f in F: slot[bc(f['ref'])]['fish'].append(f)
pri={'weekly':0,'alt':1,'new':2}
cnt=collections.Counter(len(s['fish']) for s in S); print('fish per reading:',dict(cnt))
spare=[]
for s in S:
    s['fish'].sort(key=lambda f:pri[f['src']])
    s['keep']=s['fish'][0]['k'] if s['fish'] else None
    spare+= [f['k'] for f in s['fish'][1:]]
    # a spare fish can move to the other half of the same day if that half is empty
for s in S:
    pass
print('readings without a fish',sum(1 for s in S if not s['keep']),'spare fish',len(spare))
lost_weekly=[f for s in S for f in s['fish'][1:] if f['src']=='weekly']; print('weekly fish left spare',[(f['k'],f['word']) for f in lost_weekly])
json.dump(S,open('slots.json','w'),ensure_ascii=False,indent=1)
