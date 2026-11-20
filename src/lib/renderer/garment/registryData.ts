import type {
  BackStyle,
  DressColor,
  DressDetail,
  Fabric,
  Neckline,
  Silhouette,
  TopStyle,
  Train,
  Waistline,
} from "../../../types/domain";
import type {
  GarmentAsset,
  GarmentAssetCoverage,
  GarmentAssetRole,
  GarmentLogicalBounds,
  GarmentSourceFrame,
} from "./types";

export const GARMENT_RENDERER_VERSION = "garment-photo-v1";

const SOURCE_FRAME = {
  width: 1024,
  height: 1536,
  logicalWidth: 360,
  logicalHeight: 640,
  scale: 0.3515625,
  offsetX: 0,
  offsetY: 50,
} as const;

type AnchorSeed = {
  readonly centerX: number;
  readonly necklineY?: number;
  readonly shoulderY?: number;
  readonly waistY: number;
  readonly hemY: number;
};

type AssetSeed = {
  readonly id: string;
  readonly path: string;
  readonly role: GarmentAssetRole;
  readonly bytes: number;
  readonly sourceSha256: string;
  readonly optimizedSha256: string;
  readonly coverage: GarmentAssetCoverage;
  readonly anchors: AnchorSeed;
  readonly bounds?: GarmentLogicalBounds;
  readonly sourceFrame?: GarmentSourceFrame;
  readonly imagePlacement?: GarmentLogicalBounds;
  readonly rendererVersion?: string;
};

const frontBaseCoverage = {
  view: "front-full",
  waistline: "natural",
  color: "ivory",
  train: "none",
  details: [],
} as const;

