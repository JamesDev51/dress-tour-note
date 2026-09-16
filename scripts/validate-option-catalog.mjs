import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { z } from "zod";
import {
  EXPECTED_PATHS,
  readWebpMetadata,
} from "./option-catalog-contract.mjs";

const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const root = resolve(valueAfter("--root") ?? "public/assets/options");
const reportPath = valueAfter("--report");
const inventoryPath = valueAfter("--inventory");
const expected = [...EXPECTED_PATHS];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else paths.push(path);
  }
  return paths;
}

const allPaths = await walk(root);
const actual = allPaths
  .filter((path) => path.endsWith(".webp"))
  .map((path) => relative(root, path))
  .sort();
const actualSet = new Set(actual);
const expectedSet = new Set(expected);
const missing = expected.filter((path) => !actualSet.has(path));
const extra = actual.filter((path) => !expectedSet.has(path));
const inventory = [];
for (const relativePath of actual) {
  const path = resolve(root, relativePath);
  const bytes = await readFile(path);
  const image = readWebpMetadata(bytes);
  const file = await stat(path);
  inventory.push({
    path: relativePath,
    bytes: file.size,
    mime: image ? "image/webp" : "invalid",
    width: image?.width ?? null,
    height: image?.height ?? null,
    hasAlpha: image?.hasAlpha ?? null,
    hasRemoteReference: /https?:\/\/|data:image|url\(/i.test(
      bytes.toString("latin1"),
    ),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

const invalid = inventory.filter(
  (item) =>
    item.mime !== "image/webp" ||
    item.width !== 512 ||
    item.height !== 512 ||
    item.bytes > 120 * 1024,
);
const hashes = Map.groupBy(inventory, (item) => item.sha256);
const duplicateHashes = [...hashes.entries()]
  .filter(([, items]) => items.length > 1)
  .map(([sha256, items]) => ({
    sha256,
    paths: items.map((item) => item.path),
  }));
const alphaViolations = inventory
  .filter((item) => item.hasAlpha !== false)
  .map((item) => item.path);
const remoteReferences = inventory
  .filter((item) => item.hasRemoteReference)
  .map((item) => item.path);

const manifestItemSchema = z.object({
  category: z.string(),
  value: z.string(),
  path: z.string(),
  mime: z.literal("image/webp"),
  width: z.literal(512),
  height: z.literal(512),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  hasAlpha: z.literal(false),
});
const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  knownChoiceCount: z.literal(61),
  aggregateBytes: z.number().int().positive(),
  alphaPolicy: z.literal("opaque-only"),
  items: z.array(manifestItemSchema).length(61),
});
const manifestRaw = JSON.parse(
  await readFile(resolve(root, "manifest.json"), "utf8"),
);
const manifestResult = manifestSchema.safeParse(manifestRaw);
const manifestItems = manifestResult.success ? manifestResult.data.items : [];
const manifestPaths = manifestItems.map((item) => item.path);
const manifestPathSet = new Set(manifestPaths);
const manifestMismatches = [];
if (!manifestResult.success) {
  manifestMismatches.push(
    ...manifestResult.error.issues.map(
      (issue) => `schema:${issue.path.join(".")}:${issue.message}`,
    ),
  );
}
for (const path of expected) {
  if (!manifestPathSet.has(path)) manifestMismatches.push(`missing:${path}`);
}
for (const path of manifestPaths) {
  if (!expectedSet.has(path)) manifestMismatches.push(`extra:${path}`);
}
if (manifestPaths.length !== manifestPathSet.size)
  manifestMismatches.push("duplicate manifest path");
for (const item of inventory) {
  const manifestItem = manifestItems.find((entry) => entry.path === item.path);
  if (!manifestItem) continue;
  for (const field of [
    "bytes",
    "mime",
    "width",
    "height",
    "sha256",
    "hasAlpha",
  ]) {
    if (manifestItem[field] !== item[field])
      manifestMismatches.push(`${item.path}:${field}`);
  }
}
const aggregateBytes = inventory.reduce((sum, item) => sum + item.bytes, 0);
if (
  manifestResult.success &&
  manifestResult.data.aggregateBytes !== aggregateBytes
) {
  manifestMismatches.push("aggregateBytes");
}

const viteConfig = await readFile(resolve("vite.config.ts"), "utf8");
const globSource = viteConfig.match(/globPatterns:\s*\[([^\]]+)\]/s)?.[1] ?? "";
const maximumMiB = Number(
  viteConfig.match(
    /maximumFileSizeToCacheInBytes:\s*(\d+)\s*\*\s*1024\s*\*\s*1024/,
  )?.[1] ?? 0,
);
const workboxMaximumBytes = maximumMiB * 1024 * 1024;
const workbox = {
  globIncludesWebp: /webp/.test(globSource),
  maximumFileSizeToCacheInBytes: workboxMaximumBytes,
  ineligible: inventory
    .filter(
      (item) => !/webp/.test(globSource) || item.bytes > workboxMaximumBytes,
    )
    .map((item) => item.path),
};
const report = {
  pass:
    actual.length === 61 &&
    missing.length === 0 &&
    extra.length === 0 &&
    invalid.length === 0 &&
    duplicateHashes.length === 0 &&
    alphaViolations.length === 0 &&
    remoteReferences.length === 0 &&
    manifestMismatches.length === 0 &&
    workbox.globIncludesWebp &&
    workbox.ineligible.length === 0 &&
    aggregateBytes <= 7.5 * 1024 * 1024,
  expectedCount: expected.length,
  actualCount: actual.length,
  missing,
  extra,
  invalid,
  duplicateHashes,
  alphaPolicy: "opaque-only",
  alphaViolations,
  remoteReferences,
  manifestMismatches,
  workbox,
  aggregateBytes,
  aggregateLimitBytes: 7.5 * 1024 * 1024,
};

async function persist(path, value) {
  if (!path) return;
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(resolve(path), `${JSON.stringify(value, null, 2)}\n`);
}
await persist(reportPath, report);
await persist(inventoryPath, inventory);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.pass ? 0 : 1;
