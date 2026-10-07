// Every hour: the daily MannaFish email to each subscriber for whom it has just turned 7am
// (Daily: Sunday–Friday; Weekly: Sundays; Monthly: first Sunday). Once a day per person.
import { sendDue } from './lib/devo.mjs';
import { hasMail } from './lib/mail.mjs';
export default async () => {
  if (!hasMail()) { console.log('devotional email: BREVO_API_KEY not set'); return; }
  console.log('devotional email', JSON.stringify(await sendDue()));
};
export const config = { schedule: '15 * * * *' };
