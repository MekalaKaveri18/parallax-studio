# Parallax

**Generate a frame. Direct the camera.** A Higgsfield-inspired AI creative studio, rebuilt in 24 hours. It focuses on one idea: turning a still image into a cinematic shot with a camera move you can preview free before you spend anything.

- **Live:** https://parallax-studio-rho.vercel.app
- **Agent logs:** [`.agent-logs/`](.agent-logs/) (every prompt and response, captured by hooks, committed as the work happened). See [`CAPTURE-TEST.md`](CAPTURE-TEST.md).

## What you can do

| Flow | What happens |
|---|---|
| **Explore** | Prompt-first home page, hover-to-play camera moves, and an endless community feed. **Recreate** prefills any prompt. |
| **Create image** | Prompt, 10 styles, 5 aspect ratios, batch of 1–4. The credit cost is on the button before you click. |
| **Create video** | Pick or upload a still, choose from **18 camera moves**, set duration and intensity. A **free live preview on your own image** plays before you generate. |
| **Library** | Everything you made: filters, search, favorites, a keyboard-navigable viewer, **Animate this** / **Try another motion** remixes. |
| **Accounts** | Email and password sign-up and sign-in (Better Auth on Supabase Postgres). New accounts get 30 bonus credits. Everything also works as a guest. |
| **Pricing** | Plans and credit packs (demo checkout). Failed generations refund automatically. |
| **Claude MCP** | Connect Parallax to Claude at `/api/mcp`. `direct_shot` turns "shocking product reveal" into a recommended move, alternatives, reasons and **free preview links**. No account or API key needed. Guide at `/mcp`. |

## Product decisions

**Built first:** the core loop. Prompt → image → animate → library. Every other surface feeds into it: Recreate, Animate this, preview links, the MCP.

**Where it tries to beat the original**
- **Preview before you pay.** Higgsfield has 250+ presets, but you can't see one on *your* image until you spend credits. Here, every move previews live and free.
- **Transparent credits.** Cost shown before generating, remaining balance after, automatic refunds on failure.
- **Moves that finish like real shots.** Each move plays once, eases to rest on a clean end frame and loops like a video, never ping-ponging. Verified numerically: no direction reversals on the 15 directional moves, ~0 end velocity on all 18.
- **A calmer UI.** Five destinations instead of 20+ top-level nav items, and no modal on the first visit.
- **An MCP that directs, not just generates.** Claude explains *why* a move fits and hands back preview links. Nothing renders until you choose.

**Left out, on purpose**
- **Real model inference.** Generation sits behind a provider interface ([`src/lib/provider.ts`](src/lib/provider.ts)) with a mock that returns placeholder stock photos. Swapping in Replicate or fal.ai is one file. The camera motion is real and runs client-side.
- **Account-level sync.** Accounts handle auth. Library, credits and plan live in the browser, so they don't follow you across devices yet.
- **Payments, audio, effects, canvas, apps.** Higgsfield is a suite; this is a focused product.

## How it works

- **Next.js 16** (App Router, TypeScript, Tailwind 4). Pages are static; auth and MCP are server routes.
- **Motion engine** ([`src/lib/motion.ts`](src/lib/motion.ts)): each preset is a pure function `pose(t)` over the clip, sampled into Web Animations keyframes. The same function could drive a frame-by-frame video export.
- **Job queue** ([`src/lib/store.ts`](src/lib/store.ts)): Zustand persisted to localStorage. Progress is derived from timestamps, so in-flight jobs survive a reload. Concurrency depends on the plan.
- **Auth** ([`src/lib/server/auth.ts`](src/lib/server/auth.ts)): Better Auth + `pg`. Tables are created on the first request, so a fresh database needs no migration step.
- **MCP** ([`src/lib/mcp-server.ts`](src/lib/mcp-server.ts)): stateless Streamable HTTP via the MCP TypeScript SDK's web-standard transport. Tools: `direct_shot`, `generate_image`, `preview_link`, `list_motions`, `list_styles`; prompt `shot_list`.

## Run locally

```bash
npm install
cp .env.example .env.local   # add DATABASE_URL (Supabase Session pooler) and BETTER_AUTH_SECRET
npm run dev                  # http://localhost:3000
```

Connect the MCP to Claude Code:

```bash
claude mcp add --transport http parallax http://localhost:3000/api/mcp
```

## Built with

Claude Code (VS Code extension), model `claude-opus-5-5`, which planned and executed the work. Hooks captured the full session into `.agent-logs/`.
