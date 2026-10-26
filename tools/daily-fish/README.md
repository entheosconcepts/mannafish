# The daily 364 fish

52 weeks of the Bible-in-a-year reading, Sunday to Friday (Friday's double portion has two fish, Saturday is rest): 364 fish, D001 to D364.
Each fish's verse comes from that day's chapters. The 52 weekly first picks and 65 of their alternates (tools/year-fish) sit on the day their verse is read; the other 247 are new words. 358 different words (six year-fish words come up twice) and none of the original 24.

- weeks.json: the reading for each day, and that week's year fish
- weeks/wNN.json: the seven fish of each week
- verify.py: checks every line against the KJV, word for word ("..." where text is left out), and that the verse is in that day's reading
- build.py: writes edit/daily/data.json, which the edit sheet shows as "Daily · 364 fish"

The KJV text (thiagobodruk/bible, kjv.json) is not kept here; verify.py and build.py expect it at ../kjvdl/kjv.json from this folder.

## The reading plan with 2 Fish (19 Oct)

Ken: "build the reading plan page and rebalance by length - split into day reading and night and use 2Fish".
/plan/ reads the whole Bible in 52 weeks: six reading days a week, each with a day reading and a night reading (624 readings, whole
chapters, balanced by number of words: about 6 minutes each), and the seventh day for rest and catching up. Each reading has its own
fish: the day fish is "one for me", the night fish "one for you", to send to someone.

- plan/split.py: splits the 1,189 chapters into the 624 readings (plan.json)
- plan/place.py: puts the 364 daily fish on the reading their verse is in (slots.json); 260 land, 55 share a reading with another and stay as spares
- plan/new-fish/: the 315 new fish for the other readings (D365 on); plan/verify2.py checks them against the KJV and the reading
- plan/build_plan.py: writes /plan/plan.json and edit/daily/data.json (679 fish: 624 in the plan, 55 spare)
- export.js: draws each plan fish the way the edit sheet does (the format builder's outlines, tools/fish-format) and saves /fish/<id>.svg (every fish picture is in /fish/, see tools/fish/sync.py) (run it again after fish are edited)
- The chapters themselves are /fish-lang/bible/kjv/<Book>-<chapter>.json
