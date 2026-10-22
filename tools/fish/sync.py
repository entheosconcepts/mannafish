#!/usr/bin/env python3
"""Every fish picture lives in ONE place: /fish/ (Ken, 22 Oct: "where it is corrected / edited make sure all fish on the site are
updated simultaneously").

  fish/<lang>/<KEY>.svg   the 24 main fish in 10 languages   (fish/en/REST.svg, fish/es/REST.svg, fish/zh/REST.svg ...)
  fish/W01a.svg ...       the 128 year fish
  fish/D001.svg ...       the Bible-in-a-year fish (tools/daily-fish/export.js draws them from the edit sheet)

The basket, the reading plans and One Word load the pictures from /fish/ directly. A few pages keep their own built-in copy so the
first fish shows without waiting (the home page has English and Spanish inside index.html; Go MannaFish loads match/fish-*.json; the
other languages are fish-lang/<l>.json). This script copies /fish/ into every one of those, so a fish fixed in /fish/ is fixed everywhere:

  python3 tools/fish/sync.py           copy /fish/ into every built-in copy
  python3 tools/fish/sync.py --check   only say which copies differ (nothing is written)
"""
import json,os,sys
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')+'/'
LANGS=['en','es','tl','zh','hi','el','de','ko','he','ar']
CHECK='--check' in sys.argv
dec=json.JSONDecoder()
def src(l):
    d=S+'fish/'+l+'/'; return {f[:-4]:open(d+f,encoding='utf-8').read() for f in sorted(os.listdir(d)) if f.endswith('.svg')}
SRC={l:src(l) for l in LANGS}
KEYS=list(SRC['en'])
def ordered(old,new): return {k:new.get(k,old[k]) for k in old} if old else new   # keep the order the copy already has
bad=[]
def put(path,text,old):
    if text==old: return
    bad.append(path)
    if not CHECK: open(S+path,'w',encoding='utf-8').write(text)
# index.html: FISH (English) and MFI18N.fish (Spanish)
p='index.html'; s=open(S+p,encoding='utf-8').read(); s0=s
j=s.index('FISH={')+5; o,e=dec.raw_decode(s[j:]); s=s[:j]+json.dumps(ordered(o,SRC['en']),ensure_ascii=False)+s[j+e:]
k=s.index('window.MFI18N=')+14; M,e2=dec.raw_decode(s[k:]); M['fish']=ordered(M['fish'],SRC['es']); s=s[:k]+json.dumps(M,ensure_ascii=False,separators=(',',':'))+s[k+e2:]
put(p,s,s0)
# Go MannaFish
for l in ('en','es'):
    p='match/fish-%s.json'%l; old=open(S+p,encoding='utf-8').read()
    put(p,json.dumps(ordered(json.loads(old),SRC[l]),ensure_ascii=False,separators=(',',':')),old)
# the other languages
for l in LANGS[2:]:
    p='fish-lang/%s.json'%l; old=open(S+p,encoding='utf-8').read()
    put(p,json.dumps(ordered(json.loads(old),SRC[l]),ensure_ascii=False,separators=(',',':')),old)
# the old Spanish folder
for key,t in SRC['es'].items():
    p='fish-es/%s.svg'%key; old=open(S+p,encoding='utf-8').read() if os.path.exists(S+p) else None
    put(p,t,old)
print(('differ from /fish/: ' if CHECK else 'updated: ')+(', '.join(bad) if bad else 'nothing, every copy matches /fish/'))
if CHECK and bad: sys.exit(1)
