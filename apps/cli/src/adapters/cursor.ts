import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Adapter, AdapterContext, AdapterResult } from "../adapter";
import { ensureDirForFile, includesLoreHook, isRecord, parseJsonObject, writeJson } from "./shared";

function merge(
  existing: Record<string, unknown> | undefined,
  command: string,
): Record<string, unknown> {
  const prevHooks = isRecord(existing?.hooks) ? existing.hooks : {};
  const rawList = Array.isArray(prevHooks.sessionStart) ? prevHooks.sessionStart : [];
  const list: Array<{ command?: string }> = rawList.filter(isRecord);
  const cmds = list.map((x) => x.command ?? "").filter(Boolean);
  if (!includesLoreHook(cmds)) list.push({ command });
  return {
    ...existing,
    version: typeof existing?.version === "number" ? existing.version : 1,
    hooks: { ...prevHooks, sessionStart: list },
  };
}

export const cursorAdapter: Adapter = {
  id: "cursor",
  name: "Cursor",
  register({ scriptPath, mode, home }: AdapterContext): AdapterResult {
    const path = join(home, ".cursor/hooks.json");
    const existed = existsSync(path);
    let root: Record<string, unknown> = { version: 1, hooks: {} };
    if (existed) {
      root = parseJsonObject(path) ?? root;
    }
    ensureDirForFile(path);
    writeJson(path, merge(root, `node ${JSON.stringify(scriptPath)} ${mode}`));
    return { path, status: existed ? "updated" : "created" };
  },
};
