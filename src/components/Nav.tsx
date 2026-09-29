"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Coins, Film, ImageIcon, Layers, Loader2, Sparkles, Compass } from "lucide-react";
import { selectActiveJobs, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motionOf } from "@/lib/presets";

const LINKS = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/create/image", label: "Image", icon: ImageIcon },
  { href: "/create/video", label: "Video", icon: Film },
  { href: "/library", label: "Library", icon: Layers },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="brand-gradient grid size-7 place-items-center rounded-lg text-accent-ink">
        <Sparkles className="size-4" strokeWidth={2.5} />
      </span>
      <span className="text-[15px]">Parallax</span>
    </Link>
  );
}

function QueueMenu() {
  const active = useStore(useShallow(selectActiveJobs));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (active.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
      >
        <Loader2 className="size-3.5 animate-spin" />
        {active.length} generating
      </button>
      {open && (
        <div className="animate-fade-in absolute right-0 top-10 w-72 rounded-2xl border border-white/10 bg-ink-850 p-2 shadow-2xl">
          {active.map((j) => (
            <div key={j.id} className="rounded-xl p-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-white/80">
                  {j.params.kind === "image"
                    ? j.params.prompt
                    : `${motionOf(j.params.motionId).name} · ${j.params.duration}s`}
                </span>
                <span className="shrink-0 tabular-nums text-white/50">
                  {j.status === "queued" ? "Queued" : `${Math.round(j.progress * 100)}%`}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${j.progress * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreditsPill() {
  const credits = useStore((s) => s.credits);
  const hydrated = useStore((s) => s.hydrated);
  return (
    <Link
      href="/pricing"
      title="Credits — top up or change plan"
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
    >
      <Coins className="size-3.5 text-amber-300" />
      <span className="tabular-nums">{hydrated ? credits : "—"}</span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="scrollbar-none -mx-1 flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                isActive(href) ? "bg-white/10 text-white" : "text-white/60 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <QueueMenu />
          <Link href="/pricing" className="hidden text-sm text-white/60 hover:text-white md:block">
            Pricing
          </Link>
          <CreditsPill />
        </div>
      </div>
    </header>
  );
}
