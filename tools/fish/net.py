#!/usr/bin/env python3
"""The net for Go Fish on Today (Ken, 26 Oct: "Put 153 fish in Go Fish" -- John 21:11, "an hundred and fifty and three").
The 24 devotional fish are on the page already; this adds the other 129: the 128 year fish (edit/new/data.json) and, as the 153rd,
Tend (John 21:17, "Feed my sheep"), the Bible-in-a-year fish from the same chapter. Writes fish/net.json [{id, word, ref, verse}]."""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
year = json.load(open(os.path.join(ROOT, 'edit', 'new', 'data.json')))['fish']
daily = {f['k']: f for f in json.load(open(os.path.join(ROOT, 'edit', 'daily', 'data.json')))['fish']}
net = [{'id': 'Y:' + f['k'], 'word': f['word'], 'ref': f['ref'], 'verse': f.get('verse') or (f.get('top', '') + ' ' + f.get('bot', '')).strip()} for f in year]
t = daily['D648']
net.append({'id': 'D:D648', 'word': t['word'], 'ref': t['ref'], 'verse': t.get('verse') or (t.get('top', '') + ' ' + t.get('bot', '')).strip()})
for x in net: assert os.path.exists(os.path.join(ROOT, 'fish', x['id'][2:] + '.svg')), x
json.dump(net, open(os.path.join(ROOT, 'fish', 'net.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(net), 'fish in the net, plus the 24 =', len(net) + 24)

# New designs (Ken, 28 Oct: "add Stop ... and Go ... make sure Repent, Return, Rebuild are among those fish designs ... whenever
# there's a word that's opposite I would like to add that"): fish outside the 153, drawn by tools/fish-format (extra-lines.json:
# node build.js extra-lines.json), and plan fish worth having on their own (Rebuild). Writes fish/designs.json, same shape.
extra = json.load(open(os.path.join(ROOT, 'tools', 'fish-format', 'extra-lines.json')))
des = [{'id': f['id'], 'word': f['word'], 'ref': f['ref'], 'verse': f['verse'], **({'ver': f['ver']} if f.get('ver') else {}), **({'pair': f['pair']} if f.get('pair') else {})} for f in extra]
for k in ['D271']:   # Rebuild (Amos 9:11)
    t = daily[k]; des.append({'id': 'D:' + k, 'word': t['word'], 'ref': t['ref'], 'verse': t.get('verse') or (t.get('top', '') + ' ' + t.get('bot', '')).strip()})
for x in des: assert os.path.exists(os.path.join(ROOT, 'fish', x['id'][2:] + '.svg')), x
json.dump(des, open(os.path.join(ROOT, 'fish', 'designs.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(des), 'new designs')
