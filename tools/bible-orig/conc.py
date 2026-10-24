#!/usr/bin/env python3
"""Every verse where each Greek or Hebrew word is used, for word study in the MannaFish Bible (/bible/).

Ken, 24 Oct: "a mode for each word in scripture to have a hebrew or greek root word if it is clicked on like the ESword
functionality ... and blb". Tap a word: its root, and every verse that uses it, with the KJV words that translate it.

Made from the per-chapter files tools/bible-orig/build.py writes (STEPBible.org data, CC BY 4.0), so no download is needed:
  fish-lang/bible/conc/<G|H><n//100>.json   {"G3056":[[book,chapter,verse,kjv word index,...],...], ...}   (book 0 = Genesis)
"""
import json, os, re

SITE = os.path.join(os.path.dirname(__file__), '..', '..')
ORIG = os.path.join(SITE, 'fish-lang', 'bible', 'orig')
OUT = os.path.join(SITE, 'fish-lang', 'bible', 'conc')
BOOKS = re.search(r'^BOOKS = (\[.*\])$', open(os.path.join(os.path.dirname(__file__), 'build.py'), encoding='utf-8').read(), re.M).group(1)
BOOKS = json.loads(BOOKS)   # the same book order as the site (from build.py)

def key(st):
    m = re.match(r'^([HG])0*(\d+)', st or '')
    return m.group(1) + m.group(2) if m else None

conc = {}
for b, name in enumerate(BOOKS):
    c = 1
    while True:
        f = os.path.join(ORIG, name.replace(' ', '_') + '-' + str(c) + '.json')
        if not os.path.exists(f): break
        J = json.load(open(f, encoding='utf-8'))
        for v in sorted(J['v'], key=int):
            o = J['v'][v]; at = {}
            for i, w in enumerate(o['w']):
                k = key(w[3])
                if k: at.setdefault(k, [])
            for j, i in enumerate(o.get('a', [])):
                if i is not None and i >= 0 and i < len(o['w']):
                    k = key(o['w'][i][3])
                    if k and j not in at[k]: at[k].append(j)
            for k, js in at.items(): conc.setdefault(k, []).append([b, c, int(v)] + js)
        c += 1

os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.json'): os.remove(os.path.join(OUT, f))
files = {}
for k, L in conc.items():
    files.setdefault(k[0] + str(int(k[1:]) // 100), {})[k] = L
for f, d in files.items():
    json.dump(d, open(os.path.join(OUT, f + '.json'), 'w', encoding='utf-8'), separators=(',', ':'))
print(len(conc), 'words,', sum(len(L) for L in conc.values()), 'verses,', len(files), 'files')
