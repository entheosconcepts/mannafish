# MannaFish master to-do list

Last updated 9 Oct 2026. Newest decisions go at the top of each section.

## Now

### 1. Daily devotional by email and text
Sign-ups are already being saved; nothing goes out yet except phone push notices.
- [x] **Ken:** picked **Brevo** for email (7 Oct). Notes: Brevo for email now (free up to 300 emails a day).
      Text messages through Brevo or RingCentral both need US carrier registration (10DLC or toll-free verification), which takes days to weeks.
- [x] **Ken:** made the Brevo account with kenny@manna-fish.com (7 Oct).
- [x] **Ken:** manna-fish.com authenticated in Brevo through GoDaddy, with links on em.manna-fish.com (7 Oct).
- [x] **Ken:** Brevo API key in Netlify as `BREVO_API_KEY`; sender MannaFish <2fish@manna-fish.com> verified (7 Oct).
- [x] Claude: daily email sender built (7 Oct): 7am in each person's time zone; Daily = Sunday–Friday, Weekly = Sundays, Monthly = first Sunday; English or Spanish; welcome email on sign-up; one-click unsubscribe in every email; the mailing address at the bottom (change with `MF_MAIL_ADDRESS` in Netlify).
- [ ] Sign-ups made before 7 Oct are only in Netlify Forms: Ken sends Claude that list (Netlify → Forms → devotional → export), or those people sign up again.
- [ ] Texts: sign-ups by text are saved and wait for texting to be set up.
- [ ] Texts: register the number (10DLC or toll-free), then turn texting on.

