import json,re,sys
import opencc
CC=opencc.OpenCC('t2s')
sys.path.insert(0,'.')
from study_i18n import *
B='../bibles/'  # numbered Bible JSON files (scratchpad); writes study.json -> fish-lang/study-<lang>.json
CAN=['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalm','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']
def numbered(f):
  d=json.load(open(B+f));bk=d['books'];assert len(bk)==66,(f,len(bk))
  return [[ [v['text'] for v in sorted(c['verses'],key=lambda v:v['verse'])] if [v['verse'] for v in sorted(c['verses'],key=lambda v:v['verse'])]==list(range(1,len(c['verses'])+1)) else {v['verse']:v['text'] for v in c['verses']} for c in sorted(b['chapters'],key=lambda c:c['chapter'])] for b in bk]
def indexed(f):
  d=json.load(open(B+f));assert len(d)==66;return [b['chapters'] for b in d]
KJV=numbered('KJV.json')
def get(src,b,c,v):
  ch=src[CAN.index(b)][c-1]
  return ch.get(v) if isinstance(ch,dict) else (ch[v-1] if v<=len(ch) else None)
SRC={'tl':[numbered('TagAngBiblia.json')],'de':[numbered('GerElb1905.json')],'ko':[numbered('KorRV.json')],
 'zh':[indexed('zh_cunpss-shen.json'),numbered('ChiUn.json')],'hi':[indexed('hi_irvhin.json')],'el':[indexed('el_fpb.json'),numbered('GreVamvas.json')]}
def okchap(src,b,c,primary_indexed):
  if not primary_indexed: return True
  return len(src[CAN.index(b)][c-1])==len(KJV[CAN.index(b)][c-1])
def clean(l,t):
  t=re.sub(r'<[^>]+>|\{[^}]*\}','',t)
  t=re.sub(r'\s*\((?:[^()]*\d+:\d+[^()]*)\)','',t)  # cross-reference notes
  t=re.sub(r'\[[^\]]*\]','',t)
  if l=='zh': t=re.sub(r'\s+','',t)
  if l=='el': t=t.translate(str.maketrans('ABEZHIKMNOPTYXo','ΑΒΕΖΗΙΚΜΝΟΡΤΥΧο'))
  t=re.sub(r'\s+',' ',t).strip()
  t=t.lstrip('¶ ').strip()
  for a,b in FIX.get(l,[]):
    if t.startswith(a): t=b+t[len(a):]
  return t
def snip(l,t):
  t=t.lstrip('"“”‘’\'「『«»„ ')
  n={'zh':18,'ko':26}.get(l,44)
  if len(t)<=n+6: return t
  if l=='zh':
    s=t[:n]; return s.rstrip('，。；：、「」')+'…'
  s=t[:n]; s=s[:s.rfind(' ')] if ' ' in s else s
  return s.rstrip(',;:·.।') + '…'
FIX={'el':[('ΧΑΙΡΟΜΑΙ','Χαίρομαι'),('ΜΑΚΑΡΙΟΣ','Μακάριος'),('ΠΑΙΔΙΑ','Παιδιά'),('ΣΑΣ','Σας'),('ΤΟΤΕ','Τότε'),('ΨΑΛΤΕ','Ψάλτε'),('ΝΑ ΨΑΛΕΤΕ','Να ψάλετε'),('ΝΑ ΕΠΙΜΕΝΕΤΕ','Να επιμένετε'),('ΝΑ ΤΙΜΑΣ','Να τιμάς')],
 'de':[('Von David. Ein Maskil. ',''),('Ein Psalm. ','')],'ko':[('다윗의 마스길 ',''),('시 새 노래로','새 노래로')]}
log=[]
def verse(l,b,c,v):
  srcs=SRC[l]
  for i,s in enumerate(srcs):
    idx=(l in('zh','hi','el')) and i==0
    if idx and not okchap(s,b,c,True): log.append(f'{l} {b} {c}: chapter length differs, fallback');continue
    t=get(s,b,c,v)
    if t: 
      t=clean(l,t)
      if l=='zh' and i==1: t=CC.convert(t)
      return t
  log.append(f'{l} {b} {c}:{v}: MISSING'); return None
def label(l,ref):
  m=re.match(r'(.+?) (\d+):(\d+)$',ref);b,c,v=m.group(1),int(m.group(2)),int(m.group(3))
  name=BOOKS[l][b]
  return (f'{name} {c},{v}' if l=='de' else f'{name} {c}:{v}'),b,c,v
D=json.load(open('DATA.json'));OUT={}
for l in BOOKS:
  W={}
  for k in KEYS:
    refs=[]
    for ref,_ in D[k]['refs']:
      lab,b,c,v=label(l,ref);t=verse(l,b,c,v);refs.append([lab,snip(l,t) if t else ''])
    W[k]={'gkm':MEAN[l][k][0],'hbm':MEAN[l][k][1],'refs':refs}
  OUT[l]={'labels':LABELS[l],'words':W}
json.dump(OUT,open('study.json','w'),ensure_ascii=False,indent=0)
print('\n'.join(log) or 'no fallbacks')
for l in OUT: print(l, OUT[l]['words']['REST']['refs'][:3], OUT[l]['words']['LOVE']['refs'][0])
