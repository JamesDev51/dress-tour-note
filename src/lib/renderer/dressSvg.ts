import type { Dress, FaceTransform } from "../../types/domain";
import { loadDressPersonBase } from "../image/dressPerson";
import { loadDressFabricTexture } from "../image/dressFabric";
import {
  colorHex,
  dressForPresentation,
  type PresentedDress,
  type PresentedNeckline,
  type PresentedSilhouette,
  type PresentedTopStyle,
} from "../dress/options";

const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const skirtPath: Record<PresentedSilhouette, string> = {
  unknown:
    "M145 252 C142 348 132 493 108 603 Q180 622 252 603 C228 493 218 348 215 252 Z",
  aLine:
    "M146 252 C132 345 91 492 56 608 Q180 632 304 608 C269 492 228 345 214 252 Z",
  ballGown:
    "M145 252 C114 290 57 402 24 604 Q180 638 336 604 C303 402 246 290 215 252 Z",
  empire:
    "M144 224 C115 286 74 438 46 608 Q180 632 314 608 C286 438 245 286 216 224 Z",
  mermaid:
    "M150 252 C146 276 132 294 128 326 C128 360 139 394 143 430 C145 454 149 476 151 488 C149 499 145 508 138 516 C116 533 82 571 55 606 C93 620 135 628 180 628 C225 628 267 620 305 606 C278 571 244 533 222 516 C215 508 211 499 209 488 C211 476 215 454 217 430 C221 394 232 360 232 326 C228 294 214 276 210 252 Z",
};
function necklinePath(type: PresentedNeckline) {
  switch (type) {
    case "sweetheart":
      return "M144 180 C158 163 173 168 180 184 C187 168 202 163 216 180 C216 218 214 242 210 258 L150 258 C146 242 144 218 144 180 Z";
    case "v":
      return "M144 174 L180 207 L216 174 C216 218 214 242 210 258 L150 258 C146 242 144 218 144 174 Z";
    case "square":
      return "M144 172 L161 172 L161 195 L199 195 L199 172 L216 172 C216 218 214 242 210 258 L150 258 C146 242 144 218 144 172 Z";
    case "scoop":
      return "M144 174 C156 210 204 210 216 174 C216 218 214 242 210 258 L150 258 C146 242 144 218 144 174 Z";
    case "asymmetric":
      return "M144 162 L216 190 C216 220 214 242 210 258 L150 258 C146 242 144 218 144 162 Z";
    case "unknown":
    case "straight":
      return "M144 178 L216 178 C216 218 214 242 210 258 L150 258 C146 242 144 218 144 178 Z";
  }
}
function upperExtras(top: PresentedTopStyle, base: string, shadow: string) {
  switch (top) {
    case "offShoulder":
      return `<path d="M145 174 C128 169 112 177 101 194 L109 212 C121 194 134 190 147 198 Z" fill="${base}" stroke="${shadow}" stroke-width="1.5"/><path d="M215 174 C232 169 248 177 259 194 L251 212 C239 194 226 190 213 198 Z" fill="${base}" stroke="${shadow}" stroke-width="1.5"/>`;
    case "strap":
      return `<path d="M154 183 L148 128 M206 183 L212 128" stroke="${base}" stroke-width="10" stroke-linecap="round"/>`;
    case "halter":
      return `<path d="M154 178 L180 135 L206 178 L214 258 L146 258 Z" fill="${base}" stroke="${shadow}" stroke-width="2"/>`;
    case "shortSleeve":
      return `<path d="M145 173 Q123 167 110 193 L120 220 Q134 201 146 201 Z" fill="${base}"/><path d="M215 173 Q237 167 250 193 L240 220 Q226 201 214 201 Z" fill="${base}"/>`;
    case "longSleeve":
      return `<path d="M151 170 Q124 164 109 190 C97 221 93 258 87 292 L70 349 Q78 363 94 356 L106 326 L119 260 C124 230 132 210 144 202 Z" fill="#fff" stroke="${shadow}" stroke-width="2"/><path d="M209 170 Q236 164 251 190 C263 221 267 258 273 292 L290 349 Q282 363 266 356 L254 326 L241 260 C236 230 228 210 216 202 Z" fill="#fff" stroke="${shadow}" stroke-width="2"/><path d="M72 343 Q81 357 93 350 M288 343 Q279 357 267 350" fill="none" stroke="${shadow}" stroke-width="2"/><path d="M116 193 C105 236 99 286 84 337 M244 193 C255 236 261 286 276 337" fill="none" stroke="${base}" stroke-opacity=".52" stroke-width="3"/>`;
    case "strapless":
    case "unknown":
      return "";
  }
}
function pattern(
  dress: PresentedDress,
  id: string,
  fabricTextureDataUrl?: string,
) {
  if (fabricTextureDataUrl)
    return `<pattern id="p-${id}" width="108" height="108" patternUnits="userSpaceOnUse"><image href="${esc(fabricTextureDataUrl)}" x="0" y="0" width="108" height="108" preserveAspectRatio="xMidYMid slice"/></pattern>`;
  switch (dress.fabric) {
    case "lace":
      return `<pattern id="p-${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="4" fill="none" stroke="#d7cdc8" stroke-width="1"/><path d="M12 12q6-8 12 0q-6 8-12 0" fill="none" stroke="#d7cdc8"/></pattern>`;
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
    case "unknown":
      return "";
  }
}

