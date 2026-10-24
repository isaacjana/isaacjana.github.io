/* =========================================================
   Playroom - physics.js
   A tiny 2D rigid-body engine (circles + convex polygons)
   used by Wobbly Blocks and Marble Run. Impulse-based, with
   friction, rotation and sleeping so stacks settle calmly.
   Units are CSS pixels and seconds.
   ========================================================= */
(function () {
  'use strict';
  const PR = window.PR = window.PR || {};

  const cross = (ax, ay, bx, by) => ax * by - ay * bx;

  // ---------- Shapes ----------

  // verts: [[x,y], ...] wound so that edge (a->b) has outward normal (e.y, -e.x)
  function makePoly(verts, density) {
    const n = verts.length;
    // centroid
    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < n; i++) {
      const p = verts[i], q = verts[(i + 1) % n];
      const d = cross(p[0], p[1], q[0], q[1]);
      area += d * 0.5;
      cx += d * (p[0] + q[0]) / 6;
      cy += d * (p[1] + q[1]) / 6;
    }
    cx /= area; cy /= area;
    const v = verts.map(p => ({ x: p[0] - cx, y: p[1] - cy }));
    // inertia about centroid
    let I = 0;
    for (let i = 0; i < n; i++) {
      const p = v[i], q = v[(i + 1) % n];
      const d = cross(p.x, p.y, q.x, q.y);
      I += (d / 12) * (p.x * p.x + p.x * q.x + q.x * q.x + p.y * p.y + p.y * q.y + q.y * q.y);
    }
    const normals = v.map((p, i) => {
      const q = v[(i + 1) % n];
      const ex = q.x - p.x, ey = q.y - p.y;
      const len = Math.hypot(ex, ey) || 1;
      return { x: ey / len, y: -ex / len };
    });
    let radius = 0;
    v.forEach(p => { radius = Math.max(radius, Math.hypot(p.x, p.y)); });
    return { type: 'poly', verts: v, normals, mass: density * area, inertia: density * I, radius, offset: { x: cx, y: cy } };
  }

  function boxVerts(w, h) {
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  }

  // ---------- Body ----------

  function Body(shape, x, y, o) {
    o = o || {};
    this.shape = shape;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.a = o.angle || 0;
    this.w = 0;
    this.restitution = o.restitution == null ? 0.2 : o.restitution;
    this.sf = o.friction == null ? 0.6 : o.friction;     // static friction
    this.df = this.sf * 0.75;                            // dynamic friction
    this.isStatic = !!o.isStatic;
    this.sleeping = false;
    this.sleepT = 0;
    this.held = 0;
    this.data = o.data || {};
    this.wv = []; this.wn = [];
    this.minX = this.minY = this.maxX = this.maxY = 0;
    if (this.isStatic) {
      this.mass = this.im = this.inertia = this.iI = 0;
    } else {
      this.mass = shape.mass;
      this.im = 1 / shape.mass;
      this.inertia = shape.inertia;
      this.iI = 1 / shape.inertia;
    }
    this.update();
  }

  Body.prototype.update = function () {
    const s = this.shape;
    if (s.type === 'circle') {
      this.minX = this.x - s.r; this.maxX = this.x + s.r;
      this.minY = this.y - s.r; this.maxY = this.y + s.r;
      return;
    }
    const c = Math.cos(this.a), sn = Math.sin(this.a);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < s.verts.length; i++) {
      const p = s.verts[i], n = s.normals[i];
      const wx = this.x + c * p.x - sn * p.y;
      const wy = this.y + sn * p.x + c * p.y;
      const v = this.wv[i] || (this.wv[i] = { x: 0, y: 0 });
      v.x = wx; v.y = wy;
      const wn = this.wn[i] || (this.wn[i] = { x: 0, y: 0 });
      wn.x = c * n.x - sn * n.y;
      wn.y = sn * n.x + c * n.y;
      if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
    }
    this.minX = minX; this.minY = minY; this.maxX = maxX; this.maxY = maxY;
  };

  Body.prototype.wake = function () { this.sleeping = false; this.sleepT = 0; };

  Body.prototype.contains = function (px, py, pad) {
    pad = pad || 0;
    const s = this.shape;
    if (s.type === 'circle') return Math.hypot(px - this.x, py - this.y) <= s.r + pad;
    for (let i = 0; i < this.wv.length; i++) {
      const v = this.wv[i], n = this.wn[i];
      if ((px - v.x) * n.x + (py - v.y) * n.y > pad) return false;
    }
    return true;
  };

  // World-space point -> local (body) space
  Body.prototype.toLocal = function (px, py) {
    const c = Math.cos(-this.a), s = Math.sin(-this.a);
    const dx = px - this.x, dy = py - this.y;
    return { x: c * dx - s * dy, y: s * dx + c * dy };
  };
  Body.prototype.toWorld = function (lx, ly) {
    const c = Math.cos(this.a), s = Math.sin(this.a);
    return { x: this.x + c * lx - s * ly, y: this.y + s * lx + c * ly };
  };

  Body.prototype.impulse = function (ix, iy, rx, ry) {
    this.vx += ix * this.im;
    this.vy += iy * this.im;
    this.w += this.iI * cross(rx, ry, ix, iy);
  };

  // ---------- Collision detection ----------
  // Each returns { n:{x,y} (A->B), pen, contacts:[{x,y}] } or null

  function circleCircle(A, B) {
    const dx = B.x - A.x, dy = B.y - A.y;
    const r = A.shape.r + B.shape.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r * r) return null;
    const d = Math.sqrt(d2);
    if (d < 1e-6) return { n: { x: 0, y: 1 }, pen: A.shape.r, contacts: [{ x: A.x, y: A.y }] };
    const nx = dx / d, ny = dy / d;
    return { n: { x: nx, y: ny }, pen: r - d, contacts: [{ x: A.x + nx * A.shape.r, y: A.y + ny * A.shape.r }] };
  }

  // P = polygon, C = circle ; normal from P to C
  function polyCircle(P, C) {
    const r = C.shape.r;
    const v = P.wv, nn = P.wn, n = v.length;
    let sep = -Infinity, face = 0;
    for (let i = 0; i < n; i++) {
      const s = (C.x - v[i].x) * nn[i].x + (C.y - v[i].y) * nn[i].y;
      if (s > r) return null;
      if (s > sep) { sep = s; face = i; }
    }
    const v1 = v[face], v2 = v[(face + 1) % n];
    if (sep < 1e-6) {
      const N = nn[face];
      return { n: { x: N.x, y: N.y }, pen: r - sep, contacts: [{ x: C.x - N.x * r, y: C.y - N.y * r }] };
    }
    const d1 = (C.x - v1.x) * (v2.x - v1.x) + (C.y - v1.y) * (v2.y - v1.y);
    const d2 = (C.x - v2.x) * (v1.x - v2.x) + (C.y - v2.y) * (v1.y - v2.y);
    let vx, vy;
    if (d1 <= 0) { vx = v1.x; vy = v1.y; }
    else if (d2 <= 0) { vx = v2.x; vy = v2.y; }
    else {
      const N = nn[face];
      return { n: { x: N.x, y: N.y }, pen: r - sep, contacts: [{ x: C.x - N.x * r, y: C.y - N.y * r }] };
    }
    const dx = C.x - vx, dy = C.y - vy;
    const d = Math.hypot(dx, dy);
    if (d > r) return null;
    const nx = dx / (d || 1), ny = dy / (d || 1);
    return { n: { x: nx, y: ny }, pen: r - d, contacts: [{ x: vx, y: vy }] };
  }

  function leastPen(A, B) {
    let best = -Infinity, idx = 0;
    const av = A.wv, an = A.wn, bv = B.wv;
    for (let i = 0; i < av.length; i++) {
      const n = an[i];
      // support point of B in direction -n
      let minD = Infinity, sx = 0, sy = 0;
      for (let j = 0; j < bv.length; j++) {
        const d = bv[j].x * n.x + bv[j].y * n.y;
        if (d < minD) { minD = d; sx = bv[j].x; sy = bv[j].y; }
      }
      const d = (sx - av[i].x) * n.x + (sy - av[i].y) * n.y;
      if (d > best) { best = d; idx = i; }
    }
    return { d: best, i: idx };
  }

  function clip(nx, ny, c, f) {
    const out = [];
    const d1 = nx * f[0].x + ny * f[0].y - c;
    const d2 = nx * f[1].x + ny * f[1].y - c;
    if (d1 <= 0) out.push(f[0]);
    if (d2 <= 0) out.push(f[1]);
    if (d1 * d2 < 0) {
      const t = d1 / (d1 - d2);
      out.push({ x: f[0].x + t * (f[1].x - f[0].x), y: f[0].y + t * (f[1].y - f[0].y) });
    }
    return out;
  }

  function polyPoly(A, B) {
    const pa = leastPen(A, B);
    if (pa.d >= 0) return null;
    const pb = leastPen(B, A);
    if (pb.d >= 0) return null;
    let ref, inc, ri, flip;
    if (pa.d >= pb.d * 0.95 + pa.d * 0.01) { ref = A; inc = B; ri = pa.i; flip = false; }
    else { ref = B; inc = A; ri = pb.i; flip = true; }

    const rn = ref.wn[ri];
    // incident face: most anti-parallel normal
    let ii = 0, minDot = Infinity;
    for (let i = 0; i < inc.wn.length; i++) {
      const d = rn.x * inc.wn[i].x + rn.y * inc.wn[i].y;
      if (d < minDot) { minDot = d; ii = i; }
    }
    let face = [inc.wv[ii], inc.wv[(ii + 1) % inc.wv.length]];
    const v1 = ref.wv[ri], v2 = ref.wv[(ri + 1) % ref.wv.length];
    let tx = v2.x - v1.x, ty = v2.y - v1.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    face = clip(-tx, -ty, -(tx * v1.x + ty * v1.y), face);
    if (face.length < 2) return null;
    face = clip(tx, ty, tx * v2.x + ty * v2.y, face);
    if (face.length < 2) return null;

    const refC = rn.x * v1.x + rn.y * v1.y;
    const contacts = [];
    let pen = 0;
    for (let k = 0; k < face.length; k++) {
      const s = rn.x * face[k].x + rn.y * face[k].y - refC;
      if (s <= 0) { contacts.push({ x: face[k].x, y: face[k].y }); pen -= s; }
    }
    if (!contacts.length) return null;
    pen /= contacts.length;
    const n = flip ? { x: -rn.x, y: -rn.y } : { x: rn.x, y: rn.y };
    return { n, pen, contacts };
  }

  function collide(A, B) {
    const ta = A.shape.type, tb = B.shape.type;
    if (ta === 'circle' && tb === 'circle') return circleCircle(A, B);
    if (ta === 'poly' && tb === 'circle') return polyCircle(A, B);
    if (ta === 'circle' && tb === 'poly') {
      const m = polyCircle(B, A);
      if (m) { m.n.x = -m.n.x; m.n.y = -m.n.y; }
      return m;
    }
    return polyPoly(A, B);
  }

  // ---------- World ----------

  function World(opts) {
    opts = opts || {};
    this.bodies = [];
    this.gx = 0;
    this.gy = opts.gravity == null ? 1400 : opts.gravity;
    this.iterations = opts.iterations || 8;
    this.maxSpeed = opts.maxSpeed || 2200;
    this.onCollide = null; // (A, B, impactSpeed, contact)
    this.wakeSpeed = opts.wakeSpeed || 40;
  }

  World.prototype.add = function (b) { this.bodies.push(b); return b; };
  World.prototype.remove = function (b) {
    const i = this.bodies.indexOf(b);
    if (i >= 0) this.bodies.splice(i, 1);
  };
  World.prototype.wakeAll = function () { this.bodies.forEach(b => b.wake()); };
  World.prototype.wakeNear = function (b, pad) {
    pad = pad || 40;
    this.bodies.forEach(o => {
      if (o.sleeping && o.maxX > b.minX - pad && o.minX < b.maxX + pad && o.maxY > b.minY - pad && o.minY < b.maxY + pad) o.wake();
    });
  };

  World.prototype.queryPoint = function (x, y, pad, filter) {
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      if (filter && !filter(b)) continue;
      if (b.contains(x, y, pad)) return b;
    }
    return null;
  };

  const immobile = b => b.isStatic || (b.sleeping && !b.held);

  World.prototype.step = function (dt) {
    const bodies = this.bodies;
    const nb = bodies.length;

    // 1. forces
    for (let i = 0; i < nb; i++) {
      const b = bodies[i];
      if (immobile(b)) continue;
      b.vx += this.gx * dt;
      b.vy += this.gy * dt;
    }

    // 2. geometry + broad/narrow phase
    for (let i = 0; i < nb; i++) bodies[i].update();
    const ms = [];
    for (let i = 0; i < nb; i++) {
      const A = bodies[i];
      for (let j = i + 1; j < nb; j++) {
        const B = bodies[j];
        const ia = immobile(A), ib = immobile(B);
        if (ia && ib) continue;
        if (A.maxX < B.minX || B.maxX < A.minX || A.maxY < B.minY || B.maxY < A.minY) continue;
        const m = collide(A, B);
        if (!m) continue;
        m.A = A; m.B = B;
        // wake sleepers hit hard enough
        if (A.sleeping && !A.isStatic && Math.hypot(B.vx, B.vy) + Math.abs(B.w) * 30 > this.wakeSpeed) A.wake();
        if (B.sleeping && !B.isStatic && Math.hypot(A.vx, A.vy) + Math.abs(A.w) * 30 > this.wakeSpeed) B.wake();
        ms.push(m);
      }
    }

    // 3. report impacts
    if (this.onCollide) {
      for (let k = 0; k < ms.length; k++) {
        const m = ms[k], A = m.A, B = m.B, c = m.contacts[0];
        const rax = c.x - A.x, ray = c.y - A.y, rbx = c.x - B.x, rby = c.y - B.y;
        const rvx = (B.vx - B.w * rby) - (A.vx - A.w * ray);
        const rvy = (B.vy + B.w * rbx) - (A.vy + A.w * rax);
        const vn = rvx * m.n.x + rvy * m.n.y;
        if (vn < -60) this.onCollide(A, B, -vn, c);
      }
    }

    // 4. solve velocities
    const restingV2 = (this.gy * dt) * (this.gy * dt) * 2 + 1;
    for (let it = 0; it < this.iterations; it++) {
      for (let k = 0; k < ms.length; k++) solve(ms[k], restingV2);
    }

    // 5. integrate
    const ms2 = this.maxSpeed * this.maxSpeed;
    for (let i = 0; i < nb; i++) {
      const b = bodies[i];
      if (immobile(b)) { b.vx = b.vy = b.w = 0; continue; }
      const sp2 = b.vx * b.vx + b.vy * b.vy;
      if (sp2 > ms2) { const k = this.maxSpeed / Math.sqrt(sp2); b.vx *= k; b.vy *= k; }
      if (b.w > 25) b.w = 25; else if (b.w < -25) b.w = -25;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.w * dt;
      b.vx *= 0.9995; b.vy *= 0.9995; b.w *= 0.997;
    }

    // 6. positional correction
    for (let k = 0; k < ms.length; k++) {
      const m = ms[k], A = m.A, B = m.B;
      const imA = immobile(A) ? 0 : A.im, imB = immobile(B) ? 0 : B.im;
      const sum = imA + imB;
      if (!sum) continue;
      const corr = Math.max(m.pen - 0.4, 0) / sum * 0.45;
      A.x -= m.n.x * corr * imA; A.y -= m.n.y * corr * imA;
      B.x += m.n.x * corr * imB; B.y += m.n.y * corr * imB;
    }

    // 7. sleep
    for (let i = 0; i < nb; i++) {
      const b = bodies[i];
      if (b.isStatic || b.sleeping) continue;
      if (b.held) { b.sleepT = 0; continue; }
      const sp2 = b.vx * b.vx + b.vy * b.vy;
      if (sp2 < 64 && b.w * b.w < 0.04) {
        b.sleepT += dt;
        if (b.sleepT > 0.5) { b.sleeping = true; b.vx = b.vy = b.w = 0; }
      } else b.sleepT = 0;
    }
  };

  function solve(m, restingV2) {
    const A = m.A, B = m.B, n = m.n;
    const imA = immobile(A) ? 0 : A.im, imB = immobile(B) ? 0 : B.im;
    const iIA = immobile(A) ? 0 : A.iI, iIB = immobile(B) ? 0 : B.iI;
    if (imA + imB === 0) return;
    const cc = m.contacts.length;
    const e = Math.max(A.restitution, B.restitution);
    const sf = Math.sqrt(A.sf * B.sf), df = Math.sqrt(A.df * B.df);

    for (let k = 0; k < cc; k++) {
      const c = m.contacts[k];
      const rax = c.x - A.x, ray = c.y - A.y, rbx = c.x - B.x, rby = c.y - B.y;
      let rvx = (B.vx - B.w * rby) - (A.vx - A.w * ray);
      let rvy = (B.vy + B.w * rbx) - (A.vy + A.w * rax);
      const vn = rvx * n.x + rvy * n.y;
      if (vn > 0) continue;
      const raN = cross(rax, ray, n.x, n.y), rbN = cross(rbx, rby, n.x, n.y);
      const inv = imA + imB + raN * raN * iIA + rbN * rbN * iIB;
      const ee = (rvx * rvx + rvy * rvy < restingV2) ? 0 : e;
      const j = -(1 + ee) * vn / inv / cc;

      applyImp(A, -n.x * j, -n.y * j, rax, ray, imA, iIA);
      applyImp(B, n.x * j, n.y * j, rbx, rby, imB, iIB);

      // friction
      rvx = (B.vx - B.w * rby) - (A.vx - A.w * ray);
      rvy = (B.vy + B.w * rbx) - (A.vy + A.w * rax);
      const vn2 = rvx * n.x + rvy * n.y;
      let tx = rvx - n.x * vn2, ty = rvy - n.y * vn2;
      const tl = Math.hypot(tx, ty);
      if (tl < 1e-6) continue;
      tx /= tl; ty /= tl;
      const raT = cross(rax, ray, tx, ty), rbT = cross(rbx, rby, tx, ty);
      const invT = imA + imB + raT * raT * iIA + rbT * rbT * iIB;
      let jt = -(rvx * tx + rvy * ty) / invT / cc;
      if (Math.abs(jt) < 1e-7) continue;
      if (Math.abs(jt) > j * sf) jt = Math.sign(jt) * j * df; // Coulomb: kinetic friction
      applyImp(A, -tx * jt, -ty * jt, rax, ray, imA, iIA);
      applyImp(B, tx * jt, ty * jt, rbx, rby, imB, iIB);
    }
  }

  function applyImp(b, ix, iy, rx, ry, im, iI) {
    if (!im) return;
    b.vx += ix * im;
    b.vy += iy * im;
    b.w += iI * cross(rx, ry, ix, iy);
  }

  // ---------- Factories ----------

  PR.physics = {
    World,
    Body,
    circle(x, y, r, o) {
      o = o || {};
      const d = o.density || 0.001;
      const mass = d * Math.PI * r * r;
      const shape = { type: 'circle', r, mass, inertia: 0.5 * mass * r * r, radius: r };
      return new Body(shape, x, y, o);
    },
    box(x, y, w, h, o) {
      o = o || {};
      return new Body(makePoly(boxVerts(w, h), o.density || 0.001), x, y, o);
    },
    poly(x, y, verts, o) {
      o = o || {};
      return new Body(makePoly(verts, o.density || 0.001), x, y, o);
    }
  };
})();
