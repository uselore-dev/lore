# lore

Lore injects expert engineering context into every AI coding session automatically. Once installed, your AI agents (Cursor, Codex, Claude Code) receive the context at session start — no prompting required.

Access is gated by a license key.

## Installation

**Requirements:** Node 18+

```bash
npm install -g trylore
lore login
lore init
```

`lore login` validates your license key and saves it locally. `lore init` installs session-start hooks for your user account — it writes a hook script to `~/.lore/hooks/` and registers it with any supported agents it finds. From that point on, every new session fetches your context automatically using the saved key.

Run `lore login --help` or `lore init --help` for details.

## Supported agents

- [Cursor](https://cursor.com)
- [Codex CLI](https://github.com/openai/codex) — requires `codex_hooks = true` in your Codex config
- [Claude Code](https://claude.ai/code)

---

## Development

This is an npm workspaces + Turborepo monorepo.

| Package | Description |
|---|---|
| [`apps/cli`](apps/cli/README.md) | The `lore` CLI |
| [`apps/worker`](apps/worker/README.md) | Cloudflare Worker — license validation and context delivery |

```bash
npm install
npm run build
npm run check
```
