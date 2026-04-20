import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Adapter, AdapterContext, AdapterResult } from "../adapter";
import { ensureDirForFile, isRecord, mergeSessionStartCommand, parseJsonObject, writeJson } from "./shared";

export const codexAdapter: Adapter = {
  id: "codex",
  name: "Codex",
  notes: [
    "Codex: set [features] codex_hooks = true in ~/.codex/config.toml. Hooks are unsupported on Windows per OpenAI.",
  ],
  register({ scriptPath, mode, home }: AdapterContext): AdapterResult {
    const path = join(home, ".codex/hooks.json");
    const existed = existsSync(path);
    let root: Record<string, unknown> = { hooks: {} };
    if (existed) {
      root = parseJsonObject(path) ?? root;
    }
    const hooks = mergeSessionStartCommand(
      isRecord(root.hooks) ? root.hooks : undefined,
      `node ${JSON.stringify(scriptPath)} ${mode}`,
      "startup|resume",
    );
    ensureDirForFile(path);
    writeJson(path, { ...root, hooks });
    return { path, status: existed ? "updated" : "created" };
  },
};
