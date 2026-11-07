// Notes on fish, kept on the server (Ken, 7 Nov): "a section for notes under each one ... click here to add a note for spelling, placement or
// the perceived meaning of the fish in a different language, and what should change for each language."
// One list of notes per fish; a language version of a fish has its own list (id "REST" = English, "REST.es" = the Spanish one).
//   GET  /api/fish-notes                          -> {notes: {<id>: [{n, text, kind, by, at, done?}]}}
//   GET  /api/fish-notes?id=REST.es               -> {notes: {"REST.es": [...]}}
//   POST /api/fish-notes {id, text, kind?, by?}   -> adds a note
//   POST /api/fish-notes {id, n, done: true|false}-> marks a note done (or open again)
//   POST /api/fish-notes {id, n, remove: true}    -> deletes a note
// No password on purpose while nobody uses the site (same as /api/fish-flags); only the site's own pages may write.
// Notes are only notes: nothing changes on a fish until the edit sheet is used (which needs the admin password).
import { getStore } from '@netlify/blobs';

const okOrigin = (o) => !o || /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o);
const bad = (msg, status) => Response.json({ error: msg }, { status });
const ID = /^[A-Za-z0-9_-]{2,20}(\.[a-z]{2})?$/;
const KINDS = ['spelling', 'placement', 'meaning', 'verse', 'other'];
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

export default async (req) => {
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  const s = getStore({ name: 'mannafish-notes', consistency: 'strong' });
  const cur = (await s.get('all', { type: 'json' })) || { notes: {}, at: '' };
  const notes = cur.notes || {};
  if (req.method === 'GET') {
    const id = new URL(req.url).searchParams.get('id');
    const out = id ? { [id]: notes[id] || [] } : notes;
    return Response.json({ notes: out, at: cur.at }, { headers: { 'cache-control': 'no-store' } });
  }
  if (req.method !== 'POST') return bad('GET or POST', 405);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const id = b && b.id;
  if (typeof id !== 'string' || !ID.test(id)) return bad('Which fish?', 400);
  const list = notes[id] || [];
  if (b.n != null) {
    const i = list.findIndex((x) => x.n === +b.n); if (i < 0) return bad('That note is gone', 404);
    if (b.remove === true) list.splice(i, 1); else if (typeof b.done === 'boolean') { if (b.done) list[i].done = true; else delete list[i].done; } else return bad('Nothing to change', 400);
  } else {
    const text = clean(b.text, 800); if (!text) return bad('Write the note first', 400);
    if (list.length >= 60) return bad('That fish has too many notes already', 413);
    list.push({ n: (list.reduce((m, x) => Math.max(m, x.n), 0) || 0) + 1, text, kind: KINDS.includes(b.kind) ? b.kind : 'other', by: clean(b.by, 60), at: new Date().toISOString() });
  }
  if (list.length) notes[id] = list; else delete notes[id];
  if (Object.keys(notes).length > 3000) return bad('Too many fish have notes', 413);
  const rec = { notes, at: new Date().toISOString() };
  await s.setJSON('all', rec);
  return Response.json({ notes: { [id]: notes[id] || [] }, at: rec.at }, { headers: { 'cache-control': 'no-store' } });
};
export const config = { path: '/api/fish-notes' };
