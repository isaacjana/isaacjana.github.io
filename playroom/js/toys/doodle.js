/* =========================================================
   Toy 2 - Doodle Pad
   Chunky finger painting with stamps and an eraser.
   The frame button saves a PNG to the gallery (localStorage);
   the fresh-page button keeps the old page in the gallery too.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};
  PR.toys = PR.toys || {};

  const KEY = 'doodle.current';
  const KEY_TOOL = 'doodle.tool';
  const KEY_GALLERY = 'doodle.gallery';
  const MAX_GALLERY = 12;
  const COLORS = ['coral-d', 'peach-d', 'butter-d', 'mint-d', 'sky-d', 'lilac-d', 'pink-d', 'ink', 'rainbow'];
  const SIZES = [0.012, 0.025, 0.045];
  const STAMPS = ['star', 'heart', 'flower', 'smile', 'cloud'];

  let root, wrap, paper, canvas, ctx, flash, W = 0, H = 0, dpr = 1;
  let tool = { mode: 'brush', color: 'coral-d', size: 1, stamp: 'star' };
  const strokes = new Map();
  let dirty = false;
  let hue = 0;
  let saveDeb = null, onResize = null;
  const btns = { colors: [], sizes: [], stamps: [], eraser: null, save: null, fresh: null };

  // ---------- Icons ----------
  const ink = () => PR.color('ink');
  function stampPath(c, kind, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.beginPath();
    switch (kind) {
      case 'star':
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? s * 0.45 : s;
          const a = -Math.PI / 2 + i * Math.PI / 5;
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath();
        break;
      case 'heart':
        c.moveTo(0, s * 0.9);
        c.bezierCurveTo(-s * 1.3, s * 0.1, -s * 0.8, -s * 1.0, 0, -s * 0.35);
        c.bezierCurveTo(s * 0.8, -s * 1.0, s * 1.3, s * 0.1, 0, s * 0.9);
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5;
          c.moveTo(Math.cos(a) * s * 0.55 + s * 0.42, Math.sin(a) * s * 0.55);
          c.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.42, 0, 7);
        }
        break;
      case 'smile':
        c.arc(0, 0, s * 0.9, 0, 7);
        break;
      case 'cloud':
        c.arc(-s * 0.45, s * 0.1, s * 0.45, 0, 7);
        c.moveTo(s * 0.3 + s * 0.55, -s * 0.05);
        c.arc(s * 0.3, -s * 0.05, s * 0.55, 0, 7);
        c.moveTo(s * 0.1 + s * 0.5, s * 0.25);
        c.arc(-s * 0.05, -s * 0.3, s * 0.5, 0, 7);
        break;
    }
    c.restore();
  }

  function stampDetails(c, kind, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.fillStyle = PR.color('ink');
    c.strokeStyle = PR.color('ink');
    c.lineCap = 'round';
    c.lineWidth = Math.max(2, s * 0.09);
    if (kind === 'smile') {
      c.beginPath(); c.arc(-s * 0.3, -s * 0.15, s * 0.1, 0, 7); c.arc(s * 0.3, -s * 0.15, s * 0.1, 0, 7); c.fill();
      c.beginPath(); c.arc(0, s * 0.05, s * 0.45, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    } else if (kind === 'flower') {
      c.fillStyle = PR.color('butter');
      c.beginPath(); c.arc(0, 0, s * 0.35, 0, 7); c.fill(); c.stroke();
    }
    c.restore();
  }

  function iconSvg(kind) {
    const k = ink();
    switch (kind) {
      case 'eraser':
        return `<svg viewBox="0 0 60 60"><g transform="rotate(-30 30 30)"><rect x="12" y="20" width="36" height="20" rx="6" fill="${PR.color('pink')}" stroke="${k}" stroke-width="4"/><rect x="12" y="20" width="14" height="20" rx="6" fill="${PR.color('paper')}" stroke="${k}" stroke-width="4"/></g></svg>`;
      case 'save':
        return `<svg viewBox="0 0 60 60"><rect x="8" y="10" width="44" height="40" rx="6" fill="${PR.color('wood')}" stroke="${k}" stroke-width="4"/><rect x="15" y="17" width="30" height="26" rx="3" fill="${PR.color('paper')}" stroke="${k}" stroke-width="3"/><path d="M19 39 l7 -9 l5 6 l4 -4 l6 7" fill="none" stroke="${PR.color('mint-d')}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="37" cy="24" r="3.5" fill="${PR.color('butter-d')}"/></svg>`;
      case 'fresh':
        return `<svg viewBox="0 0 60 60"><rect x="16" y="8" width="32" height="42" rx="5" fill="${PR.color('cream-2')}" stroke="${k}" stroke-width="3" transform="rotate(10 32 29)"/><rect x="12" y="10" width="32" height="42" rx="5" fill="${PR.color('paper')}" stroke="${k}" stroke-width="4"/><path d="M28 24 v14 M21 31 h14" stroke="${PR.color('mint-d')}" stroke-width="5" stroke-linecap="round"/></svg>`;
      default: {
        // stamp icons drawn as SVG paths matching the canvas shapes
        const fill = PR.color('butter-d');
        const shapes = {
          star: `<path d="M30 8 L35.5 23 L51 23 L38.5 32.5 L43 48 L30 39 L17 48 L21.5 32.5 L9 23 L24.5 23Z" fill="${fill}" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>`,
          heart: `<path d="M30 50 C10 36 12 16 30 24 C48 16 50 36 30 50Z" fill="${PR.color('pink-d')}" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>`,
          flower: [0, 1, 2, 3, 4].map(i => { const a = i * Math.PI * 2 / 5; return `<circle cx="${30 + Math.cos(a) * 12}" cy="${30 + Math.sin(a) * 12}" r="9" fill="${PR.color('lilac-d')}" stroke="${k}" stroke-width="3"/>`; }).join('') + `<circle cx="30" cy="30" r="7" fill="${PR.color('butter')}" stroke="${k}" stroke-width="3"/>`,
          smile: `<circle cx="30" cy="30" r="20" fill="${PR.color('butter')}" stroke="${k}" stroke-width="3.5"/><circle cx="23" cy="26" r="2.5" fill="${k}"/><circle cx="37" cy="26" r="2.5" fill="${k}"/><path d="M21 34 q9 9 18 0" fill="none" stroke="${k}" stroke-width="3" stroke-linecap="round"/>`,
          cloud: `<path d="M16 42 a10 10 0 0 1 2 -19 a12 12 0 0 1 22 -3 a10 10 0 0 1 4 22Z" fill="${PR.color('sky')}" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/>`
        };
        return `<svg viewBox="0 0 60 60">${shapes[kind] || ''}</svg>`;
      }
    }
  }

  function sizeIcon(i) {
    const r = [5, 9, 14][i];
    return `<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="${r}" fill="${ink()}"/></svg>`;
  }

  // ---------- Toolbar ----------
  function button(cls, html, onTap) {
    const b = document.createElement('button');
    b.className = 'd-btn ' + cls;
    b.innerHTML = html || '';
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      onTap(b);
      const r = b.getBoundingClientRect(), rr = root.getBoundingClientRect();
      PR.fx.ripple(root, r.left + r.width / 2 - rr.left, r.top + r.height / 2 - rr.top, PR.color('paper'));
    });
    return b;
  }

  function refreshToolbar() {
    btns.colors.forEach(b => b.classList.toggle('on', tool.mode !== 'eraser' && b.dataset.c === tool.color));
    btns.sizes.forEach((b, i) => b.classList.toggle('on', tool.mode === 'brush' && tool.size === i));
    btns.stamps.forEach(b => b.classList.toggle('on', tool.mode === 'stamp' && b.dataset.s === tool.stamp));
    btns.eraser.classList.toggle('on', tool.mode === 'eraser');
  }

  function buildToolbars() {
    const left = document.createElement('div');
    left.className = 'doodle-bar left';
    COLORS.forEach((c, i) => {
      const b = button(c === 'rainbow' ? 'swatch rainbow' : 'swatch', '', () => {
        tool.color = c;
        if (tool.mode === 'eraser') tool.mode = 'brush';
        PR.audio.boop(i);
        refreshToolbar(); saveTool();
      });
      b.dataset.c = c;
      if (c !== 'rainbow') b.style.setProperty('--c', PR.color(c));
      btns.colors.push(b);
      left.appendChild(b);
    });

    const right = document.createElement('div');
    right.className = 'doodle-bar right';
    SIZES.forEach((_, i) => {
      const b = button('', sizeIcon(i), () => {
        tool.size = i; tool.mode = 'brush';
        PR.audio.boop(4 - i);
        refreshToolbar(); saveTool();
      });
      btns.sizes.push(b);
      right.appendChild(b);
    });
    btns.eraser = button('', iconSvg('eraser'), () => {
      tool.mode = 'eraser';
      PR.audio.soft(0.8);
      refreshToolbar(); saveTool();
    });
    right.appendChild(btns.eraser);
    STAMPS.forEach((s, i) => {
      const b = button('', iconSvg(s), () => {
        tool.mode = 'stamp'; tool.stamp = s;
        PR.audio.pop(1 + i * 0.1);
        refreshToolbar(); saveTool();
      });
      b.dataset.s = s;
      btns.stamps.push(b);
      right.appendChild(b);
    });
    const sep = document.createElement('div');
    sep.className = 'd-sep';
    right.appendChild(sep);
    btns.save = button('', iconSvg('save'), saveToGallery);
    btns.fresh = button('', iconSvg('fresh'), freshPage);
    right.append(btns.save, btns.fresh);

    wrap.prepend(left);
    wrap.appendChild(right);
  }

  function saveTool() { PR.store.set(KEY_TOOL, tool); }

  // ---------- Canvas ----------
  function clearPaper() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PR.color('paper');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function resize(keep) {
    let snap = null;
    if (keep && canvas.width > 1) {
      snap = document.createElement('canvas');
      snap.width = canvas.width; snap.height = canvas.height;
      snap.getContext('2d').drawImage(canvas, 0, 0);
    }
    const fit = PR.util.fitCanvas(canvas);
    ctx = fit.ctx; W = fit.w; H = fit.h; dpr = fit.dpr;
    clearPaper();
    if (snap) ctx.drawImage(snap, 0, 0, W, H);
  }

  function lineWidth() { return Math.max(4, Math.min(W, H) * SIZES[tool.size] * 2); }

  function strokeColor() {
    if (tool.mode === 'eraser') return PR.color('paper');
    if (tool.color === 'rainbow') return `hsl(${hue % 360}, 75%, 68%)`;
    return PR.color(tool.color);
  }

  function onDown(e) {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const p = PR.util.local(e, canvas);
    if (tool.mode === 'stamp') {
      const s = Math.min(W, H) * 0.07;
      const rot = PR.util.rand(-0.3, 0.3);
      ctx.fillStyle = tool.color === 'rainbow' ? `hsl(${(hue += 50) % 360}, 75%, 70%)` : PR.color(tool.color === 'ink' ? 'sky-d' : tool.color);
      ctx.strokeStyle = PR.color('ink');
      ctx.lineWidth = Math.max(2.5, s * 0.08);
      ctx.lineJoin = 'round';
      stampPath(ctx, tool.stamp, p.x, p.y, s, rot);
      ctx.fill(); ctx.stroke();
      stampDetails(ctx, tool.stamp, p.x, p.y, s, rot);
      PR.audio.pop(0.9 + Math.random() * 0.5);
      PR.fx.ripple(paper, p.x, p.y, PR.color('butter'));
      dirty = true;
      saveDeb();
      return;
    }
    strokes.set(e.pointerId, { x: p.x, y: p.y, mx: p.x, my: p.y, dist: 0 });
    // a dot on touch
    ctx.fillStyle = strokeColor();
    ctx.beginPath();
    ctx.arc(p.x, p.y, lineWidth() / 2, 0, 7);
    ctx.fill();
    PR.audio.tap(tool.mode === 'eraser' ? 0.6 : 1 + (1 - p.y / H) * 0.6);
    dirty = true;
  }

  function onMove(e) {
    const s = strokes.get(e.pointerId);
    if (!s) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const r = canvas.getBoundingClientRect();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth();
    (evs.length ? evs : [e]).forEach(ev => {
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      const mx = (s.x + x) / 2, my = (s.y + y) / 2;
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < 0.5) return;
      hue += d * 0.4;
      ctx.strokeStyle = strokeColor();
      ctx.beginPath();
      ctx.moveTo(s.mx, s.my);
      ctx.quadraticCurveTo(s.x, s.y, mx, my);
      ctx.stroke();
      s.dist += d;
      s.x = x; s.y = y; s.mx = mx; s.my = my;
    });
    // gentle musical scribble as you draw
    if (s.dist > 90) {
      s.dist = 0;
      const step = Math.floor((1 - s.y / H) * 8);
      if (tool.mode === 'eraser') PR.audio.tone(180 + Math.random() * 40, { type: 'sine', dur: 0.08, vol: 0.05 });
      else PR.audio.tone(PR.audio.freqOf(step, 0), { type: 'triangle', dur: 0.12, vol: 0.06 });
    }
  }

  function onUp(e) {
    const s = strokes.get(e.pointerId);
    if (!s) return;
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth();
    ctx.strokeStyle = strokeColor();
    ctx.beginPath();
    ctx.moveTo(s.mx, s.my);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    strokes.delete(e.pointerId);
    saveDeb();
  }

  // ---------- Saving ----------
  function snapshot(maxDim) {
    const k = Math.min(1, maxDim / Math.max(W, H));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(W * k));
    c.height = Math.max(1, Math.round(H * k));
    c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }

  function save() {
    if (!canvas) return;
    try { PR.store.set(KEY, snapshot(1200)); } catch (e) { /* ignore */ }
  }

  function addToGallery(png) {
    let list = PR.store.get(KEY_GALLERY, []) || [];
    list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), png });
    while (list.length > MAX_GALLERY) list.shift();
    // drop the oldest drawings until it fits in storage
    while (list.length && !PR.store.set(KEY_GALLERY, list)) list.shift();
    return list.length > 0;
  }

  function saveToGallery() {
    let png = '';
    try { png = snapshot(900); } catch (e) { return; }
    addToGallery(png);
    dirty = false;
    PR.audio.sparkle();
    flash.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on')));
    if (PR.reduced) return;
    // the picture flies into the frame button
    const pr = paper.getBoundingClientRect(), br = btns.save.getBoundingClientRect();
    const img = document.createElement('img');
    img.className = 'doodle-fly';
    img.src = png;
    Object.assign(img.style, { left: pr.left + 'px', top: pr.top + 'px', width: pr.width + 'px', height: pr.height + 'px' });
    document.body.appendChild(img);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      Object.assign(img.style, { left: br.left + 'px', top: br.top + 'px', width: br.width + 'px', height: br.height + 'px', opacity: '0.2', transform: 'rotate(10deg)' });
    }));
    setTimeout(() => img.remove(), 800);
  }

  function freshPage() {
    if (dirty) { try { addToGallery(snapshot(900)); } catch (e) { /* ignore */ } }
    dirty = false;
    PR.audio.whoosh();
    if (!PR.reduced) {
      // old page slides away
      const img = document.createElement('img');
      img.className = 'doodle-turn';
      img.src = canvas.toDataURL('image/png');
      img.style.width = '100%';
      img.style.height = '100%';
      paper.appendChild(img);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        img.style.transform = 'translate(-30%, 20%) rotate(-25deg)';
        img.style.opacity = '0';
      }));
      setTimeout(() => img.remove(), 700);
    }
    clearPaper();
    PR.store.remove(KEY);
  }

  function restore() {
    const t = PR.store.get(KEY_TOOL, null);
    if (t && typeof t === 'object') {
      if (COLORS.includes(t.color)) tool.color = t.color;
      if (SIZES[t.size] != null) tool.size = t.size;
      if (STAMPS.includes(t.stamp)) tool.stamp = t.stamp;
      if (['brush', 'stamp', 'eraser'].includes(t.mode)) tool.mode = t.mode;
    }
    const png = PR.store.get(KEY, null);
    if (typeof png === 'string' && png.indexOf('data:image') === 0) {
      const img = new Image();
      img.onload = () => { if (ctx) { ctx.drawImage(img, 0, 0, W, H); dirty = true; } };
      img.src = png;
    }
  }

  PR.toys.doodle = {
    init(container) {
      root = container;
      wrap = document.createElement('div');
      wrap.className = 'doodle';
      paper = document.createElement('div');
      paper.className = 'doodle-paper';
      canvas = document.createElement('canvas');
      flash = document.createElement('div');
      flash.className = 'doodle-flash';
      paper.append(canvas, flash);
      wrap.appendChild(paper);
      root.appendChild(wrap);
      buildToolbars();
      resize(false);
      restore();
      refreshToolbar();
      saveDeb = PR.util.debounce(save, 1200);
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      onResize = () => { if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize(true); };
      window.addEventListener('resize', onResize);
    },
    save,
    destroy() {
      if (saveDeb) saveDeb.cancel();
      save();
      window.removeEventListener('resize', onResize);
      strokes.clear();
      btns.colors = []; btns.sizes = []; btns.stamps = [];
      if (wrap) wrap.remove();
      root = wrap = paper = canvas = ctx = flash = null;
      W = H = 0;
    }
  };
})();
