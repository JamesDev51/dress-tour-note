import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OptionArtwork, type OptionArtworkCategory } from "./OptionArtwork";

const cases: Array<[OptionArtworkCategory, string]> = [
  ["top", "strapless"],
  ["top", "offShoulder"],
  ["top", "strap"],
  ["top", "halter"],
  ["top", "shortSleeve"],
  ["top", "longSleeve"],
  ["neckline", "straight"],
  ["neckline", "sweetheart"],
  ["neckline", "v"],
  ["neckline", "square"],
  ["neckline", "scoop"],
  ["neckline", "asymmetric"],
  ["silhouette", "aLine"],
  ["silhouette", "ballGown"],
  ["silhouette", "mermaid"],
  ["silhouette", "empire"],
  ["fabric", "mikadoSatin"],
  ["fabric", "lace"],
  ["fabric", "organzaChiffon"],
  ["fabric", "subtleBeaded"],
  ["fabric", "ornateBeaded"],
  ["fabric", "floral3D"],
  ["color", "pureWhite"],
  ["color", "ivory"],
  ["color", "champagne"],
];

describe("OptionArtwork", () => {
  it.each(cases)("renders %s/%s from its individual image", (category, id) => {
    render(<OptionArtwork category={category} id={id} data-testid="art" />);
    const artwork = screen.getByTestId("art");
    expect(artwork).toHaveAttribute("data-option-art", `${category}-${id}`);
    expect(artwork).toHaveAttribute("data-option-art-kind", "generated-image");
    const image = artwork.querySelector("img");
    expect(image).not.toBeNull();
    if (!image) throw new Error("expected option artwork image");
    expect(image).toHaveAttribute(
      "src",
      `/assets/options/${category}/${id}.webp`,
    );
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

  it("is decorative and hidden from assistive technology", () => {
    render(<OptionArtwork category="top" id="strapless" data-testid="art" />);
    expect(screen.getByTestId("art")).toHaveAttribute("aria-hidden", "true");
  });
});
