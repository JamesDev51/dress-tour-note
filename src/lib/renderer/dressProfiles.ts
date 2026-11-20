import type {
  BackStyle,
  Neckline,
  Silhouette,
  TopStyle,
} from "../../types/domain";

type KnownSilhouette = Exclude<Silhouette, "unknown">;
type PathFactory = (
  waistY: number,
  topStyle?: TopStyle,
  neckline?: Neckline,
  backStyle?: BackStyle,
) => string;
type SkirtPathFactory = (transitionY: number, waistY: number) => string;

export type SilhouetteMetric = {
  readonly hemY: number;
  readonly hemLeft: number;
  readonly hemRight: number;
};

export type ProfileAnchors = {
  readonly topY: number;
  readonly shoulderLeft: number;
  readonly shoulderRight: number;
  readonly necklineLeft: number;
  readonly necklineRight: number;
  readonly bustY: number;
  readonly waistLeft: number;
  readonly waistRight: number;
  readonly sleeveLeft: number;
  readonly sleeveRight: number;
  readonly backTop: number;
  readonly backBottom: number;
};

export type ProfileVolume = {
  readonly shadow: string;
  readonly highlight: string;
  readonly fold: string;
  readonly accents: readonly string[];
};

export type DressProfile = {
  readonly anchors: ProfileAnchors;
  readonly metric: SilhouetteMetric;
  readonly transitionY: (waistY: number) => number;
  readonly bodyPath: PathFactory;
  readonly bodyContourPath: PathFactory;
  readonly upperPath: PathFactory;
  readonly upperContourPath: PathFactory;
  readonly volume: (waistY: number) => ProfileVolume;
};

const anchors = (overrides: Partial<ProfileAnchors>): ProfileAnchors => ({
  topY: 188,
  shoulderLeft: 92,
  shoulderRight: 178,
  necklineLeft: 103,
  necklineRight: 167,
  bustY: 205,
  waistLeft: 110,
  waistRight: 160,
  sleeveLeft: 99,
  sleeveRight: 171,
  backTop: 190,
  backBottom: 250,
  ...overrides,
});

type TopEdge = {
  readonly leftX: number;
  readonly leftY: number;
  readonly rightX: number;
  readonly rightY: number;
  readonly reverse: string;
};

type LowEdgeBuilder = (profileAnchors: ProfileAnchors) => TopEdge;

const neutralLowEdge = (a: ProfileAnchors): TopEdge => {
  const leftX = a.necklineLeft - 9;
  const rightX = a.necklineRight + 9;
  const y = a.bustY + 3;
  return {
    leftX,
    leftY: y,
    rightX,
    rightY: y,
    reverse: `M${rightX} ${y} C${rightX - 13} ${y - 3} 148 ${y + 7} 135 ${y + 8} C122 ${y + 7} ${leftX + 13} ${y - 3} ${leftX} ${y}`,
  };
};

