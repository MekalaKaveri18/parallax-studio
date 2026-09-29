#!/usr/bin/env node
// 8x agent capture hook.
// Wired to Claude Code's UserPromptSubmit / Stop / SessionStart events in .claude/settings.json.
// Appends each prompt and each final response, verbatim, to .agent-logs/<first-prompt-utc>_<session-id>.md
// Never blocks Claude: every failure is swallowed and written to .claude/capture-errors.log.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const AUTHOR = "MekalaKaveri18";
const PROJECT = "higgsfield-clone";
const TOOL = "claude-code";

const event = process.argv[2]; // "prompt" | "response" | "session-start"

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const raw = readStdin();
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const logDir = path.join(projectDir, ".agent-logs");
const errLog = path.join(projectDir, ".claude", "capture-errors.log");

function logError(err) {
  try {
    fs.appendFileSync(errLog, `${new Date().toISOString()} [${event}] ${err?.stack || err}\n`);
  } catch {}
}

// Per-session scratch state (model seen at SessionStart). Lives outside the repo on purpose.
function statePath(sessionId) {
  return path.join(os.tmpdir(), `8x-capture-${sessionId}.json`);
}
function readState(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(statePath(sessionId), "utf8"));
  } catch {
    return {};
  }
}
function writeState(sessionId, state) {
  try {
    fs.writeFileSync(statePath(sessionId), JSON.stringify(state));
  } catch {}
}

// Most recent model id the transcript recorded for an assistant message.
function modelFromTranscript(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, "utf8").trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        const model = entry?.message?.model;
        if (entry?.type === "assistant" && model && model !== "<synthetic>") return model;
      } catch {}
    }
  } catch {}
  return null;
}

function resolveModel(input) {
  return (
    modelFromTranscript(input.transcript_path) ||
    readState(input.session_id).model ||
    process.env.ANTHROPIC_MODEL ||
    "unknown"
  );
}

function findSessionFile(sessionId) {
  if (!fs.existsSync(logDir)) return null;
  const match = fs.readdirSync(logDir).find((f) => f.endsWith(`_${sessionId}.md`));
  return match ? path.join(logDir, match) : null;
}

function fileStamp(iso) {
  // 2026-09-29T02:40:11.123Z -> 2026-09-29_02-40-11
  return iso.slice(0, 19).replace("T", "_").replace(/:/g, "-");
}

function createSessionFile(sessionId, now, model) {
  fs.mkdirSync(logDir, { recursive: true });
  const file = path.join(logDir, `${fileStamp(now)}_${sessionId}.md`);
  const short = sessionId.slice(0, 8);
  const header = [
    "---",
    `session_id: ${sessionId}`,
    `date: ${now.slice(0, 10)}`,
    `author: ${AUTHOR}`,
    `model: ${model}`,
    `tool: ${TOOL}`,
    `project: ${PROJECT}`,
    `total_exchanges: 0`,
    `first_prompt_time: ${now}`,
    `last_prompt_time: ${now}`,
    "---",
    "",
    `# Session Log - ${now.slice(0, 10)}`,
    "",
    `Session: \`${short}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\``,
    "",
    "---",
    "",
  ].join("\n");
  fs.writeFileSync(file, header);
  return file;
}

function countPrompts(content) {
  return (content.match(/^\[LOG_ENTRY type=PROMPT /gm) || []).length;
}

function entry(type, num, sessionId, now, model, body) {
  return (
    `\n[LOG_ENTRY type=${type} num=${num} session=${sessionId.slice(0, 8)}]\n` +
    `timestamp: ${now}\n` +
    `model: ${model}\n\n` +
    `${body}\n\n`
  );
}

function main() {
  const input = raw ? JSON.parse(raw) : {};
  const sessionId = input.session_id;
  if (!sessionId) return;
  // Only the human-driven main thread; subagent turns are intermediate steps.
  if (input.agent_id) return;

  const now = new Date().toISOString();

  if (event === "session-start") {
    if (input.model) writeState(sessionId, { ...readState(sessionId), model: input.model });
    return;
  }

  const model = resolveModel(input);

  if (event === "prompt") {
    const prompt = input.prompt ?? "";
    const file = findSessionFile(sessionId) || createSessionFile(sessionId, now, model);
    let content = fs.readFileSync(file, "utf8");
    const num = countPrompts(content) + 1;
    content = content
      .replace(/^total_exchanges: \d+$/m, `total_exchanges: ${num}`)
      .replace(/^last_prompt_time: .*$/m, `last_prompt_time: ${now}`);
    fs.writeFileSync(file, content + entry("PROMPT", num, sessionId, now, model, prompt));
    return;
  }

  if (event === "response") {
    const text = input.last_assistant_message ?? "";
    const file = findSessionFile(sessionId) || createSessionFile(sessionId, now, model);
    let content = fs.readFileSync(file, "utf8");
    const num = Math.max(countPrompts(content), 1);
    // The first prompt of a session has no assistant message to read the model from yet,
    // so the header may say "unknown". Fill it in once the model is known. Entries are never touched.
    if (model !== "unknown") {
      const headerEnd = content.indexOf("\n---\n", 4); // end of the YAML front matter
      if (headerEnd > 0) {
        const header = content.slice(0, headerEnd).replace(/^model: unknown$/m, `model: ${model}`);
        content = header + content.slice(headerEnd);
      }
    }
    fs.writeFileSync(file, content + entry("RESPONSE", num, sessionId, now, model, text));
  }
}

try {
  main();
} catch (err) {
  logError(err);
}
process.exit(0);
