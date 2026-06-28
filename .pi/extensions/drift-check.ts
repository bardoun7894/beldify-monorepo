// @ts-nocheck
/**
 * Drift Check Extension
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "child_process";

const P = "/Users/mohamedbardouni/projects/beldify";
const S = P + "/scripts/drift-check.py";

function run(fl: string): string {
  try {
    return execSync("cd " + P + " && python3 " + S + " " + fl + " 2>&1", { encoding: "utf-8", timeout: 15_000 }).trim();
  } catch (e: any) { return "\u274c Drift: " + (e as Error).message; }

}

export default function ext(pi: any) {
  pi.registerCommand("drift", {
    description: "Check/fix local vs prod drift",
    getArgumentCompletions: (p: string) => ["fix", "full"].filter(o => o.startsWith(p)).map(v => ({ value: v, label: v })),
    handler: async (a: string, ctx: any) => {
      const arg = a.trim().toLowerCase();
      if (arg === "fix") ctx.ui.notify("\ud83d\udd04 Syncing...", "info");
      const f = arg === "fix" ? "--fix" : arg === "full" ? "" : "--quick";
      return { content: [{ type: "text" as const, text: run(f) }] };
    },
  });

  pi.registerTool({
    name: "check_drift",
    label: "Check Drift",
    description: "Check local vs production git SHA match for monorepo + backend submodule",
    parameters: Type.Object({
      mode: Type.Optional(Type.Union([
        Type.Literal("quick", { description: "SHA-only (default)" }),
        Type.Literal("full", { description: "Full report" }),
        Type.Literal("fix", { description: "Auto-sync server" }),
      ])),
    }),
    async execute(_id: any, p: any, _s: any, _u: any, _c: any) {
      const m = (p as any).mode || "quick";
      const f = m === "fix" ? "--fix" : m === "full" ? "" : "--quick";
      return { content: [{ type: "text", text: run(f) }], details: {} };
    },
  });

  pi.on("session_start", async (_e: any, ctx: any) => {
    try {
      const l = execSync("git rev-parse --short HEAD", { cwd: P, encoding: "utf-8", timeout: 5_000 }).trim();
      const s = execSync('ssh MyContabo "cd /var/local/beldify-monorepo && git rev-parse --short HEAD"', { encoding: "utf-8", timeout: 10_000 }).trim();
      if (l !== s) ctx.ui.notify("\u26a0\u23ef Drift: local " + l + " ≠ prod " + s + ". /drift", "warn");
    } catch {/* server offline */}
  });
}
