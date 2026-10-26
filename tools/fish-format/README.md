# Fish format builder (26 Oct)

Ken: "all fish like the other 24 in Hobo, positioned and proper size ... printable just like the 24."

- `fishfmt.js` draws a fish from {word, top, bot, ref}: Ken's body and MannaFish(TM) tail, the word in Hobo with his
  27.8 white outline, the verse along the two curves, the reference on the tail. Every letter is written as an outline
  (opentype.js), so the SVG needs no font and prints like the 24.
- `ken24.json`: Ken's 24 English fish, measured from his artwork (meas.py on renders from render.js): word size, width,
  centre, how far each verse line runs along its curve and how much it is narrowed.
- `derive.js`: the layout rule from the fish Ken picks as the standard (medians of their measurements).
- `geo.json`: the body and tail (from edit/new/base.svg), the two verse curves sampled, the eye width, the tail spot.
- `buildall.js`: rebuilds Ken's 24 (to check the rule) and the 128 year fish; needs opentype.js and Hobo as an OTF
  (fontTools: fish-lang/hobo.woff2 saved without the woff2 flavor).

The picker page (Claude artifact "MannaFish Format Builder") shows the 24 to choose from, the rule, and before/after.

## Placing the word (Ken, 26 Oct: Bless touching, With too tall, Keep off balance, Atone and Tend too close)

Each is measured from the letters, with their white outline, to the eye's inside edge (`geo.json` eye: rows, columns, outline):
1. size from the rule (short words: the standards' letter height; longer: fill the eye's width; too long: narrowed, like Remember)
2. tall letters: more than half the letters tall (capitals, b d f h i j k l t) and the word is set smaller, up to 15% (`word.tall`)
3. balance: as much room left as right, and above as below
4. room: no letter closer than `word.room` (the middle of the standards' closest approach, 40 of 4,000) to the edge; else smaller

## The Go Fish net (fish/net.json): drawn by this rule

`node build.js` (OPENTYPE, HOBO as above) redraws fish/<id>.svg for the 128 year fish and Tend from `net-lines.json`,
with the nine recommended standards (or PICKS=REST,LOVE,...). Their pictures need no font.
Note: tools/daily-fish/export.js draws fish the edit sheet's older way; running it for these ids would undo this.
