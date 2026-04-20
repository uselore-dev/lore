import { homedir } from "node:os";
import { join } from "node:path";

/** Installed by `lore init` — runs the shared hook script from ~/.lore/hooks/ */
export const loreSession = async ({ $ }) => {
  const script = join(homedir(), ".lore/hooks/inject-session-context.mjs");
  return {
    "session.start": async (_input, output) => {
      const text = (await $`node ${script} plain`.text()).trim();
      output.additionalContext = text;
    },
  };
};
