"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Eye, Film, ImagePlus, Upload, X } from "lucide-react";
import { AssetCard, JobCard } from "@/components/AssetCard";
import { MotionMedia } from "@/components/MotionMedia";
import { toast } from "@/components/Toast";
import { FieldLabel, GenerateButton, Segmented } from "@/components/ui";
import {
  aspectCss,
  aspectOf,
  DURATIONS,
  MOTION_CATEGORIES,
  MOTIONS,
  motionOf,
  nearestAspect,
  videoCost,
  type MotionCategory,
} from "@/lib/presets";
import { useStore } from "@/lib/store";
import { cn, fileToDataUrl, seededImage } from "@/lib/utils";

/** Remount when the query changes so "Animate this" links preselect even on this page. */
export function VideoStudio() {
  const params = useSearchParams();
  return <Studio key={params.toString()} initialSource={params.get("source")} initialMotion={params.get("motion")} />;
}

function Studio({ initialSource, initialMotion }: { initialSource: string | null; initialMotion: string | null }) {
  const [sourceId, setSourceId] = useState<string | null>(initialSource);
  const [motionId, setMotionId] = useState(MOTIONS.some((m) => m.id === initialMotion) ? initialMotion! : "dolly-in");
  const [category, setCategory] = useState<MotionCategory | "All">("All");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(5);
  const [intensity, setIntensity] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [picking, setPicking] = useState(false);

  const hydrated = useStore((s) => s.hydrated);
  const credits = useStore((s) => s.credits);
  const submit = useStore((s) => s.submit);
  const images = useStore(useShallow((s) => s.assets.filter((a) => a.kind === "image")));
  const videos = useStore(useShallow((s) => s.assets.filter((a) => a.kind === "video")));
  const jobs = useStore(useShallow((s) => s.jobs.filter((j) => j.params.kind === "video" && (j.status === "queued" || j.status === "running"))));
  const videoIds = useMemo(() => videos.map((v) => v.id), [videos]);

  const source = images.find((a) => a.id === sourceId) ?? null;
  const motion = motionOf(motionId);
  const cost = videoCost(duration);
  const visibleMotions = category === "All" ? MOTIONS : MOTIONS.filter((m) => m.category === category);

  function generate() {
    if (!source) {
      setPicking(true);
      toast({ tone: "error", title: "Choose a source image first" });
      return;
    }
    const res = submit({
      kind: "video",
      prompt: prompt.trim() || source.prompt,
      sourceAssetId: source.id,
      sourceUrl: source.url,
      aspect: source.aspect,
      motionId,
      duration,
      intensity,
    });
    if (!res.ok && res.reason === "credits") {
      toast({ tone: "error", title: `Not enough credits (${cost} needed)`, action: { label: "Get credits", href: "/pricing" } });
    }
  }

  return (
    <div
      className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_1fr]"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          generate();
        }
      }}
    >
      {/* Controls */}
      <section className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-white/10 bg-ink-900 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Film className="size-4 text-accent" />
            <h1 className="text-sm font-semibold">Create video</h1>
          </div>

          <FieldLabel>Source image</FieldLabel>
          {source ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-950 p-2">
              <MotionMedia src={source.url} alt={source.prompt} className="size-14 shrink-0 rounded-lg" />
              <p className="line-clamp-2 flex-1 text-xs text-white/70">{source.prompt}</p>
              <button
                onClick={() => setPicking(true)}
                className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs hover:bg-white/10"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => setPicking(true)}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-ink-950 px-4 py-6 text-sm text-white/60 transition hover:border-accent/50 hover:text-white"
            >
              <ImagePlus className="size-6" />
              Choose from library or upload
            </button>
          )}

          <div className="mt-5">
            <FieldLabel hint={motion.category}>Camera motion</FieldLabel>
            <div className="rounded-xl border border-white/10 bg-ink-950 px-3 py-2.5">
              <div className="text-sm font-medium">{motion.name}</div>
              <div className="text-xs text-white/50">{motion.description}</div>
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel hint={`${videoCost(1)} credits / sec`}>Duration</FieldLabel>
            <Segmented label="Duration" options={DURATIONS} value={duration} onChange={setDuration} format={(d) => `${d}s`} />
          </div>

          <div className="mt-5">
            <FieldLabel hint={`${Math.round(intensity * 100)}%`}>Intensity</FieldLabel>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              aria-label="Motion intensity"
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-[11px] text-white/30">
              <span>Subtle</span>
              <span>Dramatic</span>
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel hint="Optional">Describe the shot</FieldLabel>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={300}
              placeholder={source?.prompt ?? "e.g. hair blowing in the wind"}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-accent/50"
            />
          </div>

          <div className="mt-6">
            <GenerateButton cost={cost} credits={credits} disabled={!hydrated} onClick={generate} label="Generate video" />
          </div>
        </div>
      </section>

      {/* Preview + motion gallery */}
      <section className="min-w-0">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="xl:sticky xl:top-20 xl:self-start">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium text-white/70">
                <Eye className="size-4" /> Live preview
              </h2>
              <span className="text-xs text-white/40">Free · no credits used</span>
            </div>
            {source ? (
              <div className="relative mx-auto" style={{ width: `min(100%, calc(60dvh * ${aspectOf(source.aspect).w / aspectOf(source.aspect).h}))` }}>
                <MotionMedia
                  key={`${source.id}-${motionId}-${duration}`}
                  src={source.url}
                  alt={source.prompt}
                  motionId={motionId}
                  duration={duration}
                  intensity={intensity}
                  force
                  loading="eager"
                  className="rounded-2xl ring-1 ring-white/10"
                  style={{ aspectRatio: aspectCss(source.aspect) }}
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs backdrop-blur">
                  {motion.name} · {duration}s
                </span>
              </div>
            ) : (
              <button
                onClick={() => setPicking(true)}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 text-sm text-white/50 hover:border-white/25"
              >
                <ImagePlus className="size-8" />
                Pick an image to preview motions on it
              </button>
            )}
          </div>

          <div>
            <div className="scrollbar-none mb-3 flex gap-1 overflow-x-auto">
              {(["All", ...MOTION_CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs transition",
                    category === c ? "bg-white text-ink-950" : "bg-white/5 text-white/60 hover:text-white",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {visibleMotions.map((m) => (
                <MotionTile
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  isNew={m.isNew}
                  selected={m.id === motionId}
                  src={source?.url}
                  onSelect={() => setMotionId(m.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-10" aria-live="polite">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">Your videos</h2>
            {videos.length > 0 && <span className="text-xs text-white/40">{videos.length} total</span>}
          </div>
          {hydrated && jobs.length === 0 && videos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              Videos you generate appear here.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} aspect="1 / 1" />
              ))}
              {videos.map((v) => (
                <AssetCard key={v.id} asset={v} siblings={videoIds} square />
              ))}
            </div>
          )}
        </div>
      </section>

      {picking && (
        <SourcePicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            setSourceId(id);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function MotionTile({
  id,
  name,
  isNew,
  selected,
  src,
  onSelect,
}: {
  id: string;
  name: string;
  isNew?: boolean;
  selected: boolean;
  src?: string;
  onSelect: () => void;
}) {
  const [hover, setHover] = useState(false);
  const thumb = src ?? seededImage(motionOf(id).thumbSeed, 4, 3, 480);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-xl text-left ring-2 transition",
        selected ? "ring-accent" : "ring-transparent hover:ring-white/20",
      )}
    >
      <MotionMedia
        src={thumb}
        alt=""
        motionId={id}
        duration={3}
        playing={hover || selected}
        className="aspect-[4/3]"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6 text-xs font-medium">
        {name}
        {isNew && <span className="rounded bg-accent px-1 py-px text-[9px] font-bold uppercase text-accent-ink">New</span>}
      </span>
    </button>
  );
}

function SourcePicker({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const images = useStore(useShallow((s) => s.assets.filter((a) => a.kind === "image")));
  const addUpload = useStore((s) => s.addUpload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ tone: "error", title: "That file isn't an image" });
      return;
    }
    setBusy(true);
    try {
      const { url, w, h } = await fileToDataUrl(file);
      onPick(addUpload(url, nearestAspect(w, h)));
    } catch {
      toast({ tone: "error", title: "Couldn't read that image" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[85dvh] w-full max-w-3xl flex-col rounded-t-2xl border border-white/10 bg-ink-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <h2 className="text-sm font-semibold">Choose a source image</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm transition",
              drag ? "border-accent bg-accent/10 text-white" : "border-white/15 text-white/60 hover:border-white/30",
            )}
          >
            <Upload className="size-5" />
            {busy ? "Processing…" : "Drop an image, or click to upload"}
            <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>

          <h3 className="mb-2 mt-5 text-xs font-medium uppercase tracking-wider text-white/50">From your library</h3>
          {images.length === 0 ? (
            <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-white/50">
              No images yet.{" "}
              <Link href="/create/image" className="text-accent hover:underline">
                Generate one
              </Link>{" "}
              or upload above.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onPick(a.id)}
                  className="overflow-hidden rounded-lg ring-2 ring-transparent transition hover:ring-accent"
                >
                  <MotionMedia src={a.url} alt={a.prompt} className="aspect-square" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
