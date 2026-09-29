"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { create } from "zustand";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Film,
  Heart,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { aspectCss, aspectOf, motionOf, styleOf } from "@/lib/presets";
import { imageHref, videoHref } from "@/lib/links";
import { useStore } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { MotionMedia } from "./MotionMedia";
import { toast } from "./Toast";

const useViewer = create<{ id: string | null; list: string[] }>(() => ({ id: null, list: [] }));

export function openViewer(id: string, list: string[] = []) {
  useViewer.setState({ id, list });
}

function closeViewer() {
  useViewer.setState({ id: null });
}

async function download(asset: Asset) {
  const name = `parallax-${asset.id}.jpg`;
  try {
    const res = await fetch(asset.url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: name });
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    window.open(asset.url, "_blank", "noopener");
  }
}

export function AssetViewer() {
  const { id, list } = useViewer();
  const asset = useStore((s) => s.assets.find((a) => a.id === id));
  const source = useStore((s) => (asset?.sourceAssetId ? s.assets.find((a) => a.id === asset.sourceAssetId) : undefined));
  const { toggleFavorite, deleteAsset } = useStore.getState();
  const [playing, setPlaying] = useState(true);

  const idx = id ? list.indexOf(id) : -1;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft" && prev) useViewer.setState({ id: prev });
      if (e.key === "ArrowRight" && next) useViewer.setState({ id: next });
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [id, prev, next]);

  // Close if the asset disappears (e.g. deleted).
  useEffect(() => {
    if (id && !asset) closeViewer();
  }, [id, asset]);

  if (!id || !asset) return null;

  const isVideo = asset.kind === "video";
  const motion = isVideo ? motionOf(asset.motionId) : null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex bg-black/85 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={closeViewer} />

      <div className="relative m-auto flex max-h-[100dvh] w-full max-w-6xl flex-col gap-4 overflow-y-auto p-4 lg:flex-row lg:p-8">
        {/* Media */}
        <div className="relative flex flex-1 items-center justify-center">
          <MotionMedia
            key={asset.id}
            src={asset.url}
            alt={asset.prompt}
            motionId={motion?.id}
            duration={asset.duration}
            intensity={asset.intensity}
            playing={playing}
            force
            loading="eager"
            className="rounded-2xl"
            style={{
              aspectRatio: aspectCss(asset.aspect),
              width: `min(100%, calc(75dvh * ${aspectOf(asset.aspect).w / aspectOf(asset.aspect).h}))`,
            }}
          />
          {prev && (
            <button
              onClick={() => useViewer.setState({ id: prev })}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 hover:bg-black/80"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {next && (
            <button
              onClick={() => useViewer.setState({ id: next })}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 hover:bg-black/80"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
          {isVideo && (
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              className="absolute bottom-3 left-3 rounded-full bg-black/60 p-2 hover:bg-black/80"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          )}
        </div>

        {/* Details */}
        <aside className="relative w-full shrink-0 rounded-2xl border border-white/10 bg-ink-900 p-5 lg:w-80">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/70">
              {isVideo ? <Film className="size-3.5" /> : null}
              {isVideo ? "Video" : asset.uploaded ? "Upload" : "Image"} · {timeAgo(asset.createdAt)}
            </span>
            <button onClick={closeViewer} aria-label="Close" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="group relative">
            <p className="text-sm leading-relaxed text-white/90">{asset.prompt}</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(asset.prompt);
                toast({ tone: "success", title: "Prompt copied" }, 1800);
              }}
              className="mt-2 flex items-center gap-1 text-xs text-white/50 hover:text-white"
            >
              <Copy className="size-3" /> Copy prompt
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
            {isVideo ? (
              <>
                <Meta label="Motion" value={motion!.name} />
                <Meta label="Duration" value={`${asset.duration}s`} />
                <Meta label="Intensity" value={`${Math.round((asset.intensity ?? 1) * 100)}%`} />
              </>
            ) : (
              !asset.uploaded && <Meta label="Style" value={styleOf(asset.styleId).name} />
            )}
            <Meta label="Aspect" value={asset.aspect} />
          </dl>

          {isVideo && source && (
            <button
              onClick={() => useViewer.setState({ id: source.id, list: [] })}
              className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 p-2 text-left text-xs hover:bg-white/5"
            >
              <MotionMedia src={source.url} alt="" className="size-10 shrink-0 rounded-lg" />
              <span className="text-white/60">
                Source still
                <span className="block text-white/90">View original</span>
              </span>
            </button>
          )}

          <div className="mt-6 grid gap-2">
            {isVideo ? (
              source && (
                <ActionLink href={videoHref({ source: source.id, motion: asset.motionId })} primary onClick={closeViewer}>
                  <RefreshCw className="size-4" /> Try another motion
                </ActionLink>
              )
            ) : (
              <ActionLink href={videoHref({ source: asset.id })} primary onClick={closeViewer}>
                <Wand2 className="size-4" /> Animate this
              </ActionLink>
            )}
            {!asset.uploaded && (
              <ActionLink
                href={imageHref({ prompt: asset.prompt, styleId: asset.styleId, aspect: asset.aspect })}
                onClick={closeViewer}
              >
                <RefreshCw className="size-4" /> {isVideo ? "New image from prompt" : "Reuse prompt"}
              </ActionLink>
            )}
            <div className="grid grid-cols-3 gap-2">
              <IconAction label={isVideo ? "Still" : "Download"} onClick={() => download(asset)}>
                <Download className="size-4" />
              </IconAction>
              <IconAction label={asset.favorite ? "Saved" : "Favorite"} onClick={() => toggleFavorite(asset.id)} active={asset.favorite}>
                <Heart className={cn("size-4", asset.favorite && "fill-current")} />
              </IconAction>
              <IconAction
                label="Delete"
                onClick={() => {
                  if (next) useViewer.setState({ id: next });
                  else if (prev) useViewer.setState({ id: prev });
                  deleteAsset(asset.id);
                  toast({ tone: "success", title: "Deleted" }, 1800);
                }}
              >
                <Trash2 className="size-4" />
              </IconAction>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] p-2.5">
      <dt className="text-white/40">{label}</dt>
      <dd className="mt-0.5 text-white/90">{value}</dd>
    </div>
  );
}

function ActionLink({
  href,
  children,
  primary,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
        primary ? "bg-accent text-accent-ink hover:bg-white" : "bg-white/5 hover:bg-white/10",
      )}
    >
      {children}
    </Link>
  );
}

function IconAction({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl bg-white/5 py-2 text-[11px] text-white/70 hover:bg-white/10 hover:text-white",
        active && "text-rose-400",
      )}
    >
      {children}
      {label}
    </button>
  );
}