const lowEdgeBuilders: Readonly<Record<Neckline, LowEdgeBuilder>> = {
  unknown: neutralLowEdge,
  straight: (a) => {
    const leftX = a.necklineLeft - 9;
    const rightX = a.necklineRight + 9;
    const y = a.bustY - 4;
    return {
      leftX,
      leftY: y,
      rightX,
      rightY: y,
      reverse: `M${rightX} ${y} L${leftX} ${y}`,
    };
  },
  sweetheart: (a) => {
    const leftX = a.necklineLeft - 9;
    const rightX = a.necklineRight + 9;
    const leftY = a.bustY + 5;
    const rightY = a.bustY + 5;
    return {
      leftX,
      leftY,
      rightX,
      rightY,
      reverse: `M${rightX} ${rightY} C${rightX - 2} ${a.bustY - 4} ${rightX - 10} ${a.bustY - 9} ${rightX - 18} ${a.bustY - 7} C${rightX - 27} ${a.bustY - 5} 141 ${a.bustY + 3} 135 ${a.bustY + 6} C129 ${a.bustY + 3} ${leftX + 27} ${a.bustY - 5} ${leftX + 18} ${a.bustY - 7} C${leftX + 10} ${a.bustY - 9} ${leftX + 2} ${a.bustY - 4} ${leftX} ${leftY}`,
    };
  },
  v: (a) => {
    const leftX = a.necklineLeft - 9;
    const rightX = a.necklineRight + 9;
    const y = a.bustY - 8;
    return {
      leftX,
      leftY: y,
      rightX,
      rightY: y,
      reverse: `M${rightX} ${y} C${rightX - 13} ${y} 148 ${a.bustY + 3} 135 ${a.bustY + 13} C122 ${a.bustY + 3} ${leftX + 13} ${y} ${leftX} ${y}`,
    };
  },
  square: (a) => {
    const leftX = a.necklineLeft - 9;
    const rightX = a.necklineRight + 9;
    const y = a.topY + 5;
    return {
      leftX,
      leftY: y,
      rightX,
      rightY: y,
      reverse: `M${rightX} ${y} L${rightX} ${a.bustY - 7} L${leftX} ${a.bustY - 7} L${leftX} ${y}`,
    };
  },
  scoop: (a) => {
    const leftX = a.necklineLeft - 8;
    const rightX = a.necklineRight + 8;
    const y = a.bustY - 7;
    return {
      leftX,
      leftY: y,
      rightX,
      rightY: y,
      reverse: `M${rightX} ${y} C${rightX - 9} ${a.bustY + 11} 144 ${a.bustY + 14} 135 ${a.bustY + 15} C126 ${a.bustY + 14} ${leftX + 9} ${a.bustY + 11} ${leftX} ${y}`,
    };
  },
  high: (a) => highEdge(a),
  illusion: (a) => lowEdgeBuilders.scoop(a),
  asymmetric: (a) => {
    const leftX = a.necklineLeft - 9;
    const rightX = a.necklineRight + 9;
    const leftY = a.bustY + 2;
    const rightY = a.topY + 2;
    return {
      leftX,
      leftY,
      rightX,
      rightY,
      reverse: `M${rightX} ${rightY} C${rightX - 15} ${rightY + 3} 148 ${a.bustY - 1} ${leftX} ${leftY}`,
    };
  },
};

function highEdge(a: ProfileAnchors): TopEdge {
  const leftX = a.shoulderLeft;
  const rightX = a.shoulderRight;
  const leftY = a.topY;
  const rightY = a.topY;
  return {
    leftX,
    leftY,
    rightX,
    rightY,
    reverse: `M${rightX} ${rightY} C${rightX - 11} ${a.topY - 8} ${a.necklineRight + 4} ${a.topY - 9} 135 ${a.topY - 2} C${a.necklineLeft - 4} ${a.topY - 9} ${leftX + 11} ${a.topY - 8} ${leftX} ${leftY}`,
  };
}

function neutralTopEdge(a: ProfileAnchors): TopEdge {
  const leftX = a.shoulderLeft;
  const rightX = a.shoulderRight;
  const y = a.topY + 4;
  return {
    leftX,
    leftY: y,
    rightX,
    rightY: y,
    reverse: `M${rightX} ${y} C${rightX - 13} ${a.topY + 1} 150 ${a.topY + 8} 135 ${a.topY + 7} C120 ${a.topY + 8} ${leftX + 13} ${a.topY + 1} ${leftX} ${y}`,
  };
}

const backDepth: Readonly<Record<BackStyle, number>> = {
  unknown: 4,
  openBack: 20,
  vBack: 29,
  buttonBack: 7,
  corsetBack: 13,
  illusionBack: 17,
  bowBack: 11,
};

