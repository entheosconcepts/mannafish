#!/usr/bin/env python3
"""The daily catch for the English inbox (Ken, 1 Nov: "I want all of them available, please").
Every fish with a picture goes round: Ken's 24 devotional fish, the 128 year fish and Tend (the Go Fish net), the new designs, and
the Bible-in-a-year fish. Each week's Sunday fish is one of the 24 (they have the full word study); the other six days are the
rest, taking turns between the year fish, the Bible-in-a-year fish and the new designs so the days don't all come from one book.
Writes netlify/functions/lib/catch.json (the email/text/push side) and fish/catch.json (the /fish/ page).
   python3 tools/fish/catch.py      (then node tools/fish/catch-img.mjs for the email pictures of any new fish)"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
words = J('netlify/functions/lib/words.json'); core = words['order']
net, designs, plan = J('fish/net.json'), J('fish/designs.json'), J('edit/daily/data.json')['fish']
lines = {x['k']: x for x in J('tools/fish-format/net-lines.json') + J('tools/fish-format/extra-lines.json') + plan}
def snip(t):
    t = re.sub(r'[\s,;:.…]+$', '', t.strip()); return t
fish, seen = {}, set(core)
# the same verse only once (a Bible-in-a-year fish can repeat a year fish's verse, like Provide on Genesis 22:8)
same = {J('netlify/functions/lib/fishlines.json')['en'][k]['ref'] for k in core}
def add(k, word, ref, verse, ver=None):
    if k in seen or ref in same or not os.path.exists(os.path.join(ROOT, 'fish', k + '.svg')): return None
    L = lines.get(k, {}); seen.add(k); same.add(ref)
    fish[k] = {'title': word, 'ref': ref, 'top': L.get('top', ''), 'bottom': L.get('bot', ''), 'verse': verse, 'snip': snip(L.get('top') or verse.split(',')[0]),
               'ver': ver or 'KJV', 'url': '/fish/?id=' + k}
    return k
year = [add(x['id'][2:], x['word'], x['ref'], x['verse'], x.get('ver')) for x in net]
new = [add(x['id'][2:], x['word'], x['ref'], x['verse'], x.get('ver')) for x in designs]
daily = [add(x['k'], x['word'], x['ref'], x['verse']) for x in plan]
year, new, daily = [k for k in year if k], [k for k in new if k], [k for k in daily if k]
# take turns: the new designs first (they are new), then a year fish, a Bible-in-a-year fish, ...
others, i, j = list(new), 0, 0
while i < len(year) or j < len(daily):
    if i < len(year): others.append(year[i]); i += 1
    if j < len(daily): others.append(daily[j]); j += 1
order, w = [], 0
while w * 6 < len(others):
    order.append(core[w % len(core)]); order += others[w * 6:(w + 1) * 6]; w += 1
while len(order) % 7: order.append(others[(len(order)) % len(others)])
out = {'note': 'Ken, 1 Nov: every fish in the English daily inbox. Sunday is one of the 24; Monday to Saturday the rest. Made by tools/fish/catch.py',
       'order': order, 'fish': fish}
json.dump(out, open(os.path.join(ROOT, 'netlify/functions/lib/catch.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
FL = J('netlify/functions/lib/fishlines.json')['en']
json.dump({'core': [{'k': k, 'title': words['words'][k]['title'], 'ref': FL[k]['ref']} for k in core], 'net': [x['id'][2:] for x in net],
           'fish': {k: {x: v[x] for x in ('title', 'ref', 'top', 'bottom', 'verse', 'ver')} for k, v in fish.items()}},
          open(os.path.join(ROOT, 'fish/catch.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(core), 'devotional fish +', len(fish), 'more =', len(core) + len(fish), 'fish;', len(order), 'days in the round (', len(order) // 7, 'weeks )')
