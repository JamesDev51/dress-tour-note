import type {
  BackStyle,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
  Train,
  Waistline,
} from "../../types/domain";

type KnownSilhouette = Exclude<Silhouette, "unknown">;
type KnownTopStyle = Exclude<TopStyle, "unknown">;
type KnownNeckline = Exclude<Neckline, "unknown">;
type KnownBackStyle = Exclude<BackStyle, "unknown">;

export type SilhouetteMetric = {
  readonly hemY: number;
  readonly hemLeft: number;
  readonly hemRight: number;
};

const fullPath = (
  waist: number,
  hemY: number,
  hemRight: number,
  leftSkirt: string,
  rightSkirt: string,
) =>
  `M102 190 C98 207 99 ${waist - 42} 108 ${waist - 26} C111 ${waist - 17} 113 ${waist - 7} 116 ${waist} ${leftSkirt} Q135 ${hemY + 22} ${hemRight} ${hemY} ${rightSkirt} C157 ${waist - 7} 159 ${waist - 17} 162 ${waist - 26} C171 ${waist - 42} 172 207 168 190 Z`;

export const silhouetteMetrics: Readonly<
  Record<KnownSilhouette, SilhouetteMetric>
> = {
  aLine: { hemY: 558, hemLeft: 54, hemRight: 216 },
  ballGown: { hemY: 558, hemLeft: 26, hemRight: 244 },
  empire: { hemY: 558, hemLeft: 48, hemRight: 222 },
  fitAndFlare: { hemY: 558, hemLeft: 52, hemRight: 218 },
  mermaid: { hemY: 558, hemLeft: 42, hemRight: 228 },
  sheath: { hemY: 558, hemLeft: 92, hemRight: 178 },
  teaLength: { hemY: 462, hemLeft: 66, hemRight: 204 },
};

export const silhouettePaths: Readonly<
  Record<KnownSilhouette, (waist: number) => string>
> = {
  aLine: (waist) =>
    fullPath(
      waist,
      558,
      216,
      `C108 ${waist + 54} 77 508 54 558`,
      `C193 508 160 ${waist + 54} 154 ${waist}`,
    ),
  ballGown: (waist) =>
    fullPath(
      waist,
      558,
      244,
      `C103 ${waist + 36} 49 430 26 558`,
      `C221 430 167 ${waist + 36} 154 ${waist}`,
    ),
  empire: (waist) =>
    fullPath(
      waist,
      558,
      222,
      `C105 ${waist + 54} 72 482 48 558`,
      `C198 482 168 ${waist + 54} 154 ${waist}`,
    ),
  fitAndFlare: (waist) =>
    fullPath(
      waist,
      558,
      218,
      `C113 ${waist + 64} 108 420 89 488 C78 516 62 542 52 558`,
      `C208 542 192 516 181 488 C162 420 157 ${waist + 64} 154 ${waist}`,
    ),
  mermaid: (waist) =>
    fullPath(
      waist,
      558,
      228,
      `C113 ${waist + 70} 107 414 102 464 C91 499 60 540 42 558`,
      `C210 540 179 499 168 464 C163 414 157 ${waist + 70} 154 ${waist}`,
    ),
  sheath: (waist) =>
    fullPath(
      waist,
      558,
      178,
      `C113 ${waist + 70} 103 476 92 558`,
      `C167 476 157 ${waist + 70} 154 ${waist}`,
    ),
  teaLength: (waist) =>
    fullPath(
      waist,
      462,
      204,
      `C110 ${waist + 46} 80 432 66 462`,
      `C190 432 160 ${waist + 46} 154 ${waist}`,
    ),
};

export const neutralSilhouettePath = (waist: number) =>
  fullPath(
    waist,
    558,
    206,
    `C108 ${waist + 54} 82 500 64 558`,
    `C188 500 160 ${waist + 54} 154 ${waist}`,
  );

export const upperBodicePath = (waist: number) =>
  `M102 190 C98 207 99 ${waist - 42} 108 ${waist - 26} C111 ${waist - 17} 113 ${waist - 7} 116 ${waist} Q135 ${waist + 8} 154 ${waist} C157 ${waist - 7} 159 ${waist - 17} 162 ${waist - 26} C171 ${waist - 42} 172 207 168 190 Z`;