const materialSeeds = [
  {
    id: "longHigh-aLine-longSleeve-high-ivory-mikadoSatin-magenta-key-v1",
    path: "/assets/garment/front/material/mikadoSatin-longHigh-key-v1.webp",
    bytes: 866378,
    sourceSha256:
      "ddefb37257c4bb616187e8843f6da3ee7162ae38a1af4253bac17a8dbb8fe32a",
    optimizedSha256:
      "57a297ea96ddcce716418ec2af3b7dfcac6d64f5b6865b0945865b4339beaec8",
    fabric: "mikadoSatin",
    anchors: {
      centerX: 180,
      necklineY: 75.7,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 552,
    },
  },
  {
    id: "longHigh-aLine-longSleeve-high-ivory-lace-natural-none-v2",
    path: "/assets/garment/front/material/lace-longHigh-v2.webp",
    bytes: 1538456,
    sourceSha256:
      "6136bdfdcd7f9d70272dfa5ad6259b172e64c00502e678189e77c9ed7b29cab6",
    optimizedSha256:
      "b2612b971ad705eb37d497e86fdc403d9f19919009ec9e1179a478181267c7d1",
    fabric: "lace",
    anchors: {
      centerX: 180,
      necklineY: 78.1,
      shoulderY: 95.7,
      waistY: 169.2,
      hemY: 555.2,
    },
  },
  {
    id: "longHigh-aLine-longSleeve-high-ivory-tulle-natural-none-v3",
    path: "/assets/garment/front/material/tulle-longHigh-v3.webp",
    bytes: 1252122,
    sourceSha256:
      "12b1e229ae7b24931464c2699e199b16ef34c898bca43f3bf250d6a8b7d7b7a9",
    optimizedSha256:
      "556ecef9c0b2f0d5c837bf6cd0fb409ff439f95bf8b2e55c5e18207fa52c5765",
    fabric: "tulle",
    anchors: {
      centerX: 180,
      necklineY: 78.1,
      shoulderY: 95.7,
      waistY: 174.8,
      hemY: 568.1,
    },
  },
  {
    id: "longHigh-aLine-longSleeve-high-ivory-organzaChiffon-natural-none-v2",
    path: "/assets/garment/front/material/organzaChiffon-longHigh-v2.webp",
    bytes: 910444,
    sourceSha256:
      "d2ff0f43c6cbf814e7de2de361b8c664334af7b00a0c3a4494f5026f2887079e",
    optimizedSha256:
      "0d52bbfb4199f79de365d9369919d09d6473c3e93853fdbbcaa3348eef41fc61",
    fabric: "organzaChiffon",
    anchors: {
      centerX: 180,
      necklineY: 78.1,
      shoulderY: 95.7,
      waistY: 171.3,
      hemY: 558.7,
    },
  },
  {
    id: "subtleBeaded-longHigh-aLine-v2",
    path: "/assets/garment/front/material/subtleBeaded-v2.webp",
    bytes: 1151000,
    sourceSha256:
      "5ee41ec1420763c244d8990f2f2d0ad2a6443033abf1df0697160611da3477fd",
    optimizedSha256:
      "0e4b791a68933d3f18406d693e06fb9c2c8134d0f24c94506037669a81128b7e",
    fabric: "subtleBeaded",
    anchors: {
      centerX: 180,
      necklineY: 75.7,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 552,
    },
  },
  {
    id: "ornateBeaded-longHigh-aLine-v3",
    path: "/assets/garment/front/material/ornateBeaded-v3.webp",
    bytes: 1707296,
    sourceSha256:
      "4ef81fac088e94881bc76aaf6eacbaae2de8eb9d3aa0f913ad77a4341d040ae4",
    optimizedSha256:
      "44fa0435d116cb13a6690cc70e58fd35e262574f433ed652692899360bf2b3e5",
    fabric: "ornateBeaded",
    anchors: {
      centerX: 180,
      necklineY: 75.4,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 554.1,
    },
  },
  {
    id: "glitterBeaded-longHigh-aLine-v2",
    path: "/assets/garment/front/material/glitterBeaded-v2.webp",
    bytes: 1493522,
    sourceSha256:
      "fb34bb3de019c4f92ba9081d657a59472be565ae68c67c1106c3e8f33dd78f71",
    optimizedSha256:
      "77f60bca04d3941b260e8048a77693567378c9bd67fa4a6af65a53a15187d303",
    fabric: "glitterBeaded",
    anchors: {
      centerX: 180,
      necklineY: 75.7,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 556.8,
    },
  },
  {
    id: "floral3D-longHigh-aLine-v2",
    path: "/assets/garment/front/material/floral3D-v2.webp",
    bytes: 1324586,
    sourceSha256:
      "0947c053edc348d99e9970d9d0ade098397a3f7ffc0eb6f51de9fe78d7c7946d",
    optimizedSha256:
      "33603c56eb8fcd8c3fc1b003c4d628d6cf9bed2672ff479fca62a5fb98a6cb54",
    fabric: "floral3D",
    anchors: {
      centerX: 180,
      necklineY: 75.4,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 555.2,
    },
  },
] as const;