function backEdge(a: ProfileAnchors, style: BackStyle): TopEdge {
  const leftX = a.shoulderLeft;
  const rightX = a.shoulderRight;
  const y = a.topY;
  const depth = backDepth[style];
  return {
    leftX,
    leftY: y,
    rightX,
    rightY: y,
    reverse: `M${rightX} ${y} C${rightX - 12} ${a.topY - 2} 151 ${a.topY + depth} 135 ${a.topY + depth} C119 ${a.topY + depth} ${leftX + 12} ${a.topY - 2} ${leftX} ${y}`,
  };
}

function bodyTopEdgeFor(
  profileAnchors: ProfileAnchors,
  topStyle: TopStyle = "unknown",
  neckline: Neckline = "unknown",
  backStyle?: BackStyle,
): TopEdge {
  if (backStyle !== undefined) return backEdge(profileAnchors, backStyle);
  if (topStyle === "unknown") return neutralTopEdge(profileAnchors);
  return topStyle === "strapless" || topStyle === "offShoulder"
    ? lowEdgeBuilders[neckline](profileAnchors)
    : highEdge(profileAnchors);
}

const upperContourPathFor = (
  profileAnchors: ProfileAnchors,
  waistY: number,
  topStyle: TopStyle,
  neckline: Neckline,
  backStyle?: BackStyle,
) => {
  const edge = bodyTopEdgeFor(profileAnchors, topStyle, neckline, backStyle);
  return `M${edge.leftX} ${edge.leftY} C${edge.leftX - 1} ${edge.leftY + 24} ${profileAnchors.shoulderLeft - 2} ${waistY - 36} ${profileAnchors.waistLeft - 6} ${waistY - 20} C${profileAnchors.waistLeft - 2} ${waistY - 10} ${profileAnchors.waistLeft} ${waistY - 3} ${profileAnchors.waistLeft} ${waistY} Q135 ${waistY + 8} ${profileAnchors.waistRight} ${waistY} C${profileAnchors.waistRight} ${waistY - 3} ${profileAnchors.waistRight + 2} ${waistY - 10} ${profileAnchors.waistRight + 6} ${waistY - 20} C${profileAnchors.shoulderRight - 2} ${waistY - 36} ${edge.rightX + 1} ${edge.rightY + 24} ${edge.rightX} ${edge.rightY}`;
};

const bodyContourPathFor = (
  profileAnchors: ProfileAnchors,
  metric: SilhouetteMetric,
  transitionY: number,
  leftSkirt: string,
  rightSkirt: string,
  topStyle: TopStyle,
  neckline: Neckline,
  backStyle?: BackStyle,
) => {
  const edge = bodyTopEdgeFor(profileAnchors, topStyle, neckline, backStyle);
  return `M${edge.leftX} ${edge.leftY} C${edge.leftX - 1} ${edge.leftY + 24} ${profileAnchors.shoulderLeft - 2} ${transitionY - 36} ${profileAnchors.waistLeft - 6} ${transitionY - 20} C${profileAnchors.waistLeft - 2} ${transitionY - 10} ${profileAnchors.waistLeft} ${transitionY - 3} ${profileAnchors.waistLeft} ${transitionY} ${leftSkirt} Q135 ${metric.hemY + 22} ${metric.hemRight} ${metric.hemY} ${rightSkirt} C${profileAnchors.waistRight} ${transitionY - 3} ${profileAnchors.waistRight + 2} ${transitionY - 10} ${profileAnchors.waistRight + 6} ${transitionY - 20} C${profileAnchors.shoulderRight - 2} ${transitionY - 36} ${edge.rightX + 1} ${edge.rightY + 24} ${edge.rightX} ${edge.rightY}`;
};

type ProfileKey = KnownSilhouette | "neutral";
type ProfileAccentBuilder = (
  profileAnchors: ProfileAnchors,
  metric: SilhouetteMetric,
  waistY: number,
) => readonly string[];

const profileAccentBuilders: Readonly<
  Record<ProfileKey, ProfileAccentBuilder>
