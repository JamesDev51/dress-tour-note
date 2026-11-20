import { z } from "zod";
import {
  BACK_STYLES,
  BACK_CLOSURES,
  DRESS_COLORS,
  DRESS_DETAILS,
  FABRICS,
  LOWER_FABRIC_STARTS,
  MAX_SKETCH_STROKES,
  MAX_SKETCH_POINTS,
  SKETCH_PEN_WIDTHS,
  NECKLINES,
  QUICK_TAGS,
  SILHOUETTES,
  TOP_STYLES,
  TRAINS,
  WAISTLINES,
} from "../../types/domain";

const iso = z.string().min(10);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
// Keep portable/storage limits aligned with the editor's UTF-16 maxLength.
const textWithMaxLength = (schema: z.ZodString, maxLength: number) =>
  schema.refine((value) => value.length <= maxLength, {
    error: `최대 ${maxLength}자까지 입력할 수 있어요.`,
  });
export const faceTransformSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
  scale: z.number().min(0.5).max(3),
  rotation: z.number().min(-15).max(15),
});
const customOptionNoteSchema = textWithMaxLength(z.string().trim().min(1), 80);
const optionalRecallTextSchema = (maxLength: number) =>
  textWithMaxLength(z.string().trim(), maxLength)
    .transform((value) => value || undefined)
    .optional();
const customOptionsSchema = z.strictObject({
  top: customOptionNoteSchema.optional(),
  neckline: customOptionNoteSchema.optional(),
  silhouette: customOptionNoteSchema.optional(),
  fabric: customOptionNoteSchema.optional(),
  color: customOptionNoteSchema.optional(),
  waistline: customOptionNoteSchema.optional(),
  backStyle: customOptionNoteSchema.optional(),
  train: customOptionNoteSchema.optional(),
  details: customOptionNoteSchema.optional(),
});
export const tourSchema = z.object({
  id: z.string().min(1),
  title: textWithMaxLength(z.string().min(1), 50),
  brideName: textWithMaxLength(z.string(), 30).optional(),
  tourDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.enum(["draft", "completed"]),
  faceAssetId: z.string().optional(),
  createdAt: iso,
  updatedAt: iso,
  lastOpenedAt: iso,
  lastExportedAt: iso.optional(),
});
export const shopSchema = z.object({
  id: z.string().min(1),
  tourId: z.string().min(1),
  name: textWithMaxLength(z.string().min(1), 50),
  order: z.number().int().nonnegative(),
  appointmentAt: iso.optional(),
  consultant: textWithMaxLength(z.string(), 100).optional(),
  memo: textWithMaxLength(z.string(), 1000).optional(),
  createdAt: iso,
  updatedAt: iso,
});
const coordinate = z.number().min(0).max(1);
export const sketchStrokesSchema = z
  .array(
    z.strictObject({
      width: z.literal(SKETCH_PEN_WIDTHS),
      points: z
        .array(z.tuple([coordinate, coordinate]))
        .min(1)
        .max(MAX_SKETCH_POINTS),
    }),
  )
  .min(1)
  .max(MAX_SKETCH_STROKES)
  .optional();
