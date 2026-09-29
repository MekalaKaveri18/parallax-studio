"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AlertTriangle, Film, ImageIcon, Layers, RotateCcw, Search, X } from "lucide-react";
import { AssetCard, JobCard } from "@/components/AssetCard";
import { openViewer } from "@/components/AssetViewer";
import { toast } from "@/components/Toast";
import { Masonry } from "@/components/Masonry";
import { aspectCss, aspectOf } from "@/lib/presets";
import type { Asset, Job } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "favorite", label: "Favorites" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

type Tile = { type: "job"; job: Job } | { type: "asset"; asset: Asset };
const tileKey = (t: Tile) => (t.type === "job" ? t.job.id : t.asset.id);
const tileRatio = (t: Tile) => {
  const { w, h } = aspectOf(t.type === "job" ? t.job.params.aspect : t.asset.aspect);
  return h / w;
};

export function Library() {
  const params = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const hydrated = useStore((s) => s.hydrated);
  const assets = useStore((s) => s.assets);
  const active = useStore(useShallow((s) => s.jobs.filter((j) => j.status === "queued" || j.status === "running")));
  const failed = useStore(useShallow((s) => s.jobs.filter((j) => j.status === "failed")));
  const { retryJob, dismissJob } = useStore.getState();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filter === "favorite" && !a.favorite) return false;
      if ((filter === "image" || filter === "video") && a.kind !== filter) return false;
      return !q || a.prompt.toLowerCase().includes(q);
    });
  }, [assets, filter, query]);
  const ids = useMemo(() => shown.map((a) => a.id), [shown]);

  // Deep link from the "ready" toast: /library?open=<jobId>
  const openJob = params.get("open");
  useEffect(() => {
    if (!hydrated || !openJob) return;
    const first = assets.find((a) => a.jobId === openJob);
    if (first) openViewer(first.id, assets.map((a) => a.id));
    router.replace("/library", { scroll: false });
  }, [hydrated, openJob, assets, router]);

  const counts = {
    all: assets.length,
    image: assets.filter((a) => a.kind === "image").length,
    video: assets.filter((a) => a.kind === "video").length,
    favorite: assets.filter((a) => a.favorite).length,
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="mt-1 text-sm text-white/50">Everything you&apos;ve made, saved in this browser.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex rounded-full bg-white/5 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition",
                  filter === f.id ? "bg-white text-ink-950" : "text-white/60 hover:text-white",
                )}
              >
                {f.label}
                {hydrated && <span className="ml-1 opacity-50 tabular-nums">{counts[f.id]}</span>}
              </button>
            ))}
          </div>
          <label className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:w-56 sm:flex-none">
            <Search className="size-3.5 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X className="size-3.5 text-white/40" />
              </button>
            )}
          </label>
        </div>
      </div>

      {failed.length > 0 && (
        <div className="mb-4 space-y-2">
          {failed.map((j) => (
            <div key={j.id} className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-amber-400" />
              <span className="flex-1 truncate text-white/70">
                Generation failed: {j.error ?? "unknown error"}. {j.cost} credits refunded.
              </span>
              <button
                onClick={() => {
                  const r = retryJob(j.id);
                  if (!r.ok) toast({ tone: "error", title: "Not enough credits to retry", action: { label: "Get credits", href: "/pricing" } });
                }}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
              >
                <RotateCcw className="size-3" /> Retry
              </button>
              <button onClick={() => dismissJob(j.id)} aria-label="Dismiss" className="text-white/40 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!hydrated ? (
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4 xl:columns-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="shimmer mb-3 rounded-xl" style={{ aspectRatio: i % 3 ? "3 / 4" : "16 / 9" }} />
          ))}
        </div>
      ) : assets.length === 0 && active.length === 0 ? (
        <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <Layers className="mb-3 size-8 text-white/30" />
          <h2 className="text-lg font-semibold">Nothing here yet</h2>
          <p className="mt-1 text-sm text-white/50">Generate an image, then bring it to life with camera motion.</p>
          <div className="mt-5 flex gap-2">
            <Link href="/create/image" className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-white">
              <ImageIcon className="size-4" /> Create image
            </Link>
            <Link href="/create/video" className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              <Film className="size-4" /> Animate an upload
            </Link>
          </div>
        </div>
      ) : shown.length === 0 && (filter !== "all" || query) ? (
        <p className="py-20 text-center text-sm text-white/40">No matches. Try another filter or search.</p>
      ) : (
        <Masonry
          items={[
            ...(filter === "all" && !query ? active.map((job) => ({ type: "job" as const, job })) : []),
            ...shown.map((asset) => ({ type: "asset" as const, asset })),
          ]}
          getKey={tileKey}
          getRatio={tileRatio}
          minColumnWidth={220}
          render={(t) =>
            t.type === "job" ? (
              <JobCard job={t.job} aspect={aspectCss(t.job.params.aspect)} />
            ) : (
              <AssetCard asset={t.asset} siblings={ids} />
            )
          }
        />
      )}
    </div>
  );
}
