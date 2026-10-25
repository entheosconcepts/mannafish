// Every hour: the daily MannaFish email to each subscriber for whom it has just turned 7am
// (Daily: Sunday–Friday; Weekly: Sundays; Monthly: first Sunday). Once a day per person.
import { sendDue } from './lib/devo.mjs';
import { hasMail } from './lib/mail.mjs';
export default async () => {
  // MF_SEND_OFF=1: this site sends no daily devotionals (the test site, once manna-fish.com is live, so no one gets two)
  if (process.env.MF_SEND_OFF === '1') { console.log('daily devotionals are off on this site (MF_SEND_OFF)'); return; }
  if (!hasMail()) { console.log('devotional email: BREVO_API_KEY not set'); return; }
  console.log('devotional email', JSON.stringify(await sendDue()));
};
export const config = { schedule: '15 * * * *' };
