# MannaFish: to-do list for updates (3 Nov 2026)

Everything here is on the test site (https://yadamannafishtest.netlify.app/) until Ken says "push it live".

## Before family and friends (soft launch)
- [ ] **Ken:** try 💡 Explain & apply on a few chapters you know well (Bible → toolbox → Explain & apply, or select a verse → Explain). Tell Claude anything wrong, strange or off-tradition; Claude tightens the rules. Have a pastor spot-check a sample before launch.
- [ ] **Ken:** decide which tradition the explanations should lean toward (the safest is broad, widely shared Christian teaching, which is what it is told to do now).
- [ ] **Later:** Matthew Henry, Spurgeon, Barnes, Clarke, Gill and Jamieson-Fausset-Brown (public domain) need a source the build environment can reach; Chuck Smith and David Guzik need permission.
- [ ] **Ken:** after the test site deploys, open https://yadamannafishtest.netlify.app/api/fish-img?k=D007 (the Visit picture) and https://yadamannafishtest.netlify.app/api/fish-standard (your saved word-size rules). Tell Claude if Visit looks right; then Claude runs `redraw-standard.mjs --write --png` so the saved fish files (site pages, print) match too.
- [ ] **Ken:** go through the test checklist (••• → Admin view → ✅ Test checklist). Note anything with 📝 Note something to change.
- [ ] **Ken:** check the live site's Netlify settings match the test site (BREVO_API_KEY, OPENAI_API_KEY, SUPABASE_SECRET_KEY, MF_ADMIN_KEY, PROOF_KEY), then say "push it live".
- [ ] **Ken:** the original Remember fish says "remembrance" in its verse: keep it, or pick another verse?
- [ ] **Claude (on Ken's word):** the Spanish, Tagalog and German fish against the "word in its verse" rule.
- [ ] **Ken:** a Spanish speaker to proofread the Spanish fish and site.
- [ ] **Ken:** the real K-Tech logo (the card uses a stand-in), or drop that sample run.
- [ ] **Ken:** word size and place: pick templates on the edit sheet, tap 📋 Copy the averages, paste to Claude.

## Sponsors and printing
- [ ] **Ken:** scan a printed proof of R0006 (inverted QR codes) with your own phones; if any will not scan, we switch to normal black-on-white tiles.
- [ ] **Claude (on Ken's word):** a proper landing page for the card QR (today's devotional, and a clear sign-up by email and by text), and update the website's sign-up path so people click the right thing. Texting needs the US carrier registration first (see Growing it).
- [ ] **Ken:** pricing for sponsored card orders (the cart shows no price; requests come to /print/orders/).
- [ ] **Ken:** the printer (StickerApp or another) and who mails the cards.
- [ ] **Ken:** the legal home for sponsorships (Yadah Collaborative, with a CPA or nonprofit attorney).
- [ ] **Claude:** a print run from a card order (logo, link, the fish) once a first order comes in.

## Voices
- [x] **Ken:** ElevenLabs account and `ELEVENLABS_API_KEY` in Netlify (done 6 Nov). Claude built the support and /voices/.
- [ ] **Ken:** open /voices/, ⭐ favorites, press Copy my favorites, paste to Claude, and say where to feature them.
- [ ] **Claude:** a voice taste-test page (the same verse in each voice).
- [ ] **Ken:** paste docs/HANDOFF-CRM-VOICES.md into the CRM chat for the CRM tour speaker.

## Growing it
- [ ] **Claude:** an action fish for every chapter of the Bible (559 chapters without one), a book at a time for Ken to approve.
- [ ] **Claude:** Make it a MannaFish in Greek, Hebrew, Chinese, Korean, Arabic, Hindi and Russian (their own lettering).
- [ ] **Claude:** a "start here" for first-time visitors, and fewer names (Basket/Love, Hubs, Pond, Jars and Doors, 2 Fish, Take 2).
- [ ] **Claude:** a simple numbers page: sign-ups, fish shared, what people use most.
- [ ] **Ken:** texting (US carrier registration), when wanted.
- [ ] **Ken:** Brevo's paid plan once the daily email passes about 300 people.
- [ ] **Later:** the app (after the soft launch, feedback, printing and sponsors): Yadah's D-U-N-S number, Apple and Google accounts.

## Done on 3 Nov
Back button on the Books screen · Go Fish: Make it my fish today · no fish two days in a row · Bible tools under the chapter
heading · Build follows the standard size and centring · Admin view / User view · co-labor back with nine Scriptures · Make the
back yours with a cart (at least 100) · the devotional read on the card (Listen) and turned over (Read) · Free MannaFish → find
or nominate a Hub · every fish from the email opens on the Today page.

## Maybe later (ideas Ken parked, not decided)
- [ ] **Dismissible message card on Today** (idea from the YouVersion app's "Discover More / Dismiss" card, 12 Nov): sponsor thank-yous, the 2 Fish Challenge, a Hub opening. Parked: "not yet, maybe later".
- [ ] **Public "why it's free" page**: the vision story, sponsors thanked by name, a running count of fish given away, one Sponsor a fish button; later a simple journal by year and category (YouVersion blog as the model). Parked.
- [ ] **A quiet "days in the Word" count** (a streak with no points or badges) and a **Community tab** with a red dot (fish stories, Hubs, nominations). Parked; the streak needs Ken's OK because of the no earn-style rewards rule.
- [ ] **Reminders that work when the app is closed** (per-person times through the push system); the dashboard calendar only buzzes while MannaFish is open.
- [ ] **Approve / ban page for made fish** and blocking a user (the made-fish emails exist; this is the next step if they start arriving flagged).
