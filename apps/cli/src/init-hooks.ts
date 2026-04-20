import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { hooks } from "@lore/hook/registry";

import type { Adapter, WriteStatus } from "./adapter";
import { claudeAdapter } from "./adapters/claude";
import { codexAdapter } from "./adapters/codex";
import { cursorAdapter } from "./adapters/cursor";

// Bundle is at dist/bin/lore.js — resources are two levels up at <pkg-root>/resources/
const resourcesDir = join(dirname(fileURLToPath(import.meta.url)), "../../resources");

export type InitHooksResult = {
  home: string;
  scriptPath: string;
  created: string[];
  updated: string[];
  notes: string[];
};

const adapterMap: Record<string, Adapter> = {
  cursor: cursorAdapter,
  codex: codexAdapter,
  claude: claudeAdapter,
};

function copyResource(src: string, dest: string): WriteStatus {
  const bundled = join(resourcesDir, src);
  if (!existsSync(bundled)) {
    throw new Error(`Missing bundled resource: ${bundled} (rebuild the CLI package).`);
  }
  const existed = existsSync(dest);
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(bundled, dest);
  return existed ? "updated" : "created";
}

export function initHooks(): InitHooksResult {
  const home = homedir();
  const created: string[] = [];
  const updated: string[] = [];
  const usedAdapterIds = new Set<string>();

  const track = (path: string, status: WriteStatus) =>
    (status === "created" ? created : updated).push(path);

  for (const hook of hooks) {
    const destPath = join(home, ".lore/hooks", hook.dest);
    track(destPath, copyResource(hook.script, destPath));

    for (const { adapterId, mode } of hook.registrations) {
      const adapter = adapterMap[adapterId];
      if (!adapter) continue;
      const { path, status } = adapter.register({ scriptPath: destPath, mode, home });
      track(path, status);
      usedAdapterIds.add(adapterId);
    }
  }

  const notes = [...usedAdapterIds]
    .flatMap((id) => adapterMap[id]?.notes ?? []);

  const scriptPath = join(home, ".lore/hooks", hooks[0].dest);
  return { home, scriptPath, created, updated, notes };
}
