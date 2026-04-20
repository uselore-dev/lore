#!/usr/bin/env node
/**
 * Session-start hook for Cursor, Codex, and Claude Code.
 * Reads the license key from ~/.lore/auth.json and fetches context from the lore server.
 * - cursor: JSON on stdout { additional_context } (Cursor schema)
 * - plain:  plain text on stdout (Codex + Claude SessionStart)
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LORE_API_URL = "https://lore-license-worker.mazewinther.workers.dev";
const mode = process.argv[2] ?? "plain";

function readKey() {
  const path = join(homedir(), ".lore", "auth.json");
  if (!existsSync(path)) return undefined;
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (typeof value?.key === "string" && value.key) return value.key;
  } catch {}
  return undefined;
}

async function fetchContext(key) {
  try {
    const res = await fetch(`${LORE_API_URL}/context`, {
      headers: { authorization: `Bearer ${key}` },
    });
    if (!res.ok) return undefined;
    return await res.text();
  } catch {
    return undefined;
  }
}

const key = readKey();
const context = key ? await fetchContext(key) : undefined;

if (context) {
  if (mode === "cursor") {
    process.stdout.write(JSON.stringify({ additional_context: context }));
  } else {
    process.stdout.write(context);
  }
}
