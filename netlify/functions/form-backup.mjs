// Backup for the site's forms. If Netlify Forms is not switched on (or fails), the page
// sends the same fields here and they are kept in the site's own Netlify Blobs store,
// so a free-gift request or a sign-up is never lost.
import { getStore } from '@netlify/blobs';
const FORMS = ['free-gift', 'devotional', 'word-study', 'fish-net'];
export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let f; try { f = Object.fromEntries(new URLSearchParams(await req.text())); } catch (e) { return new Response('Bad request', { status: 400 }); }
  if (f['bot-field']) return Response.json({ ok: true });            // a bot filled the hidden field
  if (!FORMS.includes(f['form-name'])) return new Response('Unknown form', { status: 400 });
  for (const k of Object.keys(f)) f[k] = String(f[k]).slice(0, 2000);
  const at = new Date().toISOString();
  await getStore('mannafish-forms').setJSON(f['form-name'] + '/' + at + '-' + Math.random().toString(36).slice(2, 8), { ...f, at });
  return Response.json({ ok: true });
};
export const config = { path: '/api/form-backup' };