const lowerSeeds = [
  {
    id: "lower-sheath-strapless-sweetheart-mikado-natural-v1",
    path: "/assets/garment/front/lower/sheath-v1.webp",
    bytes: 789046,
    sourceSha256:
      "ce915d9cb821ed53e581c5ccc12008407ec75684e8856ad4ceb977ff8b53ab7f",
    optimizedSha256:
      "a9f1b61e148b5810095253425813b588fa8070e485d648efaa14fc45635ecdc3",
    silhouette: "sheath",
    waistline: "natural",
    anchors: { centerX: 180, waistY: 170.6, hemY: 557.3 },
    bounds: { x: 110.7, y: 97.2, width: 138.5, height: 459.2 },
  },
  {
    id: "lower-fitAndFlare-strapless-sweetheart-mikado-natural-v1",
    path: "/assets/garment/front/lower/fitAndFlare-v1.webp",
    bytes: 846514,
    sourceSha256:
      "1688ce087072b33ee09d312970971023d9b030395315daf1f13e6a944e902000",
    optimizedSha256:
      "a23b46446906efe2728606997851ce5686a2174495291b5854a4429c66162665",
    silhouette: "fitAndFlare",
    waistline: "natural",
    anchors: { centerX: 180, waistY: 170.6, hemY: 555.9 },
    bounds: { x: 17.2, y: 97.2, width: 325.1, height: 458.7 },
  },
  {
    id: "lower-teaLength-strapless-sweetheart-mikado-natural-v1",
    path: "/assets/garment/front/lower/teaLength-v1.webp",
    bytes: 819006,
    sourceSha256:
      "000d7f56b9f056113c712ced064b128ba7ec4fbe57ee0d34d24927bf49ae6a42",
    optimizedSha256:
      "426271870289d61310cc7559f4616f73faa16c052ee026a90c1e6a7a4fd3d619",
    silhouette: "teaLength",
    waistline: "natural",
    anchors: { centerX: 180, waistY: 170.6, hemY: 426.9 },
    bounds: { x: 39.4, y: 97.2, width: 279.1, height: 329.6 },
  },
  {
    id: "lower-empire-strapless-sweetheart-mikado-empire-v1",
    path: "/assets/garment/front/lower/empire-v1.webp",
    bytes: 851710,
    sourceSha256:
      "9e5f0bdb4deb7118fc955206c23ebcbdbf74dbe99251f4d6868764570b3b99b6",
    optimizedSha256:
      "d3e197e1fd8230272e69f01d0bf486aacd630a9a66aef73279745f8a9fb75ade",
    silhouette: "empire",
    waistline: "empire",
    anchors: { centerX: 180, waistY: 152.3, hemY: 552 },
    bounds: { x: 4.2, y: 97.8, width: 350.8, height: 454.2 },
  },
  {
    id: "lower-mermaid-strapless-sweetheart-mikado-natural-key-v1",
    path: "/assets/garment/front/lower/mermaid-key-v1.webp",
    bytes: 839196,
    sourceSha256:
      "838e3bff4e9cb65481d2d6908ce918b4f1854cab5737434835429b5a8447e019",
    optimizedSha256:
      "c5d1d35ccb2fc849b58686a92d0324b229c700c9d507cff9c43f51467d0647a9",
    silhouette: "mermaid",
    waistline: "natural",
    anchors: { centerX: 180, waistY: 170.6, hemY: 555.2 },
    bounds: { x: 11.3, y: 97.2, width: 337, height: 457.9 },
  },
  {
    id: "lower-ballGown-strapless-sweetheart-mikado-natural-key-v2",
    path: "/assets/garment/front/lower/ballGown-key-v2.webp",
    bytes: 894262,
    sourceSha256:
      "6866adc003475e4d909dc6d4f597476636c95954171c61cbc206d7efc9d7fac1",
    optimizedSha256:
      "900ecdb2f35e7b01ed08a8162a1924775d2dbbd7742acaab56acf3e0e03d10ac",
    silhouette: "ballGown",
    waistline: "natural",
    anchors: { centerX: 180, waistY: 170.6, hemY: 524.3 },
    bounds: { x: 1.8, y: 101.7, width: 354.6, height: 422.6 },
  },
] as const;

