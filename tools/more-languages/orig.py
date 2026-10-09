# Ken, 9 Oct: "a button that says Greek and Hebrew" on each verse card -- the same chapter in the original language
# (Hebrew Old Testament, Greek New Testament), word by word: the word, how it sounds, what it means, Strong's number.
# Source: STEPBible.org TAHOT (Leningrad codex) and TAGNT (the Greek words the King James translators read, "K"),
# CC BY 4.0, numbered as in English Bibles. Writes fish-lang/orig/<Book>-<ch>.json for every chapter the site reads.
#   python3 tools/more-languages/orig.py <path to STEPBible-Data checkout>
import sys,os,re,json,glob,unicodedata
SB=sys.argv[1]; ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AB={'Genesis':'Gen','Exodus':'Exo','Leviticus':'Lev','Numbers':'Num','Deuteronomy':'Deu','Joshua':'Jos','1_Samuel':'1Sa','1_Kings':'1Ki','1_Chronicles':'1Ch','2_Chronicles':'2Ch','Nehemiah':'Neh','Job':'Job','Psalm':'Psa','Proverbs':'Pro','Ecclesiastes':'Ecc','Song_of_Solomon':'Sng','Isaiah':'Isa','Jeremiah':'Jer','Lamentations':'Lam','Ezekiel':'Ezk','Daniel':'Dan','Hosea':'Hos','Amos':'Amo','Nahum':'Nam','Habakkuk':'Hab','Zephaniah':'Zep','Haggai':'Hag','Malachi':'Mal',
 'Matthew':'Mat','Mark':'Mrk','Luke':'Luk','John':'Jhn','Acts':'Act','Romans':'Rom','1_Corinthians':'1Co','2_Corinthians':'2Co','Galatians':'Gal','Ephesians':'Eph','Philippians':'Php','Colossians':'Col','1_Thessalonians':'1Th','2_Thessalonians':'2Th','1_Timothy':'1Ti','2_Timothy':'2Ti','Hebrews':'Heb','James':'Jas','1_Peter':'1Pe','2_Peter':'2Pe','1_John':'1Jn','Revelation':'Rev'}
want={}
for f in glob.glob(os.path.join(ROOT,'fish-lang/bible/he/*.json')):
  n=os.path.basename(f)[:-5]; b,c=n.rsplit('-',1); want[(AB[b],int(c))]=n
rx=re.compile(r'^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\([^)]*\))?#\d+=(\S*)')
CANT=re.compile('[֑-ֽ֯׀ׅׄ]')
def sn(s):
  m=re.search(r'([GH])0*(\d+)',s or ''); return (m.group(1)+m.group(2)) if m else ''
out={}
for f in sorted(glob.glob(os.path.join(SB,'Translators Amalgamated OT+NT/TAHOT*'))):
  for line in open(f,encoding='utf-8-sig'):
    m=rx.match(line)
    if not m: continue
    b,c,v,typ=m.group(1),int(m.group(2)),int(m.group(3)),m.group(4)
    if (b,c) not in want or not (typ.startswith('L') or typ.startswith('Q')): continue
    col=line.rstrip('\n').split('\t')
    w=CANT.sub('',col[1]).replace('/','').replace('\\','')
    tr=col[2].replace('.','').replace('/','').lower()
    gl=re.sub(r'\s+',' ',col[3].replace('/',' ').replace('<','').replace('>','')).strip()
    br=re.search(r'\{([^}]*)\}',col[4]); s=sn(br.group(1) if br else col[4])
    out.setdefault((b,c),{}).setdefault(v,[]).append([w,tr,gl,s])
for f in sorted(glob.glob(os.path.join(SB,'Translators Amalgamated OT+NT/TAGNT*'))):
  for line in open(f,encoding='utf-8-sig'):
    m=rx.match(line)
    if not m: continue
    b,c,v,typ=m.group(1),int(m.group(2)),int(m.group(3)),m.group(4)
    if (b,c) not in want or not re.search('[Kk]',typ): continue
    col=line.rstrip('\n').split('\t')
    mm=re.match(r'(.*?)\s*\(([^)]*)\)\s*$',col[1]); w,tr=(mm.group(1),mm.group(2)) if mm else (col[1],'')
    out.setdefault((b,c),{}).setdefault(v,[]).append([w.strip(),tr.strip(),re.sub(r'\s+',' ',col[2]).strip(),sn(col[3])])
os.makedirs(os.path.join(ROOT,'fish-lang/orig'),exist_ok=True); tot=0
for k,n in want.items():
  vs=out.get(k)
  if not vs: print('missing',n); continue
  j={'l':'he' if n.split('-')[0] in list(AB)[:28] else 'grc','v':{str(v):vs[v] for v in sorted(vs)}}
  p=os.path.join(ROOT,'fish-lang/orig',n+'.json'); json.dump(j,open(p,'w'),ensure_ascii=False,separators=(',',':')); tot+=os.path.getsize(p)
print(len(want),'chapters',round(tot/1e6,2),'MB')
