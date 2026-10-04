import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { addFur } from './fur.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** Blender's lights and view transform lift the uniform a lot; under the site's lights these match its renders. */
const LOOK_DEV = { uniform_navy: '#25346f', uniform_navy_dark: '#171f48', mouth_inside: '#a52b3f' };

/**
 * Loads the Blender-built Yukizo (.glb exported in the same space as buildYukizo(): metres, y-up,
 * feet on y≈0, facing +z, nodes rig > legs / upper > head > head_offset > …) and returns the same
 * posing API, so Life animates either model:
 *
 *   root, upper, head, headCenter, furShells, fx, arms, pose(), setEyes(), aimIris(), rest()
 *
 * The sleeves are part of the jacket, so the arms can't swing: the right hand waves at the wrist
 * instead, and a "salute" is a happy bounce with a wink and a wave.
 */
export async function loadYukizo(url) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene.getObjectByName('yukizo') || gltf.scene;
  root.removeFromParent();
  root.name = 'yukizo';
  const get = (name) => root.getObjectByName(name);
  const rig = get('rig'), upper = get('upper'), head = get('head'), face = get('head_offset');
  if (!rig || !upper || !head || !face) throw new Error('yukizo.glb: missing rig nodes');

  root.traverse((o) => {
    if (!o.isMesh) return;
    const look = LOOK_DEV[o.material.name];
    if (look) o.material.color.set(look);
    o.castShadow = !/glint|brow|nostril|seam|badge|emblem/.test(o.name);
    o.receiveShadow = true;
  });

  /* ---------- parts the animation drives ---------- */
  const ears = ['L', 'R'].map((s) => {
    const g = get(`ear_${s}`);
    return g && { g, rest: g.rotation.clone(), sx: s === 'L' ? 1 : -1 };
  }).filter(Boolean);
  const lids = ['L', 'R'].map((s) => get(`eyelid_${s}`)).filter(Boolean);
  const irises = ['L', 'R'].map((s) => get(`iris_${s}`)).filter(Boolean);
  const brows = ['L', 'R'].map((s) => get(`brow_${s}`)).filter(Boolean).map((b) => ({ b, rest: b.position.clone() }));
  const hand = get('hand_R'), handRest = hand?.quaternion.clone();
  const mouths = [];
  for (const name of ['mouth', 'tongue']) {
    const o = get(name);
    o?.traverse((m) => {
      const i = m.morphTargetDictionary?.open;
      if (i !== undefined) mouths.push({ m, i });
    });
  }
  const tongueAt = dressMouth(get('mouth'), get('tongue'));
  const trunk = repivot(face, ['trunk', 'trunk_nostril', 'trunk_nostril.001', 'trunk_tip_pad'], 'trunk_pivot', (box, pts) => {
    // the root: where the trunk meets the face, i.e. its rear-most points
    const back = pts.filter((p) => p.z < box.min.z + 0.02);
    return back.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / back.length);
  });
  const tail = repivot(upper, ['tail', 'tail_tuft'], 'tail_pivot', (box, pts) => pts.reduce((a, p) => (p.z > a.z ? p : a)));

  const furShells = addFur(root, ['head_mesh', 'ear_L_mesh', 'ear_R_mesh', 'foot_L', 'foot_R']);

  /* ---------- posing ---------- */
  const fx = { mouth: 0, brow: 0, perk: 0, lag: 0, nod: 0, twitchL: 0, twitchR: 0, squint: 0, talk: 0 };
  const arms = { r: 1, l: 1, wave: 0 };
  const LOOK_ZERO = { yaw: 0, pitch: 0 };
  const q = new THREE.Quaternion(), e = new THREE.Euler();

  /** t: seconds · sway/amp: idle weights · sal: salute 0..1 · look: {yaw,pitch} · grow: entrance scale */
  function pose(t, sway, amp, sal, look, grow) {
    rig.rotation.y = (Math.sin(t * 0.45) * 0.2 + Math.sin(t * 0.17 + 2) * 0.08) * sway;
    rig.scale.setScalar(grow);
    // the "salute": a little hop as it starts and another as it ends
    rig.position.y = sal * (1 - sal) * 0.1;
    const ph = t * 1.55, br = Math.sin(ph) + 0.25 * Math.sin(2 * ph - 0.6);
    upper.position.y = br * 0.0035 * amp;
    upper.scale.set(1 + br * 0.008 * amp, 1 + br * 0.005 * amp, 1 + br * 0.011 * amp);
    const shift = (Math.sin(t * 0.37) + 0.3 * Math.sin(t * 0.91 + 1)) * 0.018 * amp;
    upper.rotation.z = shift;
    upper.position.x = shift * 0.12;
    head.rotation.set(
      Math.sin(t * 0.65 + 1) * 0.025 * amp - look.pitch + fx.nod - br * 0.006 * amp,
      look.yaw,
      Math.sin(t * 0.9) * 0.03 * amp + sal * 0.1 - shift * 0.85 - look.yaw * 0.22
    );
    for (const ear of ears) {
      const tw = ear.sx > 0 ? fx.twitchL : -fx.twitchR;
      ear.g.rotation.set(ear.rest.x, ear.rest.y + ear.sx * Math.sin(t * 1.7 + (ear.sx > 0 ? 0 : 0.6)) * 0.06 * amp + fx.lag + tw, ear.rest.z - ear.sx * 0.1 * fx.perk);
    }
    // his smile is open at rest (weight 1 = the art, 0 = closed) and grins widen it a little; while he talks the
    // syllables (fx.mouth ≈ 0.16 … 0.66) swing it between a small opening and wide open
    const talk = fx.talk || 0, speech = 0.3 + 1.25 * Math.max(0, fx.mouth - 0.16);
    const open = Math.min(1.08, (1 - talk) * (0.92 + 0.2 * fx.mouth) + talk * speech);
    setMouth(open);
    for (const { b, rest } of brows) b.position.set(rest.x, rest.y + 0.008 * fx.brow, rest.z - 0.0042 * fx.brow);
    if (hand) {
      const wave = Math.max(arms.wave, sal);
      e.set(0, 0, Math.sin(t * 2.4) * 0.05 * amp + Math.sin(t * 9) * 0.38 * wave);
      hand.quaternion.copy(handRest).multiply(q.setFromEuler(e));
    }
    if (trunk) trunk.rotation.set(
      -((0.5 + 0.5 * Math.sin(t * 1.1 + 0.7)) * 0.05 * amp + fx.mouth * 0.06),
      Math.sin(t * 0.8) * 0.05 * amp + fx.lag * 0.4,
      Math.sin(t * 1.25) * 0.03 * amp
    );
    if (tail) tail.rotation.set(0, Math.sin(t * 2.1) * 0.18 * amp, 0);
  }

  /** 0 = closed smile, 1 = the art's open smile (a little past 1 still looks right) */
  function setMouth(w) {
    for (const { m, i } of mouths) m.morphTargetInfluences[i] = w;
    tongueAt?.(w);
  }

  /** open: 0 (shut) .. 1 · wink: 0..1 closes the left eye */
  function setEyes(open, wink = 0) {
    if (lids[0]) lids[0].scale.y = Math.min(open, 1 - 0.88 * wink);
    if (lids[1]) lids[1].scale.y = open;
  }

  function aimIris(ox, oy) {
    for (const ir of irises) ir.position.set(ox, oy, 0);
  }

  function rest() {
    Object.assign(fx, { mouth: 0, brow: 0, perk: 0, lag: 0, nod: 0, twitchL: 0, twitchR: 0, squint: 0, talk: 0 });
    Object.assign(arms, { r: 1, l: 1, wave: 0 });
    pose(0, 0, 0, 0, LOOK_ZERO, 1);
    rig.position.y = 0;
    if (trunk) trunk.rotation.set(0, 0, 0);
    if (tail) tail.rotation.set(0, 0, 0);
    setMouth(1);
    setEyes(1, 0);
    aimIris(0, 0);
  }

  return { root, upper, head: face, headCenter: V(0, 0.9, 0), furShells, fx, arms, pose, setEyes, setMouth, aimIris, rest };
}

