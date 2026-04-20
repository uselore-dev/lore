import { build } from "esbuild";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

const hookDir = fileURLToPath(new URL("../../packages/hook", import.meta.url));
const resourcesDir = fileURLToPath(new URL("./resources", import.meta.url));

mkdirSync(resourcesDir, { recursive: true });
for (const file of ["inject-session-context.mjs", "lore-session.mjs"]) {
  copyFileSync(join(hookDir, file), join(resourcesDir, file));
}

await build({
  entryPoints: ["src/bin/lore.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "dist/bin/lore.js",
  define: {
    __LORE_VERSION__: JSON.stringify(version ?? "0.0.0"),
    __LORE_API_URL__: JSON.stringify(
      process.env.LORE_API_URL ?? "https://lore-worker.mazewinther.workers.dev",
    ),
  },
});
