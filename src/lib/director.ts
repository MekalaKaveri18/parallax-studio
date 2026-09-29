import { MOTIONS, motionOf } from "./presets";

/**
 * Picks camera moves for a described shot. Deterministic keyword scoring — no
 * model call — so it is instant, free and explainable ("why this move").
 */

interface Rule {
  motionId: string;
  words: string[];
  why: string;
}

const RULES: Rule[] = [
  { motionId: "dolly-in", words: ["intimate", "focus", "emotion", "portrait", "close", "subtle", "slow", "calm", "face", "introduce"], why: "A slow push-in draws attention to the subject and builds intimacy." },
  { motionId: "dolly-out", words: ["reveal", "lonely", "alone", "isolation", "ending", "scale", "vast", "context", "goodbye"], why: "Pulling back reveals context and leaves the subject small in a bigger world." },
  { motionId: "crash-zoom", words: ["shock", "surprise", "impact", "punch", "comedy", "sudden", "hype", "drop", "wow", "ad", "hook"], why: "A violent snap-zoom lands a beat hard — great for hooks and punchlines." },
  { motionId: "snap-out", words: ["punchline", "zoom out", "twist", "context", "gag"], why: "Punching out wide in one beat reframes the joke or the twist." },
  { motionId: "dolly-zoom", words: ["vertigo", "realization", "dread", "horror", "tension", "unease", "panic", "suspense"], why: "The vertigo effect warps the world around a still subject: pure unease." },
  { motionId: "orbit-left", words: ["product", "hero", "showcase", "360", "sneaker", "car", "fashion", "reveal product", "luxury"], why: "Arcing around the subject shows its form like a product hero shot." },
  { motionId: "orbit-right", words: ["dance", "spin", "character", "power", "confident"], why: "An orbit adds dimensionality and swagger to a character moment." },
  { motionId: "pan-left", words: ["landscape", "scenery", "wide", "travel", "journey", "street", "city"], why: "A lateral glide explores a wide scene like a travel shot." },
  { motionId: "pan-right", words: ["follow", "walking", "progress", "timeline", "forward"], why: "Gliding across the frame carries the eye forward through the scene." },
  { motionId: "tilt-up", words: ["tall", "tower", "building", "rise", "hope", "grand", "sky", "epic", "awe"], why: "Tilting up from ground to sky gives scale and a sense of awe." },
  { motionId: "crane-down", words: ["arrive", "arrival", "establish", "opening", "descend", "enter"], why: "Descending into the scene reads as an establishing, arriving shot." },
  { motionId: "dutch-roll", words: ["chaos", "unsettling", "drunk", "dream", "villain", "twisted", "off"], why: "The barrel-roll tilt makes the frame feel off-balance and uneasy." },
  { motionId: "handheld", words: ["documentary", "real", "raw", "ugc", "vlog", "candid", "authentic", "street"], why: "Handheld shake feels authentic and documentary, perfect for UGC." },
  { motionId: "earthquake", words: ["explosion", "action", "fight", "bass", "rumble", "earthquake", "monster", "intense"], why: "Hard rhythmic shake sells impact, action and heavy bass." },
  { motionId: "whip-pan", words: ["transition", "energy", "fast", "quick", "cut", "switch", "music video"], why: "A blurred whip into frame is a high-energy entrance or transition." },
  { motionId: "levitate", words: ["dreamy", "float", "ethereal", "magic", "soft", "fantasy", "peaceful", "serene"], why: "A gentle floating drift feels weightless and dreamlike." },
  { motionId: "rack-focus", words: ["mystery", "reveal detail", "memory", "flashback", "blur", "focus pull", "discover"], why: "Pulling focus from soft to sharp reveals the subject like a discovery." },
  { motionId: "heartbeat", words: ["romance", "love", "anxiety", "heartbeat", "pulse", "nervous", "anticipation"], why: "A breathing pulse mirrors a heartbeat: tension, anticipation, romance." },
];

export interface ShotPick {
  motionId: string;
  name: string;
  why: string;
  score: number;
}

export function directShot(idea: string): ShotPick[] {
  const text = ` ${idea.toLowerCase()} `;
  const scored = RULES.map((r) => {
    const hits = r.words.filter((w) => text.includes(w));
    return { rule: r, score: hits.length };
  });
  const ranked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.rule);

  // Always return three distinct options; fall back to versatile defaults.
  for (const fallback of ["dolly-in", "orbit-left", "crash-zoom"]) {
    if (ranked.length >= 3) break;
    const rule = RULES.find((r) => r.motionId === fallback)!;
    if (!ranked.includes(rule)) ranked.push(rule);
  }

  return ranked.slice(0, 3).map((r) => ({
    motionId: r.motionId,
    name: motionOf(r.motionId).name,
    why: r.why,
    score: scored.find((s) => s.rule === r)?.score ?? 0,
  }));
}

export function isKnownMotion(id: string) {
  return MOTIONS.some((m) => m.id === id);
}