/**
 * The exported mouth is a thin patch floating just off the face, and the tongue a disc a few mm in front of it that
 * reaches below the lower lip; as the mouth closes the patch shrinks upward but the tongue stays low, so it shows
 * on his chin (worst while he talks). Here: the mouth marks its visible pixels in the stencil buffer and the tongue
 * is drawn only inside them; the tongue follows the lower lip up as the mouth closes, so it peeks out while he
 * talks; and the mouth gets a little depth, darker up under the top lip and toward the corners.
 * Returns tongueAt(open) to place the tongue for a mouth-open weight, or null without a tongue.
 */
function dressMouth(mouth, tongue) {
  if (!mouth?.isMesh) return null;
  const mm = (mouth.material = mouth.material.clone());
  Object.assign(mm, {
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, // never flicker against the face
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
  });
  mouth.renderOrder = 1; // after the face and trunk, so only the part of the mouth you can see gets marked
  mouth.castShadow = false;
  const shut = morphedPoints(mouth, 0), open = morphedPoints(mouth, 1);
  shadeMouth(mouth, open);
  if (!tongue?.isMesh) return null;
  const tm = (tongue.material = tongue.material.clone());
  Object.assign(tm, {
    depthTest: false, depthWrite: false,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp,
  });
  tm.color.set('#f07a8c');
  tm.sheen = 0;
  // its exported normals face down and away, so it read as a dull, see-through smear: light it as if it faced
  // forward and up out of the mouth, a shade darker toward its back edge
  const tg = tongue.geometry, n = tg.attributes.normal.count, up = new THREE.Vector3(0, 0.45, 0.89).normalize();
  const tp = morphedPoints(tongue, 1), tb = new THREE.Box3().setFromPoints(tp), tsz = tb.getSize(new THREE.Vector3());
  const nrm = new Float32Array(n * 3), tcol = new Float32Array(n * 3);
  tp.forEach((q, i) => {
    nrm.set([up.x, up.y, up.z], i * 3);
    const k = 0.78 + 0.22 * THREE.MathUtils.clamp(1 - (q.y - tb.min.y) / (tsz.y || 1), 0, 1);
    tcol.set([k, k, k], i * 3);
  });
  tg.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  tg.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
  delete tg.morphAttributes.normal;
  tm.vertexColors = true;
  tongue.renderOrder = 2;
  tongue.castShadow = tongue.receiveShadow = false;
  // how far the lower lip rises from wide open to shut (in the tongue's parent space)
  const low = (pts) => pts.reduce((m, p) => Math.min(m, p.y), Infinity), rise = low(shut) - low(open);
  const restY = tongue.position.y, LIFT = 0.014; // a touch higher than exported, so more of it shows when he beams
  return (w) => { tongue.position.y = restY + LIFT + rise * 0.7 * (1 - THREE.MathUtils.clamp(w, 0, 1)); };
}

