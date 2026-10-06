// Every hour: today's word and verse to each phone where it has just turned 7am.
// (Ken, 6 Oct: "7am in their own time zone.") Each person gets it once a day; anyone
// who signed up after 7am gets that day's word on the next hourly run.
import { sendDue } from './lib/push.mjs';
export default async () => {
  const r = await sendDue();
  console.log('daily MannaFish', JSON.stringify(r));
};
export const config = { schedule: '5 * * * *' };
