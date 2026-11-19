// Builds, logos and wording, kept for Ken (admin key). The builder saves a build here whenever he saves his work or downloads the print files, so every file ever made can be
// found again: its settings (to open it in the builder as a copy) and the zip that was made (kept behind a link).
//   GET  /api/build-library?k=KEY                 -> {builds:[{id,at,title,words,qty,files}], logos:[{id,name,sponsor,at,uses}], phrases:{credit:[{t,n}],qr:[{t,n}]}}
//   GET  ...&build=ID  -> the whole build        GET ...&logo=ID -> {id,name,data}
//   POST {k,op:'build',id?,title,snap,files,note}  -> {id}      POST {k,op:'logo',name,sponsor,data} -> {id}
//   POST {k,op:'phrase',kind:'credit'|'qr',text}   -> {ok}      POST {k,op:'remove',kind:'build'|'logo',id} -> {ok}
import { lib, saveLogo, savePhrase } from './lib/library.mjs';
const NS = { 'cache-control': 'no-store' };
const bad = (m, s) => Response.json({ error: m }, { status: s, headers: NS });
const KEY = () => process.env.MF_ADMIN_KEY || process.env.PROOF_KEY || '';
const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const ID = /^[A-Za-z0-9]{6,40}$/;
export default async (req) => {
  if (!KEY()) return bad('Not allowed', 403); const s = lib(), url = new URL(req.url);
  if (req.method === 'GET') {
    if (url.searchParams.get('k') !== KEY()) return bad('Not allowed', 403);
    const b = url.searchParams.get('build'), l = url.searchParams.get('logo');
    if (b) { const r = ID.test(b) && await s.get('b/' + b, { type: 'json' }); return r ? Response.json(r, { headers: NS }) : bad('No such build', 404); }
    if (l) { const r = ID.test(l) && await s.get('l/' + l, { type: 'json' }); return r ? Response.json({ id: r.id, name: r.name, data: r.data }, { headers: NS }) : bad('No such logo', 404); }
    const builds = [], logos = [];
    for (const x of (await s.list({ prefix: 'b/' })).blobs) { const r = await s.get(x.key, { type: 'json' }); if (r) builds.push({ id: r.id, at: r.at, title: r.title, words: r.words, qty: r.qty, files: r.files || [], note: r.note || '' }); }
    for (const x of (await s.list({ prefix: 'l/' })).blobs) { const r = await s.get(x.key, { type: 'json' }); if (r) logos.push({ id: r.id, name: r.name, sponsor: r.sponsor || '', at: r.at, uses: r.uses || 1 }); }
    builds.sort((a, c) => c.at - a.at); logos.sort((a, c) => (c.last || c.at) - (a.last || a.at));
    return Response.json({ builds, logos, phrases: { credit: (await s.get('p/credit', { type: 'json' })) || [], qr: (await s.get('p/qr', { type: 'json' })) || [] } }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST or GET only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  if (b.k !== KEY()) return bad('Not allowed', 403);
  if (b.op === 'logo') { const id = await saveLogo(s, b); return id ? Response.json({ id }, { headers: NS }) : bad('That picture could not be kept.', 400); }
  if (b.op === 'phrase') { await savePhrase(s, b.kind, b.text); return Response.json({ ok: true }, { headers: NS }); }
  if (b.op === 'remove') { const kd = b.kind === 'logo' ? 'l/' : 'b/'; if (!ID.test(b.id || '')) return bad('Bad id', 400); await s.delete(kd + b.id); return Response.json({ ok: true }, { headers: NS }); }
  if (b.op === 'build') {
    const snap = b.snap && typeof b.snap === 'object' ? b.snap : null; if (!snap || !Array.isArray(snap.cards)) return bad('Nothing to save.', 400);
    const text = JSON.stringify(snap); if (text.length > 900000) return bad('That build is too large to keep.', 400);
    const id = ID.test(b.id || '') ? b.id : (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toUpperCase(), old = await s.get('b/' + id, { type: 'json' });
    const files = (Array.isArray(b.files) ? b.files : []).slice(0, 20).map((f) => ({ name: clean(f.name, 120), token: /^[0-9a-f]{32}$/.test(f.token || '') ? f.token : '', size: Number(f.size) || 0, i: Math.max(0, Math.min(99, Number(f.i) || 0)), at: Date.now() }));
    const rec = { id, at: old ? old.at : Date.now(), upd: Date.now(), title: clean(b.title, 120) || 'Build', words: snap.cards.map((c) => c.choose ? 'MannaFish picks' : (c.word || '')).filter(Boolean).join(', '), qty: snap.cards.reduce((t, c) => t + (+c.qty || 0), 0), snap, files: (old && old.files || []).concat(files), note: clean(b.note, 300) || (old && old.note) || '' };
    await s.setJSON('b/' + id, rec);
    for (const c of snap.cards) { if (c.credit) await savePhrase(s, 'credit', c.credit); for (const q of [c.q1, c.q2]) if (q) await savePhrase(s, 'qr', q); }
    return Response.json({ id }, { headers: NS });
  }
  return bad('Which action?', 400);
};
export const config = { path: '/api/build-library' };
