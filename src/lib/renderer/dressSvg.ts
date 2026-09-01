import type { Dress, FaceTransform } from "../../types/domain";
import { loadDressPersonBase } from "../image/dressPerson";
import { colorHex, dressForPresentation } from "../dress/options";

const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const skirtPath: Record<Dress["silhouette"], string> = {
  unknown: "M145 250 L215 250 L250 570 L110 570 Z",
  aLine: "M148 250 L212 250 L295 590 L65 590 Z",
  ballGown:
    "M145 250 L215 250 C255 285 315 410 330 590 L30 590 C45 410 105 285 145 250 Z",
  empire:
    "M146 250 L214 250 C248 300 290 430 305 590 L55 590 C70 430 112 300 146 250 Z",
  fitAndFlare:
    "M148 250 L212 250 C205 330 220 390 275 590 L85 590 C140 390 155 330 148 250 Z",
  mermaid:
    "M150 250 L210 250 C205 355 208 430 220 470 C245 490 285 530 305 590 L55 590 C75 530 115 490 140 470 C152 430 155 355 150 250 Z",
  sheath: "M150 250 L210 250 L225 590 L135 590 Z",
  teaLength: "M148 250 L212 250 L270 500 L90 500 Z",
};
function necklinePath(type: Dress["neckline"]) {
  switch (type) {
    case "sweetheart":
      return "M150 180 C162 165 174 170 180 184 C186 170 198 165 210 180 L210 258 L150 258 Z";
    case "v":
      return "M150 174 L180 205 L210 174 L210 258 L150 258 Z";
    case "square":
      return "M150 172 L164 172 L164 195 L196 195 L196 172 L210 172 L210 258 L150 258 Z";
    case "scoop":
      return "M150 174 C160 208 200 208 210 174 L210 258 L150 258 Z";
    case "high":
      return "M158 128 L202 128 L210 258 L150 258 Z";
    case "illusion":
      return "M156 138 L204 138 L210 258 L150 258 Z";
    case "asymmetric":
      return "M150 162 L210 190 L210 258 L150 258 Z";
    case "straight":
    default:
      return "M150 178 L210 178 L210 258 L150 258 Z";
  }
}
function upperExtras(top: Dress["topStyle"], base: string, shadow: string) {
  switch (top) {
    case "offShoulder":
      return `<path d="M149 176 C126 174 112 186 103 205" fill="none" stroke="${base}" stroke-width="18" stroke-linecap="round"/><path d="M211 176 C234 174 248 186 257 205" fill="none" stroke="${base}" stroke-width="18" stroke-linecap="round"/>`;
    case "spaghetti":
      return `<path d="M157 181 L150 124 M203 181 L210 124" stroke="${shadow}" stroke-width="5"/>`;
    case "wideStrap":
      return `<path d="M158 183 L148 123 M202 183 L212 123" stroke="${base}" stroke-width="16"/>`;
    case "strap":
      return `<path d="M158 183 L151 128 M202 183 L209 128" stroke="${base}" stroke-width="10" stroke-linecap="round"/>`;
    case "halter":
      return `<path d="M160 178 L180 135 L200 178 L208 258 L152 258 Z" fill="${base}" stroke="${shadow}" stroke-width="2"/>`;
    case "oneShoulder":
      return `<path d="M158 181 L207 120" stroke="${base}" stroke-width="18" stroke-linecap="round"/>`;
    case "shortSleeve":
      return `<path d="M151 173 Q125 167 112 193 L121 220 Q136 201 152 201 Z" fill="${base}"/><path d="M209 173 Q235 167 248 193 L239 220 Q224 201 208 201 Z" fill="${base}"/>`;
    case "longSleeve":
      return `<path d="M151 170 Q126 166 114 190 L96 320 Q108 328 120 320 L141 207 Z" fill="${base}" opacity=".9"/><path d="M209 170 Q234 166 246 190 L264 320 Q252 328 240 320 L219 207 Z" fill="${base}" opacity=".9"/>`;
    case "strapless":
    case "unknown":
    default:
      return "";
  }
}
function pattern(dress: Dress, id: string) {
  switch (dress.fabric) {
    case "lace":
      return `<pattern id="p-${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="4" fill="none" stroke="#d7cdc8" stroke-width="1"/><path d="M12 12q6-8 12 0q-6 8-12 0" fill="none" stroke="#d7cdc8"/></pattern>`;
    case "tulle":
      return `<pattern id="p-${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10L10 0" stroke="#ded8d4" stroke-width=".7"/></pattern>`;
    case "glitterBeaded":
      return `<pattern id="p-${id}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2" fill="#ddd0c6"/><circle cx="16" cy="13" r="1.5" fill="#c7b4a7"/></pattern>`;
    case "subtleBeaded":
      return `<pattern id="p-${id}" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="9" cy="12" r="1.2" fill="#d7c5b9"/><circle cx="26" cy="26" r="1" fill="#cdb7ab"/></pattern>`;
    case "ornateBeaded":
      return `<pattern id="p-${id}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#d7c5b9"/><circle cx="14" cy="6" r="1.5" fill="#c4aa9d"/><circle cx="9" cy="15" r="2.2" fill="#eadfd8"/></pattern>`;
    case "floral3D":
      return `<pattern id="p-${id}" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M17 8c4 2 6 5 3 9c4 1 5 5 2 8c-4 2-7 0-8-3c-3 3-8 2-9-2c0-4 3-6 6-6c-1-4 2-7 6-6Z" fill="#efe6e1"/></pattern>`;
    case "organzaChiffon":
      return `<linearGradient id="p-${id}" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#e8ded9" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>`;
    case "mikadoSatin":
      return `<linearGradient id="p-${id}" x1="0" x2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#ded5cf"/><stop offset=".6" stop-color="#fff"/></linearGradient>`;
    default:
      return "";
  }
}
export function dressSvgMarkup(
  dress: Dress,
  personDataUrl: string,
  faceDataUrl?: string,
  includeFace = true,
) {
  const id = esc(
    dress.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 18) || "dress",
  );
  const base = colorHex[dress.color];
  const shadow = "#d7cbc5";
  const pat = pattern(dress, id);
  const fill = pat ? `url(#p-${id})` : base;
  const ft: FaceTransform = dress.faceTransform ?? {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  };
  const face =
    includeFace && faceDataUrl
      ? `<g clip-path="url(#face-${id})"><image href="${esc(faceDataUrl)}" x="120" y="10" width="120" height="126" preserveAspectRatio="xMidYMid slice" transform="translate(${ft.x * 34} ${ft.y * 28}) rotate(${ft.rotation} 180 72) translate(${180 * (1 - ft.scale)} ${72 * (1 - ft.scale)}) scale(${ft.scale})"/></g>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" role="img" aria-label="${esc(dress.label)} 드레스 미리보기"><defs><clipPath id="face-${id}"><ellipse cx="180" cy="70" rx="43" ry="49"/></clipPath>${pat}</defs><rect width="360" height="640" fill="#fbf8f6"/><image href="${esc(personDataUrl)}" x="0" y="0" width="360" height="640" preserveAspectRatio="xMidYMid meet"/>${face}<path d="${necklinePath(dress.neckline)}" fill="${fill}" stroke="${shadow}" stroke-width="2"/>${upperExtras(dress.topStyle, base, shadow)}<path d="${skirtPath[dress.silhouette]}" fill="${fill}" stroke="${shadow}" stroke-width="2"/></svg>`;
}

export async function dressSvgToJpeg(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = true,
  width = 720,
  height = 1280,
): Promise<Uint8Array> {
  const personDataUrl = await loadDressPersonBase();
  const svg = dressSvgMarkup(
    dressForPresentation(dress),
    personDataUrl,
    faceDataUrl,
    includeFace,
  );
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("드레스 이미지를 만들 수 없어요."));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas를 사용할 수 없어요.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const jpg = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.9),
    );
    if (!jpg) throw new Error("JPEG 변환에 실패했어요.");
    return new Uint8Array(await jpg.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
