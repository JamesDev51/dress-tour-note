import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
];

afterEach(cleanup);

describe("OptionArtwork", () => {
  it.each(cases)("renders %s/%s from the generated image atlas", (category, id) => {
    render(<OptionArtwork category={category} id={id} data-testid="art" />);
    const artwork = screen.getByTestId("art");
    expect(artwork).toHaveAttribute("data-option-art", `${category}-${id}`);
    expect(artwork).toHaveAttribute("data-option-art-kind", "generated-image");
    expect(artwork.getAttribute("style")).toContain("option-atlas.webp");
    expect(artwork.getAttribute("style")).toContain("background-position");
  });

  it("uses an explicit unknown state instead of pretending to remember a shape", () => {
    render(<OptionArtwork category="top" id="unknown" data-testid="unknown" />);
    const artwork = screen.getByTestId("unknown");
    expect(artwork).toHaveAttribute("data-option-art-kind", "unknown");
    expect(artwork).toHaveTextContent("?");
    expect(artwork.getAttribute("style") ?? "").not.toContain("option-atlas.webp");
  });

  it("is decorative and hidden from assistive technology", () => {
    render(<OptionArtwork category="top" id="strapless" data-testid="art" />);
    expect(screen.getByTestId("art")).toHaveAttribute("aria-hidden", "true");
  });
});
