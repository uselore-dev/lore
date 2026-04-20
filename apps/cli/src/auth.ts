import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type Auth = {
  key: string;
};

const authPath = () => join(homedir(), ".lore", "auth.json");

export function readAuth(): Auth | undefined {
  const path = authPath();
  if (!existsSync(path)) return undefined;
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (typeof value?.key === "string" && value.key) return { key: value.key };
  } catch {}
  return undefined;
}

export function writeAuth(auth: Auth): void {
  const path = authPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(auth, null, 2)}\n`, "utf8");
}
