# Daily MannaFish brief

MannaFish is a daily Bible devotional. Each fish shows ONE short word in the middle (like "Provide") and a KJV verse split into two lines that run along the top and bottom curve of a fish, plus a reference on the tail.

We are building 364 daily fish: 52 weeks x 7 fish. Sun, Mon, Tue, Wed, Thu get one fish each; Friday is a "double portion" and gets TWO fish (slots "Fri a" and "Fri b"); Saturday is rest (no fish). Each fish's verse MUST come from that day's reading (the chapters listed for that day).

Folder: /tmp/claude-0/-home-user-majestic-crm/9a700bef-1320-54c1-abaf-aa01732f367f/scratchpad/daily/
- weeks.json: the 52 weeks. Each has days[] (day, chapters like "Genesis 1", "1Samuel 3", "Psalms 23", "Song 2"; label), a weekly fish (word, ref, top, bottom, day) and alternates (same fields, with the day their verse falls on).
- ../kjvdl/kjv.json: the KJV, a list of 66 books, each {abbrev, chapters:[[verse text,...],...]}, in canonical order (open with encoding utf-8-sig). Some verses contain {notes in braces}; ignore those.
- taken.txt: words already used by the weekly/alternate fish.
- verify.py: run `python3 -I verify.py out/wNN.json ...` to check your files. It must say `problems: 0`. It also prints LINE LONG and REPEAT warnings; fix LINE LONG, and avoid REPEATs within your own weeks.

## What to do for each of your weeks
1. Put the week's `weekly` fish on its day (source "weekly"), keeping its word/ref/top/bottom exactly. On Friday it takes slot "a".
2. Put each alternate on its day when that day still has a free slot (source "alt"), keeping its fields exactly. If a day is full, skip that alternate.
3. Fill every remaining slot with a NEW fish (source "new") from that day's chapters.

## Choosing new fish
- The word: ONE English word, capitalised, 3-8 letters, a verb or noun that points toward the gospel / God's character / a way of living with God (e.g. Shelter, Return, Mercy, Redeem, Rebuild, Anoint, Wait, Shepherd). It should be easy to translate into other languages. It should come from, or plainly sum up, the verse.
- Never use these (the original 24): Rest Hope Love Trust Pray Believe Forgive Give Seek Ask Knock Follow Listen Grow Live Sing Laugh Honor Gather Enjoy Choose Accept Remember Breathe.
- Avoid words in taken.txt (except the weekly/alt fish you reuse), and don't repeat a word within your weeks.
- The verse: pick a well-loved, encouraging or memorable verse from that day's chapters. In hard books (Leviticus, Numbers, Chronicles, prophets of judgment) look for the hopeful or holy line. Prefer one verse; a range like "Isaiah 40:30–31" (en dash) is fine.
- Split the verse text into `top` (about 20-45 characters) and `bottom` (about 25-55 characters). Use the exact KJV wording, including its punctuation and capitals, except: you may start a line mid-verse, and you may leave text out with "..." (three dots). End the bottom with "..." if the verse continues. Top max 52 chars, bottom max 62.
- ref: "Book chapter:verse" with normal book names: "Genesis 22:8", "1 Samuel 3:10", "Psalm 23:1" (singular for a Psalm), "Song of Solomon 2:4", "Lamentations 3:22–23".
- refShort: the short tail form, e.g. "Gen. 22:8", "1 Sam. 3:10", "Ps. 23:1", "Ruth 1:16", "Ezra 7:10", "John 3:16" (books of 6 letters or fewer, without the number, are written in full).

## Output
Write one file per week: out/wNN.json (NN two digits), a JSON list of exactly 7 objects in order Sun, Mon, Tue, Wed, Thu, Fri a, Fri b:
{"week":1,"day":"Fri","slot":"a","word":"Provide","ref":"Genesis 22:8","refShort":"Gen. 22:8","top":"My son, God will provide","bottom":"himself a lamb for a burnt offering...","source":"weekly"}
slot is "" for Sun-Thu and "a"/"b" for Fri.

Run verify.py on all your files until it prints `problems: 0`, then reply with just: your week range, the count of fish, and the list of new words.
