"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Copy, Pause, Play, Wand2 } from "lucide-react";
import { MotionMedia } from "@/components/MotionMedia";
import { toast } from "@/components/Toast";
import { Segmented } from "@/components/ui";
import { DURATIONS, MOTIONS, motionOf, nearestAspect } from "@/lib/presets";
import { videoHref } from "@/lib/links";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Only https images; the preview is an <img>, never fetched server-side. */
function safeSrc(v: string | null) {
  if (!v || v.length > 2048) return null;
  try {
    return new URL(v).protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}

const clampK = (v: number) => (Number.isFinite(v) ? Math.min(1.5, Math.max(0.5, v)) : 1);

export function Watch() {
  const params = useSearchParams();
  const router = useRouter();
  const src = safeSrc(params.get("src"));

  const [motionId, setMotionId] = useState(MOTIONS.some((m) => m.id === params.get("motion")) ? params.get("motion")! : "dolly-in");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(
    (DURATIONS as readonly number[]).includes(Number(params.get("d"))) ? (Number(params.get("d")) as (typeof DURATIONS)[number]) : 5,
  );
  const [intensity, setIntensity] = useState(clampK(Number(params.get("k") ?? 1)));
  const [playing, setPlaying] = useState(true);
  const [ratio, setRatio] = useState<{ w: number; h: number } | null>(null);
  const addUpload = useStore((s) => s.addUpload);
  const hydrated = useStore((s) => s.hydrated);

  // Read the image's natural size so the frame matches it.
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setRatio({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Keep the URL shareable as the user tweaks the shot.
  useEffect(() => {
    if (!src) return;
    const q = new URLSearchParams({ src, motion: motionId, d: String(duration) });
    if (intensity !== 1) q.set("k", String(intensity));
    window.history.replaceState(null, "", `/watch?${q}`);
  }, [src, motionId, duration, intensity]);

  if (!src) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Nothing to preview</h1>
        <p className="mt-2 text-sm text-white/50">This preview link is missing an https image. Try creating one in the studio.</p>
        <Link href="/create/video" className="mt-6 inline-block rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
          Open the video studio
        </Link>
      </div>
    );
  }

  const motion = motionOf(motionId);
  const w = ratio?.w ?? 16;
  const h = ratio?.h ?? 9;

  function openInStudio() {
    const aspect = nearestAspect(w, h);
    const id = addUpload(src!, aspect);
    router.push(videoHref({ source: id, motion: motionId }));
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px]">
      <section className="flex flex-col items-center">
        <div className="relative w-full" style={{ maxWidth: `calc(70dvh * ${w / h})` }}>
          <MotionMedia
            key={`${motionId}-${duration}`}
            src={src}
            alt="Shot preview"
            motionId={motionId}
            duration={duration}
            intensity={intensity}
            playing={playing}
            pauseMode="hold"
            force
            loading="eager"
            className="rounded-2xl ring-1 ring-white/10"
            style={{ aspectRatio: `${w} / ${h}` }}
          />
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs backdrop-blur">
            {motion.name} · {duration}s · free preview
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause" : "Play"}
            className="absolute bottom-3 left-3 rounded-full bg-black/60 p-2 hover:bg-black/80"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
        <p className="mt-3 max-w-lg text-center text-xs text-white/40">{motion.description}</p>
      </section>

      <aside className="rounded-2xl border border-white/10 bg-ink-900 p-4 lg:sticky lg:top-20 lg:self-start">
        <h1 className="text-sm font-semibold">Direct this shot</h1>
        <p className="mt-1 text-xs text-white/50">Switch moves freely. Nothing is rendered or charged until you take it to the studio.</p>

        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {MOTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMotionId(m.id)}
              aria-pressed={m.id === motionId}
              className={cn(
                "rounded-lg px-2 py-1.5 text-[11px] transition",
                m.id === motionId ? "bg-accent font-semibold text-accent-ink" : "bg-white/5 text-white/70 hover:bg-white/10",
              )}
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Segmented label="Duration" options={DURATIONS} value={duration} onChange={setDuration} format={(d) => `${d}s`} />
        </div>
        <label className="mt-4 block text-xs text-white/50">
          Intensity {Math.round(intensity * 100)}%
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--color-accent)]"
          />
        </label>

        <div className="mt-5 grid gap-2">
          <button
            onClick={openInStudio}
            disabled={!hydrated}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-white disabled:opacity-50"
          >
            <Wand2 className="size-4" /> Animate in studio
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast({ tone: "success", title: "Preview link copied" }, 1800);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10"
          >
            <Copy className="size-4" /> Copy share link
          </button>
        </div>
      </aside>
    </div>
  );
}
