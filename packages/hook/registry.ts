export type OutputMode = "cursor" | "plain";

export type HookRegistration = {
  adapterId: string;
  mode: OutputMode;
};

export type Hook = {
  /** Source filename in packages/hook/ */
  script: string;
  /** Destination filename under ~/.lore/hooks/ */
  dest: string;
  registrations: HookRegistration[];
};

export const hooks: Hook[] = [
  {
    script: "inject-session-context.mjs",
    dest: "inject-session-context.mjs",
    registrations: [
      { adapterId: "cursor", mode: "cursor" },
      { adapterId: "codex", mode: "plain" },
      { adapterId: "claude", mode: "plain" },
    ],
  },
];
