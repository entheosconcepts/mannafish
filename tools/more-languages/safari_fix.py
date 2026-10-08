# Safari centres a squeezed line (textLength + spacingAndGlyphs) as if it were still full width, so it
# slides left. Give every squeezed line an exact start instead of "centre it": same look in every browser.
# Run on any fish made by gen2.js / gen3.js:  python3 safari_fix.py  (from the repo root)
import json, re, glob
L = {'#g_top': 3120.134, '#g_bot': 3463.476}   # the two verse curves on Ken's fish (same on every fish)
def fix(s):
    def tp(m):
        t = m.group(0); tl = re.search(r'textLength="([\d.]+)"', t)
        if not tl or 'startOffset="50%"' not in t: return t
        start = (L[re.search(r'href="(#g_\w+)"', t).group(1)] - float(tl.group(1))) / 2
        return t.replace('startOffset="50%"', 'startOffset="%.1f"' % start).replace('text-anchor="middle"', 'text-anchor="start"')
    s = re.sub(r'<textPath[^>]*>', tp, s)
    def tx(m):
        t = m.group(0); tl = re.search(r'textLength="([\d.]+)"', t); x = re.search(r' x="([\d.]+)"', t)
        if not tl or not x or 'text-anchor="middle"' not in t: return t
        return t.replace(x.group(0), ' x="%.1f"' % (float(x.group(1)) - float(tl.group(1)) / 2)).replace('text-anchor="middle"', 'text-anchor="start"')
    return re.sub(r'<text [^>]*>', tx, s)
if __name__ == '__main__':
    n = 0
    for f in glob.glob('fish-es/*.svg'):
        s = open(f, encoding='utf-8').read(); t = fix(s)
        if t != s: open(f, 'w', encoding='utf-8').write(t); n += 1
    for f in glob.glob('fish-lang/*.json'):
        d = json.load(open(f, encoding='utf-8')); d = {k: fix(v) for k, v in d.items()}
        json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':')); n += 1
    p = 'index.html'; s = open(p, encoding='utf-8').read()
    a = s.index('window.MFI18N=') + len('window.MFI18N='); b = s.index(';\nwindow.MF=', a)
    X = json.loads(s[a:b]); X['fish'] = {k: fix(v) for k, v in X['fish'].items()}
    open(p, 'w', encoding='utf-8').write(s[:a] + json.dumps(X, ensure_ascii=False, separators=(',', ':')) + s[b:])
    print('fixed', n, 'files and the Spanish fish in index.html')