const colorEdge = {
  unknown: "#ddd6d2",
  pureWhite: "#d9d3cf",
  ivory: "#dfd3c4",
  champagne: "#cdb99e",
} satisfies Record<PresentedDress["color"], string>;

function upperTexture(top: PresentedTopStyle, fill: string) {
  switch (top) {
    case "offShoulder":
      return `<path d="M145 174 C128 169 112 177 101 194 L109 212 C121 194 134 190 147 198 Z" fill="${fill}"/><path d="M215 174 C232 169 248 177 259 194 L251 212 C239 194 226 190 213 198 Z" fill="${fill}"/>`;
    case "strap":
      return `<path d="M154 183 L148 128 M206 183 L212 128" stroke="${fill}" stroke-width="7" stroke-linecap="round"/>`;
    case "halter":
      return `<path d="M154 178 L180 135 L206 178 L214 258 L146 258 Z" fill="${fill}"/>`;
    case "shortSleeve":
      return `<path d="M145 173 Q123 167 110 193 L120 220 Q134 201 146 201 Z" fill="${fill}"/><path d="M215 173 Q237 167 250 193 L240 220 Q226 201 214 201 Z" fill="${fill}"/>`;
    case "longSleeve":
      return `<path d="M151 170 Q124 164 109 190 C97 221 93 258 87 292 L70 349 Q78 363 94 356 L106 326 L119 260 C124 230 132 210 144 202 Z" fill="${fill}"/><path d="M209 170 Q236 164 251 190 C263 221 267 258 273 292 L290 349 Q282 363 266 356 L254 326 L241 260 C236 230 228 210 216 202 Z" fill="${fill}"/>`;
    case "strapless":
    case "unknown":
      return "";
  }
}

function fabricAccent(dress: PresentedDress, id: string) {
  if (dress.fabric === "subtleBeaded")
    return `<pattern id="b-${id}" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="12" cy="14" r="1.25" fill="#fff"/><circle cx="34" cy="30" r=".9" fill="#c4aa9d"/></pattern>`;
  if (dress.fabric === "ornateBeaded")
    return `<pattern id="b-${id}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.8" fill="#fff"/><circle cx="16" cy="12" r="1.4" fill="#c4aa9d"/><circle cx="9" cy="19" r="1" fill="#fff"/></pattern>`;
  return "";
}

function skirtShaping(dress: PresentedDress, id: string, edge: string) {
  if (dress.silhouette === "mermaid")
    return `<g data-layer="hip-shaping"><ellipse cx="145" cy="326" rx="27" ry="44" fill="url(#v-${id})" opacity=".32"/><ellipse cx="215" cy="326" rx="27" ry="44" fill="url(#v-${id})" opacity=".32"/><g fill="none" stroke="${edge}" stroke-linecap="round"><path d="M151 276 C136 302 132 332 136 365 C139 392 144 420 146 446" stroke-opacity=".5" stroke-width="1.5"/><path d="M209 276 C224 302 228 332 224 365 C221 392 216 420 214 446" stroke-opacity=".5" stroke-width="1.5"/><path d="M180 270 C173 344 170 420 171 486 M180 270 C187 344 190 420 189 486" stroke="#fff" stroke-opacity=".4" stroke-width="1.7"/><path d="M151 488 C145 510 122 530 102 551 C82 571 66 590 57 605 M209 488 C215 510 238 530 258 551 C278 571 294 590 303 605" stroke-opacity=".34"/></g></g>`;
  return `<path d="M180 260 C166 366 159 491 151 608 M180 260 C194 366 201 491 209 608" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/><path d="M150 272 C137 382 117 504 98 604 M210 272 C223 382 243 504 262 604" fill="none" stroke="${edge}" stroke-opacity=".42" stroke-width="1.5"/>`;
}

