import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  necklineOptions,
  silhouetteOptions,
  topStyleOptions,
  trainOptions,
  waistlineOptions,
} from "../lib/dress/options";
import { OptionArtwork, type OptionArtworkCategory } from "./OptionArtwork";

type CatalogOption = { readonly id: string };

const catalogSources: ReadonlyArray<
  readonly [OptionArtworkCategory, readonly CatalogOption[], string]
> = [
  ["top", topStyleOptions, "top"],
  ["neckline", necklineOptions, "neckline"],
  ["silhouette", silhouetteOptions, "silhouette"],
  ["fabric", fabricOptions, "fabric"],
  ["color", colorOptions, "color"],
  ["waistline", waistlineOptions, "waistline"],
  ["backStyle", backStyleOptions, "back"],
  ["train", trainOptions, "train"],
  ["details", detailOptions, "detail"],
];

const cases: ReadonlyArray<readonly [OptionArtworkCategory, string, string]> =
  catalogSources.flatMap(([category, options, directory]) =>
    options
      .filter((option) => option.id !== "unknown")
      .map((option) => [category, option.id, directory] as const),
  );

describe("OptionArtwork", () => {
  it.each(cases)(
    "renders %s/%s from its individual image",
    (category, id, directory) => {
      render(<OptionArtwork category={category} id={id} data-testid="art" />);
      const artwork = screen.getByTestId("art");
      expect(artwork).toHaveAttribute("data-option-art", `${category}-${id}`);
      expect(artwork).toHaveAttribute(
        "data-option-art-kind",
        "generated-image",
      );
      const image = artwork.querySelector("img");
      expect(image).not.toBeNull();
      if (!image) throw new Error("expected option artwork image");
      expect(image).toHaveAttribute(
        "src",
        `/assets/options/${directory}/${id}.webp`,
      );
    },
  );

  it("covers all 61 known catalog choices with a current public asset URL", () => {
    expect(cases).toHaveLength(61);
    expect(cases.every(([, id, directory]) => id && directory)).toBe(true);
  });

  it("uses an explicit unknown state instead of pretending to remember a shape", () => {
    render(<OptionArtwork category="top" id="unknown" data-testid="unknown" />);
    const artwork = screen.getByTestId("unknown");
    expect(artwork).toHaveAttribute("data-option-art-kind", "unknown");
    expect(artwork).toHaveTextContent("?");
    expect(artwork.querySelector("img")).toBeNull();
  });

  it("keeps the card usable when an individual image fails", () => {
    render(<OptionArtwork category="top" id="strap" data-testid="art" />);
    const artwork = screen.getByTestId("art");
    const image = artwork.querySelector("img");
    expect(image).not.toBeNull();
    if (!image) throw new Error("expected option artwork image");
    fireEvent.error(image);
    expect(artwork).toHaveAttribute("data-option-art-kind", "image-error");
    expect(artwork).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes loading while a known image has not finished", () => {
    render(<OptionArtwork category="top" id="strap" data-testid="art" />);
    const artwork = screen.getByTestId("art");
    expect(artwork).toHaveAttribute("data-option-art-loading", "true");
    expect(
      artwork.querySelector("[data-option-art-loading-indicator]"),
    ).toBeInTheDocument();
    const image = artwork.querySelector("img");
    if (!image) throw new Error("expected option artwork image");
    fireEvent.load(image);
    expect(artwork).toHaveAttribute("data-option-art-loading", "false");
    expect(
      artwork.querySelector("[data-option-art-loading-indicator]"),
    ).toBeNull();
  });

  it("is decorative and hidden from assistive technology", () => {
    render(<OptionArtwork category="top" id="strapless" data-testid="art" />);
    expect(screen.getByTestId("art")).toHaveAttribute("aria-hidden", "true");
  });
});