const upperSeeds = [
  [
    "offShoulder",
    "upper-offShoulder-high-aLine-mikado-v1",
    "offShoulder-v1.webp",
    855368,
    "fdaa479b4b71706dfba860c45a9e52c1ccc5ed78780542a7c69b2c05f6773ddc",
    "674cf12183fdee48bbf5693de825f57e68ab1686caea94cfdfdf9c7d45df533a",
    75.7,
  ],
  [
    "strap",
    "upper-strap-high-aLine-mikado-v1",
    "strap-v1.webp",
    847982,
    "ac054edd04a6a260fb4cd123439c33d87ffe023dcbda53388e892cd697e1c129",
    "055e8ff483f90c66c8ecb74272b4c9e1405496e3c3d7d1969a057d68eed90728",
    75.7,
  ],
  [
    "spaghetti",
    "upper-spaghetti-high-aLine-mikado-v1",
    "spaghetti-v1.webp",
    837526,
    "ad9c9eb2a5cc10517cfbb2c7dae25f892e2e521643253cde3079268775d7262b",
    "8317b42abd4a0385d667372a2c26948e6c810f77b787bf43233352752ac975b9",
    75.7,
  ],
  [
    "wideStrap",
    "upper-wideStrap-high-aLine-mikado-v1",
    "wideStrap-v1.webp",
    836118,
    "13b9b5577e795e22f00c65f9753e96e3d5758c963df1d3cfb4e241bace3af583",
    "153c905a5acdd5299459c0ce1941892f1956118f2549a617e2719e0ed1e76bde",
    75.7,
  ],
  [
    "halter",
    "upper-halter-high-aLine-mikado-v1",
    "halter-v1.webp",
    843656,
    "19827e0f33918a7b5e3e919fd2c4419cd1be285194b95c5f64f808d7ca691816",
    "0736faf0c3fd5c8b2d587bb760e12c08ec1cffaab1099895d199eefce6323ca8",
    75.7,
  ],
  [
    "oneShoulder",
    "upper-oneShoulder-high-aLine-mikado-v1",
    "oneShoulder-v1.webp",
    860774,
    "817cd93f6f7e039f1e4d8878edc83ec739b77a48bce294b94f4589be0be2e103",
    "220887666d895519d699e64852c578eddd113abe8ffc6940ddee5a042af81794",
    74.9,
  ],
  [
    "shortSleeve",
    "upper-shortSleeve-high-aLine-mikado-v1",
    "shortSleeve-v1.webp",
    835288,
    "9c86b514ecb97de60e5c033784fee7c560e1193f49d44c92712723020e9e390f",
    "08485e913dd381d5cdd02533de07458b2f6ac76dd96fc394d154910cae55e320",
    75.7,
  ],
] as const;

const matchedSeeds = [
  [
    "halter",
    "illusion",
    "matched-halter-illusion-aLine-mikado-v1",
    "halter-illusion-aLine-v1.webp",
    838844,
    "bd45e408ef9e63391f6f651f53db82ec42cd7b5a7e3487f97870571580c92ed6",
    "753fec99c69f273ef8ffa53129aedc9ac03e8b44b1297423cf2a1f55ab706bb4",
  ],
  [
    "longSleeve",
    "illusion",
    "matched-longSleeve-illusion-aLine-mikado-v1",
    "longSleeve-illusion-aLine-v1.webp",
    860316,
    "1e99fd24b594cdaefb97e1e7df075bb13366550f07ac2063d34dde5626e6de26",
    "4e599d2c3ae982b9b5cd34947e679ca4d7c25d8bd74a9f50043be9298cefbcc6",
  ],
  [
    "offShoulder",
    "illusion",
    "matched-offShoulder-illusion-aLine-mikado-v1",
    "offShoulder-illusion-aLine-v1.webp",
    860116,
    "a70d9ee93c524908b572247aecd0388db7d122367f48d8d7e2a36f5eb8e2e247",
    "fda36bdd1a0d594ee81abf44a7ec84d9b3711defc393b97f127366833620661a",
  ],
  [
    "oneShoulder",
    "asymmetric",
    "matched-oneShoulder-asymmetric-aLine-mikado-v1",
    "oneShoulder-asymmetric-aLine-v1.webp",
    828570,
    "1f9f62d762bd032c9e735d8504ed1b89975c6f08d608b4d6eaa38a8b8954f823",
    "12e2b345f4c19cf338c260db1b31d03e19153566ac2223124654a99c7db9b6c7",
  ],
  [
    "strapless",
    "high",
    "matched-strapless-high-aLine-mikado-v1",
    "strapless-high-aLine-v1.webp",
    851540,
    "3c081dc45a44d0810c5911cfb97cf04207e6e994c68f27fe362747f8f2aafd22",
    "6dfcf94a6a29a9c07d7f1015d23b3a28d6ce18f8a17127c6d4b2d24fa549b2dd",
  ],
  [
    "strapless",
    "illusion",
    "matched-strapless-illusion-aLine-mikado-v1",
    "strapless-illusion-aLine-v1.webp",
    848582,
    "bdfea85bc07ee66a8ef600c3e3d23e538c3e69e3e8fb3282718fac32a97e0d63",
    "4342194576fb2e75b848960aeed559b495b55773e8d2a74fecdeffaea1d970d2",
  ],
] as const;

