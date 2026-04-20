## trylore

The `lore` CLI. Installs session-start hooks so AI agents receive lore context automatically.

### Commands

| Command | Aliases | Description |
|---|---|---|
| `lore login` | `auth`, `authenticate` | Validate and save a license key |
| `lore logout` | | Remove the saved license key |
| `lore init` | `i`, `initialize`, `start` | Install session hooks for the current user |

### Development

```bash
npm install
npm run build    # esbuild → dist/bin/lore.js
npm run check    # tsc --noEmit
npm run lore -- --help   # run the built CLI
```

Or link it globally for convenience:

```bash
npm run build && npm link
lore --help
```

### Adding a command

1. Create `src/commands/<name>.ts` and export a `Command` via `defineCommand`
2. Import it in `src/cli.ts` and add it to the `commands` array

The dispatcher, `--help` handling, error formatting, and did-you-mean suggestions are all provided automatically.

### Project layout

```
src/
  command.ts          Command type + defineCommand builder
  cli.ts              Registry and dispatcher
  suggest.ts          Fuzzy did-you-mean matching
  auth.ts             Read/write ~/.lore/auth.json
  commands/
    login.ts
    init.ts
  adapters/           One file per supported agent
resources/            Build output — populated from packages/hook/ at build time
```