/** A mesh's vertices at a weight of its "open" morph, in its parent's space. */
function morphedPoints(mesh, w) {
  const g = mesh.geometry, pos = g.attributes.position, i0 = mesh.morphTargetDictionary?.open, d = g.morphAttributes.position?.[i0 ?? 0];
  const out = [], v = new THREE.Vector3(), dv = new THREE.Vector3();
  mesh.updateMatrix();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (d && i0 !== undefined) {
      dv.fromBufferAttribute(d, i);
      g.morphTargetsRelative ? v.addScaledVector(dv, w) : v.lerp(dv, w);
    }
    out.push(v.clone().applyMatrix4(mesh.matrix));
  }
  return out;
}

/** Vertex colours over the open mouth: shadowed under the top lip and toward the corners, full colour low and central. */
function shadeMouth(mouth, pts) {
  const box = new THREE.Box3().setFromPoints(pts), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const col = new Float32Array(pts.length * 3);
  pts.forEach((q, i) => {
    const v = (q.y - box.min.y) / (size.y || 1), u = Math.abs(q.x - c.x) / (size.x / 2 || 1);
    const k = THREE.MathUtils.clamp(1.05 - 0.4 * v * v - 0.2 * u * u, 0.6, 1); // 1 low in the middle → 0.6 under the top lip
    col.set([k, k, k], i * 3);
  });
  mouth.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  mouth.material.vertexColors = true;
}

/**
 * Re-parent the named children of `parent` under a new group whose origin is at `pick(box, points)`
 * (in parent space), keeping them where they are, so the group turns about that point.
 */
function repivot(parent, names, name, pick) {
  const parts = names.map((n) => parent.getObjectByName(n)).filter((o) => o && o.parent === parent);
  if (!parts.length) return null;
  parent.updateWorldMatrix(true, true);
  const inv = parent.matrixWorld.clone().invert(), pts = [], box = new THREE.Box3(), p = new THREE.Vector3();
  for (const part of parts)
    part.traverse((o) => {
      if (!o.isMesh) return;
      const pos = o.geometry.attributes.position, m = inv.clone().multiply(o.matrixWorld);
      for (let i = 0; i < pos.count; i += 3) {
        p.fromBufferAttribute(pos, i).applyMatrix4(m);
        pts.push(p.clone());
        box.expandByPoint(p);
      }
    });
  const g = new THREE.Group();
  g.name = name;
  g.position.copy(pick(box, pts));
  parent.add(g);
  g.updateWorldMatrix(true, false);
  for (const part of parts) g.attach(part);
  return g;
}
