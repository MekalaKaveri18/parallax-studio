import type { AspectRatio } from "./types";

export const PROMPT_IDEAS = [
  "A lone astronaut sitting at a neon diner counter at 3am, rain on the windows",
  "Close-up portrait of a skateboarder mid-laugh, golden hour backlight",
  "Brutalist concrete villa on a cliff above a stormy sea",
  "A fox in a tailored tweed suit reading a newspaper on a Paris metro",
  "Perfume bottle floating above still water, soft caustic reflections",
  "Tokyo alley at dusk, lanterns glowing, a cat on a vending machine",
  "Desert highway motel sign flickering under a violet sky",
  "Ballet dancer frozen mid-leap in an abandoned warehouse, dust in light beams",
  "Vintage red convertible parked by a lemon grove on the Amalfi coast",
  "Macro shot of dew on a spider web at sunrise",
];

export interface FeedItem {
  id: string;
  seed: string;
  prompt: string;
  styleId: string;
  aspect: AspectRatio;
  motionId?: string;
  author: string;
}

/** Curated community feed. Items with a motion preview animate in place. */
export const FEED: FeedItem[] = [
  { id: "f1", seed: "feed-orbit-1", prompt: "Rooftop portrait at blue hour, city lights bokeh", styleId: "cinematic", aspect: "3:4", motionId: "orbit-left", author: "mira.k" },
  { id: "f2", seed: "feed-2", prompt: "Mountain lake at dawn, mist rolling over the water", styleId: "analog", aspect: "16:9", motionId: "dolly-in", author: "tomas" },
  { id: "f3", seed: "feed-3", prompt: "Street fashion editorial in a laundromat, direct flash", styleId: "y2k", aspect: "3:4", author: "juno" },
  { id: "f4", seed: "feed-4", prompt: "Empty highway through the desert, heat shimmer", styleId: "cinematic", aspect: "16:9", motionId: "crash-zoom", author: "rafa" },
  { id: "f5", seed: "feed-5", prompt: "Minimal ceramic vase on travertine, morning shadows", styleId: "product", aspect: "1:1", author: "studio.ono" },
  { id: "f6", seed: "feed-6", prompt: "Forest path swallowed by fog, lone figure in red", styleId: "dream", aspect: "9:16", motionId: "levitate", author: "elin" },
  { id: "f7", seed: "feed-7", prompt: "Old jazz club, smoke curling through a spotlight", styleId: "noir", aspect: "4:3", motionId: "rack-focus", author: "dex" },
  { id: "f8", seed: "feed-8", prompt: "Coastal cliffs and crashing waves from above", styleId: "cinematic", aspect: "16:9", author: "aya" },
  { id: "f9", seed: "feed-9", prompt: "Portrait in a moving train, window light flicker", styleId: "analog", aspect: "3:4", motionId: "handheld", author: "leo.v" },
  { id: "f10", seed: "feed-10", prompt: "Glass skyscraper reflecting a storm front", styleId: "neon", aspect: "9:16", motionId: "tilt-up", author: "kai" },
  { id: "f11", seed: "feed-11", prompt: "Cozy cabin interior, snowfall outside, warm lamp", styleId: "analog", aspect: "4:3", author: "noor" },
  { id: "f12", seed: "feed-12", prompt: "Dancer spinning on a rooftop at sunset", styleId: "editorial", aspect: "3:4", motionId: "dutch-roll", author: "pia" },
  { id: "f13", seed: "feed-13", prompt: "Neon ramen shop sign in the rain", styleId: "neon", aspect: "1:1", motionId: "pan-right", author: "hiro" },
  { id: "f14", seed: "feed-14", prompt: "Wildflower field under a thunderstorm sky", styleId: "dream", aspect: "16:9", motionId: "earthquake", author: "sol" },
  { id: "f15", seed: "feed-15", prompt: "Sneaker floating in a pastel void, studio light", styleId: "product", aspect: "1:1", motionId: "heartbeat", author: "drop.lab" },
  { id: "f16", seed: "feed-16", prompt: "Harbor at night, boats bobbing, sodium lamps", styleId: "cinematic", aspect: "4:3", motionId: "dolly-out", author: "ines" },
];

const EXTRA_PROMPTS = [
  "Night market in Taipei, steam rising from food stalls",
  "Surfer walking into fog at dawn, board under arm",
  "Retro arcade glowing in an empty mall",
  "Horse galloping through shallow water at sunset",
  "Botanical greenhouse with light pouring through glass",
  "Motorcycle racer leaning into a mountain curve",
  "Grandmother laughing in a sunlit kitchen, flour in the air",
  "Iceland black sand beach, lone figure in yellow coat",
  "Skyscraper window washer high above a foggy city",
  "Jazz trumpeter silhouetted against stage lights",
  "Lantern festival over a river, thousands of lights",
  "Chef plating a dish, sparks from a flambé",
  "Kid on a bicycle racing a train through wheat fields",
  "Underwater portrait, hair floating, sun rays from above",
];

const AUTHORS = ["mira.k", "tomas", "juno", "rafa", "studio.ono", "elin", "dex", "aya", "leo.v", "kai", "noor", "pia", "hiro", "sol", "drop.lab", "ines", "otto", "zara.films", "mk.frames", "lumen"];
const FEED_STYLES = ["cinematic", "editorial", "noir", "neon", "y2k", "analog", "product", "dream"];
const FEED_ASPECTS: AspectRatio[] = ["3:4", "16:9", "1:1", "9:16", "4:3", "3:4"];
const FEED_MOTIONS = ["dolly-in", "orbit-left", "crash-zoom", "pan-right", "levitate", "rack-focus", "tilt-up", "dutch-roll", "handheld", "dolly-out", "whip-pan", "snap-out"];

/** Small deterministic PRNG so generated pages are stable across renders and reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PROMPT_POOL = [...FEED.map((f) => f.prompt), ...PROMPT_IDEAS, ...EXTRA_PROMPTS];

/** Items after the curated set, generated on demand for the endless feed. */
export function generatedFeed(start: number, count: number): FeedItem[] {
  return Array.from({ length: count }, (_, i) => {
    const n = start + i;
    const rand = mulberry32(n * 7919 + 13);
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
    return {
      id: `g${n}`,
      seed: `gen-feed-${n}`,
      prompt: pick(PROMPT_POOL),
      styleId: pick(FEED_STYLES),
      aspect: pick(FEED_ASPECTS),
      motionId: rand() < 0.55 ? pick(FEED_MOTIONS) : undefined,
      author: pick(AUTHORS),
    };
  });
}

/** Total feed length before we show the "you've seen it all" end card. */
export const FEED_LIMIT = 120;
