// Every morning about 9:40 in Wilmington: the automatic emails to Hub hosts (lib/hubmail.mjs): a restock check when one is due,
// "your month as a MannaFish Hub" with the Catch on the 1st, and a welcome for a new Hub. Each can be turned off in Hubs admin › Emails.
import { runAuto } from './lib/hubmail.mjs';
export default async () => { const done = await runAuto(new Date()); console.log('hub emails', done.join(', ') || 'none due'); return new Response('ok'); };
export const config = { schedule: '40 14 * * *' };
