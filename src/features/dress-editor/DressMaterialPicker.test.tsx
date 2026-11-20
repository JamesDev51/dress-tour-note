import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dress } from "../../types/domain";
import { DressMaterialPicker } from "./DressMaterialPicker";

const mixed = {
  fabric: "lace" as const,
  upperFabric: "lace" as const,
  lowerFabric: "organzaChiffon" as const,
};
const question = "아래 소재는 어디서 시작해요?";

describe("DressMaterialPicker material boundary", () => {
  it("shows legacy mixed fabric as waist and immediately displays the new start while saving", () => {
    const onPatch = vi.fn(async (_patch: Partial<Dress>) => undefined);
    const { rerender } = render(
      <DressMaterialPicker values={mixed} onPatch={onPatch} />,
    );
    const group = screen.getByRole("group", { name: question });
    expect(
      within(group).getByRole("button", { name: "허리부터" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(onPatch).not.toHaveBeenCalled();
    fireEvent.click(within(group).getByRole("button", { name: "무릎부터" }));
    expect(onPatch).toHaveBeenCalledWith({
      ...mixed,
      lowerFabricStart: "knee",
    });
    expect(
      within(group).getByRole("button", { name: "무릎부터" }),
    ).toHaveAttribute("aria-pressed", "true");
    rerender(
      <DressMaterialPicker
        values={{ ...mixed, lowerFabricStart: "knee" }}
        onPatch={onPatch}
      />,
    );
    expect(
      within(group).getByRole("button", { name: "무릎부터" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    { fabric: "lace" as const },
    { ...mixed, lowerFabric: "lace" as const },
    { ...mixed, upperFabric: "unknown" as const },
    { ...mixed, upperFabric: "tulle" as const },
  ])(
    "hides the boundary when fabrics are shared, equivalent or unknown: %j",
    (values) => {
      render(
        <DressMaterialPicker
          values={values}
          onPatch={vi.fn(async () => undefined)}
        />,
      );
      expect(
        screen.queryByRole("group", { name: question }),
      ).not.toBeInTheDocument();
    },
  );

  it.each([
    ["상체 소재", /^망사·쉬폰/, { upperFabric: "organzaChiffon" }],
    ["치마 소재", /^레이스/, { lowerFabric: "lace" }],
    ["치마 소재", "치마 소재 기억 안 남", { lowerFabric: "unknown" }],
  ] as const)(
    "clears an obsolete boundary atomically when changing %s",
    (region, name, patch) => {
      const onPatch = vi.fn(async (_patch: Partial<Dress>) => undefined);
      render(
        <DressMaterialPicker
          values={{ ...mixed, lowerFabricStart: "thigh" }}
          onPatch={onPatch}
        />,
      );
      fireEvent.click(
        within(screen.getByRole("group", { name: region })).getByRole(
          "button",
          { name },
        ),
      );
      expect(onPatch.mock.lastCall?.[0]).toStrictEqual({
        ...mixed,
        ...patch,
        lowerFabricStart: undefined,
      });
    },
  );

  it("preserves the boundary when changing to another distinct known material", () => {
    const onPatch = vi.fn(async (_patch: Partial<Dress>) => undefined);
    render(
      <DressMaterialPicker
        values={{ ...mixed, lowerFabricStart: "hip" }}
        onPatch={onPatch}
      />,
    );
    fireEvent.click(
      within(screen.getByRole("group", { name: "상체 소재" })).getByRole(
        "button",
        { name: /^실크/ },
      ),
    );
    expect(onPatch).toHaveBeenCalledWith({
      ...mixed,
      upperFabric: "mikadoSatin",
      lowerFabricStart: "hip",
    });
  });

  it("clears the boundary with shared material mode and common material choices", async () => {
    const onPatch = vi.fn(async (_patch: Partial<Dress>) => undefined);
    const { rerender } = render(
      <DressMaterialPicker
        values={{ ...mixed, lowerFabricStart: "knee" }}
        onPatch={onPatch}
      />,
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "상체와 치마 소재가 달라요" }),
    );
    const common: Partial<Dress> = {
      fabric: "lace",
      upperFabric: undefined,
      lowerFabric: undefined,
      lowerFabricStart: undefined,
    };
    expect(onPatch.mock.lastCall?.[0]).toStrictEqual(common);
    rerender(
      <DressMaterialPicker
        values={{ fabric: "lace", lowerFabricStart: "knee" }}
        onPatch={onPatch}
      />,
    );
    const satin = screen.getByRole("button", { name: /^실크/ });
    await waitFor(() => expect(satin).toBeEnabled());
    fireEvent.click(satin);
    expect(onPatch.mock.lastCall?.[0]).toStrictEqual({
      ...common,
      fabric: "mikadoSatin",
    });
    const separate = screen.getByRole("checkbox", {
      name: "상체와 치마 소재가 달라요",
    });
    await waitFor(() => expect(separate).toBeEnabled());
    fireEvent.click(separate);
    expect(onPatch.mock.lastCall?.[0]).toStrictEqual({
      fabric: "lace",
      upperFabric: "lace",
      lowerFabric: "lace",
      lowerFabricStart: undefined,
    });
  });
  it("composes consecutive choices while a previous regional write is pending", async () => {
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const onPatch = vi.fn((_patch: Partial<Dress>) => gate);
    render(
      <DressMaterialPicker
        values={{ ...mixed, lowerFabricStart: "knee" }}
        onPatch={onPatch}
      />,
    );
    const upper = screen.getByRole("group", { name: "상체 소재" });
    const lower = screen.getByRole("group", { name: "치마 소재" });
    fireEvent.click(
      within(upper).getByRole("button", { name: /^실크/ }),
    );
    const lowerSatin = within(lower).getByRole("button", {
      name: /^실크/,
    });
    expect(lowerSatin).toBeEnabled();
    expect(screen.getByRole("button", { name: "허리부터" })).toBeEnabled();
    expect(screen.getByRole("checkbox")).toBeEnabled();
    fireEvent.click(lowerSatin);
    expect(onPatch.mock.lastCall?.[0]).toStrictEqual({
      fabric: "lace",
      upperFabric: "mikadoSatin",
      lowerFabric: "mikadoSatin",
      lowerFabricStart: undefined,
    });
    expect(
      screen.queryByRole("group", { name: question }),
    ).not.toBeInTheDocument();
    await act(async () => finish());
    await waitFor(() => expect(lowerSatin).toBeEnabled());
    expect(screen.getByRole("button", { name: "무릎부터" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
