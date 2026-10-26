# The whole Bible in each fish language for the MannaFish Bible (Ken, 26 Oct: "I would like to have all scripture to have these options
# available on the bible in any version and language"): every chapter of each language's own Bible, cleaned like the reader chapters
# (chapters.py, which wrote only the chapters the word studies point to). Run where ../bibles/ holds the downloaded Bibles and
# DATA.json is (study_build reads it). Writes fish-lang/bible/<lang>/<Book>-<ch>.json  {v: the version's name, t: [verse 1, ...]}.
import json,os,re,sys,contextlib,io
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
with contextlib.redirect_stdout(io.StringIO()): import study_build as sb
OUT=sys.argv[1]
NAMES={'tl':'Ang Biblia (1905)','de':'Elberfelder (1905)','ko':'개역한글 (1961)','hi':'इंडियन रिवाइज्ड वर्जन (IRV) हिंदी 2019',
 'zh':'和合本（新标点·神版）','zh2':'和合本','el':'Η Αγία Γραφή (FPB)','el2':'Η Αγία Γραφή (Βάμβας, 1850)','he':'המקרא — נוסח המסורה; הברית החדשה בתרגום דליטש',
 'ar':'ترجمة فاندايك (1865) · Arabic Bible Outreach Ministry · STEPBible.org (CC BY-SA 4.0)','es':'Reina-Valera (1909)'}
sb.SRC['es']=[sb.numbered('es/SpaRV.json')]  # Reina-Valera 1909, public domain
# Ken, 26 Oct: the free texts for Chinese and Greek -- the Chinese Union Version of 1919 (in simplified characters) and Vamvas (1850),
# both public domain, in place of the punctuated CUV (1988) and the FPB, which may still be under copyright
sb.SRC['zh']=sb.SRC['zh'][1:]; sb.SRC['el']=sb.SRC['el'][1:]
NAMES['zh']='和合本 (1919)'; NAMES['el']='Η Αγία Γραφή (Βάμβας, 1850)'
KJV=sb.KJV
total=0; files=0; missing=[]
for l in sb.SRC:
  os.makedirs(f'{OUT}/{l}',exist_ok=True)
  for bi,b in enumerate(sb.CAN):
    for c in range(1,len(KJV[bi])+1):
      out=None; name=''
      for i,s in enumerate(sb.SRC[l]):
        idx=l=='hi' and i==0
        if idx and not sb.okchap(s,b,c,True): continue
        try: ch=s[bi][c-1]
        except (IndexError,KeyError,TypeError): continue
        vs=ch if isinstance(ch,list) else [ch.get(v,'') for v in range(1,max(ch)+1)] if ch else []
        if not vs: continue
        out=[]
        for t in vs:
          t=sb.clean(l,t or '')
          if l=='zh': t=sb.CC.convert(t)   # traditional characters to simplified
          out.append(t)
        name=NAMES[l]
        break
      if not out or not any(out): missing.append(f'{l} {b} {c}'); continue
      f=f"{OUT}/{l}/{b.replace(' ','_')}-{c}.json"
      json.dump({'v':name,'t':out},open(f,'w'),ensure_ascii=False,separators=(',',':')); total+=os.path.getsize(f); files+=1
print(files,'chapters,',total//1024//1024,'MB; missing',len(missing),missing[:12])
