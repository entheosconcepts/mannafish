// Link previews that match the fish (Ken, 10 Nov: texted "Establish" and the preview showed "Hope").
// The home page's <meta property="og:image"> is one fixed picture (Hope). Messages and social apps read that tag without running any
// script, so for a shared fish link (/?w=<word> for the original 24, /?fish=<id> for the rest) this puts that fish's own picture in the tag.
//   /?w=hope        -> /w/img/hope.png            (the saved picture)
//   /?fish=D007     -> /api/fish-img?k=D007       (drawn on the server from the edit sheet's settings; falls back to the saved picture)
// /?fish=today (and any other page) keeps the default picture, because the word of the day is only known in the page's script.
export default async (request, context) => {
  const u = new URL(request.url);
  const w = (u.searchParams.get('w') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const f = (u.searchParams.get('fish') || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!w && (!f || f.toLowerCase() === 'today')) return context.next();
  const res = await context.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  const img = u.origin + (w ? '/w/img/' + w + '.png' : '/api/fish-img?k=' + encodeURIComponent(f));
  const tag = '<meta property="og:image" content="' + img + '"><meta name="twitter:image" content="' + img + '">';
  // The page is about 3 MB (fonts are inside it), so only the first bytes, where the tag is, are changed; the rest streams through.
  // Bytes are turned into text one-to-one (latin1 style), so nothing in the page can change.
  const enc = (b) => { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; };
  const dec = (s) => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };
  let buf = new Uint8Array(0), done = false;
  const ts = new TransformStream({
    transform(chunk, ctl) {
      if (done) { ctl.enqueue(chunk); return; }
      const nb = new Uint8Array(buf.length + chunk.length); nb.set(buf); nb.set(chunk, buf.length); buf = nb;
      const t = enc(buf), m = /<meta property="og:image"[^>]*>/.exec(t);
      if (m) { ctl.enqueue(dec(t.replace(m[0], tag))); done = true; buf = new Uint8Array(0); }
      else if (buf.length > 32768) { ctl.enqueue(buf); done = true; buf = new Uint8Array(0); }
    },
    flush(ctl) { if (buf.length) ctl.enqueue(buf); },
  });
  const h = new Headers(res.headers); h.delete('content-length'); h.set('cache-control', 'public, max-age=0, must-revalidate');
  return new Response(res.body.pipeThrough(ts), { status: res.status, headers: h });
};
export const config = { path: ['/', '/index.html'] };
