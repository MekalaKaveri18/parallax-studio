"use client";

import { useSyncExternalStore } from "react";
import { Check, Copy, Plug, Terminal } from "lucide-react";
import { toast } from "@/components/Toast";

const subscribe = () => () => {};
const useOrigin = () => useSyncExternalStore(subscribe, () => window.location.origin, () => "");

const TOOLS = [
  { name: "direct_shot", body: "Describe the feeling you want. Get the best camera move, two alternatives, the reasoning, and a free preview link for each." },
  { name: "generate_image", body: "Generate 1–4 stills from a prompt with any of 10 styles and 5 aspect ratios." },
  { name: "preview_link", body: "Build a shareable live preview of any move on any image." },
  { name: "list_motions", body: "Browse all 18 camera moves by category." },
  { name: "list_styles", body: "Browse the image style presets." },
];

const EXAMPLES = [
  "Generate a moody image of a jazz club and direct a camera move that feels like tension building.",
  "Use the shot_list prompt to plan a 4-shot launch ad for a running shoe.",
  "Here's my product photo: <url>. What camera move makes the best TikTok hook? Show me previews.",
];

function CopyRow({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-950 p-1.5 pl-3">
      <code className="min-w-0 flex-1 truncate font-mono text-sm text-white/85">{value || "…"}</code>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value);
          toast({ tone: "success", title: `${label} copied` }, 1800);
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
      >
        <Copy className="size-3.5" /> Copy
      </button>
    </div>
  );
}

export function McpGuide() {
  const origin = useOrigin();
  const endpoint = origin ? `${origin}/api/mcp` : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
        <Plug className="size-3.5" /> MCP connector
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Direct camera moves from Claude</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Connect Parallax to Claude and plan shots in conversation. Claude picks the move, explains why, and hands you a free
        preview link, so you see the shot before anything is rendered. No account or API key needed.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-900 p-5">
          <h2 className="font-medium">Claude (web &amp; desktop)</h2>
          <ol className="mt-3 space-y-2 text-sm text-white/70">
            <li>1. Open <span className="text-white">Settings → Connectors</span>.</li>
            <li>2. Choose <span className="text-white">Add custom connector</span>, name it Parallax, and paste:</li>
          </ol>
          <div className="mt-3">
            <CopyRow value={endpoint} label="Connector URL" />
          </div>
          <p className="mt-3 text-sm text-white/70">3. Click Add. That&apos;s it, no sign-in step.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-900 p-5">
          <h2 className="flex items-center gap-2 font-medium">
            <Terminal className="size-4" /> Claude Code
          </h2>
          <p className="mt-3 text-sm text-white/70">Run this in your terminal:</p>
          <div className="mt-3">
            <CopyRow value={endpoint ? `claude mcp add --transport http parallax ${endpoint}` : ""} label="Command" />
          </div>
          <p className="mt-3 text-sm text-white/50">Then ask Claude to direct a shot.</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Tools</h2>
        <div className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/10 bg-ink-900">
          {TOOLS.map((t) => (
            <div key={t.name} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
              <code className="w-36 shrink-0 font-mono text-sm text-accent">{t.name}</code>
              <p className="text-sm text-white/70">{t.body}</p>
            </div>
          ))}
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
            <code className="w-36 shrink-0 font-mono text-sm text-accent">shot_list</code>
            <p className="text-sm text-white/70">
              <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/60">prompt</span>
              Turns a concept into a 3–5 shot plan, with a still and a directed move for each shot.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Try asking</h2>
        <ul className="mt-4 grid gap-2">
          {EXAMPLES.map((e) => (
            <li key={e} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 text-sm text-white/75">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {e}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs text-white/35">
        Demo note: generate_image uses a placeholder provider, so images are stock photos. Camera moves and previews are real.
      </p>
    </div>
  );
}
