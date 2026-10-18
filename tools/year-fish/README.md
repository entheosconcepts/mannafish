# Year of fish (draft, 18 Oct 2026)

128 candidate English fish for a Bible-in-a-year plan: 52 weeks (about 23 chapters a week, Sunday to Friday,
Saturday rest), one fish a week from that week's reading, with 1-4 alternates each. Ken picks the 52.

- `weeks.json`: the 52 weeks, their reading, series, and each candidate word with its KJV verse.
- `lines.json`: the words and verse lines set on each fish (every line checked against the KJV text).
- `svg/`: the fish, built like the translated fish (tools/more-languages/gen3.js): Ken's fish body and
  MannaFish(TM) tail from HOPE, the word, verse and reference in his Hobo face.
  Rebuild: put `en/HOPE.svg` and `hobo.txt` (the font as a data URL) beside `gen.js`, then `node gen.js en`.
