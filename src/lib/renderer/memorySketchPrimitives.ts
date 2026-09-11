import type {
  BackStyle,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
  Train,
  Waistline,
} from "../../types/domain";

export const silhouettePaths: Readonly<
  Record<Exclude<Silhouette, "unknown">, string>
> = {
  aLine:
    "M116 284 C101 356 70 458 55 558 Q135 590 215 558 C200 458 169 356 154 284 Z",
  ballGown:
    "M112 284 C80 345 38 447 28 558 Q135 600 242 558 C232 447 190 345 158 284 Z",
  empire:
    "M105 248 C91 320 72 454 66 558 Q135 582 204 558 C198 454 179 320 165 248 Z",
  fitAndFlare:
    "M111 284 C106 361 106 427 72 558 Q135 586 198 558 C164 427 164 361 159 284 Z",
  mermaid:
    "M112 284 C107 374 113 449 68 558 Q135 590 202 558 C157 449 163 374 158 284 Z",
  sheath:
    "M113 284 C108 374 105 470 100 558 Q135 571 170 558 C165 470 162 374 157 284 Z",
  teaLength:
    "M112 284 C96 349 82 406 72 462 Q135 486 198 462 C188 406 174 349 158 284 Z",
};

export const necklinePaths: Readonly<
  Record<Exclude<Neckline, "unknown">, string>
> = {
  straight: "M110 205 L160 205",
  sweetheart: "M110 203 Q122 194 135 207 Q148 194 160 203",
  v: "M110 198 L135 220 L160 198",
  square: "M112 192 L112 210 L158 210 L158 192",
  scoop: "M111 195 Q135 222 159 195",
  high: "M116 184 Q135 193 154 184",
  illusion: "M112 196 Q135 218 158 196 M118 184 Q135 192 152 184",
  asymmetric: "M110 208 L160 192",
};

export const topPaths: Readonly<Record<Exclude<TopStyle, "unknown">, string>> =
  {
    strapless:
      "M106 204 Q99 220 102 250 L111 284 L159 284 L168 250 Q171 220 164 204",
    offShoulder:
      "M93 207 Q104 196 111 211 L106 266 L164 266 L159 211 Q166 196 177 207",
    strap: "M105 266 L108 197 M162 266 L159 197 M108 197 L162 197 L164 266 Z",
    spaghetti:
      "M106 266 L110 190 M164 266 L160 190 M110 204 L160 204 L164 266 Z",
    wideStrap:
      "M105 266 L105 190 L120 190 L115 211 M165 266 L165 190 L150 190 L155 211 M115 204 L155 204 L165 266 Z",
    halter:
      "M104 266 L118 210 L128 184 M166 266 L152 210 L142 184 M118 210 Q135 220 152 210",
    oneShoulder: "M104 266 L111 204 L153 187 L166 266 Z",
    shortSleeve:
      "M104 214 Q88 216 83 239 L99 247 L105 266 L165 266 L171 247 L187 239 Q182 216 166 214",
    longSleeve:
      "M104 214 L84 236 L76 350 L95 354 L105 266 L165 266 L175 354 L194 350 L186 236 L166 214",
  };

export const backPaths: Readonly<
  Record<Exclude<BackStyle, "unknown">, string>
> = {
  openBack: "M110 195 Q135 248 160 195",
  vBack: "M110 193 L135 236 L160 193",
  buttonBack: "M135 194 L135 270",
  corsetBack:
    "M116 205 L154 258 M154 205 L116 258 M116 228 L154 240 M154 228 L116 240",
  illusionBack: "M111 194 Q135 229 159 194 M117 204 L153 254",
  bowBack:
    "M135 244 Q107 220 105 250 Q115 264 135 249 Q155 264 165 250 Q163 220 135 244",
};

export const waistY: Readonly<Record<Exclude<Waistline, "unknown">, number>> = {
  natural: 284,
  basque: 294,
  drop: 315,
  empire: 248,
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
