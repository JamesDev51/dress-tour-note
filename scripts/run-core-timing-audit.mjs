import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const targetMs = 30_000;
const reportPath = resolve(
  process.env.CORE_TIMING_REPORT_PATH ??
    ".omo/evidence/task-17-timing-audit/results.json",
);
const playwrightCli = resolve("node_modules/@playwright/test/cli.js");
const child = spawnSync(
  process.execPath,
  [
    playwrightCli,
    "test",
    "e2e/usability.spec.ts",
    "--grep",
    "three warmed core records stay functional while reporting timing",
    "--workers=1",
  ],
  { encoding: "utf8", env: process.env, maxBuffer: 10 * 1024 * 1024 },
);
const stdout = child.stdout ?? "";
const stderr = child.stderr ?? "";
process.stdout.write(stdout);
process.stderr.write(stderr);

const samplesMs = [
  ...stdout.matchAll(/\[core-timing\] run=\d+ elapsedMs=(\d+)/g),
].map((match) => Number(match[1]));
const medianMs =
  samplesMs.length === 3
    ? [...samplesMs].sort((left, right) => left - right)[1]
    : null;
const pass =
  child.status === 0 &&
  samplesMs.length === 3 &&
  medianMs !== null &&
  medianMs <= targetMs;
const report = {
  pass,
  targetMs,
  samplesMs,
  medianMs,
  childExitCode: child.status,
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `[core-timing-audit] pass=${pass} samplesMs=${samplesMs.join(",")} medianMs=${medianMs} targetMs=${targetMs} report=${reportPath}`,
);
if (child.error) console.error(child.error.message);
process.exitCode = pass ? 0 : 1;
