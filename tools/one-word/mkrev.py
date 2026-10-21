# the pairs chosen and not yet checked -> review batches
import json,os,re,sys
src=open('inc.py').read(); exec(src[:src.index('INC={}')])
days=json.load(open(W+'days.json'))
done=json.load(open(W+'reviewed.json')) if os.path.exists(W+'reviewed.json') else {}
lines=[]
for w,L in days.items():
    info=words[w]; F=forms(w)
    sense=info.get('ref','')
    if info['src']=='main': sense='MannaFish word '+info['w']
    else:
        # the fish's own verse shows the meaning
        for f in json.load(open(S+'edit/daily/data.json'))['fish'] if info['src']=='daily' else []:
            if f['word'].lower()==w: sense=f['ref']+': '+f['verse'][:160]; break
        if info['src']=='year':
            for wk in json.load(open(S+'tools/year-fish/weeks.json'))['weeks']:
                for q in wk['p']:
                    if q[0].lower()==w: sense=q[1]+': '+q[2][:160]
    for i in L:
        key=w+'|'+str(i)
        if key in done: continue
        ch=CH[i]; vs=[]
        for v,txt in enumerate(ch['t']):
            if txt and any(t in F for t in TOK.findall(txt.lower())): vs.append('v%d: %s'%(v+1,txt[:230]))
        lines.append({'id':key,'word':info['w'],'sense':sense,'chapter':B[ch['b']][0]+' '+str(ch['c']),'verses':vs[:5],'more':max(0,len(vs)-5)})
n=int(sys.argv[1]) if len(sys.argv)>1 else 6
os.makedirs(W+'rev',exist_ok=True)
for f in os.listdir(W+'rev'): os.remove(W+'rev/'+f)
k=(len(lines)+n-1)//n if lines else 0
for j in range(n):
    part=lines[j*k:(j+1)*k]
    if part: json.dump(part,open(W+'rev/batch%d.json'%j,'w'),ensure_ascii=False,indent=0)
print(len(lines),'to review in',min(n,(len(lines)+k-1)//k if k else 0),'batches')
