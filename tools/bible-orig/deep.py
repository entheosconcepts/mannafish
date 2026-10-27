#!/usr/bin/env python3
""""Go deeper" for a word (Ken, 26 Oct): "more information, like it has in the Blue Letter Bible ... how many times it's written in
the Bible, interchangeable words, the Greek and Hebrew meaning ... like shama means to obey, but it also means to hear, and you'll
see it in different passages throughout scripture".

For each Hebrew and Greek word (by Strong's number) it gathers, from the files tools/bible-orig/build.py made (STEPBible.org data,
CC BY 4.0) and the KJV text:
  - how many verses use it, in the Old and New Testament, the books that use it most, and where it is first used
  - the English words the KJV uses for it, with counts
  - its senses (STEPBible's extended Strong's: H8085 "to hear" is hear, obey, proclaim, understand ...), each with how often, its
    English words, and one short verse where it has that sense (the English word marked « »); a word with one sense gets a verse for
    each of its main English words instead
Writes fish-lang/bible/deep/<H|G><n//100>.json  {"H8085": {l, t, d, v, ot, nt, b:[[book,count]..], f:[book,ch,v], k:[[english,count]..],
  s:[[gloss, count, [english..], [book,ch,v,"text with «word»"]]..]}}   (book 0 = Genesis, as everywhere on the site)
"""
import json, os, re
from collections import Counter, defaultdict

SITE = os.path.join(os.path.dirname(__file__), '..', '..')
B = os.path.join(SITE, 'fish-lang', 'bible')
BOOKS = json.loads(re.search(r'^BOOKS = (\[.*\])$', open(os.path.join(os.path.dirname(__file__), 'build.py'), encoding='utf-8').read(), re.M).group(1))
TOK = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
SMALL = set('''a an the of to and in that for unto be is was it his her their them him he she they i me my thy thee thou ye you your our we us not shall will with by from as at on upon all
have hath had has hast didst wilt art wast when did do doth does let were are been being which who whom there then so also even but or if may might should would can could must'''.split())   # little words left out of 'the KJV says it as'

def base(st):
    m = re.match(r'^([HG])0*(\d+)', st or '')
    return m.group(1) + m.group(2) if m else None

# the lexicon (by extended Strong's, e.g. H8085H, G0026)
LEX = {}
for f in os.listdir(os.path.join(B, 'lex')):
    LEX.update(json.load(open(os.path.join(B, 'lex', f), encoding='utf-8')))
def lexkey(st):   # 'H8085H' -> 'H8085H'; 'G0026' -> 'G0026'; tolerate missing padding
    if st in LEX: return st
    m = re.match(r'^([HG])0*(\d+)([A-Z]?)$', st or '')
    if not m: return None
    for k in (m.group(1) + m.group(2).zfill(4) + m.group(3), m.group(1) + m.group(2) + m.group(3)):
        if k in LEX: return k
    return None

occ = defaultdict(list)   # base -> [(sense st, b, c, v, rendering, token idx list)]
for b, name in enumerate(BOOKS):
    c = 1
    while True:
        fo = os.path.join(B, 'orig', name.replace(' ', '_') + '-' + str(c) + '.json')
        fk = os.path.join(B, 'kjv', name.replace(' ', '_') + '-' + str(c) + '.json')
        if not os.path.exists(fo): break
        J = json.load(open(fo, encoding='utf-8')); K = json.load(open(fk, encoding='utf-8'))['t'] if os.path.exists(fk) else []
        for v in sorted(J['v'], key=int):
            o = J['v'][v]; txt = K[int(v) - 1] if int(v) - 1 < len(K) else ''; toks = TOK.findall(txt)
            at = defaultdict(list)
            for j, i in enumerate(o.get('a', [])):
                if i is not None and 0 <= i < len(o['w']): at[i].append(j)
            seen = set()
            for i, w in enumerate(o['w']):
                k = base(w[3])
                if not k or (k, w[3]) in seen: continue
                seen.add((k, w[3]))
                js = sorted(at.get(i, []))
                ren = ' '.join(toks[j] for j in js if j < len(toks) and toks[j].lower() not in SMALL).lower() if js else ''
                occ[k].append((w[3], b, c, int(v), ren, js))
        c += 1

