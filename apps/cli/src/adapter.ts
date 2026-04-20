import type { OutputMode } from "@lore/hook/registry";

export type WriteStatus = "created" | "updated";

export type AdapterContext = {
  /** Absolute path to the installed hook script (~/.lore/hooks/inject-session-context.mjs) */
  scriptPath: string;
  mode: OutputMode;
  home: string;
};

export type AdapterResult = {
  path: string;
  status: WriteStatus;
};

export type Adapter = {
  id: string;
  name: string;
  /** Notes shown to the user after init (caveats, required config, etc.) */
  notes?: string[];
  register(ctx: AdapterContext): AdapterResult;
};