> = {
  aLine: () => [],
  neutral: () => [],
  ballGown: (a, metric, waistY) => [
    `M${a.waistLeft + 2} ${waistY + 2} C${a.waistLeft + 9} ${waistY + 54} ${metric.hemLeft + 30} ${metric.hemY - 48} ${metric.hemLeft + 7} ${metric.hemY - 3} Q${metric.hemLeft + 28} ${metric.hemY + 8} ${metric.hemLeft + 50} ${metric.hemY + 3} C${metric.hemLeft + 74} ${metric.hemY - 64} ${a.waistLeft + 27} ${waistY + 40} ${a.waistLeft + 2} ${waistY + 2} Z`,
    `M${a.waistLeft + 17} ${waistY} C${a.waistLeft + 32} ${waistY + 62} ${135 - 8} ${metric.hemY - 54} ${135 - 33} ${metric.hemY + 2} Q${135 - 10} ${metric.hemY + 13} 135 ${metric.hemY + 16} Q${135 + 11} ${metric.hemY + 13} ${metric.hemRight - 33} ${metric.hemY + 2} C${135 + 9} ${metric.hemY - 54} ${a.waistRight - 31} ${waistY + 62} ${a.waistRight - 17} ${waistY} Z`,
    `M${a.waistRight - 2} ${waistY + 2} C${a.waistRight - 9} ${waistY + 54} ${metric.hemRight - 30} ${metric.hemY - 48} ${metric.hemRight - 7} ${metric.hemY - 3} Q${metric.hemRight - 28} ${metric.hemY + 8} ${metric.hemRight - 50} ${metric.hemY + 3} C${metric.hemRight - 74} ${metric.hemY - 64} ${a.waistRight - 27} ${waistY + 40} ${a.waistRight - 2} ${waistY + 2} Z`,
  ],
  empire: (a, _metric, waistY) => {
    const release = Math.min(waistY, 240);
    return [
      `M${a.waistLeft - 2} ${release - 1} Q135 ${release + 8} ${a.waistRight + 2} ${release - 1} L${a.waistRight + 1} ${release + 11} Q135 ${release + 18} ${a.waistLeft - 1} ${release + 11} Z`,
    ];
  },
  fitAndFlare: (a, metric, waistY) => [
    `M${a.waistLeft + 1} ${waistY + 4} C${a.waistLeft + 12} ${waistY + 52} ${a.waistLeft + 18} 386 ${a.waistLeft + 10} 424 C${a.waistLeft + 2} 459 ${metric.hemLeft + 34} ${metric.hemY - 35} ${metric.hemLeft + 12} ${metric.hemY - 5} Q${metric.hemLeft + 34} ${metric.hemY + 7} ${metric.hemLeft + 54} ${metric.hemY + 2} C${metric.hemLeft + 72} ${metric.hemY - 64} ${a.waistLeft + 27} ${waistY + 39} ${a.waistLeft + 1} ${waistY + 4} Z`,
  ],
  mermaid: (a, metric, waistY) => [
    `M${a.waistLeft + 3} ${waistY + 5} C${a.waistLeft + 4} ${waistY + 58} ${a.waistLeft + 1} 380 ${a.waistLeft - 2} 430 C${a.waistLeft - 5} 457 ${metric.hemLeft + 42} ${metric.hemY - 36} ${metric.hemLeft + 12} ${metric.hemY - 5} Q${metric.hemLeft + 34} ${metric.hemY + 7} ${metric.hemLeft + 52} ${metric.hemY + 1} C${metric.hemLeft + 70} ${metric.hemY - 62} ${a.waistLeft + 27} ${waistY + 44} ${a.waistLeft + 3} ${waistY + 5} Z`,
  ],
  sheath: () => [],
  teaLength: (a, metric, waistY) => [
    `M${a.waistRight - 2} ${waistY + 3} C${a.waistRight + 5} ${waistY + 42} ${metric.hemRight - 34} ${metric.hemY - 31} ${metric.hemRight - 12} ${metric.hemY - 4} Q${metric.hemRight - 30} ${metric.hemY + 7} ${metric.hemRight - 50} ${metric.hemY + 2} C${metric.hemRight - 66} ${metric.hemY - 42} ${a.waistRight - 26} ${waistY + 30} ${a.waistRight - 2} ${waistY + 3} Z`,
  ],
};

