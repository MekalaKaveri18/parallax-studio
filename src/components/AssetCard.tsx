"use client";

import Link from "next/link";
import { Film, Heart, Play, Wand2 } from "lucide-react";
import { aspectCss, motionOf } from "@/lib/presets";
import { videoHref } from "@/lib/links";
import { useStore } from "@/lib/store";
import type { Asset, Job } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MotionMedia } from "./MotionMedia";
import { openViewer } from "./AssetViewer";

interface Props {
  asset: Asset;
  /** Ids used for prev/next navigation in the viewer. */
  siblings?: string[];
  /** Force a uniform tile instead of the asset's native aspect ratio. */
  square?: boolean;
}

export function AssetCard({ asset, siblings, square }: Props) {
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const isVideo = asset.kind === "video";

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5 transition hover:ring-white/20"
      style={{ aspectRatio: square ? "1 / 1" : aspectCss(asset.aspect) }}
    >
      <button
        onClick={() => openViewer(asset.id, siblings)}
        className="absolute inset-0 cursor-zoom-in"
        aria-label={`Open ${asset.kind}: ${asset.prompt}`}
      >
        <MotionMedia
          src={asset.url}
          alt={asset.prompt}
          motionId={isVideo ? asset.motionId : undefined}
          duration={asset.duration}
          intensity={asset.intensity}
          className="size-full"
        />
      </button>

      {isVideo && (
        <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
          <Play className="size-3 fill-current" />
          {motionOf(asset.motionId).name} · {asset.duration}s
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="line-clamp-2 text-xs text-white/85">{asset.prompt}</p>
        <div className="pointer-events-auto flex shrink-0 gap-1">
          {!isVideo && (
            <Link
              href={videoHref({ source: asset.id })}
              title="Animate with camera motion"
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-ink hover:bg-white"
            >
              <Wand2 className="size-3" /> Animate
            </Link>
          )}
        </div>
      </div>

      <button
        onClick={() => toggleFavorite(asset.id)}
        aria-label={asset.favorite ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "absolute right-2 top-2 rounded-full bg-black/50 p-1.5 backdrop-blur transition",
          asset.favorite ? "text-rose-400 opacity-100" : "text-white/80 opacity-0 group-hover:opacity-100 focus:opacity-100",
        )}
      >
        <Heart className={cn("size-3.5", asset.favorite && "fill-current")} />
      </button>
    </div>
  );
}

export function JobCard({ job, aspect }: { job: Job; aspect: string }) {
  const isVideo = job.params.kind === "video";
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-ink-800 ring-1 ring-accent/20"
      style={{ aspectRatio: aspect }}
    >
      {isVideo && job.params.kind === "video" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={job.params.sourceUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25 blur-md" />
      )}
      <div className="shimmer absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="flex items-center gap-2 text-xs text-white/70">
          {isVideo ? <Film className="size-3.5" /> : null}
          {job.status === "queued" ? "In queue…" : isVideo ? "Directing camera…" : "Developing…"}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{Math.round(job.progress * 100)}%</div>
        <div className="h-1 w-2/3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${job.progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
