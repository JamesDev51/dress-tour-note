import { z } from 'zod';
import {
  BACK_STYLES,
  DRESS_COLORS,
  DRESS_DETAILS,
  FABRICS,
  NECKLINES,
  QUICK_TAGS,
  SILHOUETTES,
  TOP_STYLES,
  TRAINS,
  WAISTLINES,
} from '../../types/domain';

const iso = z.string().min(10);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const faceTransformSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
  scale: z.number().min(0.5).max(3),
  rotation: z.number().min(-15).max(15),
});
export const tourSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(50),
  brideName: z.string().max(30).optional(),
  tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['draft', 'completed']),
  faceAssetId: z.string().optional(),
  createdAt: iso,
  updatedAt: iso,
  lastOpenedAt: iso,
  lastExportedAt: iso.optional(),
});
export const shopSchema = z.object({
  id: z.string().min(1),
  tourId: z.string().min(1),
  name: z.string().min(1).max(50),
  order: z.number().int().nonnegative(),
  appointmentAt: iso.optional(),
  consultant: z.string().max(100).optional(),
  memo: z.string().max(1000).optional(),
  createdAt: iso,
  updatedAt: iso,
});
export const dressSchema = z.object({
  id: z.string().min(1),
  tourId: z.string().min(1),
  shopId: z.string().min(1),
  order: z.number().int().nonnegative(),
  label: z.string().min(1).max(50),
  topStyle: z.enum(TOP_STYLES),
  neckline: z.enum(NECKLINES),
  silhouette: z.enum(SILHOUETTES),
  waistline: z.enum(WAISTLINES),
  backStyle: z.enum(BACK_STYLES).optional(),
  fabric: z.enum(FABRICS),
  color: z.enum(DRESS_COLORS),
  train: z.enum(TRAINS),
  details: z.array(z.enum(DRESS_DETAILS)).max(4),
  quickTags: z.array(z.enum(QUICK_TAGS)),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  memo: z.string().max(1000),
  isFavorite: z.boolean(),
  faceTransform: faceTransformSchema.optional(),
  createdAt: iso,
  updatedAt: iso,
});
export const portableAssetRefSchema = z.object({
  id: z.string(),
  kind: z.literal('face'),
  fileName: z.string().min(1),
  mimeType: z.enum(['image/webp', 'image/jpeg']),
  byteLength: z.number().int().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  sha256,
});
export const portableTourV1Schema = z
  .object({
    format: z.literal('gudress-portable-tour'),
    schemaVersion: z.literal(1),
    appVersion: z.string(),
    exportId: z.string(),
    exportedAt: iso,
    sourceTourId: z.string(),
    includeFace: z.boolean(),
    tour: tourSchema.omit({ lastOpenedAt: true, lastExportedAt: true }),
    shops: z.array(shopSchema).max(100),
    dresses: z.array(dressSchema).max(500),
    assets: z.array(portableAssetRefSchema).max(1),
  })
  .superRefine((value, ctx) => {
    const shopIds = new Set(value.shops.map((shop) => shop.id));
    const dressIds = new Set<string>();
    if (value.sourceTourId !== value.tour.id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'source tourId mismatch' });
    for (const shop of value.shops) if (shop.tourId !== value.tour.id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'shop tourId mismatch' });
    for (const dress of value.dresses) {
      if (dressIds.has(dress.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'duplicate dress id' });
      dressIds.add(dress.id);
      if (dress.tourId !== value.tour.id || !shopIds.has(dress.shopId)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'dress reference mismatch' });
    }
    const faceRef = value.tour.faceAssetId;
    if (value.includeFace !== Boolean(faceRef && value.assets.some((asset) => asset.id === faceRef))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'face reference mismatch' });
    }
  });
export const portableManifestV1Schema = z
  .object({
    appId: z.literal('kr.gudress.web'),
    format: z.literal('gudress-portable-pdf'),
    formatVersion: z.literal(1),
    schemaVersion: z.literal(1),
    createdAt: iso,
    tourAttachment: z.literal('gudress-tour.json'),
    faceAttachment: z.string().min(1).optional(),
    tourSha256: sha256,
    faceSha256: sha256.nullable(),
    generator: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.faceAttachment) !== Boolean(value.faceSha256)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'manifest face reference mismatch' });
  });
