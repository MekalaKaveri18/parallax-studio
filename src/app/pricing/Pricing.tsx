"use client";

import { Check, Coins, Film, ImageIcon } from "lucide-react";
import { toast } from "@/components/Toast";
import { COST, PLANS, planOf } from "@/lib/presets";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const PACKS = [
  { credits: 100, price: 5 },
  { credits: 300, price: 12 },
  { credits: 800, price: 28 },
];

export function Pricing() {
  const hydrated = useStore((s) => s.hydrated);
  const plan = useStore((s) => s.plan);
  const credits = useStore((s) => s.credits);
  const { changePlan, addCredits } = useStore.getState();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple, transparent credits</h1>
        <p className="mx-auto mt-3 max-w-lg text-white/50">
          Every generation shows its exact cost before you run it. Failed generations are refunded automatically.
        </p>
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
            <ImageIcon className="size-3.5" /> Image: {COST.imagePer} credits
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
            <Film className="size-3.5" /> Video: {COST.videoPerSecond} credits / second
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-amber-300/10 px-3 py-1.5 text-amber-200">
            <Coins className="size-3.5" /> You have {hydrated ? credits : "—"}
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = hydrated && plan === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                p.highlight ? "border-accent/50 bg-accent/[0.06]" : "border-white/10 bg-ink-900",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-ink">
                  Most popular
                </span>
              )}
              <h2 className="font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-white/50">{p.blurb}</p>
              <p className="mt-5">
                <span className="text-4xl font-semibold tabular-nums">${p.price}</span>
                <span className="text-sm text-white/40"> / month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-white/75">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={current || !hydrated}
                onClick={() => {
                  const upgrading = planOf(p.id).credits > planOf(plan).credits;
                  changePlan(p.id);
                  toast({
                    tone: "success",
                    title: upgrading ? `Welcome to ${p.name}. +${p.credits} credits` : `Switched to ${p.name}`,
                  });
                }}
                className={cn(
                  "mt-6 rounded-xl py-2.5 text-sm font-semibold transition disabled:cursor-default",
                  current
                    ? "bg-white/5 text-white/50"
                    : p.highlight
                      ? "bg-accent text-accent-ink hover:bg-white"
                      : "bg-white/10 hover:bg-white/20",
                )}
              >
                {current ? "Current plan" : p.price === 0 ? "Downgrade" : `Get ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-ink-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Top up credits</h2>
            <p className="text-sm text-white/50">One-off packs that never expire. Works on any plan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PACKS.map((pack) => (
              <button
                key={pack.credits}
                disabled={!hydrated}
                onClick={() => {
                  addCredits(pack.credits);
                  toast({ tone: "success", title: `+${pack.credits} credits added` });
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:border-white/30 hover:bg-white/5"
              >
                <Coins className="size-4 text-amber-300" />
                <span className="font-semibold tabular-nums">{pack.credits}</span>
                <span className="text-white/40">${pack.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/30">
        Demo checkout: no payment is taken. Plans and credits are stored in your browser.
      </p>
    </div>
  );
}
