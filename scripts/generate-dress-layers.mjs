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
import dressRenderTokens from "../src/lib/dress/renderTokens.json" with { type: "json" };

const canvas = { width: 720, height: 1280 };
const outputRoot = new URL("../public/assets/dress-layers/", import.meta.url);
const white = dressRenderTokens.garmentHighlight;
const longSleeveMaskBytes = await readFile(
  new URL("../src/assets/dress-long-sleeve-mask.webp", import.meta.url),
);
const longSleeveMaskDataUrl = `data:image/webp;base64,${longSleeveMaskBytes.toString("base64")}`;

const layers = {
  bodice: {
    straight:
      '<path d="M244 356 L476 356 C476 420 452 468 428 500 L428 520 L292 520 L292 500 C268 468 244 420 244 356 Z"/>',
    sweetheart:
      '<path d="M244 360 C290 322 340 334 360 370 C380 334 430 322 476 360 C476 420 452 468 428 500 L428 520 L292 520 L292 500 C268 468 244 420 244 360 Z"/>',
    v: '<path d="M244 348 L360 414 L476 348 C476 420 452 468 428 500 L428 520 L292 520 L292 500 C268 468 244 420 244 348 Z"/>',
    square:
      '<path d="M244 344 L330 344 L330 376 L390 376 L390 344 L476 344 C476 420 452 468 428 500 L428 520 L292 520 L292 500 C268 468 244 420 244 344 Z"/>',
    scoop:
      '<path d="M244 348 C286 392 434 392 476 348 C476 420 452 468 428 500 L428 520 L292 520 L292 500 C268 468 244 420 244 348 Z"/>',
    asymmetric:
      '<path d="M244 324 L476 380 C476 430 452 468 428 500 L428 520 L292 520 L292 500 C268 468 244 420 244 324 Z"/>',
  },
  top: {
    offShoulder:
      '<path d="M294 344 C270 340 246 350 226 368 C214 380 208 394 208 410 C228 400 250 394 276 398 L294 406 Z"/><path d="M426 344 C450 340 474 350 494 368 C506 380 512 394 512 410 C492 400 470 394 444 398 L426 406 Z"/>',
    strap: `<path d="M308 366 L296 256 M412 366 L424 256" fill="none" stroke="${dressRenderTokens.garmentHighlight}" stroke-width="20" stroke-linecap="round"/>`,
    halter:
      '<path d="M322 252 Q360 238 398 252 L394 284 C416 312 432 348 442 390 L404 402 C396 360 382 324 366 292 L354 292 C338 324 324 360 316 402 L278 390 C288 348 304 312 326 284 Z" fill-rule="evenodd"/>',
    shortSleeve:
      '<path d="M292 304 C274 288 250 286 232 298 C216 312 210 334 212 358 C214 382 220 404 232 422 C246 426 260 416 270 398 C282 376 290 342 292 304 Z"/><path d="M428 304 C446 288 470 286 488 298 C504 312 510 334 508 358 C506 382 500 404 488 422 C474 426 460 416 450 398 C438 376 430 342 428 304 Z"/>',
    longSleeve: `<defs><clipPath id="generated-sleeve-clips"><rect x="120" y="220" width="180" height="540"/><rect x="440" y="220" width="160" height="540"/></clipPath><filter id="sleeve-expand"><feMorphology operator="dilate" radius="7"/></filter></defs><image href="${longSleeveMaskDataUrl}" x="0" y="0" width="720" height="1280" preserveAspectRatio="none" clip-path="url(#generated-sleeve-clips)" filter="url(#sleeve-expand)"/>`,
  },
  skirt: {
    unknown:
      '<path d="M284 504 C258 544 226 606 216 760 C224 900 226 1100 196 1270 Q360 1278 524 1270 C494 1100 496 900 504 760 C494 606 462 544 436 504 Z"/>',
    aLine:
      '<path d="M284 504 C260 540 224 606 188 730 C166 890 126 1090 78 1270 Q360 1278 642 1270 C594 1090 554 890 532 730 C496 606 460 540 436 504 Z"/>',
    ballGown:
      '<path d="M284 504 C266 544 246 612 230 700 C164 820 104 1010 30 1268 Q360 1280 690 1268 C616 1010 556 820 490 700 C474 612 454 544 436 504 Z"/>',
    empire:
      '<path d="M288 448 C278 474 276 496 282 520 C238 620 170 780 126 920 C104 1040 84 1160 64 1270 Q360 1278 656 1270 C636 1160 616 1040 594 920 C550 780 482 620 438 520 C444 496 442 474 432 448 Z"/>',
    mermaid:
      '<path d="M284 504 C266 540 246 572 224 588 C216 624 216 640 216 660 C204 720 202 788 210 860 C216 908 228 952 240 976 C238 998 232 1016 220 1032 C188 1082 142 1170 96 1268 C184 1276 268 1280 360 1280 C452 1280 536 1276 624 1268 C578 1170 532 1082 500 1032 C488 1016 482 998 480 976 C492 952 504 908 510 860 C518 788 516 720 504 660 C504 640 504 624 496 588 C474 572 454 540 436 504 Z"/>',
  },
  volume: {
    shadow: `<defs><linearGradient id="s" x1="0" x2="1"><stop stop-color="${dressRenderTokens.volume.sideShadow}" stop-opacity=".3"/><stop offset=".2" stop-color="${dressRenderTokens.volume.sideShadow}" stop-opacity="0"/><stop offset=".8" stop-color="${dressRenderTokens.volume.sideShadow}" stop-opacity="0"/><stop offset="1" stop-color="${dressRenderTokens.volume.sideShadow}" stop-opacity=".3"/></linearGradient><radialGradient id="b"><stop stop-color="${dressRenderTokens.volume.contourShadow}" stop-opacity=".2"/><stop offset="1" stop-color="${dressRenderTokens.volume.contourShadow}" stop-opacity="0"/></radialGradient></defs><rect width="720" height="1280" fill="url(#s)"/><ellipse cx="318" cy="430" rx="72" ry="58" fill="url(#b)"/><ellipse cx="402" cy="430" rx="72" ry="58" fill="url(#b)"/><ellipse cx="360" cy="528" rx="104" ry="38" fill="url(#b)"/><path d="M270 448 Q315 482 360 446 Q405 482 450 448" fill="none" stroke="${dressRenderTokens.volume.seamShadow}" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>`,
    highlight: `<defs><linearGradient id="h" x1="0" x2="1"><stop stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity="0"/><stop offset=".5" stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity=".46"/><stop offset="1" stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity="0"/></linearGradient></defs><rect width="720" height="1280" fill="url(#h)"/>`,
    mermaid: `<defs><radialGradient id="m"><stop stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity=".58"/><stop offset="1" stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity="0"/></radialGradient></defs><ellipse cx="278" cy="650" rx="76" ry="118" fill="url(#m)"/><ellipse cx="442" cy="650" rx="76" ry="118" fill="url(#m)"/><path d="M250 580 C220 690 214 790 236 900 M470 580 C500 690 506 790 484 900" fill="none" stroke="${dressRenderTokens.volume.mermaidShadow}" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>`,
    empire: `<defs><linearGradient id="e" x1="0" x2="1"><stop stop-color="${dressRenderTokens.volume.seamShadow}" stop-opacity="0"/><stop offset=".5" stop-color="${dressRenderTokens.volume.seamShadow}" stop-opacity=".34"/><stop offset="1" stop-color="${dressRenderTokens.volume.seamShadow}" stop-opacity="0"/></linearGradient></defs><path d="M286 452 Q360 470 434 452" fill="none" stroke="url(#e)" stroke-width="7" stroke-linecap="round"/><path d="M300 468 C270 560 248 680 236 820 M420 468 C450 560 472 680 484 820" fill="none" stroke="${dressRenderTokens.volume.seamShadow}" stroke-opacity=".12" stroke-width="5" stroke-linecap="round"/>`,
  },
};

