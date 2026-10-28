# Russian (Ken, 28 Oct: "yes add Russian and to the translator")

The eleventh language. The Bible is the Synodal translation (1876, public domain), so every Russian fish can be printed.
Everything else (site text, devotional, tour, word-study meanings, Every Tongue phrases, the lexicon) is a first translation
by Claude: **a Russian speaker should read it over before launch.**

| what | file | made by |
|---|---|---|
| the whole Bible, in the KJV's chapter and verse numbers | fish-lang/bible/ru/ | `chapters.py RusSynodal.json Synodal.properties` (scrollmapper + JSword's verse map) |
| text in every language table on the site (89 tables) | index.html, translate/, match/, bible/, you/, basket admin, fish-lang/*.js, functions | `strings.py`, put in by `tables/dump.js` + `tables/add.js` (they add `ru` next to `ar`, and check it has the English's shape) |
| the 24 fish | fish/ru/, fish-lang/ru.json, edit/lang/ru.json | lines in tools/fish-format/lang-lines.json; `node build-lang.js ru`, then `python3 tools/fish/sync.py` (font: Ubuntu Bold, Cyrillic, fonts/ru.ttf and fish-lang/ru.woff2) |
| word study on the back of the fish | fish-lang/study-ru.json | `study.py` |
| the lexicon ("Go deeper") | fish-lang/lex-ru.json | tools/more-languages/lex/lex-ru.json (`lex_build.py` holds the translations) |
| what the voice says, Every Tongue | netlify/functions/lib/speak.json, fish-lang/tongue.json (+ the functions' copy) | `data.py` |

References keep the KJV's numbers, like every language on the site; a printed Synodal Bible numbers many Psalms one lower
(Psalm 42:5 here is 41:6 there). Fish tails read "(СП)", Синодальный перевод.
