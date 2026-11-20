import type { BackClosure, BackStyle, Dress } from "../../types/domain";

type BackRecord = Pick<Dress, "backStyle" | "backClosure">;

/** Explicit unknown/none choices override the closure encoded in legacy records. */
export function resolveBackClosure(dress: BackRecord): BackClosure {
  if (dress.backClosure !== undefined) return dress.backClosure;
  if (dress.backStyle === "buttonBack") return "buttons";
  if (dress.backStyle === "corsetBack") return "laceUp";
  return "unknown";
}

/** Retain legacy rear details when a user independently changes the opening. */
export function changeBackOpeningPatch(
  dress: BackRecord & Pick<Dress, "details">,
  backStyle: BackStyle,
): Partial<Dress> {
  const details = [...dress.details];
  if (dress.backStyle === "bowBack" && !details.includes("backBow")) {
    if (details.length >= 4)
      throw new Error(
        "뒤 리본을 유지하려면 장식과 세부 특징에서 하나를 해제해 주세요. 최대 4개까지 기록할 수 있어요.",
      );
    details.push("backBow");
  }
  const preserveClosure =
    dress.backClosure !== undefined ||
    dress.backStyle === "buttonBack" ||
    dress.backStyle === "corsetBack";
  return {
    backStyle,
    ...(preserveClosure ? { backClosure: resolveBackClosure(dress) } : {}),
    details,
  };
}