const backSeed = {
  id: "neutral-back-aLine-longSleeve-highBack-ivory-mikadoSatin-natural-none",
  path: "/assets/garment/back/core/neutral-back-aLine-v1.webp",
  role: "back-core" as const,
  bytes: 847402,
  sourceSha256:
    "1c4b58ce96aa2d4711bf11ab2814d006970aae4e194f167aaf66bb18011c4852",
  optimizedSha256:
    "bcd46fc9beed3cd4d5eaaa050b8abe1b92754dbc6460102dc3fc071b99fad973",
  coverage: {
    view: "back-full",
    topStyle: "longSleeve",
    neckline: "high",
    silhouette: "aLine",
    waistline: "natural",
    fabric: "mikadoSatin",
    color: "ivory",
    backStyle: "neutralCoreOnly",
    train: "none",
    details: [],
  } as const,
  anchors: {
    centerX: 180,
    necklineY: 74.6,
    shoulderY: 95.7,
    waistY: 170.2,
    hemY: 554.1,
  },
  bounds: { x: 3.2, y: 74.6, width: 352.3, height: 479.5 },
};

const detailSeeds = [
  {
    id: "detail-satinBow-ivory-silk-magenta-key-v1",
    path: "/assets/garment/detail/satin-bow-v1.webp",
    role: "detail-master" as const,
    bytes: 1116300,
    sourceSha256:
      "708a7e6b55f0b6caa2415442ab72f65c283419e6a63dec14f8c677dad2af6829",
    optimizedSha256:
      "d175ce745bb7be1500812234137cd904c0f8b24e30ed5ac441f488e7fff6be9b",
    details: ["waistBow", "backBow"] as const,
    sourceFrame: {
      width: 1254,
      height: 1254,
      logicalWidth: 1254,
      logicalHeight: 1254,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    } as const,
    imagePlacement: { x: 0, y: 0, width: 1254, height: 1254 } as const,
    anchors: { centerX: 620, waistY: 374, hemY: 1109 },
    bounds: { x: 222, y: 145, width: 783, height: 964 },
  },
  {
    id: "detail-floralApplique-ivory-organza-magenta-key-v1",
    path: "/assets/garment/detail/floral-applique-v1.webp",
    role: "detail-master" as const,
    bytes: 1102284,
    sourceSha256:
      "71a75749b3db8a1e3be18e19a011cbfcfda6440c1b92d87f05a0915f169babb0",
    optimizedSha256:
      "a14b3d19415c079396fe1bc575137b5a5e0ef903967ba212a3778678834da29e",
    details: ["floral"] as const,
    sourceFrame: {
      width: 1328,
      height: 1184,
      logicalWidth: 1328,
      logicalHeight: 1184,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    } as const,
    imagePlacement: { x: 0, y: 0, width: 1328, height: 1184 } as const,
    anchors: { centerX: 663, waistY: 577, hemY: 984 },
    bounds: { x: 260, y: 191, width: 785, height: 793 },
  },
] as const;

function materialCoverage(fabric: Fabric): GarmentAssetCoverage {
  return {
    ...frontBaseCoverage,
    topStyle: "longSleeve",
    neckline: "high",
    silhouette: "aLine",
    fabric,
  };
}

function materialAsset(seed: (typeof materialSeeds)[number]): GarmentAsset {
  return makeAsset({
    ...seed,
    role: "material-master",
    coverage: materialCoverage(seed.fabric),
  });
}

