/* =========================================================
   Playroom - assets/art.js
   All illustrations are inline SVG generated here: wobbly
   hand-drawn shapes, diverse characters and the toy tiles.
   No external images.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};

  // ---------- Palette (reads CSS variables) ----------
  const cache = {};
  PR.color = function (name) {
    if (cache[name]) return cache[name];
    let v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim(); } catch (e) { /* ignore */ }
    return (cache[name] = v || '#ccc');
  };
  const C = PR.color;

  // ---------- Hand-drawn helpers ----------
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  // Smooth closed Catmull-Rom path through points
  function smooth(pts) {
    const n = pts.length;
    const f = v => Math.round(v * 10) / 10;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + 'Z';
  }

  // Wobbly ellipse-ish blob
  function blob(cx, cy, rx, ry, seed, wob, n) {
    const r = rng(seed || 1);
    n = n || 9;
    wob = wob == null ? 0.07 : wob;
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

  const S = 'stroke-linecap="round" stroke-linejoin="round"';
  const ink = () => C('ink');

  // ---------- Characters ----------
  /**
   * opts: skin, hair, style ('short'|'long'|'bun'|'curly'|'bald'|'scarf'|'puffs'),
   *       top, bottom, build ('avg'|'round'|'slim'), chair, cane, glasses, seed
   * Returns an SVG <g> string with feet at (0,0), ~110 units tall.
   */
  function person(o) {
    o = Object.assign({ skin: 'skin-2', hair: 'hair-1', style: 'short', top: 'coral', bottom: 'sky', build: 'avg', seed: 3 }, o);
    const skin = C(o.skin), hair = C(o.hair), top = C(o.top), bottom = C(o.bottom), k = ink();
    const bw = o.build === 'round' ? 42 : o.build === 'slim' ? 26 : 32;
    const seated = !!o.chair;
    const hy = seated ? -104 : -92;           // head centre y
    const ty = seated ? -90 : -78;            // torso top
    const th = seated ? 44 : 48;              // torso height
    let g = '';

    if (seated) {
      // wheelchair (back wheel drawn behind)
      g += `<g ${S} stroke="${k}" stroke-width="4" fill="none">
        <circle cx="-4" cy="-24" r="23" fill="${C('paper')}"/>
        <path d="M-4 -47 V-1 M-27 -24 H19 M-20 -40 L12 -8 M-20 -8 L12 -40" stroke-width="2.5" opacity=".6"/>
        <circle cx="-4" cy="-24" r="5" fill="${k}"/>
        <path d="M-18 -48 H22 M-18 -48 V-86 M20 -48 L26 -10 M18 -6 h12"/>
        <circle cx="26" cy="-6" r="6" fill="${C('paper')}"/>
      </g>`;
      // legs: thigh + shin
      g += `<path d="M-6 -52 H22 V-14" fill="none" stroke="${bottom}" stroke-width="13" ${S}/>`;
      g += `<ellipse cx="26" cy="-11" rx="8" ry="4.5" fill="${k}"/>`;
    } else {
      // legs
      g += `<path d="${wrect(-11, -38, 9, 36, 4, o.seed)}" fill="${bottom}" stroke="${k}" stroke-width="2.5"/>`;
      g += `<path d="${wrect(2, -38, 9, 36, 4, o.seed + 1)}" fill="${bottom}" stroke="${k}" stroke-width="2.5"/>`;
      g += `<ellipse cx="-8" cy="-2" rx="8" ry="4.5" fill="${k}"/><ellipse cx="8" cy="-2" rx="8" ry="4.5" fill="${k}"/>`;
    }

    // long hair sits behind body
    if (o.style === 'long') g += `<path d="${wrect(-17, hy - 12, 34, 40, 14, o.seed + 9)}" fill="${hair}"/>`;
    if (o.style === 'scarf') g += `<path d="${blob(0, hy + 6, 21, 25, o.seed + 4, 0.04)}" fill="${hair}" stroke="${k}" stroke-width="2.5"/>`;

    // left arm (static)
    const sx = bw / 2 - 3;
    g += `<path d="M${-sx} ${ty + 8} Q${-sx - 8} ${ty + 24} ${-sx - 5} ${ty + 36}" fill="none" stroke="${top}" stroke-width="10" ${S}/>`;
    g += `<circle cx="${-sx - 5}" cy="${ty + 38}" r="5" fill="${skin}" stroke="${k}" stroke-width="2"/>`;
    // torso
    g += `<path d="${wrect(-bw / 2, ty, bw, th, o.build === 'round' ? 20 : 13, o.seed + 2)}" fill="${top}" stroke="${k}" stroke-width="2.5"/>`;
    // right arm (waves)
    g += `<g class="arm-r"><path d="M${sx} ${ty + 8} Q${sx + 8} ${ty + 24} ${sx + 5} ${ty + 36}" fill="none" stroke="${top}" stroke-width="10" ${S}/>`;
    g += `<circle cx="${sx + 5}" cy="${ty + 38}" r="5" fill="${skin}" stroke="${k}" stroke-width="2"/></g>`;
    if (o.cane) g += `<path d="M${sx + 6} ${ty + 36} L${sx + 12} 0 M${sx + 6} ${ty + 36} q-6 -6 -10 0" fill="none" stroke="${C('wood-d')}" stroke-width="4" ${S}/>`;

    // head
    g += `<circle cx="0" cy="${hy}" r="15" fill="${skin}" stroke="${k}" stroke-width="2.5"/>`;
    // hair
    switch (o.style) {
      case 'short':
      case 'long':
        g += `<path d="M-15 ${hy - 1} Q-15 ${hy - 18} 0 ${hy - 17} Q15 ${hy - 18} 15 ${hy - 1} Q8 ${hy - 10} -2 ${hy - 9} Q-10 ${hy - 9} -15 ${hy - 1}Z" fill="${hair}" stroke="${k}" stroke-width="2"/>`;
        break;
      case 'bun':
        g += `<circle cx="0" cy="${hy - 19}" r="8" fill="${hair}" stroke="${k}" stroke-width="2"/>`;
        g += `<path d="M-15 ${hy - 1} Q-15 ${hy - 17} 0 ${hy - 16} Q15 ${hy - 17} 15 ${hy - 1} Q0 ${hy - 12} -15 ${hy - 1}Z" fill="${hair}" stroke="${k}" stroke-width="2"/>`;
        break;
      case 'curly':
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          g += `<circle cx="${Math.cos(a) * 14}" cy="${hy + Math.sin(a) * 13 - 2}" r="7" fill="${hair}"/>`;
        }
        break;
      case 'puffs':
        g += `<circle cx="-15" cy="${hy - 12}" r="8" fill="${hair}" stroke="${k}" stroke-width="2"/><circle cx="15" cy="${hy - 12}" r="8" fill="${hair}" stroke="${k}" stroke-width="2"/>`;
        g += `<path d="M-14 ${hy - 3} Q0 ${hy - 22} 14 ${hy - 3} Q0 ${hy - 11} -14 ${hy - 3}Z" fill="${hair}"/>`;
        break;
      case 'bald':
        g += `<path d="M-15 ${hy + 1} q2 -7 5 -9 M15 ${hy + 1} q-2 -7 -5 -9" stroke="${hair}" stroke-width="5" fill="none" ${S}/>`;
        break;
      case 'scarf':
        g += `<path d="M-15 ${hy + 2} Q-16 ${hy - 19} 0 ${hy - 19} Q16 ${hy - 19} 15 ${hy + 2}" fill="none" stroke="${hair}" stroke-width="6" ${S}/>`;
        break;
    }
    // face
    g += `<circle cx="-5" cy="${hy}" r="1.9" fill="${k}"/><circle cx="5" cy="${hy}" r="1.9" fill="${k}"/>`;
    g += `<path d="M-5 ${hy + 6} Q0 ${hy + 10} 5 ${hy + 6}" fill="none" stroke="${k}" stroke-width="2" ${S}/>`;
    g += `<circle cx="-9" cy="${hy + 5}" r="2.6" fill="${C('pink')}" opacity=".8"/><circle cx="9" cy="${hy + 5}" r="2.6" fill="${C('pink')}" opacity=".8"/>`;
    if (o.glasses) g += `<g fill="none" stroke="${k}" stroke-width="1.8"><circle cx="-5" cy="${hy}" r="4.5"/><circle cx="5" cy="${hy}" r="4.5"/><path d="M-0.5 ${hy} h1"/></g>`;
    return `<g class="t-idle">${g}</g>`;
  }

  // Simple smiley face for SVG (blocks, blobs, tiles)
  function faceSvg(cx, cy, s, mood) {
    const k = ink();
    let eyes = `<circle cx="${cx - s * 0.35}" cy="${cy - s * 0.1}" r="${s * 0.11}" fill="${k}"/><circle cx="${cx + s * 0.35}" cy="${cy - s * 0.1}" r="${s * 0.11}" fill="${k}"/>`;
    if (mood === 'sleepy') eyes = `<path d="M${cx - s * 0.5} ${cy - s * 0.1} q${s * 0.15} ${s * 0.12} ${s * 0.3} 0 M${cx + s * 0.2} ${cy - s * 0.1} q${s * 0.15} ${s * 0.12} ${s * 0.3} 0" stroke="${k}" stroke-width="${s * 0.09}" fill="none" ${S}/>`;
    const mouth = mood === 'wow'
      ? `<ellipse cx="${cx}" cy="${cy + s * 0.28}" rx="${s * 0.13}" ry="${s * 0.17}" fill="${k}"/>`
      : `<path d="M${cx - s * 0.25} ${cy + s * 0.2} Q${cx} ${cy + s * 0.45} ${cx + s * 0.25} ${cy + s * 0.2}" stroke="${k}" stroke-width="${s * 0.09}" fill="none" ${S}/>`;
    const cheeks = `<circle cx="${cx - s * 0.55}" cy="${cy + s * 0.18}" r="${s * 0.12}" fill="${C('pink-d')}" opacity=".45"/><circle cx="${cx + s * 0.55}" cy="${cy + s * 0.18}" r="${s * 0.12}" fill="${C('pink-d')}" opacity=".45"/>`;
    return eyes + mouth + cheeks;
  }

  // ---------- Toy tile illustrations (viewBox 0 0 200 200) ----------
  function tile(bg, seed, inner) {
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="${blob(100, 100, 92, 88, seed, 0.06, 10)}" fill="${C(bg)}" stroke="${ink()}" stroke-width="5"/>${inner}</svg>`;
  }
  const st = () => `stroke="${ink()}" stroke-width="5" ${S}`;

  const tiles = {
    blocks: () => tile('pink', 11,
      `<path d="${wrect(38, 118, 124, 46, 12, 5)}" fill="${C('butter')}" ${st()}/>${faceSvg(100, 140, 16)}
       <g transform="rotate(-6 96 96)"><path d="${wrect(70, 70, 54, 50, 12, 7)}" fill="${C('mint')}" ${st()}/>${faceSvg(97, 95, 13, 'wow')}</g>
       <path d="M100 26 L134 70 Q100 76 66 70 Z" fill="${C('sky')}" ${st()}/>${faceSvg(100, 58, 8, 'sleepy')}`),
    doodle: () => tile('lilac', 12,
      `<g transform="rotate(-7 100 100)"><path d="${wrect(38, 44, 124, 112, 12, 3)}" fill="${C('paper')}" ${st()}/>
       <path d="M58 120 q14 -40 30 -6 t30 -10 t24 -14" fill="none" stroke="${C('coral-d')}" stroke-width="9" ${S}/>
       <path d="M60 80 q20 -18 34 4" fill="none" stroke="${C('sky-d')}" stroke-width="9" ${S}/>
       <circle cx="132" cy="74" r="12" fill="${C('butter-d')}"/></g>
       <g transform="rotate(38 150 140)"><path d="${wrect(140, 96, 22, 74, 6, 4)}" fill="${C('peach-d')}" ${st()}/><path d="M140 170 L151 190 L162 170Z" fill="${C('peach')}" ${st()}/></g>`),
    blobs: () => tile('mint', 13,
      `<path d="M30 140 Q100 116 170 140" fill="none" stroke="${C('mint-d')}" stroke-width="6" ${S}/>
       <path d="${blob(62, 104, 26, 24, 4, 0.08)}" fill="${C('pink')}" ${st()}/>${faceSvg(62, 104, 12)}
       <path d="${blob(102, 74, 24, 22, 8, 0.08)}" fill="${C('butter')}" ${st()}/>${faceSvg(102, 74, 11, 'wow')}
       <path d="${blob(142, 104, 26, 24, 2, 0.08)}" fill="${C('sky')}" ${st()}/>${faceSvg(142, 104, 12)}
       <circle cx="58" cy="52" r="7" fill="${ink()}"/><path d="M65 52 V28 l12 4" fill="none" ${st()}/>
       <circle cx="150" cy="46" r="7" fill="${ink()}"/><path d="M157 46 V22 l12 4" fill="none" ${st()}/>`),
    town: () => tile('sky', 14,
      `<circle cx="146" cy="58" r="20" fill="${C('butter')}" ${st()}/>
       <path d="M18 150 Q100 120 182 150 L170 170 Q100 196 30 170Z" fill="${C('grass')}" ${st()}/>
       <path d="${wrect(52, 92, 74, 64, 8, 9)}" fill="${C('peach')}" ${st()}/>
       <path d="M44 96 L89 56 L134 96Z" fill="${C('coral')}" ${st()}/>
       <path d="${wrect(78, 118, 22, 38, 8, 2)}" fill="${C('lilac')}" ${st()}/>
       <path d="${wrect(104, 106, 16, 16, 4, 3)}" fill="${C('butter')}" ${st()}/>
       <path d="${blob(152, 116, 18, 20, 5, 0.1)}" fill="${C('sage')}" ${st()}/><path d="M152 136 V156" ${st()}/>`),
    busy: () => tile('peach', 15,
      `<path d="${wrect(34, 46, 132, 108, 16, 6)}" fill="${C('wood')}" ${st()}/>
       <circle cx="72" cy="80" r="15" fill="${C('butter')}" ${st()}/>
       <path d="${wrect(60, 104, 24, 36, 7, 3)}" fill="${C('paper')}" ${st()}/><path d="${wrect(65, 106, 14, 16, 5, 4)}" fill="${C('coral')}" ${st()}/>
       <circle cx="128" cy="84" r="20" fill="${C('sky')}" ${st()}/><path d="M128 84 L128 68" ${st()}/>
       <circle cx="128" cy="130" r="13" fill="${C('pink')}" ${st()}/>`),
    marbles: () => tile('teal', 16,
      `<path d="${wrect(30, 62, 96, 14, 7, 2)}" transform="rotate(14 78 69)" fill="${C('wood')}" ${st()}/>
       <path d="${wrect(76, 112, 96, 14, 7, 3)}" transform="rotate(-14 124 119)" fill="${C('wood')}" ${st()}/>
       <circle cx="50" cy="46" r="13" fill="${C('coral')}" ${st()}/>
       <circle cx="150" cy="96" r="11" fill="${C('butter')}" ${st()}/>
       <circle cx="80" cy="160" r="13" fill="${C('lilac')}" ${st()}/>
       <path d="M150 138 q-14 0 -14 20 h28 q0 -20 -14 -20Z" fill="${C('butter-d')}" ${st()}/>`)
  };

  // ---------- Small icons ----------
  const icons = {
    home: () => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 30 L32 12 L52 30" fill="none" stroke="${ink()}" stroke-width="6" ${S}/><path d="${wrect(18, 28, 28, 24, 6, 2)}" fill="${C('coral')}" stroke="${ink()}" stroke-width="5"/><path d="${wrect(28, 38, 9, 14, 4, 1)}" fill="${C('paper')}" stroke="${ink()}" stroke-width="3"/></svg>`,
    grown: () => `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="${C('cream-2')}"/><circle class="ring" cx="24" cy="24" r="20" fill="none" stroke="${C('ink')}" stroke-width="4" transform="rotate(-90 24 24)"/><circle cx="17" cy="24" r="3" fill="${C('ink-soft')}"/><circle cx="24" cy="24" r="3" fill="${C('ink-soft')}"/><circle cx="31" cy="24" r="3" fill="${C('ink-soft')}"/></svg>`
  };

  // ---------- Floor decoration ----------
  function floor(w, h) {
    const r = rng(42);
    let g = `<path d="${blob(w * 0.5, h * 0.56, w * 0.42, h * 0.36, 7, 0.05, 12)}" fill="${C('cream-2')}"/>`;
    g += `<path d="${blob(w * 0.5, h * 0.56, w * 0.36, h * 0.29, 3, 0.05, 12)}" fill="none" stroke="${C('peach')}" stroke-width="6" stroke-dasharray="2 16" stroke-linecap="round" opacity=".7"/>`;
    const cols = ['pink', 'mint', 'sky', 'butter', 'lilac'];
    for (let i = 0; i < 26; i++) {
      g += `<circle cx="${r() * w}" cy="${r() * h}" r="${3 + r() * 5}" fill="${C(cols[i % 5])}" opacity=".5"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${g}</svg>`;
  }

  PR.art = { rng, smooth, blob, wrect, person, faceSvg, tiles, icons, floor, S };
})();
