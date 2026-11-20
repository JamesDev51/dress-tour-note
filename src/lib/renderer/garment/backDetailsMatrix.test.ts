import { describe, expect, it } from "vitest";
import {
  BACK_CLOSURES,
  BACK_STYLES,
  DRESS_DETAILS,
  FABRICS,
  SILHOUETTES,
  TOP_STYLES,
  WAISTLINES,
  type Dress,
  type DressDetail,
} from "../../../types/domain";
import { resolveGarmentRecipe } from "./core";
import { resolveBackClosure } from "../../dress/backDetails";

const base: Dress = {
  id: "back-details-matrix",
  tourId: "tour",
  shopId: "shop",
  order: 1,
  label: "조합 검수",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  waistline: "natural",
  backStyle: "openBack",
  fabric: "mikadoSatin",
  color: "ivory",
  train: "none",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
};

const backPart = {
  strapless: "strapless-bodice",
  offShoulder: "off-shoulder-band",
  strap: "straps",
  spaghetti: "fine-straps",
  wideStrap: "wide-straps",
  halter: "halter-bodice",
  oneShoulder: "one-shoulder",
  shortSleeve: "cap-sleeve",
  longSleeve: "long-sleeve",
} as const;

describe("back and detail selection matrix", () => {
  it("preserves all 4096 detail subsets with view-specific visibility", () => {
    const expectedByView: Record<
      "full" | "upper" | "back",
      readonly DressDetail[]
    > = {
      full: DRESS_DETAILS.filter((detail) => detail !== "backBow"),
      upper: DRESS_DETAILS.filter(
        (detail) => !["backBow", "slit", "overskirt"].includes(detail),
      ),
      back: ["backBow", "buttons", "detachableSleeve"],
    };
    const failures: string[] = [];

    for (let bits = 0; bits < 1 << DRESS_DETAILS.length; bits++) {
      const details = DRESS_DETAILS.filter((_, index) => bits & (1 << index));
      const record = { ...base, details };
      const snapshot = JSON.stringify(record);
      for (const view of ["full", "upper", "back"] as const) {
        const result = resolveGarmentRecipe(record, view);
        const visible = new Set(
          [
            ...result.markup.matchAll(
              /<(?:g|use)\b[^>]*\bdata-detail="([^"]+)"/g,
            ),
          ].map((match) => match[1]),
        );
        const expected = details.filter((detail) =>
          expectedByView[view].includes(detail),
        );
        if (
          visible.size !== expected.length ||
          expected.some((detail) => !visible.has(detail))
        ) {
          failures.push(`${bits}/${view}: ${[...visible].join(",")}`);
        }
        if (JSON.stringify(record) !== snapshot) {
          failures.push(`${bits}/${view}: input was changed`);
        }
      }
    }

    expect(failures).toEqual([]);
  }, 30_000);

  it("keeps all rear top, skirt, fabric and closure selections in the composition", () => {
    const failures: string[] = [];
    let cases = 0;
    for (const backStyle of BACK_STYLES.filter((value) => value !== "unknown"))
      for (const backClosure of [undefined, ...BACK_CLOSURES])
        for (const topStyle of TOP_STYLES.filter(
          (value) => value !== "unknown",
        ))
          for (const silhouette of SILHOUETTES.filter(
            (value) => value !== "unknown",
          ))
            for (const waistline of WAISTLINES.filter(
              (value) => value !== "unknown",
            ))
              for (const fabric of FABRICS.filter(
                (value) => value !== "unknown",
              )) {
                cases++;
                const record = {
                  ...base,
                  backStyle,
                  backClosure,
                  topStyle,
                  silhouette,
                  waistline,
                  fabric,
                };
                const result = resolveGarmentRecipe(record, "back");
                const lower = result.layers.find(
                  ({ region }) => region === "lower",
                );
                const closure = resolveBackClosure(record);
                const buttons =
                  result.markup.match(/data-layer="back-buttons"/g)?.length ??
                  0;
                const laces =
                  result.markup.match(/data-layer="back-corset-lacing"/g)
                    ?.length ?? 0;
                const opening =
                  backStyle === "openBack"
                    ? "open"
                    : backStyle === "vBack"
                      ? "v"
                      : backStyle === "illusionBack"
                        ? "illusion"
                        : backStyle === "corsetBack" &&
                            backClosure === undefined
                          ? "corset"
                          : undefined;
                const mismatch =
                  !result.markup.includes(`data-top-style="${topStyle}"`) ||
                  !result.markup.includes(
                    `data-back-part="${backPart[topStyle]}"`,
                  ) ||
                  lower?.asset.coverage.silhouette !== silhouette ||
                  buttons !== Number(closure === "buttons") ||
                  laces !== Number(closure === "laceUp") ||
                  (opening !== undefined &&
                    !result.markup.includes(
                      `data-opening-kind="${opening}"`,
                    )) ||
                  (opening === undefined &&
                    result.markup.includes("data-opening-kind=")) ||
                  (fabric !== "mikadoSatin" &&
                    !result.markup.includes(`data-material="${fabric}"`)) ||
                  result.markup.includes("data-neckline=") ||
                  /NaN|undefined/.test(result.markup);
                if (mismatch && failures.length < 20)
                  failures.push(
                    `${backStyle}/${backClosure}/${topStyle}/${silhouette}/${waistline}/${fabric}`,
                  );
              }

    expect(cases).toBe(60_480);
    expect(failures).toEqual([]);
  }, 60_000);
});
