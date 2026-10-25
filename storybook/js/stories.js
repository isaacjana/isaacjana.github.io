/* =========================================================
   Cozy Tales - js/stories.js
   The stories. Each page is { text, art() } where art()
   returns the inner SVG of a 400 x 300 scene. Wrap anything
   tappable with A.tp(inner, animation, sound, class).
   *Starred words* are shown big and colourful.
   ========================================================= */
(function () {
  'use strict';
  const SB = window.SB = window.SB || {};
  const A = SB.art;
  const C = SB.color;

  // ---------- Shared bits ----------
  const SOUND = { bear: 'grunt', bunny: 'hop', duck: 'quack', owl: 'hoot', fox: 'yip' };
  let n = 0;
  // A character the child can tap. (x, y) = feet.
  function ch(kind, x, y, s, o, extra) {
    extra = extra || {};
    const inner = A.tp(A.critter(kind, o || {}), extra.anim || 'hop', extra.snd || SOUND[kind], 'idle', ((n++ * 0.45) % 2.4).toFixed(2));
    return A.at(x, y, s, inner, extra.flip);
  }
  // Soft shadow under characters
  const shadow = (x, y, w) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.2}" fill="rgba(107,88,83,.14)"/>`;
  const big = (x, y, txt, col, size, rot) =>
    `<text class="pop-text" x="${x}" y="${y}" text-anchor="middle" font-size="${size || 40}" font-weight="900" font-family="ui-rounded,Nunito,system-ui,sans-serif" fill="${col}" stroke="${C('ink')}" stroke-width="2.2" paint-order="stroke" transform="rotate(${rot || 0} ${x} ${y})">${txt}</text>`;

  // Night scenery shared by the Bobo story
  const nightHills = () => A.hill(60, 320, 190, 100, C('sage-d'), 2) + A.hill(340, 330, 200, 100, C('sage'), 5);

  // ---------- Story 1: Bobo and the Moon ----------
  const bobo = {
    id: 'bobo', title: 'Bobo and the Moon',
    color: 'pink', dark: 'pink-d', win: 'night', theme: 'lilac',
    cover: () => A.stars([[40, 40, 6], [170, 30, 5], [150, 70, 4]]) + A.moon(155, 55, 26, 'sleepy') + A.hill(110, 210, 110, 70, C('sage-d'), 3) + A.at(95, 170, 0.95, A.critter('bear', { mood: 'sleepy' })),
    pages: [
      {
        text: 'Bobo the bear was very, very sleepy. But when he lay down in his cosy cave, he could not fall asleep. Not one little bit.',
        art: () => A.sky('night') + A.stars([[50, 40, 6], [120, 80, 5], [220, 30, 7], [300, 90, 5], [360, 40, 6], [270, 55, 4]]) +
          A.tp(A.moon(335, 62, 24, 'sleepy'), 'wiggle', 'twinkle', 'c') + nightHills() +
          `<path d="M20 250 Q40 170 100 172 Q160 176 170 250Z" fill="${C('wood-d')}" stroke="${C('ink')}" stroke-width="4"/><path d="M52 250 Q58 196 98 196 Q136 196 142 250Z" fill="${C('night')}"/>` +
          shadow(250, 258, 52) + ch('bear', 250, 256, 1.5, { mood: 'wow' }) + A.flowers([[330, 262], [370, 255]])
      },
      {
        text: 'So Bobo tiptoed outside. High in the sky shone the big, round moon. “I will say goodnight to you,” said Bobo.',
        art: () => A.sky('night') + A.stars([[40, 50, 6], [110, 30, 5], [190, 100, 5], [370, 120, 6], [250, 28, 4]]) +
          A.tp(A.moon(285, 80, 48, 'happy'), 'wiggle', 'bell', 'c') + nightHills() +
          A.tree(60, 262, 1.1, C('sage')) + shadow(160, 262, 44) + ch('bear', 160, 260, 1.45, { mood: 'happy', up: true }) + A.flowers([[260, 266], [310, 258], [355, 268]])
      },
      {
        text: 'But the moon was far, far away. Bobo jumped up. *Hop!* He jumped again. *Hop! Hop!* He could not reach it.',
        art: () => A.sky('night') + A.stars([[40, 60, 6], [100, 30, 5], [170, 120, 4], [370, 140, 6]]) +
          A.tp(A.moon(300, 60, 40, 'happy'), 'wiggle', 'bell', 'c') + nightHills() +
          A.line('M150 238 Q175 150 205 150', 3, 'rgba(255,255,255,.8)') + `<path d="M150 238 Q175 150 205 150" fill="none" stroke="${C('ink')}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>` +
          shadow(150, 266, 36) + ch('bear', 190, 218, 1.35, { mood: 'wow', up: true }, { anim: 'hop', snd: 'boing' }) +
          A.flowers([[70, 266], [330, 262]])
      },
      {
        text: 'Then Bobo saw the moon in the pond. “Got you!” he cried, and jumped right in. *SPLASH!* The moon wobbled into a hundred little moons.',
        art: () => A.sky('night') + A.stars([[50, 40, 6], [130, 70, 5], [260, 40, 5], [350, 80, 6]]) + A.moon(335, 38, 18, false) + nightHills() +
          A.tp(A.pond(220, 236, 150, 46) + A.ripples(220, 236, 40, 11, 3) +
            `<g opacity=".95">${A.moon(220, 236, 17, false)}${A.dot(196, 244, 4, C('paper'))}${A.dot(246, 230, 5, C('paper'))}${A.dot(232, 250, 3, C('paper'))}</g>`, 'splash', 'splash', 'c') +
          shadow(70, 268, 34) + ch('bear', 70, 266, 1.3, { mood: 'wow', up: true })
      },
      {
        text: '“Hoo hoo,” said Owl from the old tree. “Silly Bobo. The moon is not in the water. Look up! It follows you wherever you go.”',
        art: () => A.sky('night') + A.stars([[40, 50, 6], [190, 36, 5], [250, 90, 5], [130, 120, 4]]) +
          A.tp(A.moon(95, 62, 34, 'happy'), 'wiggle', 'bell', 'c') + nightHills() +
          A.rect(296, 70, 28, 200, 8, C('wood-d'), 3) + A.line('M300 142 Q260 138 236 150', 14, C('wood-d')) + A.line('M300 142 Q260 138 236 150', 6, C('wood')) +
          A.tree(310, 160, 1.8, C('sage')) +
          ch('owl', 250, 152, 0.85, { mood: 'happy' }) + shadow(150, 268, 36) + ch('bear', 150, 266, 1.35, { mood: 'happy' }) +
          `<path d="M120 200 q-4 10 0 14 M176 205 q-3 9 0 12" stroke="${C('sky-d')}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      },
      {
        text: 'So Bobo walked home with the moon beside him. He snuggled into bed, and the moon peeked in through the window. “Goodnight, Moon.” *Zzzzz...*',
        art: () => `<rect width="400" height="300" fill="${C('lilac')}"/><rect y="236" width="400" height="64" fill="${C('wood')}"/><path d="M0 236 H400" stroke="${C('ink')}" stroke-width="4"/>` +
          A.rect(238, 36, 130, 130, 26, C('night'), 3, 6) + A.stars([[268, 66, 5], [340, 62, 4], [330, 130, 5]]) + A.tp(A.moon(300, 100, 30, 'sleepy'), 'wiggle', 'bell', 'c') +
          `<path d="M238 100 h130 M303 36 v130" stroke="${C('ink')}" stroke-width="5"/>` +
          A.rect(40, 200, 250, 70, 18, C('wood-d'), 4) + ch('bear', 150, 238, 1.3, { mood: 'sleepy' }, { snd: 'snore' }) +
          A.rect(52, 190, 80, 34, 16, C('paper'), 5) + A.rect(40, 224, 250, 56, 16, C('coral'), 6) +
          A.line('M70 238 q14 -10 28 0 t28 0 t28 0 t28 0 t28 0', 3, C('coral-d')) + A.zzz(180, 150)
      }
    ]
  };

  // ---------- Story 2: Pip and the Puddle ----------
  const pondDucks = () =>
    ch('duck', 255, 212, 0.72, { mood: 'happy' }) + ch('duck', 330, 226, 0.6, { mood: 'happy', fur: C('butter') }, { flip: true }) + ch('duck', 300, 205, 0.9, { fur: C('butter-d') });

  const pip = {
    id: 'pip', title: 'Pip and the Puddle',
    color: 'butter', dark: 'butter-d', win: 'day', theme: 'sky',
    cover: () => A.cloud(60, 40, 0.7) + A.sun(165, 36, 16, false) + A.hill(110, 220, 130, 60, C('grass'), 2) + A.rainbow(110, 140, 52) + A.at(110, 170, 1.0, A.critter('duck', { mood: 'wow' })),
    pages: [
      {
        text: 'Pip was a little duck with a big problem. Pip did not like the water. “Brrr,” said Pip. “It looks too wet and too deep.”',
        art: () => A.sky('day') + A.sun(60, 54, 24) + A.cloud(260, 54, 0.9, null, 0) + A.hill(90, 320, 220, 110, C('grass'), 3) +
          A.tp(A.pond(285, 232, 150, 44) + A.ripples(285, 232, 50, 12, 2), 'wiggle', 'drip', 'c') + pondDucks() +
          A.flowers([[30, 262], [185, 268], [230, 262]]) + shadow(105, 268, 36) + ch('duck', 105, 266, 1.3, { mood: 'wow' })
      },
      {
        text: '“Come in, Pip!” called his sisters and brothers. “The water is lovely!” But Pip shook his little head. “No, thank you.”',
        art: () => A.sky('day') + A.cloud(110, 50, 0.9, null, 1) + A.cloud(320, 80, 0.7, null, 0) + A.hill(60, 320, 200, 110, C('grass'), 4) +
          A.tp(A.pond(250, 226, 170, 54) + A.ripples(250, 226, 60, 14, 2), 'wiggle', 'drip', 'c') +
          ch('duck', 215, 218, 0.95, { mood: 'happy' }, { anim: 'wiggle' }) + ch('duck', 290, 232, 0.8, { mood: 'happy' }, { flip: true, anim: 'wiggle' }) + ch('duck', 345, 212, 0.7, { mood: 'happy', fur: C('butter-d') }, { flip: true }) +
          A.bush(40, 270, 1.2) + shadow(100, 270, 34) + ch('duck', 100, 268, 1.35, { mood: 'sad' }, { anim: 'shake' })
      },
      {
        text: 'Then *drip, drop, drip!* Rain began to fall. Everyone splashed and played in the pond, but Pip hid under a big red mushroom.',
        art: () => A.sky('rain') + A.cloud(90, 44, 1.0, '#D8E0E8', 0) + A.cloud(250, 36, 1.1, '#D8E0E8', 1) + A.cloud(350, 70, 0.8, '#D8E0E8', 2) + A.hill(60, 320, 200, 110, C('sage'), 4) +
          A.pond(290, 238, 150, 38) + A.ripples(290, 238, 30, 8, 3) + A.ripples(325, 244, 24, 6, 2) +
          ch('duck', 270, 226, 0.8, { mood: 'happy' }) + ch('duck', 335, 230, 0.7, { mood: 'happy' }, { flip: true }) +
          shadow(100, 270, 70) + A.mushroom(110, 268, 2.8, C('coral')) + ch('duck', 62, 268, 1.0, { mood: 'sleepy' }) + A.rain(32)
      },
      {
        text: 'When the rain stopped, a tiny puddle sparkled by Pip’s toes. It was only a little puddle. Pip stuck out one orange toe. *Tap.*',
        art: () => A.sky('sunny') + A.sun(330, 54, 26) + A.cloud(110, 60, 0.9) + A.hill(200, 340, 300, 120, C('grass'), 6) +
          A.flowers([[40, 262], [360, 258], [300, 268]]) +
          A.tp(A.pond(240, 250, 100, 22) + A.spark(205, 246, 7, C('paper')) + A.spark(270, 254, 5, C('paper')) + A.ripples(240, 250, 30, 7, 2), 'pop', 'drip', 'c') +
          shadow(120, 272, 40) + ch('duck', 120, 270, 1.55, { mood: 'wow' })
      },
      {
        text: 'It was not scary at all! Pip hopped in with both feet. *Splish! Splash! Splosh!* “Look at me!” he quacked.',
        art: () => A.sky('sunny') + A.sun(60, 54, 26) + A.cloud(280, 56, 0.9) + A.hill(200, 340, 300, 120, C('grass'), 6) +
          A.tp(A.pond(200, 254, 120, 26) + A.ripples(200, 254, 50, 10, 3), 'pop', 'splash', 'c') +
          [[150, 190, 8], [172, 168, 6], [232, 176, 7], [255, 205, 6], [205, 160, 5], [124, 220, 5]].map((p, i) => `<circle class="splashdrop" style="--d:${i * 0.25}s" cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${C('sky')}" stroke="${C('ink')}" stroke-width="2.6"/>`).join('') +
          ch('duck', 200, 262, 1.5, { mood: 'wow' }, { anim: 'hop', snd: 'splash' })
      },
      {
        text: 'Soon Pip swam in the pond with his family, under a bright rainbow. “Water is wonderful!” said Pip. *Quack, quack!*',
        art: () => A.sky('sunny') + A.rainbow(200, 190, 150) + A.cloud(60, 130, 0.8) + A.cloud(350, 130, 0.8) + A.sun(350, 44, 20) + A.hill(60, 330, 200, 110, C('grass'), 3) + A.hill(340, 330, 200, 110, C('grass'), 8) +
          A.pond(200, 252, 180, 42) + A.ripples(200, 252, 60, 12, 2) +
          ch('duck', 120, 240, 0.9, { mood: 'happy' }) + ch('duck', 285, 240, 0.9, { mood: 'happy' }, { flip: true }) + ch('duck', 220, 232, 1.1, { fur: C('butter-d') }) + ch('duck', 170, 250, 1.25, { mood: 'wow' }, { anim: 'hop' })
      }
    ]
  };

  // ---------- Story 3: Bunny's Red Balloon ----------
  const meadow = () => A.sky('day') + A.cloud(90, 56, 0.9) + A.cloud(310, 90, 0.7, null, 1.5) + A.hill(70, 320, 220, 110, C('grass'), 3) + A.hill(350, 330, 200, 110, C('sage'), 9);
  const balloonDay = {
    id: 'balloon', title: 'Bunny’s Red Balloon',
    color: 'mint', dark: 'mint-d', win: 'day', theme: 'mint',
    cover: () => A.cloud(50, 40, 0.6) + A.hill(110, 220, 130, 60, C('grass'), 2) + A.balloon(140, 60, C('coral'), 1.1, 60) + A.at(100, 175, 1.0, A.critter('bunny', { mood: 'happy', up: true })),
    pages: [
      {
        text: 'Bunny got a shiny red balloon at the spring fair. She held the string tight and skipped all the way home.',
        art: () => meadow() + A.tree(340, 250, 1.1, C('sage'), 0.5) + A.flowers([[40, 266], [240, 270], [290, 262], [370, 268]]) +
          A.tp(A.balloon(215, 100, C('coral'), 1.5, 56), 'float', 'squeak', 'c') + A.line('M205 150 L170 205', 3) +
          shadow(150, 268, 38) + ch('bunny', 150, 266, 1.5, { mood: 'happy' })
      },
      {
        text: 'But then a big gust of wind came. *Whoosh!* The balloon slipped out of Bunny’s paws and floated up, up, up.',
        art: () => A.sky('dusk') + A.cloud(70, 90, 0.8) + A.wind(30, 130, 120) + A.wind(170, 90, 90) + A.hill(70, 320, 220, 110, C('grass'), 3) + A.hill(350, 330, 200, 110, C('sage'), 9) +
          A.tp(A.balloon(310, 50, C('coral'), 1.2, 74), 'float', 'squeak', 'c') + A.flowers([[250, 268], [360, 266]]) +
          shadow(100, 268, 38) + ch('bunny', 100, 266, 1.5, { mood: 'wow', up: true })
      },
      {
        text: 'Fox saw the balloon sail by. He jumped as high as he could. *Boing!* But it was still too high.',
        art: () => meadow() + A.tree(40, 252, 1.0, C('sage'), 0.2) + A.flowers([[330, 268], [370, 262]]) +
          A.tp(A.balloon(268, 52, C('coral'), 1.2, 70), 'float', 'squeak', 'c') +
          shadow(200, 270, 36) + ch('fox', 200, 222, 1.4, { mood: 'grin', up: true }, { snd: 'boing' })
      },
      {
        text: 'So Bear lifted Fox up, and Fox reached and reached. Still too far! Then Duck flapped her wings and flew higher than them all.',
        art: () => meadow() + A.flowers([[40, 268], [360, 266]]) +
          A.tp(A.balloon(255, 42, C('coral'), 1.1, 36), 'float', 'squeak', 'c') +
          shadow(170, 272, 50) + ch('bear', 170, 270, 1.3, { mood: 'grin', up: true }) + ch('fox', 170, 150, 0.8, { mood: 'wow', up: true }) +
          A.at(300, 96, 0.8, A.tp(A.critter('duck', { mood: 'wow' }), 'wiggle', 'quack', 'idle'))
      },
      {
        text: 'Duck caught the string in her beak and glided down, down, down. “Here you go, Bunny!” she quacked. Bunny gave her a great big hug.',
        art: () => meadow() + A.flowers([[50, 268], [350, 262]]) +
          A.line('M215 112 Q200 70 205 52', 2.6) + A.tp(A.balloon(205, 38, C('coral'), 1.1, 24), 'float', 'squeak', 'c') +
          A.at(238, 150, 0.9, A.tp(A.critter('duck', { mood: 'happy' }), 'wiggle', 'quack', 'idle')) +
          shadow(120, 270, 38) + ch('bunny', 120, 268, 1.5, { mood: 'happy', up: true }) +
          shadow(320, 270, 36) + ch('fox', 320, 268, 1.1, { mood: 'happy', up: true }, { flip: true }) + ch('bear', 360, 270, 0.9, { mood: 'happy' }, { flip: true })
      },
      {
        text: 'Bunny tied the balloon to the picnic basket, and all the friends shared cake under it. It was the happiest party ever.',
        art: () => A.sky('sunny') + A.sun(54, 50, 24) + A.hill(200, 350, 340, 130, C('grass'), 6) +
          A.rect(70, 238, 260, 40, 10, C('pink'), 3) + A.line('M120 240 v36 M170 240 v36 M220 240 v36 M270 240 v36', 3, C('pink-d')) +
          A.tp(A.balloon(205, 72, C('coral'), 1.3, 60), 'float', 'squeak', 'c') + A.basket(205, 242, 1.2) + A.cake(300, 244, 1.0) +
          ch('bunny', 100, 250, 1.05, { mood: 'happy', up: true }) + ch('fox', 150, 258, 0.95, { mood: 'happy' }) +
          ch('duck', 262, 256, 0.85, { mood: 'happy' }, { flip: true }) + ch('bear', 346, 262, 1.0, { mood: 'happy', up: true }, { flip: true })
      }
    ]
  };

  // ---------- Story 4: Fox's Giant Sneeze ----------
  const feather = (x, y, rot, s) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s || 1})">${A.shape('M0 -16 Q11 -4 0 18 Q-11 -4 0 -16Z', C('paper'), 2.6)}${A.line('M0 -12 V22', 2.4)}</g>`;
  const foxDay = {
    id: 'fox', title: 'Fox’s Giant Sneeze',
    color: 'peach', dark: 'peach-d', win: 'sunny', theme: 'butter',
    cover: () => A.sun(160, 40, 18, false) + A.wind(30, 70, 80) + A.hill(110, 220, 130, 60, C('grass'), 2) + A.at(100, 175, 1.0, A.critter('fox', { mood: 'scrunch' })) + A.at(150, 100, 1, feather(0, 0, 30, 1)),
    pages: [
      {
        text: 'Fox woke up from his nap with a tickle in his nose. A little white feather floated by. “Oh dear,” said Fox.',
        art: () => meadow() + A.tree(50, 252, 1.2, C('sage'), 0.3) + A.flowers([[320, 268], [365, 262]]) +
          A.tp(feather(150, 150, 25, 1.2), 'float', 'tickle', 'c') +
          shadow(230, 270, 42) + ch('fox', 230, 268, 1.55, { mood: 'wow' })
      },
      {
        text: '“Ah... ah... AH...” Fox scrunched up his face. The leaves began to tremble. Bunny held her ears.',
        art: () => meadow() + A.amb(A.tree(60, 252, 1.3, C('sage'), 0), 'shiver') + A.flowers([[360, 266]]) +
          shadow(210, 272, 52) + ch('fox', 210, 270, 1.8, { mood: 'scrunch' }, { anim: 'shake', snd: 'tickle' }) +
          ch('bunny', 340, 266, 0.9, { mood: 'wow', up: true })
      },
      {
        text: '“AH-CHOOOO!” The sneeze was so big that the wind went *WHOOSH!* Leaves and hats and carrots flew into the air.',
        art: () => A.sky('sunny') + A.hill(70, 330, 220, 110, C('grass'), 3) + A.hill(350, 330, 200, 110, C('sage'), 9) +
          A.wind(120, 150, 150) + A.wind(150, 190, 130) + A.wind(120, 110, 130) +
          big(255, 82, 'ACHOO!', C('coral'), 46, -8) +
          A.leaf(250, 150, 1.3, 40) + A.leaf(300, 180, 1.2, -30) + A.hat(350, 120, 1.1, 20) + A.carrot(320, 220, 1.1, 60) +
          shadow(70, 270, 42) + ch('fox', 70, 268, 1.55, { mood: 'scrunch' }, { anim: 'shake', snd: 'sneeze' })
      },
      {
        text: 'Up, up, up they went! Past the trees, past the birds, all the way up to the fluffy clouds.',
        art: () => A.sky('day') + A.cloud(80, 70, 1.0, null, 0) + A.cloud(300, 50, 1.1, null, 1) + A.cloud(200, 140, 0.9, null, 2) + A.hill(200, 380, 340, 130, C('grass'), 5) +
          A.tp(A.leaf(70, 150, 1.4, 20), 'spin', 'pop', 'c') + A.tp(A.hat(160, 100, 1.4, -20), 'spin', 'pop', 'c') + A.tp(A.carrot(250, 190, 1.4, 30), 'spin', 'pop', 'c') +
          A.tp(A.leaf(330, 120, 1.3, -50), 'spin', 'pop', 'c') + A.tp(A.carrot(120, 205, 1.3, -40), 'spin', 'pop', 'c') + A.tp(A.hat(300, 215, 1.2, 40), 'spin', 'pop', 'c') +
          ch('fox', 200, 275, 0.8, { mood: 'wow' })
      },
      {
        text: 'Then down they came, soft as snowflakes. *Plink, plonk, plink.* Carrots dropped into baskets, and hats landed on heads.',
        art: () => meadow() + A.flowers([[30, 268]]) +
          A.tp(A.leaf(90, 90, 1.4, 30), 'spin', 'pop', 'c') + A.tp(A.carrot(190, 120, 1.3, 150), 'spin', 'pop', 'c') + A.tp(A.leaf(280, 70, 1.3, -20), 'spin', 'pop', 'c') + A.tp(A.hat(345, 150, 1.3, 15), 'spin', 'pop', 'c') +
          A.basket(110, 272, 1.1) + A.carrot(100, 235, 0.9, 20) +
          shadow(210, 272, 34) + ch('bunny', 210, 270, 1.3, { mood: 'happy', up: true }) + A.at(210, 158, 0.9, A.tp(A.hat(0, 0, 1, 0), 'wiggle', 'pop', 'c')) +
          shadow(320, 272, 34) + ch('duck', 320, 270, 1.0, { mood: 'happy' }, { flip: true })
      },
      {
        text: '“Bless you!” cried his friends. Fox giggled. Then a feather landed on his nose again. “Ah... ah...”',
        art: () => meadow() + A.tree(350, 254, 1.1, C('sage'), 0.2) + A.flowers([[40, 266], [120, 270]]) +
          A.tp(feather(215, 170, -15, 1), 'float', 'tickle', 'c') +
          shadow(210, 270, 44) + ch('fox', 210, 268, 1.6, { mood: 'grin' }, { snd: 'giggle' }) +
          ch('bunny', 90, 266, 1.0, { mood: 'happy', up: true }) + ch('bear', 330, 268, 1.0, { mood: 'happy', up: true }, { flip: true })
      }
    ]
  };

  // ---------- Story 5: Finn and the Falling Star ----------
  // Night sky strip on top, the sea below.
  function sea(surface, opts) {
    opts = opts || {};
    const y = surface;
    let wave = `M-10 ${y}`;
    for (let x = -10; x < 420; x += 40) wave += ` q10 -9 20 0 t20 0`;
    wave += ' V310 H-10Z';
    return A.sky('night') + A.stars(opts.stars || [[40, 20, 8], [120, 30, 6], [210, 16, 9], [300, 28, 7], [370, 14, 6]]) +
      `<path d="${wave}" fill="${C('teal')}" stroke="${C('ink')}" stroke-width="4"/>` +
      `<path d="M60 ${y + 4} L110 310 L60 310Z M180 ${y + 4} L250 310 L190 310Z M300 ${y + 4} L330 310 L290 310Z" fill="#fff" opacity=".13"/>` +
      A.hill(200, 340, 320, 70, C('wood'), 4) + A.seaweed(40, 290, 0.9, C('sage-d')) + A.seaweed(350, 292, 1.0, C('sage-d')) + A.seaweed(315, 290, 0.7, C('sage'));
  }

  const finn = {
    id: 'finn', title: 'Finn and the Falling Star',
    color: 'sky', dark: 'sky-d', win: 'night', theme: 'teal',
    cover: () => A.stars([[40, 40, 6], [180, 30, 5], [150, 100, 4]]) + A.at(160, 60, 1, A.starFace(0, 0, 18, 'happy')) + `<rect y="110" width="200" height="80" fill="${C('teal')}"/>` + A.at(90, 140, 1.3, A.fish({ mood: 'happy' })) + A.bubbles([[40, 150, 6], [150, 140, 5]]),
    pages: [
      {
        text: 'Little Finn the fish lived in the quiet blue sea. Every night he swam to the top and looked at the twinkly stars.',
        art: () => sea(60) + A.bubbles([[130, 190, 7], [300, 220, 6], [250, 120, 5]]) +
          A.at(200, 140, 1.5, A.tp(`<g transform="rotate(-24)">${A.fish({ mood: 'happy' })}</g>`, 'hop', 'bubble', 'idle'))
      },
      {
        text: 'One night, a star slipped from the sky! *Whoosh!* It fell down, down, down, and landed in the sea with a *plop*.',
        art: () => sea(70) +
          `<path d="M330 -10 Q250 20 170 70" fill="none" stroke="${C('butter')}" stroke-width="12" stroke-linecap="round" opacity=".7"/>` +
          A.at(165, 82, 1, A.tp(A.starFace(0, 0, 22, 'wow'), 'spin', 'twinkle', 'c')) + A.ripples(165, 70, 40, 10, 2) +
          A.bubbles([[110, 200, 7], [310, 180, 5]]) + A.at(290, 200, 1.2, A.tp(A.fish({ mood: 'wow' }), 'hop', 'bubble', 'idle'), true)
      },
      {
        text: 'The star sank all the way to the sandy bottom. “I am too tired to shine,” she whispered. “And I cannot get home.”',
        art: () => sea(60) + A.bubbles([[300, 150, 6], [90, 130, 5]]) +
          A.at(250, 262, 1.2, A.tp(A.starFace(0, -10, 28, 'sad'), 'wiggle', 'soft', 'c')) +
          A.at(120, 200, 1.1, A.tp(A.fish({ mood: 'happy' }), 'hop', 'bubble', 'idle')) +
          A.rock(60, 290, 1.4, C('road')) + A.rock(350, 292, 1.0, C('road'))
      },
      {
        text: '“Don’t worry,” said Finn. “I will help.” He blew bubbles, big ones, round and strong. *Blub, blub, blub!* They wrapped the star up gently.',
        art: () => sea(60) +
          `<circle cx="230" cy="190" r="62" fill="rgba(255,255,255,.35)" stroke="${C('ink')}" stroke-width="4"/><path d="M190 160 q8 -16 28 -20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>` +
          A.at(230, 205, 1, A.tp(A.starFace(0, -4, 30, 'happy'), 'wiggle', 'chime', 'c')) +
          A.at(100, 200, 1.4, A.tp(A.fish({ mood: 'happy' }), 'hop', 'bubble', 'idle')) +
          A.tapBubble(150, 160, 10, 0) + A.tapBubble(135, 135, 7, 0.7) + A.tapBubble(165, 112, 5, 1.4)
      },
      {
        text: 'Up, up, up the bubbles floated. The star began to glow brighter and brighter, until the whole sea sparkled.',
        art: () => sea(70, { stars: [[60, 20, 8], [200, 16, 9], [330, 24, 7]] }) +
          `<circle cx="200" cy="150" r="90" fill="${C('butter')}" opacity=".25"/><circle cx="200" cy="150" r="60" fill="${C('butter')}" opacity=".3"/>` +
          A.at(200, 150, 1.4, A.tp(A.starFace(0, 0, 28, 'happy'), 'spin', 'twinkle', 'c')) +
          A.at(90, 190, 1.2, A.tp(A.fish({ mood: 'happy' }), 'hop', 'bubble', 'idle')) +
          A.tapBubble(300, 230, 9, 0) + A.tapBubble(330, 180, 7, 0.9) + A.tapBubble(60, 120, 7, 1.7) + A.tapBubble(280, 120, 6, 0.4) + A.tapBubble(340, 250, 11, 2.1)
      },
      {
        text: 'With a happy *pop*, the star leapt back into the sky. Now every night she twinkles, and Finn knows she is saying hello.',
        art: () => A.sky('night') + A.stars([[40, 40, 6], [110, 80, 5], [300, 36, 6], [350, 100, 5], [160, 20, 4], [60, 120, 4]]) +
          A.at(220, 90, 1.7, A.tp(A.starFace(0, 0, 24, 'happy'), 'spin', 'twinkle', 'c')) + A.spark(280, 50, 8) + A.spark(160, 130, 6) +
          `<path d="M-10 200 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V310 H-10Z" fill="${C('teal')}" stroke="${C('ink')}" stroke-width="4"/>` +
          A.at(110, 215, 1.2, A.tp(`<g transform="rotate(-30)">${A.fish({ mood: 'happy' })}</g>`, 'hop', 'bubble', 'idle')) + A.tapBubble(170, 240, 8, 0.2) + A.tapBubble(320, 255, 10, 1)
      }
    ]
  };
  SB.stories = [bobo, pip, balloonDay, foxDay, finn];
})();
