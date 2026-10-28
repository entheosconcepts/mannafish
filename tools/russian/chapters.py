#!/usr/bin/env python3
"""Russian Bible for MannaFish (Ken, 28 Oct: "yes add Russian"): the Synodal translation (1876, public domain), every chapter, in
the KJV's chapter and verse numbers like every other language on the site, so verse links, highlights and fish line up.

Sources (downloaded, given as arguments):
  RusSynodal.json        scrollmapper/bible_databases formats/json (from the CrossWire SWORD module)
  Synodal.properties     CrossWire JSword's Synodal -> KJV verse map (Psalm numbering and titles, Romans 14/16, Jonah, ...)
Psalm titles (KJV "verse 0") are left out, as the KJV prints no verse number for them; a verse the KJV has no place for is joined
to the verse before it; words the translators added stay (only the [ ] marks go).
  python3 tools/russian/chapters.py RusSynodal.json Synodal.properties
Writes fish-lang/bible/ru/<Book>-<c>.json  {v:"Синодальный перевод (1876)", t:[verse 1, ...]}
"""
import json, os, re, sys
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
BOOKS = json.loads(re.search(r'^BOOKS = (\[.*\])$', open(os.path.join(SITE, 'tools', 'bible-orig', 'build.py'), encoding='utf-8').read(), re.M).group(1))
OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split()
NAME = 'Синодальный перевод (1876)'

def our(name):   # scrollmapper's book names -> the site's
    n = re.sub(r'^III ', '3 ', re.sub(r'^II ', '2 ', re.sub(r'^I ', '1 ', name)))
    n = {'Psalms': 'Psalm', 'Revelation of John': 'Revelation'}.get(n, n)
    return BOOKS.index(n) if n in BOOKS else None

src = {}
for bk in json.load(open(sys.argv[1], encoding='utf-8'))['books']:
    b = our(bk['name'])
    if b is None: continue   # the deuterocanonical books are not in the site's Bible
    for ch in bk['chapters']:
        for v in ch['verses']: src[(b, ch['chapter'], v['verse'])] = v['text']

def kjvlen(b, c):
    f = os.path.join(SITE, 'fish-lang', 'bible', 'kjv', BOOKS[b].replace(' ', '_') + '-' + str(c) + '.json')
    return len(json.load(open(f, encoding='utf-8'))['t']) if os.path.exists(f) else 0

def ref(s):   # "Ps.9.22" or "Ps.51.0!a" -> (book, ch, v, part)
    m = re.match(r'^(\w+)\.(\d+)\.(\d+)(?:!([ab]))?$', s.strip()); return (OSIS.index(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4))

SRCLEN = {}
for (b, c, v) in src: SRCLEN[(b, c)] = max(SRCLEN.get((b, c), 0), v)
def span(a, z, kjv):   # every verse from a to z, chapters ending where the KJV (right side) or the Synodal (left side) ends them
    out, (b, c, v, _), (_, c2, v2, _) = [], a, z
    while (c, v) <= (c2, v2):
        out.append((b, c, v))
        v += 1
        end = kjvlen(b, c) if kjv else SRCLEN.get((b, c), 0)
        if v > end and c < c2: c, v = c + 1, 1
    return out

rules = {}   # synodal (b,c,v) -> list of kjv (b,c,v[,part]) targets
for line in open(sys.argv[2], encoding='utf-8'):
    line = line.strip()
    if not line or line[0] in '#!' or '?' in line or line.startswith('Dan.3.') or line.startswith('Dan.4.'): continue   # Daniel: below
    L, R = line.split('=')
    l = L.split('-'); r = R.split('-')
    la, lz = ref(l[0]), ref(l[-1]); ra, rz = ref(r[0]), ref(r[-1])
    ls = span(la, lz, False)
    if len(ls) == 1: rules[ls[0]] = [(ra[0], ra[1], ra[2], ra[3])] + ([(rz[0], rz[1], rz[2], rz[3])] if len(r) > 1 else [])
    else:
        rs = [(x[0], x[1], x[2]) for x in span((ra[0], ra[1], ra[2], None), (rz[0], rz[1], rz[2], None), True)]
        if ra[2] == 0 and (ra[0], ra[1], 0) not in rs: rs = [(ra[0], ra[1], 0)] + rs
        for i, s in enumerate(ls): rules[s] = [rs[i] + (None,)] if i < len(rs) else [rs[-1] + (None,)]

