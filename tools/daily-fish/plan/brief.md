# MannaFish reading plan: new fish brief

MannaFish is a Bible devotional. Each fish shows ONE short word in the middle (like "Provide") and a KJV verse split into two lines along the top and bottom curve of a fish, plus a reference on the tail.

A Bible-in-a-year plan: every reading day has a day reading and a night reading, and each reading gets one fish ("2 Fish": one for me, one to give). Some readings already have a fish; you make fish for readings that don't.

Folder: /tmp/claude-0/-home-user-majestic-crm/9a700bef-1320-54c1-abaf-aa01732f367f/scratchpad/plan/
- todo_AA_BB.json: YOUR list of readings that need a fish: {slot, week, day, half ("am" day / "pm" night), chapters like "Genesis 3", "1Samuel 3", "Psalms 23", "Song 2", label}.
- ../kjvdl/kjv.json: the KJV, a list of 66 books {abbrev, chapters:[[verse,...],...]} in canonical order (open with encoding utf-8-sig). Ignore {notes in braces}. The file puts a space before punctuation after some words ("the LORD ."); write normal punctuation ("the LORD.") - the checker allows it.
- used.txt: words already used. Never use these.
- verify2.py: `python3 -I verify2.py out/AA_BB.json` must end with `problems: 0`.

## One fish per reading in your list
- The verse MUST be in that reading's chapters.
- The word: ONE English word, capitalised, 3-8 letters, a verb or noun pointing toward the gospel / God's character / a way of living with God. It must come from, or plainly sum up, the verse. Easy to translate. Not in used.txt, not one of: Rest Hope Love Trust Pray Believe Forgive Give Seek Ask Knock Follow Listen Grow Live Sing Laugh Honor Gather Enjoy Choose Accept Remember Breathe. No repeats in your list. Prefer distinctive words (avoid generic ones that other writers will also pick, e.g. Lord, God, Faith, Peace, Truth, Mercy, Grace).
- The verse: a well-loved, encouraging or memorable verse from those chapters. In hard passages (genealogies, laws, judgment) find the hopeful or holy line. One verse preferred; a range like "Isaiah 40:30–31" (en dash) is fine.
- top (about 20-45 chars, max 52) and bottom (about 25-55 chars, max 62): the exact KJV wording, punctuation and capitals. You may start mid-verse and leave text out with "..." (three dots). End the bottom with "..." if the verse continues.
- ref: "Genesis 22:8", "1 Samuel 3:10", "Psalm 23:1" (singular for a Psalm), "Song of Solomon 2:4".
- refShort: "Gen. 22:8", "1 Sam. 3:10", "Ps. 23:1", "Ruth 1:16", "Ezra 7:10", "John 3:16" (a book of 6 letters or fewer, not counting its number, is written in full: Judges, Daniel, Kings is "1 Kings 19:12").

## Output
out/AA_BB.json (same AA_BB as your todo file): a JSON list, one object per reading, in the todo order:
{"slot":12,"word":"Shelter","ref":"Psalm 91:1","refShort":"Ps. 91:1","top":"He that dwelleth in the secret place","bottom":"of the most High shall abide..."}

Run verify2.py until `problems: 0`, then reply only with: count, and the list of words.
