import geometryGuides from "./geometryGuides.json";
import type {
  PhotoWarpAnchor,
  PhotoWarpGuide,
  PhotoWarpInput,
} from "./photoWarp";
import type { GarmentAsset } from "./types";

const SCALE = 0.3515625;
const OFFSET_Y = 50;
const LOGICAL_FRAME = { width: 360, height: 640 } as const;
type GuideRecord = (typeof geometryGuides.assets)[number];

function recordFor(assetId: string): GuideRecord | undefined {
  return geometryGuides.assets.find((asset) => asset.assetId === assetId);
}

export function waistSpanForAsset(
  assetId: string,
): readonly [number, number] | undefined {
  const record = recordFor(assetId);
  if (!record) return undefined;
  return [record.anchors.joinLeftX * SCALE, record.anchors.joinRightX * SCALE];
}

function logicalGuide(record: GuideRecord): PhotoWarpGuide {
  return {
    frame: LOGICAL_FRAME,
    centerX: record.anchors.centerX * SCALE,
    rows: record.sampledRows
      .filter(
        (row, index) =>
          index % 4 === 0 ||
          row.y === record.anchors.joinY ||
          row.y === record.anchors.hemY,
      )
      .map((row) => ({
        y: row.y * SCALE + OFFSET_Y,
        runs: row.runs.map(([left, right]) => {
          const halfPixel = left === right ? 0.5 : 0;
          return [
            Math.max(0, (left - halfPixel) * SCALE),
            Math.min(LOGICAL_FRAME.width, (right + halfPixel) * SCALE),
          ] as const;
        }),
        centerRunIndex: row.centerRunIndex,
      }))
      .filter((row) => {
        const index = row.centerRunIndex;
        const span = index === null ? undefined : row.runs[index];
        return span !== undefined && span[0] < span[1];
      }),
  };
}

function logicalAnchor(record: GuideRecord): PhotoWarpAnchor {
  const anchors = record.anchors;
  return {
    centerX: anchors.centerX * SCALE,
    joinY: anchors.joinY * SCALE + OFFSET_Y,
    hemY: anchors.hemY * SCALE + OFFSET_Y,
    joinLeftX: anchors.joinLeftX * SCALE,
    joinRightX: anchors.joinRightX * SCALE,
    joinKind: anchors.joinKind,
  };
}

export function photoWarpInputFor(
  source: GarmentAsset,
  target: GarmentAsset,
  sourceImageId: string,
  namespace: string,
): PhotoWarpInput | undefined {
  const sourceRecord = recordFor(source.assetId);
  const targetRecord = recordFor(target.assetId);
  if (!sourceRecord || !targetRecord) return undefined;
  return {
    sourceImageId,
    sourceGuide: logicalGuide(sourceRecord),
    targetGuide: logicalGuide(targetRecord),
    source: logicalAnchor(sourceRecord),
    target: logicalAnchor(targetRecord),
    namespace,
  };
}
