import { save, drop, sendTo } from './lib/push.mjs';
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let body; try { body = await req.json(); } catch (e) { return new Response('Bad request', { status: 400 }); }
  const sub = body && body.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys) return new Response('Bad subscription', { status: 400 });
  if (body.action === 'remove') { await drop(sub.endpoint); return Response.json({ ok: true }); }
  await save(sub);
  // A welcome, so they know it works the moment they sign up.
  try { await sendTo(sub, { title: 'You’re set — MannaFish', body: 'Your first word arrives tomorrow morning. Sunday to Friday; Saturday is rest.', url: '/' }); } catch (e) {}
  return Response.json({ ok: true });
};
export const config = { path: '/api/push-subscribe' };