### Devotional email (9 Oct)
- [x] Always black in every mail app (light or dark mode); no big word above the fish (the fish shows it).
- [x] "▶ Listen" button: one tap plays the day's MannaFish aloud in the phone's player (the word, today's verse, the verse on the fish), in English or Spanish, natural voice. Email apps cannot run a player or menus inside the email, so language and voice choices stay on the website.

### 2. Spanish
- [ ] A Spanish speaker checks the 24 verse lines and the site text (print proofs: /print/).
- [ ] Check permission to print RVR1960 on products (Sociedades Bíblicas Unidas / American Bible Society).
- [ ] Ken: notes on the numbered Spanish fish 1–24 (size of "(RVR60)", squeezed lines on 7 Perdona and 12 Sigue).
- [ ] Spanish for the other pages (shop, free devotional, today's catch).

### 3. Before going live (manna-fish.com)
- [ ] Ken says "push it live."
- [ ] Switch the share-preview links from the test site to manna-fish.com.
- [ ] Remove the test site's "do not index" setting from the live copy.

## Next: more languages
Order: English and Spanish (done), then **Tagalog**, **Mandarin Chinese**, **Hindi**, **Greek**, **Hebrew**.
For each one: a free-to-use Bible text, the 24 command words, the verse lines, the site text, a fluent reader to check it, and a lettering font. (The MannaFish Hobo font has no Chinese, Hindi, Greek or Hebrew letters, so a matching font has to be chosen.)
**7 Oct: first drafts are on the site** in the "Select language" menu (header fish button): Tagalog, Chinese, Hindi, Greek. Each needs a fluent reader to check the word and both verse lines before print.
- [ ] Tagalog: Ang Biblia (1905) is free to use.
- [ ] Mandarin: Chinese Union Version (1919) is free to use. The text used is the "New Punctuation" printing; check whether that printing's punctuation needs permission. Ephesians 6:2 was missing from the source and was typed in; check it.
- [ ] Hindi (drafted from the Indian Revised Version 2019, CC BY-SA 4.0): free to use with credit; add a credit line before printing.
- [ ] Greek (drafted from the Modern Greek FPB): check its licence before printing.
- [ ] German (8 Oct, drafted from Elberfelder 1905, public domain): a German reader checks the 24 fish. Ephesians 6:2: this edition puts "Ehre deinen Vater und deine Mutter" at the end of verse 1; the fish shows it as the top line.
- [ ] Korean (8 Oct, drafted from 개역성경, Korean Revised 1952/1961, listed as public domain): a Korean reader checks the 24 fish; confirm it is free to print on products.
- [x] **Word study on the back in each language** (8 Oct): tap a fish in the compare view. Its word, the Greek and Hebrew meanings, the book names, and the start of each verse come from that language's own Bible. Tapping a verse still opens the English (or Spanish) reader.
- [ ] A fluent reader checks the 24 Greek and Hebrew meanings in each language (Claude translated them from the English meanings). Files: fish-lang/study-<lang>.json.
- [ ] Greek: the New Testament in its original Greek, and a modern Greek Bible for Greek readers. Older texts are free to use; check each one.
- [x] **Hebrew** (9 Oct, on the test site): 24 fish lettered right to left in Fredoka (rounded, bold). Old Testament verses from the Masoretic text, New Testament from Delitzsch (1877); both public domain, no vowel marks. The word in the middle is a command to one man. Word study, Bible reader, speakers and Every Tongue in Hebrew too.
- [ ] A fluent Hebrew reader checks the 24 fish, the meanings on the back (fish-lang/study-he.json) and the 15 Every Tongue phrases. Words to look at: נוח (rest) can also read as "comfortable" or "Noah"; חיה (live) can also read as "animal". Vowel marks on just those two words would remove the doubt.
- [x] God's name (Ken, 9 Oct): the fish show ה׳ instead of the four-letter name (TRUST, SING). Spoken aloud as "Adonai". The Bible reader and word study still show the Bible text as written.
- [ ] Hebrew verse numbers follow English Bibles (Psalm 42:5); printed Hebrew Bibles count some Psalms one higher (42:6).
- [ ] Check the Hebrew fish on an iPhone (Safari) before printing.

## Later

### Read the site in any language (9 Oct, on the test site)
- [x] "Read the site in" lists all 8 languages. The chosen one sets the main fish, the word study on its back, the Word/Verse speakers, the Bible reader and Every Tongue. The browser's language is picked the first time.
- [x] "Compare the fish in" lists every language, English too; only ticked fish are shown.
- [x] A verse tapped on a Tagalog, Chinese, Hindi, Greek, German or Korean fish opens that chapter in that language's Bible (fish-lang/bible/). The English version picker and Bible App buttons are hidden there.
- [x] Highlight any words on the page and tap 🔊 to hear them in the reading language (translated first when needed; needs live translation turned on, see Every Tongue).
- [ ] The rest of the page text (headings, buttons, forms) is in English for the 6 new languages. Next step if wanted: translate the ~190 page lines into each language, like Spanish.
- [ ] Bible App (YouVersion) links for the 6 new languages: confirm each one's version number on bible.com, then add the buttons back.
- [ ] Daily devotional emails and phone notices stay English or Spanish.

### Compare looks like the real decal (9 Oct, on the test site)
- [x] Passages and Strong's entries lie on top of the word-study card, the same size, like a card dealt onto a deck; close it to see the card again. Nothing on the page moves.
- [x] Every compared fish is the same card as the single fish: same size, same black frame and padding (phone and computer).
- [x] Turned over, a compared fish keeps its place beside the others (Ken, 9 Oct) and grows taller, laid out like the single fish's word study on a phone.
- [x] "Per row" picker (computer) picks how many fish across, as many as fit at that size; a "✕ Just one fish" button above the fish goes back to one.

### Bible reader speaker (9 Oct, on the test site)
- [x] Words light up one by one as the reader speaks (Bible reader and the readers under each fish).
- [x] With fish side by side, a verse opens right under its own fish in that fish's language, so two or more passages can be open at once, each with its own speaker.
- [x] Everything stays on the site: the Bible App, Bible Gateway and Bible Hub links are gone (Strong's entries and chapters open inside the site).
- [x] In the Bible reader: hear the verse or the whole chapter; pick the language (the passage opens in that language's Bible) and the voice. The verse being read is marked.
- [x] Spanish chapters now show in the reader from the Reina-Valera 1909 (public domain), with a "Leer en RVR1960" link; the fish still quote the RVR1960.

### Every Tongue (built 8 Oct; changed 9 Oct, on the test site)
The Every Tongue button sits with My notes and Sign in. It is a translator first: type or speak, and it is said in the other person's language; "Let them answer" hears them and says it back in yours. The 15 phrases and 4 verses are in a drop-down. "Show them" fills the screen so the other person can read it.
- [x] Voice choice (9 Oct): 11 natural voices (Sage, Coral, Nova, Shimmer, Alloy, Ash, Ballad, Echo, Fable, Onyx, Verse) or the device's own voice. In Every Tongue and in the language menu; used by every speaker on the site. Each line is recorded once per voice.
- [x] 15 ready-made phrases (openers, questions, gift and follow-up) and 4 verses (John 3:16, Romans 3:23, 6:23, 10:9) in all 8 languages. Verses come from each language's Bible.
- [x] "Type or speak": type or say anything; it is translated into their language and spoken. "Let them answer" listens in their language and shows it in yours.
- [ ] **Ken:** turn on live translation. OpenAI → API keys → the MannaFish key → Permissions → set **Chat completions** to Request (or Write). Or make a second key and add it in Netlify as `OPENAI_TRANSLATE_KEY`. Until then the phrases and verses work and "Type or speak" says it isn't switched on yet.
- [ ] A fluent reader checks the 15 phrases in each language (Claude translated them). File: fish-lang/tongue.json.
- [ ] Limits: up to 300 letters at a time, 80 translations an hour per visitor, only from MannaFish pages. Change in netlify/functions/translate.mjs if needed.

### Printing decals in every language (Ken, 9 Oct: discuss and plan later)
Make the fish orderable and printable in Tagalog, Chinese, Hindi, Greek, German and Korean, not just English and Spanish. To plan together:
- [ ] Which languages to offer first.
- [ ] A fluent reader signs off each language's 24 fish before anything is printed.
- [ ] Permission to print each Bible text on products (some are free to use, some need checking: see "Next: more languages").
- [ ] Print-ready files for each language (high-resolution, numbered proofs like the Spanish ones in /print/).
- [ ] Add the languages to the free-decal form, the order emails and the CRM (today they offer English, Español, or one of each).
- [ ] Brand: keep MannaFish™ as the name in every language; maybe a small line under the logo explaining it (e.g. "Maná del cielo + el pez").
- [ ] Costs, how many to print, and shipping outside the US.

### All translations
- [ ] Every language with a free-to-use Bible, the same way as above.

### Already built (7 Oct), waiting on accounts or keys
- [x] **Listen** button under the fish: reads the word and verse aloud (English or Spanish). Uses the phone's or computer's own voice today.
- [ ] **Natural voice (like ChatGPT's):** already wired. Ken adds an OpenAI API key in Netlify → Environment variables as `OPENAI_API_KEY`; nothing else changes. Each verse is recorded once and reused, so cost is a few cents in total. (Optional: `MF_TTS_VOICE` to pick a different voice.) Another voice company (ElevenLabs) can be swapped in later.
- [x] **My notes** under the fish: a note for each word, typed or **spoken** (speech to text, on phones and Chrome/Edge/Safari), with a "Recent notes" list. Saved on that device only, for now.
- [ ] When accounts arrive, notes on the device move into the person's account at first sign-in.
- [ ] **Speaker icon on the fish itself** (Ken, 7 Oct): a small speaker on each fish, including each one in the side-by-side language view, that speaks in that fish's own language. The listener chooses: just the **one word** in the middle, or the **whole verse**. Needs a natural voice for each language (Tagalog, Chinese, Hindi, Greek as well as English and Spanish), and a fluent listener to check each one.

### MannaFish Devotional accounts (website first, no app yet)
**Decided 7 Oct:** use Ken's existing **Yadah** Supabase project (the free plan allows only 2 projects; the other is Scripture That Sticks). One sign-in works across all the Yadah ministry sites; every row is labelled with its site, and each person sees only their own.

Built to last (so a no-fish scripture design, or a new product, needs no rebuild):
- Words and verses are stored on their own (by word key and verse, e.g. HOPE, Psalm 42:5), not tied to the fish picture.
- A **design** is one way of showing a word: its style (fish, plain scripture, or anything new), language and Bible version.
- Notes, highlights and recent activity attach to the **verse**, so they stay when designs change.
- Orders list design, language and quantity, so a fish decal and a plain scripture decal can share one order.
- Table names are general (sites, words, designs, orders, notes, highlights, activity); nothing says "fish".
- Later: decide whether Scripture That Sticks moves in too (only if it serves the same people), which frees the second free slot.

What Claude needs from the Yadah project:
1. [x] **Ken:** the Project URL and the public key (Project Settings → API Keys: "publishable" or "anon public"). Safe to share.
2. [ ] **Ken:** the secret key (or "service_role") goes **only** into Netlify → Environment variables as `SUPABASE_SECRET_KEY`. Never send it to anyone.
3. [x] **Ken:** a screenshot of the Table Editor list, so nothing already in Yadah gets touched.
4. [x] **Ken:** Authentication → URL Configuration: add https://manna-fish.com and https://yadamannafishtest.netlify.app.
5. [x] **Ken:** ran tools/supabase/accounts.sql in Yadah (7 Oct) into the SQL Editor and press Run (creates the tables and the privacy locks).
6. [x] Sign-in emails go through Brevo (Supabase SMTP set 7 Oct; from MannaFish <2fish@manna-fish.com>, up to 30 an hour).

Built 7 Oct (on the test site):
1. [x] Sign in by emailed code or link (no passwords); "My MannaFish" panel under the fish.
2. [x] Notes follow the person to every device; device notes move into the account at first sign-in.
3. [x] "My decal orders" (matched by sign-in email) and "Recently viewed" words.
4. [ ] **Ken:** Netlify → Environment variables → `SUPABASE_SECRET_KEY` (Yadah's secret key), so new decal requests are recorded as orders.
5. [x] **Ken:** sign-in emails replaced with the one-tap MannaFish email (tools/supabase/email-template.html), links last 1 hour (7 Oct).
6. [ ] Highlights on verses (the table is ready; the highlight buttons come next).
7. [x] Privacy & Terms page at /privacy/ (9 Oct), with the texting terms carriers require; linked from the footer, both sign-up forms and every devotional email.
8. [x] Ken confirmed (9 Oct): the Privacy page names Yadah Collaborative.
9. [ ] "Download my data" and "Delete my account" buttons (for now, by email request, as the Privacy page says).

### Phone app
- [ ] Later, once accounts are in use on the website. The website can already be added to a phone's home screen.

### Design polish: centring under the fish
The eye takes the fish's body as its middle, not the whole picture with the tail. The body's middle sits about 10% left of the picture's middle (about 80 px on a computer), so anything centred under the fish looks pushed to the right.
Options, pick one:
- [ ] Centre things under the fish on the body, not the page: move the label or button left by the same 10%. (Recommended; simple and exact.)
- [ ] Move the fish right by that 10% so its body sits on the page's centre line; the tail then reaches past the centred text.
- [ ] Keep two buttons that fill the full width (as now), which sidesteps it.
- [ ] Add a small counterweight on the left (for example the language label), to balance the tail.
Also check the small alternate-language fish and its "English ⇄" label the same way.

### Other ideas waiting
- [ ] Countertop "FishNet" display card print file (PDF).
- [ ] Ken's cut-off message "Move the…" — still to clarify.
