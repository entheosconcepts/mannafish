# MannaFish pre-launch checklist (private preview on manna-fish.com)

Keep this open. Tick as you go. Nothing here opens the site to the public.
Your private link: https://manna-fish.com/?preview=YOUR-WORD  (open it once on each device; use a private window to test as a stranger)

## A. Settings: done
- [x] Netlify, manna-fish.com site: BREVO_API_KEY, MF_ADMIN_KEY, MF_PREVIEW_KEY, MF_SEND_OFF, OPENAI_API_KEY are all there. MF_LAUNCHED is NOT there (good: the public is still shut out).
- [x] Supabase (yadah project): https://manna-fish.com and https://manna-fish.com/** are in the redirect URLs.
- [ ] Netlify, Deploys: the newest deploy says "Published" (it should carry "Go live ... verse swapped out of the back").
- Leave alone: STRIPE_SECRET_KEY, MannaFish_Site.

## B. Test as a stranger (private window, your preview link)
- [ ] The home page loads. Under the devotional: three closed headers, then "Design your card. Sponsor your card."
- [ ] Create an account. The code arrives by email. Sign in.
- [ ] The Bible opens. Change the version. Highlight a verse.
- [ ] Tell us what you think: send a message. It arrives in your email.
- [ ] Sign up for the free devotional with your own email. The welcome email arrives. (Daily emails stay off.)
- [ ] Play today's devotional audio. Play Time with God.
- [ ] Open the same link on your phone. Everything fits and nothing overlaps.

## C. Sponsor flow
- [ ] On manna-fish.com open /?example=ktech#sponsor and send the K-Tech order with your name and email.
- [ ] The confirmation email arrives.
- [ ] /print/orders/ opens with your admin password. "Download print files (.zip)" gives the decal, backing front, back, cut lines, notes and the one-page PDF.
- [ ] Upload the real K-Tech logo instead of the stand-in. Check the K-Tech web address and the spelling of the name.
- [ ] Scan a printed sample QR code. The scan count on the orders page goes up.

## D. Waiting on you
- [ ] Translation for K-Tech's front verse (KJV recommended). Then Claude makes the final files.
- [ ] Time with God: edit docs/time-with-god-current-text.md and send it back. Claude updates the audio after you approve.
- [ ] Donation link, the tax wording, and whether you have applied for 501(c)(3).
- [ ] Sponsor price for 100, 500 and 1,000 (the page shows none now).
- [ ] Send the Bible permission email (docs/bible-permission-email.md).

## E. Held (not part of this launch)
- Texting (the Twilio campaign registration is still to do), app stores, merch.

## F. Opening day (when you say the word)
1. Netlify, manna-fish.com site: add MF_LAUNCHED = 1. Deploys, Trigger deploy.
2. Tell Claude. Claude runs the post-launch checks with you.
3. When you want daily emails to start: confirm the Brevo sender and domain are verified, then delete MF_SEND_OFF on the live site and add MF_SEND_OFF = 1 on the test site, so nobody gets two.
