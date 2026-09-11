export const CATALOG = Object.freeze({
  top: [
    "strapless",
    "offShoulder",
    "strap",
    "spaghetti",
    "wideStrap",
    "halter",
    "oneShoulder",
    "shortSleeve",
    "longSleeve",
  ],
  neckline: [
    "straight",
    "sweetheart",
    "v",
    "square",
    "scoop",
    "high",
    "illusion",
    "asymmetric",
  ],
  silhouette: [
    "aLine",
    "ballGown",
    "empire",
    "fitAndFlare",
    "mermaid",
    "sheath",
    "teaLength",
  ],
  fabric: [
    "mikadoSatin",
    "lace",
    "subtleBeaded",
    "ornateBeaded",
    "tulle",
    "organzaChiffon",
    "glitterBeaded",
    "floral3D",
  ],
  color: ["pureWhite", "ivory", "champagne"],
  waistline: ["natural", "basque", "drop", "empire"],
  back: [
    "openBack",
    "vBack",
    "buttonBack",
    "corsetBack",
    "illusionBack",
    "bowBack",
  ],
  train: ["none", "sweep", "chapel", "cathedral"],
  detail: [
    "corset",
    "draping",
    "waistBow",
    "backBow",
    "pearl",
    "sequin",
    "floral",
    "slit",
    "sheer",
    "detachableSleeve",
    "overskirt",
    "buttons",
  ],
});

export const EXPECTED_PATHS = Object.freeze(
  Object.entries(CATALOG).flatMap(([category, values]) =>
    values.map((value) => `${category}/${value}.webp`),
  ),
);

export function readWebpMetadata(bytes) {
  if (
    bytes.length < 30 ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.toString("ascii", 8, 12) !== "WEBP"
  )
    return null;
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X")
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
      hasAlpha: (bytes[20] & 0x10) !== 0,
    };
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff),
      hasAlpha: ((bits >> 28) & 1) === 1,
    };
  }
  if (chunk === "VP8 " && bytes.toString("hex", 23, 26) === "9d012a")
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
      hasAlpha: false,
    };
  return null;
}
