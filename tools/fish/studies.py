#!/usr/bin/env python3
"""Both the Greek and the Hebrew word for every fish word (Ken, 8 Nov: "it's supposed to have the Greek AND the Hebrew ... side by side").
A fish outside the original 24 only had the original-language word of its own verse (Hebrew for an Old Testament verse, Greek for a New
Testament one). This finds, for each word on a fish in use, the Greek and the Hebrew word that the King James Bible most often translates with it,
by reading the word-by-word alignment of the whole Bible (fish-lang/bible/orig + kjv) and the lexicon (fish-lang/bible/lex).
Writes fish/studies.json: {word: {g:{n:'G5463',w,t,m,c}, h:{...}}}   (n Strong's number, w the word, t how it sounds, m the meaning, c how often).
  python3 tools/fish/studies.py"""
import json, os, re, glob, collections
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
S = json.load(open(R + '/fish/series.json')); C = json.load(open(R + '/fish/catch.json'))
title = {x['k']: x['title'] for x in C['core']}; title.update({k: v['title'] for k, v in C['fish'].items()})
words = sorted({title[k].lower() for k in S['use']})
def forms(w):
    b = w[:-1] if w.endswith('e') else w; f = {w, w + 's', w + 'es', w + 'd', w + 'ed', w + 'eth', w + 'th', b + 'ing', b + 'eth', b + 'ed', b + 'es', b + 'est', w + 'est'}
    if re.search(r'[^aeiou][aeiou][bdglmnprt]$', w): f |= {w + w[-1] + x for x in ('ed', 'ing', 'eth', 'er')}
    if w.endswith('y'): f |= {w[:-1] + x for x in ('ied', 'ieth', 'ies')}
    if w.endswith('or'): f |= forms(w[:-2] + 'our')   # honor: the King James spells it honour
    return f
F = collections.defaultdict(set)
for w in words:
    for f in forms(w): F[f].add(w)
cnt = {w: collections.Counter() for w in words}
occ = {w: [] for w in words}
txt = {w: [] for w in words}   # every verse that has the word in it, aligned or not   # (book order, ref, strong, letters) of every verse the word is translated in
BOOKORD = {}
tok = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
for fo in sorted(glob.glob(R + '/fish-lang/bible/orig/*.json')):
    name = os.path.basename(fo); kj = R + '/fish-lang/bible/kjv/' + name
    if not os.path.exists(kj): continue
    bk, ch = name[:-5].rsplit('-', 1); bk = bk.replace('_', ' ')
    O = json.load(open(fo))['v']; K = json.load(open(kj))['t']
    for vs, o in O.items():
        i = int(vs) - 1
        if i >= len(K): continue
        for j, t in enumerate(tok.findall(K[i])):
            ws = F.get(t.lower())
            if ws:
                for w in ws: txt[w].append((bk, int(ch), int(vs), '', len(K[i])))
            if not ws or j >= len(o['a']): continue
            ix = o['a'][j]
            if ix is None or ix < 0 or ix >= len(o['w']): continue
            st = str(o['w'][ix][3]); m = re.match(r'^([HG])(\d+)', st)
            if m:
                for w in ws:
                    cnt[w][st] += 1; occ[w].append((bk, int(ch), int(vs), st, len(K[i])))