def kjvtext(b, c, v):
    f = os.path.join(B, 'kjv', BOOKS[b].replace(' ', '_') + '-' + str(c) + '.json')
    t = json.load(open(f, encoding='utf-8'))['t']; return t[v - 1] if v - 1 < len(t) else ''
KJVC = {}
def verse(b, c, v):
    k = (b, c)
    if k not in KJVC: KJVC[k] = json.load(open(os.path.join(B, 'kjv', BOOKS[b].replace(' ', '_') + '-' + str(c) + '.json'), encoding='utf-8'))['t']
    t = KJVC[k]; return t[v - 1] if v - 1 < len(t) else ''
def marked(b, c, v, js):
    t = verse(b, c, v); sp = [m.span() for m in TOK.finditer(t)]
    for j in sorted(js, reverse=True):
        if j < len(sp) and t[sp[j][0]:sp[j][1]].lower() not in SMALL: s, e = sp[j]; t = t[:s] + '«' + t[s:e] + '»' + t[e:]
    return t
def example(rows):   # a short verse among these (marked), preferring ones that read on their own
    best = None
    for (st, b, c, v, ren, js) in rows:
        if not ren: continue
        n = len(verse(b, c, v))
        if n < 25: continue
        if best is None or n < best[0]: best = (n, b, c, v, js)
        if n < 90: break
    return [best[1], best[2], best[3], marked(best[1], best[2], best[3], best[4])] if best else None

out = defaultdict(dict)
for k, rows in occ.items():
    senses = Counter(r[0] for r in rows)
    main = max(senses, key=lambda s: senses[s]); lk = lexkey(main); L = LEX.get(lk, {}) if lk else {}
    verses = len({(r[1], r[2], r[3]) for r in rows}); ot = len({(r[1], r[2], r[3]) for r in rows if r[1] < 39})
    books = Counter(r[1] for r in rows).most_common(3)
    ren = Counter(r[4] for r in rows if r[4]).most_common(8)
    e = {'l': L.get('l', ''), 't': L.get('t', ''), 'd': L.get('d', ''), 'v': verses, 'ot': ot, 'nt': verses - ot,
         'b': [[b, n] for b, n in books], 'f': [rows[0][1], rows[0][2], rows[0][3]], 'k': [[w, n] for w, n in ren]}
    S = []
    if len(senses) > 1:
        for st, n in senses.most_common(5):
            sk = lexkey(st); g = LEX.get(sk, {}).get('g', '') if sk else ''
            g = g.split(':', 1)[1].strip() if ':' in g else g
            rs = [r for r in rows if r[0] == st]
            S.append([g, n, [w for w, _ in Counter(r[4] for r in rs if r[4]).most_common(3)], example(rs)])
    else:   # one sense: a verse for each of its main English words (different stems)
        stems = set()
        for w, n in ren:
            st4 = w[:4]
            if st4 in stems: continue
            if n < 2 and S: break   # a one-off rendering is not worth a line of its own
            stems.add(st4); rs = [r for r in rows if r[4] == w]
            S.append([w, n, [w], example(rs)])
            if len(S) >= 3: break
    e['s'] = [s for s in S if s[3]]
    e['one'] = len(senses) == 1
    out[k[0] + str(int(k[1:]) // 100)][k] = e

D = os.path.join(B, 'deep'); os.makedirs(D, exist_ok=True)
for f in os.listdir(D):
    if f.endswith('.json'): os.remove(os.path.join(D, f))
for f, d in out.items():
    json.dump(d, open(os.path.join(D, f + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(sum(len(d) for d in out.values()), 'words,', len(out), 'files')
