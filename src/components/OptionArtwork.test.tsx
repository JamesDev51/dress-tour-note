import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OptionArtwork, type OptionArtworkCategory } from "./OptionArtwork";

const cases: Array<[OptionArtworkCategory, string]> = [
  ["top", "offShoulder"],
  ["neckline", "sweetheart"],
  ["silhouette", "aLine"],
  ["fabric", "lace"],
  ["color", "ivory"],
  ["train", "chapel"],
  ["waistline", "basque"],
  ["back", "buttonBack"],
  ["detail", "overskirt"],
  ["top", "unknown"],
];

describe("OptionArtwork", () => {
  it.each(cases)(
    "renders %s/%s through the generated sprite",
    (category, id) => {
      const { container } = render(
        <OptionArtwork category={category} id={id} />,
      );
      const artwork = container.querySelector(
        `[data-option-art="${category}-${id}"]`,
      );
      expect(artwork).toBeInTheDocument();
      const use = artwork?.querySelector("use");
      expect(use?.getAttribute("href")).toBe(
        id === "unknown"
          ? "/assets/options.svg#common-unknown"
          : `/assets/options.svg#${category}-${id}`,
      );
    },
  );

  it("is decorative and hidden from assistive technology", () => {
    render(<OptionArtwork category="top" id="strapless" data-testid="art" />);
    expect(screen.getByTestId("art")).toHaveAttribute("aria-hidden", "true");
  });
});
