// Ride mode (Ken, 3 Nov: "an idea for Uber drivers ... they speak and it is written on a remote iPad or mobile device").
// The driver's phone hears the driver and translates; the rider's phone or a back-seat iPad (opened from a QR code) shows the words,
// big, in the rider's language, and can say them aloud; the rider answers by talking or typing, and the driver hears it in theirs.
// This only passes the lines between the two screens: each ride has a code, each side ('d' driver, 'r' rider) its own short list,
// written only by that side, read by the other every second or so. Nothing else is kept; a ride's lines are dropped after a day.
//   POST /api/ride {c, s:'d'|'r', m:{t:'hi'|'say'|'bye', l, said, sl, tr, tl}} -> {i}
//   GET  /api/ride?c=CODE&s=d|r&after=N  -> {list:[{i, at, t, ...}]}  (the lines from that side after N)
//   GET  /api/ride?today=1              -> {key, title, ref, url, img}: today's MannaFish, for the rider when the ride ends
//   GET  /api/ride?qr=CODE              -> the QR code (SVG) the rider scans: <this site>/ride/?j=CODE
import { getStore } from '@netlify/blobs';
import QRCode from 'qrcode';
import { welcomeCatch } from './lib/manna.mjs';

const okOrigin = (o) => /^https:\/\/([a-z0-9-]+\.)?manna-fish\.com$|^https:\/\/([a-z0-9-]+--)?yadamannafishtest\.netlify\.app$|^http:\/\/localhost(:\d+)?$/.test(o || '');
const NS = { 'cache-control': 'no-store' };
const bad = (msg, status) => Response.json({ error: msg }, { status, headers: NS });
const CODE = /^[A-HJ-NP-Z2-9]{6}$/, KEEP = 40, DAY = 86400000;
const db = () => getStore({ name: 'mannafish-ride', consistency: 'strong' });
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n);
const lang = (l) => (/^[a-z]{2,3}$/.test(String(l || '')) ? String(l) : '');
async function limited(ip) {
  try { const s = getStore('mannafish-limits'), k = `ride/${new Date().toISOString().slice(0, 13)}/${ip || 'x'}`, n = Number(await s.get(k)) || 0;
    if (n >= 600) return true; await s.set(k, String(n + 1)); } catch (e) { /* never blocks a ride */ }
  return false;
}
export default async (req, context) => {
  const u = new URL(req.url), store = db();
  if (req.method === 'GET' && u.searchParams.get('today')) {
    const f = welcomeCatch(); if (!f) return bad('None today', 404);
    return Response.json({ key: f.key, title: f.title, ref: f.ref, url: f.url, img: f.extra ? `/fish/${f.key}.svg` : `/fish/en/${f.key}.svg` }, { headers: { 'cache-control': 'public, max-age=900' } });
  }
  if (req.method === 'GET' && u.searchParams.get('qr')) {
    const c = String(u.searchParams.get('qr')).toUpperCase(); if (!CODE.test(c)) return bad('Which ride?', 400);
    const svg = await QRCode.toString(`${u.origin}/ride/?j=${c}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
    return new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' } });
  }
  if (req.method === 'GET') {
    const c = String(u.searchParams.get('c') || '').toUpperCase(), s = u.searchParams.get('s'), after = Number(u.searchParams.get('after')) || 0;
    if (!CODE.test(c) || !/^[dr]$/.test(s)) return bad('Which ride?', 400);
    let o = null; try { o = await store.get(`${c}/${s}`, { type: 'json' }); } catch (e) { o = null; }
    if (o && Date.now() - (o.at || 0) > DAY) o = null;
    return Response.json({ list: o ? o.list.filter((m) => m.i > after) : [] }, { headers: NS });
  }
  if (req.method !== 'POST') return bad('POST only', 405);
  if (!okOrigin(req.headers.get('origin'))) return bad('Not allowed', 403);
  let b; try { b = await req.json(); } catch (e) { return bad('Bad request', 400); }
  const c = String(b.c || '').toUpperCase(), s = b.s, m = b.m || {};
  if (!CODE.test(c) || !/^[dr]$/.test(s)) return bad('Which ride?', 400);
  if (!['hi', 'say', 'bye'].includes(m.t)) return bad('What kind?', 400);
  if (await limited(context && context.ip)) return bad('Please wait a little', 429);
  let o = null; try { o = await store.get(`${c}/${s}`, { type: 'json' }); } catch (e) { o = null; }
  if (!o || Date.now() - (o.at || 0) > DAY) o = { n: 0, list: [] };
  const line = { i: o.n + 1, at: Date.now(), t: m.t, l: lang(m.l), name: clean(m.name, 40), said: clean(m.said, 900), sl: lang(m.sl), tr: clean(m.tr, 1400), tl: lang(m.tl) };
  Object.keys(line).forEach((k) => { if (line[k] === '') delete line[k]; });
  o.n = line.i; o.at = line.at; o.list = o.list.concat([line]).slice(-KEEP);
  await store.setJSON(`${c}/${s}`, o);
  return Response.json({ i: line.i }, { headers: NS });
};
export const config = { path: '/api/ride' };
