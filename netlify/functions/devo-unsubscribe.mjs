// One click to stop the devotional emails (from the link in each email, or the mail app's own
// "Unsubscribe" button, which sends a POST).
import { store, idFor, tokenFor } from './lib/devo.mjs';
const page = (title, body) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font:18px/1.6 Georgia,serif;max-width:520px;margin:60px auto;padding:0 16px;color:#14181d"><h1 style="font-size:26px">${title}</h1><p>${body}</p><p><a href="/">MannaFish</a></p></body>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
export default async (req) => {
  const u = new URL(req.url), email = u.searchParams.get('e') || '', t = u.searchParams.get('t') || '';
  if (!email || t !== await tokenFor(email)) return page('Link not recognised', 'This unsubscribe link is not valid. Reply to any MannaFish email and we will take you off the list.');
  const s = store(), key = idFor(email), rec = await s.get(key, { type: 'json' });
  if (rec && !rec.unsub) await s.setJSON(key, { ...rec, unsub: true, unsubAt: new Date().toISOString() });
  if (req.method === 'POST') return new Response('ok');
  return page('You are unsubscribed', 'You will not get any more MannaFish devotional emails. If this was a mistake, you can sign up again on the site at any time.');
};
export const config = { path: '/api/devo-unsubscribe' };
