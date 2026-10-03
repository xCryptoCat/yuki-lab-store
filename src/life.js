import * as THREE from 'three';

const { clamp } = THREE.MathUtils;
const ease = (x) => x * x * (3 - 2 * x);
/** attack / hold / decay envelope, 0..1 */
const env = (t, a, h, d) => (t <= 0 ? 0 : t < a ? ease(t / a) : t < a + h ? 1 : t < a + h + d ? 1 - ease((t - a - h) / d) : 0);
/** springy pop-in, 0 → 1 with overshoot */
const pop = (x) => (x >= 1 ? 1 : Math.max(0.001, 1 - Math.pow(2, -8 * x) * Math.cos(x * Math.PI * 2.6)));
const spring = (s, target, dt, w = 8, z = 0.72) => {
  s.v += ((target - s.x) * w * w - 2 * z * w * s.v) * dt;
  s.x += s.v * dt;
  return s.x;
};

const STEP = 1 / 60; // smoothing runs at a fixed rate so it feels the same on 60/120/144 Hz screens
const GESTURES = [
  { name: 'wave', r: 1, l: 0, wave: 1, dur: 2.3 },
  { name: 'proud', r: 1, l: 1, wave: 0.25, dur: 3.4 },
  { name: 'chest', r: 0, l: 1, wave: 0, dur: 2.6 },
];
const SALUTE_LEN = 2.2;

/**
 * Yukizo's behaviour: entrance pop + salute, idle sway/breath, blinks, random arm
 * gestures, occasional grins, hover wave, click salute, and a gaze where the eyes
 * lead and the head follows (idle = eye contact with the camera).
 */
export class Life {
  constructor(model, stage) {
    this.model = model;
    this.stage = stage;
    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.plane = new THREE.Plane();
    this.goal = new THREE.Vector3();
    this.eyeT = new THREE.Vector3();
    this.headT = new THREE.Vector3();
    this.dart = new THREE.Vector3();
    this.look = { yaw: 0, pitch: 0 };
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._c = new THREE.Vector3();
    this.hovering = false;
    this.dragging = false;
    this.motion = false;
    this.started = false;
  }

  /** (Re)start from the entrance. With motion off, hold the still image pose. */
  setMotion(on) {
    this.motion = on;
    this.started = false;
    if (on) {
      this.model.root.scale.setScalar(1);
      this.model.pose(0, 0, 0, 0, this.look, 0.001);
      this.stage.blob.scale.setScalar(0.001);
    } else {
      this.model.rest();
      this.stage.blob.scale.setScalar(1);
    }
  }

  /** Begin the entrance clock (called when first scrolled into view). */
  start(now) {
    if (!this.motion || this.started) return;
    this.started = true;
    this.t0 = now;
    this.lastT = 0;
    this.acc = 0;
    this.sway = 1;
    this.swayTarget = 1;
    this.nextBlink = 2.6;
    this.sp = { r: { x: 1, v: 0 }, l: { x: 1, v: 0 }, wave: { x: 0, v: 0 } };
    this.gesture = null;
    this.lastGesture = null;
    this.gestureEnd = 0;
    this.nextGesture = 9;
    this.grinStart = -1e9;
    this.nextGrin = 7;
    this.prevYaw = 0;
    this.lagV = 0;
    this.saluteStart = 1.15;
    this.lastPointer = -1e9;
    this.lookW = 0;
    this.nextDart = 1.5;
    this.seeded = false;
    this.talkUntil = -1e9;
    this.talkW = 0;
    this.nextGlance = 6 + Math.random() * 4;
    this.glanceUntil = -1e9;
    this.glance = new THREE.Vector3();
    this.prevGoal = new THREE.Vector3();
    this.lastBlink = 0;
    this.nextTwitch = 4 + Math.random() * 4;
    this.twitchT0 = -1e9;
    this.twitchLeft = true;
  }

  time(now) {
    return (now - this.t0) / 1000;
  }

