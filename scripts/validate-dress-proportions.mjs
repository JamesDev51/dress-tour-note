import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const WIDTH = 720;
const HEIGHT = 1280;
const ALPHA_THRESHOLD = 12;

function readAlpha(path) {
  return execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      path,
      "-vf",
      "alphaextract",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "gray",
      "pipe:1",
    ],
    { maxBuffer: WIDTH * HEIGHT + 1024 },
  );
}

function alphaStats(alpha) {
  let minX = WIDTH;
  let minY = HEIGHT;
  let maxX = -1;
  let maxY = -1;
  let area = 0;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (alpha[y * WIDTH + x] <= ALPHA_THRESHOLD) continue;
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    area,
  };
}

function centralWidth(alpha, y) {
  let start = -1;
  const ranges = [];
  for (let x = 0; x < WIDTH; x += 1) {
    const opaque = alpha[y * WIDTH + x] > ALPHA_THRESHOLD;
    if (opaque && start < 0) start = x;
    if (!opaque && start >= 0) {
      ranges.push([start, x - 1]);
      start = -1;
    }
  }
  if (start >= 0) ranges.push([start, WIDTH - 1]);
  const central = ranges.find(([left, right]) => left <= 360 && right >= 360);
  return central ? central[1] - central[0] + 1 : 0;
}

function minimumCentralWidth(alpha, startY, endY) {
  let width = WIDTH;
  let y = startY;
  for (let row = startY; row <= endY; row += 1) {
    const rowWidth = centralWidth(alpha, row);
    if (rowWidth > 0 && rowWidth < width) {
      width = rowWidth;
      y = row;
    }
  }
  return { width, y };
}

const offShoulder = readAlpha(
  "public/assets/dress-layers/top/offShoulder.webp",
);
const shortSleeve = readAlpha(
  "public/assets/dress-layers/top/shortSleeve.webp",
);
const dressPersonSource = await readFile(
  "src/lib/image/dressPerson.ts",
  "utf8",
);
const personImport = dressPersonSource.match(/\.\.\/\.\.\/assets\/([^?"]+)/);
if (!personImport?.[1]) throw new Error("dress person asset import not found");
const person = readAlpha(`src/assets/${personImport[1]}`);
const offStats = alphaStats(offShoulder);
const shortStats = alphaStats(shortSleeve);
let intersection = 0;
let union = 0;
for (let index = 0; index < WIDTH * HEIGHT; index += 1) {
  const off = offShoulder[index] > ALPHA_THRESHOLD;
  const short = shortSleeve[index] > ALPHA_THRESHOLD;
  if (off && short) intersection += 1;
  if (off || short) union += 1;
}

const bust = centralWidth(person, 330);
const waist = minimumCentralWidth(person, 400, 480);
const hip = centralWidth(person, 620);
const bodiceWaists = Object.fromEntries(
  ["straight", "sweetheart", "v", "square", "scoop", "asymmetric"].map(
    (name) => [
      name,
      centralWidth(
        readAlpha(`public/assets/dress-layers/bodice/${name}.webp`),
        510,
      ),
    ],
  ),
);
const skirtWaists = Object.fromEntries(
  ["unknown", "aLine", "ballGown", "empire", "mermaid"].map((name) => [
    name,
    centralWidth(
      readAlpha(`public/assets/dress-layers/skirt/${name}.webp`),
      510,
    ),
  ]),
);
const metrics = {
  offShoulder: offStats,
  shortSleeve: shortStats,
  distinction: {
    heightRatio: shortStats.height / offStats.height,
    areaRatio: shortStats.area / offStats.area,
    iou: intersection / union,
  },
  person: {
    bust,
    waist: waist.width,
    waistY: waist.y,
    hip,
    waistToBust: waist.width / bust,
    waistToHip: waist.width / hip,
    bustToHip: bust / hip,
  },
  garment: { bodiceWaists, skirtWaists },
};

const failures = [];
if (metrics.distinction.heightRatio < 1.65)
  failures.push("short sleeve height ratio must be at least 1.65");
if (metrics.distinction.areaRatio < 1.45)
  failures.push("short sleeve area ratio must be at least 1.45");
if (metrics.distinction.iou > 0.55)
  failures.push("short sleeve/off-shoulder IoU must be at most 0.55");
if (bust < 270 || bust > 290)
  failures.push("upper bust support width must be 270..290");
if (waist.width < 124 || waist.width > 132)
  failures.push("minimum waist width must be 124..132");
if (hip < 238 || hip > 255) failures.push("hip width must be 238..255");
if (metrics.person.waistToBust < 0.43 || metrics.person.waistToBust > 0.47)
  failures.push("waist/bust-support ratio must be 0.43..0.47");
if (metrics.person.waistToHip < 0.5 || metrics.person.waistToHip > 0.54)
  failures.push("waist/hip ratio must be 0.50..0.54");
if (metrics.person.bustToHip < 1.08 || metrics.person.bustToHip > 1.18)
  failures.push("bust-support/hip ratio must be 1.08..1.18");
for (const [name, width] of Object.entries(bodiceWaists))
  if (width < 132 || width > 144)
    failures.push(`${name} bodice waist must be 132..144`);
for (const [name, width] of Object.entries(skirtWaists))
  if (width < 148 || width > 168)
    failures.push(`${name} skirt waist must be 148..168`);

if (process.env.EVIDENCE_PATH)
  await writeFile(
    process.env.EVIDENCE_PATH,
    `${JSON.stringify(metrics, null, 2)}\n`,
  );

if (failures.length > 0) {
  console.error(`${failures.join("\n")}\n${JSON.stringify(metrics, null, 2)}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(metrics, null, 2));
}
