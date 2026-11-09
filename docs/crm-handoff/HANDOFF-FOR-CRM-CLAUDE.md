# Handoff: sponsor invitations for MannaFish, built inside the Majestic Awards CRM

Paste this whole file into the Claude Code session that works on the Majestic Awards CRM (Ken's words below are the brief).
Written 9 Nov 2026 by the MannaFish session. The MannaFish repo is `entheosconcepts/mannafish`, branch `test-site` (never `main`).

## Ken's brief (his words, from voice)
"I need an email template I can put inside my Majestic Awards CRM for sending email campaigns or individual emails to small, Christian-owned businesses, podcasters, content creators and churches that would want to sponsor this free app and the MannaFish vision, the 2 Fish Challenge. I should be able to select a MannaFish, flip it over, add the QR code and upload the logo under the Sponsored by section. I want it built inside the CRM under the Majestic Awards tab. The only thing that changes per prospect is the logo and the QR code. I need print files and mock-up files I can download and show the customer. Start with one email, then three: Archaic Construction, K-Tech (my brother's business), Market Street Tires. Shattered into Beautiful podcast is next."

## What to build in the CRM (v1)
1. **A "MannaFish sponsor" section** under the Majestic Awards tab, one record per prospect:
   name, type (business / podcaster / creator / church), contact name, email, website, logo upload, the word (fish), language (English or Spanish), notes, status (draft, sent, replied, sponsoring).
2. **Files per prospect** (downloadable): the mock-up pictures and the print files (see "What the MannaFish side produces").
   Store them against the prospect record. Show the front and the back side by side, with a Download button for each and for the zip.
3. **Email template(s)** in the CRM's own template system, with merge fields:
   `{{first_name}}`, `{{business_name}}`, `{{word}}`, `{{front_image_url}}`, `{{back_image_url}}`, `{{website}}`, `{{sender_name}}`.
   Use the CRM's existing send, single and campaign. Copy is below.
4. A **preview** that shows exactly what the prospect will get before sending.
Do not change anything outside the Majestic Awards area, and tell Ken what you changed.

## What the MannaFish side produces (already built; do not rebuild it)
The generator lives in the MannaFish repo (`tools/print/`, needs Node and Playwright/Chromium, so it cannot run inside a serverless function):
`node tools/print/new-run.mjs --name "Market Street Tires" --logo /path/logo.png --url https://www.marketsttiresandauto.com/ --word REPAIR [--lang es] [--left "Free tire check"] [--qty 100]`
It writes `print/runs/R000n.json` and builds `print/out/R000n/`:
`-front-preview.png` and `-4-back.png` (customer mock-ups), `-proof.png`/`.pdf` (all layers), and `-print-files.zip` (decal white ink, backing front, cut lines, back). Spanish: add `--lang es`. Full notes: `print/README.md`.
Each card has a word on the fish, its Greek and Hebrew meaning, nine verses, two QR codes: left to the sponsor's website, right "Free MannaFish" (the free devotional sign-up). The QR codes open manna-fish.com/q/<code> first (counts scans), then go on. **That only works once manna-fish.com is live** (Ken is still deciding when; until then QRs on mock-ups are examples).
Samples are in this folder: R0007 (K-Tech, Build), R0008 (Market Street, Repair, English), R0009 (Market Street, Spanish).

## The tie-in (my recommendation, for Ken and you to confirm)
- **v1 (do this now):** keep the generator in the MannaFish repo. In the CRM, a prospect record collects the inputs (word, language, logo, website). A person (Ken, via a MannaFish session) runs the one command above, and the files are uploaded to the prospect record. This works today with no new infrastructure.
- **v2 (later, only if Ken wants it hands-free):** a "Make card" button in the CRM that sends the same inputs to a small job in the MannaFish repo (for example a GitHub Action running `new-run.mjs`) that returns the finished files to the CRM. Protect it with a key kept only in Netlify/GitHub secrets. Do not build v2 until Ken asks.
Why not render cards inside the CRM: the print files must match the fish standard and the Greek/Hebrew study pages exactly, and that lives in the MannaFish repo.

## Email copy (draft; Ken edits; no prices anywhere)
Subject: A free MannaFish for {{business_name}}
Body (short, plain, warm):
> Hi {{first_name}},
> I'm building MannaFish: one word of Scripture in the middle of a fish, with its verse around it. The app is free, with the whole Bible, a daily devotional and the 2 Fish Challenge (give two fish away).
> I made a fish for {{business_name}}: **{{word}}**. Here is the front and the back, with your logo under "Sponsored by" and a QR code to your website.
> [front picture] [back picture]
> Sponsors give these fish away to customers, neighbors and friends. They are never sold. Would you like to talk about sponsoring a batch?
> {{sender_name}}, Entheos Concepts, 4563 Technology Dr, Unit 6, Wilmington NC 28405
Include an unsubscribe line if the CRM requires one.

## The first three
| Prospect | Word | Language | Website for the left QR | Files |
|---|---|---|---|---|
| K-Tech Construction (Ken's brother) | Build | English | https://k-tech-porch-enclosures.netlify.app/ | R0007 here (real logo still wanted) |
| Market Street Tires | Repair | English and Spanish | https://www.marketsttiresandauto.com/ | R0008 / R0009 here |
| Archaic Construction | not chosen yet | English | Ken to give | needs logo and website |
Next: Shattered into Beautiful (podcast), word and website to come.

## Rules from Ken
- Never put a secret, token, password, EIN or Ken's home address in any file. The business address is the one above.
- No dollar amounts. The fish are never sold or resold; sponsors pay so the fish can be given away.
- No celebrity voice imitation; keep replies and copy short, plain and honest.
- Say plainly what was not tested. Do not push to MannaFish `main` or touch manna-fish.com.
