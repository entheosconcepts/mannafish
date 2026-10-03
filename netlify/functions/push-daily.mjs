// Every morning: today's word and verse to every phone that asked for it.
// 11:00 UTC is 7am in Wilmington in summer, 6am in winter.
import { todaysManna, notificationFor } from './lib/manna.mjs';
import { sendAll } from './lib/push.mjs';
export default async () => {
  const m = todaysManna();
  if (!m) { console.log('Saturday: rest, nothing sent'); return; }
  const r = await sendAll(notificationFor(m));
  console.log('daily MannaFish', m.key, m.ref, JSON.stringify(r));
};
export const config = { schedule: '0 11 * * *' };
