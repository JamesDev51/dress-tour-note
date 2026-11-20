import { describe, expect, it } from "vitest";
import { changeBackOpeningPatch, resolveBackClosure } from "./backDetails";

describe("independent rear details", () => {
  it("interprets old closures only when no new value was recorded", () => {
    expect(resolveBackClosure({ backStyle: "buttonBack" })).toBe("buttons");
    expect(resolveBackClosure({ backStyle: "corsetBack" })).toBe("laceUp");
    expect(
      resolveBackClosure({ backStyle: "buttonBack", backClosure: "unknown" }),
    ).toBe("unknown");
    expect(
      resolveBackClosure({ backStyle: "corsetBack", backClosure: "none" }),
    ).toBe("none");
  });
  it("retains legacy closures and bows when changing only the opening", () => {
    expect(
      changeBackOpeningPatch({ backStyle: "buttonBack", details: [] }, "vBack"),
    ).toEqual({ backStyle: "vBack", backClosure: "buttons", details: [] });
    expect(
      changeBackOpeningPatch(
        { backStyle: "bowBack", details: ["floral"] },
        "openBack",
      ),
    ).toEqual({
      backStyle: "openBack",
      details: ["floral", "backBow"],
    });
    expect(() =>
      changeBackOpeningPatch(
        {
          backStyle: "bowBack",
          details: ["floral", "pearl", "corset", "draping"],
        },
        "vBack",
      ),
    ).toThrow("최대 4개");
  });
});
