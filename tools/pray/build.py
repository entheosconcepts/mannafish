#!/usr/bin/env python3
"""Time with God (/pray/): the daily words with their verses filled in from the Berean Standard Bible (public domain since 2023).
   python3 tools/pray/build.py <content.json written by hand or helper> <BSB.txt>  ->  pray/content.json
Each pool has a different length (13, 31, 29, 31, 23, 29, 19, 17), so the mix of the steps is new every day."""
import json, re, sys, os
src, bsb = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'pray', 'content.json')
NAME = {'Psalms': 'Psalm', 'Revelation of John': 'Revelation'}
ROM = {'I ': '1 ', 'II ': '2 ', 'III ': '3 '}
V, book = {}, None
for line in open(bsb, encoding='utf-8'):
    line = line.rstrip('\n')
    m = re.match(r'^### (.+)$', line)
    if m:
        book = m.group(1)
        for k, v in ROM.items():
            if book.startswith(k): book = v + book[len(k):]
        book = NAME.get(book, book); continue
    m = re.match(r'^\[(\d+):(\d+)\] (.*)$', line)
    if m and book: V[(book, int(m.group(1)), int(m.group(2)))] = m.group(3).strip()
def verse(ref):
    m = re.match(r'^(.+?)\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?$', ref.strip())
    if not m: raise SystemExit('bad reference: ' + ref)
    b, c, v1, v2 = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4) or m.group(3))
    t = [V.get((b, c, v)) for v in range(v1, v2 + 1)]
    if not all(t): raise SystemExit('not found in the BSB: ' + ref)
    t = ' '.join(t)
    t = re.sub(r'\s+', ' ', t).strip()
    # a psalm's heading is part of its first verse in the BSB ("For the choirmaster. A Psalm of David.") -- the prayer shows the verse itself
    if b == 'Psalm' and v1 == 1:
        while True:
            m2 = re.match(r'^(For the choirmaster|A Psalm|A psalm|A song|A Song|A Maskil|A Miktam|To the tune|According to|Of David|A prayer|A Prayer|On )(?:[^.“]|“[^”]*”)*\.?\s*', t)
            if not m2: break
            t = t[m2.end():]
    if t[:1].islower(): t = '…' + t
    return {'ref': ref.replace('-', '–'), 't': t}
C = json.load(open(src, encoding='utf-8'))
want = {'arrive': 13, 'honor': 31, 'thanks': 29, 'concerns': 31, 'others': 23, 'response': 29, 'listen': 19, 'closing': 17}
for k, n in want.items():
    if len(C.get(k, [])) != n: print('note:', k, 'has', len(C.get(k, [])), 'not', n)
    for x in C.get(k, []):
        if x.get('ref'): x['v'] = verse(x['ref']); x['ref'] = x['v']['ref']
json.dump(C, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('pray/content.json:', {k: len(C.get(k, [])) for k in want}, os.path.getsize(OUT), 'bytes')
