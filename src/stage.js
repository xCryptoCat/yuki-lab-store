import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { radialTexture } from './model/materials.js';

const DEG = Math.PI / 180;

/**
 * Renderer + lighting + camera for one model. Owns no animation; call
 * `render()` once per frame. `host` is the element whose box the canvas fills.
 */
export class Stage {
  constructor(host) {
    this.host = host;
    // stencil: lets the tongue show only inside the mouth (see yukizo-glb.js)
    const R = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true }));
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    R.setClearColor(0x000000, 0);
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFShadowMap;
    R.toneMapping = THREE.NeutralToneMapping;
    R.toneMappingExposure = 1.0;
    this.canvas = R.domElement;

    const scene = (this.scene = new THREE.Scene());
    const cam = (this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 500));

    /* lights: sky/ground wash, warm shadow-casting key, cool rim, soft fills */
    scene.add(new THREE.HemisphereLight('#f4f9ff', '#a6bfdc', 0.65));
    const key = (this.key = new THREE.DirectionalLight('#fff7ee', 2.3));
    key.position.set(2.5, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = 0.02;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 5;
    const sc = key.shadow.camera;
    sc.left = sc.bottom = -0.9;
    sc.right = sc.top = 0.9;
    sc.updateProjectionMatrix();
    scene.add(key);
    const back = new THREE.DirectionalLight('#fff4e6', 0.5);
    back.position.set(-5, 3, -4);
    scene.add(back);
    const rim = new THREE.DirectionalLight('#e2f1ff', 1.6);
    rim.position.set(-2.5, 3.5, -4.5);
    scene.add(rim);
    const fill = new THREE.DirectionalLight('#e6efff', 0.45);
    fill.position.set(-4, 1.5, 3);
    scene.add(fill);

    /* soft studio environment for sheen / gloss reflections */
    {
      const env = new THREE.Scene(), sky = new THREE.SphereGeometry(10, 48, 24), col = [], c = new THREE.Color();
      const top = new THREE.Color('#9fd0ff'), hor = new THREE.Color('#ffffff'), bot = new THREE.Color('#5d7697');
      for (let i = 0; i < sky.attributes.position.count; i++) {
        const y = sky.attributes.position.getY(i) / 10;
        c.copy(hor).lerp(y > 0 ? top : bot, Math.pow(Math.abs(y), 0.7));
        col.push(c.r, c.g, c.b);
      }
      sky.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      env.add(new THREE.Mesh(sky, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      const panel = (w, h, p, rgb) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        m.material.color.setRGB(...rgb);
        m.position.set(...p);
        m.lookAt(0, 0, 0);
        env.add(m);
      };
      panel(5, 3, [3, 5, 5], [5, 4.8, 4.5]);
      panel(3, 5, [-6, 3, -3], [2.2, 2.6, 3.2]);
      panel(6, 1.2, [0, 8, -2], [2, 2, 2]);
      const pm = new THREE.PMREMGenerator(R);
      this.envRT = pm.fromScene(env, 0.035);
      scene.environment = this.envRT.texture;
      scene.environmentIntensity = 0.6;
      pm.dispose();
      env.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    }

    /* ground: key-light shadow catcher + soft contact blob (transparent-background friendly) */
    const ground = (this.ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.13 })));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.blob = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.42),
      new THREE.MeshBasicMaterial({
        map: radialTexture([[0, 1], [0.45, 0.5], [1, 0]], 'contact_shadow'),
        color: '#0d2348',
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.renderOrder = 1;
    scene.add(this.blob);

    /* controls: turn only, limited to the front-ish hemisphere above ground */
    const controls = (this.controls = new OrbitControls(cam, this.canvas));
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.userMoved = false;
    controls.addEventListener('start', () => (this.userMoved = true));
  }

  setObject(object) {
    this.object = object;
    this.scene.add(object);
    const box = new THREE.Box3().setFromObject(object);
    this.ground.position.y = box.min.y;
    this.blob.position.set(0, box.min.y + 0.002, 0.03);
    this.size = box.getSize(new THREE.Vector3());
    this.center = box.getCenter(new THREE.Vector3());
    // keep the whole figure inside the key light's shadow map, whatever his size
    const sc = this.key.shadow.camera, r = Math.max(0.9, this.size.length() * 0.5);
    sc.left = sc.bottom = -r;
    sc.right = sc.top = r;
    sc.updateProjectionMatrix();
    this.key.target.position.copy(this.center);
    this.key.position.copy(this.center).add(new THREE.Vector3(2.5, 6, 5));
    this.scene.add(this.key.target);
    this.resize();
  }

  /** Match the canvas to the host box, then re-frame unless the user has turned the view. */
  resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.frame();
  }

  /** Fit the whole model in view, slightly from the right and above. */
  frame(force = false) {
    if (force) this.userMoved = false;
    if (this.userMoved || !this.size) return;
    const cam = this.camera, size = this.size, center = this.center;
    const t = Math.tan((cam.fov * DEG) / 2), pad = 1.14;
    const dist = Math.max(((size.y / 2) * pad) / t, ((size.x / 2) * pad) / (t * cam.aspect)) + size.z / 2;
    cam.position.copy(center).addScaledVector(new THREE.Vector3(0.2, 0.15, 1).normalize(), dist);
    cam.near = dist / 50;
    cam.far = dist * 20;
    cam.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.minDistance = dist * 0.55;
    this.controls.maxDistance = dist * 1.8;
    this.controls.update();
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      for (const m of [].concat(o.material)) {
        for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
        m.dispose();
      }
    });
    this.envRT.dispose();
    this.renderer.dispose();
  }
}
