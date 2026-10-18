# python3 verify.py out/w01.json [more files]  -- checks every daily fish against the KJV and the week's day plan
import json,re,sys,os
D=os.path.dirname(os.path.abspath(__file__))
B="Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth 1Samuel 2Samuel 1Kings 2Kings 1Chronicles 2Chronicles Ezra Nehemiah Esther Job Psalms Proverbs Ecclesiastes Song Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi Matthew Mark Luke John Acts Romans 1Corinthians 2Corinthians Galatians Ephesians Philippians Colossians 1Thessalonians 2Thessalonians 1Timothy 2Timothy Titus Philemon Hebrews James 1Peter 2Peter 1John 2John 3John Jude Revelation".split()
K=json.loads(open(os.path.join(D,'..','kjvdl','kjv.json'),encoding='utf-8-sig').read())
W={w['week']:w for w in json.load(open(os.path.join(D,'weeks.json')))}
ORIG=set("Rest Hope Love Trust Pray Believe Forgive Give Seek Ask Knock Follow Listen Grow Live Sing Laugh Honor Gather Enjoy Choose Accept Remember Breathe".split())
def book(s):
    s=s.strip(); s={'Psalm':'Psalms','Song of Solomon':'Song'}.get(s,s); return s.replace(' ','')
def verses(ref):
    m=re.match(r'^(.+?) (\d+):(\d+)(?:[–-](\d+))?$',ref.strip())
    if not m: raise ValueError('ref format: "1 Kings 19:12" or "Lamentations 3:22–23"')
    b=book(m.group(1)); bi=B.index(b); c=int(m.group(2)); v1=int(m.group(3)); v2=int(m.group(4) or v1)
    txt=' '.join(K[bi]['chapters'][c-1][v-1] for v in range(v1,v2+1))
    return b,c,re.sub(r'\{[^}]*\}','',txt)
def norm(s): return re.sub(r'\s+([.,;:!?])',r'\1',re.sub(r'\s+',' ',s.replace('’',"'").replace('‘',"'"))).strip().lower()   # the KJV file writes "the LORD ." 
bad=0; seen={}
for f in sys.argv[1:]:
    for x in json.load(open(f)):
        tag=f"{os.path.basename(f)} wk{x.get('week')} {x.get('day')} {x.get('word')}"
        try:
            b,c,t=verses(x['ref'])
        except Exception as e: print('BAD REF',tag,x.get('ref'),e); bad+=1; continue
        w=W[x['week']]; day=[d for d in w['days'] if d['day']==x['day']]
        if not day: print('BAD DAY',tag); bad+=1; continue
        if f"{b} {c}" not in day[0]['chapters']: print('NOT IN TODAY\'S READING',tag,x['ref'],'reading:',day[0]['label']); bad+=1
        full=norm(t)
        for part in ('top','bottom'):
            for frag in re.split(r'\.\.\.|…',x[part]):
                fr=norm(frag).strip(' ')
                if fr and fr not in full and fr.rstrip('.:;,!?') not in full: print('NOT IN THE VERSE',tag,part,'|',frag.strip()); bad+=1
        if len(x['top'])>52 or len(x['bottom'])>62: print('LINE LONG',tag,len(x['top']),len(x['bottom']))
        wd=x['word']
        if not re.match(r"^[A-Z][a-z]{1,8}$",wd): print('WORD SHAPE',tag); bad+=1
        if wd in ORIG: print('ONE OF THE FIRST 24',tag); bad+=1
        if wd in seen and seen[wd]!=tag: print('REPEAT',tag,'also',seen[wd])
        seen[wd]=tag
print('problems:',bad)
