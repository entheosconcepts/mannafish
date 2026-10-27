# MannaFish launch checklist

Ken, 25 Oct: launch the free devotional first (digital only), decals "coming soon", feedback from the first 20–50 readers.

## Ken's part (about 3–4 hours in all)

1. **Read it for a week.** Sign up for the devotional on the test site with your own email. Read it each morning on your phone for a week (Sunday to Friday at 7am; a double portion on Friday; nothing on Saturday). Anything wrong or confusing: use ••• → Tell us what you think.
2. **Two other people.** Have your wife and one friend sign up and use it for a few days: Today (Listen, Read), Free Devotional, Pray (Time with God), Bible.
3. **The live site's settings.** manna-fish.com is a separate Netlify site from the test site. In Netlify, open the **manna-fish.com** site → Site configuration → Environment variables, and check it has the same settings as the test site: `BREVO_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`, `MF_ADMIN_KEY` and `PROOF_KEY`. Never paste a key into a chat.
4. **Say "push it live".**

## Claude's part, on "push it live"

1. Bring the test-site branch into `main`, so manna-fish.com gets everything.
2. Check on manna-fish.com:
   - Today: the fish, Listen and Read; the tabs (Today, Bible, Plans, Pray, You).
   - Free Devotional sign-up, and the welcome email arrives.
   - Pray (Time with God), the Bible, Plans, You.
   - Tell us what you think (the email arrives), and the decal waitlist.
   - The privacy page.
   - Google can find it: no `X-Robots-Tag: noindex` on manna-fish.com (it stays on the test site, from `netlify/edge-functions/noindex.js`).
3. Tell Ken it is live, with anything that did not work.

## Right after launch

- **The test site stops sending.** In Netlify, on the **test** site, add `MF_SEND_OFF` = `1`, so it sends no more daily devotionals. The two sites keep separate lists, so anyone who signed up on the test site signs up again on manna-fish.com.
- **People already signed up on manna-fish.com** (from September) start getting the new daily email.
- **Soft launch:** send the link to 20–50 people (church, family, friends), and ask them for two weeks of the daily email and Time with God.

## Later, when ready

- **Texting:** when Twilio approves, add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_MESSAGING_SERVICE_SID` to the manna-fish.com site, and point the Twilio webhook at `https://manna-fish.com/api/sms-in`.
- **Decals:** when they can be sent, add `MF_BASKET_OPEN` = `1` on manna-fish.com, and Claude switches the basket from waitlist to real requests (`WAIT` in `fish-lang/basket.js`, and the Free MannaFish form). Then email the waitlist (in Netlify Blobs, `mannafish-basket`, status `waitlist`, and Netlify Forms, `free-gift`).
- **After two weeks of feedback:** decide decals, sponsors, and the game on its own.

## Next updates (Ken's list)

- **Audio upgrade** (Ken, 27 Oct: "the audio needs help ... put on list for an update"). Today the Bible tab and Plans read
  with the phone's own voice, and everything else with OpenAI's voices. The plan:
  1. Record each chapter once in the chosen voice and keep it on the server (instant, the same on every phone, no cost after).
  2. Bible tab and Plans: apply to Faith Comes By Hearing's Digital Bible Platform (free for ministries, human narration in all
     ten languages; each recording has its own permissions). If not, ElevenLabs: Ken's own cloned voice or a designed one.
  3. Devotional and site voices: move the voice characters (Thunder, Narrator, Highlander, Grace, Magnolia, Heather) to
     ElevenLabs or Azure so they sound truly different.
  4. Before paying: a "voice taste test" page plays the same verse from each choice. Any key goes in Netlify's environment
     variables, never into a chat.
  Waiting on Ken: (a) Faith Comes By Hearing, (b) an ElevenLabs trial, or (c) both side by side.
- **Sharing with friends** (Ken, 27 Oct): notes, highlights, prayers and scripture art each Only me / chosen friends / all
  friends / everyone, changed with one tap, with a default in Settings; friends by invite link, QR or email request.
  Kept on the server, forward compatible. Waiting on Ken: build right after launch?
- **Fill the Net** (Ken, 27 Oct): each fish design fills a net of 100 (requests, and sponsors who stock it); a full net is
  printed as one run and shipped to a MannaFish Station (church, bookstore, sponsor) for pickup, always free. Waiting on Ken:
  100 per design, stations, and printable fish limited to the 24 plus the fish of the week?
- **Reference icons in the Today reader** too (they are on the Bible tab now), if Ken wants them.
- **Action words for every fish** (Ken, 27 Oct). Today the 24 main fish are all action words; the year fish are 46 of 128
  and the Bible-in-a-year fish 267 of 624. All can become action words and keep the daily readings: most switch to a verb in
  their own verse, about 61 need another verse from the same day's reading. Waiting on Ken: he may update the word list
  first. Then a draft list (old word, new word, verse) for him to approve on the edit sheet, and the builder redraws them.
