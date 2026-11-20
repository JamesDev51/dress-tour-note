import { db } from "./database";
import type {
  Dress,
  DressOptionCategory,
  Id,
  LocalAsset,
  Shop,
  Tour,
  TourSnapshot,
} from "../types/domain";
import {
  DEFAULT_FACE_TRANSFORM,
  DRESS_OPTION_CATEGORIES,
} from "../types/domain";
import { requestPersistentStorage } from "../lib/storage/persist";
import {
  BASE_STYLING_ID,
  LOOK_FIELDS,
  MAX_STYLING_VARIANTS,
  cloneDressStyling,
  isDressLook,
  resolveDressLook,
  snapshotDressLook,
} from "../lib/dress/styling";
import {
  dressLookSnapshotSchema,
  sketchStrokesSchema,
} from "../lib/validation/schemas";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const automaticDressLabel = (order: number) =>
  `드레스 ${String(order + 1).padStart(2, "0")}`;
const requiredName = (value: string | undefined, label: string) => {
  const name = value?.trim();
  if (!name) throw new Error(`${label}을 입력해 주세요.`);
  if (name.length > 50)
    throw new Error(`${label}은 50자 이내로 입력해 주세요.`);
  return name;
};
const touchTour = (tourId: string) =>
  db.tours.update(tourId, { updatedAt: now(), lastOpenedAt: now() });

