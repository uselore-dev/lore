import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { defineCommand } from "../command";

export const logoutCommand = defineCommand({
  name: "logout",
  description: "Remove the saved license key",
  usage: `lore logout — remove the saved license key from this machine

Options:
  -h, --help     Show this message`,
  noArgs: true,
  async execute() {
    const path = join(homedir(), ".lore", "auth.json");
    if (!existsSync(path)) {
      process.stdout.write("Not logged in.\n");
      return 0;
    }
    rmSync(path);
    process.stdout.write("Logged out.\n");
    return 0;
  },
});
