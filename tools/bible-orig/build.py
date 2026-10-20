#!/usr/bin/env python3
"""The Greek and Hebrew behind every KJV verse, for the MannaFish Bible (/bible/).

Ken, 20 Oct: "would like a quick reference to Greek or Hebrew for anything user highlights, with ability to add the Greek or
Hebrew to a note they create".

Sources (STEPBible.org, CC BY 4.0 -- https://github.com/STEPBible/STEPBible-Data), downloaded to a folder given as the first argument:
  ot1..ot4.txt  TAHOT  Translators Amalgamated Hebrew OT (Gen-Deu, Jos-Est, Job-Sng, Isa-Mal)
  nt1..nt2.txt  TAGNT  Translators Amalgamated Greek NT (Mat-Jhn, Act-Rev); only the words of the text behind the KJV (type K/k)
  tbesh.txt / tbesg.txt  Translators Brief lexicons of Extended Strong's (Hebrew / Greek)

Changes made to the data (as STEPBible asks to be noted): reformatted per chapter; Hebrew transliteration without syllable dots;
the lexicon's definitions shortened; each KJV word matched to the Greek or Hebrew word it translates (by the English gloss, then by
how the same word is matched elsewhere) -- the matching is ours, not STEPBible's.

Writes, under the site:
  fish-lang/bible/orig/<Book>-<ch>.json   {l:'he'|'el', v:{"16":{w:[[word,translit,gloss,strong],...], a:[orig index per KJV word, -1 none]}}}
  fish-lang/bible/lex/<H|G><n>.json        {"G0025":{l,t,g,d,n,k:[[kjv word,count],...]}, ...}  (n = Strong's number // 250)
"""
import json, os, re, sys
from collections import defaultdict, Counter

SRC = sys.argv[1]
SITE = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..')
KJV = os.path.join(SITE, 'fish-lang', 'bible', 'kjv')
OUT = os.path.join(SITE, 'fish-lang', 'bible', 'orig')
LEX = os.path.join(SITE, 'fish-lang', 'bible', 'lex')

BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"]

REF = re.compile(r'^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\([^)]*\))?#(\d+)=(\S+)\t')

# ── read the tagged texts ──
def read_tagged(files, greek):
    order, verses = [], {}
    for f in files:
        for line in open(os.path.join(SRC, f), encoding='utf-8'):
            m = REF.match(line)
            if not m: continue
            bk, c, v, n, typ = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), m.group(5)
            col = line.rstrip('\n').split('\t')
            if greek:
                if 'K' not in typ and 'k' not in typ: continue
                gm = re.match(r'^(\S+)\s*\(([^)]*)\)', col[1].strip())
                word = (gm.group(1) if gm else col[1].strip()).rstrip(',.;:·᾽’')
                if word.endswith('᾽'): word = word
                tr = gm.group(2) if gm else ''
                strong = col[3].split('=')[0].strip()
                gloss = col[2].strip().strip(',.;:')
            else:
                word = col[1].replace('/', '').replace('\\', '').strip()
                word = re.sub(r'[׃׀]', '', word).strip()
                tr = re.sub(r'[./]', '', col[2]).lower().strip()
                sm = re.search(r'\{(H\d+[A-Za-z]?)\}', col[4])
                strong = sm.group(1) if sm else re.sub(r'[^H0-9A-Za-z].*$', '', col[4].split('/')[0])
                gloss = col[3].replace('/ ', ' ').replace('/', ' ').strip()
            if bk not in order: order.append(bk)
            key = (bk, c, v)
            L = verses.setdefault(key, {})
            if n in L: continue          # one reading per word (Ketiv/Qere and the like: the first)
            L[n] = [word, tr, gloss, strong]
    return order, {k: [x[1] for x in sorted(L.items())] for k, L in verses.items()}

ot_order, OT = read_tagged(['ot1.txt', 'ot2.txt', 'ot3.txt', 'ot4.txt'], False)
nt_order, NT = read_tagged(['nt1.txt', 'nt2.txt'], True)
assert len(ot_order) == 39 and len(nt_order) == 27, (len(ot_order), len(nt_order))
CODE = dict(zip(ot_order + nt_order, range(66)))

