export { clsx as cn } from "clsx";

export function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Small stable string hash (FNV-1a). */
export function hash(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Deterministic placeholder photo for a seed, sized to an aspect ratio. */
export function seededImage(seed: string, w: number, h: number, longEdge = 1024) {
  const scale = longEdge / Math.max(w, h);
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${pw}/${ph}`;
}

export function timeAgo(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Downscale an uploaded image to a JPEG data URL so it fits in localStorage. */
export async function fileToDataUrl(file: File, longEdge = 1024): Promise<{ url: string; w: number; h: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return { url: canvas.toDataURL("image/jpeg", 0.85), w, h };
}
