import { readAuth } from "../auth";
import { defineCommand } from "../command";
import { initHooks, type InitHooksResult } from "../init-hooks";

function formatResult(r: InitHooksResult): string {
  const lines = (paths: string[], bullet = "  ") =>
    paths.map((p) => `${bullet}${p}`).join("\n") || "  (none)";
  return [
    `Initialized lore hooks (user scope)`,
    `  HOME=${r.home}`,
    `  script=${r.scriptPath}`,
    ``,
    `Created:`,
    lines(r.created),
    ``,
    `Updated:`,
    lines(r.updated),
    ``,
    `Notes:`,
    lines(r.notes, "  - "),
    ``,
  ].join("\n");
}

export const initCommand = defineCommand({
  name: "init",
  aliases: ["i", "initialize", "start"],
  description: "Install session-start hooks for Cursor, Codex, and Claude Code",
  noArgs: true,
  usage: `lore init — install session hooks for your user account (not the repo)

Writes under your home directory:
  ~/.lore/hooks/inject-session-context.mjs   shared Node hook (bundled copy from the CLI package)
  ~/.cursor/hooks.json                        Cursor sessionStart
  ~/.codex/hooks.json                         Codex SessionStart (enable codex_hooks in config)
  ~/.claude/settings.json                     Claude Code SessionStart

The hook file is plain JavaScript so agents can run it with node without a build step.
Source of truth in the repo: apps/cli/resources/inject-session-context.mjs (copied on init).

Options:
  -h, --help     Show this message`,
  async execute() {
    if (!readAuth()) {
      process.stderr.write("lore init: no license key found. Run `lore login` first.\n");
      return 1;
    }
    const result = initHooks();
    process.stdout.write(formatResult(result));
    return 0;
  },
});
