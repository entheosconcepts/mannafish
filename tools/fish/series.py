#!/usr/bin/env python3
"""Which fish are in use and which are held back (Ken, 8 Nov: "isolate all the words that are not action words and put them in another section,
not to be used until further ... all MannaFish are to be action words in the middle of the fish, and that word must be used in the context of the
scripture"). Reads the hand-sorted lists in docs/FISH-ACTION-WORDS.md and writes fish/series.json:
  use                      the action fish whose word is in the words on the fish or in its verse: these go round in the daily email, push, text
  hold.notaction / .maybe  held back, "Uncategorized": not sent anywhere until Ken decides what series they belong to
  hold.notinverse          an action fish whose word is not in its verse (held, unless it is in `keep`)
  keep                     fish kept in use on purpose although the word is not in the verse (Remember: Ken's open question B)
  python3 tools/fish/series.py     then python3 tools/fish/catch.py"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
KEEP = ['REMEMBER']
def forms(w):
    w = w.lower(); s = {w}; b = w[:-1] if w.endswith('e') else w
    for suf in ['s','es','ed','d','n','r','eth','th','est','st','ing','er','ers','ness','ly','ful','ment','ous','lous','ion','ation','k','hood','en']:
        s.add(w + suf); s.add(b + suf)
    if re.search(r'[^aeiou][aeiou][bdglmnprt]$', w):
        for suf in ['ed','eth','ing','est','er']: s.add(w + w[-1] + suf)
    if w.endswith('y'):
        for suf in ['ied','ieth','ies','iest']: s.add(w[:-1] + suf)
    return s
inverse = lambda word, text: bool(forms(word) & set(re.findall(r"[a-z]+", text.lower())))
doc = open(os.path.join(ROOT, 'docs/FISH-ACTION-WORDS.md')).read()
a, b = doc.index('## Not action words'), doc.index('## Maybe')
def parse(sec):
    out = {}
    for m in re.finditer(r'^- \*\*(.+?)\*\*: (.+)$', sec, re.M):
        for i in re.split(r',\s*', m.group(2).strip()): out[i.strip()] = m.group(1)
    return out
notact, maybe = parse(doc[a:b]), parse(doc[b:])
c = json.load(open(os.path.join(ROOT, 'fish/catch.json'))); FL = json.load(open(os.path.join(ROOT, 'netlify/functions/lib/fishlines.json')))['en']
fish = {x['k']: (x['title'], FL[x['k']]['top'] + ' ' + FL[x['k']]['bottom']) for x in c['core']}
for k, v in c['fish'].items(): fish[k] = (v['title'], v['top'] + ' ' + v['bottom'] + ' ' + v['verse'])
use, noverse = [], []
for k, (w, t) in fish.items():
    if k in notact or k in maybe: continue
    if inverse(w, t) or k in KEEP: use.append(k)
    else: noverse.append(k)
out = {'note': 'Made by tools/fish/series.py from docs/FISH-ACTION-WORDS.md. Held fish are not sent anywhere until Ken decides their series.',
       'use': use, 'hold': {'notaction': sorted(notact), 'maybe': sorted(maybe), 'notinverse': noverse}, 'keep': KEEP}
json.dump(out, open(os.path.join(ROOT, 'fish/series.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(use), 'in use;', len(notact), 'not action;', len(maybe), 'maybe;', len(noverse), 'action but word not in verse', noverse)
