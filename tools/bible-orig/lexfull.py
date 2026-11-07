#!/usr/bin/env python3
"""Full lexicon entries for the word study (Ken, 7 Nov: "commentaries, or explanations of passages" like the Blue Letter Bible).

From STEPBible-Data (https://github.com/STEPBible/STEPBible-Data, Lexicons/, data created by STEPBible.org based on work at Tyndale House
Cambridge, CC BY 4.0):
  TBESG  Greek:  the Abbott-Smith Manual Greek Lexicon (public domain), gaps filled from the Middle Liddell-Scott
  TBESH  Hebrew: the Brown-Driver-Briggs outline of meanings (BDB, public domain, via OpenScriptures)
Writes fish-lang/bible/lexfull/<H|G><n//100>.json  {"H8085": "<b>..</b><br>1) ..."}  (only <b>, <i> and <br> are kept)

  git clone --depth 1 https://github.com/STEPBible/STEPBible-Data.git /tmp/step
  python3 tools/bible-orig/lexfull.py /tmp/step/Lexicons
"""
import json, os, re, sys, glob
SITE = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(SITE, 'fish-lang', 'bible', 'lexfull')
src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/step/Lexicons'
MAX = 3600

def clean(h):
    h = re.sub(r"<ref='([^']*)'>(.*?)</ref>", r'\2', h, flags=re.S)           # a verse reference becomes plain text
    h = re.sub(r'<\s*br\s*/?\s*>', '<br>', h, flags=re.I)
    h = re.sub(r'(?i)<(?!/?(b|i|br)\b)[^>]*>', '', h)                         # only b, i, br survive
    h = re.sub(r'(<br>\s*){2,}', '<br>', h); h = re.sub(r'__+', '&emsp;', h)
    h = h.replace('&emsp;', '').replace('†', '').strip()
    h = re.sub(r'^[:\s]+', '', h); h = re.sub(r'^(<br>\s*)+', '', h)
    if len(h) > MAX:
        cut = h.rfind('<br>', 0, MAX); h = h[:cut if cut > 800 else MAX] + '<br><i>…</i>'
    return h

def read(name, col_def):
    d = {}
    for line in open(os.path.join(src, name), encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) < 8 or not re.match(r'^[HG]\d{4}', p[0]): continue
        m = re.match(r'^([HG])0*(\d+)', p[0]); k = m.group(1) + m.group(2)
        if k in d or '= a Part of' in p[1] or not p[col_def].strip(): continue   # the first main row of each Strong's number
        d[k] = clean(p[col_def])
    return d

files = glob.glob(os.path.join(src, 'TBESG*')) + glob.glob(os.path.join(src, 'TBESH*'))
G = read(os.path.basename([f for f in files if 'TBESG' in f][0]), 7)
H = read(os.path.basename([f for f in files if 'TBESH' in f][0]), 7)
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.json')): os.remove(f)
groups = {}
for d in (G, H):
    for k, v in d.items(): groups.setdefault(k[0] + str(int(k[1:]) // 100), {})[k] = v
for g, d in groups.items(): json.dump(d, open(os.path.join(OUT, g + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('Greek entries', len(G), '| Hebrew entries', len(H), '| files', len(groups))
