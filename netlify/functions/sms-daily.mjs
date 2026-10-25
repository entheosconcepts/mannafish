// Every hour: the devotional by text to each person for whom it has just turned 7am (as the email), and the one
// "reply YES" text to new text sign-ups (in the daytime). Nothing is sent until Twilio is set up in Netlify (lib/sms.mjs).
import { hasSms } from './lib/sms.mjs';
import { sendDueTexts } from './lib/devotext.mjs';
export default async () => {
  // MF_SEND_OFF=1: this site sends no daily devotionals (the test site, once manna-fish.com is live, so no one gets two)
  if (process.env.MF_SEND_OFF === '1') { console.log('daily devotionals are off on this site (MF_SEND_OFF)'); return; }
  if (!hasSms()) { console.log('devotional text: Twilio not set up yet (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID)'); return; }
  console.log('devotional text', JSON.stringify(await sendDueTexts()));
};
export const config = { schedule: '20 * * * *' };
