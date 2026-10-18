# The daily 364 fish

52 weeks of the Bible-in-a-year reading, Sunday to Friday (Friday's double portion has two fish, Saturday is rest): 364 fish, D001 to D364.
Each fish's verse comes from that day's chapters. The 52 weekly first picks and 65 of their alternates (tools/year-fish) sit on the day their verse is read; the other 247 are new words. 358 different words (six year-fish words come up twice) and none of the original 24.

- weeks.json: the reading for each day, and that week's year fish
- weeks/wNN.json: the seven fish of each week
- verify.py: checks every line against the KJV, word for word ("..." where text is left out), and that the verse is in that day's reading
- build.py: writes edit/daily/data.json, which the edit sheet shows as "Daily · 364 fish"

The KJV text (thiagobodruk/bible, kjv.json) is not kept here; verify.py and build.py expect it at ../kjvdl/kjv.json from this folder.
