# Translating the MannaFish Strong's cards

Source: /tmp/claude-0/-home-user-majestic-crm/9a700bef-1320-54c1-abaf-aa01732f367f/scratchpad/step/master-en.json
It has "labels" (UI headings) and "words": 47 entries keyed by Strong's number (G = Greek, H = Hebrew). Each entry:
- s: Strong's short definition
- p: pronunciation guide of the Greek/Hebrew word, written for English speakers
- d: where the word comes from (derivation)
- k: the list of English words the King James Bible uses for it
- use: a sentence on where it is used in the Bible
- senses: list of plain sentences (shades of meaning)
- related: list of [lemma, transliteration, Strong's number, English gloss]
- note: one or two plain sentences

Write the SAME structure, translated, to:
/tmp/claude-0/-home-user-majestic-crm/9a700bef-1320-54c1-abaf-aa01732f367f/scratchpad/step/lex-LANG.json
(LANG is your language code.)

Rules:
1. Translate all of the following into natural, simple, reverent everyday language for ordinary church readers:
   - every label;
   - s, d, k, use, every sense, note;
   - the 4th item (the gloss) of each "related" row.
2. Never change these:
   - Greek or Hebrew words in their own script;
   - transliterations;
   - Strong's numbers such as G303 or H6960;
   - chapter:verse numbers.
3. "p": rewrite the pronunciation guide so a speaker of YOUR language would say the Greek/Hebrew word correctly.
   - Use your language's own script and spelling habits (e.g. Korean hangul, Hindi Devanagari, Chinese characters or pinyin plus characters, Greek letters, Hebrew letters).
   - Mark the stressed syllable the way your language would; for Latin-script languages, capitals for stress are fine.
4. "k": translate the list of KJV words into the matching words of your language, as a comma-separated list.
   - Drop English-only bits such as "(-ted)".
5. Label "kjvtr": translate as "How it is translated (King James Bible)".
6. Label "credit": keep the names "Strong’s", "STEPBible.org" and "CC BY 4.0" exactly.
7. In "use", senses and note, write Bible book names the way your language's standard Bible names them:
   - es: Reina-Valera
   - tl: Ang Biblia
   - zh: 和合本 (Simplified)
   - hi: the Hindi IRV
   - el: the usual Modern Greek names
   - de: Luther/Elberfelder names
   - ko: 개역개정
   - he: the usual Hebrew names for both Old and New Testament books
   Keep the numbers.
8. Do not add or remove meaning. Do not preach. Keep sentences short.
9. Output valid JSON (UTF-8, ensure_ascii false), with every one of the 47 keys and all fields.
   - Check it: python3 -c "import json;d=json.load(open(PATH));print(len(d['words']))" must print 47.
   - Every entry must have the same number of senses and related rows as the English.
   - Writing a small Python script that holds your translations and dumps the JSON is a good way to avoid quoting mistakes.

Reply with just "done" and the count.