LEX = {}
def lex(st):
    num = re.match(r'^[HG](\d+)', st).group(1); k = st[0] + str(int(num) // 250)
    if k not in LEX:
        p = R + '/fish-lang/bible/lex/' + k + '.json'; LEX[k] = json.load(open(p)) if os.path.exists(p) else {}
    return LEX[k].get(st) or LEX[k].get(re.sub(r'[A-Za-z]$', '', st)) or LEX[k].get(st[0] + num.zfill(4)) or LEX[k].get(st[0] + num) or next((v for x, v in LEX[k].items() if re.fullmatch(st[0] + num.zfill(4) + '[A-Za-z]?', x) or re.fullmatch(st[0] + num + '[A-Za-z]?', x)), None)
def sound(t): return re.sub('[āâ]', 'a', re.sub('[ēê]', 'e', re.sub('[īî]', 'i', re.sub('[ōô]', 'o', re.sub('[ūû]', 'u', t))))) if t else ''
PART = {'please', 'behold', 'not', 'no', 'and', 'the', 'now', 'if', 'yea', 'also', 'but', 'for', 'that', 'which', 'with', 'in', 'to', 'of', 'oh', 'o', 'i', 'he', 'she', 'it'}
# by hand (checked against the lexicon): words whose Greek or Hebrew counterpart the alignment could not find; the Strong's numbers are read in the lexicon, so the word, sound and meaning are the lexicon's
BOOKS_ORDER = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalm','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']
MAN = {'acknowledge': {'g': 'G1921'}, 'atone': {'g': 'G2433', 'h': 'H3722'}, 'bathe': {'g': 'G3068', 'h': 'H7364'}, 'cheer': {'g': 'G2293'}, 'dedicate': {'g': 'G1457'},
  'encourage': {'g': 'G3870', 'h': 'H2388'}, 'forbear': {'g': 'G430'}, 'hallow': {'g': 'G37'}, 'hearken': {'g': 'G191'}, 'honor': {'g': 'G5091', 'h': 'H3513'},
  'intreat': {'g': 'G3870', 'h': 'H6279'}, 'launch': {'g': 'G321'}, 'listen': {'g': 'G191'}, 'overtake': {'g': 'G2638'}, 'prosper': {'g': 'G2137'}, 'publish': {'g': 'G2784'},
  'refine': {'g': 'G4448'}, 'repair': {'g': 'G2675', 'h': 'H2388'}, 'respect': {'g': 'G1914', 'h': 'H5234'}, 'study': {'g': 'G4704'}, 'tell': {'g': 'G518'}, 'train': {'g': 'G1128'},
  'trust': {'g': 'G1679'}, 'yearn': {'g': 'G1971', 'h': 'H3648'}, 'agree': {'h': 'H3259'}, 'amend': {'h': 'H3190'}, 'believe': {'h': 'H539'}, 'confess': {'h': 'H3034'},
  'direct': {'h': 'H3474'}, 'enjoy': {'h': 'H7521'}, 'extol': {'h': 'H7311'}, 'grant': {'h': 'H5414'}, 'impart': {'h': 'H2505'}, 'marvel': {'h': 'H8539'}, 'nourish': {'h': 'H3557'},
  'overcome': {'h': 'H3201'}, 'preach': {'h': 'H7121'}, 'recover': {'h': 'H2421'}, 'render': {'h': 'H7725'}}
# a clearer meaning than the lexicon's own short gloss, where that reads badly aloud
MEAN = {('marvel', 'h'): 'To be astounded', ('yearn', 'h'): 'To grow warm with longing', ('repair', 'g'): 'To mend, restore, put in order', ('refine', 'g'): 'To refine by fire', ('agree', 'h'): 'To appoint a meeting',
  ('direct', 'h'): 'To make straight', ('enjoy', 'h'): 'To accept, to delight in', ('overcome', 'h'): 'To be able, to prevail', ('confess', 'h'): 'To give thanks, to confess', ('prosper', 'g'): 'To go well, to prosper',
  ('publish', 'g'): 'To proclaim', ('recover', 'h'): 'To live, to revive', ('train', 'g'): 'To train, to exercise', ('cheer', 'g'): 'To take heart, to be of good cheer', ('nourish', 'h'): 'To sustain, to nourish',
  ('overtake', 'g'): 'To seize, to overtake', ('dedicate', 'g'): 'To inaugurate, to dedicate', ('encourage', 'g'): 'To comfort, to encourage', ('intreat', 'g'): 'To plead with, to comfort', ('study', 'g'): 'To be eager, to give diligence',
  ('acknowledge', 'g'): 'To know fully, to acknowledge', ('trust', 'g'): 'To hope, to expect', ('respect', 'g'): 'To look upon, to have regard', ('intreat', 'h'): 'To pray, to plead'}
out = {}
for w in words:
    stem = w[:-1] if w.endswith('e') else w; stem = stem if len(stem) >= 4 else w
    e = {}
    for L in 'GH':
        cand = [(n, c) for n, c in cnt[w].most_common() if n[0] == L]; tot = sum(c for _, c in cand) or 1; pick = None
        info = []
        for n, c in cand[:12]:
            x = lex(n)
            if not x: continue
            g = re.split(r'[;:]', str(x.get('g') or x.get('d') or ''))[0].strip()
            if not g: continue
            info.append((n, c, x, g, (str(x.get('g') or '') + ' ' + str(x.get('d') or '')).lower()))
        for n, c, x, g, full in info:                       # 1: the lexicon's short meaning is this word ("to pray", "to rejoice")
            if re.search(r'\b' + re.escape(stem), str(x.get('g') or '').lower()): pick = (n, c, x, g); break
        if not pick:                                         # 2: its longer definition says it
            for n, c, x, g, full in info:
                if re.search(r'\b' + re.escape(stem), full) and g.lower().replace('to ', '') not in PART: pick = (n, c, x, g); break
        if pick:
            n, c, x, g = pick; e[L.lower()] = {'n': n, 'w': x.get('l', ''), 't': sound(x.get('t', '')), 'm': g[0].upper() + g[1:] + ('' if g[-1] in '.!?' else '.'), 'c': c}
    for L, n in MAN.get(w, {}).items():
        if L in e: continue
        x = lex(n)
        if x:
            g = re.split(r'[;:]', str(x.get('g') or x.get('d') or ''))[0].strip()
            e[L] = {'n': n, 'w': x.get('l', ''), 't': sound(x.get('t', '')), 'm': g[0].upper() + g[1:] + ('' if g[-1] in '.!?' else '.'), 'c': 0, 'by': 'hand'}
    for L in list(e): 
        if (w, L) in MEAN: e[L]['m'] = MEAN[(w, L)] + '.'
    # nine Scriptures where this word is used (Ken, 8 Nov: nine on every back; if there are not enough, 6 or 3): verses where it is translated by the chosen Greek or Hebrew word,
    # spread over the books, short ones first, in the order of the Bible
    keep = {e[L]['n'] for L in ('g', 'h') if L in e}; keepn = {re.sub(r'[A-Za-z]$', '', n) for n in keep}
    pool = [o for o in occ[w] if re.sub(r'[A-Za-z]$', '', o[3]) in keepn] or occ[w]
    seen_v = set(); uniq = []
    for o in sorted(pool, key=lambda o: o[4]) + sorted(txt[w], key=lambda o: o[4]):
        k = (o[0], o[1], o[2])
        if k not in seen_v: seen_v.add(k); uniq.append(o)
    pick = []; used_b = collections.Counter()
    for rnd in range(3):                                     # first at most one a book, then two, then any
        for o in uniq:
            if len(pick) >= 9: break
            if o in pick or used_b[o[0]] > rnd or o[4] > (200 if rnd == 0 else 400): continue
            pick.append(o); used_b[o[0]] += 1
    n = len(pick) - len(pick) % 3 if len(pick) < 9 else 9
    pick = pick[:n]
    order = [x for x in sorted(set(o[0] for o in pick), key=lambda b: BOOKS_ORDER.index(b) if b in BOOKS_ORDER else 99)]
    pick.sort(key=lambda o: (BOOKS_ORDER.index(o[0]) if o[0] in BOOKS_ORDER else 99, o[1], o[2]))
    e['r'] = ['%s %d:%d' % (o[0], o[1], o[2]) for o in pick]
    out[w] = e
json.dump(out, open(R + '/fish/studies.json', 'w'), ensure_ascii=False, separators=(',', ':'))
both = sum(1 for e in out.values() if 'g' in e and 'h' in e)
print(len(words), 'words;', both, 'have both a Greek and a Hebrew word;', sum(1 for e in out.values() if 'g' not in e), 'no Greek;', sum(1 for e in out.values() if 'h' not in e), 'no Hebrew')
