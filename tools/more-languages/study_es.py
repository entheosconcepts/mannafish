# Spanish word-study backs (Ken, 9 Oct): the start of each verse from the Reina-Valera 1909 (public domain), the
# same text the Bible reader shows in Spanish; book names as on the site. Writes fish-lang/study-es.json.
import json,re,sys,contextlib,io
sys.path.insert(0,'.')
with contextlib.redirect_stdout(io.StringIO()): import study_build as sb
OUT=sys.argv[1]; ES=json.load(open(sys.argv[2]))
sb.SRC['es']=[sb.numbered('es/SpaRV.json')]
D=json.load(open('DATA.json')); W={}
for k in D:
  refs=[]
  for ref,_ in D[k]['refs']:
    m=re.match(r'(.+?) (\d+):(\d+)$',ref); b,c,v=m.group(1),int(m.group(2)),int(m.group(3))
    t=sb.verse('es',b,c,v); refs.append([(ES['books'].get(b,b))+' '+str(c)+':'+str(v), sb.snip('es',t) if t else ''])
  W[k]={'refs':refs}
json.dump({'labels':{},'words':W},open(OUT,'w'),ensure_ascii=False,separators=(',',':'))
print(W['HOPE']['refs'][:3], sum(1 for k in W for r in W[k]['refs'] if not r[1]))
