import json,sys,re,os
D='/tmp/claude-0/-home-user-majestic-crm/9a700bef-1320-54c1-abaf-aa01732f367f/scratchpad/step/'
M=json.load(open(D+'master-en.json'))
for l in sys.argv[1:]:
  f=D+f'lex-{l}.json'
  if not os.path.exists(f): print(l,'missing'); continue
  try: J=json.load(open(f))
  except Exception as e: print(l,'BAD JSON',e); continue
  bad=[]
  if set(J.get('labels',{}))!=set(M['labels']): bad.append('labels '+str(set(M['labels'])^set(J.get('labels',{}))))
  for k,m in M['words'].items():
    w=J['words'].get(k)
    if not w: bad.append(k+' missing'); continue
    for q in ['s','p','d','k','use','note']:
      if not isinstance(w.get(q),str) or (m[q] and not w[q].strip()): bad.append(f'{k}.{q}')
    if len(w.get('senses',[]))!=len(m['senses']): bad.append(k+'.senses n')
    if len(w.get('related',[]))!=len(m['related']): bad.append(k+'.related n')
    for a,b in zip(w.get('related',[]),m['related']):
      if a[:3]!=b[:3]: bad.append(k+'.related changed')
    for num in re.findall(r'[GH]\d+',m['d']):
      if num not in w['d']: bad.append(k+'.d lost '+num)
    for v in re.findall(r'\d+:\d+',m['use']):
      if v not in w['use']: bad.append(k+'.use lost '+v)
  print(l,'OK' if not bad else bad[:12], len(J['words']))
