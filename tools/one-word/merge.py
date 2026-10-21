import json,os,glob
import os; W=os.environ.get('ONEWORD_WORK','work/')   # the work folder (DATA.json: the main fish, from index.html)
R=json.load(open(W+'reviewed.json')) if os.path.exists(W+'reviewed.json') else {}
want=set()
for f in glob.glob(W+'rev/batch*.json'): want|={x['id'] for x in json.load(open(f))}
got=0
for f in glob.glob(W+'rev/out*.json'):
    try: L=json.load(open(f))
    except Exception as e: print('bad file',f,e); continue
    for x in L: R[x['id']]={'ok':bool(x.get('ok')),'v':x.get('v'),'why':x.get('why','')}; got+=1
missing=[i for i in want if i not in R]
print('merged',got,'| missing',len(missing),missing[:5])
json.dump(R,open(W+'reviewed.json','w'))
ban=[[k.split('|')[0],int(k.split('|')[1])] for k,v in R.items() if not v['ok']]
good=[[k.split('|')[0],int(k.split('|')[1])] for k,v in R.items() if v['ok']]
json.dump(ban,open(W+'ban.json','w')); json.dump(good,open(W+'good.json','w'))
print('ok',len(good),'bad',len(ban))
import collections; print(collections.Counter(v['why'] for v in R.values() if not v['ok']).most_common(15))
