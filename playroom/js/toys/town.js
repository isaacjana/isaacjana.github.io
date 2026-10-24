/* =========================================================
   Toy 4 - Tiny Town
   A wide hand-drawn street. Drag sideways to explore; tap
   doors, cars, people, animals, clouds, flowers and the
   sun/moon (day <-> night).
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEY = 'town';
  const WW = 3200, WH = 700;   // world size (SVG units)
  const GROUND = 522, WALK = 548, LANE1 = 615, LANE2 = 658;

  let root, el, front, back, skyUi, starsSvg;
  let scale = 1, W = 0, H = 0, scroll = 0, vel = 0, raf = 0, last = 0;
  let night = false;
  let openDoors = {};
  let movers = [];
  const pointers = new Map();
  let dragId = null;
  let saveDeb = null, onResize = null;

  const C = n => PR.color(n);
  const ink = () => C('ink');
  const A = () => PR.art;

  // ---------- Art pieces ----------
  function tree(x, seed, crown) {
    const a = A();
    return `<g data-tap="tree" transform="translate(${x} ${GROUND})"><g class="tree-body">
      <path d="${a.wrect(-12, -110, 24, 112, 8, seed)}" fill="${C('wood-d')}" stroke="${ink()}" stroke-width="4"/>
      <path d="${a.blob(0, -160, 78, 70, seed, 0.1, 9)}" fill="${C(crown || 'sage')}" stroke="${ink()}" stroke-width="4"/>
      <circle cx="-30" cy="-170" r="7" fill="${C('coral')}"/><circle cx="24" cy="-140" r="7" fill="${C('coral')}"/><circle cx="10" cy="-195" r="7" fill="${C('coral')}"/>
    </g><g class="birds">${bird(-40, -222, 'sky')}${bird(36, -214, 'pink')}</g></g>`;
  }

  function bird(x, y, col) {
    return `<g transform="translate(${x} ${y})"><path d="${A().blob(0, 0, 13, 10, 3, 0.05, 7)}" fill="${C(col)}" stroke="${ink()}" stroke-width="3"/>
      <path d="M11 -2 l9 3 l-9 3z" fill="${C('peach-d')}"/><circle cx="5" cy="-3" r="2" fill="${ink()}"/><path d="M-6 0 q4 -9 9 0" fill="none" stroke="${ink()}" stroke-width="2.5"/></g>`;
  }

  function lamp(x) {
    return `<g transform="translate(${x} ${GROUND + 26})" data-tap="lamp">
      <circle class="lamp-glow" cx="0" cy="-200" r="48" fill="${C('butter')}"/>
      <path d="M0 0 V-190" stroke="${ink()}" stroke-width="8" stroke-linecap="round"/>
      <path d="${A().wrect(-16, -214, 32, 26, 10, 4)}" fill="${C('paper')}" class="win" stroke="${ink()}" stroke-width="4"/></g>`;
  }

  function flower(x, y, col, step) {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      petals += `<circle cx="${Math.cos(a) * 9}" cy="${-38 + Math.sin(a) * 9}" r="7.5" fill="${C(col)}" stroke="${ink()}" stroke-width="2.5"/>`;
    }
    return `<g transform="translate(${x} ${y})" data-tap="flower" data-step="${step}"><g class="flower-body">
      <path d="M0 0 V-34" stroke="${C('sage-d')}" stroke-width="5" stroke-linecap="round"/><path d="M0 -14 q10 -8 14 -2 q-6 6 -14 2z" fill="${C('sage')}"/>
      ${petals}<circle cx="0" cy="-38" r="6" fill="${C('butter')}" stroke="${ink()}" stroke-width="2.5"/></g></g>`;
  }

  function cloud(x, y, seed) {
    const a = A();
    let drops = '';
    for (let i = 0; i < 7; i++) drops += `<path d="M${-60 + i * 20} ${40 + (i % 2) * 14} l-4 14" stroke="${C('sky-d')}" stroke-width="5" stroke-linecap="round"/>`;
    return `<g transform="translate(${x} ${y})" data-tap="cloud"><g class="t-rain">${drops}</g><g class="cloud-body">
      <path d="${a.blob(-34, 6, 40, 30, seed, 0.06)}" fill="#fff" stroke="${ink()}" stroke-width="4"/>
      <path d="${a.blob(20, -6, 50, 40, seed + 1, 0.06)}" fill="#fff" stroke="${ink()}" stroke-width="4"/>
      <path d="${a.blob(52, 14, 32, 24, seed + 2, 0.06)}" fill="#fff" stroke="${ink()}" stroke-width="4"/>
      <path d="${a.wrect(-60, 2, 130, 30, 14, seed)}" fill="#fff"/></g></g>`;
  }

  function dog(col) {
    const k = ink();
    return `<g class="t-idle"><path d="M28 -22 q16 -14 12 -26" fill="none" stroke="${k}" stroke-width="5" stroke-linecap="round"/>
      <path d="${A().blob(4, -24, 30, 16, 7, 0.05)}" fill="${C(col)}" stroke="${k}" stroke-width="3.5"/>
      <path d="M-14 -12 v12 M-4 -12 v12 M14 -12 v12 M24 -12 v12" stroke="${k}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="-26" cy="-38" r="15" fill="${C(col)}" stroke="${k}" stroke-width="3.5"/>
      <path d="M-36 -48 q-10 6 -4 22 q8 -4 8 -18z" fill="${C('wood-d')}" stroke="${k}" stroke-width="3"/>
      <circle cx="-30" cy="-41" r="2.2" fill="${k}"/><circle cx="-40" cy="-34" r="3.5" fill="${k}"/>
      <path d="M-34 -28 q4 4 8 0" fill="none" stroke="${k}" stroke-width="2.5" stroke-linecap="round"/></g>`;
  }

  function duck() {
    const k = ink();
    return `<g class="duck-body"><path d="${A().blob(0, -14, 28, 16, 2, 0.05)}" fill="${C('butter')}" stroke="${k}" stroke-width="3.5"/>
      <path d="M8 -20 q10 -4 14 4" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="-20" cy="-34" r="12" fill="${C('butter')}" stroke="${k}" stroke-width="3.5"/>
      <path d="M-31 -34 l-12 3 l11 4z" fill="${C('peach-d')}" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="-23" cy="-37" r="2.2" fill="${k}"/></g>`;
  }

  function car(col, skin, long) {
    const a = A(), k = ink();
    const w = long ? 240 : 160;
    let wins = '';
    const n = long ? 4 : 1;
    for (let i = 0; i < n; i++) {
      const wx = long ? -w / 2 + 22 + i * 52 : -40;
      const ww = long ? 40 : 60;
      wins += `<path d="${a.wrect(wx, -78, ww, 30, 8, i + 2)}" fill="#EAF6FC" stroke="${k}" stroke-width="3.5"/>`;
    }
    const driverX = long ? w / 2 - 50 : 0;
    return `<g class="car-body">
      <path d="${a.wrect(-w / 2, -64, w, 46, 18, 3)}" fill="${C(col)}" stroke="${k}" stroke-width="4"/>
      <path d="${long ? a.wrect(-w / 2 + 6, -96, w - 12, 50, 18, 5) : a.wrect(-52, -96, 104, 50, 22, 5)}" fill="${C(col)}" stroke="${k}" stroke-width="4"/>
      ${wins}
      <circle cx="${driverX + 12}" cy="-62" r="10" fill="${C(skin)}" stroke="${k}" stroke-width="2.5"/>
      <circle cx="${driverX + 15}" cy="-64" r="1.6" fill="${k}"/>
      <circle cx="${w / 2 - 8}" cy="-46" r="6" fill="${C('butter')}" stroke="${k}" stroke-width="3"/>
      <circle cx="${-w / 2 + 34}" cy="-16" r="17" fill="${C('ink')}"/><circle cx="${-w / 2 + 34}" cy="-16" r="7" fill="${C('cream-2')}"/>
      <circle cx="${w / 2 - 34}" cy="-16" r="17" fill="${C('ink')}"/><circle cx="${w / 2 - 34}" cy="-16" r="7" fill="${C('cream-2')}"/></g>`;
  }

  // door with someone (or something) peeking out
  function door(cx, base, w, h, col, id, peek) {
    const a = A(), k = ink();
    return `<g data-tap="door" data-id="${id}">
      <path d="${a.wrect(cx - w / 2, base - h, w, h, 14, 2)}" fill="#7C625B"/>
      <g transform="translate(${cx} ${base}) scale(.62)"><g class="t-peek" data-peek="${id}">${peek}</g></g>
      <g class="t-door" data-door="${id}"><path d="${a.wrect(cx - w / 2, base - h, w, h, 14, 3)}" fill="${C(col)}" stroke="${k}" stroke-width="4"/>
      <circle cx="${cx + w / 2 - 12}" cy="${base - h / 2}" r="5" fill="${C('butter')}" stroke="${k}" stroke-width="2.5"/>
      <path d="${a.wrect(cx - w / 2 + 12, base - h + 12, w - 24, h * 0.3, 10, 4)}" fill="none" stroke="${k}" stroke-width="2.5" opacity=".5"/></g></g>`;
  }

  function window_(x, y, w, h, seed, peekId, peek, off) {
    const a = A(), k = ink();
    const inside = peekId
      ? `<g transform="translate(${x + w / 2} ${y + h + (off == null ? 30 : off)}) scale(.5)"><g class="t-peek" data-peek="${peekId}">${peek}</g></g>`
      : '';
    return `<g ${peekId ? `data-tap="window" data-id="${peekId}"` : ''}>
      <path class="win" d="${a.wrect(x, y, w, h, 8, seed)}" fill="#E6F3FA"/>
      <clipPath id="clip-${peekId || seed}"><path d="${a.wrect(x, y, w, h, 8, seed)}"/></clipPath>
      <g clip-path="url(#clip-${peekId || seed})">${inside}</g>
      <path d="${a.wrect(x, y, w, h, 8, seed)}" fill="none" stroke="${k}" stroke-width="4"/>
      <path d="M${x + w / 2} ${y + 3} V${y + h - 3} M${x + 3} ${y + h / 2} H${x + w - 3}" stroke="${k}" stroke-width="3" opacity=".6"/></g>`;
  }

  function house(x, w, h, wall, roof, doorCol, id, peek, seed) {
    const a = A(), k = ink();
    const top = GROUND - h;
    return `<g>
      <path d="${a.wrect(x, top, w, h + 4, 10, seed)}" fill="${C(wall)}" stroke="${k}" stroke-width="5"/>
      <path d="M${x - 24} ${top + 8} Q${x + w / 2} ${top - h * 0.75} ${x + w + 24} ${top + 8} Z" fill="${C(roof)}" stroke="${k}" stroke-width="5" stroke-linejoin="round"/>
      ${window_(x + 24, top + 40, 64, 56, seed + 1)}
      ${window_(x + w - 88, top + 40, 64, 56, seed + 2)}
      ${door(x + w / 2, GROUND, 70, 112, doorCol, id, peek)}</g>`;
  }

  function people() {
    const P = (x, o, s) => `<g transform="translate(${x} ${WALK}) scale(${s || 1})" data-tap="person">${A().person(o)}</g>`;
    return [
      P(560, { skin: 'skin-1', hair: 'hair-4', style: 'bun', top: 'lilac', bottom: 'sage', cane: true, glasses: true, seed: 5 }),
      P(1060, { skin: 'skin-3', hair: 'hair-1', style: 'curly', top: 'mint', bottom: 'sky', chair: true, seed: 8 }, 0.75),
      P(1645, { skin: 'skin-3', hair: 'hair-1', style: 'curly', top: 'butter', bottom: 'lilac', build: 'round', seed: 11 }),
      P(1700, { skin: 'skin-3', hair: 'hair-2', style: 'puffs', top: 'pink', bottom: 'teal', seed: 12 }, 0.66),
      P(2330, { skin: 'skin-4', hair: 'hair-1', style: 'short', top: 'sky', bottom: 'ink', build: 'slim', glasses: true, seed: 14 }),
      P(2810, { skin: 'skin-5', hair: 'hair-1', style: 'long', top: 'coral', bottom: 'sky', chair: true, seed: 17 }),
      P(3130, { skin: 'skin-2', hair: 'hair-5', style: 'short', top: 'teal', bottom: 'peach', build: 'round', seed: 19 })
    ].join('');
  }

  function buildFront() {
    const a = A(), k = ink();
    let s = '';
    // ground, sidewalk, road
    s += `<rect x="-400" y="440" width="${WW + 800}" height="90" fill="${C('grass')}"/>`;
    s += `<rect class="shade" x="-400" y="440" width="${WW + 800}" height="${WH}" fill="${C('night')}" pointer-events="none"/>`;
    s += `<rect x="-400" y="${GROUND}" width="${WW + 800}" height="44" fill="${C('cream-2')}"/>`;
    s += `<path d="M-400 ${GROUND} H${WW + 400}" stroke="${k}" stroke-width="4"/>`;
    s += `<rect x="-400" y="566" width="${WW + 800}" height="104" fill="${C('road')}" stroke="${k}" stroke-width="4"/>`;
    for (let x = -360; x < WW + 400; x += 120) s += `<rect x="${x}" y="614" width="60" height="8" rx="4" fill="#fff" opacity=".8"/>`;
    s += `<rect x="-400" y="670" width="${WW + 800}" height="60" fill="${C('grass')}"/>`;

    // clouds
    [[300, 120, 1], [1000, 90, 4], [1700, 140, 7], [2450, 100, 10], [3050, 130, 13]].forEach(c => { s += cloud(c[0], c[1], c[2]); });

    // houses and buildings
    s += house(60, 260, 200, 'pink', 'coral', 'butter', 'a',
      a.person({ skin: 'skin-2', hair: 'hair-2', style: 'short', top: 'sky', bottom: 'lilac', chair: true, seed: 2 }), 21);
    s += tree(400, 3);
    // bakery
    s += `<g>
      <g data-tap="chimney"><path d="${a.wrect(880, 228, 34, 70, 6, 8)}" fill="${C('coral')}" stroke="${k}" stroke-width="4"/>
      <g class="smoke"><circle cx="897" cy="210" r="16" fill="#fff" opacity="0"/></g></g>
      <path d="${a.wrect(660, 290, 300, 236, 12, 30)}" fill="${C('peach')}" stroke="${k}" stroke-width="5"/>
      <path d="${a.wrect(650, 272, 320, 30, 12, 31)}" fill="${C('coral')}" stroke="${k}" stroke-width="5"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${666 + i * 42} 360 q21 26 42 0 V330 H${666 + i * 42}Z" fill="${C(i % 2 ? 'paper' : 'pink')}" stroke="${k}" stroke-width="3.5"/>`).join('')}
      <path d="M660 330 H960" stroke="${k}" stroke-width="4"/>
      ${window_(684, 392, 112, 84, 33)}
      <path d="${a.blob(718, 450, 22, 12, 2, 0.08)}" fill="${C('peach-d')}" stroke="${k}" stroke-width="3"/>
      <path d="${a.blob(764, 446, 18, 14, 5, 0.08)}" fill="${C('butter-d')}" stroke="${k}" stroke-width="3"/>
      ${door(880, GROUND, 72, 118, 'mint', 'b', a.person({ skin: 'skin-4', hair: 'paper', style: 'bun', top: 'paper', bottom: 'sky', build: 'round', seed: 4 }))}</g>`;
    s += lamp(1000);
    // swings
    s += `<g><path d="M1110 ${GROUND} L1150 330 L1190 ${GROUND} M1290 ${GROUND} L1330 330 L1370 ${GROUND} M1150 330 H1330" fill="none" stroke="${C('sky-d')}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <g data-tap="swing"><g class="swing" style="transform-origin:1240px 330px">
        <path d="M1215 330 V460 M1265 330 V460" stroke="${k}" stroke-width="3.5"/>
        <path d="${a.wrect(1205, 456, 70, 12, 6, 3)}" fill="${C('coral')}" stroke="${k}" stroke-width="3.5"/>
        <g transform="translate(1240 488) scale(.62)">${a.person({ skin: 'skin-5', hair: 'hair-1', style: 'puffs', top: 'butter', bottom: 'pink', seed: 6 })}</g>
      </g></g></g>`;
    // pond + duck + flowers
    s += `<path d="${a.blob(1470, 500, 110, 26, 6, 0.05, 10)}" fill="${C('sky')}" stroke="${k}" stroke-width="4"/>`;
    s += `<g transform="translate(1450 508)" data-tap="duck">${duck()}</g>`;
    s += flower(1360, GROUND + 4, 'pink', 0) + flower(1585, GROUND + 4, 'lilac', 2) + flower(1610, GROUND + 6, 'butter', 4);
    // apartment
    s += `<g>
      <path d="${a.wrect(1780, 190, 330, 336, 12, 40)}" fill="${C('lilac')}" stroke="${k}" stroke-width="5"/>
      <path d="${a.wrect(1764, 176, 362, 30, 10, 41)}" fill="${C('lilac-d')}" stroke="${k}" stroke-width="5"/>
      ${window_(1810, 230, 72, 66, 42, 'w1', a.person({ skin: 'skin-1', hair: 'hair-3', style: 'long', top: 'mint', seed: 7 }))}
      ${window_(1910, 230, 72, 66, 43, 'w2', dog('peach'), 2)}
      ${window_(2010, 230, 72, 66, 44, 'w3', a.person({ skin: 'skin-4', hair: 'hair-1', style: 'bald', top: 'sky', glasses: true, seed: 9 }))}
      ${window_(1810, 330, 72, 66, 45, 'w4', a.person({ skin: 'skin-3', hair: 'hair-2', style: 'bun', top: 'coral', seed: 10 }))}
      ${window_(2010, 330, 72, 66, 46, 'w5', a.person({ skin: 'skin-5', hair: 'hair-1', style: 'puffs', top: 'butter', seed: 15 }))}
      ${door(1946, GROUND, 74, 114, 'peach', 'c', a.person({ skin: 'skin-2', hair: 'teal', style: 'scarf', top: 'lilac', seed: 3 }))}</g>`;
    s += tree(2200, 9, 'mint');
    s += flower(2120, GROUND + 4, 'coral', 1) + flower(2280, GROUND + 4, 'sky', 3);
    // house B (dog peeks out)
    s += house(2420, 270, 190, 'mint', 'sky', 'pink', 'd', dog('butter'), 50);
    s += lamp(2740);
    // cafe
    s += `<g>
      <path d="${a.wrect(2900, 300, 260, 226, 12, 60)}" fill="${C('butter')}" stroke="${k}" stroke-width="5"/>
      <path d="M2884 310 Q3030 220 3176 310Z" fill="${C('peach-d')}" stroke="${k}" stroke-width="5" stroke-linejoin="round"/>
      ${window_(2920, 350, 90, 74, 61)}
      <circle cx="3100" cy="352" r="22" fill="${C('paper')}" stroke="${k}" stroke-width="4"/><path d="M3090 352 h16 v8 a8 8 0 0 1 -16 0z M3106 354 q8 0 4 8" fill="${C('coral')}" stroke="${k}" stroke-width="2.5"/>
      ${door(3060, GROUND, 70, 110, 'sky', 'e', a.person({ skin: 'skin-2', hair: 'hair-4', style: 'bald', top: 'coral', glasses: true, build: 'round', seed: 13 }))}</g>`;

    s += people();
    s += `<g class="movers"></g>`;
    return `<svg class="town-layer" viewBox="0 0 ${WW} ${WH}" preserveAspectRatio="xMinYMin meet">${s}</svg>`;
  }

  function buildBack() {
    const a = A(), k = ink();
    let s = '';
    const r = a.rng(77);
    for (let i = 0; i < 11; i++) {
      const x = i * 330 + r() * 80;
      s += `<path d="${a.blob(x, 470, 230 + r() * 80, 120 + r() * 60, i + 3, 0.04, 10)}" fill="${C(i % 2 ? 'sage' : 'grass')}" stroke="${k}" stroke-width="4" opacity=".75"/>`;
    }
    for (let i = 0; i < 16; i++) {
      const x = r() * WW, y = 390 + r() * 40;
      s += `<path d="M${x} ${y} v26" stroke="${C('wood-d')}" stroke-width="6" opacity=".7"/><path d="${a.blob(x, y - 10, 20, 24, i, 0.1)}" fill="${C('sage-d')}" opacity=".6"/>`;
    }
    s += `<rect class="shade" x="-400" y="300" width="${WW + 800}" height="400" fill="${C('night')}"/>`;
    return `<svg class="town-layer" viewBox="0 0 ${WW} ${WH}" preserveAspectRatio="xMinYMin meet">${s}</svg>`;
  }

  function buildSky() {
    const k = ink();
    let rays = '';
    for (let i = 0; i < 10; i++) {
      const ang = i * 36;
      rays += `<path d="M100 26 V8" transform="rotate(${ang} 100 100)" stroke="${C('butter-d')}" stroke-width="8" stroke-linecap="round"/>`;
    }
    return `<svg class="sky-ui" viewBox="0 0 200 200">
      <g class="sun" data-tap="sun"><circle cx="100" cy="100" r="96" fill="transparent"/><g class="sun-rays">${rays}</g>
        <circle cx="100" cy="100" r="56" fill="${C('butter')}" stroke="${k}" stroke-width="5"/>${A().faceSvg(100, 102, 26)}</g>
      <g class="moon" data-tap="moon"><circle cx="100" cy="100" r="96" fill="transparent"/>
        <path d="M118 44 A58 58 0 1 0 150 140 A46 46 0 1 1 118 44Z" fill="${C('paper')}" stroke="${k}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M74 98 q6 6 12 0 M98 112 q6 6 12 0" fill="none" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
        <path d="M80 126 q10 8 20 0" fill="none" stroke="${k}" stroke-width="4" stroke-linecap="round"/></g></svg>`;
  }

  function buildStars() {
    const r = A().rng(5);
    let s = '';
    for (let i = 0; i < 40; i++) {
      const x = r() * 1600, y = r() * 380, sz = 3 + r() * 5;
      s += `<path d="M${x} ${y - sz} Q${x} ${y} ${x + sz} ${y} Q${x} ${y} ${x} ${y + sz} Q${x} ${y} ${x - sz} ${y} Q${x} ${y} ${x} ${y - sz}Z" fill="${C('butter')}"/>`;
    }
    return `<svg class="stars" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMin slice" style="width:100%;height:100%;pointer-events:none">${s}</svg>`;
  }

  // ---------- Moving things ----------
  function addMover(markup, x, y, speed, tap) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-tap', tap);
    g.innerHTML = markup;
    front.querySelector('.movers').appendChild(g);
    const m = { g, x, y, speed, base: speed, boost: 0, wrap: tap === 'car', min: 200, max: WW - 200 };
    movers.push(m);
    g._mover = m;
    return m;
  }

  function buildMovers() {
    movers = [];
    addMover(car('coral', 'skin-4'), 200, LANE1, 80, 'car');
    addMover(car('butter', 'skin-1', true), 1500, LANE1, 55, 'car');
    addMover(car('sky', 'skin-5'), 2400, LANE2, -70, 'car');
    addMover(car('mint', 'skin-2'), 900, LANE2, -95, 'car');
    const walker = addMover(A().person({ skin: 'skin-4', hair: 'hair-1', style: 'puffs', top: 'peach', bottom: 'sky', seed: 23 }), 1250, WALK + 6, 24, 'person');
    const pup = addMover(dog('wood'), 1180, WALK + 8, 24, 'dog');
    walker.min = pup.min = 700; walker.max = pup.max = 2800;
    pup.follow = walker;
  }

  function moveAll(dt) {
    movers.forEach(m => {
      if (m.follow) {
        const dir = Math.sign(m.follow.speed) || 1;
        m.x += ((m.follow.x - dir * 70) - m.x) * Math.min(1, dt * 2);
        m.speed = m.follow.speed;
      } else {
        const boost = m.boost > 0 ? 2.5 : 1;
        m.boost -= dt;
        m.x += m.speed * boost * dt * (PR.reduced ? 0.5 : 1);
        if (m.wrap) {
          if (m.x > WW + 260) m.x = -260;
          if (m.x < -260) m.x = WW + 260;
        } else if (m.x > m.max || m.x < m.min) {
          m.speed = -m.speed;
          m.x = PR.util.clamp(m.x, m.min, m.max);
        }
      }
      const dir = m.speed >= 0 ? 1 : -1;
      const bob = m.wrap ? 0 : Math.abs(Math.sin(performance.now() / 180 + m.x)) * -3;
      m.g.setAttribute('transform', `translate(${m.x.toFixed(1)} ${(m.y + bob).toFixed(1)}) scale(${dir} 1)`);
    });
  }

  // ---------- Scroll ----------
  function maxScroll() { return Math.max(0, WW * scale - W); }
  function applyScroll() {
    front.style.transform = `translate3d(${-scroll}px,0,0)`;
    back.style.transform = `translate3d(${-scroll * 0.6}px,0,0)`;
  }

  function resize() {
    W = el.clientWidth; H = el.clientHeight;
    scale = H / WH;
    front.style.width = back.style.width = (WW * scale) + 'px';
    scroll = PR.util.clamp(scroll, 0, maxScroll());
    applyScroll();
  }

  // ---------- Taps ----------
  function animate(node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls);
    void node.getBoundingClientRect();
    node.classList.add(cls);
    clearTimeout(node['_t' + cls]);
    node['_t' + cls] = setTimeout(() => node.classList.remove(cls), ms || 900);
  }

  function setNight(n, sound) {
    night = n;
    el.classList.toggle('night', night);
    if (sound) {
      if (night) { PR.audio.note(4, { dur: 0.8 }); setTimeout(() => PR.audio.note(2, { dur: 0.8 }), 180); setTimeout(() => PR.audio.note(0, { dur: 1.2 }), 360); }
      else { PR.audio.sparkle(); setTimeout(() => PR.audio.tweet(), 400); }
    }
  }

  function setDoor(id, open) {
    openDoors[id] = open;
    const d = el.querySelector(`[data-door="${id}"]`);
    const p = el.querySelector(`[data-peek="${id}"]`);
    if (d) d.classList.toggle('open', open);
    if (p) p.classList.toggle('show', open);
  }

  function tap(target, x, y) {
    const t = target && target.closest ? target.closest('[data-tap]') : null;
    const kind = t ? t.getAttribute('data-tap') : null;
    switch (kind) {
      case 'sun': setNight(true, true); break;
      case 'moon': setNight(false, true); break;
      case 'door': {
        const id = t.getAttribute('data-id');
        const open = !openDoors[id];
        setDoor(id, open);
        PR.audio.creak(open);
        if (open) {
          PR.audio.knock(1.4);
          setTimeout(() => { PR.audio.chime(3); animate(el.querySelector(`[data-peek="${id}"]`), 't-wave', 1500); }, 350);
        }
        saveDeb();
        break;
      }
      case 'window': {
        const id = t.getAttribute('data-id');
        const p = el.querySelector(`[data-peek="${id}"]`);
        const show = !p.classList.contains('show');
        p.classList.toggle('show', show);
        if (show) { PR.audio.pop(1.3); setTimeout(() => animate(p, 't-wave', 1500), 300); } else PR.audio.down();
        break;
      }
      case 'person':
        animate(t.firstElementChild, 't-hop', 650);
        animate(t, 't-wave', 1400);
        PR.audio.boop(3 + Math.floor(Math.random() * 4));
        break;
      case 'dog':
        animate(t.firstElementChild, 't-hop', 650);
        PR.audio.tone(520, { type: 'triangle', dur: 0.09, vol: 0.12, slide: 380, filter: 1500 });
        setTimeout(() => PR.audio.tone(560, { type: 'triangle', dur: 0.09, vol: 0.12, slide: 400, filter: 1500 }), 150);
        break;
      case 'car':
        animate(t.querySelector('.car-body'), 't-hop', 650);
        if (t._mover) t._mover.boost = 1.5;
        PR.audio.honk();
        break;
      case 'tree':
        animate(t.querySelector('.tree-body'), 't-shake', 650);
        animate(t.querySelector('.birds'), 't-fly', 1900);
        PR.audio.noise({ dur: 0.5, freq: 2200, vol: 0.05 });
        PR.audio.tweet();
        break;
      case 'duck':
        animate(t.querySelector('.duck-body'), 't-quack', 850);
        PR.audio.quack();
        break;
      case 'cloud':
        animate(t.querySelector('.cloud-body'), 't-puff', 750);
        animate(t.querySelector('.t-rain'), 'on', 1700);
        PR.audio.rain();
        break;
      case 'flower':
        animate(t.querySelector('.flower-body'), 't-bloom', 750);
        PR.audio.chime(+t.getAttribute('data-step') || 0);
        break;
      case 'chimney':
        animate(t.querySelector('.smoke circle'), 't-smoke', 1250);
        PR.audio.whoosh();
        break;
      case 'swing':
        animate(t.querySelector('.swing'), 't-swing', 2500);
        PR.audio.tone(330, { type: 'sine', dur: 0.6, vol: 0.1, slide: 440 });
        setTimeout(() => PR.audio.tone(440, { type: 'sine', dur: 0.6, vol: 0.1, slide: 330 }), 700);
        break;
      case 'lamp':
        animate(t, 't-shake', 650);
        PR.audio.tone(880, { type: 'sine', dur: 0.5, vol: 0.08 });
        break;
      default: {
        const r = root.getBoundingClientRect();
        PR.fx.ripple(root, x - r.left, y - r.top, PR.color('paper'));
        PR.audio.tap(0.8 + Math.random() * 0.3);
      }
    }
  }

  // ---------- Pointer ----------
  function onDown(e) {
    e.preventDefault();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target, moved: false, s0: scroll });
    if (dragId == null) { dragId = e.pointerId; vel = 0; }
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
  function onMove(e) {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    if (Math.abs(dx) > 12 || Math.abs(e.clientY - p.y) > 12) {
      if (!p.moved && e.pointerId === dragId) PR.audio.noise({ dur: 0.25, freq: 500, vol: 0.03 });
      p.moved = true;
    }
    if (e.pointerId === dragId) {
      const max = maxScroll();
      let s = p.s0 - dx;
      if (s < 0) s = s * 0.35; else if (s > max) s = max + (s - max) * 0.35;  // rubber band
      vel = (s - scroll) / Math.max(1, e.timeStamp - (p.lt || p.t)) * 16;
      p.lt = e.timeStamp;
      scroll = s;
      applyScroll();
    }
  }
  function onUp(e) {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    pointers.delete(e.pointerId);
    if (e.pointerId === dragId) dragId = null;
    if (!p.moved && performance.now() - p.t < 700) tap(p.target, e.clientX, e.clientY);
    saveDeb();
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    moveAll(dt);
    if (dragId == null) {
      const max = maxScroll();
      if (Math.abs(vel) > 0.1) { scroll += vel; vel *= 0.93; }
      if (scroll < 0) { scroll += (0 - scroll) * 0.2; vel = 0; }
      else if (scroll > max) { scroll += (max - scroll) * 0.2; vel = 0; }
      applyScroll();
    }
  }

  // ---------- State ----------
  function save() {
    if (!el) return;
    PR.store.set(KEY, { night, doors: openDoors, scroll: maxScroll() ? scroll / maxScroll() : 0 });
  }

  PR.toys.town = {
    init(container) {
      root = container;
      el = document.createElement('div');
      el.className = 'town';
      el.innerHTML = buildStars() + buildBack() + buildFront() + buildSky();
      root.appendChild(el);
      const layers = el.querySelectorAll('.town-layer');
      back = layers[0]; front = layers[1];
      skyUi = el.querySelector('.sky-ui');
      buildMovers();

      const st = PR.store.get(KEY, null) || {};
      openDoors = {};
      setNight(!!st.night, false);
      if (st.doors && typeof st.doors === 'object') Object.keys(st.doors).forEach(id => { if (st.doors[id]) setDoor(id, true); });
      resize();
      scroll = PR.util.clamp((+st.scroll || 0) * maxScroll(), 0, maxScroll());
      applyScroll();
      moveAll(0);

      saveDeb = PR.util.debounce(save, 1000);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      onResize = () => resize();
      window.addEventListener('resize', onResize);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    save,
    destroy() {
      cancelAnimationFrame(raf);
      if (saveDeb) saveDeb.cancel();
      save();
      window.removeEventListener('resize', onResize);
      pointers.clear();
      dragId = null;
      movers = [];
      if (el) el.remove();
      root = el = front = back = skyUi = null;
    }
  };
})();
