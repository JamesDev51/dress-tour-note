import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";

const root = "public/assets/dress-structures";
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const tops = [
  "unknown",
  "strapless",
  "offShoulder",
  "strap",
  "halter",
  "shortSleeve",
  "longSleeve",
];
const necklines = [
  "unknown",
  "straight",
  "sweetheart",
  "v",
  "square",
  "scoop",
  "asymmetric",
];
const silhouettes = ["unknown", "aLine", "ballGown", "mermaid", "empire"];
const expected = new Set(
  tops.flatMap((top) =>
    necklines.flatMap((neckline) =>
      silhouettes.map((silhouette) => `${top}__${neckline}__${silhouette}`),
    ),
  ),
);
const failures = [];
const entries = Object.entries(manifest.combinations ?? {});

if (entries.length !== expected.size)
  failures.push(
    `expected ${expected.size} structures, found ${entries.length}`,
  );
for (const key of expected)
  if (!manifest.combinations?.[key]) failures.push(`missing ${key}`);

let totalBytes = 0;
for (const [key, entry] of entries) {
  if (!expected.has(key)) failures.push(`unexpected ${key}`);
  const path = `${root}/${key}.webp`;
  const bytes = await readFile(path).catch(() => undefined);
  if (!bytes) {
    failures.push(`missing file ${path}`);
    continue;
  }
  const info = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,pix_fmt",
        "-of",
        "json",
        path,
      ],
      { encoding: "utf8" },
    ),
  ).streams[0];
  const size = (await stat(path)).size;
  totalBytes += size;
  if (info.width !== 720 || info.height !== 1280)
    failures.push(`${key} must be 720x1280`);
  if (!String(info.pix_fmt).includes("a")) failures.push(`${key} lacks alpha`);
  if (size > 250_000) failures.push(`${key} exceeds 250KB`);
  if (entry.bytes !== size) failures.push(`${key} byte count mismatch`);
  if (entry.sha256 !== createHash("sha256").update(bytes).digest("hex"))
    failures.push(`${key} hash mismatch`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `${entries.length} complete dress structures valid: 720x1280 alpha WebP, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB total`,
  );
}