const profileVolume =
  (
    profileAnchors: ProfileAnchors,
    metric: SilhouetteMetric,
    profileKey: ProfileKey,
  ) =>
  (waistY: number): ProfileVolume => {
    const width = metric.hemRight - metric.hemLeft;
    const leftInner = Math.round(metric.hemLeft + width * 0.38);
    const rightInner = Math.round(metric.hemRight - width * 0.36);
    const leftMid = Math.round(metric.hemLeft + width * 0.24);
    const rightMid = Math.round(metric.hemRight - width * 0.2);
    const transition = waistY;
    const genericShadow = `M${profileAnchors.shoulderLeft + 4} ${profileAnchors.topY + 8} C${profileAnchors.shoulderLeft + 2} ${profileAnchors.bustY + 34} ${profileAnchors.waistLeft + 2} ${transition - 3} ${profileAnchors.waistLeft + 1} ${transition + 5} C${leftMid} ${transition + 92} ${metric.hemLeft + 9} ${metric.hemY - 38} ${metric.hemLeft + 3} ${metric.hemY - 4} Q${metric.hemLeft + Math.round(width * 0.14)} ${metric.hemY + 9} ${leftInner} ${metric.hemY + 6} C${Math.round(metric.hemLeft + width * 0.44)} ${transition + 138} ${profileAnchors.waistLeft + 15} ${transition + 16} ${profileAnchors.necklineLeft + 8} ${profileAnchors.bustY + 7} Z`;
    const genericHighlight = `M${profileAnchors.necklineLeft + 5} ${profileAnchors.bustY - 3} C${profileAnchors.necklineLeft + 24} ${profileAnchors.bustY + 28} ${leftInner + 11} ${transition + 86} ${leftInner - 2} ${Math.round((transition + metric.hemY) * 0.5)} C${leftInner - 5} ${metric.hemY - 24} ${Math.round(metric.hemLeft + width * 0.37)} ${metric.hemY - 7} ${Math.round(metric.hemLeft + width * 0.44)} ${metric.hemY + 4} Q135 ${metric.hemY + 17} ${rightInner} ${metric.hemY + 4} C${rightMid} ${metric.hemY - 8} ${rightMid - 16} ${Math.round((transition + metric.hemY) * 0.5)} ${rightInner - 8} ${transition + 84} C${rightInner - 14} ${profileAnchors.bustY + 28} ${profileAnchors.necklineRight - 10} ${profileAnchors.bustY + 8} ${profileAnchors.necklineRight - 5} ${profileAnchors.bustY - 3} Z`;
    const genericFold = `M${profileAnchors.waistRight - 6} ${transition + 4} C${rightMid - 3} ${transition + 54} ${rightMid} ${Math.round((transition + metric.hemY) * 0.5)} ${leftInner + 5} ${metric.hemY - 7} Q${leftInner + 13} ${metric.hemY + 5} ${leftInner + 22} ${metric.hemY + 4} C${Math.round(metric.hemLeft + width * 0.43)} ${Math.round((transition + metric.hemY) * 0.5)} ${profileAnchors.waistRight + 3} ${transition + 26} ${profileAnchors.waistRight - 6} ${transition + 4} Z`;
    const shadow =
      profileKey === "sheath"
        ? `M${profileAnchors.shoulderLeft + 3} ${profileAnchors.topY + 8} C${profileAnchors.shoulderLeft + 1} ${profileAnchors.bustY + 30} ${profileAnchors.waistLeft + 1} ${transition + 18} ${profileAnchors.waistLeft + 1} ${transition + 8} C${profileAnchors.waistLeft - 3} ${transition + 122} ${metric.hemLeft + 4} ${metric.hemY - 36} ${metric.hemLeft + 2} ${metric.hemY - 4} Q${metric.hemLeft + 18} ${metric.hemY + 6} ${metric.hemLeft + 31} ${metric.hemY + 3} C${metric.hemLeft + 40} ${transition + 112} ${profileAnchors.waistLeft + 13} ${transition + 22} ${profileAnchors.necklineLeft + 7} ${profileAnchors.bustY + 7} Z`
        : genericShadow;
    const highlight =
      profileKey === "sheath"
        ? `M${profileAnchors.necklineLeft + 5} ${profileAnchors.bustY - 2} C${profileAnchors.necklineLeft + 21} ${profileAnchors.bustY + 30} ${profileAnchors.waistLeft + 15} ${transition + 92} ${profileAnchors.waistLeft + 13} ${transition + 14} C${profileAnchors.waistLeft + 10} ${metric.hemY - 38} ${profileAnchors.waistLeft + 12} ${metric.hemY - 9} 135 ${metric.hemY + 8} Q${profileAnchors.waistRight - 10} ${metric.hemY - 6} ${profileAnchors.waistRight - 8} ${metric.hemY - 34} C${profileAnchors.waistRight - 7} ${transition + 90} ${profileAnchors.waistRight - 2} ${profileAnchors.bustY + 28} ${profileAnchors.necklineRight - 5} ${profileAnchors.bustY - 2} Z`
        : genericHighlight;
    const fold =
      profileKey === "sheath"
        ? `M${profileAnchors.waistRight - 4} ${transition + 5} C${profileAnchors.waistRight + 1} ${transition + 70} ${profileAnchors.waistRight + 1} ${metric.hemY - 54} ${profileAnchors.waistRight + 8} ${metric.hemY - 5} Q${profileAnchors.waistRight + 1} ${metric.hemY + 3} ${profileAnchors.waistRight - 8} ${metric.hemY + 1} C${profileAnchors.waistRight - 12} ${metric.hemY - 66} ${profileAnchors.waistRight - 11} ${transition + 55} ${profileAnchors.waistRight - 4} ${transition + 5} Z`
        : genericFold;
    const accents = profileAccentBuilders[profileKey](
      profileAnchors,
      metric,
      waistY,
    );
    return { shadow, highlight, fold, accents };
  };

