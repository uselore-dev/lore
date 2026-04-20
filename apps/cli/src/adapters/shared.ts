import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const LORE_HOOK_MARKER = "inject-session-context.mjs";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonObject(path: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    return isRecord(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function ensureDirForFile(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function includesLoreHook(commands: string[]): boolean {
  return commands.some((c) => c.includes(LORE_HOOK_MARKER));
}

type MatcherGroup = {
  matcher?: string;
  hooks: Array<{ type: string; command: string }>;
};

export function mergeSessionStartCommand(
  existing: Record<string, unknown> | undefined,
  command: string,
  matcher: string,
): Record<string, unknown> {
  const hooks = { ...(existing ?? {}) };
  const raw = Array.isArray(hooks.SessionStart) ? hooks.SessionStart : [];
  const groups = [...(raw as MatcherGroup[])];
  const loreIdx = groups.findIndex((g) =>
    g.hooks?.some((h) => h.command?.includes(LORE_HOOK_MARKER)),
  );
  const entry = { type: "command" as const, command };

  if (loreIdx >= 0) {
    const g = groups[loreIdx];
    const inner = [...(g.hooks ?? [])];
    const i = inner.findIndex((h) => h.command?.includes(LORE_HOOK_MARKER));
    if (i >= 0) inner[i] = entry;
    else inner.push(entry);
    groups[loreIdx] = { ...g, hooks: inner };
  } else {
    groups.push({ matcher, hooks: [entry] });
  }

  hooks.SessionStart = groups;
  return hooks;
}
