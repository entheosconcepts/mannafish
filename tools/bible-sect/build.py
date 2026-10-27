#!/usr/bin/env python3
"""Passages for "In context" (Ken, 27 Oct: "instead of just a little passage, maybe reveal and read the whole chapter, or if it's
between chapters, back up to where it is relevant, and read through till it is clearly done with the context").

The Bible is cut into passages that each tell one thing, by chapter and verse, so the same passages serve every version and
language on the site (the devotional, /api/passage, and any future MannaFish app):
  1. the section headings of the Berean Standard Bible (public domain): where each passage starts
  2. a passage at the start of a chapter that carries on the one before it ("Therefore ...", "Wherefore ...", "For ...") is
     joined to it, and so is one at the end of a chapter whose last verse runs on (ends with , ; or :), so the reading
     backs up to where it is relevant and reads through until it is clearly done
  3. a very long passage (Psalm 119, a genealogy) is cut at the KJV's own paragraphs into parts of about 8 to 30 verses
Sources (https://github.com/seven1m/open-bibles): eng-bsb.usfx.xml and eng-kjv.osis.xml
  python3 tools/bible-sect/build.py eng-bsb.usfx.xml eng-kjv.osis.xml
Writes fish-lang/bible/sect/<Book>.json  [[from chapter, from verse, to chapter, to verse, "heading"], ...]  (in order, no gaps)
"""
import json, os, re, sys

SITE = os.path.join(os.path.dirname(__file__), '..', '..')
BOOKS = json.loads(re.search(r'^BOOKS = (\[.*\])$', open(os.path.join(SITE, 'tools', 'bible-orig', 'build.py'), encoding='utf-8').read(), re.M).group(1))
IDS = 'GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split()
LONG, PART = 40, 30            # a passage longer than LONG verses is cut into parts of at most about PART
BACK = re.compile(r"^(?:\W*\w+\W+){0,5}?(therefore|wherefore)\b|^\W*for\s", re.I)   # "carries on what came before"
JOIN = 30                      # a joined passage stays at most this long
STANZA = 'Aleph Beth Gimel Daleth He Vau Zain Cheth Teth Jod Caph Lamed Mem Nun Samech Ain Pe Tzaddi Koph Resh Schin Tau'.split()

# 1. passage starts from the BSB headings
src = open(sys.argv[1], encoding='utf-8').read()
TOK = re.compile(r'<book id="([A-Z0-9]+)"|<c id="(\d+)"\s*/>|<s style="s\d?">(.*?)</s>|<v id="(\d+)[^"]*"', re.S)
heads, b, c, head = {}, None, 0, None
for m in TOK.finditer(src):
    if m.group(1): b = IDS.index(m.group(1)) if m.group(1) in IDS else None; c = 0; head = None; heads.setdefault(b, {})
    elif m.group(2): c = int(m.group(2))
    elif m.group(3) is not None: head = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', m.group(3))).strip(); head = '' if head.startswith('(') else head
    elif m.group(4) and b is not None:
        if head is not None or not heads[b]: heads[b][(c, int(m.group(4)))] = head or ''; head = None

# the KJV's paragraphs (verse ids that begin a <p>)
k = open(sys.argv[2], encoding='utf-8').read()
para = set()
for m in re.finditer(r'<p>\s*(?:<[^v][^>]*>\s*)*<verse osisID="([^".]+)\.(\d+)\.(\d+)"', k):
    if m.group(1) in OSIS: para.add((OSIS.index(m.group(1)), int(m.group(2)), int(m.group(3))))

def kjv(b, c):
    f = os.path.join(SITE, 'fish-lang', 'bible', 'kjv', BOOKS[b].replace(' ', '_') + '-' + str(c) + '.json')
    return json.load(open(f, encoding='utf-8'))['t'] if os.path.exists(f) else None

D = os.path.join(SITE, 'fish-lang', 'bible', 'sect'); os.makedirs(D, exist_ok=True)
stats = {'passages': 0, 'joined': 0, 'cut': 0}
for b, name in enumerate(BOOKS):
    T, c = {}, 1
    while True:
        t = kjv(b, c)
        if t is None: break
        T[c] = t; c += 1
    vs = [(c, v) for c in T for v in range(1, len(T[c]) + 1)]
    H = heads.get(b, {})
    starts = [i for i, x in enumerate(vs) if x in H] or [0]
    if starts[0] != 0: starts.insert(0, 0)
    P = [[s, e, H.get(vs[s], '')] for s, e in zip(starts, starts[1:] + [len(vs)])]   # [start idx, end idx (excl), heading]
    # 2. join passages across a chapter break when the words carry on
    out = []
    for p in P:
        if out:
            q = out[-1]; (c0, v0), (c1, _) = vs[p[0]], vs[q[1] - 1]
            first, last = T[c0][v0 - 1], T[c1][-1]
            joins = c0 != c1 and v0 == 1 and (BACK.search(first) or re.search(r'[,;]\W*$', last))
            if joins and (p[1] - q[0]) <= JOIN: q[1] = p[1]; q[2] = q[2] or p[2]; stats['joined'] += 1; continue
        out.append(p[:])
    # 3. cut very long passages at the KJV paragraphs
    fin = []
    for s, e, h in out:
        if name == 'Psalm' and vs[s][0] == 119:   # the 22 stanzas of 8 verses, one for each Hebrew letter
            for j in range(s, e, 8): fin.append([j, min(e, j + 8), 'Psalm 119 \u00b7 ' + STANZA[(j - s) // 8]])
            continue
        if e - s <= LONG: fin.append([s, e, h]); continue
        cuts = [i for i in range(s + 1, e) if (b,) + vs[i] in para]
        part, a = [], s
        for i in cuts + [e]:
            if i - a >= 8 and (i - a >= PART or i == e or (cuts and i == cuts[-1])):
                part.append([a, i]); a = i
            elif i == e: (part[-1].__setitem__(1, e) if part else part.append([a, e]))
            elif i - a > PART: part.append([a, i]); a = i
        # parts still too long (no paragraph marks): even slices
        res = []
        for a, z in part:
            n = max(1, round((z - a) / 25))
            step = (z - a) / n
            res += [[a + round(j * step), a + round((j + 1) * step)] for j in range(n)]
        for j, (a, z) in enumerate(res): fin.append([a, z, h if j == 0 else (h + ' (continued)' if h else '')])
        stats['cut'] += 1
    rows = [[vs[s][0], vs[s][1], vs[e - 1][0], vs[e - 1][1], h] for s, e, h in fin]
    stats['passages'] += len(rows)
    json.dump(rows, open(os.path.join(D, name.replace(' ', '_') + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(stats)
