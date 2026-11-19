/* (fish/print/<id>.svg, if there is one, is the picture used for printing: a fish drawn a little differently for the printed decal, e.g. K-Tech's bigger Build.)
   MannaFish sponsor print kit (Ken, 17 Nov: "all they have to do is choose a word, paste their URL for the QR code ... upload their logo ...
   and I need the ability to download those files so I can upload them to the sticker app").
   Used by /sponsor/ (the live preview) and /print/orders/ (the download). It draws the card back from the same markup, styles and fit step
   that tools/print/make.mjs writes (print/kit/*, made by `node tools/print/make.mjs --kit`), and the front with the same ink and cut code.
   window.MFkit.ready() -> Promise; MFkit.words, MFkit.mount(el, cfg), MFkit.files(cfg, opts) -> [{name, blob}], MFkit.zip(files) -> Blob */
(function () {
  var BASE = (function () { var s = document.currentScript; return s ? s.src.replace(/[^/]*$/, '') : '/print/kit/'; })();
  var MM = 25.4, CARD = { w: 4.5 * MM, h: 2.75 * MM }, BLEED = MM / 8, SAFE = 3, KISS = MM / 8, CUTGAP = MM / 16, PW = CARD.w + 2 * BLEED, PH = CARD.h + 2 * BLEED;
  var K = { css: '', tplLogo: '', tplText: '', adj: {}, words: { list: [], words: {} }, verses: {} }, loading = null;
  var f2 = function (n) { return Math.round(n * 1000) / 1000; };
  function txt(u) { return fetch(BASE + u).then(function (r) { if (!r.ok) throw new Error(u); return r.text(); }); }
  function script(u) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = BASE + u; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function ready() { if (loading) return loading;
    loading = Promise.all([txt('back.css'), txt('back-logo.tpl.html'), txt('back-text.tpl.html'), txt('default-adj.json'), txt('words.json'), txt('verses.json').catch(function () { return '{}'; }), script('qr.js'), script('browser.js'), script('fit.js')]).then(function (a) {
      K.css = a[0] + '\n.strip.inv .mid,.strip.inv .sl{overflow:visible}\n.strip.inv .sn{font-size:5.4mm;line-height:1.15}\n.strip.inv .sb.nar{font-family:\'Archivo Narrow\',sans-serif;font-weight:700;font-size:3.5mm;letter-spacing:.18mm}'; K.tplLogo = a[1]; K.tplText = a[2]; K.adj = JSON.parse(a[3]); K.words = JSON.parse(a[4]); try { K.verses = JSON.parse(a[5]); } catch (e) { K.verses = {}; } return K; });
    return loading; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* the QR codes: white on black, the way the card has them */
  function qrSvg(url) { var s = ''; QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#ffffff', light: '#000000' } }, function (e, v) { s = v || ''; });
    return s.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" width="100%" height="100%" '); }
  function defLines(t) { t = String(t || ''); if (t.indexOf('\n') >= 0) return t.split('\n'); if (t.length <= 46) return [t];
    var best = -1, bd = 1e9; for (var i = 1; i < t.length - 1; i++) if (t[i] === ' ') { var d = Math.abs(i - t.length / 2) - (/[,;.]/.test(t[i - 1]) ? 6 : 0); if (d < bd) { bd = d; best = i; } }
    return best < 0 ? [t] : [t.slice(0, best).trim(), t.slice(best + 1).trim()]; }
  /* a verse already on the front of the fish must not also be one of the verses on the back (Ken, 18 Nov): it is swapped for another verse that uses the word */
  function parseRef(r) { var m = /^\s*((?:[1-3]\s*)?[A-Za-z][A-Za-z\s\.]*?)\s*(\d+)\s*[:.]\s*(\d+)(?:\s*[-\u2013\u2014]\s*(\d+))?/.exec(String(r || '')); if (!m) return null; var b = m[1].toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim(); if (b === 'psalms') b = 'psalm'; return { b: b, c: +m[2], a: +m[3], z: m[4] ? +m[4] : +m[3] }; }
  function overlap(x, y) { x = parseRef(x); y = parseRef(y); return !!(x && y && x.b === y.b && x.c === y.c && x.a <= y.z && y.a <= x.z); }
  function snippet(text, re) { var t = String(text || '').replace(/[\u201c\u201d"]/g, '').replace(/\s+/g, ' ').trim(); if (t.length <= 72) return t.replace(/[,;:.\s]+$/, ''); var parts = t.split(/(?<=[,;:])\s+/), i = -1; for (var k = 0; k < parts.length; k++) if (re.test(parts[k])) { i = k; break; } if (i < 0) return '';
    var out = parts[i]; for (var a = 1; out.length < 34 && (parts[i + a] || parts[i - a]); a++) { var nx = parts[i + a], pv = parts[i - a]; if (nx && (out + ' ' + nx).length <= 72) out += ' ' + nx; else if (pv && (pv + ' ' + out).length <= 72) out = pv + ' ' + out; else break; }
    out = out.replace(/[,;:.\s]+$/, ''); return out.length <= 72 ? out : ''; }
  function swapRefs(d, cfg) { var refs = (d.refs || []).slice(0, 4).map(function (r) { return r.slice(); }), e = K.words.list.filter(function (x) { return x.w.toLowerCase() === String(cfg.word || '').toLowerCase(); })[0] || {},
      front = cfg.verse && cfg.verse.ref ? cfg.verse.ref : (cfg.fishRef || e.r || ''); if (!front) return refs;
    var re; try { re = new RegExp(e.f || ('\\b' + String(cfg.word).toLowerCase()), 'i'); } catch (x) { re = /./; }
    var cands = (d.alt || []).map(function (a) { return a.slice(); }); (K.verses[String(cfg.word || '').toUpperCase()] || []).forEach(function (v) { var s = snippet(v[1], re); if (s) cands.push([v[0], s]); });
    refs.forEach(function (r, i) { if (!overlap(r[0], front)) return; for (var k = 0; k < cands.length; k++) { var c = cands[k]; if (overlap(c[0], front) || refs.some(function (o) { return overlap(o[0], c[0]); })) continue; refs[i] = [c[0], c[1]]; return; } });
    return refs; }
  function study(cfg) { return cfg.study || (K.words.words[String(cfg.word || '').toUpperCase()]) || null; }
  /* the back's markup for one sponsor */
  function backHtml(cfg) {
    var d = study(cfg); if (!d) throw new Error('No word study for ' + cfg.word);
    var tpl = cfg.by === 'logo' && cfg.logo ? K.tplLogo : K.tplText, h = tpl;
    var sub = function (key, val) { h = h.split('§' + key + '§').join(val); };
    sub('T', esc(cfg.title || d.title)); sub('GKW', esc(d.gkw)); sub('GKS', esc(d.gks)); sub('HBW', esc(d.hbw)); sub('HBS', esc(d.hbs));
    sub('GKM', defLines(d.gkm).map(esc).join('<br>')); sub('HBM', defLines(d.hbm).map(esc).join('<br>'));
    sub('GST', esc(d.gst || '')); sub('HST', esc(d.hst || ''));
    swapRefs(d, cfg).forEach(function (r, i) { sub('R' + (i + 1) + 'N', esc(r[0])); sub('R' + (i + 1) + 'Q', esc(r[1])); });
    var cr = String(cfg.credit || 'Sponsored by').replace(/\s+/g, ' ').trim(), fnt = (cfg.cadj && cfg.cadj.sponsor && cfg.cadj.sponsor.font) || 'auto', nar = fnt === 'narrow' || (fnt === 'auto' && cr.length > 20);   /* a long line reads better in the narrow font (Ken, 19 Nov) */
    if (cfg.two && cr.indexOf(' ') > 0) {   /* two lines, split at the space nearest the middle (a longer line is easier to read this way) */
      var mid = cr.length / 2, best = -1; for (var i = 0; i < cr.length; i++) if (cr[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
      h = h.replace('<div class="sb" data-b="sponsor">§CREDIT§</div>', '<div class="sb sxf' + (nar ? ' nar' : '') + '" data-b="sponsor" style="white-space:nowrap;width:100%;min-width:0;display:block;text-align:center;line-height:1.08"><span style="display:inline-block;flex:none;transform-origin:center">' + esc(cr.slice(0, best)) + '<br>' + esc(cr.slice(best + 1)) + '</span></div>').replace('<div class="sl" data-b="logo">', '<div class="sl" data-b="logo" style="height:14.4mm">');
      cr = ' '; }
    else if (cr.length > 20) {   /* a longer line stays on one row: it is squeezed in width to fit (then made a little smaller if it must be); the logo keeps its size */
      h = h.replace('<div class="sb" data-b="sponsor">§CREDIT§</div>', '<div class="sb sxf' + (nar ? ' nar' : '') + '" data-b="sponsor" style="white-space:nowrap;width:100%;min-width:0;display:flex;justify-content:center"><span style="display:inline-block;flex:none;transform-origin:center">§CREDIT§</span></div>'); }
    sub('CREDIT', esc(cr.trim()) || 'Sponsored by');
    sub('NAME', esc(cfg.by === 'text' ? cfg.text : cfg.name || ''));
    sub('LOGO', cfg.logo || '');
    sub('LABL', esc(cfg.qrWords || 'Visit us\nto learn more').replace(/\n/g, '<br>')); sub('LABR', 'Free MannaFish<br>Devotional');
    sub('QR:L', qrSvg(cfg.qrLeft || cfg.url || 'https://manna-fish.com/')); sub('QR:R', qrSvg(cfg.qrRight || 'https://manna-fish.com/q/devo'));
    if (!d.gst) h = h.replace(/<div class="st4" data-b="gstrong">[^<]*<\/div>/, ''); if (!d.hst) h = h.replace(/<div class="st4" data-b="hstrong">[^<]*<\/div>/, '');
    return h; }
  /* a wide logo (wider than about 1.7 times its height, e.g. "Walmart, Monkey Junction, store 5241") may use the whole width of the middle of the card, so it is not scaled down like a round badge */
  function adjFor(cfg) { var a = JSON.parse(JSON.stringify(K.adj)); if (cfg.logoAspect > 1.7 && cfg.by === 'logo') a.logo = { dy: -0.8, s: 100 };
    if (cfg.cadj && typeof cfg.cadj === 'object') var lg = cfg.cadj && cfg.cadj.logo; if (lg) { a.logo = Object.assign({}, a.logo || {}); a.logo.s = (a.logo.s || 100) * ((+lg.s || 100) / 100); a.logo.dx = (a.logo.dx || 0) + (+lg.dx || 0); a.logo.dy = (a.logo.dy || 0) + (+lg.dy || 0); }   /* the sponsor's logo bigger or smaller than the layout's size, moved by hand */
    Object.keys(cfg.cadj).forEach(function (k) { if (k === 'qrOut' || k === 'logo') return; a[k] = Object.assign({}, a[k] || {}, cfg.cadj[k]); });
    var q = cfg.cadj && cfg.cadj.qrOut; if (q) {   /* the QR codes (and their labels) moved, resized and put anywhere, in mm and percent */
      [['qrL', 'labL', -(+q.l || 0), +q.ly || 0, +q.ls || 100], ['qrR', 'labR', +q.r || 0, +q.ry || 0, +q.rs || 100]].forEach(function (x) {
        var up = (100 - x[4]) / 100 * 7.6;   /* a smaller code shrinks toward its middle, so its label comes up with it */
        a[x[0]] = Object.assign({}, a[x[0]] || {}); a[x[0]].dx = (a[x[0]].dx || 0) + x[2]; a[x[0]].dy = (a[x[0]].dy || 0) + x[3]; a[x[0]].s = x[4];
        a[x[1]] = Object.assign({}, a[x[1]] || {}); a[x[1]].dx = (a[x[1]].dx || 0) + x[2]; a[x[1]].dy = (a[x[1]].dy || 0) + x[3] - up; }); }   /*    /* the sponsor's (or Ken's) own size, stretch and place for a block, e.g. the sponsor line */
    return a; }
  var styled = false;
  function addStyle() { if (styled) return; styled = true; var s = document.createElement('style'); s.id = 'mfkit-css'; s.textContent = K.css; document.head.appendChild(s); }
  /* puts the back on the page (millimetres, the same size as the printed card) and runs the fit step once the fonts are in */
  function mount(el, cfg) { return ready().then(function () { addStyle(); el.innerHTML = backHtml(cfg);
    return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { window.MFfit(cfg.adj || adjFor(cfg)); return el.querySelector('.pg'); }); }); }
  /* ---- files ---- */
  function blobFromCanvas(c) { return new Promise(function (ok) { c.toBlob(ok, 'image/png'); }); }
  function img(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
  function svgImg(svg) { return img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)); }
  function fishSvg(src, x, y, w) { return src.replace(/<svg\b[^>]*?viewBox="([^"]+)"[^>]*>/, function (m, vb) { return '<svg x="' + f2(x) + '" y="' + f2(y) + '" width="' + f2(w) + '" height="' + f2(w / 2) + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;shape-rendering:geometricPrecision" preserveAspectRatio="xMidYMid meet">'; }); }
  function svgPage(inner) { return '<svg xmlns="http://www.w3.org/2000/svg" width="' + f2(PW) + 'mm" height="' + f2(PH) + 'mm" viewBox="0 0 ' + f2(PW) + ' ' + f2(PH) + '">' + inner + '</svg>'; }
  /* a fish drawn for a verse the sponsor chose (cfg.verse = {ref, top, bot}): the same builder as "Make it a MannaFish" (fish-lang/makefish.js) */
  var BIGWORD = { BUILD: 700 };   /* K-Tech's Build is drawn a little bigger for print (Ken, 17 Nov: the standard 5-letter size is about 653) */
  function loadMake() { return window.MFmake ? Promise.resolve() : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/fish-lang/makefish.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function fishSource(cfg) { if (cfg.fishSvg) return Promise.resolve(cfg.fishSvg);
    if (cfg.verse && cfg.verse.top) return loadMake().then(function () { var w = String(cfg.word || ''); return MFmake.render({ word: w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(), top: cfg.verse.top, bot: cfg.verse.bot, ref: cfg.verse.ref, refShort: cfg.verse.ref, tag: ' (' + ({ kjv: 'KJV', web: 'WEB', asv: 'ASV', ylt: 'YLT', darby: 'Darby', bbe: 'BBE', dra: 'DRA' }[cfg.verse.ver || 'kjv'] || 'KJV') + ')', wordSize: BIGWORD[w.toUpperCase()] }); });
    return fishSourceFile(cfg); }
  function fishSourceFile(cfg) { var id = cfg.fishId || cfg.word; var tries = ['/fish/print/' + id + '.svg', '/fish/en/' + id + '.svg', '/fish/' + id + '.svg', '/fish/en/' + String(cfg.word).toUpperCase() + '.svg'];
    var t = function (i) { return i >= tries.length ? Promise.reject(new Error('No fish picture for ' + id)) : fetch(tries[i]).then(function (r) { return r.ok ? r.text() : t(i + 1); }).catch(function () { return t(i + 1); }); }; return t(0); }
  /* the front as it will look finished: the printed card with the fish in the same place and size as in the print files, cut to the card (no bleed, square corners) */
  function frontSvg(cfg) { return ready().then(function () { return fishSource(cfg); }).then(function (src) { return MFbox(src).then(function (box) {
    var maxW = CARD.w - 2 * (SAFE + KISS), maxH = CARD.h - 2 * (SAFE + KISS), s = Math.min(maxW / box.w, maxH / box.h),
      place = { x: BLEED + (CARD.w - box.w * s) / 2 - box.x * s, y: BLEED + (CARD.h - box.h * s) / 2 - box.y * s, w: 4000 * s };
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="' + f2(BLEED) + ' ' + f2(BLEED) + ' ' + f2(CARD.w) + ' ' + f2(CARD.h) + '" preserveAspectRatio="xMidYMid slice" style="display:block"><rect x="0" y="0" width="' + f2(PW) + '" height="' + f2(PH) + '" fill="#000"/>' + fishSvg(src, place.x, place.y, place.w) + '</svg>'; }); }); }
  function backPng(cfg, dpi) { var host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-20000px;top:0'; document.body.appendChild(host);
    return mount(host, cfg).then(function (pg) { var w = pg.offsetWidth, h = pg.offsetHeight, xhtml = new XMLSerializer().serializeToString(pg);
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>' + K.css + '</style>' + xhtml + '</div></foreignObject></svg>';
      return svgImg(svg).then(function (im) { var W = Math.round(PW / MM * dpi), H = Math.round(PH / MM * dpi), c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H); return blobFromCanvas(c); }); })
      .then(function (b) { host.remove(); return b; }, function (e) { host.remove(); throw e; }); }
  function dataBlob(u) { return fetch(u).then(function (r) { return r.blob(); }); }
  function notes(cfg, id) { return 'MannaFish card print files' + (id ? ' (order ' + id + ')' : '') + '\n\nCard: 4.5 x 2.75 in (114.3 x 69.85 mm), custom size. Every file includes a 1/8 in (3.175 mm) bleed on each side, so each file is 4.75 x 3.0 in (120.65 x 76.2 mm) and all four line up.\n\n'
    + '0-one-page-actual-size.pdf : the decal, backing front and back on one letter page at actual size, for a quick check (print at 100%).\n'
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
        .then(function (b) { out.push({ name: '4-back.png', blob: b }); out.push({ name: 'printer-notes.txt', blob: new Blob([notes(cfg, opt.id)], { type: 'text/plain' }) }); return sheetPdf(out, cfg).then(function (pdf) { out.unshift({ name: '0-one-page-actual-size.pdf', blob: pdf }); return out; }); }); }); }); }
  /* ---- the one-page sheet for a check at actual size: decal on a dark checkerboard (so the white shows), backing front, back; a JPEG on a letter page in a small PDF ---- */
  function sheetPdf(list, cfg) { var by = {}; list.forEach(function (f) { by[f.name] = f.blob; }), dpi = 300, W = 8.5 * dpi, H = 11 * dpi, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); var iw = 4.75 * dpi, ih = 3 * dpi, X = 0.5 * dpi, tops = [0.55, 3.7, 6.85].map(function (v) { return v * dpi; });
    return Promise.all(['1-decal-white-ink.png', '2-backing-front.png', '4-back.png'].map(function (n) { return createImageBitmap(by[n]); })).then(function (bm) {
      x.fillStyle = '#000'; x.font = 'bold ' + (0.14 * dpi) + 'px Helvetica, Arial, sans-serif'; x.fillText((cfg.title || cfg.word) + ' card · 4.5 x 2.75 in · actual size (print at 100%)', X, 0.35 * dpi);
      var g = 0.15 * dpi; for (var i = 0; i < 3; i++) { if (i === 0) { for (var yy = 0; yy < ih; yy += g) for (var xx = 0; xx < iw; xx += g) { x.fillStyle = ((xx / g + yy / g) % 2 === 0) ? '#4a4a4a' : '#6a6a6a'; x.fillRect(X + xx, tops[0] + yy, g, g); } } else { x.fillStyle = '#000'; x.fillRect(X, tops[i], iw, ih); }
        x.drawImage(bm[i], X, tops[i], iw, ih); x.strokeStyle = '#f0f'; x.setLineDash([6, 6]); x.lineWidth = 2; x.strokeRect(X + 0.125 * dpi, tops[i] + 0.125 * dpi, 4.5 * dpi, 2.75 * dpi); x.setLineDash([]); }
      var notes = [['FILE 1 · FRONT DECAL (peels off)', 'Clear vinyl, white ink only. The checkerboard only shows what is clear: it is not printed.', 'White: the fish and the big word. Clear: the verse words, the reference, MannaFish and everything outside the fish.', 'Kiss cut: through the vinyl only, not the backing paper. Set the cut line 1/8 in or less outside the fish.'],
        ['FILE 2 · FRONT OF THE BACKING CARD', 'The card under the decal: black, with the same fish in white, so when the decal is peeled off the card still shows the fish.'],
        ['FILE 3 · BACK OF THE CARD', 'The word study devotional, printed on the card.', 'Pink dashed line = card edge, 4.5 x 2.75 in. The 1/8 in outside it is bleed (each file is 4.75 x 3.0 in).']];
      notes.forEach(function (n, i) { var y = tops[i] + 0.1 * dpi, w = 2.7 * dpi, xx = X + iw + 0.2 * dpi; x.fillStyle = '#000'; x.font = 'bold ' + (0.125 * dpi) + 'px Helvetica, Arial, sans-serif'; x.fillText(n[0], xx, y + 0.1 * dpi); x.font = (0.105 * dpi) + 'px Helvetica, Arial, sans-serif'; y += 0.34 * dpi;
        n.slice(1).forEach(function (para) { var words = para.split(' '), line = ''; words.forEach(function (wd) { var t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > w && line) { x.fillText(line, xx, y); y += 0.15 * dpi; line = wd; } else line = t; }); x.fillText(line, xx, y); y += 0.22 * dpi; }); });
      return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.93); }); }).then(function (jb) { return jb.arrayBuffer().then(function (ab) { var jpg = new Uint8Array(ab), enc = new TextEncoder(), parts = [], off = 0, offs = [];
        var put = function (s) { var u = typeof s === 'string' ? enc.encode(s) : s; parts.push(u); off += u.length; }, obj = function (n, body) { offs[n] = off; put(n + ' 0 obj\n'); put(body); put('\nendobj\n'); };
        put('%PDF-1.4\n'); obj(1, '<< /Type /Catalog /Pages 2 0 R >>'); obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
        obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
        offs[4] = off; put('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n'); put(jpg); put('\nendstream\nendobj\n');
        var cs = 'q 612 0 0 792 0 0 cm /Im0 Do Q'; obj(5, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
        var xr = off; put('xref\n0 6\n0000000000 65535 f \n'); for (var i = 1; i <= 5; i++) put(('0000000000' + offs[i]).slice(-10) + ' 00000 n \n'); put('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF\n');
        return new Blob(parts, { type: 'application/pdf' }); }); }); }
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
  window.MFkit = { swapRefs: swapRefs, frontSvg: frontSvg, sheetPdf: sheetPdf, fishSource: fishSource, ready: ready, mount: mount, backHtml: backHtml, files: files, zip: zip, study: study, defLines: defLines, get words() { return K.words; }, get css() { return K.css; } };
})();
