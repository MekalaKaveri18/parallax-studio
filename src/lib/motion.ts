/**
 * Camera motion engine.
 *
 * Every preset is a pure function of clip progress: pose(t) for t in [0, 1].
 * A move runs once, in one direction, and eases to rest at t = 1 — like a real
 * shot — so every preset starts and ends on a clean frame. Previews sample these
 * functions into Web Animations keyframes; the same functions can be sampled
 * per-frame to export a video.
 */

export interface Pose {
  /** scale */
  s: number;
  /** translate, % of frame */
  x: number;
  y: number;
  /** roll, deg */
  r: number;
  /** orbit (rotateY), deg */
  ry: number;
  /** blur, px */
  blur: number;
  /** brightness multiplier */
  b: number;
}

type Track = (t: number, k: number, durSec: number) => Partial<Pose>;

interface MotionDef {
  track: Track;
  /** Progress to show when not playing (defaults to 0). Filters are always cleared at rest. */
  still?: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
/** Progress within a sub-window [a, b] of the clip. */
const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Smooth pseudo-random wobble in [-1, 1] from incommensurate sines. */
function wobble(sec: number, seed: number) {
  return (
    0.55 * Math.sin(sec * 5.1 + seed) +
    0.3 * Math.sin(sec * 11.7 + seed * 2.3) +
    0.15 * Math.sin(sec * 23.3 + seed * 3.7)
  );
}

const smoothstep = (v: number) => {
  const c = clamp01(v);
  return c * c * (3 - 2 * c);
};

/**
 * Fade oscillation in at the start and out at the end. Smoothstep has zero slope
 * at both edges, so shakes ease to a stop instead of halting abruptly.
 */
const envelope = (t: number) => smoothstep(t / 0.12) * smoothstep((1 - t) / 0.2);

const DEFS: Record<string, MotionDef> = {
  "dolly-in": { track: (t, k) => ({ s: lerp(1.02, 1.02 + 0.28 * k, inOut(t)) }) },
  "dolly-out": { track: (t, k) => ({ s: lerp(1.02 + 0.28 * k, 1.02, inOut(t)) }) },
  "pan-left": { track: (t, k) => ({ s: 1.3, x: lerp(7 * k, -7 * k, inOut(t)) }) },
  "pan-right": { track: (t, k) => ({ s: 1.3, x: lerp(-7 * k, 7 * k, inOut(t)) }) },
  "tilt-up": { track: (t, k) => ({ s: 1.3, y: lerp(-7 * k, 7 * k, inOut(t)) }) },
  "crane-down": {
    track: (t, k) => ({ s: lerp(1.3, 1.12, inOut(t)), y: lerp(8 * k, -3 * k, inOut(t)) }),
  },
  "crash-zoom": {
    track: (t, k) => {
      const p = win(t, 0.4, 0.55);
      return { s: 1.02 + 0.9 * k * outExpo(p), blur: 3 * k * Math.sin(Math.PI * p) };
    },
  },
  "dolly-zoom": {
    track: (t, k) => ({ s: lerp(1.05, 1.05 + 0.4 * k, inOut(t)), y: lerp(0, -1.5 * k, inOut(t)) }),
  },
  "snap-out": {
    track: (t, k) => {
      const p = win(t, 0.35, 0.5);
      return { s: 1.02 + 0.6 * k * (1 - outExpo(p)), blur: 2.5 * k * Math.sin(Math.PI * p) };
    },
  },
  "orbit-left": {
    track: (t, k) => ({ s: 1.3, ry: lerp(12 * k, -12 * k, inOut(t)), x: lerp(-4, 4, inOut(t)) }),
  },
  "orbit-right": {
    track: (t, k) => ({ s: 1.3, ry: lerp(-12 * k, 12 * k, inOut(t)), x: lerp(4, -4, inOut(t)) }),
  },
  "dutch-roll": { track: (t, k) => ({ s: 1.3, r: lerp(-7 * k, 7 * k, inOut(t)) }) },
  handheld: {
    track: (t, k, d) => {
      const e = envelope(t) * k;
      const sec = t * d;
      return {
        s: lerp(1.12, 1.15, inOut(t)),
        x: 1.1 * e * wobble(sec, 1),
        y: 0.9 * e * wobble(sec, 4),
        r: 0.5 * e * wobble(sec, 7),
      };
    },
  },
  earthquake: {
    track: (t, k, d) => {
      const e = envelope(t) * k;
      const sec = t * d * 3.2; // much faster, harder shake
      return { s: 1.15, x: 2.4 * e * wobble(sec, 2), y: 2 * e * wobble(sec, 5), r: 0.4 * e * wobble(sec, 9) };
    },
  },
  "whip-pan": {
    still: 1,
    track: (t, k) => {
      const p = outCubic(win(t, 0, 0.22));
      return {
        s: lerp(1.1, 1.14, inOut(t)),
        x: -45 * k * (1 - p) + lerp(0, 1.5 * k, inOut(t)),
        blur: 12 * (1 - p),
      };
    },
  },
  levitate: {
    track: (t, k) => ({
      s: lerp(1.1, 1.12, inOut(t)),
      y: lerp(2.5 * k, -2.5 * k, inOut(t)),
      r: lerp(-0.5 * k, 0.5 * k, inOut(t)),
    }),
  },
  "rack-focus": {
    still: 1,
    track: (t, k) => {
      const p = inOut(win(t, 0, 0.6));
      return { s: lerp(1.04, 1.09, inOut(t)), blur: 7 * k * (1 - p), b: lerp(0.9, 1, p) };
    },
  },
  heartbeat: {
    track: (t, k, d) => {
      // Double-bump pulse every 1.4s, settling at the end.
      const phase = ((t * d) % 1.4) / 1.4;
      const beat = Math.exp(-Math.pow((phase - 0.14) / 0.06, 2)) + 0.7 * Math.exp(-Math.pow((phase - 0.4) / 0.06, 2));
      return { s: lerp(1.05, 1.08, inOut(t)) + 0.07 * k * beat * envelope(t) };
    },
  },
};

const REST: Pose = { s: 1, x: 0, y: 0, r: 0, ry: 0, blur: 0, b: 1 };

export function poseAt(motionId: string, t: number, k = 1, durSec = 5): Pose {
  const def = DEFS[motionId] ?? DEFS["dolly-in"];
  return { ...REST, ...def.track(clamp01(t), k, durSec) };
}

/** The frame shown while paused: a clean still with no blur. */
export function stillPose(motionId: string, k = 1, durSec = 5): Pose {
  const def = DEFS[motionId] ?? DEFS["dolly-in"];
  return { ...poseAt(motionId, def.still ?? 0, k, durSec), blur: 0, b: 1 };
}

/** Same transform function list in every frame, so interpolation is always valid. */
export function poseTransform(p: Pose) {
  return `perspective(900px) scale(${p.s.toFixed(4)}) translate(${p.x.toFixed(3)}%, ${p.y.toFixed(3)}%) rotate(${p.r.toFixed(3)}deg) rotateY(${p.ry.toFixed(3)}deg)`;
}

export function poseFilter(p: Pose) {
  return `blur(${p.blur.toFixed(2)}px) brightness(${p.b.toFixed(3)})`;
}

/** Seconds a preview holds on the final frame before looping back to the start. */
export const LOOP_HOLD_SEC = 0.6;

/**
 * Web Animations keyframes for one loop: the move over `durSec`, then a short hold
 * on the end frame. The loop restart is a hard cut, like a looping video.
 */
export function motionKeyframes(motionId: string, k: number, durSec: number): Keyframe[] {
  const total = durSec + LOOP_HOLD_SEC;
  const samples = Math.max(24, Math.ceil(durSec * 30));
  const frames: Keyframe[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = poseAt(motionId, t, k, durSec);
    frames.push({ offset: (t * durSec) / total, transform: poseTransform(p), filter: poseFilter(p) });
  }
  const end = frames[frames.length - 1];
  frames.push({ offset: 1, transform: end.transform, filter: end.filter });
  return frames;
}

export function loopMs(durSec: number) {
  return (durSec + LOOP_HOLD_SEC) * 1000;
}
