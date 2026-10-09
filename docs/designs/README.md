# MannaFish design review (9 Oct)

Every fish has a number: **language code + word number**, e.g. **TL-01** is the Tagalog "Rest" fish.
Open a sheet to see all 24 fish in that language. On the test site: https://yadamannafishtest.netlify.app/docs/designs/tl.png

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
- EN English: [en.png](en.png)
- ES Spanish: [es.png](es.png)
- TL Tagalog: [tl.png](tl.png)
- ZH Chinese: [zh.png](zh.png)
- HI Hindi: [hi.png](hi.png)
- EL Greek: [el.png](el.png)
- DE German: [de.png](de.png)
- KO Korean: [ko.png](ko.png)
- HE Hebrew: [he.png](he.png)

## To look at together
- Word size: long words come out smaller. TL-01 (Rest) now keeps taller letters, narrowed to fit (Ken, 9 Oct). Others to review: TL-04, TL-05, TL-06, TL-07, TL-14, TL-19; Hindi and Greek long words.
- Wording: each language checked by a fluent reader (word, verse lines, reference).

Made by tools: the sheets are screenshots of the site itself (scratchpad script tshots.js); the fish are made by tools/more-languages/gen3.js
(`node gen3.js tl REST` with TALL=540 keeps a long word's letters tall).
