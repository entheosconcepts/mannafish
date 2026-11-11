#!/usr/bin/env python3
"""One compact copy of the whole KJV for the server (verse search, and checking that a made fish only carries the verse's own words).
   python3 tools/bible/kjv-all.py   ->  netlify/functions/lib/kjv.json   [{"n": "Genesis", "c": [[verse 1, verse 2, ...], [chapter 2 ...]]}, ...]"""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
BOOKS = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalm","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"]
out = []
for b in BOOKS:
    f = b.replace(' ', '_'); chs = []; n = 1
    while True:
        p = os.path.join(ROOT, 'fish-lang/bible/kjv', f'{f}-{n}.json')
        if not os.path.exists(p): break
        chs.append([(v or '').strip() for v in json.load(open(p))['t']]); n += 1
    if not chs: sys.exit('missing ' + b)
    out.append({'n': b, 'c': chs})
dst = os.path.join(ROOT, 'netlify/functions/lib/kjv.json')
json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'books,', sum(len(b['c']) for b in out), 'chapters,', round(os.path.getsize(dst) / 1e6, 1), 'MB')
