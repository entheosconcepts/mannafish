/* MannaFish print kit: the canvas helpers that find a fish's ink and trace its kiss cut (also run by tools/print/make.mjs). */

window.MFload = (src) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no;
  im.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(src.replace(/<svg\b/, '<svg width="4000" height="2000"')))); });
// the box the ink fills, in the art's own units (4000 x 2000)
window.MFbox = async (src) => { const im = await MFload(src), w = 2000, h = 1000, c = new OffscreenCanvas(w, h), x = c.getContext('2d');
  x.drawImage(im, 0, 0, w, h); const a = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (a[(y * w + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x: x0 * 2, y: y0 * 2, w: (x1 - x0 + 1) * 2, h: (y1 - y0 + 1) * 2 }; };
// the kiss cut: the fish's outline filled in (no holes), grown by r mm, traced, smoothed; points in mm on the page
window.MFcut = async (src, place, page, r, ppm) => {
  const im = await MFload(src), W = Math.ceil(page.w * ppm), H = Math.ceil(page.h * ppm), c = new OffscreenCanvas(W, H), x = c.getContext('2d');
  x.drawImage(im, place.x * ppm, place.y * ppm, place.w * ppm, place.w / 2 * ppm);
  const a = x.getImageData(0, 0, W, H).data, N = W * H, out = new Uint8Array(N), st = [];
  const push = (i) => { if (out[i] || a[i * 4 + 3] > 16) return; out[i] = 1; st.push(i); };
  for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i); } for (let j = 0; j < H; j++) { push(j * W); push(j * W + W - 1); }
  while (st.length) { const k = st.pop(), xx = k % W, yy = (k - xx) / W; if (xx > 0) push(k - 1); if (xx < W - 1) push(k + 1); if (yy > 0) push(k - W); if (yy < H - 1) push(k + W); }
  // squared distance to the nearest inside pixel (Felzenszwalb & Huttenlocher), then everything within r
  const INF = 1e20, f = new Float64Array(Math.max(W, H)), d = new Float64Array(Math.max(W, H)), v = new Int32Array(Math.max(W, H)), z = new Float64Array(Math.max(W, H) + 1), D = new Float64Array(N);
  for (let k = 0; k < N; k++) D[k] = out[k] ? INF : 0;
  const dt = (n) => { let kk = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) { let s; do { const p = v[kk]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[kk]) kk--; else break; } while (kk >= 0);
      kk++; v[kk] = q; z[kk] = s; z[kk + 1] = INF; }
    kk = 0; for (let q = 0; q < n; q++) { while (z[kk + 1] < q) kk++; const p = v[kk]; d[q] = (q - p) * (q - p) + f[p]; } };
  for (let xx = 0; xx < W; xx++) { for (let yy = 0; yy < H; yy++) f[yy] = D[yy * W + xx]; dt(H); for (let yy = 0; yy < H; yy++) D[yy * W + xx] = d[yy]; }
  for (let yy = 0; yy < H; yy++) { for (let xx = 0; xx < W; xx++) f[xx] = D[yy * W + xx]; dt(W); for (let xx = 0; xx < W; xx++) D[yy * W + xx] = d[xx]; }
  const R2 = (r * ppm) * (r * ppm), g = new Uint8Array(N); for (let k = 0; k < N; k++) g[k] = D[k] <= R2 ? 1 : 0;
  // the outline: marching squares round the outside
  const val = (i, j) => (i >= 0 && j >= 0 && i < W && j < H && g[j * W + i]) ? 1 : 0;
  let sx = -1, sy = -1; outer: for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) { const s = val(i, j) | val(i + 1, j) << 1 | val(i, j + 1) << 2 | val(i + 1, j + 1) << 3; if (s > 0 && s < 15) { sx = i; sy = j; break outer; } }
  const pts = []; let cx = sx, cy = sy, prev = 0, guard = 0; // 1 up 2 right 3 down 4 left
  do { const s = val(cx, cy) | val(cx + 1, cy) << 1 | val(cx, cy + 1) << 2 | val(cx + 1, cy + 1) << 3; let nx;
    switch (s) { case 1: nx = 1; break; case 2: nx = 2; break; case 3: nx = 2; break; case 4: nx = 4; break; case 5: nx = 1; break; case 6: nx = prev === 1 ? 4 : 2; break;
      case 7: nx = 2; break; case 8: nx = 3; break; case 9: nx = prev === 2 ? 1 : 3; break; case 10: nx = 3; break; case 11: nx = 3; break; case 12: nx = 4; break; case 13: nx = 1; break; case 14: nx = 4; break; default: nx = 2; }
    pts.push([cx + 1, cy + 1]); if (nx === 1) cy--; else if (nx === 2) cx++; else if (nx === 3) cy++; else cx--; prev = nx;
  } while ((cx !== sx || cy !== sy) && ++guard < 4e6);
  // smooth the pixel steps away, then keep only the points that matter
  let P = pts; for (let it = 0; it < 3; it++) { const Q = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; Q.push([p[0] * .75 + q[0] * .25, p[1] * .75 + q[1] * .25], [p[0] * .25 + q[0] * .75, p[1] * .25 + q[1] * .75]); } P = Q; }
  const rdp = (L, eps) => { if (L.length < 3) return L; const A = L[0], B = L[L.length - 1]; let dm = 0, im2 = 0;
    for (let i = 1; i < L.length - 1; i++) { const p = L[i], dx = B[0] - A[0], dy = B[1] - A[1], dd = Math.hypot(dx, dy) || 1, dist = Math.abs(dy * p[0] - dx * p[1] + B[0] * A[1] - B[1] * A[0]) / dd; if (dist > dm) { dm = dist; im2 = i; } }
    return dm > eps ? rdp(L.slice(0, im2 + 1), eps).slice(0, -1).concat(rdp(L.slice(im2), eps)) : [A, B]; };
  // a closed loop: split it at the point farthest from the start, simplify each half
  let far = 0, fd = 0; P.forEach((p, i) => { const dd = Math.hypot(p[0] - P[0][0], p[1] - P[0][1]); if (dd > fd) { fd = dd; far = i; } });
  P = rdp(P.slice(0, far + 1), 0.03 * ppm).slice(0, -1).concat(rdp(P.slice(far).concat([P[0]]), 0.03 * ppm).slice(0, -1));
  return P.map((p) => [p[0] / ppm, p[1] / ppm]); };
// the decal: white ink where the fish is white, nothing where it is black (the letters) or empty
window.MFink = async (src, place, page, dpi) => { const im = await MFload(src), k = dpi / 25.4, W = Math.round(page.w * k), H = Math.round(page.h * k), c = new OffscreenCanvas(W, H), x = c.getContext('2d');
  x.drawImage(im, place.x * k, place.y * k, place.w * k, place.w / 2 * k); const d = x.getImageData(0, 0, W, H), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 765; a[i + 3] = Math.round(a[i + 3] * l); a[i] = a[i + 1] = a[i + 2] = 255; }
  x.putImageData(d, 0, 0); const b = await c.convertToBlob({ type: 'image/png' }); const r = new FileReader();
  return await new Promise((ok) => { r.onload = () => ok(r.result); r.readAsDataURL(b); }); };
