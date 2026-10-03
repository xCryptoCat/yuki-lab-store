import * as THREE from 'three';
import { buildYukizo } from './model/yukizo.js';
import { Stage } from './stage.js';
import { Life } from './life.js';
import { exportGLB, exportOBJ } from './export.js';

const VIEWER_BG = 'linear-gradient(180deg,#1b56c6 0%,#3b86e3 40%,#86c2f4 76%,#cfe8fb 100%)';
const LABEL = "Yukizo, a light-blue elephant mascot in a navy officer's uniform. Press Enter to make him salute.";
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const css = `
  :host {
    position: relative;
    display: block;
    width: 100%;
    height: 560px;
    background: var(--yukizo-bg, transparent);
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }
  :host([mode="viewer"]) { height: 100vh; background: var(--yukizo-bg, ${VIEWER_BG}); }
  :host([hidden]) { display: none; }
  canvas { position: absolute; inset: 0; display: block; outline: none; cursor: grab; }
  canvas:focus-visible { box-shadow: inset 0 0 0 3px rgba(246, 197, 49, 0.9); }
  .toolbar, .note { display: none; }
  :host([mode="viewer"]) .toolbar { display: flex; }
  :host([mode="viewer"]) .note { display: block; }
  .toolbar { position: absolute; right: 16px; bottom: 16px; gap: 8px; font-family: ${FONT}; }
  .toolbar button {
    appearance: none;
    border: 1px solid rgba(20, 20, 19, 0.18);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    color: #1a1915;
    font: 500 12.5px/1 ${FONT};
    padding: 9px 12px;
    cursor: pointer;
  }
  .toolbar button:hover { background: #fff; }
  .toolbar button:active { transform: translateY(1px); }
  .toolbar button:focus-visible { outline: 2px solid #f6c531; outline-offset: 2px; }
  .toolbar button[disabled] { opacity: 0.5; pointer-events: none; }
  .note {
    position: absolute;
    left: 16px;
    bottom: 16px;
    max-width: 60%;
    font: 400 12px/1.5 ${FONT};
    color: rgba(26, 25, 21, 0.55);
    user-select: none;
    pointer-events: none;
  }
  .note.narrow { display: none !important; }
  .err {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font: 500 14px/1.6 ${FONT};
    color: #8a2f20;
    text-align: center;
  }
`;

/**
 * <yukizo-hero> — Yukizo the elephant, live in 3D.
 *
 * Attributes
 *   mode        "hero" (default): transparent, no UI, no scroll-zoom, vertical touch scroll passes through.
 *               "viewer": full-screen sky gradient, download toolbar, hint text, scroll-zoom.
 *   background  any CSS background (same as setting --yukizo-bg).
 *   name        basename for downloads (default "yukizo").
 *   label       accessible description (defaults to an English one).
 *
 * Methods: salute(), talk(seconds), gesture('wave' | 'proud' | 'chest'), lookAt(x, y), headTop(), resetView(), downloadGLB(), downloadOBJ()
 * Events:  'yukizo-ready' once the model is built; 'yukizo-salute' whenever he salutes.
 */
