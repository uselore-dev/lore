export type Command = {
  name: string;
  aliases?: string[];
  description: string;
  run(args: string[]): Promise<number>;
};

type CommandDef = {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  noArgs?: boolean;
  execute(args: string[]): Promise<number>;
};

export function defineCommand(def: CommandDef): Command {
  return {
    name: def.name,
    aliases: def.aliases,
    description: def.description,
    async run(args) {
      if (args[0] === "-h" || args[0] === "--help") {
        process.stdout.write(def.usage.endsWith("\n") ? def.usage : `${def.usage}\n`);
        return 0;
      }
      if (def.noArgs && args.length > 0) {
        process.stderr.write(
          `lore ${def.name}: unexpected arguments. Try \`lore ${def.name} --help\`.\n`,
        );
        return 1;
      }
      try {
        return await def.execute(args);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        process.stderr.write(`lore ${def.name}: ${msg}\n`);
        return 1;
      }
    },
  };
}