function dressLayers(
  dress: PresentedDress,
  id: string,
  fabricTextureDataUrl?: string,
) {
  const base = colorHex[dress.color];
  const edge = colorEdge[dress.color];
  const bodice = necklinePath(dress.neckline);
  const skirt = skirtPath[dress.silhouette];
  const texture = pattern(dress, id, fabricTextureDataUrl);
  const textureFill = texture ? `url(#p-${id})` : "none";
  const accent = fabricAccent(dress, id);
  const accentFill = accent ? `url(#b-${id})` : "none";
  const accentOpacity = dress.fabric === "subtleBeaded" ? ".52" : ".88";
  const garmentFill = `url(#g-${id})`;
  const shaping = skirtShaping(dress, id, edge);
  return {
    defs: `${texture}${accent}<linearGradient id="g-${id}" x1="0" x2="1"><stop stop-color="${edge}"/><stop offset=".18" stop-color="${base}"/><stop offset=".52" stop-color="#fff"/><stop offset=".82" stop-color="${base}"/><stop offset="1" stop-color="${edge}"/></linearGradient><radialGradient id="v-${id}"><stop stop-color="#fff" stop-opacity=".72"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="s-${id}" x="-30%" y="-20%" width="160%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#7b6256" flood-opacity=".18"/></filter>`,
    markup: `<g data-layer="dress-fit" transform="translate(0 -18)"><g filter="url(#s-${id})"><path d="${bodice}" fill="${garmentFill}" stroke="${edge}" stroke-width="1.5"/>${upperExtras(dress.topStyle, garmentFill, edge)}<path data-silhouette="${dress.silhouette}"${dress.silhouette === "mermaid" ? ' data-flare="fishtail"' : ""} d="${skirt}" fill="${garmentFill}" stroke="${edge}" stroke-width="1.5"/><g data-layer="fabric-texture"><path d="${bodice}" fill="${textureFill}" opacity=".44"/><path d="${skirt}" fill="${textureFill}" opacity=".62"/><g opacity=".54">${upperTexture(dress.topStyle, textureFill)}</g></g>${accent ? `<g data-layer="fabric-accent" opacity="${accentOpacity}"><path d="${bodice}" fill="${accentFill}"/><path d="${skirt}" fill="${accentFill}"/>${upperTexture(dress.topStyle, accentFill)}</g>` : ""}<g data-layer="bust-shaping"><ellipse cx="163" cy="202" rx="20" ry="17" fill="url(#v-${id})" opacity=".82"/><ellipse cx="197" cy="202" rx="20" ry="17" fill="url(#v-${id})" opacity=".82"/><g fill="none" stroke="${edge}" stroke-linecap="round"><path d="M146 207 C155 187 170 184 180 204 C190 184 205 187 214 207" stroke-opacity=".72" stroke-width="2.2"/><path d="M158 250 Q157 218 166 196 M202 250 Q203 218 194 196" stroke-opacity=".5" stroke-width="1.5"/></g></g><path d="M150 252 Q180 264 210 252" fill="none" stroke="${edge}" stroke-width="2"/>${shaping}</g></g>`,
  };
}

export function dressSvgMarkup(
  dress: Dress,
  personDataUrl: string,
  faceDataUrl?: string,
  includeFace = true,
  fabricTextureDataUrl?: string,
) {
  const presented = dressForPresentation(dress);
  const id = esc(
    presented.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 18) || "dress",
  );
  const layers = dressLayers(presented, id, fabricTextureDataUrl);
  const ft: FaceTransform = presented.faceTransform ?? {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  };
  const face =
    includeFace && faceDataUrl
      ? `<g mask="url(#face-mask-${id})"><image href="${esc(faceDataUrl)}" x="120" y="10" width="120" height="126" preserveAspectRatio="xMidYMid slice" transform="translate(${ft.x * 34} ${ft.y * 28}) rotate(${ft.rotation} 180 72) translate(${180 * (1 - ft.scale)} ${72 * (1 - ft.scale)}) scale(${ft.scale})"/></g>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" role="img" aria-label="${esc(presented.label)} 드레스 패션 일러스트"><defs><radialGradient id="face-fade-${id}"><stop offset=".76" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="face-mask-${id}"><ellipse cx="180" cy="72" rx="49" ry="55" fill="url(#face-fade-${id})"/></mask>${layers.defs}</defs><rect width="360" height="640" fill="#fbf8f6"/><ellipse cx="180" cy="622" rx="118" ry="12" fill="#d8cbc5" opacity=".24"/><image data-layer="raster-mannequin" href="${esc(personDataUrl)}" x="0" y="0" width="360" height="640" preserveAspectRatio="xMidYMid meet"/><path data-layer="hip-mask" d="M126 232 C118 284 116 366 122 438 L238 438 C244 366 242 284 234 232 Z" fill="#fbf8f6"/>${face}${layers.markup}</svg>`;
}

export async function dressSvgToJpeg(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = true,
  width = 720,
  height = 1280,
): Promise<Uint8Array> {
  const personDataUrl = await loadDressPersonBase();
  const fabricTextureDataUrl = await loadDressFabricTexture(dress.fabric).catch(
    () => undefined,
  );
  const svg = dressSvgMarkup(
    dress,
    personDataUrl,
    faceDataUrl,
    includeFace,
    fabricTextureDataUrl,
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