export class YukizoHero extends HTMLElement {
  static observedAttributes = ['mode', 'background', 'label'];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>${css}</style>
      <div class="err" role="alert"></div>
      <div class="note">Drag to turn · scroll to zoom · double-click to reset · click Yukizo to salute</div>
      <div class="toolbar">
        <button type="button" data-export="obj" disabled>Download OBJ + MTL</button>
        <button type="button" data-export="glb" disabled>Download GLB</button>
      </div>`;
    this._note = root.querySelector('.note');
    this._err = root.querySelector('.err');
    this._buttons = [...root.querySelectorAll('[data-export]')];
    for (const b of this._buttons) b.addEventListener('click', () => (b.dataset.export === 'glb' ? this.downloadGLB() : this.downloadOBJ()));
    this.ready = new Promise((resolve, reject) => {
      this._resolveReady = resolve;
      this._rejectReady = reject;
    });
    this.ready.catch(() => {}); // a failure is reported via 'yukizo-error'; don't leave an unhandled rejection
  }

  get mode() {
    return this.getAttribute('mode') === 'viewer' ? 'viewer' : 'hero';
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'background') {
      if (value) this.style.setProperty('--yukizo-bg', value);
      else this.style.removeProperty('--yukizo-bg');
    } else if (name === 'mode' && this._stage) this._applyMode();
    else if (name === 'label' && this._stage) this._stage.canvas.setAttribute('aria-label', value || LABEL);
  }

  connectedCallback() {
    if (this._failed) return;
    if (!this._stage) {
      try {
        this._build();
      } catch (err) {
        this._fail(err);
        return;
      }
    }
    this._attach();
  }

  disconnectedCallback() {
    this._detach();
  }

  /* ---------- public API ---------- */
  salute() {
    if (this._life?.salute(performance.now(), true)) this._announceSalute();
  }
  /** Animate his mouth as if speaking for `seconds` (e.g. while a speech bubble types out). */
  talk(seconds) {
    this._life?.talk(performance.now(), seconds);
  }
  gesture(name) {
    return this._life?.playGesture(name, performance.now()) ?? false;
  }
  /** Glance at a point on the page (viewport px), e.g. a keyboard-focused element. */
  lookAt(clientX, clientY) {
    if (!this._life?.motion) return;
    const p = this._toNdc({ clientX, clientY });
    this._life.pointerMoved(p.x, p.y, performance.now());
  }
  /** Top of his head in px from the element's top-left (e.g. to place a speech bubble), or null before he's built. */
  headTop() {
    const s = this._stage;
    if (!s?.size) return null;
    const p = new THREE.Vector3(s.center.x, s.center.y + s.size.y / 2, s.center.z).project(s.camera);
    return { x: ((p.x + 1) / 2) * this.clientWidth, y: ((1 - p.y) / 2) * this.clientHeight };
  }
  resetView() {
    this._stage?.frame(true);
  }
  downloadGLB() {
    return this._export(exportGLB);
  }
  downloadOBJ() {
    return this._export(exportOBJ);
  }
  /** The exportable THREE.Group (for advanced use). */
  get model() {
    return this._model?.root;
  }

  /* ---------- internals ---------- */
  _fail(err) {
    this._failed = true;
    if (this._stage) {
      this._detach();
      this._stage.canvas.remove();
      this._stage = null;
    }
    this._err.style.display = 'flex';
    this._err.textContent = "Yukizo couldn't start: this browser or device doesn't seem to support WebGL.";
    console.error(err);
    this._rejectReady(err);
    this.dispatchEvent(new CustomEvent('yukizo-error', { bubbles: true, composed: true, detail: err }));
  }

  _build() {
    const stage = (this._stage = new Stage(this));
    this.shadowRoot.insertBefore(stage.canvas, this._err);
    const model = (this._model = buildYukizo());
    // fur shells share host geometry — skip them when hit-testing
    for (const s of model.furShells) s.raycast = () => {};
    stage.setObject(model.root);
    this._life = new Life(model, stage);

    const c = stage.canvas;
    c.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this._fail(new Error('WebGL context lost')); });
    c.tabIndex = 0;
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', this.getAttribute('label') || LABEL);
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._tapSalute();
      }
    });
    c.addEventListener('pointerdown', (e) => {
      this._down = { x: e.clientX, y: e.clientY, t: performance.now() };
      this._life.dragging = true;
      if (e.pointerType === 'mouse') c.style.cursor = 'grabbing';
    });
    c.addEventListener('pointerleave', () => (this._life.hovering = false));
    c.addEventListener('dblclick', () => this.resetView());
    stage.controls.addEventListener('start', () => this._life.userTurning(true));
    stage.controls.addEventListener('end', () => this._life.userTurning(false));

    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
    this._onMove = (e) => this._pointerMove(e);
    this._onUp = (e) => this._pointerUp(e);
    this._onCancel = () => this._release();
    this._onDocLeave = () => this._life.pointerLeft();
    this._ro = new ResizeObserver(() => {
      stage.resize();
      this._note.classList.toggle('narrow', this.clientWidth < 720);
    });
    this._io = new IntersectionObserver(([en]) => {
      this._visible = en.isIntersecting;
      if (this._visible) this._life.start(performance.now()); // entrance plays on first view
      stage.renderer.setAnimationLoop(this._visible ? this._loop : null); // sleep while off-screen
    });
    this._loop = () => {
      this._life.update(performance.now());
      stage.render();
    };
    this._motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this._onMotionPref = () => {
      this._life.setMotion(!this._motionQuery.matches);
      if (this._visible) this._life.start(performance.now());
    };
    this._life.setMotion(!this._motionQuery.matches);
    this._applyMode();
    for (const b of this._buttons) b.disabled = false;
    this._resolveReady(this);
    queueMicrotask(() => this.dispatchEvent(new CustomEvent('yukizo-ready', { bubbles: true, composed: true })));
  }

  _attach() {
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onCancel);
    document.documentElement.addEventListener('mouseleave', this._onDocLeave);
    this._motionQuery.addEventListener('change', this._onMotionPref);
    this._ro.observe(this);
    this._io.observe(this);
  }

  _detach() {
    if (!this._stage) return;
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onCancel);
    document.documentElement.removeEventListener('mouseleave', this._onDocLeave);
    // optional chaining: _fail() can run mid-build, before these exist
    this._motionQuery?.removeEventListener('change', this._onMotionPref);
    this._ro?.disconnect();
    this._io?.disconnect();
    this._stage.renderer.setAnimationLoop(null);
    this._visible = false;
  }

  _applyMode() {
    const hero = this.mode === 'hero', { controls, canvas } = this._stage;
    controls.enableZoom = !hero;
    // hero: vertical swipes scroll the page; horizontal drags still turn him
    canvas.style.touchAction = hero ? 'pan-y' : 'none';
  }

  _toNdc(e) {
    const r = this._stage.canvas.getBoundingClientRect();
    return this._ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  _hits(e) {
    this._ray.setFromCamera(this._toNdc(e), this._stage.camera);
    return this._ray.intersectObject(this._model.root, true).length > 0;
  }

  _pointerMove(e) {
    const life = this._life, c = this._stage.canvas;
    if (!this._visible) return;
    const onCanvas = e.composedPath()[0] === c;
    if (e.pointerType === 'mouse') {
      life.hovering = onCanvas && !this._down && life.motion && this._hits(e);
      if (onCanvas) c.style.cursor = this._down ? 'grabbing' : life.hovering ? 'pointer' : 'grab';
    }
    if (this._down || !life.motion) return;
    const p = this._toNdc(e);
    life.pointerMoved(p.x, p.y, performance.now());
  }

  _pointerUp(e) {
    const d = this._down;
    this._release();
    if (e.pointerType === 'mouse' && e.composedPath()[0] === this._stage.canvas) this._stage.canvas.style.cursor = 'grab';
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 450 || !this._hits(e)) return;
    this._tapSalute();
  }

  _release() {
    this._down = null;
    if (this._life) this._life.dragging = false;
  }

  _tapSalute() {
    if (this._life.salute(performance.now())) this._announceSalute();
  }

  _announceSalute() {
    this.dispatchEvent(new CustomEvent('yukizo-salute', { bubbles: true, composed: true }));
  }

  /** Exports always capture the clean image pose without fur shells. */
  async _export(fn) {
    if (!this._model) return;
    const { root, furShells, rest } = this._model;
    this._stage.renderer.setAnimationLoop(null);
    rest();
    for (const s of furShells) s.removeFromParent();
    try {
      await fn(root, (this.getAttribute('name') || 'yukizo').replace(/[^\w.-]+/g, '_'));
    } finally {
      for (const s of furShells) s.userData.host.add(s);
      if (!this._life.motion) rest();
      this._stage.renderer.setAnimationLoop(this._visible ? this._loop : null);
    }
  }
}

if (!customElements.get('yukizo-hero')) customElements.define('yukizo-hero', YukizoHero);
