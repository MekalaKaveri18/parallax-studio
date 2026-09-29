"use client";

import Link from "next/link";
import { create } from "zustand";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { uid } from "@/lib/utils";

interface Toast {
  id: string;
  tone: "success" | "error";
  title: string;
  action?: { label: string; href: string };
}

const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }));

export function toast(t: Omit<Toast, "id">, ttl = 4000) {
  const id = uid("t_");
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
  setTimeout(() => dismiss(id), ttl);
}

function dismiss(id: string) {
  useToasts.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-ink-800/95 py-2 pl-3 pr-2 text-sm shadow-2xl backdrop-blur"
        >
          {t.tone === "success" ? (
            <CheckCircle2 className="size-4 text-accent" />
          ) : (
            <AlertTriangle className="size-4 text-amber-400" />
          )}
          <span>{t.title}</span>
          {t.action && (
            <Link
              href={t.action.href}
              onClick={() => dismiss(t.id)}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20"
            >
              {t.action.label}
            </Link>
          )}
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="rounded-full p-1 text-white/50 hover:text-white">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
