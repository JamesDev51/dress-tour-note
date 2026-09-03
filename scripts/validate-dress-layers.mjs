import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../public/", import.meta.url);
const manifestUrl = new URL("assets/dress-layers/manifest.json", root);
const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
const expected = { bodice: 6, top: 5, skirt: 5, volume: 4 };
const failures = [];

for (const [group, count] of Object.entries(expected)) {
  const entries = Object.values(manifest.assets[group] ?? {});
  if (entries.length !== count)
    failures.push(
      `${group}: expected ${count} assets, found ${entries.length}`,
    );
  for (const asset of entries) {
    const file = new URL(asset.src.replace(/^\//, ""), root);
    const bytes = await readFile(file);
    const size = (await stat(file)).size;
    const hash = createHash("sha256").update(bytes).digest("hex");
    const probe = spawnSync(
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
        file.pathname,
      ],
      { encoding: "utf8" },
    );
    if (probe.status !== 0) failures.push(`${asset.src}: ffprobe failed`);
    const stream = JSON.parse(probe.stdout || '{"streams":[]}').streams[0];
    if (stream?.width !== 720 || stream?.height !== 1280)
      failures.push(`${asset.src}: expected 720x1280`);
    if (!String(stream?.pix_fmt).includes("a"))
      failures.push(`${asset.src}: alpha channel missing`);
    if (size >= 250_000) failures.push(`${asset.src}: exceeds 250KB`);
    if (size !== asset.bytes) failures.push(`${asset.src}: byte count drift`);
    if (hash !== asset.sha256) failures.push(`${asset.src}: SHA-256 drift`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "20 dress layer assets valid: 720x1280 alpha WebP, <250KB, hashes match",
  );
}
