import type { AspectRatio } from "./types";

export function imageHref(p: { prompt?: string; styleId?: string; aspect?: AspectRatio }) {
  const q = new URLSearchParams();
  if (p.prompt) q.set("prompt", p.prompt);
  if (p.styleId && p.styleId !== "none") q.set("style", p.styleId);
  if (p.aspect) q.set("aspect", p.aspect);
  const s = q.toString();
  return `/create/image${s ? `?${s}` : ""}`;
}

export function videoHref(p: { source?: string | null; motion?: string }) {
  const q = new URLSearchParams();
  if (p.source) q.set("source", p.source);
  if (p.motion) q.set("motion", p.motion);
  const s = q.toString();
  return `/create/video${s ? `?${s}` : ""}`;
}
