/**
 * OpenCode adapter - not yet active.
 *
 * OpenCode's plugin API does not currently expose a hook for injecting context
 * at session start. The events list (session.created, session.updated, etc.)
 * has no output field for additional context.
 *
 * When OpenCode adds a session context hook, implement this adapter and add it
 * to the adapters array in init-hooks.ts.
 *
 * Tracking: https://opencode.ai/docs/plugins/
 */