const profile = (
  profileAnchors: ProfileAnchors,
  metric: SilhouetteMetric,
  transitionY: (waistY: number) => number,
  leftSkirt: SkirtPathFactory,
  rightSkirt: SkirtPathFactory,
  volume: (waistY: number) => ProfileVolume,
): DressProfile => ({
  anchors: profileAnchors,
  metric,
  transitionY,
  bodyPath: (waistY, topStyle = "unknown", neckline = "unknown", backStyle) => {
    const transition = transitionY(waistY);
    const edge = bodyTopEdgeFor(profileAnchors, topStyle, neckline, backStyle);
    return `${bodyContourPathFor(profileAnchors, metric, transition, leftSkirt(transition, waistY), rightSkirt(transition, waistY), topStyle, neckline, backStyle)} ${edge.reverse} Z`;
  },
  bodyContourPath: (
    waistY,
    topStyle = "unknown",
    neckline = "unknown",
    backStyle,
  ) => {
    const transition = transitionY(waistY);
    return bodyContourPathFor(
      profileAnchors,
      metric,
      transition,
      leftSkirt(transition, waistY),
      rightSkirt(transition, waistY),
      topStyle,
      neckline,
      backStyle,
    );
  },
  upperPath: (
    waistY,
    topStyle = "unknown",
    neckline = "unknown",
    backStyle,
  ) => {
    const edge = bodyTopEdgeFor(profileAnchors, topStyle, neckline, backStyle);
    return `${upperContourPathFor(profileAnchors, transitionY(waistY), topStyle, neckline, backStyle)} ${edge.reverse} Z`;
  },
  upperContourPath: (
    waistY,
    topStyle = "unknown",
    neckline = "unknown",
    backStyle,
  ) =>
    upperContourPathFor(
      profileAnchors,
      transitionY(waistY),
      topStyle,
      neckline,
      backStyle,
    ),
  volume,
});

