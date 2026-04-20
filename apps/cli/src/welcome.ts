import { readAuth } from "./auth";

export function welcome(): string {
  if (readAuth()) return "";
  return `Welcome to lore. Get started:\n\n  1. lore login    — authenticate with your license key\n  2. lore init     — install session hooks for your AI agents\n\nRun \`lore --help\` for all commands.\n`;
}
