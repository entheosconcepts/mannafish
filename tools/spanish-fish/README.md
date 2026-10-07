# Spanish MannaFish fish

`fish-es/*.svg` are the 24 Spanish fish. Each is built from Ken's own English artwork: the
fish body and the MannaFish™ tail are taken unchanged from his HOPE file (all 24 English
files share the identical body and tail). Only the word, the verse and the reference are
new, set in his Hobo face (font-family `MFHobo`, which the site already loads).

- Words are call-to-action commands (Espera, Ama, Confía…), as on the English fish.
- Verses are Reina-Valera 1960, typed from memory: **a Spanish speaker must check every
  line against an RVR1960 Bible before anything is printed.** The list is
  `verses_es.json`.
- RVR1960 is copyrighted (Sociedades Bíblicas). Check its permission terms before
  printing it on products.
- For print, the text must be converted to outlines first (these files reference the font).

Rebuild: `node gen2.js` from a folder containing `hobo.txt` (the MFHobo woff2 data URL),
`en/HOPE.svg` and `verses_es.json`.
