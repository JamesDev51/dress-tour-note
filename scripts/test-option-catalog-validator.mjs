import {
  appendFile,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const evidenceRoot = resolve(".omo/evidence");
await mkdir(evidenceRoot, { recursive: true });
const fixtureRoots = [];
const results = [];

async function runCase(name, mutate, assertReport) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), `dress-option-${name}-`));
  fixtureRoots.push(fixtureRoot);
  await cp(resolve("public/assets/options"), fixtureRoot, { recursive: true });
  await mutate(fixtureRoot);
  const reportPath = join(
    evidenceRoot,
    `task-4-catalog-assets-adversarial-${name}.json`,
  );
  const result = spawnSync(
    process.execPath,
    [
      "scripts/validate-option-catalog.mjs",
      "--root",
      fixtureRoot,
      "--report",
      reportPath,
    ],
    { encoding: "utf8" },
  );
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const passed =
    result.status !== 0 && report.pass === false && assertReport(report);
  results.push({ name, nestedExit: result.status ?? -1, passed, reportPath });
}

try {
  await runCase(
    "missing",
    (root) => unlink(join(root, "top/spaghetti.webp")),
    (report) => report.missing.includes("top/spaghetti.webp"),
  );
  await runCase(
    "extra",
    (root) =>
      cp(join(root, "top/strapless.webp"), join(root, "top/unknown.webp")),
    (report) => report.extra.includes("top/unknown.webp"),
  );
  await runCase(
    "invalid",
    (root) => writeFile(join(root, "detail/buttons.webp"), "not-a-webp"),
    (report) =>
      report.invalid.some((item) => item.path === "detail/buttons.webp"),
  );
  await runCase(
    "duplicate",
    (root) =>
      cp(join(root, "top/strapless.webp"), join(root, "top/strap.webp")),
    (report) =>
      Array.isArray(report.duplicateHashes) &&
      report.duplicateHashes.length > 0,
  );
  await runCase(
    "wrong-size",
    (root) => {
      const target = join(root, "color/pureWhite.webp");
      const resized = spawnSync(
        "python3",
        [
          "-c",
          "from PIL import Image; import sys; p=sys.argv[1]; im=Image.open(p).convert('RGB'); im.resize((511,512)).save(p,'WEBP',quality=78,method=6)",
          target,
        ],
        { encoding: "utf8" },
      );
      if (resized.status !== 0) throw new Error(resized.stderr);
    },
    (report) => report.invalid.some((item) => item.width === 511),
  );
  await runCase(
    "oversized",
    (root) =>
      appendFile(join(root, "train/none.webp"), Buffer.alloc(123 * 1024)),
    (report) => report.invalid.some((item) => item.bytes > 120 * 1024),
  );
} finally {
  await Promise.all(fixtureRoots.map((root) => rm(root, { recursive: true })));
  await writeFile(
    join(evidenceRoot, "task-4-catalog-assets-cleanup.json"),
    `${JSON.stringify(
      {
        temporaryFixtures: fixtureRoots.map((root) => basename(root)),
        temporaryFixturesRemoved: fixtureRoots.length,
        browserProcessesSpawned: 0,
        generatedSourceCacheRetainedPerImagegenPolicy: true,
      },
      null,
      2,
    )}\n`,
  );
}

await writeFile(
  join(evidenceRoot, "task-4-catalog-assets-adversarial.log"),
  `${JSON.stringify(results, null, 2)}\n`,
);
if (results.length !== 6 || results.some((result) => !result.passed)) {
  throw new Error(
    `Validator adversarial coverage failed: ${JSON.stringify(results)}`,
  );
}
console.log(
  `PASS ${results.length} adversarial fixtures rejected independently`,
);
