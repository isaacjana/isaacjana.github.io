/* =========================================================
   Toy 3 - Sound Blobs
   Drag colored blobs onto a looping 8-step track. Height sets
   the pitch (pentatonic, so it never sounds bad); color sets
   the voice. Drag a blob off the track to send it home.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEY = 'blobs';
  const STEPS = 8, ROWS = 5;
  const VOICES = ['pink', 'butter', 'mint', 'sky', 'lilac'];
  const TEMPOS = [76, 100, 128];
  // rows top -> bottom: high -> low (pentatonic steps)
  const ROW_STEP = [4, 3, 2, 1, 0];

  let root, wrap, track, glow, tray, playBtn, tempoBtn;
  let cells = [];             // [step][row] -> element
  let grid = [];              // [step][row] -> voice | null
  let playing = true, tempoIdx = 1;
  let step = 0, nextTime = 0, timer = 0, raf = 0;
  let queue = [];
  const drags = new Map();
  let saveDeb = null;

  function blobSvg(voice, seed) {
    const A = PR.art;
    return `<svg viewBox="0 0 100 100"><path d="${A.blob(50, 54, 40, 37, seed || 3, 0.09, 8)}" fill="${PR.color(voice)}" stroke="${PR.color('ink')}" stroke-width="5"/>
      <ellipse cx="34" cy="34" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 34 34)"/>${A.faceSvg(50, 56, 20)}</svg>`;
  }

  // ---------- Track ----------
  function emptyGrid() { return Array.from({ length: STEPS }, () => Array(ROWS).fill(null)); }

  function setCell(s, r, voice, animate) {
    grid[s][r] = voice;
    const cell = cells[s][r];
    cell.innerHTML = '';
    if (!voice) return;
    const b = document.createElement('div');
    b.className = 'b-blob' + (animate ? ' boing' : '');
    b.innerHTML = blobSvg(voice, s * 7 + r * 3 + 1);
    cell.appendChild(b);
  }

  function cellAt(clientX, clientY) {
    const r = track.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    const s = Math.floor((clientX - r.left) / r.width * STEPS);
    const row = Math.floor((clientY - r.top) / r.height * ROWS);
    return { s: PR.util.clamp(s, 0, STEPS - 1), r: PR.util.clamp(row, 0, ROWS - 1) };
  }

  function play(voice, row, when) {
    PR.audio.instrument(voice, PR.audio.freqOf(ROW_STEP[row]), when);
  }

  function bounce(el, cls) {
    if (!el) return;
    el.classList.remove('boing', 'wiggle');
    void el.offsetWidth;
    el.classList.add(cls || 'boing');
  }

  // ---------- Dragging ----------
  function startDrag(e, voice, fromCell) {
    const d = document.createElement('div');
    d.className = 'b-drag lift';
    d.innerHTML = blobSvg(voice, 5);
    root.appendChild(d);
    const p = PR.util.local(e, root);
    d.style.left = p.x + 'px';
    d.style.top = p.y + 'px';
    drags.set(e.pointerId, { el: d, voice, fromCell, sx: e.clientX, sy: e.clientY, moved: false, hot: null });
    PR.audio.up();
  }

  function onTrayDown(e) {
    const btn = e.target.closest('.b-source');
    if (!btn) return;
    e.preventDefault();
    try { root.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    startDrag(e, btn.dataset.voice, null);
  }

  function onTrackDown(e) {
    e.preventDefault();
    const c = cellAt(e.clientX, e.clientY);
    if (!c) return;
    try { root.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const voice = grid[c.s][c.r];
    if (voice) {
      // pick up a placed blob (a tap without moving just plays it)
      setCell(c.s, c.r, null);
      startDrag(e, voice, c);
    } else {
      // tap an empty spot: hear that height
      cells[c.s][c.r].classList.add('hot');
      setTimeout(() => cells[c.s] && cells[c.s][c.r].classList.remove('hot'), 220);
      PR.audio.tone(PR.audio.freqOf(ROW_STEP[c.r]), { type: 'sine', dur: 0.18, vol: 0.08 });
    }
  }

  function onMove(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    const p = PR.util.local(e, root);
    d.el.style.left = p.x + 'px';
    d.el.style.top = p.y + 'px';
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 10) d.moved = true;
    const c = cellAt(e.clientX, e.clientY);
    const key = c ? c.s + ':' + c.r : null;
    if (key !== d.hot) {
      if (d.hot) { const [s, r] = d.hot.split(':'); cells[s][r].classList.remove('hot'); }
      if (c) {
        cells[c.s][c.r].classList.add('hot');
        PR.audio.tick(1 + (ROWS - c.r) * 0.1);
      }
      d.hot = key;
    }
  }

  function onUp(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    if (d.hot) { const [s, r] = d.hot.split(':'); cells[s][r].classList.remove('hot'); }
    let c = cellAt(e.clientX, e.clientY);
    if (!d.moved && d.fromCell) c = d.fromCell; // a tap on a placed blob
    if (c) {
      d.el.remove();
      setCell(c.s, c.r, d.voice, true);
      const el = cells[c.s][c.r].firstChild;
      if (!d.moved && d.fromCell) bounce(el, 'wiggle');
      play(d.voice, c.r);
      saveDeb();
    } else {
      // float back home and fade away
      PR.audio.down();
      const src = tray.querySelector(`[data-voice="${d.voice}"]`);
      const sr = src.getBoundingClientRect(), rr = root.getBoundingClientRect();
      d.el.classList.remove('lift');
      d.el.classList.add('home');
      d.el.style.left = (sr.left + sr.width / 2 - rr.left) + 'px';
      d.el.style.top = (sr.top + sr.height / 2 - rr.top) + 'px';
      setTimeout(() => d.el.remove(), 400);
      if (d.fromCell) saveDeb();
    }
  }

  // ---------- Sequencer ----------
  function stepDur() { return 60 / TEMPOS[tempoIdx] / 2; }

  function schedule() {
    if (!playing) return;
    const now = PR.audio.now();
    if (nextTime < now - 0.3 || nextTime > now + 1.5) nextTime = now + 0.05;
    while (nextTime < now + 0.12) {
      for (let r = 0; r < ROWS; r++) {
        const v = grid[step][r];
        if (v) play(v, r, nextTime);
      }
      queue.push({ step, time: nextTime });
      nextTime += stepDur();
      step = (step + 1) % STEPS;
    }
  }

  function showStep(s) {
    const c = cells[s][0];
    glow.style.width = c.offsetWidth + 'px';
    glow.style.left = c.offsetLeft + 'px';
    for (let r = 0; r < ROWS; r++) {
      if (grid[s][r]) bounce(cells[s][r].firstChild, 'boing');
    }
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const now = PR.audio.now();
    while (queue.length && queue[0].time <= now) {
      const q = queue.shift();
      showStep(q.step);
    }
  }

  // ---------- Controls ----------
  function playIcon() {
    const k = PR.color('ink');
    return playing
      ? `<svg viewBox="0 0 60 60"><rect x="16" y="14" width="10" height="32" rx="4" fill="${k}"/><rect x="34" y="14" width="10" height="32" rx="4" fill="${k}"/></svg>`
      : `<svg viewBox="0 0 60 60"><path d="M20 12 L48 30 L20 48 Z" fill="${PR.color('coral-d')}" stroke="${k}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  }
  function tempoIcon() {
    const k = PR.color('ink');
    const dur = (60 / TEMPOS[tempoIdx]).toFixed(2) + 's';
    const size = [9, 8, 7][tempoIdx];
    return `<svg viewBox="0 0 60 60"><path d="M8 52 H52" stroke="${k}" stroke-width="4" stroke-linecap="round"/>
      <circle class="tempo-ball" style="--tempo:${dur}" cx="30" cy="${48 - size}" r="${size}" fill="${PR.color(VOICES[tempoIdx * 2])}" stroke="${k}" stroke-width="3.5"/></svg>`;
  }

  function onPlay(e) {
    e.preventDefault();
    playing = !playing;
    playBtn.innerHTML = playIcon();
    if (playing) { nextTime = PR.audio.now() + 0.05; PR.audio.up(); } else { queue = []; PR.audio.down(); }
    saveDeb();
  }
  function onTempo(e) {
    e.preventDefault();
    tempoIdx = (tempoIdx + 1) % TEMPOS.length;
    tempoBtn.innerHTML = tempoIcon();
    PR.audio.boop(tempoIdx * 2);
    saveDeb();
  }

  // ---------- State ----------
  function save() {
    PR.store.set(KEY, { grid, playing, tempo: tempoIdx });
  }

  function restore() {
    grid = emptyGrid();
    const st = PR.store.get(KEY, null);
    if (st && Array.isArray(st.grid)) {
      for (let s = 0; s < STEPS; s++) for (let r = 0; r < ROWS; r++) {
        const v = st.grid[s] && st.grid[s][r];
        if (VOICES.includes(v)) grid[s][r] = v;
      }
      playing = st.playing !== false;
      tempoIdx = TEMPOS[st.tempo] ? st.tempo : 1;
    } else {
      // a gentle starter tune
      grid[0][4] = 'pink'; grid[2][2] = 'butter'; grid[4][1] = 'mint'; grid[6][2] = 'sky';
      playing = true; tempoIdx = 1;
    }
  }

  PR.toys.blobs = {
    init(container) {
      root = container;
      wrap = document.createElement('div');
      wrap.className = 'blobs';

      track = document.createElement('div');
      track.className = 'b-track';
      glow = document.createElement('div');
      glow.className = 'b-col-glow';
      track.appendChild(glow);
      restore();
      cells = [];
      for (let s = 0; s < STEPS; s++) cells.push([]);
      for (let r = 0; r < ROWS; r++) {
        for (let s = 0; s < STEPS; s++) {
          const c = document.createElement('div');
          c.className = 'b-cell';
          c.style.gridColumn = s + 1;
          c.style.gridRow = r + 1;
          track.appendChild(c);
          cells[s][r] = c;
        }
      }
      for (let s = 0; s < STEPS; s++) for (let r = 0; r < ROWS; r++) if (grid[s][r]) setCell(s, r, grid[s][r]);

      tray = document.createElement('div');
      tray.className = 'b-tray';
      VOICES.forEach((v, i) => {
        const b = document.createElement('button');
        b.className = 'b-source';
        b.dataset.voice = v;
        b.innerHTML = blobSvg(v, i * 5 + 2);
        tray.appendChild(b);
      });

      const side = document.createElement('div');
      side.className = 'b-side';
      playBtn = document.createElement('button');
      playBtn.className = 'b-ctl';
      playBtn.innerHTML = playIcon();
      tempoBtn = document.createElement('button');
      tempoBtn.className = 'b-ctl';
      tempoBtn.innerHTML = tempoIcon();
      side.append(playBtn, tempoBtn);

      wrap.append(track, side, tray);
      root.appendChild(wrap);

      saveDeb = PR.util.debounce(save, 800);
      tray.addEventListener('pointerdown', onTrayDown);
      track.addEventListener('pointerdown', onTrackDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);
      playBtn.addEventListener('pointerdown', onPlay);
      tempoBtn.addEventListener('pointerdown', onTempo);

      step = 0;
      queue = [];
      nextTime = PR.audio.now() + 0.4;
      timer = setInterval(schedule, 25);
      raf = requestAnimationFrame(frame);
    },
    save,
    destroy() {
      clearInterval(timer);
      cancelAnimationFrame(raf);
      if (saveDeb) saveDeb.cancel();
      save();
      if (root) {
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerup', onUp);
        root.removeEventListener('pointercancel', onUp);
      }
      drags.forEach(d => d.el.remove());
      drags.clear();
      queue = [];
      if (wrap) wrap.remove();
      root = wrap = track = glow = tray = playBtn = tempoBtn = null;
      cells = [];
    }
  };
})();
