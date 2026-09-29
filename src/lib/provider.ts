import { aspectOf } from "./presets";
import type { ImageParams, JobParams } from "./types";
import { hash, seededImage } from "./utils";

/**
 * Generation backend. The app only talks to this interface, so a real model API
 * (Replicate, fal.ai, ...) can replace the mock without touching the UI.
 *
 * For images, `finalize` returns one URL per output. For videos, the mock returns
 * the source still; motion is rendered client-side from the job's motion preset.
 */
export interface GenerationProvider {
  name: string;
  /** Expected generation time, used to drive queue progress. */
  estimateMs(params: JobParams): number;
  finalize(params: JobParams, jobId: string): Promise<string[]>;
}

function preload(url: string, timeoutMs = 8000) {
  return new Promise<void>((resolve) => {
    if (url.startsWith("data:")) return resolve();
    const img = new Image();
    const done = () => resolve();
    const t = setTimeout(done, timeoutMs);
    img.onload = img.onerror = () => {
      clearTimeout(t);
      done();
    };
    img.src = url;
  });
}

function mockImageUrls(params: ImageParams, jobId: string) {
  const { w, h } = aspectOf(params.aspect);
  return Array.from({ length: params.count }, (_, i) =>
    seededImage(hash(`${params.prompt}|${params.styleId}|${jobId}|${i}`), w, h),
  );
}

export const mockProvider: GenerationProvider = {
  name: "mock",
  estimateMs(params) {
    const jitter = Math.random() * 1500;
    return params.kind === "image"
      ? 3000 + params.count * 900 + jitter
      : 5500 + params.duration * 800 + jitter;
  },
  async finalize(params, jobId) {
    const urls = params.kind === "image" ? mockImageUrls(params, jobId) : [params.sourceUrl];
    // Warm the browser cache so results appear the instant the job completes.
    await Promise.all(urls.map((u) => preload(u)));
    return urls;
  },
};

export const provider: GenerationProvider = mockProvider;
