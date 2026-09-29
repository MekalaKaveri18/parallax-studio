"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Eye, Film, ImageIcon, Play, RefreshCw, Sparkles, Upload } from "lucide-react";
import { Masonry } from "@/components/Masonry";
import { MotionMedia } from "@/components/MotionMedia";
import { FEED, FEED_LIMIT, generatedFeed, PROMPT_IDEAS, type FeedItem } from "@/lib/feed";
import { imageHref, videoHref } from "@/lib/links";
import { aspectCss, aspectOf, MOTIONS, motionOf, styleOf } from "@/lib/presets";
import { cn, seededImage } from "@/lib/utils";

export function Explore() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <Hero />
      <MotionRail />
      <HowItWorks />
      <Feed />
    </div>
  );
}

function Hero() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function go() {
    router.push(imageHref({ prompt: prompt.trim() || undefined }));
  }

  return (
    <section className="relative isolate mt-6 overflow-hidden rounded-3xl border border-white/5 px-6 py-16 text-center sm:py-24">
      {/* Backdrop: a slow dolly on a feed still */}
      <div className="absolute inset-0 -z-10 opacity-40">
        <MotionMedia
          src={seededImage("hero-parallax", 16, 9, 1600)}
          alt=""
          motionId="dolly-in"
          duration={14}
          intensity={0.6}
          loading="eager"
          className="size-full"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/40 via-ink-950/70 to-ink-950" />

      <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70 backdrop-blur">
        <Sparkles className="size-3.5 text-accent" /> 18 cinematic camera moves · free live preview
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
        Generate a frame. <span className="brand-text">Direct the camera.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-white/60 text-balance">
        Create images from a prompt, then turn any still into a shot with dolly, orbit and crash-zoom moves.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-ink-900/90 p-2 shadow-2xl backdrop-blur focus-within:border-accent/50"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={PROMPT_IDEAS[0]}
          aria-label="Prompt"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/30"
        />
        <button type="submit" className="flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink hover:bg-white">
          Create <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
        <Link href="/create/video" className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-white/70 backdrop-blur hover:bg-white/10 hover:text-white">
          <Upload className="size-3.5" /> Animate your own photo
        </Link>
        <Link href={videoHref({ motion: "crash-zoom" })} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-white/70 backdrop-blur hover:bg-white/10 hover:text-white">
          <Film className="size-3.5" /> Try Crash Zoom
        </Link>
      </div>
    </section>
  );
}

function MotionRail() {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">Camera moves</h2>
          <p className="text-sm text-white/50">Hover to preview. Click to use on your image.</p>
        </div>
        <Link href="/create/video" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
          All motions <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {MOTIONS.map((m) => (
          <MotionCard key={m.id} id={m.id} />
        ))}
      </div>
    </section>
  );
}

function MotionCard({ id }: { id: string }) {
  const m = motionOf(id);
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={videoHref({ motion: id })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group relative w-44 shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-white/5 hover:ring-white/20"
    >
      <MotionMedia
        src={seededImage(m.thumbSeed, 3, 4, 480)}
        alt=""
        motionId={id}
        duration={3}
        playing={hover}
        className="aspect-[3/4]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-10">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {m.name}
          {m.isNew && <span className="rounded bg-accent px-1 text-[9px] font-bold uppercase text-accent-ink">New</span>}
        </div>
        <div className="text-[11px] text-white/60">{m.category}</div>
      </div>
      <Play className="absolute right-3 top-3 size-4 fill-white/80 text-white/80 opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

const FEED_FILTERS = [
  { id: "all", label: "All" },
  { id: "motion", label: "With motion" },
  { id: "still", label: "Stills" },
] as const;
type FeedFilter = (typeof FEED_FILTERS)[number]["id"];

const PAGE = 24;
const feedRatio = (item: FeedItem) => {
  const { w, h } = aspectOf(item.aspect);
  return h / w;
};
const feedKey = (item: FeedItem) => item.id;

function Feed() {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [count, setCount] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const all = useMemo(() => [...FEED, ...generatedFeed(FEED.length, FEED_LIMIT - FEED.length)], []);
  const filtered = useMemo(
    () => all.filter((i) => filter === "all" || (filter === "motion" ? i.motionId : !i.motionId)),
    [all, filter],
  );
  const shown = filtered.slice(0, count);
  const done = shown.length >= filtered.length;

  // Load the next page shortly before the user reaches the bottom.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setCount((c) => c + PAGE);
    }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [done, filter]);

  return (
    <section className="mb-20 mt-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">From the community</h2>
          <p className="text-sm text-white/50">Hover to play. Remix any prompt with one click.</p>
        </div>
        <div className="flex rounded-full bg-white/5 p-1">
          {FEED_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setCount(PAGE);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition",
                filter === f.id ? "bg-white text-ink-950" : "text-white/60 hover:text-white",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Masonry items={shown} getKey={feedKey} getRatio={feedRatio} render={(item) => <FeedCard item={item} />} />

      {done ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-10 text-center">
          <p className="text-sm text-white/60">You&apos;ve reached the end of the feed.</p>
          <Link href="/create/image" className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-white">
            Make something new <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div ref={sentinel} className="mt-6 flex justify-center">
          <button onClick={() => setCount((c) => c + PAGE)} className="rounded-full bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white">
            Load more
          </button>
        </div>
      )}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: ImageIcon, title: "Generate a frame", body: "Write a prompt, pick one of 10 styles and an aspect ratio. See the credit cost before you run it." },
    { icon: Eye, title: "Preview the move, free", body: "Try 18 camera moves live on your own image. Nothing is charged until you like what you see." },
    { icon: Film, title: "Render and remix", body: "Generate the shot, then reuse the prompt, swap the motion, or animate another still from your library." },
  ];
  return (
    <section className="mt-16">
      <h2 className="text-lg font-semibold">How it works</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
                <s.icon className="size-4" />
              </span>
              <span className="text-xs font-medium tabular-nums text-white/30">0{i + 1}</span>
            </div>
            <h3 className="mt-4 font-medium">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/50">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const { w, h } = aspectOf(item.aspect);
  const motion = item.motionId ? motionOf(item.motionId) : null;
  const [hover, setHover] = useState(false);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5"
      style={{ aspectRatio: aspectCss(item.aspect) }}
    >
      <MotionMedia
        src={seededImage(item.seed, w, h, 720)}
        alt={item.prompt}
        motionId={item.motionId}
        duration={4}
        playing={hover}
        className="size-full"
      />
      {motion && (
        <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] backdrop-blur">
          <Play className="size-3 fill-current" /> {motion.name}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-12 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="line-clamp-2 text-xs text-white/90">{item.prompt}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-white/50">
            @{item.author} · {styleOf(item.styleId).name}
          </span>
          <div className="flex shrink-0 gap-1">
            {motion && (
              <Link
                href={videoHref({ motion: motion.id })}
                className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur hover:bg-white/25"
              >
                Use motion
              </Link>
            )}
            <Link
              href={imageHref({ prompt: item.prompt, styleId: item.styleId, aspect: item.aspect })}
              className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-ink hover:bg-white"
            >
              <RefreshCw className="size-3" /> Recreate
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
