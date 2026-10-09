# Reader chapters in each fish language (Ken, 9 Oct): every chapter the word studies point to, from that language's
# own Bible, cleaned the same way as the word-study snippets. Writes fish-lang/bible/<lang>/<Book>-<ch>.json.
import json,os,re,sys,contextlib,io
sys.path.insert(0,'.')
with contextlib.redirect_stdout(io.StringIO()): import study_build as sb
OUT=sys.argv[1]
NAMES={'tl':'Ang Biblia (1905)','de':'Elberfelder (1905)','ko':'개역성경','hi':'इंडियन रिवाइज्ड वर्जन (IRV) हिंदी 2019',
 'zh':'和合本（新标点·神版）','zh2':'和合本','el':'Η Αγία Γραφή (FPB)','el2':'Η Αγία Γραφή (Βάμβας, 1850)'}
D=json.load(open('DATA.json'))
chs=sorted({(re.match(r'(.+) (\d+):',r).group(1),int(re.match(r'(.+) (\d+):',r).group(2))) for k in D for r,_ in D[k]['refs']})
total=0
for l in sb.SRC:
  os.makedirs(f'{OUT}/{l}',exist_ok=True)
  for b,c in chs:
    for i,s in enumerate(sb.SRC[l]):
      idx=(l in('zh','hi','el')) and i==0
      if idx and not sb.okchap(s,b,c,True): continue
      ch=s[sb.CAN.index(b)][c-1]
      vs=ch if isinstance(ch,list) else [ch.get(v,'') for v in range(1,max(ch)+1)]
      out=[]
      for t in vs:
        t=sb.clean(l,t or '')
        if l=='zh' and i==1: t=sb.CC.convert(t)
        out.append(t)
      name=NAMES[l+('2' if i==1 else '')]
      break
    f=f"{OUT}/{l}/{b.replace(' ','_')}-{c}.json"
    json.dump({'v':name,'t':out},open(f,'w'),ensure_ascii=False,separators=(',',':')); total+=os.path.getsize(f)
print(len(chs),'chapters x',len(sb.SRC),'languages,',total//1024,'KB')
