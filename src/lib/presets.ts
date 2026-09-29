import type { AspectRatio, PlanId } from "./types";

export const ASPECTS: { id: AspectRatio; w: number; h: number; label: string }[] = [
  { id: "1:1", w: 1, h: 1, label: "Square" },
  { id: "3:4", w: 3, h: 4, label: "Portrait" },
  { id: "4:3", w: 4, h: 3, label: "Classic" },
  { id: "9:16", w: 9, h: 16, label: "Story" },
  { id: "16:9", w: 16, h: 9, label: "Wide" },
];

export function aspectOf(id: AspectRatio) {
  return ASPECTS.find((a) => a.id === id) ?? ASPECTS[0];
}

export function nearestAspect(w: number, h: number): AspectRatio {
  const r = w / h;
  return ASPECTS.reduce((best, a) => (Math.abs(a.w / a.h - r) < Math.abs(best.w / best.h - r) ? a : best)).id;
}

/** CSS aspect-ratio value, e.g. "16 / 9". */
export function aspectCss(id: AspectRatio) {
  const a = aspectOf(id);
  return `${a.w} / ${a.h}`;
}

export interface StylePreset {
  id: string;
  name: string;
  /** Appended to the user's prompt when sent to a real model. */
  suffix: string;
  thumbSeed: string;
}

export const STYLES: StylePreset[] = [
  { id: "none", name: "No style", suffix: "", thumbSeed: "raw-field" },
  { id: "cinematic", name: "Cinematic", suffix: "cinematic lighting, anamorphic, 35mm film grain", thumbSeed: "cine-42" },
  { id: "editorial", name: "Editorial", suffix: "high-fashion editorial, studio flash, magazine cover", thumbSeed: "edit-7" },
  { id: "noir", name: "Film Noir", suffix: "black and white, hard shadows, 1940s noir", thumbSeed: "noir-3" },
  { id: "neon", name: "Neon Night", suffix: "neon-lit, rain-soaked streets, cyberpunk palette", thumbSeed: "neon-19" },
  { id: "y2k", name: "Y2K Flash", suffix: "early 2000s digicam, direct flash, glossy", thumbSeed: "y2k-88" },
  { id: "analog", name: "Analog 35mm", suffix: "Kodak Portra 400, soft halation, candid", thumbSeed: "portra-5" },
  { id: "anime", name: "Anime Cel", suffix: "cel-shaded anime key visual, clean linework", thumbSeed: "cel-61" },
  { id: "product", name: "Product Shot", suffix: "clean product photography, softbox, seamless backdrop", thumbSeed: "prod-12" },
  { id: "dream", name: "Dreamcore", suffix: "surreal, pastel haze, ethereal glow", thumbSeed: "dream-30" },
];

export function styleOf(id: string | undefined) {
  return STYLES.find((s) => s.id === id) ?? STYLES[0];
}

export type MotionCategory = "Camera" | "Zoom" | "Orbit" | "Energy" | "Mood";

export interface MotionPreset {
  /** Matches a `.motion-<id>` keyframe class in globals.css. */
  id: string;
  name: string;
  category: MotionCategory;
  description: string;
  thumbSeed: string;
  isNew?: boolean;
}

export const MOTIONS: MotionPreset[] = [
  { id: "dolly-in", name: "Dolly In", category: "Camera", description: "Slow, steady push toward the subject.", thumbSeed: "m-dolly-in" },
  { id: "dolly-out", name: "Dolly Out", category: "Camera", description: "Pull back to reveal the scene.", thumbSeed: "m-dolly-out" },
  { id: "pan-left", name: "Pan Left", category: "Camera", description: "Lateral glide across the frame.", thumbSeed: "m-pan-l" },
  { id: "pan-right", name: "Pan Right", category: "Camera", description: "Lateral glide the other way.", thumbSeed: "m-pan-r" },
  { id: "tilt-up", name: "Tilt Up", category: "Camera", description: "Rise from ground to sky.", thumbSeed: "m-tilt" },
  { id: "crane-down", name: "Crane Down", category: "Camera", description: "Descend into the moment.", thumbSeed: "m-crane" },
  { id: "crash-zoom", name: "Crash Zoom", category: "Zoom", description: "Violent snap-zoom for impact.", thumbSeed: "m-crash", isNew: true },
  { id: "dolly-zoom", name: "Dolly Zoom", category: "Zoom", description: "The vertigo effect: world warps, subject holds.", thumbSeed: "m-vertigo" },
  { id: "snap-out", name: "Snap Out", category: "Zoom", description: "Punch out wide in a beat.", thumbSeed: "m-snap" },
  { id: "orbit-left", name: "Orbit Left", category: "Orbit", description: "Arc around the subject.", thumbSeed: "m-orbit-l" },
  { id: "orbit-right", name: "Orbit Right", category: "Orbit", description: "Arc the other direction.", thumbSeed: "m-orbit-r" },
  { id: "dutch-roll", name: "Dutch Roll", category: "Orbit", description: "Unsettling barrel roll tilt.", thumbSeed: "m-dutch" },
  { id: "handheld", name: "Handheld", category: "Energy", description: "Documentary-style camera shake.", thumbSeed: "m-hand" },
  { id: "earthquake", name: "Earthquake", category: "Energy", description: "Hard, rhythmic impact shake.", thumbSeed: "m-quake", isNew: true },
  { id: "whip-pan", name: "Whip Pan", category: "Energy", description: "Blurred whip into frame.", thumbSeed: "m-whip" },
  { id: "levitate", name: "Levitate", category: "Mood", description: "Gentle floating drift.", thumbSeed: "m-float" },
  { id: "rack-focus", name: "Rack Focus", category: "Mood", description: "Pull focus from soft to sharp.", thumbSeed: "m-rack" },
  { id: "heartbeat", name: "Heartbeat", category: "Mood", description: "Breathing pulse, tension rising.", thumbSeed: "m-pulse" },
];

export const MOTION_CATEGORIES: MotionCategory[] = ["Camera", "Zoom", "Orbit", "Energy", "Mood"];

export function motionOf(id: string | undefined) {
  return MOTIONS.find((m) => m.id === id) ?? MOTIONS[0];
}

export const DURATIONS = [3, 5, 8] as const;

/** Credit pricing. Kept in one place so the UI can always show cost before generating. */
export const COST = {
  imagePer: 2,
  videoPerSecond: 3,
};

export function imageCost(count: number) {
  return count * COST.imagePer;
}

export function videoCost(duration: number) {
  return duration * COST.videoPerSecond;
}

export const STARTING_CREDITS = 120;

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  credits: number;
  concurrency: number;
  blurb: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: STARTING_CREDITS,
    concurrency: 1,
    blurb: "Try every tool, no card needed.",
    features: ["120 starter credits", "1 generation at a time", "All styles & motions", "Watermark-free downloads"],
  },
  {
    id: "creator",
    name: "Creator",
    price: 12,
    credits: 1000,
    concurrency: 3,
    blurb: "For people shipping content every week.",
    features: ["1,000 credits / month", "3 generations at a time", "Priority queue", "Early access motions"],
    highlight: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: 39,
    credits: 4000,
    concurrency: 6,
    blurb: "Teams and heavy video workloads.",
    features: ["4,000 credits / month", "6 generations at a time", "Fastest queue", "Commercial license"],
  },
];

export function planOf(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
