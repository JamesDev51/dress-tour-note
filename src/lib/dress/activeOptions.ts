import type {
  Dress,
  Fabric,
  LowerFabricStart,
  QuickTag,
  Silhouette,
} from "../../types/domain";
import {
  detailOptions,
  fabricOptions,
  optionLabel,
  quickTagOptions,
  silhouetteOptions,
} from "./options";

type MaterialSelection = Pick<Dress, "fabric"> & {
  upperFabric?: Fabric;
  lowerFabric?: Fabric;
  lowerFabricStart?: LowerFabricStart;
};

export const fabricStartLabels: Record<LowerFabricStart, string> = {
  waist: "허리부터",
  hip: "골반부터",
  thigh: "허벅지부터",
  knee: "무릎부터",
};

export function materialRegionLabels(value: MaterialSelection) {
  const { lowerFabricStart } = value;
  const upper = normalizeActiveFabric(upperFabricFor(value));
  const lower = normalizeActiveFabric(lowerFabricFor(value));
  return lowerFabricStart &&
    lowerFabricStart !== "waist" &&
    upper !== lower &&
    upper !== "unknown" &&
    lower !== "unknown"
    ? { upper: "위쪽", lower: fabricStartLabels[lowerFabricStart] }
    : { upper: "상체", lower: "치마" };
}

export const DISPLAY_DRESS_COLOR = "pureWhite";

const comfortTags = new Set<QuickTag>([
  "가벼움",
  "편함",
  "조임",
  "흘러내림",
  "무거움",
  "불편함",
  "까슬거림",
]);
const retiredDetails = new Set(["backBow", "detachableSleeve"]);

export function normalizeActiveSilhouette(value: Silhouette): Silhouette {
  if (value === "teaLength") return "aLine";
  if (value === "fitAndFlare") return "mermaid";
  return value;
}

export const activeSilhouetteOptions = silhouetteOptions.filter(
  ({ id }) => normalizeActiveSilhouette(id) === id,
);
export const activeFabricOptions = fabricOptions
  .filter(({ id }) => id !== "tulle")
  .map((option) =>
    option.id === "organzaChiffon"
      ? {
          ...option,
          label: "망사·쉬폰",
          description: "얇고 부드럽게 겹쳐지는 원단이에요.",
          aliases: ["망사", "튤", "쉬폰", "오간자"],
        }
      : option,
  );
export const activeDetailOptions = detailOptions.filter(
  ({ id }) => !retiredDetails.has(id),
);
export const activeQuickTagOptions = quickTagOptions.filter(
  ({ id }) => !comfortTags.has(id),
);

export function normalizeActiveFabric(fabric: Fabric): Fabric {
  return fabric === "tulle" ? "organzaChiffon" : fabric;
}

export function upperFabricFor(dress: MaterialSelection): Fabric {
  return dress.upperFabric ?? dress.fabric;
}

export function lowerFabricFor(dress: MaterialSelection): Fabric {
  return dress.lowerFabric ?? dress.fabric;
}

export function materialLabel(value: Fabric | MaterialSelection): string {
  if (typeof value === "string")
    return optionLabel(activeFabricOptions, normalizeActiveFabric(value));
  const upper = normalizeActiveFabric(upperFabricFor(value));
  const lower = normalizeActiveFabric(lowerFabricFor(value));
  if (upper === lower) return materialLabel(upper);
  const parts = materialRegionLabels(value);
  return `${parts.upper} ${materialLabel(upper)} · ${parts.lower} ${materialLabel(lower)}`;
}

/** Keep retired record fields readable while active surfaces show the current product. */
export function activeAppearance(dress: Dress & MaterialSelection): Dress {
  const {
    faceTransform: _faceTransform,
    backClosure: _backClosure,
    ...record
  } = dress;
  return {
    ...record,
    silhouette: normalizeActiveSilhouette(dress.silhouette),
    fabric: normalizeActiveFabric(dress.fabric),
    ...(dress.upperFabric !== undefined
      ? { upperFabric: normalizeActiveFabric(upperFabricFor(dress)) }
      : {}),
    ...(dress.lowerFabric !== undefined
      ? { lowerFabric: normalizeActiveFabric(lowerFabricFor(dress)) }
      : {}),
    color: DISPLAY_DRESS_COLOR,
    train: "none",
    backStyle: "unknown",
    details: dress.details.filter((detail) => !retiredDetails.has(detail)),
    quickTags: dress.quickTags.filter((tag) => !comfortTags.has(tag)),
    customOptions: Object.fromEntries(
      Object.entries(dress.customOptions ?? {}).filter(
        ([category]) => !["color", "train", "backStyle"].includes(category),
      ),
    ),
  };
}
