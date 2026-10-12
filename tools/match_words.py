#!/usr/bin/env python3
"""Pull the 24 MannaFish words in all ten languages out of index.html for the memory game.

Writes match/words.json as {lang: {KEY: word}}. The word in each language comes from
SAY[lang][KEY][0]; Spanish comes from window.MFI18N.es.titles when SAY has no Spanish.
Also writes fish-lang/hobo.woff2 (the brand font, decoded from the @font-face in index.html).
Run from anywhere:  python3 tools/match_words.py
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['en', 'es', 'tl', 'zh', 'hi', 'el', 'de', 'ko', 'he', 'ar']
KEYS = ['REST', 'HOPE', 'LOVE', 'TRUST', 'PRAY', 'BELIEVE', 'FORGIVE', 'GIVE', 'SEEK', 'ASK', 'KNOCK', 'FOLLOW',
        'LISTEN', 'REMEMBER', 'CHOOSE', 'HONOR', 'GROW', 'GATHER', 'ACCEPT', 'BREATHE', 'ENJOY', 'LIVE', 'SING', 'LAUGH']


def obj_after(src, marker):
    i = src.find(marker)
    if i < 0:
        sys.exit('not found in index.html: ' + marker)
    return json.JSONDecoder().raw_decode(src[i + len(marker):].lstrip())[0]


def main():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    say = obj_after(src, 'var SAY=')
    i18n = obj_after(src, 'window.MFI18N=')
    es_titles = (i18n.get('es') or {}).get('titles') or {}
    out, missing = {}, []
    for l in LANGS:
        out[l] = {}
        for k in KEYS:
            row = (say.get(l) or {}).get(k)
            w = row[0] if row else (es_titles.get(k) if l == 'es' else None)
            if not w:
                missing.append(l + ':' + k)
                continue
            out[l][k] = w.strip()
    if missing:
        sys.exit('missing words: ' + ', '.join(missing))
    os.makedirs(os.path.join(ROOT, 'match'), exist_ok=True)
    with open(os.path.join(ROOT, 'match', 'words.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    m = re.search(r"@font-face\{font-family:'MFHobo';src:url\(data:font/woff2;base64,([A-Za-z0-9+/=]+)\)", src)
    if not m:
        sys.exit('MFHobo font not found in index.html')
    with open(os.path.join(ROOT, 'fish-lang', 'hobo.woff2'), 'wb') as f:
        f.write(base64.b64decode(m.group(1)))
    print('wrote match/words.json (%d languages x %d words) and fish-lang/hobo.woff2' % (len(LANGS), len(KEYS)))


if __name__ == '__main__':
    main()