# ── words: the same tokens the page uses (/[A-Za-z]+(?:'[A-Za-z]+)?/g) ──
TOK = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
STOP = set("""the a an of to in into on upon for with by from and but or nor is are was were be been being am will shall may might must
let do does did has have had that which who whom whose this these those it its he him his she her they them their we us our you your i me my
mine thine thee thou ye thy at as so obj there then than also even when what where how if not no yea o oh unto hath doth art shalt wilt hast
saith because neither either both own self himself herself themselves itself myself thyself yourselves ourselves""".split())
IRR = dict(x.split(':') for x in """gave:give given:give came:come went:go saw:see seen:see said:say saith:say spake:speak spoken:speak spoke:speak
made:make took:take taken:take brought:bring sent:send sat:sit stood:stand knew:know known:know wrought:work slew:slay slain:slay begat:beget
begotten:beget begot:beget born:bear bare:bear bore:bear ate:eat eaten:eat did:do done:do heard:hear found:find thought:think told:tell left:leave
kept:keep led:lead fell:fall fallen:fall rose:rise risen:rise became:become began:begin sought:seek taught:teach ran:run drew:draw drawn:draw grew:grow
wrote:write written:write chose:choose chosen:choose forsook:forsake forsaken:forsake men:man women:woman children:child brethren:brother
brothers:brother feet:foot oxen:ox hid:hide hidden:hide smote:smite smitten:smite sware:swear sworn:swear clave:cleave bought:buy sold:sell
laid:lay held:hold built:build fought:fight caught:catch gat:get gotten:get abode:abide arose:arise drank:drink drunk:drink flew:fly fled:flee
sang:sing sung:sing lifted:lift lift:lift dwelt:dwell spake:speak shewed:show shew:show shewn:show shown:show showed:show stricken:strike struck:strike
thee:you thou:you ye:you thy:your thine:your mine:my hath:have hast:have doth:do art:be shalt:shall wilt:will unto:to lo:behold
yahweh:lord jehovah:lord better:good best:good worse:bad worst:bad elder:old eldest:old wives:wife lives:life loaves:loaf""".split())

def stem(w):
    w = w.lower().replace("'s", '').replace("'", '')
    if w in IRR: return IRR[w]
    for suf in ('ings', 'ing', 'eth', 'edst', 'est', 'ed', 'ies', 'es', 's', 'ly'):
        if len(w) - len(suf) >= 3 and w.endswith(suf):
            w = w[:-len(suf)]
            if suf == 'ies': w += 'y'
            break
    return w

def same(a, b):
    if a == b: return True
    s, l = (a, b) if len(a) <= len(b) else (b, a)
    if len(s) >= 3 and l.startswith(s) and len(l) - len(s) <= 3: return True
    k = 0
    while k < len(s) and s[k] == l[k]: k += 1
    return k >= 5 or (k >= 4 and k >= len(s) - 1)

def gloss_words(g):
    g = re.sub(r'[<>\[\]{}()?!.,;:"“”]', ' ', g)
    return [w for w in TOK.findall(g)]

def kjv_chapter(b, c):
    p = os.path.join(KJV, BOOKS[b].replace(' ', '_') + '-' + str(c) + '.json')
    return json.load(open(p, encoding='utf-8'))['t'] if os.path.exists(p) else None

# all verses: (b, c, v) -> (kjv tokens, orig words)
DATA = {}
for src in (OT, NT):
    for (bk, c, v), words in src.items():
        b = CODE[bk]
        DATA[(b, c, v)] = words
CHS = sorted(set((b, c) for b, c, v in DATA))
TEXT = {}
for b, c in CHS:
    t = kjv_chapter(b, c)
    if t is None: continue
    for i, s in enumerate(t):
        if s: TEXT[(b, c, i + 1)] = s

