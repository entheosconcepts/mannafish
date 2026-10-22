#!/usr/bin/env python3
"""One Word: a year through the Bible, one MannaFish word a day, four chapters where that word is found (Ken, 21 Oct).

The steps (the work folder W holds the in-between files):
  inc.py     which fish words (main, year, Bible-in-a-Year) are in which KJV chapters, with every form of the word
  solve.py   the year: every chapter exactly once, each day a different word found in all its chapters, at most one New Testament
             chapter most days; an integer program (scipy / HiGHS), the 24 main fish words always in
  mkrev.py   the chosen chapters not yet checked -> batches; each was read to see that the word means the same thing there
             (not "the rest of them" for Rest, not "lie in wait" for Wait), with the best verse to show
  merge.py   the checks -> ban.json (left out next time) and good.json (kept); solve again until every chapter passes
  build.py   this: the days in order (by where each day's first chapter is, Genesis to Revelation) -> plan/oneword.json
"""
import json,os,re,sys
W=sys.argv[1]; S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..')+'/'
src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'inc.py')).read(); g={}
exec(src[:src.index('INC={}')],g)
CH,B,words,forms,TOK,ALIAS=g['CH'],g['B'],g['words'],g['forms'],g['TOK'],g.get('ALIAS',{})
days=json.load(open(W+'days.json')); R=json.load(open(W+'reviewed.json'))
bad=[w+'|'+str(i) for w,L in days.items() for i in L if not R.get(w+'|'+str(i),{}).get('ok')]
if bad and '--draft' not in sys.argv: print('NOT CHECKED OR NOT OK:',bad); sys.exit(1)
# the fish pictures, all in /fish/ (tools/fish/sync.py): fish/en/<KEY>.svg for the main fish, fish/W01a.svg year, fish/D001.svg Bible in a year
yid={}
for wk in json.load(open(S+'tools/year-fish/weeks.json'))['weeks']:
    for j,p in enumerate(wk['p']): yid.setdefault(p[0].lower(),'W%02d%s'%(wk['w'],'abcdefgh'[j]))
out=[]
for w,L in days.items():
    F=forms(w); info=words[w]; ch=[]; seen=set()
    for i in sorted(L):
        c=CH[i]; v=R.get(w+'|'+str(i),{}).get('v') or 0; t=c['t']
        if not(v and 0<v<=len(t) and t[v-1] and any(x in F for x in TOK.findall(t[v-1].lower()))):
            v=next(k+1 for k,x in enumerate(t) if x and any(y in F for y in TOK.findall(x.lower())))
        for k,x in enumerate(t):
            if x: seen|={y for y in TOK.findall(x.lower()) if y in F}
        ch.append([B[c['b']][0],c['c'],v,t[v-1]])
    svg=None
    if info['src']=='main' and os.path.exists(S+'fish/en/%s.svg'%info.get('k')): svg='/fish/en/%s.svg'%info['k']
    elif info['src']=='daily' and os.path.exists(S+'fish/%s.svg'%info.get('k')): svg='/fish/%s.svg'%info['k']
    elif w in yid and os.path.exists(S+'fish/%s.svg'%yid[w]): svg='/fish/%s.svg'%yid[w]
    fk=info.get('k') if info['src'] in ('main','daily') else yid.get(w)
    if info['src']=='main' and not info.get('ref'): info['ref']=(json.load(open(W+'DATA.json')).get(fk,{}).get('refs') or [['']])[0][0]
    kjv=sorted({x for x in seen if x in ALIAS.get(w,[])},key=lambda x:ALIAS[w].index(x))   # the King James word in these chapters, when it is not the fish word
    out.append({'word':info['w'],'src':info['src'],'k':fk,'ref':info.get('ref',''),'svg':svg,'forms':sorted(seen,key=lambda x:(-len(x),x)),'ch':ch,'_k':min(L)})
    if kjv: out[-1]['kjv']=kjv
out.sort(key=lambda d:d['_k'])
for d in out: del d['_k']
json.dump({'note':'One Word: one MannaFish word a day, four KJV chapters where it is found; every chapter of the Bible once. Built by tools/one-word.','days':out},open(S+'plan/oneword.json','w'),ensure_ascii=False,separators=(',',':'))
print('days',len(out),'| with a fish picture',sum(1 for d in out if d['svg']),'| first days:',[d['word'] for d in out[:8]])