  /* ---------- inputs ---------- */
  pointerMoved(ndcX, ndcY, now) {
    if (!this.started) return;
    this.pointer.set(ndcX, ndcY);
    this.lastPointer = this.time(now);
  }
  pointerLeft() {
    if (this.started) this.lastPointer = -1e9;
    this.hovering = false;
  }
  userTurning(on) {
    if (!this.started) return;
    clearTimeout(this._resume);
    if (on) this.swayTarget = 0;
    else this._resume = setTimeout(() => (this.swayTarget = 1), 2500);
  }
  salute(now, force = false) {
    if (!this.started) return false;
    const t = this.time(now);
    if (!force && t - this.saluteStart <= 1.8) return false;
    this.saluteStart = t;
    return true;
  }
  /** Move his mouth as if speaking for `seconds` (synced to the speech bubble). */
  talk(now, seconds) {
    if (!this.started) return;
    this.talkUntil = Math.max(this.talkUntil, this.time(now) + seconds);
  }
  playGesture(name, now) {
    const g = GESTURES.find((x) => x.name === name);
    if (!g || !this.started) return false;
    this.gesture = g;
    this.gestureEnd = this.time(now) + g.dur;
    return true;
  }

  /* ---------- gaze ---------- */
  pointerGoal(out) {
    const cam = this.stage.camera, hc = this.model.headCenter;
    const n = this._a.copy(cam.position).sub(hc).normalize();
    this.plane.setFromNormalAndCoplanarPoint(n, this._b.copy(hc).addScaledVector(n, 0.9));
    this.ray.setFromCamera(this.pointer, cam);
    return this.ray.ray.intersectPlane(this.plane, out);
  }
  headAngles(target, w) {
    const { upper, headCenter } = this.model;
    upper.updateWorldMatrix(true, false);
    const d = upper.worldToLocal(this._c.copy(target)).sub(headCenter), len = d.length() || 1;
    const k = w * clamp((d.z / len) * 2.5, 0, 1); // ignore targets behind him
    this.look.yaw = clamp(Math.atan2(d.x, d.z), -0.65, 0.65) * 0.7 * k;
    this.look.pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.35, 0.45) * 0.55 * k;
    return this.look;
  }
  aimEyes(target) {
    const { head, headCenter } = this.model;
    head.updateWorldMatrix(true, false);
    const d = head.worldToLocal(this._c.copy(target)).sub(headCenter).normalize(), f = clamp(d.z * 3, 0, 1);
    this.model.aimIris(clamp(d.x * 0.02, -0.0042, 0.0042) * f, clamp(d.y * 0.02, -0.004, 0.004) * f);
  }

  /* ---------- per frame ---------- */
  update(now) {
    if (!this.motion || !this.started) return;
    const m = this.model, fx = m.fx, cam = this.stage.camera;
    const t = this.time(now);
    const frameDt = clamp(t - this.lastT, 0, 0.25);
    this.lastT = t;

    // targets for this frame
    const pointerOn = !this.dragging && t - this.lastPointer < 3 && !!this.pointerGoal(this.goal);
    // idle: every so often he glances around the shop (a shelf, the floor, a customer) — head follows
    if (!pointerOn && t > this.nextGlance && t > this.glanceUntil) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.glance.set(side * (1.05 + Math.random() * 0.55), -0.4 + Math.random() * 0.45, 0);
      this.glanceUntil = t + 1.3 + Math.random() * 0.9;
      this.nextGlance = t + 7 + Math.random() * 7;
    }
    const glancing = !pointerOn && t < this.glanceUntil;
    if (!pointerOn) {
      if (t > this.nextDart) {
        this.nextDart = t + 1.2 + Math.random() * 2.4;
        this.dart.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3, 0);
      }
      this.goal.copy(cam.position).add(this._b.copy(glancing ? this.glance : this.dart).applyQuaternion(cam.quaternion));
    }
    // people blink when their eyes jump a long way
    if (this.goal.distanceTo(this.prevGoal) > 0.6 && t - this.lastBlink > 1 && t > 2) this.nextBlink = Math.min(this.nextBlink, t + 0.04);
    this.prevGoal.copy(this.goal);
    if (!this.seeded) {
      this.eyeT.copy(this.goal);
      this.headT.copy(this.goal);
      this.seeded = true;
    }
    const st = t - this.saluteStart, sal = env(st, 0.35, 0.95, 0.45);
    const hov = this.hovering && !this.dragging ? 1 : 0;
    if (this.gesture && t > this.gestureEnd) {
      this.gesture = null;
      this.nextGesture = t + 4.5 + Math.random() * 4.5;
    }
    if (!this.gesture && st >= SALUTE_LEN && !hov && t > this.nextGesture) {
      let g;
      do g = GESTURES[(Math.random() * GESTURES.length) | 0];
      while (g === this.lastGesture);
      this.lastGesture = this.gesture = g;
      this.gestureEnd = t + g.dur;
    }
    const intoHero = t < 3.3, gs = this.gesture;
    const tr = intoHero || hov ? 1 : gs ? gs.r : 0;
    const tl = intoHero ? 1 : hov ? 0.35 : gs ? gs.l : 0;
    const tw = intoHero ? 0 : hov ? 1 : gs ? gs.wave : 0;
    if (t > this.nextGrin) {
      this.grinStart = t;
      this.nextGrin = t + 7 + Math.random() * 6;
    }
    const grin = env(t - this.grinStart, 0.25, 1.1, 0.35) * 0.8, intro = env(t - 0.2, 0.18, 0.75, 0.35);
    const talk = env(st - 0.15, 0.15, 1.05, 0.3) * (0.78 + 0.22 * Math.sin(st * 15));
    // speech: syllable-like mouth flaps, a little nod and brow lift
    const talkT = t < this.talkUntil ? 1 : 0;
    const syl = Math.max(0, Math.sin(t * 25) * (0.65 + 0.35 * Math.sin(t * 5.1)) + 0.25 * Math.sin(t * 37 + 1)); // ~4 syllables/s, uneven like real speech
    const talkMouth = this.talkW * (0.16 + 0.5 * Math.min(1, syl));
    const mouthT = Math.max(talk, grin, intro * 0.9, hov * 0.7, talkMouth);
    const browT = Math.max(sal * 0.9, hov * 0.7, grin * 0.5, intro, this.talkW * (0.3 + 0.25 * Math.sin(t * 2.1)));
    const perkT = Math.max(hov, sal * 0.6, intro * 0.5);
    const lookT = pointerOn || glancing ? 1 : 0;

    // smoothing at a fixed 60 Hz
    this.acc = Math.min(this.acc + frameDt, STEP * 6);
    const k = (x, to, s) => x + (to - x) * s;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.sway += (this.swayTarget - this.sway) * 0.04;
      this.eyeT.lerp(this.goal, 0.32);
      this.headT.lerp(this.goal, 0.07);
      this.lookW += (lookT - this.lookW) * 0.05;
      this.talkW += (talkT - this.talkW) * 0.2;
      fx.talk = this.talkW;
      m.arms.r = clamp(spring(this.sp.r, tr, STEP), -0.05, 1.08);
      m.arms.l = clamp(spring(this.sp.l, tl, STEP), -0.05, 1.08);
      m.arms.wave = clamp(spring(this.sp.wave, tw, STEP, 6, 1), 0, 1);
      fx.mouth = k(fx.mouth, mouthT, talkT ? 0.45 : 0.22); // speech needs a snappier mouth
      fx.brow = k(fx.brow, browT, 0.12);
      fx.perk = k(fx.perk, perkT, 0.08);
      // ears trail behind head turns, then settle
      const yaw = this.headAngles(this.headT, this.lookW).yaw;
      this.lagV += (-(yaw - this.prevYaw) * 9 - fx.lag) * 0.16;
      fx.lag = clamp(fx.lag + this.lagV, -0.25, 0.25);
      this.lagV *= 0.72;
      this.prevYaw = yaw;
    }

    fx.nod = this.talkW * Math.sin(t * 7.3) * 0.016;
    // single-ear twitch now and then (a fly? a sound?) — quick flick that settles
    if (t > this.nextTwitch) {
      this.twitchT0 = t;
      this.twitchLeft = Math.random() < 0.5;
      this.nextTwitch = t + 5 + Math.random() * 8;
    }
    const since = t - this.twitchT0, flick = since < 1.4 ? Math.sin(since * 24) * Math.exp(-since * 4.5) * 0.26 : 0;
    fx.twitchL = this.twitchLeft ? flick : 0;
    fx.twitchR = this.twitchLeft ? 0 : flick;

    const look = this.headAngles(this.headT, this.lookW);
    const grow = pop(t / 0.95);
    m.pose(t, this.sway, 1, sal, look, grow);
    this.stage.blob.scale.setScalar(grow);
    this.aimEyes(this.eyeT);

    // blinks (occasional double-blink) + wink during the salute
    let open = 1;
    if (t > this.nextBlink) {
      const ph = (t - this.nextBlink) / 0.16;
      if (ph >= 1) {
        this.lastBlink = t;
        this.nextBlink = t + 2.4 + Math.random() * 2.8 - (Math.random() < 0.2 ? 2.2 : 0);
      } else open = 1 - Math.sin(ph * Math.PI) * 0.9;
    }
    // a real smile reaches the eyes (cheeks push the lower lids up)
    open *= 1 - 0.16 * clamp(fx.mouth - this.talkW * 0.4, 0, 1);
    m.setEyes(open, env(st - 0.25, 0.1, 0.75, 0.14));
  }
}
