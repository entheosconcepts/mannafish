// The library (Ken, 20 Nov: "history of the files I built; logos stored so I do not upload them again; wording saved in a drop-down list").
// One store, mannafish-library: builds (b/<id>), logos (l/<id>, deduplicated by their picture), phrases (p/credit, p/qr: the sponsor line and the words under a QR code).
import { getStore } from '@netlify/blobs';
export const lib = () => getStore({ name: 'mannafish-library', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
export async function sha(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24); }
// keep a logo once, however many times it is uploaded; returns its id
export async function saveLogo(s, { name, sponsor, data }) {
  if (typeof data !== 'string' || !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(data) || data.length > 1500000) return null;
  const id = await sha(data), k = 'l/' + id, old = await s.get(k, { type: 'json' });
  const rec = old || { id, at: Date.now(), uses: 0, data }; rec.name = clean(name, 80) || rec.name || 'Logo'; if (sponsor) rec.sponsor = clean(sponsor, 80); rec.uses = (rec.uses || 0) + 1; rec.last = Date.now();
  await s.setJSON(k, rec); return id;
}
// remember a phrase (count how often it is used)
export async function savePhrase(s, kind, text) {
  kind = kind === 'qr' ? 'qr' : 'credit'; const t = clean(text, 100); if (!t || t.length < 3) return;
  const k = 'p/' + kind, a = (await s.get(k, { type: 'json' })) || [], f = a.find((x) => x.t.toLowerCase() === t.toLowerCase());
  if (f) { f.n++; f.at = Date.now(); } else a.push({ t, n: 1, at: Date.now() });
  a.sort((x, y) => y.n - x.n || y.at - x.at); await s.setJSON(k, a.slice(0, 200));
}
export async function fromOrder(items, contact) {   // called when a sponsor sends a request: keep the logos and the wording
  const s = lib();
  for (const it of items || []) {
    if (it.logo) await saveLogo(s, { name: it.name || (contact && contact.name) || 'Logo', sponsor: (contact && contact.name) || it.name, data: it.logo });
    const c = it.cfg || {}; if (c.credit) await savePhrase(s, 'credit', c.credit);
    for (const l of String(c.qrWords || '').split('\n')) if (l) await savePhrase(s, 'qr', l);
  }
}
