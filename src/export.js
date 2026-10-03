import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Every mesh and material needs a unique name for o / usemtl lines; returns the unique material list. */
function nameParts(object) {
  const mats = [], seen = new Set();
  let meshI = 0, matI = 0;
  object.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.name) o.name = 'part_' + meshI;
    meshI += 1;
    for (const m of [].concat(o.material)) {
      if (!m || mats.includes(m)) continue;
      if (!m.name) m.name = 'mat_' + matI++;
      while (seen.has(m.name)) m.name = m.name + '_' + matI++;
      seen.add(m.name);
      mats.push(m);
    }
  });
  return mats;
}

export async function exportGLB(object, basename) {
  nameParts(object);
  const buf = await new GLTFExporter().parseAsync(object, { binary: true });
  download(new Blob([buf], { type: 'model/gltf-binary' }), basename + '.glb');
}

export async function exportOBJ(object, basename) {
  const mats = nameParts(object);
  const obj = 'mtllib ' + basename + '.mtl\n' + new OBJExporter().parse(object);
  let mtl = '# Exported by yukizo-hero\n';
  for (const m of mats) {
    const c = m.color || { r: 0.8, g: 0.8, b: 0.8 };
    const rough = typeof m.roughness === 'number' ? m.roughness : 0.5;
    const opacity = typeof m.opacity === 'number' ? m.opacity : 1;
    mtl += 'newmtl ' + m.name + '\n';
    mtl += 'Kd ' + c.r.toFixed(4) + ' ' + c.g.toFixed(4) + ' ' + c.b.toFixed(4) + '\n';
    mtl += 'Ks 0.2000 0.2000 0.2000\n';
    mtl += 'Ns ' + Math.round((1 - rough) * 200) + '\n';
    mtl += 'd ' + opacity.toFixed(4) + '\n\n';
  }
  download(new Blob([obj], { type: 'text/plain' }), basename + '.obj');
  download(new Blob([mtl], { type: 'text/plain' }), basename + '.mtl');
}