function svg(markup) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280"><g fill="${white}">${markup}</g></svg>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: canvas });
const scratch = await mkdtemp(join(tmpdir(), "dress-layers-"));
const assets = {};
try {
  for (const [group, entries] of Object.entries(layers)) {
    assets[group] = {};
    const directory = new URL(`${group}/`, outputRoot);
    await mkdir(directory, { recursive: true });
    for (const [name, markup] of Object.entries(entries)) {
      await page.setContent(svg(markup));
      const png = join(scratch, `${group}-${name}.png`);
      const output = new URL(`${group}/${name}.webp`, outputRoot);
      await page.locator("svg").screenshot({ path: png, omitBackground: true });
      const conversion = spawnSync(
        "ffmpeg",
        [
          "-y",
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
      assets[group][name] = {
        src: `/assets/dress-layers/${group}/${name}.webp`,
        width: canvas.width,
        height: canvas.height,
        role: group === "volume" ? name : "alpha-mask",
        bytes: (await stat(output)).size,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      };
    }
  }
  await writeFile(
    new URL("manifest.json", outputRoot),
    `${JSON.stringify({ version: 1, canvas, viewBox: "0 0 360 640", assets }, null, 2)}\n`,
  );
} finally {
  await browser.close();
  await rm(scratch, { recursive: true, force: true });
}
