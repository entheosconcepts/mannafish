#!/usr/bin/env python3
"""Cross references for the MannaFish Bible (OpenBible.info, CC BY): python3 build.py cross_references.txt
Download: https://www.openbible.info/labs/cross-references/ (cross_references.txt: From Verse, To Verse, Votes).

Writes fish-lang/bible/xref/<Book>.json   {"c:v": [[book,ch,v(,end ch or 0,end v)], ...up to 8, strongest first],
                                           "_k": {"c:v": n, ...}}
n = how many of a verse's references are strong (KEY votes or more, the first n of its list). Ken, 27 Oct: a reference
icon in the text, like a printed Bible's cross references, on the verses that have strong ones (about one verse in five),
clickable; every version and language uses the same file, since it goes by book, chapter and verse. Extra keys such as _k are
ignored by anything that reads only "c:v", so the format can grow.
"""
import json, os, sys, collections
KEY = 10
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OS = "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split()
NAMES = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"]
idx = {b: i for i, b in enumerate(OS)}
def p(s):
    b, c, v = s.split('.'); return idx[b], int(c), int(v)
D = collections.defaultdict(list); bad = 0
for line in open(sys.argv[1], encoding='utf-8'):
    if line.startswith('From') or not line.strip(): continue
    f, t, votes = line.rstrip('\n').split('\t'); votes = int(votes)
    if votes < 3: continue
    try:
        a = p(f); parts = t.split('-'); s = p(parts[0]); e = p(parts[1]) if len(parts) > 1 else None
    except Exception:
        bad += 1; continue
    item = [s[0], s[1], s[2], votes]
    if e and e != s and e[0] == s[0]: item = [s[0], s[1], s[2], votes, e[1] if e[1] != s[1] else 0, e[2]]
    D[a].append(item)
out = os.path.join(SITE, 'fish-lang', 'bible', 'xref'); os.makedirs(out, exist_ok=True); keyed = 0
for bi, name in enumerate(NAMES):
    B, K = {}, {}
    for (b, c, v), L in sorted(D.items()):
        if b != bi: continue
        L.sort(key=lambda x: -x[3]); top = L[:8]; B['%d:%d' % (c, v)] = [x[:3] + x[4:] for x in top]
        n = sum(1 for x in top if x[3] >= KEY)
        if n: K['%d:%d' % (c, v)] = n; keyed += 1
    B['_k'] = K
    json.dump(B, open(os.path.join(out, name.replace(' ', '_') + '.json'), 'w'), separators=(',', ':'))
print('bad', bad, 'verses with refs', len(D), 'verses with strong refs (icon)', keyed)
