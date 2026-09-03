import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const canvas = { width: 720, height: 1280 };
const outputRoot = new URL(
  "../public/assets/dress-structures/",
  import.meta.url,
);
const sourceRoot = new URL("../public/assets/dress-layers/", import.meta.url);

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

const topFile = {
  unknown: undefined,
  strapless: undefined,
  offShoulder: "offShoulder",
  strap: "strap",
  halter: "halter",
  shortSleeve: "shortSleeve",
  longSleeve: "longSleeve",
};
const necklineFile = {
  unknown: "straight",
  straight: "straight",
  sweetheart: "sweetheart",
  v: "v",
  square: "square",
  scoop: "scoop",
  asymmetric: "asymmetric",
};

async function dataUrl(group, name) {
  const bytes = await readFile(new URL(`${group}/${name}.webp`, sourceRoot));
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}

function structureSvg({ bodice, top, skirt }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280"><image href="${skirt}" x="0" y="-40" width="720" height="1380" preserveAspectRatio="none"/><image href="${bodice}" x="0" y="0" width="720" height="1280" preserveAspectRatio="none"/>${top ? `<image href="${top}" x="0" y="0" width="720" height="1280" preserveAspectRatio="none"/>` : ""}</svg>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: canvas });
const scratch = await mkdtemp(join(tmpdir(), "dress-structures-"));
const combinations = {};

try {
  await mkdir(outputRoot, { recursive: true });
  const bodices = Object.fromEntries(
    await Promise.all(
      [...new Set(Object.values(necklineFile))].map(async (name) => [
        name,
        await dataUrl("bodice", name),
      ]),
    ),
  );
  const topLayers = Object.fromEntries(
    await Promise.all(
      Object.values(topFile)
        .filter(Boolean)
        .map(async (name) => [name, await dataUrl("top", name)]),
    ),
  );
  const skirts = Object.fromEntries(
    await Promise.all(
      silhouettes.map(async (name) => [name, await dataUrl("skirt", name)]),
    ),
  );

  for (const top of tops) {
    for (const neckline of necklines) {
      for (const silhouette of silhouettes) {
        const key = `${top}__${neckline}__${silhouette}`;
        await page.setContent(
          structureSvg({
            bodice: bodices[necklineFile[neckline]],
            top: topFile[top] ? topLayers[topFile[top]] : undefined,
            skirt: skirts[silhouette],
          }),
        );
        const png = join(scratch, `${key}.png`);
        const output = new URL(`${key}.webp`, outputRoot);
        await page
          .locator("svg")
          .screenshot({ path: png, omitBackground: true });
        const conversion = spawnSync(
          "ffmpeg",
          [
            "-y",
            "-loglevel",
            "error",
            "-i",
            png,
            "-c:v",
            "libwebp",
            "-quality",
            "86",
            "-compression_level",
            "6",
            "-pix_fmt",
            "yuva420p",
            output.pathname,
          ],
          { encoding: "utf8" },
        );
        if (conversion.status !== 0) throw new Error(conversion.stderr);
        const bytes = await readFile(output);
        combinations[key] = {
          src: `/assets/dress-structures/${key}.webp`,
          role: "alpha-structure",
          width: canvas.width,
          height: canvas.height,
          bytes: (await stat(output)).size,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
      }
    }
  }
  await writeFile(
    new URL("manifest.json", outputRoot),
    `${JSON.stringify({ version: 1, canvas, viewBox: "0 0 360 640", combinations }, null, 2)}\n`,
  );
} finally {
  await browser.close();
  await rm(scratch, { recursive: true, force: true });
}