DAN = OSIS.index('Dan')
for v in range(24, 91): rules[(DAN, 3, v)] = [(DAN, 3, 0, None)]   # left out (not in the KJV's Daniel)
for v in range(91, 98): rules[(DAN, 3, v)] = [(DAN, 3, v - 67, None)]
for v in range(98, 101): rules[(DAN, 3, v)] = [(DAN, 4, v - 97, None)]
for v in range(1, 35): rules[(DAN, 4, v)] = [(DAN, 4, v + 3, None)]
TITLE = re.compile(r'^\W*(псалом|песнь|начальнику хора|учение|молитва|хвалебная|в воспоминание|давида|асафа|сынов кореевых|соломона|моисея|ефама|емана|ефана|в первый день|в день субботы|для обучения|на струн|на осьмиструн|на гефск|на шошан|на лилиях|на мелодию|на аламоф|на махалаф|на музыкальн|при окончании|при восхождени|прежде помазания|против голиафа|по смерти|к ионафану|о царе|о доике|об авессаломе)', re.I)
def untitle(t):   # a psalm's title at the start of verse 1 (the KJV prints it without a number)
    while True:
        m = re.match(r'^([^.!?]{2,160}?[.!?])\s+(?=\S)', t)
        if not m or not TITLE.search(m.group(1)) or len(t) - len(m.group(0)) < 12: return t
        rest = t[len(m.group(0)):]
        t = rest[0].upper() + rest[1:]

# a psalm whose title is a verse of its own in this text, where the verse map expects title and verse 1 together: join them,
# and number the rest one lower, so the map lines up
PS = OSIS.index('Ps')
for (b, c, v) in sorted([k for k in src if k[0] == PS and k[2] == 1]):
    t = src[(b, c, 1)]
    r = rules.get((b, c, 1)); combined = bool(r) and len(r) == 2 and r[0][2] == 0 and r[1][2] == 1
    if combined and (b, c, 2) in src and len(t) < 90 and TITLE.search(t) and len(untitle(t + ' ' + 'x' * 20)) <= 21:
        n = SRCLEN[(b, c)]
        src[(b, c, 1)] = t + ' ' + src[(b, c, 2)]
        for v2 in range(2, n): src[(b, c, v2)] = src[(b, c, v2 + 1)]
        del src[(b, c, n)]; SRCLEN[(b, c)] = n - 1

def clean(t):
    t = re.sub(r'<[^>]+>', '', t).replace('[', '').replace(']', '')
    return re.sub(r'\s+', ' ', t).strip()

out = {}
def put(b, c, v, t, join=False):
    if v == 0 or not t: return   # a psalm title: no verse in the KJV
    n = kjvlen(b, c)
    if n == 0: return
    if v > n: v, join = n, True   # the KJV has no place for it: with the verse before
    k = (b, c, v); out[k] = (out[k] + ' ' + t) if (join and out.get(k)) else (t if not out.get(k) else out[k] + ' ' + t)
for (b, c, v) in sorted(src):
    t = clean(src[(b, c, v)])
    if (b, c, v) in rules:
        tg = rules[(b, c, v)]
        first = tg[0]
        if first[3] == 'b': last = tg[-1]; put(last[0], last[1], last[2], t, len(tg) == 1)   # the second half of a verse (and the next): with the last
        elif first[2] == 0 and len(tg) > 1: put(tg[1][0], tg[1][1], tg[1][2], untitle(t))   # title + verse 1 in one: verse 1 without the title
        else: put(first[0], first[1], first[2], t)
    else: put(b, c, v, t)
for (b, c, v) in list(out):   # every psalm's verse 1 without its title
    if b == PS and v == 1: out[(b, c, v)] = untitle(out[(b, c, v)])

out.setdefault((BOOKS.index('Song of Solomon'), 1, 1), 'Песнь песней, которая Соломонова.')
D = os.path.join(SITE, 'fish-lang', 'bible', 'ru'); os.makedirs(D, exist_ok=True)
files, empty = 0, 0
for b, name in enumerate(BOOKS):
    c = 1
    while kjvlen(b, c):
        n = kjvlen(b, c); t = [out.get((b, c, v), '') for v in range(1, n + 1)]; empty += t.count('')
        json.dump({'v': NAME, 't': t}, open(os.path.join(D, name.replace(' ', '_') + '-' + str(c) + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        files += 1; c += 1
print(files, 'chapters,', empty, 'empty verses')
