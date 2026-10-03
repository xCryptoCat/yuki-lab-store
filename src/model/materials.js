import * as THREE from 'three';
import { V2 } from './helpers.js';

const mat = (name, o) => {
  const m = new THREE.MeshPhysicalMaterial(o);
  m.name = name;
  return m;
};
// sheen = plush/velvet look; exports to GLB (KHR_materials_sheen)
const plush = (name, color, sheenColor, extra = {}) =>
  mat(name, { color, roughness: 0.92, sheen: 1, sheenRoughness: 0.5, sheenColor, ...extra });

/** Tileable felt normal map: random fibre strokes, blurred, turned into normals. */
function feltNormal(size = 256) {
  const h = new Float32Array(size * size), w = (v) => (v + size) % size;
  for (let i = 0; i < h.length; i++) h[i] = Math.random() * 0.35;
  for (let k = 0; k < 3400; k++) {
    let x = Math.random() * size, y = Math.random() * size;
    const a = Math.random() * Math.PI * 2, len = 4 + Math.random() * 10, v = 0.4 + Math.random() * 0.6;
    for (let s = 0; s < len; s++) {
      h[w(Math.floor(y)) * size + w(Math.floor(x))] += v;
      x += Math.cos(a);
      y += Math.sin(a);
    }
  }
  const b = new Float32Array(h.length);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += h[w(y + dy) * size + w(x + dx)];
      b[y * size + x] = s / 9;
    }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d'), img = ctx.createImageData(size, size), K = 2.4;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = b[y * size + w(x + 1)] - b[y * size + w(x - 1)], dy = b[w(y + 1) * size + x] - b[w(y - 1) * size + x];
      const nx = -dx * K, ny = -dy * K, l = Math.hypot(nx, ny, 1), i = (y * size + x) * 4;
      img.data[i] = ((nx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.name = 'felt_normal';
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 10);
  t.anisotropy = 4;
  return t;
}

/** Soft radial white→transparent disc (blush, contact shadow). */
export function radialTexture(stops, name) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [at, a] of stops) g.addColorStop(at, `rgba(255,255,255,${a})`);
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.name = name;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createMaterials() {
  const M = {
    skin: plush('plush_skin', '#c6dbf2', '#ffffff'),
    skinDark: plush('plush_skin_shade', '#aac5e6', '#f2f8ff'),
    pink: plush('plush_ear_pink', '#f2a2b2', '#ffe8ee'),
    navy: plush('uniform_navy', '#25346f', '#7486cc', { sheen: 0.75, roughness: 0.9 }),
    navyDark: plush('uniform_navy_dark', '#171f48', '#4b5b9c', { sheen: 0.5 }),
    glove: plush('glove_white', '#f3f6fb', '#ffffff'),
    cream: plush('cuff_cream', '#efe3c3', '#fffaf0'),
    shirt: plush('shirt_white', '#f8f9fb', '#ffffff', { sheen: 0.4 }),
    nail: plush('toenail_cream', '#f7f2e6', '#ffffff', { sheen: 0.4 }),
    tie: mat('tie_charcoal', { color: '#1c1f2c', roughness: 0.55, sheen: 0.4, sheenColor: '#5b6178' }),
    gold: mat('gold', { color: '#f6c531', roughness: 0.3, metalness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
    gloss: mat('visor_black', { color: '#111318', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06 }),
    eye: mat('eye_iris_brown', { color: '#33190b', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04 }),
    pupil: mat('eye_pupil', { color: '#0a0806', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 }),
    glint: mat('eye_glint', { color: '#ffffff', roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.4 }),
    leather: mat('leather_brown', { color: '#8d5a2b', roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    leatherD: mat('leather_dark', { color: '#5e3a1c', roughness: 0.6 }),
    mouth: mat('mouth_inside', { color: '#7a2131', roughness: 0.6 }),
    tongue: mat('tongue', { color: '#f17d8c', roughness: 0.5, sheen: 0.5, sheenColor: '#ffd3da' }),
    sclera: mat('eye_white', { color: '#fbfcff', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 }),
    nostril: mat('trunk_nostril', { color: '#6f8bb6', roughness: 0.9 }),
    brow: mat('brow', { color: '#46557f', roughness: 0.8 }),
    blush: mat('blush_pink', {
      color: '#f58c9d',
      map: radialTexture([[0, 0.95], [0.5, 0.6], [1, 0]], 'blush_gradient'),
      transparent: true,
      depthWrite: false,
      roughness: 0.9,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  };
  const felt = feltNormal();
  for (const [m, s] of [[M.skin, 0.26], [M.skinDark, 0.26], [M.pink, 0.3], [M.navy, 0.6], [M.navyDark, 0.5], [M.glove, 0.4], [M.cream, 0.45], [M.shirt, 0.25]]) {
    m.normalMap = felt;
    m.normalScale = V2(s, s);
  }
  return M;
}
