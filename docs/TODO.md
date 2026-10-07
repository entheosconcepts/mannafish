# MannaFish master to-do list

Last updated 7 Oct 2026. Newest decisions go at the top of each section.

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
- [ ] Greek: the New Testament in its original Greek, and a modern Greek Bible for Greek readers. Older texts are free to use; check each one.
- [ ] Hebrew (shows as "soon" in the menu): the Old Testament in its original Hebrew, and a Hebrew New Testament. Older texts are free to use; check each one. Hebrew reads right to left, so the fish lettering runs the other way.

## Later

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
5. [ ] **Ken:** Supabase → Authentication → Emails: in "Magic Link" and "Confirm signup", add the line `Your code: {{ .Token }}` so the email shows a code as well as the link.
6. [ ] Highlights on verses (the table is ready; the highlight buttons come next).
7. [ ] Privacy page, "Download my data" and "Delete my account".

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
