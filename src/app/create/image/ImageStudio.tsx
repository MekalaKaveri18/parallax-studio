"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Dices, ImageIcon, Sparkles } from "lucide-react";
import { AssetCard, JobCard } from "@/components/AssetCard";
import { MotionMedia } from "@/components/MotionMedia";
import { toast } from "@/components/Toast";
import { AspectPicker, FieldLabel, GenerateButton, Segmented } from "@/components/ui";
import { PROMPT_IDEAS } from "@/lib/feed";
import { ASPECTS, aspectCss, aspectOf, imageCost, STYLES } from "@/lib/presets";
import { useStore } from "@/lib/store";
import type { AspectRatio } from "@/lib/types";
import { cn, seededImage } from "@/lib/utils";

const COUNTS = [1, 2, 3, 4] as const;
const MAX_PROMPT = 600;

/** Remount when the query changes so "Recreate"/"Reuse prompt" links prefill even on this page. */
export function ImageStudio() {
  const params = useSearchParams();
  return <Studio key={params.toString()} params={params} />;
}

function Studio({ params }: { params: URLSearchParams }) {
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [styleId, setStyleId] = useState(() => {
    const s = params.get("style");
    return STYLES.some((x) => x.id === s) ? s! : "cinematic";
  });
  const [aspect, setAspect] = useState<AspectRatio>(() => {
    const a = params.get("aspect");
    return ASPECTS.some((x) => x.id === a) ? (a as AspectRatio) : "3:4";
  });
  const [count, setCount] = useState<(typeof COUNTS)[number]>(2);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const credits = useStore((s) => s.credits);
  const hydrated = useStore((s) => s.hydrated);
  const submit = useStore((s) => s.submit);
  const jobs = useStore(useShallow((s) => s.jobs.filter((j) => j.params.kind === "image" && (j.status === "queued" || j.status === "running"))));
  const assets = useStore(useShallow((s) => s.assets.filter((a) => a.kind === "image")));
  const ids = useMemo(() => assets.map((a) => a.id), [assets]);

  const cost = imageCost(count);
  const canSubmit = prompt.trim().length > 0 && hydrated;

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  function generate() {
    if (!prompt.trim()) {
      textRef.current?.focus();
      toast({ tone: "error", title: "Describe what you want to see first" });
      return;
    }
    const res = submit({ kind: "image", prompt: prompt.trim(), styleId, aspect, count });
    if (!res.ok && res.reason === "credits") {
      toast({ tone: "error", title: `Not enough credits (${cost} needed)`, action: { label: "Get credits", href: "/pricing" } });
    }
  }

  function surprise() {
    const pool = PROMPT_IDEAS.filter((p) => p !== prompt);
    setPrompt(pool[Math.floor(Math.random() * pool.length)]);
    textRef.current?.focus();
  }

  return (
    <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <section className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-white/10 bg-ink-900 p-4">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon className="size-4 text-accent" />
            <h1 className="text-sm font-semibold">Create image</h1>
          </div>

          <FieldLabel
            hint={
              <button onClick={surprise} className="flex items-center gap-1 hover:text-white">
                <Dices className="size-3.5" /> Surprise me
              </button>
            }
          >
            Prompt
          </FieldLabel>
          <div className="rounded-xl border border-white/10 bg-ink-950 focus-within:border-accent/50">
            <textarea
              ref={textRef}
              value={prompt}
              maxLength={MAX_PROMPT}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  generate();
                }
              }}
              rows={4}
              placeholder="Describe a scene, subject, mood…"
              className="block w-full resize-none bg-transparent p-3 text-sm outline-none placeholder:text-white/30"
            />
            <div className="flex justify-end px-3 pb-2 text-[11px] tabular-nums text-white/30">
              {prompt.length}/{MAX_PROMPT}
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel hint={STYLES.find((s) => s.id === styleId)?.name}>Style</FieldLabel>
            <div className="grid grid-cols-5 gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyleId(s.id)}
                  title={s.name}
                  aria-pressed={styleId === s.id}
                  className={cn(
                    "group relative overflow-hidden rounded-lg ring-2 transition",
                    styleId === s.id ? "ring-accent" : "ring-transparent hover:ring-white/20",
                  )}
                >
                  <MotionMedia src={seededImage(s.thumbSeed, 1, 1, 160)} alt="" className="aspect-square" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-1 pb-1 pt-3 text-[10px] font-medium">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel hint={aspectOf(aspect).label}>Aspect ratio</FieldLabel>
            <AspectPicker value={aspect} onChange={setAspect} />
          </div>

          <div className="mt-5">
            <FieldLabel hint={`${imageCost(1)} credits each`}>Images</FieldLabel>
            <Segmented label="Number of images" options={COUNTS} value={count} onChange={setCount} />
          </div>

          <div className="mt-6">
            <GenerateButton cost={cost} credits={credits} disabled={!canSubmit} onClick={generate} />
          </div>
        </div>
      </section>

      {/* Results */}
      <section aria-live="polite">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/70">Your images</h2>
          {assets.length > 0 && <span className="text-xs text-white/40">{assets.length} total</span>}
        </div>

        {!hydrated ? (
          <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="shimmer mb-3 rounded-xl" style={{ aspectRatio: i % 2 ? "3 / 4" : "1 / 1" }} />
            ))}
          </div>
        ) : jobs.length === 0 && assets.length === 0 ? (
          <EmptyState onPick={(p) => setPrompt(p)} />
        ) : (
          <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
            {jobs.flatMap((j) =>
              Array.from({ length: j.params.kind === "image" ? j.params.count : 1 }, (_, i) => (
                <JobCard key={`${j.id}-${i}`} job={j} aspect={aspectCss(j.params.aspect)} />
              )),
            )}
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} siblings={ids} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-8 text-center">
      <div className="brand-gradient mb-4 grid size-12 place-items-center rounded-2xl text-accent-ink">
        <Sparkles className="size-6" />
      </div>
      <h3 className="text-lg font-semibold">Your first image is one prompt away</h3>
      <p className="mt-1 max-w-md text-sm text-white/50">
        Pick a style, write what you see, hit generate. Every image can then be animated with a camera move.
      </p>
      <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {PROMPT_IDEAS.slice(0, 4).map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 hover:border-white/30 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