const aLineMetric = { hemY: 558, hemLeft: 48, hemRight: 222 } as const;
const ballGownMetric = { hemY: 558, hemLeft: 24, hemRight: 246 } as const;
const empireMetric = { hemY: 558, hemLeft: 44, hemRight: 226 } as const;
const fitAndFlareMetric = { hemY: 558, hemLeft: 46, hemRight: 224 } as const;
const mermaidMetric = { hemY: 558, hemLeft: 40, hemRight: 230 } as const;
const sheathMetric = { hemY: 558, hemLeft: 88, hemRight: 182 } as const;
const teaLengthMetric = { hemY: 462, hemLeft: 62, hemRight: 208 } as const;

const aLineAnchors = anchors({});
const ballGownAnchors = anchors({
  shoulderLeft: 90,
  shoulderRight: 180,
  necklineLeft: 102,
  necklineRight: 168,
  waistLeft: 108,
  waistRight: 162,
  sleeveLeft: 98,
  sleeveRight: 172,
});
const empireAnchors = anchors({
  topY: 184,
  bustY: 202,
  shoulderLeft: 90,
  shoulderRight: 180,
  necklineLeft: 102,
  necklineRight: 168,
  waistLeft: 108,
  waistRight: 162,
  sleeveLeft: 98,
  sleeveRight: 172,
});
const fitAndFlareAnchors = anchors({
  shoulderLeft: 91,
  shoulderRight: 179,
  necklineLeft: 102,
  necklineRight: 168,
  waistLeft: 109,
  waistRight: 161,
});
const mermaidAnchors = anchors({
  shoulderLeft: 92,
  shoulderRight: 178,
  necklineLeft: 103,
  necklineRight: 167,
  waistLeft: 112,
  waistRight: 158,
});
const sheathAnchors = anchors({
  shoulderLeft: 94,
  shoulderRight: 176,
  necklineLeft: 104,
  necklineRight: 166,
  waistLeft: 114,
  waistRight: 156,
});
const teaLengthAnchors = anchors({
  shoulderLeft: 92,
  shoulderRight: 178,
  necklineLeft: 103,
  necklineRight: 167,
  waistLeft: 110,
  waistRight: 160,
});

export const silhouetteProfiles: Readonly<
  Record<KnownSilhouette, DressProfile>
