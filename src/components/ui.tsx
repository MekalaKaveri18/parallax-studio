"use client";

import Link from "next/link";
import { Coins, Loader2 } from "lucide-react";
import { ASPECTS } from "@/lib/presets";
import type { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between text-xs">
      <span className="font-medium uppercase tracking-wider text-white/50">{children}</span>
      {hint && <span className="text-white/40">{hint}</span>}
    </div>
  );
}

export function AspectPicker({ value, onChange }: { value: AspectRatio; onChange: (a: AspectRatio) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Aspect ratio">
      {ASPECTS.map((a) => {
        const s = 16 / Math.max(a.w, a.h);
        return (
          <button
            key={a.id}
            role="radio"
            aria-checked={value === a.id}
            onClick={() => onChange(a.id)}
            title={a.label}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border py-2 text-[11px] transition",
              value === a.id ? "border-accent/60 bg-accent/10 text-white" : "border-white/5 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]",
            )}
          >
            <span
              className={cn("rounded-[3px] border-[1.5px]", value === a.id ? "border-accent" : "border-white/40")}
              style={{ width: a.w * s, height: a.h * s }}
            />
            {a.id}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  format = (v) => String(v),
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
  label: string;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-white/[0.03] p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md py-1.5 text-sm transition",
            value === o ? "bg-white/10 font-medium text-white" : "text-white/50 hover:text-white",
          )}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

export function GenerateButton({
  cost,
  credits,
  disabled,
  busy,
  onClick,
  label = "Generate",
}: {
  cost: number;
  credits: number;
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
  label?: string;
}) {
  const short = credits < cost;
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="group flex w-full items-center justify-between gap-3 rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink shadow-[0_8px_30px_-8px] shadow-accent/50 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
      >
        <span className="flex items-center gap-2">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {label}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-0.5 text-xs tabular-nums">
          <Coins className="size-3" /> {cost}
        </span>
      </button>
      <p className="mt-2 flex justify-between text-[11px] text-white/40">
        <span>
          <kbd className="font-sans">Ctrl</kbd> + <kbd className="font-sans">Enter</kbd> to generate
        </span>
        {short ? (
          <Link href="/pricing" className="text-amber-300 hover:underline">
            Need {cost - credits} more credits
          </Link>
        ) : (
          <span className="tabular-nums">{credits - cost} left after</span>
        )}
      </p>
    </div>
  );
}
