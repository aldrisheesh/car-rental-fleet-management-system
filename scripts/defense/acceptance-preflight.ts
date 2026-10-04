import { execFileSync } from "node:child_process";

export function assertCleanBaselinePreview(value: unknown) {
  if (!value || typeof value !== "object")
    throw new Error(
      "Baseline preview is unavailable; no acceptance writes are permitted.",
    );
  const preview = value as Record<string, unknown>;
  if (
    preview.dryRun !== true ||
    !Array.isArray(preview.differences) ||
    !Array.isArray(preview.resetTables) ||
    !preview.resetTables.length ||
    typeof preview.referenceDate !== "string"
  )
    throw new Error(
      "Invalid baseline preview; no acceptance writes are permitted.",
    );
  if (preview.differences.length)
    throw new Error(
      `Current operational records differ from the saved baseline in ${preview.differences.length} table(s). Preserve or explicitly reset those tests before acceptance; no writes were made by this runner.`,
    );
  return { referenceDate: preview.referenceDate };
}

export function acceptancePreflight() {
  let output: string;
  try {
    output = execFileSync(
      process.execPath,
      [
        "--env-file=.env.local",
        "--experimental-strip-types",
        "scripts/defense/baseline.ts",
        "reset",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120_000 },
    );
  } catch {
    throw new Error(
      "Saved baseline preflight failed. Run npm run defense:baseline -- reset to inspect its schema, dependency or integrity refusal. Refresh the baseline only with explicit authorization; no acceptance writes were made.",
    );
  }
  const baseline = assertCleanBaselinePreview(JSON.parse(output));
  const git = (...args: string[]) =>
    execFileSync("git", args, { encoding: "utf8" }).trim();
  return {
    ...baseline,
    branch: git("branch", "--show-current"),
    commit: git("rev-parse", "HEAD"),
    workingTreeDirty: Boolean(git("status", "--porcelain")),
  };
}
