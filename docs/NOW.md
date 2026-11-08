# MannaFish: where we are (read this first; keep it to one page)

Updated 7 Nov 2026. Claude updates this at the end of every job, without being asked. The long history is in `docs/DECISIONS.md` (open it only when a detail is missing).
Test site: https://yadamannafishtest.netlify.app/ (branch `test-site`). Live site manna-fish.com is the old decal shop page on `main` until Ken says "push it live".

## Just finished (7 Nov)
- New card in one command: `node tools/print/new-run.mjs --name ... --logo ... --url ... --word ...` (template `print/templates/sponsor-back.json`, see `print/README.md`). Home sign-up reads "free MannaFish Devotional and merch" with the monthly basket wording.
- Home page: What is MannaFish? now comes first, then What is 2 Fish?; sign-up heading "Sign up for free MannaFish devo and merch!" with a merch checkbox. Bible page: collapsible Today's MannaFish card (`/api/today-fish`).
- Print backs (word study, two QR codes, sponsor logo) for K-Tech (Build, R0007) and Market Street Tires (Repair, R0008 English, R0009 Spanish). `/flip/` shows the card front and back in English or Spanish to a customer (admin menu has the link).
- Notes on any fish in any language: `/fish/review/` (language picker, 📝 notes) and the 📝 button in `/edit/`. Server side (`/api/fish-notes`).
- Bible reader: Explain & apply, search, side-by-side columns, ElevenLabs voices (`/voices/`), no phone voice anywhere.

## Waiting on Ken
- 318 held fish (Uncategorized): name their series later; decide the 38 "maybe" ones. Only the 347 action fish go in the daily pot now.
- Weekly / Monthly / Spanish only send the 24: tell Claude your sign-up type and say go to put everything in one pot.
- **Daily email links are broken** (8 Nov): they go through r.em.manna-fish.com, which shows a Google 404. Needs a fix in Brevo and the manna-fish.com DNS (see DECISIONS.md, 8 Nov). Must be fixed before going live.
- Bulk sponsorship page (`/sponsor/`): confirm the prices ($2 each at 1,000 or more, $3 under 1,000, minimum 100), how people pay (invoice first, or card payment), StickerApp's real cost, and the name "MannaFish Hub". Nothing is on the site yet.
- Monthly basket drawing (one random sign-up a month gets the 2 Fish and 5 Loaves gift basket; one per household per year): the wording and the merch checkbox are on the home page; the draw tool is not built. Say go and I will build the admin draw.
- "Got Eternal Life?" (left QR when MannaFish is the sponsor): where should it go? I can write a short page from Scripture.
- Surprise baskets (about 1 in 30 of the merch sign-ups): the checkbox is built, the draw is not. Decide how (suggestion in DECISIONS.md, 7 Nov). Also: does the Bible app need a separate "about" landing page, or is the collapsible fish enough?
- Market Street: pick the Repair verse (A Isa 61:4, B Isa 58:12, C 2 Kings 12:5, D 2 Chr 24:4, E 2 Chr 34:10, F Neh 3:28) and the Spanish word (Reparen / Reparador / Restaurad); the shop's web address or phone for the left QR; a Spanish speaker to check the Spanish card.
- K-Tech's real logo (a stand-in is on the card).
- Go-live decisions below.
- Daily-email fish choice ("Song", B1): do nothing until Ken says.

## Go live this week (Ken, 7 Nov: "make this devotional go live on manna-fish.com")
Claude's part: bring `test-site` into `main`; check Today, sign-up and welcome email, Pray, Bible, Plans, privacy page; confirm Google can index it. The live Netlify site is separate from the test one.
Ken's part (about an hour): 1. In Netlify, open the manna-fish.com site → Environment variables: same names as the test site (BREVO_API_KEY, OPENAI_API_KEY, SUPABASE_SECRET_KEY, MF_ADMIN_KEY, PROOF_KEY, ESV_API_KEY, ELEVENLABS_API_KEY). 2. Sign up on the test site with your own email and read it for a few days (or accept going live with fewer days). 3. Say "push it live".
Claude does before going live: put the admin key on `/api/fish-notes` and `/api/fish-flags`; check Brevo is allowed to send from manna-fish.com; make sure the old decal shop page is not lost (it is replaced by the new site). After going live: set `MF_SEND_OFF=1` on the test site so only one site sends the daily email.
Not needed for launch: texting (carrier registration), app stores, sponsor pricing, decal sales (the basket stays a waitlist).

## Open lists
- Ken's to-do list: `docs/UPDATES.md`. Launch plan: `docs/LAUNCH.md`. Every open question with its options: `docs/DECISIONS.md` section B.
