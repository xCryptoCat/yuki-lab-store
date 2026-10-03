import * as THREE from 'three';

const LAYERS = 5;

/**
 * Plush fuzz: a few transparent shells on each named mesh that only show toward the silhouette.
 * Display only: callers remove the returned shells before exporting (each keeps its host in userData.host).
 */
export function addFur(root, names) {
  const want = new Set(names), hosts = [], shells = [];
  root.traverse((o) => { if (o.isMesh && want.has(o.name)) hosts.push(o); });
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
      shells.push(s);
    }
  return shells;
}
