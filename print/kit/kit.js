/* (fish/print/<id>.svg, if there is one, is the picture used for printing: a fish drawn a little differently for the printed decal, e.g. K-Tech's bigger Build.)
   MannaFish sponsor print kit (Ken, 17 Nov: "all they have to do is choose a word, paste their URL for the QR code ... upload their logo ...
   and I need the ability to download those files so I can upload them to the sticker app").
   Used by /sponsor/ (the live preview) and /print/orders/ (the download). It draws the card back from the same markup, styles and fit step
   that tools/print/make.mjs writes (print/kit/*, made by `node tools/print/make.mjs --kit`), and the front with the same ink and cut code.
   window.MFkit.ready() -> Promise; MFkit.words, MFkit.mount(el, cfg), MFkit.files(cfg, opts) -> [{name, blob}], MFkit.zip(files) -> Blob */
(function () {
  var BASE = (function () { var s = document.currentScript; return s ? s.src.replace(/[^/]*$/, '') : '/print/kit/'; })();
  var MM = 25.4, CARD = { w: 4.5 * MM, h: 2.75 * MM }, BLEED = MM / 8, SAFE = 3, KISS = MM / 8, CUTGAP = MM / 16, PW = CARD.w + 2 * BLEED, PH = CARD.h + 2 * BLEED;
  var K = { css: '', tplLogo: '', tplText: '', adj: {}, words: { list: [], words: {} } }, loading = null;
  var f2 = function (n) { return Math.round(n * 1000) / 1000; };
  function txt(u) { return fetch(BASE + u).then(function (r) { if (!r.ok) throw new Error(u); return r.text(); }); }
  function script(u) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = BASE + u; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function ready() { if (loading) return loading;
    loading = Promise.all([txt('back.css'), txt('back-logo.tpl.html'), txt('back-text.tpl.html'), txt('default-adj.json'), txt('words.json'), script('qr.js'), script('browser.js'), script('fit.js')]).then(function (a) {
      K.css = a[0] + '\n.strip.inv .sn{font-size:5.4mm;line-height:1.15}'; K.tplLogo = a[1]; K.tplText = a[2]; K.adj = JSON.parse(a[3]); K.words = JSON.parse(a[4]); return K; });
    return loading; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* the QR codes: white on black, the way the card has them */
  function qrSvg(url) { var s = ''; QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#ffffff', light: '#000000' } }, function (e, v) { s = v || ''; });
    return s.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" width="100%" height="100%" '); }
  function defLines(t) { t = String(t || ''); if (t.indexOf('\n') >= 0) return t.split('\n'); if (t.length <= 46) return [t];
    var best = -1, bd = 1e9; for (var i = 1; i < t.length - 1; i++) if (t[i] === ' ') { var d = Math.abs(i - t.length / 2) - (/[,;.]/.test(t[i - 1]) ? 6 : 0); if (d < bd) { bd = d; best = i; } }
    return best < 0 ? [t] : [t.slice(0, best).trim(), t.slice(best + 1).trim()]; }
  function study(cfg) { return cfg.study || (K.words.words[String(cfg.word || '').toUpperCase()]) || null; }
  /* the back's markup for one sponsor */
  function backHtml(cfg) {
    var d = study(cfg); if (!d) throw new Error('No word study for ' + cfg.word);
    var tpl = cfg.by === 'logo' && cfg.logo ? K.tplLogo : K.tplText, h = tpl;
    var sub = function (key, val) { h = h.split('§' + key + '§').join(val); };
    sub('T', esc(cfg.title || d.title)); sub('GKW', esc(d.gkw)); sub('GKS', esc(d.gks)); sub('HBW', esc(d.hbw)); sub('HBS', esc(d.hbs));
    sub('GKM', defLines(d.gkm).map(esc).join('<br>')); sub('HBM', defLines(d.hbm).map(esc).join('<br>'));
    sub('GST', esc(d.gst || '')); sub('HST', esc(d.hst || ''));
    (d.refs || []).slice(0, 4).forEach(function (r, i) { sub('R' + (i + 1) + 'N', esc(r[0])); sub('R' + (i + 1) + 'Q', esc(r[1])); });
    sub('CREDIT', esc(cfg.credit || 'Sponsored by'));
    sub('NAME', esc(cfg.by === 'text' ? cfg.text : cfg.name || ''));
    sub('LOGO', cfg.logo || '');
    sub('LABL', esc(cfg.qrWords || 'Visit us\nto learn more').replace(/\n/g, '<br>')); sub('LABR', 'Free MannaFish<br>Devotional');
    sub('QR:L', qrSvg(cfg.qrLeft || cfg.url || 'https://manna-fish.com/')); sub('QR:R', qrSvg(cfg.qrRight || 'https://manna-fish.com/q/devo'));
    if (!d.gst) h = h.replace(/<div class="st4" data-b="gstrong">[^<]*<\/div>/, ''); if (!d.hst) h = h.replace(/<div class="st4" data-b="hstrong">[^<]*<\/div>/, '');
    return h; }
  var styled = false;
  function addStyle() { if (styled) return; styled = true; var s = document.createElement('style'); s.id = 'mfkit-css'; s.textContent = K.css; document.head.appendChild(s); }
  /* puts the back on the page (millimetres, the same size as the printed card) and runs the fit step once the fonts are in */
  function mount(el, cfg) { return ready().then(function () { addStyle(); el.innerHTML = backHtml(cfg);
    return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { window.MFfit(cfg.adj || K.adj); return el.querySelector('.pg'); }); }); }
  /* ---- files ---- */
  function blobFromCanvas(c) { return new Promise(function (ok) { c.toBlob(ok, 'image/png'); }); }
  function img(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function svgImg(svg) { return img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); }
  function fishSvg(src, x, y, w) { return src.replace(/<svg\b[^>]*?viewBox="([^"]+)"[^>]*>/, function (m, vb) { return '<svg x="' + f2(x) + '" y="' + f2(y) + '" width="' + f2(w) + '" height="' + f2(w / 2) + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;shape-rendering:geometricPrecision" preserveAspectRatio="xMidYMid meet">'; }); }
  function svgPage(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + f2(PW) + 'mm" height="' + f2(PH) + 'mm" viewBox="0 0 ' + f2(PW) + ' ' + f2(PH) + '">' + inner + '</svg>'; }
  function fishSource(cfg) { var id = cfg.fishId || cfg.word; var tries = ['/fish/print/' + id + '.svg', '/fish/en/' + id + '.svg', '/fish/' + id + '.svg', '/fish/en/' + String(cfg.word).toUpperCase() + '.svg'];
    var t = function (i) { return i >= tries.length ? Promise.reject(new Error('No fish picture for ' + id)) : fetch(tries[i]).then(function (r) { return r.ok ? r.text() : t(i + 1); }).catch(function () { return t(i + 1); }); }; return t(0); }
  function backPng(cfg, dpi) { var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-20000px;top:0'; document.body.appendChild(host);
    return mount(host, cfg).then(function (pg) { var w = pg.offsetWidth, h = pg.offsetHeight, xhtml = new XMLSerializer().serializeToString(pg);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>' + K.css + '</style>' + xhtml + '</div></foreignObject></svg>';
      return svgImg(svg).then(function (im) { var W = Math.round(PW / MM * dpi), H = Math.round(PH / MM * dpi), c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H); return blobFromCanvas(c); }); })
      .then(function (b) { host.remove(); return b; }, function (e) { host.remove(); throw e; }); }
  function dataBlob(u) { return fetch(u).then(function (r) { return r.blob(); }); }
  function notes(cfg, id) { return 'MannaFish card print files' + (id ? ' (order ' + id + ')' : '') + '\n\nCard: 4.5 x 2.75 in (114.3 x 69.85 mm), custom size. Every file includes a 1/8 in (3.175 mm) bleed on each side, so each file is 4.75 x 3.0 in (120.65 x 76.2 mm) and all four line up.\n\n'
    + '1-decal-white-ink.png : clear vinyl, white ink only. White where the fish is white; the verse words and everything else are clear (no ink). 1200 dpi, transparent where there is no ink.\n'
    + '2-backing-front.png : printed on the FRONT of the backing paper, under the decal. Black over the whole card with the same fish in white, lined up exactly under the decal. When the decal is peeled off this stays on the card.\n'
    + '3-cut-lines.svg : the decal is KISS CUT through the vinyl only (CutContour, magenta, about 1/16 in outside the fish; your art department may set its own line, 1/8 in or less); the card edge is cut through (ThroughCut, blue), 4.5 x 2.75 in.\n'
    + '4-back.png : printed on the BACK of the backing paper. Reads upright, the same way up as the front (landscape).\n\nColours are RGB; please convert to your press colours. Please send a proof of all layers before printing.\n'; }
  function files(cfg, opt) { opt = opt || {}; var dpi = opt.dpi || 1200, out = [];
    return ready().then(function () { return fishSource(cfg); }).then(function (src) {
      return MFbox(src).then(function (box) {
        var maxW = CARD.w - 2 * (SAFE + KISS), maxH = CARD.h - 2 * (SAFE + KISS), s = Math.min(maxW / box.w, maxH / box.h),
          place = { x: BLEED + (CARD.w - box.w * s) / 2 - box.x * s, y: BLEED + (CARD.h - box.h * s) / 2 - box.y * s, w: 4000 * s };
        return MFink(src, place, { w: PW, h: PH }, dpi).then(function (ink) { return dataBlob(ink); }).then(function (b) { out.push({ name: '1-decal-white-ink.png', blob: b });
          var backing = svgPage('<rect width="' + f2(PW) + '" height="' + f2(PH) + '" fill="#000"/>' + fishSvg(src, place.x, place.y, place.w));
          return svgImg(backing).then(function (im) { var W = Math.round(PW / MM * dpi), H = Math.round(PH / MM * dpi), c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(im, 0, 0, W, H); return blobFromCanvas(c); }); })
        .then(function (b) { out.push({ name: '2-backing-front.png', blob: b }); return MFcut(src, place, { w: PW, h: PH }, CUTGAP, 24); })
        .then(function (cut) { var d = 'M' + cut.map(function (p) { return f2(p[0]) + ' ' + f2(p[1]); }).join(' L') + ' Z';
          var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgPage('<g id="CutContour" fill="none" stroke="#ff00ff" stroke-width="0.0882"><path d="' + d + '"/></g><g id="ThroughCut" fill="none" stroke="#00b7ff" stroke-width="0.0882"><rect x="' + f2(BLEED) + '" y="' + f2(BLEED) + '" width="' + f2(CARD.w) + '" height="' + f2(CARD.h) + '"/></g>').replace('<svg ', '<svg version="1.1" ');
          out.push({ name: '3-cut-lines.svg', blob: new Blob([svg], { type: 'image/svg+xml' }) }); return backPng(cfg, dpi); })
        .then(function (b) { out.push({ name: '4-back.png', blob: b }); out.push({ name: 'printer-notes.txt', blob: new Blob([notes(cfg, opt.id)], { type: 'text/plain' }) }); return out; }); }); }); }
  /* ---- a zip (stored, not compressed: the pictures are PNG already) ---- */
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(list) { return Promise.all(list.map(function (f) { return f.blob.arrayBuffer().then(function (b) { return { name: f.name, u8: new Uint8Array(b) }; }); })).then(function (fs) {
    var parts = [], central = [], off = 0, enc = new TextEncoder();
    function u16(v) { return [v & 255, (v >> 8) & 255]; } function u32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
    fs.forEach(function (f) { var nm = enc.encode(f.name), c = crc32(f.u8), hd = [].concat([0x50, 0x4b, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(f.u8.length), u32(f.u8.length), u16(nm.length), u16(0));
      parts.push(new Uint8Array(hd), nm, f.u8);
      central.push(new Uint8Array([].concat([0x50, 0x4b, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(f.u8.length), u32(f.u8.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), nm); off += hd.length + nm.length + f.u8.length; });
    var cs = 0; central.forEach(function (p) { parts.push(p); cs += p.length; });
    parts.push(new Uint8Array([].concat([0x50, 0x4b, 5, 6], u16(0), u16(0), u16(fs.length), u16(fs.length), u32(cs), u32(off), u16(0))));
    return new Blob(parts, { type: 'application/zip' }); }); }
  window.MFkit = { fishSource: fishSource, ready: ready, mount: mount, backHtml: backHtml, files: files, zip: zip, study: study, defLines: defLines, get words() { return K.words; }, get css() { return K.css; } };
})();
