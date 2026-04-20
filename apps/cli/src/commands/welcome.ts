import { readAuth } from "../auth";
import { defineCommand } from "../command";

function welcomeMessage(): string {
  return `Welcome to lore. Get started:\n\n  1. lore login    — authenticate with your license key\n  2. lore init     — install session hooks for your AI agents\n\nRun \`lore --help\` for all commands.\n`;
}

export const welcomeCommand = defineCommand({
  name: "__welcome__",
  description: "",
  usage: "",
  async execute() {
    const { readAuth: _r } = await import("../auth");
    return 0;
  },
});
