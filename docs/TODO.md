# MannaFish master to-do list

Last updated 7 Oct 2026. Newest decisions go at the top of each section.

## Now

### 1. Daily devotional by email and text
Sign-ups are already being saved; nothing goes out yet except phone push notices.
- [ ] **Ken:** pick the sender. Recommended: **Brevo** for email now (free up to 300 emails a day).
      Text messages through Brevo or RingCentral both need US carrier registration (10DLC or toll-free verification), which takes days to weeks.
- [ ] **Ken:** make a Brevo account with Ken@Manna-Fish.com (not the Majestic account).
- [ ] **Ken:** in Brevo, add the manna-fish.com sender domain. Brevo shows 3–4 DNS records to paste where the domain is hosted.
- [ ] **Ken:** in Brevo, create an API key, then paste it in Netlify → mannafish site → Environment variables as `BREVO_API_KEY`. (It never needs to be sent to anyone.)
- [ ] Claude: build the daily sender: 7am in each subscriber's own time zone, Daily / Weekly / Monthly, Spanish or English, an unsubscribe link in every email, and STOP for texts.
- [ ] Claude: move the sign-ups already saved into the sender list.
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
- [ ] Tagalog: Ang Biblia (1905) is free to use.
- [ ] Mandarin: Chinese Union Version (1919) is free to use.
- [ ] Hindi: check permission for the Hindi Bible text first; most current Hindi Bibles are owned by the Bible Society of India.
- [ ] Greek: the New Testament in its original Greek, and a modern Greek Bible for Greek readers. Older texts are free to use; check each one.
- [ ] Hebrew: the Old Testament in its original Hebrew, and a Hebrew New Testament. Older texts are free to use; check each one. Hebrew reads right to left, so the fish lettering runs the other way.

## Later

### All translations
- [ ] Every language with a free-to-use Bible, the same way as above.

### MannaFish Devotional accounts (website first, no app yet)
Sign in with email (a one-time code or link, no password to forget). Free.
The tools devotional readers use most, roughly most-requested first:
- [ ] Save highlights in colours, on any verse
- [ ] Notes / journal on a verse or a day's word
- [ ] Bookmarks and favourites
- [ ] Recent activity: words read, verses opened, notes written
- [ ] Reading streak and gentle reminders (choose the time)
- [ ] Reading plans (the 24-word, 2-week rhythm is the first plan)
- [ ] Prayer list, with "answered" marks
- [ ] Memory verses with simple flash cards
- [ ] Share a verse as an image (the fish as the picture)
- [ ] Pick a Bible version and language, remembered
- [ ] Search the Bible
- [ ] Listen (audio Bible where the version allows it)
- [ ] Small groups: share a word or note with friends or a church group
- [ ] Download or export my notes
- [ ] Delete my account and everything in it

Needs: a separate database for MannaFish (not Majestic's), a privacy page, and a way to export or delete a user's data.

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
