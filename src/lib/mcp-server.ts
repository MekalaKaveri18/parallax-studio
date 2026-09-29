import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { directShot } from "./director";
import { aspectOf, ASPECTS, DURATIONS, MOTION_CATEGORIES, MOTIONS, STYLES, styleOf } from "./presets";
import type { AspectRatio } from "./types";
import { hash, seededImage } from "./utils";

/** Links in tool results must be absolute; `origin` comes from the incoming request. */
export function watchUrl(origin: string, p: { src: string; motion: string; duration?: number; intensity?: number }) {
  const q = new URLSearchParams({ src: p.src, motion: p.motion });
  if (p.duration) q.set("d", String(p.duration));
  if (p.intensity && p.intensity !== 1) q.set("k", String(p.intensity));
  return `${origin}/watch?${q}`;
}

const aspectIds = ASPECTS.map((a) => a.id) as [AspectRatio, ...AspectRatio[]];
const motionIds = MOTIONS.map((m) => m.id) as [string, ...string[]];
const styleIds = STYLES.map((s) => s.id) as [string, ...string[]];

const text = (value: unknown) => ({ type: "text" as const, text: JSON.stringify(value, null, 2) });

/** A fresh server per request keeps the endpoint stateless (safe on serverless). */
export function buildMcpServer(origin: string) {
  const server = new McpServer({ name: "parallax", version: "1.0.0" });

  server.registerTool(
    "list_motions",
    {
      title: "List camera motions",
      description:
        "List Parallax's cinematic camera moves (dolly, orbit, crash zoom, handheld...). Use the returned ids with direct_shot or preview links.",
      inputSchema: { category: z.enum(MOTION_CATEGORIES).optional().describe("Filter by category") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ category }) => {
      const motions = MOTIONS.filter((m) => !category || m.category === category).map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description,
      }));
      return { content: [text({ count: motions.length, motions })] };
    },
  );

  server.registerTool(
    "list_styles",
    {
      title: "List image styles",
      description: "List the visual style presets available for generate_image.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => ({
      content: [text(STYLES.map((s) => ({ id: s.id, name: s.name, adds: s.suffix || "(prompt as written)" })))],
    }),
  );

  server.registerTool(
    "generate_image",
    {
      title: "Generate images",
      description:
        "Generate 1-4 still images from a prompt. Returns image URLs plus a link to continue in the Parallax studio. " +
        "Note: this demo uses a placeholder image provider, so results are stock photos rather than prompt-accurate renders.",
      inputSchema: {
        prompt: z.string().min(1).max(600).describe("What the image should show"),
        style: z.enum(styleIds).default("cinematic").describe("Style preset id (see list_styles)"),
        aspect: z.enum(aspectIds).default("3:4").describe("Aspect ratio"),
        count: z.number().int().min(1).max(4).default(1).describe("Number of images"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ prompt, style, aspect, count }) => {
      const { w, h } = aspectOf(aspect);
      const nonce = Date.now().toString(36);
      const images = Array.from({ length: count }, (_, i) =>
        seededImage(hash(`${prompt}|${style}|${nonce}|${i}`), w, h),
      );
      const studio = `${origin}/create/image?${new URLSearchParams({ prompt, style, aspect })}`;
      return {
        content: [
          text({
            prompt,
            style: styleOf(style).name,
            aspect,
            images,
            next: "Call direct_shot with one of these image URLs to pick a camera move and get free preview links.",
            open_in_studio: studio,
          }),
        ],
      };
    },
  );

  server.registerTool(
    "direct_shot",
    {
      title: "Direct a camera move",
      description:
        "Given an image URL and the feeling the shot should have (e.g. 'shocking product reveal', 'dreamy and calm'), " +
        "recommend the best camera move plus two alternatives, each with a reason and a FREE live-preview link " +
        "that plays the move on the image. Nothing is rendered or charged; the user reviews previews first.",
      inputSchema: {
        image_url: z.string().url().max(2048).describe("https URL of the still to animate"),
        idea: z.string().min(1).max(500).describe("What the shot should feel like or accomplish"),
        duration: z.union([z.literal(3), z.literal(5), z.literal(8)]).default(5).describe("Clip length in seconds"),
        intensity: z.number().min(0.5).max(1.5).default(1).describe("Motion strength, 0.5 subtle to 1.5 dramatic"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ image_url, idea, duration, intensity }) => {
      if (!image_url.startsWith("https://")) {
        return { isError: true, content: [{ type: "text", text: "image_url must be an https URL." }] };
      }
      const picks = directShot(idea).map((p, i) => ({
        rank: i + 1,
        motion_id: p.motionId,
        motion: p.name,
        why: p.why,
        preview: watchUrl(origin, { src: image_url, motion: p.motionId, duration, intensity }),
      }));
      return {
        content: [
          text({
            idea,
            duration_seconds: duration,
            recommendation: picks[0],
            alternatives: picks.slice(1),
            tip: "Open a preview link to watch the move on the image. From the preview page the user can switch moves and send it to the studio.",
          }),
        ],
      };
    },
  );

  server.registerTool(
    "preview_link",
    {
      title: "Build a preview link",
      description: "Build a free live-preview link for a specific camera move on an image, e.g. after the user picks one.",
      inputSchema: {
        image_url: z.string().url().max(2048),
        motion_id: z.enum(motionIds).describe("Motion id from list_motions"),
        duration: z.union([z.literal(3), z.literal(5), z.literal(8)]).default(5),
        intensity: z.number().min(0.5).max(1.5).default(1),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ image_url, motion_id, duration, intensity }) => {
      if (!image_url.startsWith("https://")) {
        return { isError: true, content: [{ type: "text", text: "image_url must be an https URL." }] };
      }
      return { content: [text({ preview: watchUrl(origin, { src: image_url, motion: motion_id, duration, intensity }) })] };
    },
  );

  server.registerPrompt(
    "shot_list",
    {
      title: "Plan a shot list",
      description: "Turn a concept into a 3-5 shot list, each with a generated still and a directed camera move.",
      argsSchema: { concept: z.string().describe("The ad, story or post you're making") },
    },
    ({ concept }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `Plan a 3-5 shot list for: ${concept}\n\n` +
              "For each shot: write a one-line description, call generate_image for a still, then call direct_shot " +
              "with that image and the shot's purpose. Present each shot with its recommended move, the reason, and the preview link. " +
              `Allowed durations: ${DURATIONS.join(", ")} seconds.`,
          },
        },
      ],
    }),
  );

  return server;
}
