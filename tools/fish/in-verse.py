#!/usr/bin/env python3
"""The word in the middle of a fish must be in its verse (Ken, 2 Nov: "Middle fish word must exist in the scripture in order for
it to qualify"). in-verse.txt gives each fish that failed a word taken from the verse lines on that fish (an action word where the
lines have a good one, else the word the verse turns on). This writes those words into every list the fish are drawn and shown from;
then: node tools/fish-format/build.js (and daily-lines.json), python3 tools/fish/net.py, catch.py, catch-img.
  python3 tools/fish/in-verse.py --check    lists any fish whose word is not in its verse lines (nothing is written)
A word counts as in the verse when a word there is it or it with an ending: Deliver (delivered), Atone (atonement), Prosper
(prosperous), Profess (profession), Refine (refiner)."""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); H = os.path.dirname(os.path.abspath(__file__))
def forms(w):
    w = w.lower(); s = {w}; b = w[:-1] if w.endswith('e') else w
    for suf in ['s', 'es', 'ed', 'd', 'n', 'r', 'eth', 'th', 'est', 'st', 'ing', 'er', 'ers', 'ness', 'ly', 'ful', 'ment', 'ous', 'lous', 'ion', 'ation', 'k', 'hood', 'en']:
        s.add(w + suf); s.add(b + suf)
    if re.search(r'[^aeiou][aeiou][bdglmnprt]$', w):
        for suf in ['ed', 'eth', 'ing', 'est', 'er']: s.add(w + w[-1] + suf)
    if w.endswith('y'):
        for suf in ['ied', 'ieth', 'ies', 'iest']: s.add(w[:-1] + suf)
    return s
def inverse(word, text): return bool(forms(word) & set(re.findall(r"[a-z]+", text.lower())))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
def save(p, d): json.dump(d, open(os.path.join(ROOT, p), 'w'), ensure_ascii=False, separators=(',', ':'))
if '--check' in sys.argv:
    bad = 0
    for fn in ['net-lines.json', 'daily-lines.json', 'extra-lines.json']:
        for f in J('tools/fish-format/' + fn):
            if not inverse(f['word'], f.get('top', '') + ' ' + f.get('bot', '')): bad += 1; print(fn, f['k'], f['word'], '|', f.get('top', ''), f.get('bot', ''))
    print(bad, 'fish whose word is not in their verse'); sys.exit(1 if bad else 0)
NEW = dict(l.split() for l in open(os.path.join(H, 'in-verse.txt')) if l.strip())
def fix(o):
    n = 0
    if isinstance(o, dict):
        k = o.get('k') or (o.get('id') or '').split(':')[-1]
        if 'word' in o and k in NEW and o['word'] != NEW[k]: o['word'] = NEW[k]; n += 1
        for v in o.values(): n += fix(v)
    elif isinstance(o, list):
        for v in o: n += fix(v)
    return n
for p in ['edit/new/data.json', 'edit/daily/data.json', 'tools/fish-format/net-lines.json', 'tools/fish-format/daily-lines.json', 'plan/plan.json', 'plan/year365.json']:
    d = J(p); n = fix(d); save(p, d); print(p, n, 'words changed')
