/* =========================================================
   Cozy Tales - js/art.js
   Every illustration is inline SVG drawn here: wobbly
   hand-drawn shapes, friendly animal characters, scenery
   and icons. No external images.
   Scenes use a 400 x 300 canvas.
   ========================================================= */
(function () {
  'use strict';
  const SB = window.SB = window.SB || {};

  // ---------- Palette (reads CSS variables) ----------
  const cache = {};
  const C = SB.color = function (name) {
    if (cache[name]) return cache[name];
    let v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim(); } catch (e) { /* ignore */ }
    return (cache[name] = v || '#ccc');
  };
  const K = () => C('ink');
  const S = 'stroke-linecap="round" stroke-linejoin="round"';
  const st = w => `stroke="${K()}" stroke-width="${w == null ? 4 : w}" ${S}`;
  const f1 = v => Math.round(v * 10) / 10;

  // ---------- Hand-drawn helpers ----------
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // Smooth closed Catmull-Rom path through points
  function smooth(pts) {
    const n = pts.length;
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${f1(c1x)} ${f1(c1y)} ${f1(c2x)} ${f1(c2y)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + 'Z';
  }

  // Wobbly ellipse-ish blob
  function blob(cx, cy, rx, ry, seed, wob, n) {
    const r = rng(seed || 1);
    n = n || 9;
    wob = wob == null ? 0.05 : wob;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (r() - 0.5) * 2 * wob;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return smooth(pts);
  }

  // Wobbly rounded rectangle
  function wrect(x, y, w, h, rad, seed, wob) {
    const r = rng(seed || 1);
    rad = Math.min(rad == null ? 10 : rad, w / 2, h / 2);
    const j = (wob == null ? 0.012 : wob) * Math.max(8, Math.min(w, h)) * 2;
    const J = v => v + (r() - 0.5) * j;
    const k = rad * 0.29;
    const pts = [
      [x + rad, y], [x + w / 2, y], [x + w - rad, y],
      [x + w - k, y + k], [x + w, y + rad], [x + w, y + h / 2], [x + w, y + h - rad],
      [x + w - k, y + h - k], [x + w - rad, y + h], [x + w / 2, y + h], [x + rad, y + h],
      [x + k, y + h - k], [x, y + h - rad], [x, y + h / 2], [x, y + rad], [x + k, y + k]
    ].map(p => [J(p[0]), J(p[1])]);
    return smooth(pts);
  }

  // ---------- Tiny builders ----------
  const shape = (d, fill, w) => `<path d="${d}" fill="${fill}" ${st(w)}/>`;
  const oval = (cx, cy, rx, ry, fill, seed, w) => shape(blob(cx, cy, rx, ry, seed, 0.04, 9), fill, w);
  const rect = (x, y, w, h, rad, fill, seed, sw) => shape(wrect(x, y, w, h, rad, seed), fill, sw);
  const line = (d, w, col) => `<path d="${d}" fill="none" stroke="${col || K()}" stroke-width="${w || 4}" ${S}/>`;
  const dot = (cx, cy, r, fill) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill || K()}"/>`;

  // One clean outline around several overlapping shapes
  function merged(parts, fill, w) {
    w = w == null ? 4 : w;
    const ds = parts.map(d => `<path d="${d}"/>`).join('');
    return `<g fill="${K()}" stroke="${K()}" stroke-width="${w * 2}" ${S}>${ds}</g><g fill="${fill}">${ds}</g>`;
  }

  const at = (x, y, s, inner, flip) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
  // Tappable group: data-a = animation, data-s = sound
  const tp = (inner, a, snd, cls, d) =>
    `<g class="tp ${cls || ''}" data-a="${a || 'wiggle'}" data-s="${snd || 'pop'}"${d != null ? ` style="--d:${d}s"` : ''}>${inner}</g>`;
  // Gentle ambient animation (sway, drift, twinkle, bob ...)
  const amb = (inner, cls, d) => `<g class="${cls}" style="--d:${d || 0}s">${inner}</g>`;

  // ---------- Faces ----------
  function face(cx, cy, s, mood) {
    const k = K(), sw = f1(Math.max(2, s * 0.1));
    const ex = s * 0.4, ey = cy - s * 0.08, er = s * 0.12;
    let eyes;
    if (mood === 'sleepy') {
      eyes = line(`M${f1(cx - ex - er * 1.5)} ${f1(ey)} q${f1(er * 1.5)} ${f1(er * 1.8)} ${f1(er * 3)} 0 M${f1(cx + ex - er * 1.5)} ${f1(ey)} q${f1(er * 1.5)} ${f1(er * 1.8)} ${f1(er * 3)} 0`, sw);
    } else if (mood === 'scrunch') {
      eyes = line(`M${f1(cx - ex - er * 1.6)} ${f1(ey - er * 1.4)} l${f1(er * 3)} ${f1(er * 1.4)} l${f1(-er * 3)} ${f1(er * 1.4)} M${f1(cx + ex + er * 1.6)} ${f1(ey - er * 1.4)} l${f1(-er * 3)} ${f1(er * 1.4)} l${f1(er * 3)} ${f1(er * 1.4)}`, sw);
    } else {
      eyes = `<g class="eyes">${dot(cx - ex, ey, er)}${dot(cx + ex, ey, er)}${dot(cx - ex + er * 0.35, ey - er * 0.35, er * 0.38, '#fff')}${dot(cx + ex + er * 0.35, ey - er * 0.35, er * 0.38, '#fff')}</g>`;
    }
    const my = cy + s * 0.36;
    let mouth;
    if (mood === 'wow') mouth = `<ellipse cx="${f1(cx)}" cy="${f1(my + s * 0.1)}" rx="${f1(s * 0.13)}" ry="${f1(s * 0.17)}" fill="${k}"/>`;
    else if (mood === 'sad') mouth = line(`M${f1(cx - s * 0.2)} ${f1(my + s * 0.22)} Q${f1(cx)} ${f1(my - s * 0.02)} ${f1(cx + s * 0.2)} ${f1(my + s * 0.22)}`, sw);
    else if (mood === 'grin' || mood === 'scrunch') mouth = `<path d="M${f1(cx - s * 0.3)} ${f1(my)} Q${f1(cx)} ${f1(my + s * 0.62)} ${f1(cx + s * 0.3)} ${f1(my)} Z" fill="${C('pink-d')}" ${st(sw)}/>`;
    else mouth = line(`M${f1(cx - s * 0.22)} ${f1(my)} Q${f1(cx)} ${f1(my + s * 0.28)} ${f1(cx + s * 0.22)} ${f1(my)}`, sw);
    const cheeks = `<ellipse cx="${f1(cx - s * 0.68)}" cy="${f1(cy + s * 0.22)}" rx="${f1(s * 0.14)}" ry="${f1(s * 0.1)}" fill="${C('pink-d')}" opacity=".45"/><ellipse cx="${f1(cx + s * 0.68)}" cy="${f1(cy + s * 0.22)}" rx="${f1(s * 0.14)}" ry="${f1(s * 0.1)}" fill="${C('pink-d')}" opacity=".45"/>`;
    return eyes + mouth + cheeks;
  }

  // ---------- Characters (feet at 0,0; about 100 units tall) ----------
  const arm = (x, y, rot, fill, len) => `<g transform="rotate(${rot} ${x} ${y})">${oval(x, y + (len || 12), 7, len || 13, fill, 5)}</g>`;

  function bear(o) {
    const fur = o.fur || C('wood-d'), bel = C('wood');
    const arms = o.up
      ? arm(-26, -40, 150, fur) + arm(26, -40, -150, fur)
      : arm(-27, -42, 12, fur) + arm(27, -42, -12, fur);
    return oval(-19, -90, 10, 10, fur, 3) + oval(19, -90, 10, 10, fur, 4) + dot(-19, -90, 4.5, bel) + dot(19, -90, 4.5, bel) +
      oval(-13, -4, 11, 6, fur, 8) + oval(13, -4, 11, 6, fur, 9) +
      oval(0, -30, 26, 27, fur, 1) + oval(0, -26, 15, 17, bel, 2, 0) + arms +
      oval(0, -68, 27, 24, fur, 6) +
      oval(0, -61, 12, 9, bel, 7, 0) + `<ellipse cx="0" cy="-65" rx="4.5" ry="3.2" fill="${K()}"/>` +
      face(0, -70, 20, o.mood || 'happy');
  }

  function bunny(o) {
    const fur = o.fur || C('paper'), inner = C('pink');
    const arms = o.up
      ? arm(-19, -38, 150, fur, 11) + arm(19, -38, -150, fur, 11)
      : arm(-20, -36, 10, fur, 11) + arm(20, -36, -10, fur, 11);
    return `<g transform="rotate(-8 -9 -70)">${oval(-9, -96, 7, 21, fur, 2)}${oval(-9, -94, 3.4, 14, inner, 3, 0)}</g>` +
      `<g transform="rotate(8 9 -70)">${oval(9, -96, 7, 21, fur, 4)}${oval(9, -94, 3.4, 14, inner, 5, 0)}</g>` +
      oval(-10, -4, 10, 5.5, fur, 8) + oval(10, -4, 10, 5.5, fur, 9) +
      dot(19, -14, 8, fur).replace('/>', ` stroke="${K()}" stroke-width="3"/>`) +
      oval(0, -26, 21, 23, fur, 1) + arms +
      oval(0, -58, 21, 19, fur, 6) +
      `<path d="M-3 -57 L3 -57 L0 -53Z" fill="${C('pink-d')}" ${st(2)}/>` +
      face(0, -60, 17, o.mood || 'happy');
  }

  // Duck faces right; flip with the `flip` argument of at()
  function duck(o) {
    const body = o.fur || C('butter'), wing = C('butter-d'), bill = C('peach-d');
    const sleepy = o.mood === 'sleepy';
    const eye = sleepy
      ? line('M17 -64 q4 4 8 0', 2.6)
      : dot(22, -63, 3.6) + dot(23.2, -64.2, 1.3, '#fff');
    const mouth = (o.mood === 'wow' ? `<ellipse cx="39" cy="-56" rx="4" ry="4.5" fill="${K()}"/>` : '') +
      (o.mood === 'sad' ? line('M17 -69 L27 -73', 2.6) : '');
    return `<path d="M-24 -28 L-40 -42 L-30 -18Z" fill="${body}" ${st(4)}/>` +
      oval(-9, -3, 8, 4.5, bill, 8) + oval(8, -3, 8, 4.5, bill, 9) +
      oval(0, -26, 28, 22, body, 1) + oval(-4, -26, 15, 11, wing, 2, 3) +
      oval(17, -58, 18, 18, body, 3) +
      `<path d="M31 -61 Q47 -62 45 -55 Q47 -49 31 -52Z" fill="${bill}" ${st(3.5)}/>` + mouth +
      eye + `<ellipse cx="14" cy="-54" rx="4" ry="2.6" fill="${C('pink-d')}" opacity=".5"/>`;
  }

  function owl(o) {
    const fur = o.fur || C('lilac-d'), bel = C('lilac');
    return `<path d="M-24 -66 L-30 -92 L-9 -78Z" fill="${fur}" ${st(4)}/><path d="M24 -66 L30 -92 L9 -78Z" fill="${fur}" ${st(4)}/>` +
      oval(-8, -3, 8, 4.5, C('peach-d'), 8) + oval(8, -3, 8, 4.5, C('peach-d'), 9) +
      oval(0, -40, 30, 40, fur, 1) + oval(0, -30, 18, 24, bel, 2, 0) +
      `<g transform="rotate(10 -28 -42)">${oval(-30, -38, 8, 22, fur, 4)}</g><g transform="rotate(-10 28 -42)">${oval(30, -38, 8, 22, fur, 5)}</g>` +
      `<path d="M-15 -34 q4 3 8 0 M-5 -29 q4 3 8 0 M5 -34 q4 3 8 0" fill="none" stroke="${C('lilac-d')}" stroke-width="2.4" ${S} opacity=".8"/>` +
      (o.mood === 'sleepy'
        ? line('M-22 -58 q8 8 16 0 M6 -58 q8 8 16 0', 3.4)
        : `<circle cx="-13" cy="-58" r="12" fill="#fff" ${st(3.5)}/><circle cx="13" cy="-58" r="12" fill="#fff" ${st(3.5)}/><g class="eyes">${dot(-12, -57, 6)}${dot(14, -57, 6)}${dot(-10.5, -59, 2, '#fff')}${dot(15.5, -59, 2, '#fff')}</g>`) +
      `<path d="M-5 -49 L5 -49 L0 -41Z" fill="${C('peach-d')}" ${st(3)}/>`;
  }

  function fox(o) {
    const fur = o.fur || C('peach-d'), wht = C('paper');
    const arms = o.up
      ? arm(-22, -40, 150, fur, 12) + arm(22, -40, -150, fur, 12)
      : arm(-22, -40, 10, fur, 12) + arm(22, -40, -10, fur, 12);
    const wag = `<g class="wag">${merged([blob(36, -22, 24, 12, 3, 0.05)], fur, 4)}${merged([blob(52, -26, 9, 7, 2, 0.05)], wht, 3)}</g>`;
    return wag +
      oval(-10, -4, 10, 5.5, fur, 8) + oval(10, -4, 10, 5.5, fur, 9) +
      oval(0, -30, 22, 28, fur, 1) + oval(0, -24, 12, 18, wht, 2, 0) + arms +
      `<path d="M-23 -76 L-26 -106 L-6 -86Z" fill="${fur}" ${st(4)}/><path d="M23 -76 L26 -106 L6 -86Z" fill="${fur}" ${st(4)}/>` +
      `<path d="M-21 -80 L-22 -97 L-11 -86Z" fill="${K()}" opacity=".55"/><path d="M21 -80 L22 -97 L11 -86Z" fill="${K()}" opacity=".55"/>` +
      oval(0, -66, 26, 21, fur, 6) +
      `<path d="M-26 -62 Q-14 -54 0 -50 Q14 -54 26 -62 Q16 -48 0 -46 Q-16 -48 -26 -62Z" fill="${wht}"/>` +
      `<ellipse cx="0" cy="-64" rx="4.5" ry="3.2" fill="${K()}"/>` +
      face(0, -68, 17, o.mood || 'happy');
  }

  // Fish: swims to the right, centred on 0,0
  function fish(o) {
    const col = o.fur || C('coral'), fin = C('coral-d');
    return `<g class="swish">${merged([blob(-30, 0, 15, 15, 4, 0.04, 6)], fin, 3)}</g>` +
      oval(0, 0, 28, 19, col, 2) +
      line('M-4 -10 q6 10 0 20 M7 -12 q6 12 0 24', 2.6, fin) +
      `<path d="M-6 -17 Q2 -30 12 -17Z" fill="${fin}" ${st(3)}/>` +
      (o.mood === 'sleepy' ? line('M13 -4 q4 4 8 0', 2.6) : dot(15, -3, 3.8) + dot(16.2, -4.2, 1.4, '#fff')) +
      line('M19 6 q4 3 8 -1', 2.6) + `<ellipse cx="11" cy="6" rx="3.6" ry="2.4" fill="${C('pink-d')}" opacity=".5"/>`;
  }

  function starFace(cx, cy, r, mood) {
    const rr = rng(5);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? r * 0.55 : r;
      pts.push(`${f1(cx + Math.cos(a) * rad + (rr() - 0.5) * 2)} ${f1(cy + Math.sin(a) * rad + (rr() - 0.5) * 2)}`);
    }
    return `<path d="M${pts.join(' L')}Z" fill="${C('butter')}" stroke="${K()}" stroke-width="5" stroke-linejoin="round"/>` + face(cx, cy + r * 0.05, r * 0.5, mood || 'happy');
  }

  const kinds = { bear, bunny, duck, owl, fox };
  // critter('bear', {mood:'sleepy', up:true, fur:'#...'}) -> svg string
  const critter = (kind, o) => `<g class="body">${kinds[kind](o || {})}</g>`;

  // ---------- Scenery ----------
  function sky(kind) {
    const t = {
      day: ['day', 'sky'], night: ['night', 'night-2'], dusk: ['peach', 'lilac'],
      rain: ['#C3D3E3', '#A9BED3'], sea: ['teal', 'sky'], sunny: ['day', 'sky']
    }[kind] || ['day', 'sky'];
    const a = t[0].charAt(0) === '#' ? t[0] : C(t[0]);
    const b = t[1].charAt(0) === '#' ? t[1] : C(t[1]);
    return `<rect width="400" height="300" fill="${a}"/><path d="${blob(200, 330, 360, 150, 3, 0.04, 10)}" fill="${b}" opacity=".45"/>`;
  }
  const hill = (cx, cy, rx, ry, col, seed) => `<path d="${blob(cx, cy, rx, ry, seed || 1, 0.04, 10)}" fill="${col}" stroke="${K()}" stroke-width="4"/>`;
  const ground = (col, y) => hill(200, (y || 250) + 120, 330, 120, col || C('grass'), 7);

  function sun(x, y, r, happy) {
    let rays = '';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      rays += `<path d="M${f1(x + Math.cos(a) * (r + 8))} ${f1(y + Math.sin(a) * (r + 8))} L${f1(x + Math.cos(a) * (r + 22))} ${f1(y + Math.sin(a) * (r + 22))}" stroke="${C('butter-d')}" stroke-width="6" ${S} fill="none"/>`;
    }
    return amb(rays, 'spin', 0) + oval(x, y, r, r, C('butter'), 4, 4.5) + (happy === false ? '' : face(x, y, r * 0.55, 'happy'));
  }

  function moon(x, y, r, mood) {
    return oval(x, y, r, r, C('paper'), 3, 4.5) +
      dot(x - r * 0.45, y + r * 0.4, r * 0.16, C('cream-2')) + dot(x + r * 0.5, y - r * 0.35, r * 0.12, C('cream-2')) +
      dot(x + r * 0.35, y + r * 0.5, r * 0.09, C('cream-2')) +
      (mood === false ? '' : face(x, y - r * 0.05, r * 0.5, mood || 'sleepy'));
  }

  function cloud(x, y, s, col, d) {
    col = col || C('paper');
    const parts = [blob(0, 6, 34, 16, 2, 0.04, 8), blob(-14, -4, 18, 16, 3, 0.04, 8), blob(10, -9, 22, 20, 4, 0.04, 8)];
    return `<g transform="translate(${x} ${y}) scale(${s})">${amb(merged(parts, col, 4), 'drift', d)}</g>`;
  }

  function spark(x, y, r, fill) {
    return `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill || C('butter')}" stroke="${K()}" stroke-width="2" ${S}/>`;
  }
  function stars(list) {
    // list: [x, y, r] ...
    return list.map((p, i) => `<g class="twinkle" style="--d:${(i * 0.7) % 3}s">${spark(p[0], p[1], p[2] || 6, i % 3 === 0 ? C('butter') : C('paper'))}</g>`).join('');
  }

  function tree(x, y, s, col, d) {
    col = col || C('sage');
    const crown = [blob(0, -62, 30, 26, 2, 0.05, 8), blob(-18, -46, 22, 20, 3, 0.05, 8), blob(18, -46, 22, 20, 4, 0.05, 8)];
    return `<g transform="translate(${x} ${y}) scale(${s})">${rect(-7, -50, 14, 50, 5, C('wood-d'), 4)}${amb(merged(crown, col, 4) + dot(-8, -60, 3, 'rgba(255,255,255,.35)'), 'sway', d)}</g>`;
  }

  function bush(x, y, s, col) {
    return `<g transform="translate(${x} ${y}) scale(${s})">${merged([blob(0, -12, 26, 14, 2, 0.05, 8), blob(-14, -8, 16, 12, 3, 0.05, 8), blob(14, -8, 16, 12, 4, 0.05, 8)], col || C('sage'), 4)}</g>`;
  }

  function flower(x, y, col, s, d) {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      petals += `<circle cx="${f1(Math.cos(a) * 7)}" cy="${f1(-26 + Math.sin(a) * 7)}" r="6" fill="${col}" stroke="${K()}" stroke-width="2.4"/>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${s || 1})">${amb(line('M0 0 V-22', 3) + petals + dot(0, -26, 4.5, C('butter')), 'sway', d)}</g>`;
  }
  const flowers = (list, s) => list.map((p, i) => flower(p[0], p[1], C(['pink', 'lilac', 'butter', 'coral'][i % 4]), s || 1, i * 0.5)).join('');

  function mushroom(x, y, s, col) {
    return `<g transform="translate(${x} ${y}) scale(${s || 1})">${rect(-7, -22, 14, 22, 6, C('paper'), 3)}${shape('M-24 -20 Q-22 -48 0 -48 Q22 -48 24 -20 Q0 -14 -24 -20Z', col || C('coral'), 4)}${dot(-9, -34, 4, C('paper'))}${dot(8, -38, 3.4, C('paper'))}${dot(12, -26, 2.8, C('paper'))}</g>`;
  }

  function house(x, y, s, lit) {
    return `<g transform="translate(${x} ${y}) scale(${s || 1})">` +
      rect(-34, -50, 68, 50, 6, C('peach'), 3) +
      shape('M-42 -48 L0 -88 L42 -48Z', C('coral'), 4) +
      rect(-8, -32, 16, 32, 6, C('lilac'), 2) +
      rect(14, -40, 14, 14, 3, lit ? C('butter') : C('sky'), 3) +
      rect(-28, -40, 14, 14, 3, lit ? C('butter') : C('sky'), 4) +
      rect(16, -84, 10, 22, 3, C('wood-d'), 2) + `</g>`;
  }

  function pond(x, y, rx, ry) {
    return oval(x, y, rx, ry, C('sky'), 5, 4.5) +
      line(`M${x - rx * 0.5} ${y + ry * 0.3} q${rx * 0.15} -4 ${rx * 0.3} 0`, 3, 'rgba(255,255,255,.7)') +
      line(`M${x + rx * 0.2} ${y - ry * 0.4} q${rx * 0.15} -4 ${rx * 0.3} 0`, 3, 'rgba(255,255,255,.7)');
  }
  // expanding ripple rings (re-triggered by css animation)
  const ripples = (x, y, rx, ry, n) => {
    let g = '';
    for (let i = 0; i < (n || 2); i++) g += `<ellipse class="ring" style="--d:${i * 1.2}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="3"/>`;
    return g;
  };

  function rain(n, col) {
    const rr = rng(11);
    let g = '';
    for (let i = 0; i < (n || 26); i++) {
      const x = rr() * 400, y = rr() * 300;
      g += `<path class="drop" style="--d:${f1(rr() * 1.4)}s" d="M${f1(x)} ${f1(y)} l-3 12" stroke="${col || C('sky-d')}" stroke-width="3" ${S} fill="none"/>`;
    }
    return g;
  }

  function balloon(x, y, col, s, tail) {
    const t = tail == null ? 70 : tail;
    return `<g transform="translate(${x} ${y}) scale(${s || 1})">` +
      amb(line(`M0 22 q-8 ${t * 0.4} 4 ${t * 0.7} q-6 ${t * 0.2} 2 ${t * 0.3}`, 2.6) +
        oval(0, 0, 20, 24, col || C('coral'), 6) + `<path d="M-4 22 L4 22 L0 28Z" fill="${col || C('coral')}" ${st(3)}/>` +
        `<path d="M-10 -10 q2 -8 9 -10" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="4" ${S}/>`, 'bob', 0) + `</g>`;
  }

  function bubbles(list) {
    return list.map((p, i) => `<g class="rise" style="--d:${(i * 0.9) % 4}s"><circle cx="${p[0]}" cy="${p[1]}" r="${p[2] || 6}" fill="rgba(255,255,255,.35)" stroke="${K()}" stroke-width="2.4"/><path d="M${p[0] - (p[2] || 6) * 0.4} ${p[1] - (p[2] || 6) * 0.3} q1 -3 4 -3" stroke="#fff" stroke-width="2" fill="none" ${S}/></g>`).join('');
  }
  const tapBubble = (x, y, r, d) => tp(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,.4)" stroke="${K()}" stroke-width="3"/><path d="M${x - r * 0.45} ${y - r * 0.3} q2 -5 6 -5" stroke="#fff" stroke-width="2.6" fill="none" ${S}/>`, 'pop', 'bubble', 'rise', d);

  function rainbow(x, y, r) {
    const cols = ['coral', 'peach', 'butter', 'mint', 'sky', 'lilac'];
    return cols.map((c, i) => `<path d="M${x - r + i * 8} ${y} A${r - i * 8} ${r - i * 8} 0 0 1 ${x + r - i * 8} ${y}" fill="none" stroke="${C(c)}" stroke-width="9" stroke-linecap="butt"/>`).join('');
  }

  function zzz(x, y) {
    const z = (dx, dy, s, d) => `<text class="zee" style="--d:${d}s" x="${x + dx}" y="${y + dy}" font-size="${s}" font-weight="800" fill="${C('paper')}" stroke="${K()}" stroke-width="1.6" paint-order="stroke" font-family="ui-rounded,Nunito,system-ui,sans-serif">z</text>`;
    return z(0, 0, 18, 0) + z(14, -16, 24, 0.8) + z(32, -36, 30, 1.6);
  }

  const basket = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})">${shape('M-24 -22 L24 -22 L18 0 L-18 0Z', C('wood'), 4)}${line('M-14 -22 q14 -26 28 0', 4)}${line('M-18 -11 H18 M-8 -22 V0 M8 -22 V0', 2.4, C('wood-d'))}</g>`;
  const cake = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})">${rect(-22, -22, 44, 22, 6, C('pink'), 3)}${rect(-17, -36, 34, 16, 6, C('paper'), 5)}${line('M0 -36 v-9', 3)}${dot(0, -49, 4, C('butter-d'))}</g>`;
  const carrot = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s || 1})">${shape('M-5 -12 L5 -12 L0 14Z', C('peach-d'), 3)}${line('M0 -12 l-4 -9 M0 -12 l4 -9 M0 -12 v-11', 3, C('sage-d'))}</g>`;
  const leaf = (x, y, s, rot, col) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s || 1})">${shape('M0 -10 Q9 0 0 10 Q-9 0 0 -10Z', col || C('sage'), 2.6)}${line('M0 -8 V8', 2, C('sage-d'))}</g>`;
  const hat = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s || 1})">${shape('M-18 0 Q-16 -22 0 -22 Q16 -22 18 0Z', C('lilac'), 3.4)}${rect(-24, -2, 48, 7, 3, C('lilac-d'), 2, 3.4)}</g>`;
  const rock = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s || 1})">${oval(0, -8, 20, 12, col || C('road'), 3)}</g>`;
  const seaweed = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s || 1})">${amb(line('M0 0 q-10 -14 0 -26 t0 -26 t0 -24', 7, col || C('sage-d')), 'sway', x % 3)}</g>`;
  const wind = (x, y, w) => line(`M${x} ${y} q${w * 0.3} -10 ${w * 0.6} 0 t${w * 0.4} 0`, 4, 'rgba(255,255,255,.9)') + line(`M${x + 8} ${y + 14} q${w * 0.3} -10 ${w * 0.6} 0`, 4, 'rgba(255,255,255,.9)');

  // ---------- Icons ----------
  const ic = (inner, vb) => `<svg viewBox="${vb || '0 0 64 64'}" aria-hidden="true">${inner}</svg>`;
  const icons = {
    home: () => ic(`<path d="M12 30 L32 12 L52 30" fill="none" stroke="${K()}" stroke-width="6" ${S}/><path d="${wrect(18, 28, 28, 24, 6, 2)}" fill="${C('coral')}" stroke="${K()}" stroke-width="5"/><path d="${wrect(28, 38, 9, 14, 4, 1)}" fill="${C('paper')}" stroke="${K()}" stroke-width="3"/>`),
    prev: () => ic(line('M40 12 L20 32 L40 52', 9)),
    next: () => ic(line('M24 12 L44 32 L24 52', 9)),
    replay: () => ic(line('M50 32 A18 18 0 1 1 42 17', 7) + `<path d="M36 6 L46 18 L32 22Z" fill="${K()}" ${st(2)}/>`),
    shelf: () => ic(`<path d="${wrect(10, 12, 14, 36, 4, 1)}" fill="${C('pink')}" stroke="${K()}" stroke-width="4"/><path d="${wrect(26, 20, 12, 28, 4, 2)}" fill="${C('sky')}" stroke="${K()}" stroke-width="4"/><g transform="rotate(14 48 40)"><path d="${wrect(42, 14, 12, 34, 4, 3)}" fill="${C('butter')}" stroke="${K()}" stroke-width="4"/></g>${line('M6 54 H58', 5)}`),
    nextBook: () => ic(`<path d="${wrect(10, 12, 30, 40, 6, 2)}" fill="${C('mint')}" stroke="${K()}" stroke-width="5"/>${line('M18 12 V52', 4)}${line('M44 32 H58 M52 24 L60 32 L52 40', 6)}`),
    // speaker; waves only when `on`
    voice: on => ic(`<path d="M10 24 H20 L32 14 V50 L20 40 H10Z" fill="${C('paper')}" ${st(4.5)}/>` +
      (on ? line('M40 22 q8 10 0 20', 5) + line('M47 14 q15 18 0 36', 5) : line('M42 24 L58 40 M58 24 L42 40', 5, C('ink-soft')))),
    grown: () => `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="${C('cream-2')}"/><circle class="ring" cx="24" cy="24" r="20" fill="none" stroke="${K()}" stroke-width="4" transform="rotate(-90 24 24)"/><circle cx="17" cy="24" r="3" fill="${C('ink-soft')}"/><circle cx="24" cy="24" r="3" fill="${C('ink-soft')}"/><circle cx="31" cy="24" r="3" fill="${C('ink-soft')}"/></svg>`,
    star: () => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 L29.5 17.5 L44 18.5 L33 28 L36.5 42 L24 34.5 L11.5 42 L15 28 L4 18.5 L18.5 17.5Z" fill="${C('butter')}" ${st(3.5)}/></svg>`
  };

  // ---------- Book covers (shelf) ----------
  // inner: svg markup drawn inside the round window, 0..200 x 0..170 space
  function book(cover, dark, windowCol, inner, done) {
    const clip = 'cvr-' + Math.floor(Math.random() * 1e6);
    return `<svg viewBox="0 0 200 240" aria-hidden="true">` +
      `<path d="${wrect(22, 20, 170, 214, 14, 9)}" fill="${C('paper')}" ${st(4)}/>` +
      `<path d="${wrect(10, 8, 170, 214, 16, 3)}" fill="${cover}" ${st(5)}/>` +
      `<path d="${wrect(10, 8, 26, 214, 14, 4)}" fill="${dark}" ${st(5)}/>` +
      `<path d="M22 40 V190" stroke="${K()}" stroke-width="3" stroke-dasharray="2 12" ${S} opacity=".5"/>` +
      `<clipPath id="${clip}"><path d="${blob(110, 90, 58, 56, 5, 0.05, 10)}"/></clipPath>` +
      `<path d="${blob(110, 90, 58, 56, 5, 0.05, 10)}" fill="${windowCol}"/>` +
      `<g clip-path="url(#${clip})">${inner}</g>` +
      `<path d="${blob(110, 90, 58, 56, 5, 0.05, 10)}" fill="none" ${st(4)}/>` +
      `<path d="${wrect(48, 160, 126, 50, 14, 6)}" fill="${C('paper')}" ${st(3.5)}/>` +
      (done ? `<g transform="translate(168 18) rotate(14)">${icons.star().replace('<svg viewBox="0 0 48 48" aria-hidden="true">', '<svg x="-22" y="-22" width="44" height="44" viewBox="0 0 48 48">')}</g>` : '') +
      `</svg>`;
  }

  // Falling confetti for the last page
  function confetti() {
    const rr = rng(21);
    const cols = ['pink', 'butter', 'mint', 'sky', 'lilac', 'coral'];
    let g = '';
    for (let i = 0; i < 16; i++) {
      g += `<g class="confetti" style="--d:${f1(rr() * 3)}s;--x:${f1(rr() * 360 + 20)}px">${spark(0, 0, 6 + rr() * 5, C(cols[i % 6]))}</g>`;
    }
    return g;
  }

  SB.art = {
    rng, smooth, blob, wrect, shape, oval, rect, line, dot, merged, at, tp, amb, face,
    critter, fish, starFace, sky, hill, ground, sun, moon, cloud, spark, stars, tree, bush, flower, flowers,
    mushroom, house, pond, ripples, rain, balloon, bubbles, tapBubble, rainbow, zzz, basket, cake, carrot,
    leaf, hat, rock, seaweed, wind, icons, book, confetti, S
  };
})();