const baseDressSchema = z.object({
  id: z.string().min(1),
  tourId: z.string().min(1),
  shopId: z.string().min(1),
  order: z.number().int().nonnegative(),
  label: textWithMaxLength(z.string().min(1), 50),
  topStyle: z.enum(TOP_STYLES),
  neckline: z.enum(NECKLINES),
  silhouette: z.enum(SILHOUETTES),
  waistline: z.enum(WAISTLINES),
  backStyle: z.enum(BACK_STYLES).optional(),
  backClosure: z.enum(BACK_CLOSURES).optional(),
  fabric: z.enum(FABRICS),
  upperFabric: z.enum(FABRICS).optional(),
  lowerFabric: z.enum(FABRICS).optional(),
  lowerFabricStart: z.enum(LOWER_FABRIC_STARTS).optional(),
  sketchStrokes: sketchStrokesSchema,
  color: z.enum(DRESS_COLORS),
  train: z.enum(TRAINS),
  details: z.array(z.enum(DRESS_DETAILS)).max(4),
  quickTags: z.array(z.enum(QUICK_TAGS)),
  rating: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .optional(),
  memoryCue: optionalRecallTextSchema(80),
  likedReason: optionalRecallTextSchema(160),
  concern: optionalRecallTextSchema(160),
  memo: textWithMaxLength(z.string(), 1000),
  isFavorite: z.boolean(),
  coreRecordedAt: z.iso.datetime().optional(),
  faceTransform: faceTransformSchema.optional(),
  customOptions: customOptionsSchema.optional(),
  createdAt: iso,
  updatedAt: iso,
});
export const dressLookSnapshotSchema = z.strictObject(
  baseDressSchema.pick({
    topStyle: true,
    neckline: true,
    silhouette: true,
    waistline: true,
    backStyle: true,
    backClosure: true,
    fabric: true,
    upperFabric: true,
    lowerFabric: true,
    lowerFabricStart: true,
    sketchStrokes: true,
    color: true,
    train: true,
    details: true,
    customOptions: true,
    memoryCue: true,
    likedReason: true,
    concern: true,
    memo: true,
    quickTags: true,
  }).shape,
);
export const stylingVariantSchema = z.strictObject({
  id: z
    .string()
    .min(1)
    .refine((id) => id !== "base", "reserved styling id"),
  label: textWithMaxLength(z.string().trim().min(1), 30),
  snapshot: dressLookSnapshotSchema,
  createdAt: iso,
  updatedAt: iso,
});
export const dressSchema = baseDressSchema
  .extend({
    stylingVariants: z.array(stylingVariantSchema).max(8).optional(),
    preferredStylingId: z.string().min(1).optional(),
  })
  .superRefine((dress, ctx) => {
    const ids = (dress.stylingVariants ?? []).map(({ id }) => id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "duplicate styling id",
      });
    if (dress.preferredStylingId && !ids.includes(dress.preferredStylingId))
      ctx.addIssue({
        code: "custom",
        message: "preferred styling reference mismatch",
      });
  });
export const portableAssetRefSchema = z.object({
  id: z.string(),
  kind: z.literal("face"),
  fileName: z.string().min(1),
  mimeType: z.enum(["image/webp", "image/jpeg"]),
  byteLength: z.number().int().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  sha256,
});
function validateTourReferences(
  value: {
    sourceTourId: string;
    tour: { id: string; faceAssetId?: string };
    shops: { id: string; tourId: string }[];
    dresses: { id: string; tourId: string; shopId: string }[];
    includeFace: boolean;
    assets: { id: string }[];
  },
  ctx: z.RefinementCtx,
) {
  const shopIds = new Set(value.shops.map((shop) => shop.id));
  const dressIds = new Set<string>();
  if (value.sourceTourId !== value.tour.id)
    ctx.addIssue({
      code: "custom",
      message: "source tourId mismatch",
    });
  for (const shop of value.shops)
    if (shop.tourId !== value.tour.id)
      ctx.addIssue({
        code: "custom",
        message: "shop tourId mismatch",
      });
  for (const dress of value.dresses) {
    if (dressIds.has(dress.id))
      ctx.addIssue({
        code: "custom",
        message: "duplicate dress id",
      });
    dressIds.add(dress.id);
    if (dress.tourId !== value.tour.id || !shopIds.has(dress.shopId))
      ctx.addIssue({
        code: "custom",
        message: "dress reference mismatch",
      });
  }
  const faceRef = value.tour.faceAssetId;
  if (
    value.includeFace !==
    Boolean(faceRef && value.assets.some((asset) => asset.id === faceRef))
  ) {
    ctx.addIssue({
      code: "custom",
      message: "face reference mismatch",
    });
  }
}

function hasRegionalMaterials(dress: {
  upperFabric?: unknown;
  lowerFabric?: unknown;
  stylingVariants?: {
    snapshot: { upperFabric?: unknown; lowerFabric?: unknown };
  }[];
}) {
  return (
    dress.upperFabric !== undefined ||
    dress.lowerFabric !== undefined ||
    (dress.stylingVariants ?? []).some(
      ({ snapshot }) =>
        snapshot.upperFabric !== undefined ||
        snapshot.lowerFabric !== undefined,
    )
  );
}

function hasMaterialStart(dress: {
  lowerFabricStart?: unknown;
  stylingVariants?: { snapshot: { lowerFabricStart?: unknown } }[];
}) {
  return (
    dress.lowerFabricStart !== undefined ||
    (dress.stylingVariants ?? []).some(
      ({ snapshot }) => snapshot.lowerFabricStart !== undefined,
    )
  );
}

const legacyDressSchema = dressSchema.refine(
  (dress) =>
    dress.sketchStrokes === undefined &&
    !dress.stylingVariants?.some(
      ({ snapshot }) => snapshot.sketchStrokes !== undefined,
    ),
  "sketch strokes require schema version 6",
);

