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
