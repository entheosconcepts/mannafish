# MannaFish design review (9 Oct)

Every fish has a number: **language code + word number**, e.g. **TL-01** is the Tagalog "Rest" fish.
Open a sheet to see all 24 fish in that language. On the test site: https://yadamannafishtest.netlify.app/designs/ (all languages; e.g. /designs/tl.png)

## Word numbers
01. Rest
02. Hope
03. Love
04. Trust
05. Pray
06. Believe
07. Forgive
08. Give
09. Seek
10. Ask
11. Knock
12. Follow
13. Listen
14. Remember
15. Choose
16. Honor
17. Grow
18. Gather
19. Accept
20. Breathe
21. Enjoy
22. Live
23. Sing
24. Laugh

## Sheets
- EN English: [/designs/en.png](/designs/en.png)
- ES Spanish: [/designs/es.png](/designs/es.png)
- TL Tagalog: [/designs/tl.png](/designs/tl.png)
- ZH Chinese: [/designs/zh.png](/designs/zh.png)
- HI Hindi: [/designs/hi.png](/designs/hi.png)
- EL Greek: [/designs/el.png](/designs/el.png)
- DE German: [/designs/de.png](/designs/de.png)
- KO Korean: [/designs/ko.png](/designs/ko.png)
- HE Hebrew: [/designs/he.png](/designs/he.png)

## To look at together
- Word size: long words come out smaller. TL-01 (Rest) now keeps taller letters, narrowed to fit (Ken, 9 Oct). Others to review: TL-04, TL-05, TL-06, TL-07, TL-14, TL-19; Hindi and Greek long words.
- Wording: each language checked by a fluent reader (word, verse lines, reference).

Made by tools: the sheets are screenshots of the site itself (scratchpad script tshots.js); the fish are made by tools/more-languages/gen3.js
(`node gen3.js tl REST` with TALL=540 keeps a long word's letters tall).
