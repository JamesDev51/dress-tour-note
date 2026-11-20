import type { TopStyle } from "../../../types/domain";
import type { GarmentRecipe } from "./types";

type BackPart = readonly [name: string, path: string];

const lowBodice = "M138 115 Q180 119 222 115 L213 171 H147 Z";
const shoulderBodice =
  "M139 97 Q180 85 221 97 L221 119 L213 171 H147 L139 119 Z";

function upperParts(top: TopStyle): readonly BackPart[] {
  switch (top) {
    case "longSleeve":
      return [
        ["covered-bodice", shoulderBodice],
        [
          "long-sleeve",
          "M124 91 H236 L283 239 H249 L218 127 H142 L111 239 H77 Z",
        ],
      ];
    case "shortSleeve":
      return [
        ["covered-bodice", shoulderBodice],
        [
          "cap-sleeve",
          "M127 92 H233 L249 130 H216 L207 107 H153 L144 130 H111 Z",
        ],
      ];
    case "offShoulder":
      return [
        ["low-bodice", lowBodice],
        [
          "off-shoulder-band",
          "M123 114 Q180 122 237 114 L242 130 Q180 136 118 130 Z",
        ],
      ];
    case "oneShoulder":
      return [
        ["asymmetric-bodice", "M138 96 L222 116 L213 171 H147 Z"],
        ["one-shoulder", "M130 94 H148 V124 H123 Z"],
      ];
    case "strap":
      return [
        ["low-bodice", lowBodice],
        ["straps", "M139 93 H150 V123 H139 Z M210 93 H221 V123 H210 Z"],
      ];
    case "spaghetti":
      return [
        ["low-bodice", lowBodice],
        ["fine-straps", "M141 93 H145 V123 H141 Z M215 93 H219 V123 H215 Z"],
      ];
    case "wideStrap":
      return [
        ["low-bodice", lowBodice],
        ["wide-straps", "M137 93 H158 V123 H137 Z M202 93 H223 V123 H202 Z"],
      ];
    case "halter":
      return [
        ["halter-bodice", "M167 86 H193 L216 120 L213 171 H147 L144 120 Z"],
      ];
    case "strapless":
      return [["strapless-bodice", lowBodice]];
    case "unknown":
      return [["unrecorded-bodice", "M148 127 H212 L213 171 H147 Z"]];
  }
}

/** Rear coverage uses the recorded shoulder construction, never a front neckline. */
export function backTopSelection(recipe: GarmentRecipe, namespace: string) {
  if (recipe.view !== "back" || recipe.layers.length === 0) return undefined;
  const top = recipe.topStyle ?? "unknown";
  const id = `${namespace}-back-top`;
  const parts = upperParts(top)
    .map(
      ([name, d]) => `<path data-back-part="${name}" d="${d}" fill="white"/>`,
    )
    .join("");
  const defs = `<mask id="${id}" x="0" y="0" width="360" height="640" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" mask-type="luminance" style="mask-type:luminance" data-layer="back-top-selection" data-top-style="${top}" data-front-neckline="excluded"><rect width="360" height="640" fill="black"/><path data-back-part="lower" d="M0 170 H360 V640 H0 Z" fill="white"/>${parts}</mask>`;
  const boundary =
    top === "unknown"
      ? `<path data-layer="back-top-unrecorded" d="M148 127 H212" fill="none" stroke="#806b5a" stroke-width="1.4" stroke-dasharray="4 3"/>`
      : "";
  return { id, defs, boundary };
}
