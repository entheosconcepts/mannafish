import { save, drop, sendTo } from './lib/push.mjs';
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let body; try { body = await req.json(); } catch (e) { return new Response('Bad request', { status: 400 }); }
  const sub = body && body.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys) return new Response('Bad subscription', { status: 400 });
  if (body.action === 'remove') { await drop(sub.endpoint); return Response.json({ ok: true }); }
  const es = body.lang === 'es';
  await save(sub, typeof body.tz === 'string' ? body.tz.slice(0, 64) : '', es ? 'es' : 'en');
  // A welcome, so they know it works the moment they sign up.
  try { await sendTo(sub, es
    ? { title: '¡Listo! — MannaFish', body: 'Tu palabra llega a las 7 a. m. cada mañana, de domingo a viernes. El sábado es de descanso.', url: '/?lang=es' }
    : { title: 'You’re set — MannaFish', body: 'Your word arrives at 7am each morning, Sunday to Friday. Saturday is rest.', url: '/' }); } catch (e) {}
  return Response.json({ ok: true });
};
export const config = { path: '/api/push-subscribe' };
