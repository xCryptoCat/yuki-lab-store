// Shrinks the Blender export of Yukizo for the web.
//
//   npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
//   node tools/optimize-yukizo.mjs yukizo_v5.glb public/models/yukizo.glb
//
// Only the big meshes are simplified (morph-target meshes like the mouth are left alone, or it stops lining up),
// then everything is quantized and Meshopt-compressed. The node tree and names are kept: the site animates them.

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplifyPrimitive, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
const [, , inp, out, err = '0.0006', minTris = '3000'] = process.argv;
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inp);
await doc.transform(dedup(), weld());
let before = 0, after = 0;
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives()) {
    const tris = prim.getIndices().getCount() / 3;
    before += tris;
    if (tris >= +minTris && prim.listTargets().length === 0) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: 0, error: +err });
    const t2 = prim.getIndices().getCount() / 3;
    after += t2;
    if (tris >= +minTris) console.log(mesh.getName(), tris, "→", t2);
  }
await doc.transform(prune(), quantize({ quantizeNormal: 10 }), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
await io.write(out, doc);
console.log('tris', before, '→', after);
