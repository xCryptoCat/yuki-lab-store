import * as THREE from 'three';
import { createMaterials } from './materials.js';
import {
  V, V2, DEG, grp, pivot, add, sphere, orient, profileLookup, subdivide, smooth, extrude, decal, ribbon,
  limb, place, ring, rrect, ellipse, poly, yShape, basisQ,
} from './helpers.js';

/**
 * Builds Yukizo (meters, y-up, feet on y≈0, facing +z) and returns the model
 * plus a small posing API used by the animation layer:
 *
 *   root          THREE.Group — the exportable model
 *   fx, arms      expression / arm state read by pose()
 *   pose(t, sway, amp, salute, look, grow)
 *   setEyes(open, wink), aimIris(ox, oy), rest()
 *   furShells     display-only shell meshes (removed for export)
 */
export function buildYukizo() {
  const M = createMaterials();

  /* ---------- rig ---------- */
  const root = new THREE.Group();
  root.name = 'yukizo';
  const rig = grp(root, 'rig');
  const lower = grp(rig, 'legs');
  const upper = grp(rig, 'upper');

  /* ---------- legs & feet ---------- */
  for (const sx of [-1, 1]) {
    const s = sx < 0 ? 'R' : 'L';
    add(lower, `trouser_${s}`, new THREE.CylinderGeometry(0.074, 0.08, 0.18, 40), M.navy, [sx * 0.095, 0.16, 0]);
    add(lower, `trouser_hem_${s}`, new THREE.TorusGeometry(0.078, 0.009, 12, 40), M.navyDark, [sx * 0.095, 0.074, 0], null, [Math.PI / 2, 0, 0]);
    const foot = grp(lower, `foot_${s}`);
    foot.position.set(sx * 0.097, 0.052, 0.024);
    foot.rotation.y = sx * 0.12;
    add(foot, `foot_${s}`, sphere(1), M.skin, [0, 0, 0], [0.09, 0.056, 0.112]);
    for (const i of [-1, 0, 1]) {
      const x = i * 0.036, y = -0.016, z = 0.112 * Math.sqrt(1 - (x / 0.09) ** 2 - (y / 0.056) ** 2);
      add(foot, `toenail_${s}${i + 2}`, sphere(1, 24), M.nail, [x, y, z - 0.004], [0.021, 0.017, 0.011], [0, x * 4, 0]);
    }
  }

  /* ---------- body (lathe jacket) ---------- */
  const BZ = 0.86;
  const bodyPts = new THREE.SplineCurve([
    V2(0.001, 0.15), V2(0.15, 0.158), V2(0.205, 0.2), V2(0.232, 0.29), V2(0.228, 0.4),
    V2(0.205, 0.5), V2(0.168, 0.585), V2(0.11, 0.64), V2(0.001, 0.665),
  ]).getPoints(80).map((p) => V2(p.x * 1.1, p.y));
  const bodyR = profileLookup(bodyPts);
  const bodyZ = (x, y) => BZ * Math.sqrt(Math.max(0, bodyR(y) ** 2 - x * x));
  const bodyAt = (phi, y, lift = 0) => {
    const r = bodyR(y), x = r * Math.sin(phi), z = BZ * r * Math.cos(phi);
    const dr = (bodyR(y + 0.002) - bodyR(y - 0.002)) / 0.004;
    const n = V(x, -r * dr, z / (BZ * BZ)).normalize();
    return { p: V(x, y, z).addScaledVector(n, lift), n };
  };
  add(upper, 'jacket', new THREE.LatheGeometry(bodyPts, 80), M.navy, [0, 0, 0], [1, 1, BZ]);

  // belt + buckle
  const BELT_R = 0.262, beltZ = (x) => BZ * Math.sqrt(Math.max(0, BELT_R ** 2 - x * x));
  add(upper, 'belt', new THREE.CylinderGeometry(BELT_R, BELT_R, 0.042, 80, 1, true), M.leather, [0, 0.29, 0], [1, 1, BZ]);
  const buckle = rrect(0.066, 0.05, 0.01);
  buckle.holes.push(new THREE.Path(rrect(0.04, 0.026, 0.005).getPoints(8)));
  decal(upper, 'belt_buckle', buckle, M.gold, beltZ, { at: [0, 0.29], depth: 0.006, lift: 0.0005 });
  decal(upper, 'belt_buckle_bar', rrect(0.006, 0.026, 0.002), M.gold, beltZ, { at: [0, 0.29], depth: 0.004, lift: 0.001 });

  // collar, shirt, tie
  decal(upper, 'shirt_v', poly([[-0.066, 0.642], [0.066, 0.642], [0, 0.548]]), M.shirt, bodyZ, { lift: 0.002 });
  for (const sx of [-1, 1]) {
    const S = [];
    for (let i = 0; i <= 28; i++) {
      const u = i / 28, y = 0.646 - u * 0.1, x = sx * (0.079 * (1 - u) + 0.012 * u);
      S.push(bodyAt(Math.asin(Math.max(-0.97, Math.min(0.97, x / bodyR(y)))), y, 0.0032));
    }
    add(upper, `lapel_${sx < 0 ? 'R' : 'L'}`, ribbon(S, 0.026, 0.006), M.navy);
  }
  for (const sx of [-1, 1]) {
    const s = sx < 0 ? 'R' : 'L';
    decal(upper, `shirt_collar_${s}`, poly([[sx * 0.05, 0.645], [sx * 0.006, 0.606], [sx * 0.052, 0.592]]), M.shirt, bodyZ, { depth: 0.003, lift: 0.0085 });
  }
  decal(upper, 'tie_knot', rrect(0.024, 0.02, 0.006), M.tie, bodyZ, { at: [0, 0.612], depth: 0.005, lift: 0.008 });
  decal(upper, 'tie_blade', poly([[-0.01, 0.603], [0.01, 0.603], [0.02, 0.562], [0, 0.54], [-0.02, 0.562]]), M.tie, bodyZ, { depth: 0.004, lift: 0.006 });

  // satchel strap path (φ, y) on the jacket surface: hip → over left shoulder → back
  const strapCurve = new THREE.CatmullRomCurve3(
    [[-58, 0.322], [-38, 0.37], [-12, 0.445], [14, 0.52], [38, 0.585], [62, 0.628], [90, 0.645], [118, 0.628], [142, 0.585], [166, 0.52], [192, 0.445], [218, 0.37], [240, 0.33], [256, 0.318]]
      .map(([d, y]) => V(d * DEG, y, 0))
  );
  const strapFront = [];
  for (let i = 0; i <= 60; i++) {
    const q = strapCurve.getPoint(i / 160);
    strapFront.push(V2(bodyR(q.y) * Math.sin(q.x), q.y));
  }
  const nearStrap = (x, y, d) => strapFront.some((p) => Math.hypot(p.x - x, p.y - y) < d);

  // jacket details
  {
    const S = [];
    for (let i = 0; i <= 40; i++) S.push(bodyAt(0, 0.548 - (i / 40) * 0.37, 0.0012));
    add(upper, 'jacket_seam', ribbon(S, 0.0045, 0.0018), M.navyDark);
  }
  decal(upper, 'emblem_Y_chest', yShape(0.066), M.gold, bodyZ, { at: [0.145, 0.515], depth: 0.006, lift: 0 });
  const flap = new THREE.Shape();
  flap.moveTo(-0.036, 0.014); flap.lineTo(0.036, 0.014); flap.lineTo(0.036, -0.002);
  flap.quadraticCurveTo(0.03, -0.016, 0, -0.016); flap.quadraticCurveTo(-0.03, -0.016, -0.036, -0.002); flap.closePath();
  decal(upper, 'pocket_flap_R', flap, M.navy, bodyZ, { at: [-0.118, 0.488], depth: 0.005, lift: 0.001 });
  add(upper, 'pocket_button_R', sphere(0.008, 20), M.gold, [-0.118, 0.48, bodyZ(-0.118, 0.48) + 0.008]);
  for (const y of [0.53, 0.43, 0.35])
    if (!nearStrap(0, y, 0.035)) {
      const { p, n } = bodyAt(0, y, 0.003);
      orient(add(upper, 'button', sphere(1, 24), M.gold, [p.x, p.y, p.z], [0.013, 0.013, 0.007]), n);
    }

  /* ---------- head ---------- */
  const H = { y: 0.88, rx: 0.28, ry: 0.238, rz: 0.25 };
  const headW = (y) => 1 + 0.075 * THREE.MathUtils.smoothstep((H.y - y) / H.ry, -0.7, 1);
  const headRX = (y) => H.rx * headW(y);
  const faceZ = (x, y) => H.rz * Math.sqrt(Math.max(0, 1 - (x / headRX(y)) ** 2 - ((y - H.y) / H.ry) ** 2));
  const headAt = (x, y, lift = 0) => {
    const z = faceZ(x, y);
    const n = V(x / headRX(y) ** 2, (y - H.y) / H.ry ** 2, z / H.rz ** 2).normalize();
    return { p: V(x, y, z).addScaledVector(n, lift), n };
  };

  const headP = pivot(upper, 'head', V(0, 0.64, 0)), HG = headP.inner;
  {
    const g = sphere(1, 72), p = g.attributes.position, nn = g.attributes.normal, v = V(0, 0, 0);
    for (let i = 0; i < p.count; i++) {
      const w = headW(H.y + p.getY(i) * H.ry);
      p.setX(i, p.getX(i) * w);
      v.set(nn.getX(i) / w, nn.getY(i), nn.getZ(i)).normalize();
      nn.setXYZ(i, v.x, v.y, v.z);
    }
    add(HG, 'head', g, M.skin, [0, H.y, 0], [H.rx, H.ry, H.rz]);
  }

  const ears = {}, eyes = [], irises = [], brows = [];
  for (const sx of [-1, 1]) {
    const s = sx < 0 ? 'R' : 'L';
    const ear = grp(HG, `ear_${s}`);
    ear.position.set(sx * 0.25, 0.9, -0.04);
    ear.rotation.set(0.05, sx * 0.3, -sx * 0.16);
    add(ear, `ear_${s}`, sphere(1, 56), M.skin, [sx * 0.1, 0, 0], [0.2, 0.226, 0.048]);
    add(ear, `ear_inner_${s}`, sphere(1, 48), M.pink, [sx * 0.112, -0.012, 0.028], [0.148, 0.17, 0.022]);
    ears[s] = { g: ear, rest: ear.rotation.y, restZ: ear.rotation.z, sx };

    const { p, n } = headAt(sx * 0.122, 0.9);
    const eye = grp(HG, `eye_${s}`);
    eye.position.copy(p);
    orient(eye, n);
    const lid = grp(eye, `eyelid_${s}`);
    add(lid, `eye_white_${s}`, sphere(1, 40), M.sclera, [0, 0, -0.005], [0.038, 0.053, 0.018]);
    const iris = grp(lid, `iris_${s}`);
    add(iris, `iris_${s}`, sphere(1, 40), M.eye, [0, 0, 0.002], [0.0345, 0.0495, 0.013]);
    add(iris, `pupil_${s}`, sphere(1, 40), M.pupil, [0, 0.005, 0.0042], [0.0298, 0.0428, 0.0118]);
    add(iris, `eye_glint_big_${s}`, sphere(0.0118, 24), M.glint, [-0.0105, 0.019, 0.0135], [1, 1, 0.45]);
    add(iris, `eye_glint_small_${s}`, sphere(0.0055, 16), M.glint, [0.0105, -0.017, 0.0138], [1, 1, 0.45]);
    eyes.push(lid);
    irises.push(iris);

    const brow = new THREE.Shape();
    brow.moveTo(-0.03, 0);
    brow.quadraticCurveTo(0, 0.021, 0.03, 0);
    brow.quadraticCurveTo(0, 0.0115, -0.03, 0);
    brows.push(decal(HG, `brow_${s}`, brow, M.brow, faceZ, { at: [sx * 0.124, 0.982], rot: -sx * 0.12, depth: 0.004, lift: 0.001 }));
    {
      const cx = sx * 0.184, cy = 0.812, rx = 0.05, ry = 0.036;
      const ch = decal(HG, `cheek_${s}`, ellipse(rx, ry), M.blush, faceZ, { at: [cx, cy], lift: 0.0018 });
      const cp = ch.geometry.attributes.position, uv = ch.geometry.attributes.uv;
      for (let i = 0; i < cp.count; i++) uv.setXY(i, (cp.getX(i) - cx) / (2 * rx) + 0.5, (cp.getY(i) - cy) / (2 * ry) + 0.5);
      uv.needsUpdate = true;
      ch.renderOrder = 2;
    }
  }

  // mouth — closed smile at rest; morph target "open" (exports to GLB)
  function morphPatch(name, m, closed, open, lift, NU = 44, NV = 6) {
    const build = ([T, B]) => {
      const pos = [];
      for (let j = 0; j <= NV; j++)
        for (let i = 0; i <= NU; i++) {
          const u = -1 + (2 * i) / NU, a = T(u), b = B(u), v = j / NV;
          const x = a[0] + (b[0] - a[0]) * v, y = a[1] + (b[1] - a[1]) * v;
          pos.push(x, y, faceZ(x, y) + lift);
        }
      return new THREE.Float32BufferAttribute(pos, 3);
    };
    const idx = [], uv = [];
    for (let j = 0; j < NV; j++)
      for (let i = 0; i < NU; i++) {
        const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) uv.push(i / NU, j / NV);
    const g = new THREE.BufferGeometry();
    g.setIndex(idx);
    g.setAttribute('position', build(closed));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const go = new THREE.BufferGeometry();
    go.setIndex(idx);
    go.setAttribute('position', build(open));
    go.computeVertexNormals();
    go.attributes.position.name = 'open';
    g.setAttribute('normal', go.attributes.normal.clone()); // closed tongue is degenerate → borrow valid normals
    g.morphAttributes.position = [go.attributes.position];
    g.morphAttributes.normal = [go.attributes.normal];
    const mesh = add(HG, name, g, m);
    mesh.userData.decal = true;
    return mesh;
  }
  const mouthTop = (u) => 0.707 + 0.016 * u * u + 0.007 * Math.pow(u * u, 6);
  const mouth = morphPatch('mouth', M.mouth,
    [(u) => [0.058 * u, mouthTop(u)], (u) => [0.058 * u, mouthTop(u) - 0.0032 - 0.0085 * (1 - u * u)]],
    [(u) => [0.064 * u, 0.736 - 0.006 * (1 - u * u)], (u) => [0.064 * u, 0.736 - 0.056 * Math.pow(1 - u * u, 0.65)]],
    0.0015);
  const tongue = morphPatch('tongue', M.tongue,
    [(u) => [0.012 * u, 0.7048], (u) => [0.012 * u, 0.7048]],
    [(u) => [0.03 * u, 0.693 + 0.005 * (1 - u * u)], (u) => [0.028 * u, 0.693 - 0.0105 * Math.pow(1 - u * u, 0.7)]],
    0.003, 24, 4);
  tongue.visible = false;
  const setMouth = (k) => {
    mouth.morphTargetInfluences[0] = k;
    tongue.morphTargetInfluences[0] = k;
    tongue.visible = k > 0.02;
  };

  // trunk — one continuous sculpted mesh: filleted into the face, oval section,
  // creases on top, flared tip with a soft dome + nostrils. Deformed per-frame (bend/curl).
  const TRUNK = (() => {
    const base = V(0, 0.855, 0.2);
    const rest = [base, V(0, 0.836, 0.252), V(0.004, 0.808, 0.292), V(0.016, 0.788, 0.32), V(0.033, 0.785, 0.341), V(0.048, 0.797, 0.354), V(0.057, 0.815, 0.357)];
    const curve = new THREE.CatmullRomCurve3(rest.map((p) => p.clone()), false, 'centripetal');
    const RINGS = 150, SEG = 44, CAP = 12, ROWS = RINGS + 1 + CAP, COLS = SEG + 1;
    const sm = THREE.MathUtils.smoothstep;
    const radius = (t) => 0.037 + 0.017 * Math.pow(1 - t, 1.2) + 0.004 * sm(t, 0.8, 0.96) + 0.03 * Math.pow(1 - sm(t, 0.04, 0.42), 1.6);
    const crease = (t, s) => {
      const band = sm(t, 0.28, 0.36) * (1 - sm(t, 0.72, 0.8));
      return 1 - 0.06 * band * Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * (t * 4.2 - 0.1)), 5) * Math.pow(Math.max(0, s), 0.7);
    };
    const g = new THREE.BufferGeometry(), pos = new Float32Array(ROWS * COLS * 3), uv = [], idx = [];
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) uv.push((i / SEG) * 0.35, (j / ROWS) * 0.45);
    for (let j = 0; j < ROWS - 1; j++)
      for (let i = 0; i < SEG; i++) {
        const p = j * COLS + i, q = p + COLS;
        idx.push(p, p + 1, q, p + 1, q + 1, q);
      }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const mesh = add(HG, 'trunk', g, M.skin);
    const nos = [0, 1].map(() => add(HG, 'trunk_nostril', sphere(1, 20), M.nostril));
    const T = V(0, 0, 0), B = V(1, 0, 0), N = V(0, 0, 0), c = V(0, 0, 0), d = V(0, 0, 0), tmp = V(0, 0, 0), eu = new THREE.Euler(), qq = new THREE.Quaternion();
    const ax = (t) => 1.07 - 0.05 * t, ay = (t) => 0.94 + 0.04 * t;
    function fillRing(j, c, B, N, rad, sx, sy, t) {
      for (let i = 0; i < COLS; i++) {
        const th = (i / SEG) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), rr = rad * (t >= 0 ? crease(t, sn) : 1);
        const k = (j * COLS + i) * 3;
        pos[k] = c.x + B.x * cs * rr * sx + N.x * sn * rr * sy;
        pos[k + 1] = c.y + B.y * cs * rr * sx + N.y * sn * rr * sy;
        pos[k + 2] = c.z + B.z * cs * rr * sx + N.z * sn * rr * sy;
      }
    }
    function set(swing = 0, nod = 0, curl = 0) {
      for (let i = 1; i < rest.length; i++) {
        const w = i / (rest.length - 1), w2 = w * w;
        d.copy(rest[i]).sub(base);
        d.x += curl * 0.008 * w2;
        d.y += curl * 0.016 * w2 * w;
        d.z -= curl * 0.01 * w2;
        qq.setFromEuler(eu.set(nod * Math.pow(w, 1.4), swing * Math.pow(w, 1.4), 0));
        curve.points[i].copy(base).add(d.applyQuaternion(qq));
      }
      curve.updateArcLengths();
      B.set(1, 0, 0);
      for (let j = 0; j <= RINGS; j++) {
        const t = j / RINGS;
        curve.getPointAt(t, c);
        curve.getTangentAt(t, T);
        B.addScaledVector(T, -T.dot(B)).normalize();
        N.crossVectors(T, B);
        fillRing(j, c, B, N, radius(t), ax(t), ay(t), t);
      }
      const rt = radius(1), sx = ax(1), sy = ay(1);
      for (let k = 1; k <= CAP; k++) {
        const an = ((k / CAP) * Math.PI) / 2;
        tmp.copy(c).addScaledVector(T, rt * 0.6 * Math.sin(an));
        fillRing(RINGS + k, tmp, B, N, rt * Math.cos(an) + 1e-5, sx, sy, -1);
      }
      for (let s = 0; s < 2; s++) {
        const off = (s ? 1 : -1) * 0.0128, h = rt * 0.6 * Math.sqrt(Math.max(0, 1 - (off / (rt * sx)) ** 2));
        const n = nos[s];
        n.position.copy(c).addScaledVector(T, h - 0.0016).addScaledVector(B, off).addScaledVector(N, 0.0015);
        orient(n, tmp.copy(T).addScaledVector(B, (s ? 1 : -1) * 0.35).normalize(), N.clone());
        n.scale.set(0.0062, 0.0092, 0.0035);
      }
      g.attributes.position.needsUpdate = true;
      g.computeVertexNormals();
      g.computeBoundingSphere();
    }
    set();
    return { set, mesh };
  })();

  /* ---------- officer cap ---------- */
  const cap = grp(HG, 'cap');
  cap.position.set(0, 1.02, -0.01);
  cap.rotation.set(-0.2, 0, 0.05);
  cap.scale.set(1.17, 1.1, 1.14);
  const crownPts = new THREE.SplineCurve([V2(0.2, 0.035), V2(0.21, 0.065), V2(0.234, 0.105), V2(0.249, 0.13), V2(0.246, 0.152), V2(0.222, 0.172), V2(0.145, 0.187), V2(0.001, 0.192)]).getPoints(48);
  const crownR = profileLookup(crownPts);
  add(cap, 'cap_crown', new THREE.LatheGeometry(crownPts, 80), M.navy);
  add(cap, 'cap_band', new THREE.CylinderGeometry(0.201, 0.201, 0.058, 80, 1, true), M.gloss, [0, 0.03, 0]);
  add(cap, 'cap_underside', new THREE.CircleGeometry(0.2, 48), M.navyDark, [0, 0.001, 0], null, [Math.PI / 2, 0, 0]);
  for (const sx of [-1, 1]) add(cap, 'cap_button', sphere(1, 20), M.gold, [sx * 0.2, 0.026, 0.035], [0.013, 0.013, 0.007], [0, sx * 1.4, 0]);
  {
    const out = [], N = 32;
    for (let i = 0; i <= N; i++) {
      const a = Math.PI - (i / N) * Math.PI;
      out.push(V2(0.214 * Math.cos(a), 0.3 * Math.sin(a)));
    }
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI;
      out.push(V2(0.195 * Math.cos(a), 0.195 * Math.sin(a)));
    }
    let g = new THREE.ExtrudeGeometry(new THREE.Shape(out), { depth: 0.01, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 });
    g.rotateX(Math.PI / 2);
    g = subdivide(g, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), dd = z - Math.sqrt(Math.max(0, 0.195 ** 2 - x * x));
      if (dd > 0) p.setY(i, p.getY(i) - dd * 0.34);
    }
    add(cap, 'cap_visor', smooth(g), M.gloss, [0, 0.003, 0]);
  }
  decal(cap, 'cap_badge_Y', yShape(0.086), M.gold, (x, y) => Math.sqrt(Math.max(0, crownR(y) ** 2 - x * x)), { at: [0, 0.103], depth: 0.007, lift: 0.0005 });

  /* ---------- arms ---------- */
  const Y = V(0, 1, 0), Z = V(0, 0, 1);

  // character's right: presenting palm (hero) ↔ hanging at side ↔ salute
  const shR = V(-0.17, 0.56, 0), elR = V(-0.31, 0.5, 0.06), wrR = V(-0.42, 0.56, 0.14);
  const upR = limb(upper, 'sleeve_R_upper', shR, elR, 0.062, M.navy);
  const loR = limb(upper, 'sleeve_R_lower', elR, wrR, 0.056, M.navy);
  const dirR = wrR.clone().sub(elR).normalize();
  const cuffR = ring(upper, 'cuff_R', wrR, dirR, 0.052, 0.013, M.cream);
  const handR = grp(upper, 'hand_R');
  handR.position.copy(wrR).addScaledVector(dirR, 0.012);
  handR.rotation.set(-0.35, 0.45, 1.1);
  const armR = (() => {
    const L1 = elR.distanceTo(shR), L2 = wrR.distanceTo(elR);
    const d1P = elR.clone().sub(shR).normalize(), d2P = dirR.clone();
    const d1D = V(-0.66, -0.74, 0.12).normalize(), d2D = V(-0.4, -0.88, 0.26).normalize();
    const qD = basisQ(d2D, V(1, 0, 0.4));
    const d1 = V(0, 0, 0), d2 = V(0, 0, 0), el = V(0, 0, 0), wr = V(0, 0, 0), qA = new THREE.Quaternion(), qW = new THREE.Quaternion();
    const d1S = V(-0.16, 0.09, 0.03).normalize(), d2S = V(0.15, 0.75, 0.65).normalize();
    const qP = handR.quaternion.clone();
    const wrS = shR.clone().addScaledVector(d1S, L1).addScaledVector(d2S, L2);
    const fy = V(-0.25, 0.97, 0.16).sub(wrS.clone().addScaledVector(d2S, 0.012)).normalize();
    const fz = Z.clone().addScaledVector(fy, -Z.dot(fy)).normalize();
    const qS = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(fy, fz), fy, fz));
    return (up, sal, wave, swing = 0) => {
      d1.copy(d1D).lerp(d1P, up).lerp(d1S, sal); d1.z += swing * (1 - Math.max(up, sal)); d1.normalize();
      d2.copy(d2D).lerp(d2P, up).lerp(d2S, sal); d2.z += swing * 1.4 * (1 - Math.max(up, sal)); d2.normalize();
      el.copy(shR).addScaledVector(d1, L1);
      wr.copy(el).addScaledVector(d2, L2);
      place(upR, shR, el);
      place(loR, el, wr);
      cuffR.position.copy(wr);
      cuffR.quaternion.setFromUnitVectors(Z, d2);
      handR.position.copy(wr).addScaledVector(d2, 0.012);
      handR.quaternion.copy(qA.copy(qD).slerp(qP, up)).slerp(qS, sal).multiply(qW.setFromAxisAngle(Z, wave));
    };
  })();
  add(handR, 'glove_cuff_R', new THREE.CylinderGeometry(0.04, 0.044, 0.03, 32), M.glove, [0, 0.008, 0]);
  add(handR, 'palm_R', sphere(1, 40), M.glove, [0, 0.05, 0], [0.056, 0.058, 0.03]);
  for (let i = 0; i < 4; i++) {
    const x = -0.034 + i * 0.0225, len = i === 0 || i === 3 ? 0.026 : 0.034;
    add(handR, `finger_R${i + 1}`, new THREE.CapsuleGeometry(0.0155, len, 8, 20), M.glove, [x, 0.1 + len / 2 - (i === 0 ? 0.006 : 0), -0.002], null, [-0.12, 0, (i - 1.5) * -0.13]);
  }
  add(handR, 'thumb_R', new THREE.CapsuleGeometry(0.0175, 0.03, 8, 20), M.glove, [0.054, 0.045, 0.01], null, [0, 0, -0.85]);

  // character's left: fist on chest ↔ relaxed at side
  const shL = V(0.17, 0.56, 0), elL = V(0.28, 0.42, 0.08), wrL = V(0.17, 0.42, 0.17);
  const upL = limb(upper, 'sleeve_L_upper', shL, elL, 0.062, M.navy);
  const loL = limb(upper, 'sleeve_L_lower', elL, wrL, 0.056, M.navy);
  const dirL = wrL.clone().sub(elL).normalize();
  const cuffL = ring(upper, 'cuff_L', wrL, dirL, 0.052, 0.013, M.cream);
  const fist = grp(upper, 'fist_L');
  fist.position.copy(wrL).addScaledVector(dirL, 0.045);
  const armL = (() => {
    const L1 = elL.distanceTo(shL), L2 = wrL.distanceTo(elL);
    const d1C = elL.clone().sub(shL).normalize(), d2C = dirL.clone();
    const d1D = V(0.62, -0.78, 0.1).normalize(), d2D = V(0.3, -0.92, 0.24).normalize();
    const qC = new THREE.Quaternion(), qD = basisQ(V(0, 0.15, 1), d2D.clone().add(V(0.7, 0, 0)));
    const d1 = V(0, 0, 0), d2 = V(0, 0, 0), el = V(0, 0, 0), wr = V(0, 0, 0);
    return (up, swing = 0) => {
      d1.copy(d1D).lerp(d1C, up); d1.z += swing * (1 - up); d1.normalize();
      d2.copy(d2D).lerp(d2C, up); d2.z += swing * 1.4 * (1 - up); d2.normalize();
      el.copy(shL).addScaledVector(d1, L1);
      wr.copy(el).addScaledVector(d2, L2);
      place(upL, shL, el);
      place(loL, el, wr);
      cuffL.position.copy(wr);
      cuffL.quaternion.setFromUnitVectors(Z, d2);
      fist.position.copy(wr).addScaledVector(d2, 0.045);
      fist.quaternion.copy(qD).slerp(qC, up);
    };
  })();
  add(fist, 'fist_L', sphere(1, 40), M.glove, [0, 0, 0], [0.058, 0.054, 0.048]);
  for (let i = 0; i < 4; i++) add(fist, `knuckle_L${i + 1}`, sphere(0.018, 20), M.glove, [-0.012, -0.03 + i * 0.019, 0.034]);
  add(fist, 'thumb_L', new THREE.CapsuleGeometry(0.017, 0.032, 8, 20), M.glove, [-0.008, 0.042, 0.028], null, [0, 0.3, Math.PI / 2]);

  /* ---------- satchel ---------- */
  const bagAt = bodyAt(-68 * DEG, 0.24);
  const bagN = bagAt.n.clone().setY(0).normalize();
  const bag = grp(upper, 'satchel');
  bag.position.copy(bagAt.p).addScaledVector(bagN, 0.05);
  bag.scale.setScalar(1.36);
  orient(bag, bagN);
  bag.rotateZ(0.05);
  {
    const body = extrude(rrect(0.13, 0.112, 0.022), 0.04, 0.008);
    body.translate(0, 0, -0.02);
    add(bag, 'satchel_body', body, M.leather);
    const fl = new THREE.Shape();
    fl.moveTo(-0.069, 0.06); fl.lineTo(0.069, 0.06); fl.lineTo(0.069, 0.005);
    fl.quadraticCurveTo(0.069, -0.026, 0.036, -0.026); fl.lineTo(-0.036, -0.026);
    fl.quadraticCurveTo(-0.069, -0.026, -0.069, 0.005); fl.closePath();
    add(bag, 'satchel_flap', extrude(fl, 0.005, 0.002), M.leather, [0, 0, 0.029]);
    add(bag, 'satchel_flap_seam', new THREE.BoxGeometry(0.128, 0.004, 0.004), M.leatherD, [0, 0.054, 0.034]);
    add(bag, 'satchel_tab', extrude(rrect(0.024, 0.03, 0.006), 0.003, 0.0015), M.leatherD, [0, -0.026, 0.035]);
    add(bag, 'satchel_clasp', extrude(rrect(0.022, 0.014, 0.004), 0.004, 0.0015), M.gold, [0, -0.036, 0.038]);
  }
  bag.updateMatrix();
  const bagPt = (x, y) => V(x, y, 0).applyMatrix4(bag.matrix);
  {
    const S = [{ p: bagPt(0.07, 0.03), n: bagN }];
    for (let i = 0; i <= 160; i++) {
      const q = strapCurve.getPoint(i / 160);
      S.push(bodyAt(q.x, q.y, 0.0045));
    }
    S.push({ p: bagPt(-0.07, 0.03), n: bagN });
    add(upper, 'satchel_strap', ribbon(S, 0.032, 0.005), M.leather);
  }

  /* ---------- tail ---------- */
  const tailCurve = new THREE.CatmullRomCurve3([V(0, 0.24, -0.17), V(0.02, 0.2, -0.25), V(0.05, 0.19, -0.3), V(0.075, 0.215, -0.322)]);
  add(upper, 'tail', new THREE.TubeGeometry(tailCurve, 32, 0.013, 14, false), M.skin);
  {
    const e = tailCurve.getPointAt(1);
    add(upper, 'tail_tuft', sphere(1, 24), M.skinDark, [e.x, e.y + 0.012, e.z], [0.022, 0.032, 0.022], [0, 0, -0.5]);
  }

  /* ---------- shadows: everything casts + receives, except flat surface details ---------- */
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !o.userData.decal;
    o.receiveShadow = true;
  });

  /* ---------- fur shells (display only — removed for export) ---------- */
  const furShells = [];
  {
    // fur only where a plush toy is actually fuzzy: the skin. Fabric (uniform, cap, gloves) reads through its felt texture,
    // and the trunk stays clean so its fringe never haloes across the face.
    const NAMES = new Set(['head', 'ear_L', 'ear_R', 'foot_L', 'foot_R']);
    const hosts = [];
    root.traverse((o) => { if (o.isMesh && NAMES.has(o.name)) hosts.push(o); });
    const LAYERS = 5;
    for (const o of hosts)
      for (let i = 1; i <= LAYERS; i++) {
        const m = o.material.clone();
        m.name = o.material.name + '_fur';
        m.sheen *= 0.3; // sheen flares at grazing angles — on shells that read as white frost
        m.color.multiplyScalar(0.9); // edge fuzz sits in its own shadow: a shade darker than the face, never a glowing rim
        const u = { uFurOff: { value: 0.0009 * i }, uFurTh: { value: 0.12 * i }, uFurS: { value: o.scale.clone() } };
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u);
          sh.vertexShader = 'uniform float uFurOff;\nuniform vec3 uFurS;\nvarying vec3 vFurP;\n' + sh.vertexShader.replace('#include <project_vertex>',
            '#include <project_vertex>\n  mvPosition.xyz += normalize(transformedNormal) * uFurOff;\n  gl_Position = projectionMatrix * mvPosition;\n  vFurP = position * uFurS;');
          sh.fragmentShader = 'uniform float uFurTh;\nvarying vec3 vFurP;\n' + sh.fragmentShader.replace('#include <alphatest_fragment>',
            '{ float n = fract(sin(dot(floor(vFurP * 900.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);\n' +
            '  float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));\n' +
            '  float rim = 1.0 - smoothstep(0.08, 0.62, facing);\n' +            // fuzz shows only toward the silhouette
            '  float a = rim * (0.55 + 0.45 * n) * (1.0 - uFurTh) * 0.55;\n' +    // outer shells thinner → soft gradient halo
            '  if (a < 0.01) discard;\n' +
            '  diffuseColor.a = a;\n' +
            '  diffuseColor.rgb *= 0.97; }');
        };
        m.customProgramCacheKey = () => 'yukizo-fur';
        m.transparent = true; // blended shells build a smooth velvet halo (no sub-pixel stipple)
        m.depthWrite = false;
        const s = new THREE.Mesh(o.geometry, m);
        s.name = o.name + '_fur';
        s.castShadow = false;
        s.receiveShadow = true;
        s.userData.host = o;
        o.add(s);
        furShells.push(s);
      }
  }

  /* ---------- posing ---------- */
  const fx = { mouth: 0, brow: 0, perk: 0, lag: 0, nod: 0, twitchL: 0, twitchR: 0, squint: 0 };
  const arms = { r: 1, l: 1, wave: 0 };
  const LOOK_ZERO = { yaw: 0, pitch: 0 };

  /** t: seconds · sway/amp: idle weights · sal: salute 0..1 · look: {yaw,pitch} · grow: entrance scale */
  function pose(t, sway, amp, sal, look, grow) {
    // turntable drift is slow and irregular (two detuned waves), never a metronome
    rig.rotation.y = (Math.sin(t * 0.45) * 0.2 + Math.sin(t * 0.17 + 2) * 0.08) * sway;
    rig.scale.setScalar(grow);
    // breathing: ~4 s cycle, chest expands more than it rises; exhale is slower than inhale
    const ph = t * 1.55, br = Math.sin(ph) + 0.25 * Math.sin(2 * ph - 0.6);
    upper.position.y = br * 0.0035 * amp;
    upper.scale.set(1 + br * 0.008 * amp, 1 + br * 0.005 * amp, 1 + br * 0.011 * amp);
    // weight shift between the feet; the head counter-balances to stay level
    const shift = (Math.sin(t * 0.37) + 0.3 * Math.sin(t * 0.91 + 1)) * 0.018 * amp;
    upper.rotation.z = shift;
    upper.position.x = shift * 0.12;
    headP.outer.rotation.set(
      Math.sin(t * 0.65 + 1) * 0.025 * amp - look.pitch + fx.nod - br * 0.006 * amp,
      look.yaw,
      Math.sin(t * 0.9) * 0.03 * amp + sal * 0.08 - shift * 0.85 - look.yaw * 0.22 // curious tilt toward what he looks at
    );
    ears.L.g.rotation.y = ears.L.rest + Math.sin(t * 1.7) * 0.06 * amp + fx.lag + fx.twitchL;
    ears.R.g.rotation.y = ears.R.rest - Math.sin(t * 1.7 + 0.6) * 0.06 * amp + fx.lag - fx.twitchR;
    for (const e of [ears.L, ears.R]) e.g.rotation.z = e.restZ - e.sx * 0.1 * fx.perk;
    setMouth(fx.mouth);
    for (const b of brows) b.position.set(0, 0.008 * fx.brow, -0.0042 * fx.brow);
    const swing = br * 0.028 * amp + shift * 0.6;
    armR(arms.r, sal, (Math.sin(t * 2.4) * 0.14 * amp * arms.r + Math.sin(t * 9) * 0.42 * arms.wave) * (1 - sal), swing);
    armL(arms.l, -swing);
    TRUNK.set(
      Math.sin(t * 0.8) * 0.07 * amp + fx.lag * 0.7,
      Math.sin(t * 1.25) * 0.06 * amp - sal * 0.06,
      (0.5 + 0.5 * Math.sin(t * 1.1 + 0.7)) * 0.35 * amp + fx.mouth * 0.7
    );
  }

  /** open: 0 (shut) .. 1 · wink: 0..1 closes the left eye */
  function setEyes(open, wink = 0) {
    eyes[0].scale.y = open;
    eyes[1].scale.y = Math.min(open, 1 - 0.88 * wink);
  }

  function aimIris(ox, oy) {
    for (const ir of irises) ir.position.set(ox, oy, 0);
  }

  /** The image pose: right hand presenting, left fist on chest, mouth closed, eyes centred. */
  function rest() {
    Object.assign(fx, { mouth: 0, brow: 0, perk: 0, lag: 0, nod: 0, twitchL: 0, twitchR: 0, squint: 0 });
    Object.assign(arms, { r: 1, l: 1, wave: 0 });
    pose(0, 0, 0, 0, LOOK_ZERO, 1);
    setEyes(1, 0);
    aimIris(0, 0);
  }

  return {
    root,
    upper,
    head: HG,
    headCenter: V(0, 0.9, 0),
    furShells,
    fx,
    arms,
    pose,
    setEyes,
    aimIris,
    rest,
  };
}