> = {
  aLine: profile(
    aLineAnchors,
    aLineMetric,
    (waistY) => waistY,
    (waistY) => `C108 ${waistY + 45} 100 382 82 448 C72 488 57 535 48 558`,
    (waistY) =>
      `C198 535 183 488 173 448 C155 382 162 ${waistY + 45} 160 ${waistY}`,
    profileVolume(aLineAnchors, aLineMetric, "aLine"),
  ),
  ballGown: profile(
    ballGownAnchors,
    ballGownMetric,
    (waistY) => waistY,
    (waistY) => `C103 ${waistY + 38} 53 418 24 558`,
    (waistY) => `C228 418 167 ${waistY + 38} 162 ${waistY}`,
    profileVolume(ballGownAnchors, ballGownMetric, "ballGown"),
  ),
  empire: profile(
    empireAnchors,
    empireMetric,
    (waistY) => Math.min(waistY, 240),
    (transitionY, waistY) =>
      `C103 ${transitionY + 44} 100 ${waistY + 20} 94 ${waistY + 48} C80 438 58 523 44 558`,
    (transitionY, waistY) =>
      `C212 523 190 438 176 ${waistY + 48} C170 ${waistY + 20} 167 ${transitionY + 44} 162 ${transitionY}`,
    profileVolume(empireAnchors, empireMetric, "empire"),
  ),
  fitAndFlare: profile(
    fitAndFlareAnchors,
    fitAndFlareMetric,
    (waistY) => waistY,
    (waistY) => `C109 ${waistY + 58} 109 403 94 470 C83 515 59 545 46 558`,
    (waistY) =>
      `C211 545 187 515 176 470 C161 403 161 ${waistY + 58} 161 ${waistY}`,
    profileVolume(fitAndFlareAnchors, fitAndFlareMetric, "fitAndFlare"),
  ),
  mermaid: profile(
    mermaidAnchors,
    mermaidMetric,
    (waistY) => waistY,
    (waistY) => `C111 ${waistY + 67} 108 397 104 450 C100 482 85 516 40 558`,
    (waistY) =>
      `C185 516 170 482 166 450 C162 397 159 ${waistY + 67} 158 ${waistY}`,
    profileVolume(mermaidAnchors, mermaidMetric, "mermaid"),
  ),
  sheath: profile(
    sheathAnchors,
    sheathMetric,
    (waistY) => waistY,
    (waistY) => `C113 ${waistY + 64} 106 439 99 558`,
    (waistY) => `C171 439 164 ${waistY + 64} 156 ${waistY}`,
    profileVolume(sheathAnchors, sheathMetric, "sheath"),
  ),
  teaLength: profile(
    teaLengthAnchors,
    teaLengthMetric,
    (waistY) => waistY,
    (waistY) => `C108 ${waistY + 46} 80 421 62 462`,
    (waistY) => `C190 421 162 ${waistY + 46} 160 ${waistY}`,
    profileVolume(teaLengthAnchors, teaLengthMetric, "teaLength"),
  ),
};

const neutralAnchors = anchors({});
const neutralMetric = { hemY: 558, hemLeft: 62, hemRight: 208 } as const;

export const neutralProfile: DressProfile = profile(
  neutralAnchors,
  neutralMetric,
  (waistY) => waistY,
  (waistY) => `C108 ${waistY + 52} 82 494 62 558`,
  (waistY) => `C188 494 162 ${waistY + 52} 160 ${waistY}`,
  profileVolume(neutralAnchors, neutralMetric, "neutral"),
);

export const silhouetteMetrics: Readonly<
  Record<KnownSilhouette, SilhouetteMetric>
> = {
  aLine: silhouetteProfiles.aLine.metric,
  ballGown: silhouetteProfiles.ballGown.metric,
  empire: silhouetteProfiles.empire.metric,
  fitAndFlare: silhouetteProfiles.fitAndFlare.metric,
  mermaid: silhouetteProfiles.mermaid.metric,
  sheath: silhouetteProfiles.sheath.metric,
  teaLength: silhouetteProfiles.teaLength.metric,
};

export const silhouettePaths: Readonly<Record<KnownSilhouette, PathFactory>> = {
  aLine: silhouetteProfiles.aLine.bodyPath,
  ballGown: silhouetteProfiles.ballGown.bodyPath,
  empire: silhouetteProfiles.empire.bodyPath,
  fitAndFlare: silhouetteProfiles.fitAndFlare.bodyPath,
  mermaid: silhouetteProfiles.mermaid.bodyPath,
  sheath: silhouetteProfiles.sheath.bodyPath,
  teaLength: silhouetteProfiles.teaLength.bodyPath,
};

export const neutralSilhouettePath = neutralProfile.bodyPath;
export const upperBodicePath = neutralProfile.upperPath;

export function profileForSilhouette(
  silhouette: KnownSilhouette,
): DressProfile {
  return silhouetteProfiles[silhouette];
}