def align(toks, words, table):
    n, m = len(words), len(toks)
    if not n or not m: return [-1] * m
    ks = [stem(t) for t in toks]
    content = [t.lower() not in STOP for t in toks]
    gl = [[stem(x) for x in gloss_words(w[2])] for w in words]
    gc = [[stem(x) for x in gloss_words(w[2]) if x.lower() not in STOP] for w in words]
    a = [-1] * m
    def pos(i, j): return abs(i / max(1, n - 1) - j / max(1, m - 1)) if n > 1 and m > 1 else 0
    # 1: a content word of the gloss is the KJV word
    cand = [(1 - pos(i, j), i, j) for i in range(n) for j in range(m) if content[j] and any(same(g, ks[j]) for g in gc[i])]
    for s, i, j in sorted(cand, reverse=True):
        if a[j] < 0: a[j] = i
    # 2: the KJV word is how this Strong's number is matched elsewhere
    if table is not None:
        took = set(a)
        cand = []
        for j in range(m):
            if a[j] >= 0 or not content[j]: continue
            for i in range(n):
                cnt = table.get(words[i][3], {}).get(ks[j], 0)
                if cnt >= 2: cand.append(((cnt / (1 + sum(table[words[i][3]].values()))) + (0.3 if i not in took else 0) - pos(i, j), i, j))
        for s, i, j in sorted(cand, reverse=True):
            if a[j] < 0: a[j] = i
    # 3: the small words ("him", "in") when the gloss has them, nearest first
    cand = [(1 - pos(i, j), i, j) for i in range(n) for j in range(m) if not content[j] and any(same(g, ks[j]) or g == ks[j] for g in gl[i])]
    for s, i, j in sorted(cand, reverse=True):
        if a[j] < 0 and abs(i / max(1, n - 1) - j / max(1, m - 1)) < 0.35 and any(g == ks[j] for g in gl[i]): a[j] = i
    # 4: a KJV word left between two matched words takes the one Greek or Hebrew word left near them (a gap of one)
    took = set(a)
    def free(i): return 0 <= i < n and i not in took and gc[i] and not re.match(r'^(G3588|H9\d\d\d)', words[i][3])
    for j in range(m):
        if a[j] >= 0 or not content[j]: continue
        L = next((a[k] for k in range(j - 1, -1, -1) if a[k] >= 0), -1)
        R = next((a[k] for k in range(j + 1, m) if a[k] >= 0), n)
        lo, hi = min(L, R) - 1, max(L, R) + 1
        if hi - lo > 8: continue
        f = [i for i in range(max(0, lo), min(n, hi + 1)) if free(i)]
        ks2 = [k for k in range(m) if a[k] < 0 and content[k] and (next((a[x] for x in range(k - 1, -1, -1) if a[x] >= 0), -1), next((a[x] for x in range(k + 1, m) if a[x] >= 0), n)) == (L, R)]
        if len(f) == 1 and len(ks2) == 1:
            a[j] = f[0]; took.add(f[0])
    return a

def run(table):
    out, stats = {}, defaultdict(Counter)
    for key, words in DATA.items():
        t = TEXT.get(key)
        if not t: continue
        toks = TOK.findall(t)
        a = align(toks, words, table)
        out[key] = a
        for j, i in enumerate(a):
            if i >= 0 and toks[j].lower() not in STOP: stats[words[i][3]][stem(toks[j])] += 1
    return out, stats

A, T = run(None)
A, T = run(T)
A, T = run(T)

# how good is it: KJV content words given a Greek or Hebrew word
tot = got = 0
for key, a in A.items():
    toks = TOK.findall(TEXT[key])
    for j, i in enumerate(a):
        if toks[j].lower() in STOP: continue
        tot += 1; got += i >= 0
print('content words matched: %d of %d (%.1f%%)' % (got, tot, 100 * got / max(1, tot)))

# ── chapter files ──
os.makedirs(OUT, exist_ok=True)
by_ch = defaultdict(dict)
for (b, c, v), words in DATA.items():
    by_ch[(b, c)][str(v)] = {'w': words, 'a': A.get((b, c, v), [])}
for (b, c), vs in by_ch.items():
    with open(os.path.join(OUT, BOOKS[b].replace(' ', '_') + '-' + str(c) + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'l': 'he' if b < 39 else 'el', 'v': vs}, f, ensure_ascii=False, separators=(',', ':'))
print('chapters:', len(by_ch))

# ── the lexicon: the words that are used, with how the KJV renders each ──
used = Counter()
kjvw = defaultdict(Counter)
for key, a in A.items():
    toks = TOK.findall(TEXT[key])
    words = DATA[key]
    for j, i in enumerate(a):
        if i >= 0 and toks[j].lower() not in STOP: kjvw[words[i][3]][toks[j].lower() if toks[j] not in ('LORD', 'GOD') else toks[j]] += 1
for words in DATA.values():
    for w in words: used[w[3]] += 1

def clean(html):
    s = re.sub(r"<ref='[^']*'>", '', html)
    s = re.sub(r'</?ref>|<re>|</re>', '', s)
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    return s.replace('&nbsp;', ' ')

