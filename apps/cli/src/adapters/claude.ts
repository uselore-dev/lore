import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Adapter, AdapterContext, AdapterResult } from "../adapter";
import { ensureDirForFile, isRecord, mergeSessionStartCommand, parseJsonObject, writeJson } from "./shared";

export const claudeAdapter: Adapter = {
  id: "claude",
  name: "Claude Code",
  register({ scriptPath, mode, home }: AdapterContext): AdapterResult {
    const path = join(home, ".claude/settings.json");
    const existed = existsSync(path);
    let root: Record<string, unknown> = {};
    if (existed) {
      root = parseJsonObject(path) ?? root;
    }
    const hooks = mergeSessionStartCommand(
      isRecord(root.hooks) ? root.hooks : undefined,
      `node ${JSON.stringify(scriptPath)} ${mode}`,
      "startup|resume|clear|compact",
    );
    ensureDirForFile(path);
    writeJson(path, { ...root, hooks });
    return { path, status: existed ? "updated" : "created" };
  },
};
