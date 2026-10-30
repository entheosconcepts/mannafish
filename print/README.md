# Sponsored runs: the decal cards

Every printed batch of MannaFish decal cards is a **run**. A run is one small file in `print/runs/` (R0001, R0002, ...).
From it, `tools/print/make.mjs` makes every file the printer needs, plus a proof to check. Nothing is designed by hand twice.

## The card

4.5 x 2.75 in (114.3 x 69.85 mm). StickerApp's site rounds this to 2.8 in, so ask for a **custom size of 4.5 x 2.75 in**.
Every file has a 1/8 in bleed on each side, and all the fish-side files line up with each other.

| Layer | What it is | File |
|---|---|---|
| 1 | The decal: clear vinyl, white ink only, the letters left clear | `-1-decal-white-ink` (.png 1200 dpi, .pdf) |
| 2 | The front of the backing paper, under the decal: black, the same fish in white | `-2-backing-front` (.pdf vector, .png 1200 dpi) |
| 3 | Cut lines: the printer draws its own kiss cut (about 1/8 in outside the fish) and card edge. Ours (**CutContour** and **ThroughCut** spot colours) is kept ready and only goes in the zip when the run says `"send_cut_file": true` | `-3-cut-lines` (.pdf, .svg) |
| 4 | The back of the backing paper: the invitation, read with the card turned on its side | `-4-back` (.pdf, .png 600 dpi) |

The proof (`-proof.png` / `.pdf`) shows all four, how they look before and after peeling, where every QR code goes, and
what is still missing. `-printer-notes.md` is the note to send with the files, and `-print-files.zip` holds everything to attach.

## A new run

1. Copy `print/runs/R0001.json` to the next number and change it:
   - `fish`: the word (`LIVE`, `LOVE`, ...) and the language (`en`, `es`, ...). Any fish in `fish/` works; for the others give its `id` too (`"id": "W19b"` is Build).
   - `qty`, `sponsor` (name, logo, `anonymous: true` to leave the name off), `status`.
   - `for`: who it is a gift through (name and logo), when the sponsor gives anonymously. The card then says
     "A gift to you through" that name, not "Sponsored by".
   - `back`, one of three:
     - `"template": "invite"`: the invitation card (heading, the logo at the top, the words, a big QR code `qr`).
     - `"template": "study"`: the word study of the fish (Greek, Hebrew, meanings, ten verses to look up), like the old word-study card.
       The 24 fish have theirs already; for any other fish, write one in `print/study/<WORD>.json` (see `BUILD.json`).
     - `"template": "image"` with `"image": "assets/<file>.png"`: your own finished artwork, as it is.
     The invite and study backs end with the same strip: the `left` and `right` QR codes (each with a `label` and a web address in `to`)
     and who it is from in the middle.
2. Put logos and artwork in `print/assets/` (the bigger the better: 1000 px wide or more).
3. Run `node tools/print/make.mjs R0002` (once, before the first run: `cd tools/print && npm install`).
4. Open `print/out/R0002/R0002-proof.png`. When it's right, set `"status": "approved"`, run it again, and send the files.

Statuses: `draft` → `proof` → `approved` → `ordered` → `shipped` → `delivered`.

## The QR codes

Every QR code made here opens **manna-fish.com/q/&lt;code&gt;** (R0001 is the main one, R0001s the left, R0001m the right).
That page counts the scan and sends the person on to the address in the run. So a card already printed can be pointed
somewhere new by changing the run, and nobody scans anything at the door: one QR per order is the tracking.
`/q/` has to be live on manna-fish.com before cards are printed.

## Watching it

**/print/admin/** lists every run with its proof, its files, what still needs doing, and (with the admin password)
how many times each QR code has been scanned. The same two lists (`print/runs.json`, `print/links.json`) are what the
Majestic Awards CRM's Engagement Center would read to show runs and scans next to each sponsor.