def short_he(m):
    lines = [x.strip() for x in clean(m).split('\n') if x.strip()]
    keep = []
    for x in lines:
        if x.startswith(':'): continue
        if x.startswith('Also means') or x.startswith('Another name') or x.startswith('Combined with'):
            if not keep: keep.append(x)
            continue
        mm = re.match(r'^(\d+[a-z]?)\)\s*(.*)$', x)
        if mm:
            if re.match(r'^\((Qal|Niphal|Piel|Pual|Hiphil|Hophal|Hithpael|Pilpel|Polel|Poel|Pulal|Hithpolel|Hishtaphel|Peal|Pael|Haphel|Aphel|Ithpeel|Ithpaal|Hithpaal|Hithpeel|Shaphel|Hithpalpel|Pilel|Polal|Pealal|Tiphil|Niphal \(\w+\)|[A-Za-z ]+)\)$', mm.group(2)): continue
            if len(mm.group(1)) <= 2: keep.append(mm.group(2))
        elif not keep: keep.append(x)
    s = '; '.join(dict.fromkeys(keep))
    return cut(s)

def short_gr(m):
    # Abbott-Smith puts the English senses in bold: those, in order, say it best
    bs = [re.sub(r'<[^>]+>', '', x).strip(' ,;:.') for x in re.findall(r'<b>(.*?)</b>', m)]
    bs = [x for x in bs if re.search(r'[A-Za-z]{3}', x) and not re.search(r'[\u0370-\u03ff\u1f00-\u1fff]', x)]
    if bs: return cut('; '.join(dict.fromkeys(bs)))
    s = clean(m)
    s = re.sub(r'\[in LXX[^\]]*\]', '', s)
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'\b[A-Z][a-z]{1,3}\.\d+[:.]\d+(?:[-–]\d+)?[;,]?', '', s)          # references
    s = re.sub(r'\b\d?[A-Z][a-z]{1,2}\.\d+[:.]\d+[;,]?', '', s)
    s = re.sub(r'__\s*', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    # drop the head word line ("ἀγαπάω, -ῶ,")
    s = re.sub(r'^[^\sA-Za-z]+(?:,\s*-?[^\s,]+)*,?\s*(?:ὁ|ἡ|τό|-ον|-ου)?[\s,;]*', '', s)
    s = re.sub(r'\s+([,;.])', r'\1', s)
    s = re.sub(r'([,;])\1+', r'\1', s)
    s = re.sub(r'(?:[,;:]\s*){2,}', '; ', s)
    return cut(s)

def cut(s, n=320):
    s = s.strip(' ;,')
    if len(s) <= n: return s
    s = s[:n]
    k = max(s.rfind('; '), s.rfind('. '))
    if k > n * 0.55: return s[:k + 1].rstrip(';') + ' …'
    return s[:s.rfind(' ')] + ' …'

lex = {}
for f, he in (('tbesh.txt', True), ('tbesg.txt', False)):
    for line in open(os.path.join(SRC, f), encoding='utf-8'):
        col = line.rstrip('\n').split('\t')
        if len(col) < 8 or not re.match(r'^[HG]\d{4}', col[0]): continue
        d = col[1].split('=')[0].strip()
        for key in (d, col[0].strip()):
            if key in used and key not in lex:
                lex[key] = {'l': col[3].strip(), 't': re.sub(r'[./]', '', col[4]).strip(), 'g': col[6].strip(),
                            'd': short_he(col[7]) if he else short_gr(col[7])}
missing = [k for k in used if k not in lex]
print('lexicon entries:', len(lex), ' strongs without one:', len(missing), missing[:20])

os.makedirs(LEX, exist_ok=True)
for f in os.listdir(LEX): os.remove(os.path.join(LEX, f))
buckets = defaultdict(dict)
for k, e in lex.items():
    e['n'] = used[k]
    kw = kjvw.get(k)
    if kw: e['k'] = [[w, c] for w, c in kw.most_common(6) if c >= 2 or c == kw.most_common(1)[0][1]]
    num = int(re.match(r'[HG](\d+)', k).group(1))
    buckets[k[0] + str(num // 250)][k] = e
for name, d in buckets.items():
    with open(os.path.join(LEX, name + '.json'), 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
print('lexicon files:', len(buckets))