export const necklinePaths: Readonly<Record<KnownNeckline, string>> = {
  straight: "M108 194 L162 194",
  sweetheart: "M108 193 Q121 183 135 196 Q149 183 162 193",
  v: "M108 190 L135 214 L162 190",
  square: "M110 182 L110 201 L160 201 L160 182",
  scoop: "M109 184 Q135 218 161 184",
  high: "M116 177 Q135 188 154 177",
  illusion: "M109 191 Q135 216 161 191 M116 177 Q135 187 154 177",
  asymmetric: "M108 199 L162 182",
};

export const topPaths: Readonly<Record<KnownTopStyle, string>> = {
  strapless: "M102 190 Q135 181 168 190",
  offShoulder:
    "M99 202 C92 198 87 203 83 212 C88 220 96 221 104 216 Z M166 216 C174 221 182 220 187 212 C183 203 178 198 171 202 Z",
  strap: "M102 198 L109 177 M168 198 L161 177",
  spaghetti: "M104 198 L111 176 M166 198 L159 176",
  wideStrap: "M101 199 L106 176 L118 184 M169 199 L164 176 L152 184",
  halter: "M102 199 L119 177 M168 199 L151 177 M119 177 Q135 187 151 177",
  oneShoulder: "M101 200 C119 194 140 188 161 180 L168 199",
  shortSleeve:
    "M102 198 C95 196 88 201 84 211 C89 220 96 222 104 218 Z M168 198 C175 196 182 201 186 211 C181 220 174 222 166 218 Z",
  longSleeve:
    "M102 197 C94 201 88 213 88 240 L96 259 L105 250 L108 214 Z M168 197 C176 201 182 213 182 240 L174 259 L165 250 L162 214 Z",
};

export const backPaths: Readonly<Record<KnownBackStyle, string>> = {
  openBack: "M107 190 Q135 244 163 190",
  vBack: "M107 190 L135 244 L163 190",
  buttonBack: "M135 188 L135 262",
  corsetBack:
    "M116 202 L154 252 M154 202 L116 252 M116 225 L154 233 M154 225 L116 233",
  illusionBack: "M107 190 Q135 232 163 190 M116 200 L154 254",
  bowBack:
    "M135 233 C123 218 107 216 107 231 C107 242 120 245 135 236 C150 245 163 242 163 231 C163 216 147 218 135 233 Z",
};

export const waistY: Readonly<Record<Exclude<Waistline, "unknown">, number>> = {
  natural: 268,
  basque: 282,
  drop: 304,
  empire: 238,
};

export const trainLengths: Readonly<
  Record<Exclude<Train, "unknown" | "none">, number>
> = {
  sweep: 20,
  chapel: 42,
  cathedral: 70,
};

export const fabricMarks: Readonly<Record<Exclude<Fabric, "unknown">, string>> =
  {
    mikadoSatin:
      '<path d="M258 358 Q270 338 282 346" fill="none" stroke="currentColor"/>',
    lace: '<circle cx="264" cy="350" r="4" fill="none" stroke="currentColor"/><circle cx="272" cy="347" r="4" fill="none" stroke="currentColor"/><circle cx="273" cy="356" r="4" fill="none" stroke="currentColor"/>',
    subtleBeaded:
      '<circle cx="263" cy="348" r="1.5" fill="currentColor"/><circle cx="275" cy="355" r="1.5" fill="currentColor"/>',
    ornateBeaded:
      '<circle cx="262" cy="346" r="1.5" fill="currentColor"/><circle cx="270" cy="350" r="1.5" fill="currentColor"/><circle cx="278" cy="345" r="1.5" fill="currentColor"/><circle cx="264" cy="358" r="1.5" fill="currentColor"/><circle cx="277" cy="359" r="1.5" fill="currentColor"/>',
    tulle:
      '<path d="M258 344 L282 360 M282 344 L258 360" fill="none" stroke="currentColor" stroke-width=".8"/>',
    organzaChiffon:
      '<path d="M257 348 Q264 342 270 348 T283 348 M257 356 Q264 350 270 356 T283 356" fill="none" stroke="currentColor"/>',
    glitterBeaded:
      '<path d="M270 341 L272 349 L280 351 L272 353 L270 362 L268 353 L260 351 L268 349 Z" fill="currentColor"/>',
    floral3D:
      '<circle cx="270" cy="352" r="3" fill="currentColor"/><circle cx="270" cy="345" r="4" fill="none" stroke="currentColor"/><circle cx="277" cy="352" r="4" fill="none" stroke="currentColor"/><circle cx="270" cy="359" r="4" fill="none" stroke="currentColor"/><circle cx="263" cy="352" r="4" fill="none" stroke="currentColor"/>',
  };
