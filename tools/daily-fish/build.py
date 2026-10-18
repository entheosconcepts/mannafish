# python3 -I build.py  -> /home/user/mannafish/edit/daily/data.json (D001..D364) and a repeat report
import json,os,re,glob,collections
D=os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D,'verify.py')).read().split('bad=0')[0].replace('sys.argv','[]'))   # B, K, W, verses()
N=json.load(open('/home/user/mannafish/edit/new/data.json'))
ser={f['w']:f['series'] for f in N['fish']}
fish=[]
for wk in range(1,53):
    L=json.load(open(os.path.join(D,'out','w%02d.json'%wk)))
    assert len(L)==7,(wk,len(L))
    days=[x['day']+x.get('slot','') for x in L]; assert days==['Sun','Mon','Tue','Wed','Thu','Fria','Frib'],(wk,days)
    for x in L:
        b,c,t=verses(x['ref']); lbl=[d['label'] for d in W[wk]['days'] if d['day']==x['day']][0]
        fish.append({'k':'D%03d'%(len(fish)+1),'w':wk,'day':x['day'],'slot':x.get('slot',''),'read':lbl,'series':ser[wk],'word':x['word'],'top':x['top'],'bot':x['bottom'],
                     'ref':x['ref'],'refShort':x['refShort'],'verse':re.sub(r'\s+',' ',t).strip(),'src':x['source']})
c=collections.Counter(f['word'] for f in fish)
print(len(fish),'fish,',len(c),'different words')
for w,n in c.items():
    if n>1: print('REPEAT',w,[(f['k'],f['w'],f['day'],f['src']) for f in fish if f['word']==w])
os.makedirs('/home/user/mannafish/edit/daily',exist_ok=True)
json.dump({'tag':' (KJV)','fish':fish},open('/home/user/mannafish/edit/daily/data.json','w'),ensure_ascii=False)
