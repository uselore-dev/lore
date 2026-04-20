import { createInterface } from "node:readline/promises";

import { writeAuth } from "../auth";
import { defineCommand } from "../command";

declare const __LORE_API_URL__: string;

async function promptKey(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const key = await rl.question("License key: ");
  rl.close();
  return key.trim();
}

async function validate(key: string): Promise<{ ok: true } | { ok: false; message: string }> {
  let res: Response;
  try {
    res = await fetch(`${__LORE_API_URL__}/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    return { ok: false, message: "Could not reach the lore server. Check your connection." };
  }

  if (res.ok) return { ok: true };

  let message = `Server returned ${res.status}.`;
  try {
    const body = await res.json() as { message?: string };
    if (body.message) message = body.message;
  } catch {}

  return { ok: false, message };
}

export const loginCommand = defineCommand({
  name: "login",
  aliases: ["auth", "authenticate"],
  description: "Authenticate with a license key",
  usage: `lore login — save your license key locally

Options:
  --key=<key>    Provide the key directly (skips the prompt)
  -h, --help     Show this message`,
  async execute(args) {
    const keyArg = args.find((a) => a.startsWith("--key="))?.slice(6).trim();
    const key = keyArg || await promptKey();

    if (!key) {
      process.stderr.write("lore login: no key provided.\n");
      return 1;
    }

    process.stdout.write("Validating...\n");
    const result = await validate(key);

    if (!result.ok) {
      process.stderr.write(`lore login: ${result.message}\n`);
      return 1;
    }

    writeAuth({ key });
    process.stdout.write("Logged in. Run `lore init` to install session hooks.\n");
    return 0;
  },
});
