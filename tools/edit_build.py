# The master edit sheet (Ken, 16 Oct: "edit all these in one place so that you get all the updates at once"):
# every fish's wording and word-study meanings, in every language, gathered into edit/data.json for /edit/.
# Run again after the words change:  python3 tools/edit_build.py
import json, re, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p): return open(os.path.join(R, p), encoding='utf8').read()
html = rd('index.html')
def js_obj(name):
    i = html.index('var ' + name + '=') + len(name) + 5
    return json.JSONDecoder().raw_decode(html[i:])[0]
DATA = js_obj('DATA'); ORDER = [k for k in DATA]  # the site's own order
proof = rd('proof/index.html'); i = proof.index('const DATA=') + len('const DATA=')
PD = json.JSONDecoder().raw_decode(proof[i:])[0]
lines = json.loads(rd('tools/more-languages/lines.json'))
FL = json.loads(rd('netlify/functions/lib/fishlines.json'))   # English and Spanish fish lines, as printed
ES = json.loads(rd('netlify/functions/lib/es.json'))          # Spanish meanings ("means": {KEY: [greek, hebrew]})
LANGS = [('A','en','English','English'),('B','es','Spanish','Español'),('C','tl','Tagalog','Tagalog'),('D','zh','Chinese','中文'),('E','hi','Hindi','हिन्दी'),
         ('F','el','Greek','Ελληνικά'),('G','de','German','Deutsch'),('H','ko','Korean','한국어'),('I','he','Hebrew','עברית'),('J','ar','Arabic','العربية')]
order = [it for it in PD['items'] if it['l'] == 'A']
keys = []
for it in order:  # match each numbered English fish to its word key
    k = next(k for k in DATA if DATA[k]['title'].lower() == it['word'].lower())
    keys.append(k)
out = {'langs': [{'l': l, 'code': c, 'name': n, 'native': nv} for l, c, n, nv in LANGS], 'words': [], 'f': {}}
for w, k in enumerate(keys, 1):
    out['words'].append({'n': w, 'key': k, 'en': DATA[k]['title']})
    for l, c, n, nv in LANGS:
        num = f'{w}{l}'
        if c in ('en', 'es'):
            fx = FL[c][k]
            rec = {'word': fx['word'], 'top': fx['top'], 'bot': fx.get('bottom', ''), 'ref': fx['ref']}
        else:
            fx = next(x for x in lines[c]['fish'] if x['key'] == k)
            rec = {'word': fx['word'], 'top': fx['top'], 'bot': fx.get('bottom', ''), 'ref': fx['ref']}
        if c == 'en': rec.update(gkm=DATA[k].get('gkm', ''), hbm=DATA[k].get('hbm', ''))
        elif c == 'es': m = ES.get('means', {}).get(k, ['', '']); rec.update(gkm=m[0], hbm=m[1])
        else:
            st = json.loads(rd(f'fish-lang/study-{c}.json'))['words'].get(k, {})
            rec.update(gkm=st.get('gkm', ''), hbm=st.get('hbm', ''))
        out['f'][num] = rec
os.makedirs(os.path.join(R, 'edit'), exist_ok=True)
json.dump(out, open(os.path.join(R, 'edit/data.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(len(out['words']), 'words x', len(LANGS), 'languages =', len(out['f']), 'fish')
