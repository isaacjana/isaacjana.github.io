/* =========================================================
   Toy 9 - Animal Friends (for babies)
   Six big friendly faces. Tap one: it bounces and makes
   its sound. No wrong answers.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const cleanups = [];
  let wrap;

  const C = n => PR.color(n);
  const K = () => C('ink');
  const sk = (w) => `stroke="${K()}" stroke-width="${w || 5}" stroke-linecap="round" stroke-linejoin="round"`;
  const eyes = (y, dx) => `<circle cx="${100 - dx}" cy="${y}" r="7" fill="${K()}"/><circle cx="${100 + dx}" cy="${y}" r="7" fill="${K()}"/>
    <circle cx="${100 - dx + 2}" cy="${y - 2}" r="2.2" fill="#fff"/><circle cx="${100 + dx + 2}" cy="${y - 2}" r="2.2" fill="#fff"/>`;
  const cheeks = (y, dx) => `<circle cx="${100 - dx}" cy="${y}" r="9" fill="${C('pink')}" opacity=".7"/><circle cx="${100 + dx}" cy="${y}" r="9" fill="${C('pink')}" opacity=".7"/>`;
  const smile = y => `<path d="M88 ${y} Q100 ${y + 12} 112 ${y}" fill="none" ${sk(4)}/>`;

  const ANIMALS = [
    { id: 'cow', bg: 'sky', sound: 'moo', art: () => `
      <path d="M52 62 L30 40 M148 62 L170 40" ${sk(7)} fill="none"/>
      <ellipse cx="38" cy="82" rx="22" ry="13" fill="${C('paper')}" ${sk()} transform="rotate(-20 38 82)"/>
      <ellipse cx="162" cy="82" rx="22" ry="13" fill="${C('paper')}" ${sk()} transform="rotate(20 162 82)"/>
      <ellipse cx="100" cy="102" rx="64" ry="62" fill="${C('paper')}" ${sk()}/>
      <path d="M52 70 q14 -16 30 -6 q-2 22 -22 26 q-12 -6 -8 -20Z" fill="${C('hair-1')}"/>
      <ellipse cx="100" cy="136" rx="40" ry="26" fill="${C('pink')}" ${sk()}/>
      <circle cx="86" cy="136" r="4.5" fill="${K()}"/><circle cx="114" cy="136" r="4.5" fill="${K()}"/>
      ${eyes(98, 26)}` },
    { id: 'pig', bg: 'pink', sound: 'oink', art: () => `
      <path d="M48 62 L36 24 L76 46Z M152 62 L164 24 L124 46Z" fill="${C('pink-d')}" ${sk()}/>
      <circle cx="100" cy="106" r="64" fill="${C('pink')}" ${sk()}/>
      <ellipse cx="100" cy="124" rx="30" ry="22" fill="${C('pink-d')}" ${sk()}/>
      <ellipse cx="90" cy="124" rx="4.5" ry="7" fill="${K()}"/><ellipse cx="110" cy="124" rx="4.5" ry="7" fill="${K()}"/>
      ${eyes(90, 28)}${cheeks(108, 46)}` },
    { id: 'duck', bg: 'butter', sound: 'quack', art: () => `
      <path d="M96 40 q-4 -22 14 -22" fill="none" ${sk(6)}/>
      <circle cx="100" cy="104" r="66" fill="${C('butter')}" ${sk()}/>
      <path d="M62 124 Q100 100 138 124 Q130 152 100 150 Q70 152 62 124Z" fill="${C('peach-d')}" ${sk()}/>
      <path d="M70 126 Q100 134 130 126" fill="none" ${sk(3)}/>
      ${eyes(90, 28)}${cheeks(112, 50)}` },
    { id: 'cat', bg: 'lilac', sound: 'meow', art: () => `
      <path d="M40 80 L44 22 L88 50Z M160 80 L156 22 L112 50Z" fill="${C('peach')}" ${sk()}/>
      <path d="M50 66 L52 38 L72 52Z M150 66 L148 38 L128 52Z" fill="${C('pink')}"/>
      <ellipse cx="100" cy="108" rx="66" ry="58" fill="${C('peach')}" ${sk()}/>
      ${eyes(98, 28)}
      <path d="M94 114 L106 114 L100 122Z" fill="${C('pink-d')}" ${sk(3)}/>
      <path d="M100 122 q-8 12 -16 4 M100 122 q8 12 16 4" fill="none" ${sk(3.5)}/>
      <path d="M40 112 L68 116 M40 128 L68 124 M160 112 L132 116 M160 128 L132 124" ${sk(3)} fill="none"/>` },
    { id: 'dog', bg: 'peach', sound: 'woof', art: () => `
      <ellipse cx="46" cy="96" rx="22" ry="44" fill="${C('wood-d')}" ${sk()} transform="rotate(14 46 96)"/>
      <ellipse cx="154" cy="96" rx="22" ry="44" fill="${C('wood-d')}" ${sk()} transform="rotate(-14 154 96)"/>
      <ellipse cx="100" cy="104" rx="58" ry="62" fill="${C('wood')}" ${sk()}/>
      <ellipse cx="100" cy="132" rx="32" ry="24" fill="${C('paper')}" ${sk()}/>
      <ellipse cx="100" cy="122" rx="12" ry="8" fill="${K()}"/>
      <path d="M100 130 v8 M100 138 q-9 9 -17 1 M100 138 q9 9 17 1" fill="none" ${sk(3.5)}/>
      <path d="M95 148 q5 14 12 0Z" fill="${C('coral')}" ${sk(3)}/>
      ${eyes(92, 26)}` },
    { id: 'sheep', bg: 'mint', sound: 'baa', art: () => {
      let fluff = '';
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.28;
        fluff += `<circle cx="${100 + Math.cos(a) * 54}" cy="${96 + Math.sin(a) * 50}" r="28" fill="${C('paper')}" ${sk()}/>`;
      }
      return fluff + `<circle cx="100" cy="96" r="52" fill="${C('paper')}"/>
      <ellipse cx="42" cy="104" rx="16" ry="10" fill="${C('hair-4')}" ${sk()} transform="rotate(20 42 104)"/>
      <ellipse cx="158" cy="104" rx="16" ry="10" fill="${C('hair-4')}" ${sk()} transform="rotate(-20 158 104)"/>
      <ellipse cx="100" cy="112" rx="34" ry="38" fill="${C('hair-4')}" ${sk()}/>
      ${eyes(104, 16)}${smile(124)}`;
    } }
  ];

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }

  PR.toys.animals = {
    init(container) {
      wrap = document.createElement('div');
      wrap.className = 'an';
      ANIMALS.forEach(a => {
        const b = document.createElement('button');
        b.className = 'an-card';
        b.setAttribute('aria-label', a.id);
        b.style.setProperty('--c', C(a.bg));
        b.innerHTML = `<svg viewBox="0 0 200 200" aria-hidden="true">${a.art()}</svg>`;
        on(b, 'pointerdown', e => {
          e.preventDefault();
          PR.audio[a.sound]();
          b.classList.remove('hop');
          void b.offsetWidth;
          b.classList.add('hop');
          const r = b.getBoundingClientRect();
          PR.fx.ripple(container, e.clientX, e.clientY, C(a.bg + '-d'));
        });
        wrap.appendChild(b);
      });
      container.appendChild(wrap);
    },
    save() {},
    destroy() {
      cleanups.splice(0).forEach(f => f());
      if (wrap) wrap.remove();
    }
  };
})();
