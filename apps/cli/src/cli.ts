import type { Command } from "./command";
import { initCommand } from "./commands/init";
import { loginCommand } from "./commands/login";
import { logoutCommand } from "./commands/logout";
import { suggest } from "./suggest";
import { welcome } from "./welcome";

declare const __LORE_VERSION__: string;
const VERSION = __LORE_VERSION__;

const commands: Command[] = [loginCommand, logoutCommand, initCommand];

function usage(): string {
  const cmds = commands.map((c) => `  ${c.name.padEnd(14)} ${c.description}`).join("\n");
  return `lore — local CLI

Usage:
  lore [command] [options]

Commands:
${cmds}

Options:
  -h, --help     Show this message
  -V, --version  Print version
`;
}


export async function main(argv: string[]): Promise<number> {
  const [first, ...rest] = argv;

  if (first === "-h" || first === "--help" || first === "help") {
    process.stdout.write(usage());
    return 0;
  }

  if (first === "-V" || first === "--version") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (first === undefined) {
    process.stdout.write(welcome() || usage());
    return 0;
  }

  const cmd = commands.find((c) => [c.name, ...(c.aliases ?? [])].includes(first));
  if (!cmd) {
    const suggestion = suggest(first, commands);
    const hint = suggestion ? ` Did you mean \`${suggestion.name}\`?` : ` Try \`lore --help\`.`;
    process.stderr.write(`lore: unknown command "${first}".${hint}\n`);
    return 1;
  }

  return cmd.run(rest);
}
