import * as THREE from 'three';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const V2 = (x, y) => new THREE.Vector2(x, y);
export const DEG = Math.PI / 180;

export function grp(parent, name) {
  const g = new THREE.Group();
  g.name = name;
  parent.add(g);
  return g;
}

/** Group whose rotation pivots around `p` while children keep authoring coordinates. */
export function pivot(parent, name, p) {
  const outer = grp(parent, name);
  outer.position.copy(p);
  const inner = grp(outer, name + '_offset');
  inner.position.copy(p).negate();
  return { outer, inner };
}

export function add(parent, name, geo, m, pos = [0, 0, 0], scale, rot) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.name = name;
  mesh.position.set(...pos);
  if (scale) mesh.scale.set(...scale);
  if (rot) mesh.rotation.set(...rot);
  parent.add(mesh);
  return mesh;
}

export const sphere = (r = 1, w = 48) => new THREE.SphereGeometry(r, w, Math.round(w * 0.7));

/** Rotate `obj` so its +z faces `n`. */
export function orient(obj, n, up = V(0, 1, 0)) {
  if (Math.abs(up.dot(n)) > 0.95) up = V(0, 0, 1);
  const x = new THREE.Vector3().crossVectors(up, n).normalize();
  const y = new THREE.Vector3().crossVectors(n, x);
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, n));
}

/** Radius-at-height lookup for a lathe profile. */
export function profileLookup(pts) {
  return (y) => {
    if (y <= pts[0].y) return pts[0].x;
    for (let i = 1; i < pts.length; i++)
      if (y <= pts[i].y) {
        const a = pts[i - 1], b = pts[i];
        return a.x + ((b.x - a.x) * (y - a.y)) / Math.max(1e-6, b.y - a.y);
      }
    return pts[pts.length - 1].x;
  };
}

/** Midpoint subdivision (non-indexed), so flat shapes can bend onto curved surfaces. */
export function subdivide(geo, levels) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  let a = Array.from(g.attributes.position.array);
  const m = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2];
  for (let l = 0; l < levels; l++) {
    const o = [];
    for (let i = 0; i < a.length; i += 9) {
      const p0 = a.slice(i, i + 3), p1 = a.slice(i + 3, i + 6), p2 = a.slice(i + 6, i + 9);
      const ab = m(p0, p1), bc = m(p1, p2), ca = m(p2, p0);
      o.push(...p0, ...ab, ...ca, ...ab, ...p1, ...bc, ...ca, ...bc, ...p2, ...ab, ...bc, ...ca);
    }
    a = o;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
  return out;
}

/** Weld coincident vertices, add planar UVs and smooth normals. */
export function smooth(g) {
  const p = g.attributes.position, map = new Map(), verts = [], idx = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = Math.round(x * 1e5) + ',' + Math.round(y * 1e5) + ',' + Math.round(z * 1e5);
    let j = map.get(k);
    if (j === undefined) {
      j = verts.length / 3;
      map.set(k, j);
      verts.push(x, y, z);
    }
    idx.push(j);
  }
  const o = new THREE.BufferGeometry(), uv = [];
  for (let i = 0; i < verts.length; i += 3) uv.push(verts[i] * 0.625, verts[i + 1] * 0.625);
  o.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  o.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  o.setIndex(idx);
  o.computeVertexNormals();
  return o;
}

export const extrude = (shape, depth, bevel = 0.0015) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 16,
  });

/** Flat shape (or thin extrusion) authored in x/y, wrapped onto a front-facing surface z = surf(x, y). */
export function decal(parent, name, shape, m, surf, { at = [0, 0], rot = 0, lift = 0.0015, depth = 0 } = {}) {
  let g = depth ? extrude(shape, depth, Math.min(0.0018, depth * 0.4)) : new THREE.ShapeGeometry(shape, 24);
  if (rot) g.rotateZ(rot);
  g.translate(at[0], at[1], 0);
  g = subdivide(g, depth ? 2 : 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, surf(p.getX(i), p.getY(i)) + lift + p.getZ(i));
  const mesh = add(parent, name, smooth(g), m);
  mesh.userData.decal = true;
  return mesh;
}

/** Flat strap swept along surface samples [{ p, n }]. */
export function ribbon(samples, width, thick) {
  const pos = [], idx = [], n = samples.length;
  for (let i = 0; i < n; i++) {
    const { p, n: nrm } = samples[i];
    const t = samples[Math.min(i + 1, n - 1)].p.clone().sub(samples[Math.max(i - 1, 0)].p).normalize();
    const b = new THREE.Vector3().crossVectors(t, nrm).normalize();
    const nn = new THREE.Vector3().crossVectors(b, t).normalize();
    for (const [sb, sn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const v = p.clone().addScaledVector(b, (sb * width) / 2).addScaledVector(nn, (sn * thick) / 2);
      pos.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < n - 1; i++)
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = a + 4, d = b + 4;
      idx.push(a, c, b, b, c, d);
    }
  const e = (n - 1) * 4;
  idx.push(0, 1, 2, 0, 2, 3, e, e + 2, e + 1, e, e + 3, e + 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function limb(parent, name, a, b, r, m) {
  const dir = b.clone().sub(a), len = dir.length();
  const mesh = add(parent, name, new THREE.CapsuleGeometry(r, len, 10, 32), m);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
  return mesh;
}

/** Place a capsule (authored along +y) between two points. */
export function place(mesh, a, b) {
  const d = b.clone().sub(a);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
}

export function ring(parent, name, at, dir, r, tube, m) {
  const mesh = add(parent, name, new THREE.TorusGeometry(r, tube, 16, 48), m);
  mesh.position.copy(at);
  mesh.quaternion.setFromUnitVectors(V(0, 0, 1), dir.clone().normalize());
  return mesh;
}

export function rrect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export const ellipse = (rx, ry) => {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return s;
};

export const poly = (pts) => new THREE.Shape(pts.map(([x, y]) => V2(x, y)));

export function yShape(h) {
  const s = h, st = 0.24 * s, sh = new THREE.Shape();
  sh.moveTo(-st / 2, -s / 2);
  sh.lineTo(st / 2, -s / 2);
  sh.lineTo(st / 2, 0.02 * s);
  sh.lineTo(0.5 * s, 0.5 * s);
  sh.lineTo(0.2 * s, 0.5 * s);
  sh.lineTo(0, 0.2 * s);
  sh.lineTo(-0.2 * s, 0.5 * s);
  sh.lineTo(-0.5 * s, 0.5 * s);
  sh.lineTo(-st / 2, 0.02 * s);
  sh.closePath();
  return sh;
}

/** Quaternion whose +y is `y` and +z is as close to `zHint` as possible. */
export function basisQ(y, zHint) {
  y = y.clone().normalize();
  const z = zHint.clone().addScaledVector(y, -zHint.dot(y)).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z)
  );
}
