/* =========================================================
   Toy 10 - Piano
   Eight colourful keys on a gentle pentatonic scale, plus
   four drum pads. Every key lights up and any mix sounds nice.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEYS = ['coral', 'peach', 'butter', 'mint', 'teal', 'sky', 'lilac', 'pink'];
  const PADS = [
    { c: 'lilac', f: () => PR.audio.knock() },
    { c: 'butter', f: () => PR.audio.clack() },
    { c: 'mint', f: () => PR.audio.tick(1) },
    { c: 'sky', f: () => PR.audio.pop(0.8) }
  ];

  const cleanups = [];
  let wrap;

  function on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    cleanups.push(() => target.removeEventListener(ev, fn, opts));
  }

  function press(node, e, sound) {
    e.preventDefault();
    sound();
    node.classList.add('lit');
    setTimeout(() => node.classList.remove('lit'), 220);
    PR.fx.ripple(wrap, e.clientX, e.clientY, PR.color('ink-soft'));
  }

  PR.toys.piano = {
    init(container) {
      wrap = document.createElement('div');
      wrap.className = 'pi';
      const pads = document.createElement('div');
      pads.className = 'pi-pads';
      PADS.forEach(p => {
        const b = document.createElement('button');
        b.className = 'pi-pad';
        b.style.setProperty('--c', PR.color(p.c));
        on(b, 'pointerdown', e => press(b, e, p.f));
        pads.appendChild(b);
      });
      const keys = document.createElement('div');
      keys.className = 'pi-keys';
      KEYS.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'pi-key';
        b.style.setProperty('--c', PR.color(c));
        on(b, 'pointerdown', e => press(b, e, () => PR.audio.note(i, { type: 'triangle', dur: 0.8, vol: 0.2 })));
        keys.appendChild(b);
      });
      wrap.appendChild(pads);
      wrap.appendChild(keys);
      container.appendChild(wrap);
    },
    save() {},
    destroy() {
      cleanups.splice(0).forEach(f => f());
      if (wrap) wrap.remove();
    }
  };
})();
