#!/usr/bin/env python3
"""Voices from church history, verse by verse (Ken, 7 Nov: "commentaries ... explanations of passages").

From the Commentaries-Database (https://github.com/HistoricalChristianFaith/Commentaries-Database, a public domain dedication): short excerpts
of public-domain commentary that older Christian writers wrote on a verse: John Chrysostom, Augustine, Thomas Aquinas, Jerome, John Calvin,
John Wesley and Martin Luther. Each excerpt keeps its source (title and a link back to the full text on historicalchristian.faith).

  git clone --depth 1 --filter=blob:none --no-checkout https://github.com/HistoricalChristianFaith/Commentaries-Database.git /tmp/comm
  cd /tmp/comm && git sparse-checkout init --cone && git sparse-checkout set "John Chrysostom" "Augustine of Hippo" "Thomas Aquinas" "Jerome" "John Calvin" "John Wesley" "Martin Luther" && git checkout
  python3 tools/bible-comm/build.py /tmp/comm

Writes fish-lang/bible/comm/<Book>.json   {"3:16": [[author, "source title", "excerpt", "url", lastVerse], ...]}  (up to 4 per verse, one per author)
and fish-lang/bible/comm/_authors.json  [{n, y}]   (name, about when)
"""
import json, os, re, sys, tomllib
SITE = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(SITE, 'fish-lang', 'bible', 'comm')
SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/comm'
AUTHORS = ['John Chrysostom', 'Augustine of Hippo', 'Thomas Aquinas', 'Jerome', 'John Calvin', 'John Wesley', 'Martin Luther']
MAXQ, PER = 520, 4
ALIAS = {'Psalms': 'Psalm'}
BOOKS = json.loads(re.search(r'^BOOKS = (\[.*\])$', open(os.path.join(SITE, 'tools', 'bible-orig', 'build.py'), encoding='utf-8').read(), re.M).group(1))

def short(q):
    q = re.sub(r'[ \t]+', ' ', q.strip()); q = re.sub(r'\n{2,}', '\n\n', q)
    if len(q) <= MAXQ: return q
    cut = max(q.rfind('. ', 0, MAXQ), q.rfind('? ', 0, MAXQ), q.rfind('! ', 0, MAXQ), q.rfind('\n', 0, MAXQ))
    return (q[:cut + 1] if cut > 220 else q[:MAXQ].rsplit(' ', 1)[0]) + ' …'

by = {}   # book -> "c:v" -> list
meta = []
for ai, a in enumerate(AUTHORS):
    d = os.path.join(SRC, a)
    md = tomllib.load(open(os.path.join(d, 'metadata.toml'), 'rb')) if os.path.exists(os.path.join(d, 'metadata.toml')) else {}
    y = md.get('default_year'); meta.append({'n': a, 'y': ('c. %d' % y) if y and y > 0 else (('c. %d BC' % -y) if y else '')})
    for f in sorted(os.listdir(d)):
        m = re.match(r'^(.*?) (\d+)(?:_(\d+))?(?:-(\d+))?\.toml$', f)
        if not m: continue
        book = ALIAS.get(m.group(1), m.group(1))
        if book not in BOOKS: continue
        c, v1, v2 = int(m.group(2)), int(m.group(3) or 1), int(m.group(4) or 0)
        try: t = tomllib.load(open(os.path.join(d, f), 'rb'))
        except Exception: continue
        for e in t.get('commentary', []):
            q = (e.get('quote') or '').strip()
            if len(q) < 60: continue
            by.setdefault(book, {}).setdefault('%d:%d' % (c, v1), []).append([ai, e.get('source_title') or '', short(q), e.get('source_url') or '', v2 if v2 > v1 else 0])
os.makedirs(OUT, exist_ok=True)
for fl in os.listdir(OUT): os.remove(os.path.join(OUT, fl))
tot = 0
for book, vs in by.items():
    out = {}
    for k, lst in vs.items():
        seen, pick = set(), []
        for e in sorted(lst, key=lambda x: (x[0], -len(x[2]))):
            if e[0] in seen: continue
            seen.add(e[0]); pick.append(e)
        out[k] = pick[:PER]; tot += len(out[k])
    json.dump(out, open(os.path.join(OUT, book.replace(' ', '_') + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(meta, open(os.path.join(OUT, '_authors.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('books', len(by), '| excerpts', tot)