const normalizeCustomOptions = (
  customOptions: Dress["customOptions"],
): Partial<Record<DressOptionCategory, string>> | undefined => {
  const normalized: Partial<Record<DressOptionCategory, string>> = {};
  for (const category of DRESS_OPTION_CATEGORIES) {
    const note = customOptions?.[category]?.trim().slice(0, 80);
    if (note) normalized[category] = note;
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const mergeCustomOptions = (
  current: Dress["customOptions"],
  patch: NonNullable<Dress["customOptions"]>,
) => {
  const next = { ...current };
  for (const category of DRESS_OPTION_CATEGORIES) {
    if (!Object.hasOwn(patch, category)) continue;
    const note = patch[category]?.trim().slice(0, 80);
    if (note) next[category] = note;
    else delete next[category];
  }
  return normalizeCustomOptions(next);
};

const trimRecallText = (value: string | undefined) =>
  value?.trim() || undefined;

export async function createTour(
  input: Partial<Pick<Tour, "title" | "brideName" | "tourDate">> = {},
) {
  const t = now();
  const name = input.brideName?.trim();
  const tour: Tour = {
    id: id(),
    title: input.title?.trim() || `${name || "드레스"} 투어`,
    brideName: name || undefined,
    tourDate: input.tourDate,
    status: "draft",
    createdAt: t,
    updatedAt: t,
    lastOpenedAt: t,
  };
  await db.tours.add(tour);
  void requestPersistentStorage();
  return tour.id;
}
export async function patchTour(tourId: Id, patch: Partial<Tour>) {
  await db.tours.update(tourId, {
    ...patch,
    ...(Object.hasOwn(patch, "title")
      ? { title: requiredName(patch.title, "투어 제목") }
      : {}),
    updatedAt: now(),
    lastOpenedAt: now(),
  });
}
export async function addShop(
  tourId: Id,
  input: { name: string; appointmentAt?: string },
) {
  const order = await db.shops.where("tourId").equals(tourId).count();
  const t = now();
  const shop: Shop = {
    id: id(),
    tourId,
    name: requiredName(input.name, "드레스샵 이름"),
    order,
    appointmentAt: input.appointmentAt,
    createdAt: t,
    updatedAt: t,
  };
  await db.transaction("rw", db.shops, db.tours, async () => {
    await db.shops.add(shop);
    await touchTour(tourId);
  });
  return shop.id;
}
export async function patchShop(shopId: Id, patch: Partial<Shop>) {
  const next = {
    ...patch,
    ...(Object.hasOwn(patch, "name")
      ? { name: requiredName(patch.name, "드레스샵 이름") }
      : {}),
  };
  const shop = await db.shops.get(shopId);
  if (!shop) return;
  await db.transaction("rw", db.shops, db.tours, async () => {
    await db.shops.update(shopId, { ...next, updatedAt: now() });
    await touchTour(shop.tourId);
  });
}
export async function reorderShops(tourId: Id, orderedIds: Id[]) {
  await db.transaction("rw", db.shops, db.tours, async () => {
    for (let i = 0; i < orderedIds.length; i++)
      await db.shops.update(orderedIds[i], { order: i, updatedAt: now() });
    await touchTour(tourId);
  });
}
export async function deleteShop(shopId: Id) {
  const shop = await db.shops.get(shopId);
  if (!shop) return;
  await db.transaction("rw", db.shops, db.dresses, db.tours, async () => {
    await db.dresses.where("shopId").equals(shopId).delete();
    await db.shops.delete(shopId);
    const remaining = await db.shops
      .where("tourId")
      .equals(shop.tourId)
      .sortBy("order");
    for (let i = 0; i < remaining.length; i++)
      await db.shops.update(remaining[i].id, { order: i });
    await touchTour(shop.tourId);
  });
}
function defaultDress(tourId: string, shopId: string, order: number): Dress {
  const t = now();
  return {
    id: id(),
    tourId,
    shopId,
    order,
    label: automaticDressLabel(order),
    topStyle: "unknown",
    neckline: "unknown",
    silhouette: "unknown",
    waistline: "unknown",
    fabric: "unknown",
    color: "unknown",
    train: "unknown",
    details: [],
    quickTags: [],
    memo: "",
    isFavorite: false,
    createdAt: t,
    updatedAt: t,
  };
}
export async function addDress(shopId: Id, seed?: Partial<Dress>) {
  const shop = await db.shops.get(shopId);
  if (!shop) throw new Error("샵을 찾을 수 없습니다.");
  const order = await db.dresses.where("shopId").equals(shopId).count();
  const dress = {
    ...defaultDress(shop.tourId, shopId, order),
    ...seed,
    id: id(),
    order,
    label: seed?.label?.trim()
      ? requiredName(seed.label, "드레스 이름")
      : automaticDressLabel(order),
    isFavorite: seed?.isFavorite ?? false,
    memoryCue: trimRecallText(seed?.memoryCue),
    likedReason: trimRecallText(seed?.likedReason),
    concern: trimRecallText(seed?.concern),
    customOptions: normalizeCustomOptions(seed?.customOptions),
    createdAt: now(),
    updatedAt: now(),
  };
  if (seed?.sketchStrokes !== undefined)
    dress.sketchStrokes = sketchStrokesSchema.parse(seed.sketchStrokes);
  await db.transaction("rw", db.dresses, db.tours, async () => {
    await db.dresses.add(dress);
    await touchTour(shop.tourId);
  });
  return dress.id;
}
export async function duplicateDress(dressId: Id) {
  const d = await db.dresses.get(dressId);
  if (!d) throw new Error("드레스를 찾을 수 없습니다.");
  const {
    id: _,
    order: __,
    label: ___,
    createdAt: ____,
    updatedAt: _____,
    ...seed
  } = d;
  return addDress(d.shopId, {
    ...seed,
    ...cloneDressStyling(d),
    isFavorite: false,
  });
}
export async function patchDress(dressId: Id, patch: Partial<Dress>) {
  if (
    Object.hasOwn(patch, "stylingVariants") ||
    Object.hasOwn(patch, "preferredStylingId")
  )
    throw new Error("연출 전용 저장 기능을 사용해 주세요.");
  const { customOptions, memoryCue, likedReason, concern, ...rest } = patch;
  const next: Partial<Dress> = { ...rest };
  if (patch.sketchStrokes !== undefined)
    next.sketchStrokes = sketchStrokesSchema.parse(patch.sketchStrokes);
  if (Object.hasOwn(patch, "label"))
    next.label = requiredName(patch.label, "드레스 이름");
  if (Object.hasOwn(patch, "memoryCue"))
    next.memoryCue = trimRecallText(memoryCue);
  if (Object.hasOwn(patch, "likedReason"))
    next.likedReason = trimRecallText(likedReason);
  if (Object.hasOwn(patch, "concern")) next.concern = trimRecallText(concern);
  if (next.details && next.details.length > 4)
    throw new Error("장식과 세부 특징은 최대 4개까지 기록할 수 있어요.");
  await db.transaction("rw", db.dresses, db.tours, async () => {
    const d = await db.dresses.get(dressId);
    if (!d) return;
    if (customOptions) {
      next.customOptions = mergeCustomOptions(d.customOptions, customOptions);
    }
    await db.dresses.update(dressId, { ...next, updatedAt: now() });
    await touchTour(d.tourId);
  });
}

function stylingName(value: string) {
  const label = value.trim();
  if (!label || label.length > 30)
    throw new Error("연출 이름은 1~30자로 입력해 주세요.");
  return label;
}

async function updateStyling(
  dressId: Id,
  update: (dress: Dress) => Partial<Dress>,
) {
  await db.transaction("rw", db.dresses, db.tours, async () => {
    const dress = await db.dresses.get(dressId);
    if (!dress) throw new Error("드레스를 찾을 수 없습니다.");
    await db.dresses.update(dressId, { ...update(dress), updatedAt: now() });
    await touchTour(dress.tourId);
  });
}

export async function addDressStylingVariant(
  dressId: Id,
  sourceStylingId = BASE_STYLING_ID,
): Promise<Id> {
  const stylingId = id();
  await updateStyling(dressId, (dress) => {
    const current = dress.stylingVariants ?? [];
    if (current.length >= MAX_STYLING_VARIANTS)
      throw new Error("추가 연출은 최대 8개까지 기록할 수 있어요.");
    const source = resolveDressLook(dress, sourceStylingId);
    const snapshot = snapshotDressLook({
      ...source,
      memoryCue: undefined,
      likedReason: undefined,
      concern: undefined,
      quickTags: [],
      memo: "",
    });
    let number = 1;
    while (current.some(({ label }) => label === `연출 ${number}`)) number += 1;
    const timestamp = now();
    return {
      stylingVariants: [
        ...current,
        {
          id: stylingId,
          label: `연출 ${number}`,
          snapshot: dressLookSnapshotSchema.parse(snapshot),
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };
  });
  return stylingId;
}

export async function patchDressLook(
  dressId: Id,
  stylingId: string,
  patch: Partial<Dress>,
): Promise<void> {
  const commonFields = [
    "label",
    "rating",
    "isFavorite",
    "faceTransform",
    "coreRecordedAt",
  ] as const;
  const allowed = new Set<string>([...LOOK_FIELDS, ...commonFields]);
  if (Object.keys(patch).some((key) => !allowed.has(key)))
    throw new Error("수정할 수 없는 기록 항목이에요.");
  if (patch.details && patch.details.length > 4)
    throw new Error("디테일은 최대 4개까지 선택할 수 있어요.");
  await updateStyling(dressId, (dress) => {
    const current = resolveDressLook(dress, stylingId);
    const lookPatch = Object.fromEntries(
      LOOK_FIELDS.filter((key) => Object.hasOwn(patch, key)).map((key) => [
        key,
        patch[key],
      ]),
    );
    const commonPatch: Partial<Dress> = Object.fromEntries(
      commonFields
        .filter((key) => Object.hasOwn(patch, key))
        .map((key) => [key, patch[key]]),
    );
    if (Object.hasOwn(patch, "label"))
      commonPatch.label = requiredName(patch.label, "드레스 이름");
    if (dress.coreRecordedAt && Object.hasOwn(patch, "coreRecordedAt"))
      commonPatch.coreRecordedAt = dress.coreRecordedAt;
    if (patch.customOptions)
      lookPatch.customOptions = mergeCustomOptions(
        current.customOptions,
        patch.customOptions,
      );
    const snapshot = dressLookSnapshotSchema.parse({
      ...snapshotDressLook(current),
      ...lookPatch,
    });
    if (stylingId === BASE_STYLING_ID)
      return { ...commonPatch, ...snapshotDressLook(snapshot) };
    return {
      ...commonPatch,
      stylingVariants: dress.stylingVariants!.map((styling) =>
        styling.id === stylingId
          ? { ...styling, snapshot, updatedAt: now() }
          : styling,
      ),
    };
  });
}

export async function renameDressStylingVariant(
  dressId: Id,
  stylingId: string,
  label: string,
): Promise<void> {
  const name = stylingName(label);
  await updateStyling(dressId, (dress) => {
    if (stylingId === BASE_STYLING_ID || !isDressLook(dress, stylingId))
      throw new Error("연출을 찾을 수 없습니다.");
    return {
      stylingVariants: dress.stylingVariants!.map((styling) =>
        styling.id === stylingId
          ? { ...styling, label: name, updatedAt: now() }
          : styling,
      ),
    };
  });
}

export async function removeDressStylingVariant(
  dressId: Id,
  stylingId: string,
): Promise<void> {
  await updateStyling(dressId, (dress) => {
    if (stylingId === BASE_STYLING_ID)
      throw new Error("기본 연출은 삭제할 수 없어요.");
    if (!isDressLook(dress, stylingId))
      throw new Error("연출을 찾을 수 없습니다.");
    const variants = dress.stylingVariants!.filter(
      ({ id }) => id !== stylingId,
    );
    return {
      stylingVariants: variants.length ? variants : undefined,
      preferredStylingId:
        dress.preferredStylingId === stylingId
          ? undefined
          : dress.preferredStylingId,
    };
  });
}

export async function setPreferredStylingVariant(
  dressId: Id,
  stylingId: string,
): Promise<void> {
  await updateStyling(dressId, (dress) => {
    if (!isDressLook(dress, stylingId))
      throw new Error("연출을 찾을 수 없습니다.");
    return {
      preferredStylingId: stylingId === BASE_STYLING_ID ? undefined : stylingId,
    };
  });
}
export async function reorderDresses(shopId: Id, orderedIds: Id[]) {
  const shop = await db.shops.get(shopId);
  if (!shop) return;
  await db.transaction("rw", db.dresses, db.tours, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const dress = await db.dresses.get(orderedIds[i]);
      if (!dress || dress.shopId !== shopId) continue;
      await db.dresses.update(orderedIds[i], {
        order: i,
        ...(dress.label === automaticDressLabel(dress.order)
          ? { label: automaticDressLabel(i) }
          : {}),
        updatedAt: now(),
      });
    }
    await touchTour(shop.tourId);
  });
}
export async function deleteDress(dressId: Id) {
  const d = await db.dresses.get(dressId);
  if (!d) return;
  await db.transaction("rw", db.dresses, db.tours, async () => {
    await db.dresses.delete(dressId);
    const rest = await db.dresses
      .where("shopId")
      .equals(d.shopId)
      .sortBy("order");
    for (let i = 0; i < rest.length; i++)
      await db.dresses.update(rest[i].id, {
        order: i,
        ...(rest[i].label === automaticDressLabel(rest[i].order)
          ? { label: automaticDressLabel(i) }
          : {}),
      });
    await touchTour(d.tourId);
  });
}
export async function setFaceAsset(
  tourId: Id,
  asset: Omit<LocalAsset, "id" | "tourId" | "createdAt">,
) {
  const old = (await db.tours.get(tourId))?.faceAssetId;
  const local: LocalAsset = { ...asset, id: id(), tourId, createdAt: now() };
  await db.transaction("rw", db.assets, db.tours, db.dresses, async () => {
    await db.assets.add(local);
    await db.tours.update(tourId, { faceAssetId: local.id, updatedAt: now() });
    if (old) await db.assets.delete(old);
    const dresses = await db.dresses.where("tourId").equals(tourId).toArray();
    for (const d of dresses)
      if (!d.faceTransform)
        await db.dresses.update(d.id, {
          faceTransform: DEFAULT_FACE_TRANSFORM,
        });
  });
  return local.id;
}
export async function removeFaceAsset(tourId: Id) {
  const tour = await db.tours.get(tourId);
  if (!tour?.faceAssetId) return;
  await db.transaction("rw", db.assets, db.tours, db.dresses, async () => {
    await db.assets.delete(tour.faceAssetId!);
    await db.tours.update(tourId, { faceAssetId: undefined, updatedAt: now() });
    const ds = await db.dresses.where("tourId").equals(tourId).toArray();
    for (const d of ds)
      await db.dresses.update(d.id, { faceTransform: undefined });
  });
}
export async function getTourSnapshot(tourId: Id): Promise<TourSnapshot> {
  return db.transaction(
    "r",
    db.tours,
    db.shops,
    db.dresses,
    db.assets,
    async () => {
      const tour = await db.tours.get(tourId);
      if (!tour) throw new Error("투어를 찾을 수 없습니다.");
      const shops = (
        await db.shops.where("tourId").equals(tourId).toArray()
      ).sort((a, b) => a.order - b.order);
      const dresses = (
        await db.dresses.where("tourId").equals(tourId).toArray()
      ).sort((a, b) => a.order - b.order);
      const assets = await db.assets.where("tourId").equals(tourId).toArray();
      return { tour, shops, dresses, assets };
    },
  );
}
export async function deleteTour(tourId: Id) {
  await db.transaction(
    "rw",
    db.tours,
    db.shops,
    db.dresses,
    db.assets,
    async () => {
      await db.dresses.where("tourId").equals(tourId).delete();
      await db.shops.where("tourId").equals(tourId).delete();
      await db.assets.where("tourId").equals(tourId).delete();
      await db.tours.delete(tourId);
    },
  );
}
export async function deleteAllData() {
  await db.transaction(
    "rw",
    db.tours,
    db.shops,
    db.dresses,
    db.assets,
    db.meta,
    async () => {
      await Promise.all([
        db.tours.clear(),
        db.shops.clear(),
        db.dresses.clear(),
        db.assets.clear(),
        db.meta.clear(),
      ]);
    },
  );
}
export async function importSnapshot(
  snapshot: TourSnapshot,
  strategy: "copy" | "overwrite",
) {
  let { tour, shops, dresses, assets } = snapshot;
  const exists = await db.tours.get(tour.id);
  if (strategy === "copy" || (exists && strategy !== "overwrite")) {
    const newTourId = id();
    const assetMap = new Map<string, string>();
    assets = assets.map((a) => {
      const nid = id();
      assetMap.set(a.id, nid);
      return { ...a, id: nid, tourId: newTourId };
    });
    const shopMap = new Map<string, string>();
    shops = shops.map((s) => {
      const nid = id();
      shopMap.set(s.id, nid);
      return { ...s, id: nid, tourId: newTourId };
    });
    dresses = dresses.map((d) => ({
      ...d,
      ...cloneDressStyling(d),
      id: id(),
      tourId: newTourId,
      shopId: shopMap.get(d.shopId)!,
      faceTransform: d.faceTransform ? { ...d.faceTransform } : undefined,
    }));
    tour = {
      ...tour,
      id: newTourId,
      title: `${tour.title} (복사본)`,
      faceAssetId: tour.faceAssetId
        ? assetMap.get(tour.faceAssetId)
        : undefined,
      updatedAt: now(),
      lastOpenedAt: now(),
    };
  } else {
    tour = { ...tour, updatedAt: now(), lastOpenedAt: now() };
  }
  await db.transaction(
    "rw",
    db.tours,
    db.shops,
    db.dresses,
    db.assets,
    async () => {
      if (strategy === "overwrite" && exists) {
        await db.dresses.where("tourId").equals(tour.id).delete();
        await db.shops.where("tourId").equals(tour.id).delete();
        await db.assets.where("tourId").equals(tour.id).delete();
        await db.tours.delete(tour.id);
      }
      await db.tours.add(tour);
      if (shops.length) await db.shops.bulkAdd(shops);
      if (dresses.length) await db.dresses.bulkAdd(dresses);
      if (assets.length) await db.assets.bulkAdd(assets);
    },
  );
  return tour.id;
}