export const portableTourV1Schema = z
  .object({
    format: z.literal("gudress-portable-tour"),
    schemaVersion: z.literal(1),
    appVersion: z.string(),
    exportId: z.string(),
    exportedAt: iso,
    sourceTourId: z.string(),
    includeFace: z.boolean(),
    tour: tourSchema.omit({ lastOpenedAt: true, lastExportedAt: true }),
    shops: z.array(shopSchema).max(100),
    dresses: z
      .array(
        baseDressSchema.extend({
          backClosure: z.never().optional(),
          upperFabric: z.never().optional(),
          lowerFabric: z.never().optional(),
          lowerFabricStart: z.never().optional(),
          sketchStrokes: z.never().optional(),
        }),
      )
      .max(500),
    assets: z.array(portableAssetRefSchema).max(1),
  })
  .superRefine(validateTourReferences);
export const portableTourV2Schema = z
  .object({
    ...portableTourV1Schema.shape,
    schemaVersion: z.literal(2),
    dresses: z
      .array(
        legacyDressSchema.refine(
          (dress) =>
            dress.backClosure === undefined &&
            !hasRegionalMaterials(dress) &&
            !hasMaterialStart(dress) &&
            !(dress.stylingVariants ?? []).some(
              ({ snapshot }) => snapshot.backClosure !== undefined,
            ),
          "back closure requires schema version 3",
        ),
      )
      .max(500),
  })
  .superRefine(validateTourReferences);
export const portableTourV3Schema = z
  .object({
    ...portableTourV1Schema.shape,
    schemaVersion: z.literal(3),
    dresses: z
      .array(
        legacyDressSchema.refine(
          (dress) => !hasRegionalMaterials(dress) && !hasMaterialStart(dress),
          "regional materials require schema version 4",
        ),
      )
      .max(500),
  })
  .superRefine(validateTourReferences);
export const portableTourV4Schema = z
  .object({
    ...portableTourV1Schema.shape,
    schemaVersion: z.literal(4),
    dresses: z
      .array(
        legacyDressSchema.refine(
          (dress) => !hasMaterialStart(dress),
          "material start requires schema version 5",
        ),
      )
      .max(500),
  })
  .superRefine(validateTourReferences);
export const portableTourV5Schema = z
  .object({
    ...portableTourV1Schema.shape,
    schemaVersion: z.literal(5),
    dresses: z.array(legacyDressSchema).max(500),
  })
  .superRefine(validateTourReferences);
export const portableTourV6Schema = z
  .object({
    ...portableTourV1Schema.shape,
    schemaVersion: z.literal(6),
    dresses: z.array(dressSchema).max(500),
  })
  .superRefine(validateTourReferences);
function validateManifestFace(
  value: { faceAttachment?: string; faceSha256: string | null },
  ctx: z.RefinementCtx,
) {
  if (Boolean(value.faceAttachment) !== Boolean(value.faceSha256))
    ctx.addIssue({
      code: "custom",
      message: "manifest face reference mismatch",
    });
}

export const portableManifestV1Schema = z
  .object({
    appId: z.literal("kr.gudress.web"),
    format: z.literal("gudress-portable-pdf"),
    formatVersion: z.literal(1),
    schemaVersion: z.literal(1),
    createdAt: iso,
    tourAttachment: z.literal("gudress-tour.json"),
    faceAttachment: z.string().min(1).optional(),
    tourSha256: sha256,
    faceSha256: sha256.nullable(),
    generator: z.string().min(1),
  })
  .superRefine(validateManifestFace);
export const portableManifestV2Schema = z
  .object({
    ...portableManifestV1Schema.shape,
    schemaVersion: z.literal(2),
  })
  .superRefine(validateManifestFace);

export const portableManifestV3Schema = z
  .object({ ...portableManifestV1Schema.shape, schemaVersion: z.literal(3) })
  .superRefine(validateManifestFace);

export const portableManifestV4Schema = z
  .object({ ...portableManifestV1Schema.shape, schemaVersion: z.literal(4) })
  .superRefine(validateManifestFace);

export const portableManifestV5Schema = z
  .object({ ...portableManifestV1Schema.shape, schemaVersion: z.literal(5) })
  .superRefine(validateManifestFace);

export const portableManifestV6Schema = z
  .object({ ...portableManifestV1Schema.shape, schemaVersion: z.literal(6) })
  .superRefine(validateManifestFace);
