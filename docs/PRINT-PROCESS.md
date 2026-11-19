# The print process: one way, every time (Ken, 20 Nov 2026)

Everything starts in **the builder** on the home page (admin password in the browser) and is kept automatically. Nothing needs to be found, renamed or uploaded twice.

## The steps
1. **Build.** Open the builder. Pick the word, the verse, the link, the logo (choose a **saved logo** from the list, or upload a new one once), the wording (**saved wording** lists for the line above the logo and for the two lines under the QR codes), the quantity, the words.
2. **Save my work.** Keeps the build in the **Build history** (admin page, top). Also gives a link that brings the order back on any device.
3. **Download the print files.** One zip: a folder per word with the one-page PDF, the decal (PNG), the background (PDF), the back (PNG) and the notes. The zip is kept in the Build history too (kept forever, with the date in its name).
4. **Check** the one-page PDF (the decal looks empty on a white screen: it is white ink on clear; the one-page PDF shows it on a dark checkerboard).
5. **Send** to the printer: attach the one-page PDF and the three print files. Many sponsorships at once: tick **In print batch** on the admin page and **Send to the print company** (a link to every file, and the list of who gets what).
6. **Proof and confirm.** The printer sends a proof of all three layers; approve it before they print. Mark the order **proof / printing / done** on the admin page.

## Where things are kept (admin page, `/print/orders/`)
| What | Where | Kept |
|---|---|---|
| Every build and its zip | Build history (top of the page) | forever; "Open as a copy" to change and download again |
| Logos | Saved logos (also from every sponsor request) | forever, once per picture |
| Wording | Saved wording (above the logo; under the QR codes), most used first | forever |
| Sponsor requests | the order list below | forever |
| What went to the printer in a batch | links in the email you get (30 days) and the Build history zips | |

## Names
Zip: `<order or MannaFish-sponsorship>-print-files-<date>.zip`. Folder per word: `01-Build/`. Files: `1-decal-white-ink.png`, `2-background.pdf`, `3-back.png`, `0-one-page-actual-size.pdf`, `printer-notes.txt`. No cut-line file: the printer cuts to its own line (1/8 in or less outside the fish).

## Rules that do not change
- The decal is clear vinyl, white ink only; the black is the **background** printed on the card under it.
- QR codes: counted (`/q/<order>-<n>`) once an order is open for editing; straight to the link before that.
- Never send a file the printer has not been told to use: say which files are the print files in the email (the one-page PDF first).
