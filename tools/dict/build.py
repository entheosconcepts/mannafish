#!/usr/bin/env python3
"""The English dictionary for the Bible page (Ken, 9 Nov: "an English dictionary ... some people do not know what naive means; make it an option
when they click on a highlighted word"). Built from Webster's Unabridged Dictionary (Project Gutenberg, public domain) as a JSON file
{word: "definition text"} (for example dictionary.json from github.com/matthewreagan/WebstersEnglishDictionary).
  python3 -I tools/dict/build.py /path/to/dictionary.json
Writes fish-lang/dict/<first two letters>.json = {word: short definition}, loaded one small file at a time by fish-lang/dict.js.
Each entry keeps the first meanings only (about 380 characters) so the site stays light; old words are marked "(old)"."""
import json, os, re, sys, unicodedata, collections
R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
src = json.load(open(sys.argv[1]))
def norm(w): return re.sub(r'[^a-z]', '', ''.join(c for c in unicodedata.normalize('NFD', w.lower()) if not unicodedata.combining(c)))
def clean(t):
    t = t.replace('Defn:', ' ').replace('[Obs.]', '(old)').replace('[R.]', '').replace('[Archaic]', '(old)').replace('[Poetic]', '(poetic)')
    t = re.sub(r'\s+', ' ', t).strip()
    return t
def short(t, n=380):
    if len(t) <= n: return t
    cut = t[:n]; m = max(cut.rfind('. '), cut.rfind('; '))
    return (cut[:m + 1] if m > 160 else cut.rsplit(' ', 1)[0] + '…')
out = collections.defaultdict(dict); kept = 0
for k, v in src.items():
    w = norm(k)
    if len(w) < 2 or len(w) > 20 or not isinstance(v, str): continue
    parts = [clean(p) for p in re.split(r'\n\s*\n', v) if clean(p)]
    if not parts: continue
    long_parts = [p for p in parts if len(p) >= 30]   # drop one-word cross-references like "Saw. Chaucer." when there is a real meaning
    if long_parts: parts = long_parts
    t = short(parts[0], 380) if len(parts) == 1 else short(parts[0], 200) + ' | ' + short(parts[1], 200)   # two kinds of word (a noun and a verb) keep both, separated by |
    old = out[w[:2]].get(w)
    if old and len(old) >= len(t): continue
    out[w[:2]][w] = t; kept += 1
d = os.path.join(R, 'fish-lang', 'dict'); os.makedirs(d, exist_ok=True)
tot = 0
for k, m in out.items():
    s = json.dumps(m, ensure_ascii=False, separators=(',', ':')); tot += len(s); open(os.path.join(d, k + '.json'), 'w').write(s)
print(kept, 'words in', len(out), 'files,', round(tot / 1e6, 1), 'MB')