function lowerAsset(seed: (typeof lowerSeeds)[number]): GarmentAsset {
  return makeAsset({
    ...seed,
    role: "lower-silhouette",
    coverage: {
      ...frontBaseCoverage,
      topStyle: "strapless",
      neckline: "sweetheart",
      silhouette: seed.silhouette,
      waistline: seed.waistline,
      fabric: "mikadoSatin",
    },
  });
}

function upperAsset(seed: (typeof upperSeeds)[number]): GarmentAsset {
  const [
    topStyle,
    id,
    filename,
    bytes,
    sourceSha256,
    optimizedSha256,
    necklineY,
  ] = seed;
  return makeAsset({
    id,
    path: `/assets/garment/front/upper/${filename}`,
    role: "upper-family",
    bytes,
    sourceSha256,
    optimizedSha256,
    anchors: {
      centerX: 180,
      necklineY,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 552,
    },
    coverage: {
      ...frontBaseCoverage,
      topStyle,
      neckline: "high",
      silhouette: "aLine",
      fabric: "mikadoSatin",
    },
  });
}

function matchedAsset(seed: (typeof matchedSeeds)[number]): GarmentAsset {
  const [
    topStyle,
    neckline,
    id,
    filename,
    bytes,
    sourceSha256,
    optimizedSha256,
  ] = seed;
  return makeAsset({
    id,
    path: `/assets/garment/front/matched/${filename}`,
    role: "matched-upper",
    bytes,
    sourceSha256,
    optimizedSha256,
    anchors: {
      centerX: 180,
      necklineY: 78.1,
      shoulderY: 95.7,
      waistY: 170.2,
      hemY: 552,
    },
    coverage: {
      ...frontBaseCoverage,
      topStyle,
      neckline,
      silhouette: "aLine",
      fabric: "mikadoSatin",
    },
  });
}

function makeAsset(seed: AssetSeed): GarmentAsset {
  const logicalBounds = seed.bounds ?? {
    x: 0,
    y: seed.anchors.necklineY ? seed.anchors.necklineY - 3 : 72,
    width: 360,
    height:
      seed.anchors.hemY -
      (seed.anchors.necklineY ? seed.anchors.necklineY - 3 : 72) +
      2,
  };
  const joinY = seed.anchors.waistY;
  return {
    assetId: seed.id,
    path: seed.path,
    role: seed.role,
    mime: "image/webp",
    byteLength: seed.bytes,
    sourceSha256: seed.sourceSha256,
    optimizedSha256: seed.optimizedSha256,
    sourceFrame: seed.sourceFrame ?? SOURCE_FRAME,
    ...(seed.imagePlacement ? { imagePlacement: seed.imagePlacement } : {}),
    logicalBounds,
    anchors: seed.anchors,
    regions: {
      upper: { x: 0, y: 0, width: 360, height: Math.min(640, joinY + 3) },
      lower: {
        x: 0,
        y: Math.max(0, joinY - 3),
        width: 360,
        height: Math.max(0, 640 - joinY + 3),
      },
    },
    coverage: seed.coverage,
    alpha: "runtime-matte",
    rendererVersion: seed.rendererVersion ?? GARMENT_RENDERER_VERSION,
  };
}

export const GARMENT_ASSETS: readonly GarmentAsset[] = [
  ...materialSeeds.map(materialAsset),
  ...lowerSeeds.map(lowerAsset),
  ...upperSeeds.map(upperAsset),
  ...matchedSeeds.map(matchedAsset),
  makeAsset(backSeed),
  ...detailSeeds.map((seed) =>
    makeAsset({
      ...seed,
      coverage: {
        view: "front-full",
        fabric: "mikadoSatin",
        details: seed.details,
      },
      role: "detail-master",
    }),
  ),
];

export type RegistryDomainValue =
  | BackStyle
  | DressColor
  | DressDetail
  | Fabric
  | Neckline
  | Silhouette
  | TopStyle
  | Train
  | Waistline;
