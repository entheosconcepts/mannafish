# One Word: a year through the Bible, one word a day

Ken, 21 Oct: "If I'm using the scripture references on the back of a fish and I read each scripture reference in the context of the
whole chapter ... is there any way we could make that a year Bible ... with that one word can be found in four different chapters per day?"

The result is `plan/oneword.json`, the **One Word** tab of Bible in a Year (`/plan/?word=1`):

- 297 days (six days a week, the seventh to rest), each with its own MannaFish word, never repeated
- each day: four KJV chapters that all contain that word (one day has five), with the best verse in each
- every one of the 1,189 chapters exactly once
- most days one New Testament chapter and three from the Old (a few words, like Knock and Faith, live mostly in the New)
- all the main fish words except Listen (the KJV says "hearken")
- the days run in order of where each day's first chapter is, so the year starts in Genesis and ends in Revelation

How it was made (`build.py` has the steps): every fish word and its KJV forms counted in every chapter (`inc.py`); an integer
program finds the year (`solve.py`, scipy/HiGHS); each chosen chapter was then read to check the word means the same thing there
(not "the rest of them" for Rest, not "lie in wait" for Wait, not the stone tables for Table); a rejected chapter is left out and the
year found again, until every chapter passed (`reviewed.json`: 1,398 checks, 116 rejected; `banwords.json`: words left out because
they mostly mean something else in the KJV). `days.json` is the final year.
