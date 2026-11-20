import type { Dress, DressLookSnapshot } from "../../types/domain";

export const BASE_STYLING_ID = "base";
export const MAX_STYLING_VARIANTS = 8;
export const LOOK_FIELDS = [
  "topStyle",
  "neckline",
  "silhouette",
  "waistline",
  "backStyle",
  "backClosure",
  "fabric",
  "upperFabric",
  "lowerFabric",
  "lowerFabricStart",
  "sketchStrokes",
  "color",
  "train",
  "details",
  "customOptions",
  "memoryCue",
  "likedReason",
  "concern",
  "memo",
  "quickTags",
] as const satisfies readonly (keyof DressLookSnapshot)[];

/** Explicit projection keeps absent optional fields from inheriting another look. */
export function snapshotDressLook(dress: DressLookSnapshot): DressLookSnapshot {
  return {
    topStyle: dress.topStyle,
    neckline: dress.neckline,
    silhouette: dress.silhouette,
    waistline: dress.waistline,
    backStyle: dress.backStyle,
    backClosure: dress.backClosure,
    fabric: dress.fabric,
    upperFabric: dress.upperFabric,
    lowerFabric: dress.lowerFabric,
    lowerFabricStart: dress.lowerFabricStart,
    sketchStrokes: dress.sketchStrokes,
    color: dress.color,
    train: dress.train,
    details: [...dress.details],
    customOptions: dress.customOptions ? { ...dress.customOptions } : undefined,
    memoryCue: dress.memoryCue,
    likedReason: dress.likedReason,
    concern: dress.concern,
    memo: dress.memo ?? "",
    quickTags: [...(dress.quickTags ?? [])],
  };
}

export function getDressLooks(dress: Dress): { id: string; label: string }[] {
  return [
    { id: BASE_STYLING_ID, label: "기본 연출" },
    ...(dress.stylingVariants ?? []).map(({ id, label }) => ({ id, label })),
  ];
}

export function isDressLook(dress: Dress, stylingId: string): boolean {
  return (
    stylingId === BASE_STYLING_ID ||
    Boolean(dress.stylingVariants?.some(({ id }) => id === stylingId))
  );
}

export function getPreferredStylingId(dress: Dress): string {
  return dress.preferredStylingId &&
    isDressLook(dress, dress.preferredStylingId)
    ? dress.preferredStylingId
    : BASE_STYLING_ID;
}

export function resolveDressLook(
  dress: Dress,
  stylingId = BASE_STYLING_ID,
): Dress {
  if (stylingId === BASE_STYLING_ID) return dress;
  const styling = dress.stylingVariants?.find(({ id }) => id === stylingId);
  if (!styling) throw new Error("연출을 찾을 수 없습니다.");
  return { ...dress, ...snapshotDressLook(styling.snapshot) };
}

export function cloneDressStyling(
  dress: Dress,
): Pick<Dress, "stylingVariants" | "preferredStylingId"> {
  const ids = new Map(
    (dress.stylingVariants ?? []).map(({ id }) => [id, crypto.randomUUID()]),
  );
  return {
    stylingVariants: dress.stylingVariants?.map((styling) => ({
      ...styling,
      id: ids.get(styling.id)!,
      snapshot: snapshotDressLook(styling.snapshot),
    })),
    preferredStylingId: dress.preferredStylingId
      ? ids.get(dress.preferredStylingId)
      : undefined,
  };
}
