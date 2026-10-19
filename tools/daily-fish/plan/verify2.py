# python3 -I verify2.py out/*.json  -- checks the new plan fish
import json,re,sys,os,glob
D=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(D,'..','daily','verify.py')).read().split('bad=0')[0].replace('sys.argv','[]').replace("os.path.join(D,'weeks.json')","os.path.join(D,'..','daily','weeks.json')").replace("os.path.join(D,'..','kjvdl','kjv.json')","os.path.join(D,'..','kjvdl','kjv.json')")
exec(src)
S=json.load(open(os.path.join(D,'slots.json'))); used=set(open(os.path.join(D,'used.txt')).read().split())
bad=0; seen={}
for f in sys.argv[1:]:
    for x in json.load(open(f)):
        tag=f"{os.path.basename(f)} slot{x.get('slot')} {x.get('word')}"
        try: b,c,t=verses(x['ref'])
        except Exception as e: print('BAD REF',tag,x.get('ref'),e); bad+=1; continue
        s=S[x['slot']]
        if s['keep']: print('SLOT ALREADY HAS A FISH',tag); bad+=1
        if f"{b} {c}" not in s['chapters']: print('NOT IN THIS READING',tag,x['ref'],'reading:',s['label']); bad+=1
        full=norm(t)
        for part in ('top','bottom'):
            for frag in re.split(r'\.\.\.|…',x[part]):
                fr=norm(frag).strip(' ')
                if fr and fr not in full and fr.rstrip('.:;,!?') not in full: print('NOT IN THE VERSE',tag,part,'|',frag.strip()); bad+=1
        if len(x['top'])>52 or len(x['bottom'])>62: print('LINE LONG',tag,len(x['top']),len(x['bottom'])); bad+=1
        wd=x['word']
        if not re.match(r"^[A-Z][a-z]{2,7}$",wd): print('WORD SHAPE',tag); bad+=1
        if wd in ORIG or wd in used: print('WORD ALREADY USED',tag); bad+=1
        if wd in seen: print('REPEAT',tag,'also',seen[wd]); bad+=1
        seen[wd]=tag
print('fish:',len(seen),'problems:',bad)
