"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { imageCost, planOf, STARTING_CREDITS, videoCost } from "./presets";
import { provider } from "./provider";
import type { AspectRatio, Asset, Job, JobParams, PlanId } from "./types";
import { uid } from "./utils";

export type SubmitResult = { ok: true; jobId: string } | { ok: false; reason: "credits" | "invalid" };

interface State {
  hydrated: boolean;
  credits: number;
  plan: PlanId;
  jobs: Job[];
  assets: Asset[];

  costOf(params: JobParams): number;
  submit(params: JobParams): SubmitResult;
  /** Advance the queue: start queued jobs within plan concurrency, update progress. Returns jobs ready to finalize. */
  tick(now: number): Job[];
  completeJob(jobId: string, urls: string[]): void;
  failJob(jobId: string, error: string): void;
  retryJob(jobId: string): SubmitResult;
  dismissJob(jobId: string): void;
  addUpload(url: string, aspect: AspectRatio): string;
  deleteAsset(assetId: string): void;
  toggleFavorite(assetId: string): void;
  changePlan(plan: PlanId): void;
  addCredits(amount: number): void;
  reset(): void;
}

function costOf(params: JobParams) {
  return params.kind === "image" ? imageCost(params.count) : videoCost(params.duration);
}

/** localStorage wrapper that never throws (quota exceeded, private mode). */
const safeStorage = createJSONStorage(() => ({
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      console.warn("Could not persist state", e);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
}));

const initial = {
  credits: STARTING_CREDITS,
  plan: "free" as PlanId,
  jobs: [] as Job[],
  assets: [] as Asset[],
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,

      costOf,

      submit(params) {
        if (params.kind === "image" && !params.prompt.trim()) return { ok: false, reason: "invalid" };
        if (params.kind === "video" && !params.sourceUrl) return { ok: false, reason: "invalid" };
        const cost = costOf(params);
        if (get().credits < cost) return { ok: false, reason: "credits" };
        const job: Job = {
          id: uid("job_"),
          params,
          status: "queued",
          progress: 0,
          cost,
          createdAt: Date.now(),
          durationMs: provider.estimateMs(params),
          assetIds: [],
        };
        set((s) => ({ credits: s.credits - cost, jobs: [job, ...s.jobs] }));
        return { ok: true, jobId: job.id };
      },

      tick(now) {
        const { jobs, plan } = get();
        const limit = planOf(plan).concurrency;
        let running = jobs.filter((j) => j.status === "running").length;
        let changed = false;
        const ready: Job[] = [];

        // Oldest queued jobs start first.
        const startable = new Set(
          jobs
            .filter((j) => j.status === "queued")
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, Math.max(0, limit - running))
            .map((j) => j.id),
        );

        const next = jobs.map((j) => {
          if (j.status === "queued" && startable.has(j.id)) {
            running++;
            changed = true;
            return { ...j, status: "running" as const, startedAt: now, progress: 0 };
          }
          if (j.status === "running" && j.startedAt) {
            // Ease-out curve that holds at 99% until the provider returns.
            const t = Math.min(1, (now - j.startedAt) / j.durationMs);
            const progress = Math.min(0.99, 1 - Math.pow(1 - t, 2));
            if (t >= 1) ready.push(j);
            if (Math.abs(progress - j.progress) > 0.004) {
              changed = true;
              return { ...j, progress };
            }
          }
          return j;
        });

        if (changed) set({ jobs: next });
        return ready;
      },

      completeJob(jobId, urls) {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job || job.status !== "running") return;
        const p = job.params;
        const now = Date.now();
        const assets: Asset[] = urls.map((url, i) =>
          p.kind === "image"
            ? {
                id: uid("img_"),
                jobId,
                kind: "image",
                url,
                aspect: p.aspect,
                prompt: p.prompt,
                styleId: p.styleId,
                createdAt: now + i,
                favorite: false,
              }
            : {
                id: uid("vid_"),
                jobId,
                kind: "video",
                url,
                aspect: p.aspect,
                prompt: p.prompt,
                motionId: p.motionId,
                duration: p.duration,
                intensity: p.intensity,
                sourceAssetId: p.sourceAssetId,
                createdAt: now + i,
                favorite: false,
              },
        );
        set((s) => ({
          assets: [...assets, ...s.assets],
          jobs: s.jobs.map((j) =>
            j.id === jobId ? { ...j, status: "done", progress: 1, assetIds: assets.map((a) => a.id) } : j,
          ),
        }));
      },

      failJob(jobId, error) {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job || job.status === "done" || job.status === "failed") return;
        set((s) => ({
          credits: s.credits + job.cost, // failed generations are refunded
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, status: "failed", error } : j)),
        }));
      },

      retryJob(jobId) {
        const job = get().jobs.find((j) => j.id === jobId);
        if (!job) return { ok: false, reason: "invalid" };
        const res = get().submit(job.params);
        if (res.ok) get().dismissJob(jobId);
        return res;
      },

      dismissJob(jobId) {
        set((s) => ({ jobs: s.jobs.filter((j) => j.id !== jobId || j.status === "running" || j.status === "queued") }));
      },

      addUpload(url, aspect) {
        const asset: Asset = {
          id: uid("up_"),
          jobId: "upload",
          kind: "image",
          url,
          aspect,
          prompt: "Uploaded image",
          createdAt: Date.now(),
          favorite: false,
          uploaded: true,
        };
        set((s) => ({ assets: [asset, ...s.assets] }));
        return asset.id;
      },

      deleteAsset(assetId) {
        set((s) => ({ assets: s.assets.filter((a) => a.id !== assetId) }));
      },

      toggleFavorite(assetId) {
        set((s) => ({ assets: s.assets.map((a) => (a.id === assetId ? { ...a, favorite: !a.favorite } : a)) }));
      },

      changePlan(plan) {
        const current = get().plan;
        if (plan === current) return;
        // Mock checkout: upgrading grants the plan's monthly credits immediately.
        const grant = planOf(plan).credits > planOf(current).credits ? planOf(plan).credits : 0;
        set((s) => ({ plan, credits: s.credits + grant }));
      },

      addCredits(amount) {
        set((s) => ({ credits: s.credits + amount }));
      },

      reset() {
        set({ ...initial });
      },
    }),
    {
      name: "parallax-studio",
      version: 1,
      storage: safeStorage,
      skipHydration: true,
      partialize: (s) => ({ credits: s.credits, plan: s.plan, jobs: s.jobs, assets: s.assets }),
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);

export const selectActiveJobs = (s: State) => s.jobs.filter((j) => j.status === "queued" || j.status === "running");
