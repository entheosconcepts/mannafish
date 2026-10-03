// Web push for the daily MannaFish. Subscriptions and the VAPID key pair live in this
// site's own Netlify Blobs store, so there is no outside account and no key to paste in.
import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { createHash } from 'node:crypto';

export const store = () => getStore('mannafish-push');
const idFor = endpoint => createHash('sha256').update(endpoint).digest('hex').slice(0, 40);

export async function keys() {
  const s = store();
  let k = await s.get('vapid-keys', { type: 'json' });
  if (!k) { k = webpush.generateVAPIDKeys(); await s.setJSON('vapid-keys', k); }
  return k;
}

export async function save(sub) { await store().setJSON('sub/' + idFor(sub.endpoint), { sub, at: new Date().toISOString() }); }
export async function drop(endpoint) { await store().delete('sub/' + idFor(endpoint)); }

export async function sendTo(sub, payload) {
  const k = await keys();
  webpush.setVapidDetails('mailto:ken@manna-fish.com', k.publicKey, k.privateKey);
  return webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 12 * 3600 });
}

// Send to everyone; a subscription the browser has thrown away (404/410) is deleted.
export async function sendAll(payload) {
  const s = store();
  const { blobs } = await s.list({ prefix: 'sub/' });
  let sent = 0, gone = 0, failed = 0;
  for (const b of blobs) {
    const rec = await s.get(b.key, { type: 'json' });
    if (!rec) continue;
    try { await sendTo(rec.sub, payload); sent++; }
    catch (e) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) { await s.delete(b.key); gone++; }
      else failed++;
    }
  }
  return { sent, gone, failed, total: blobs.length };
}
