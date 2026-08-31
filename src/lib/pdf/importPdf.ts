import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFStream,
  PDFString,
} from "pdf-lib";
import type { LocalAsset, TourSnapshot } from "../../types/domain";
import type {
  ImportPreview,
  ImportStrategy,
  PortableTourV1,
} from "../../types/portable";
import { db } from "../../db/database";
import { importSnapshot } from "../../db/repositories";
import { sha256Hex, toArrayBuffer } from "../image/processFace";
import {
  LEGACY_PORTABLE_FILE_NAME,
  parsePortableManifest,
  parsePortablePayload,
  PORTABLE_MANIFEST_FILE_NAME,
  PORTABLE_TOUR_FILE_NAME,
  verifyPortableFaceBytes,
  verifyPortableTourBytes,
} from "./portable";

type PdfAttachment = { filename?: string; content: Uint8Array };
type PdfAttachmentEntry = [string, PdfAttachment];

function bytesToString(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

function collectNameArrays(node: PDFDict): PDFArray[] {
  const result: PDFArray[] = [];
  const namesKey = PDFName.of("Names");
  const kidsKey = PDFName.of("Kids");

  if (node.has(namesKey)) result.push(node.lookup(namesKey, PDFArray));
  if (node.has(kidsKey)) {
    const kids = node.lookup(kidsKey, PDFArray);
    for (let index = 0; index < kids.size(); index += 1) {
      result.push(...collectNameArrays(kids.lookup(index, PDFDict)));
    }
  }
  return result;
}

function readEmbeddedFileBytes(fileSpec: PDFDict) {
  const ef = fileSpec.lookup(PDFName.of("EF"), PDFDict);
  for (const key of ["UF", "F", "Unix", "Mac", "DOS"]) {
    const name = PDFName.of(key);
    if (!ef.has(name)) continue;
    const stream = ef.lookup(name, PDFStream) as PDFRawStream;
    return decodePDFRawStream(stream).decode();
  }
  throw new Error("PDF 첨부파일의 내용을 읽을 수 없어요.");
}

function decodeFileSpecName(fileSpec: PDFDict) {
  for (const key of ["UF", "F"]) {
    const value = fileSpec.get(PDFName.of(key));
    if (value instanceof PDFHexString || value instanceof PDFString) {
      return value.decodeText();
    }
  }
  return undefined;
}

function pushAttachment(
  entries: PdfAttachmentEntry[],
  seen: Set<string>,
  fileSpec: PDFDict,
  hintedName?: string,
) {
  const filename = hintedName || decodeFileSpecName(fileSpec);
  if (!filename || seen.has(filename)) return;
  entries.push([
    filename,
    { filename, content: readEmbeddedFileBytes(fileSpec) },
  ]);
  seen.add(filename);
}

function extractAttachments(pdf: PDFDocument): PdfAttachmentEntry[] {
  const entries: PdfAttachmentEntry[] = [];
  const seen = new Set<string>();
  const namesKey = PDFName.of("Names");
  const embeddedFilesKey = PDFName.of("EmbeddedFiles");

  // Standard embedded-file name tree. This is the primary location written by pdf-lib.
  if (pdf.catalog.has(namesKey)) {
    const names = pdf.catalog.lookup(namesKey, PDFDict);
    if (names.has(embeddedFilesKey)) {
      const embeddedFiles = names.lookup(embeddedFilesKey, PDFDict);
      for (const nameArray of collectNameArrays(embeddedFiles)) {
        for (let index = 0; index + 1 < nameArray.size(); index += 2) {
          try {
            const nameObject = nameArray.lookup(index);
            const hintedName =
              nameObject instanceof PDFHexString || nameObject instanceof PDFString
                ? nameObject.decodeText()
                : undefined;
            pushAttachment(
              entries,
              seen,
              nameArray.lookup(index + 1, PDFDict),
              hintedName,
            );
          } catch {
            // A malformed name-tree entry must not prevent the catalog AF fallback below.
          }
        }
      }
    }
  }

  // PDF 2.0 associated-files array. pdf-lib writes the same FileSpec refs here as well.
  // Reading both locations makes import resilient to readers that normalize or remove Names.
  const associatedFilesKey = PDFName.of("AF");
  if (pdf.catalog.has(associatedFilesKey)) {
    const associatedFiles = pdf.catalog.lookup(associatedFilesKey, PDFArray);
    for (let index = 0; index < associatedFiles.size(); index += 1) {
      try {
        pushAttachment(
          entries,
          seen,
          associatedFiles.lookup(index, PDFDict),
        );
      } catch {
        // Keep any valid attachments already collected from the other catalog location.
      }
    }
  }

  return entries;
}

function findAttachment(entries: PdfAttachmentEntry[], fileName: string) {
  return entries.find(
    ([key, value]) => key === fileName || value.filename === fileName,
  );
}

function parseJsonAttachment(entry: PdfAttachmentEntry, errorMessage: string) {
  try {
    return JSON.parse(bytesToString(entry[1].content)) as unknown;
  } catch {
    throw new Error(errorMessage);
  }
}

async function collectAssetBytes(
  payload: PortableTourV1,
  entries: PdfAttachmentEntry[],
  verifyManifestFace?: (bytes: Uint8Array) => Promise<void>,
) {
  const assetBytes = new Map<string, Uint8Array>();
  let faceWarning: string | undefined;

  for (const reference of payload.assets) {
    const entry = findAttachment(entries, reference.fileName);
    if (!entry) {
      faceWarning = "얼굴 파일이 없어 드레스 기록만 복원할 수 있어요.";
      continue;
    }

    const bytes = entry[1].content;
    try {
      if (verifyManifestFace) await verifyManifestFace(bytes);
      const hash = await sha256Hex(bytes);
      if (
        hash !== reference.sha256 ||
        bytes.byteLength !== reference.byteLength
      ) {
        throw new Error("face asset mismatch");
      }
      assetBytes.set(reference.id, bytes);
    } catch {
      faceWarning = "얼굴 파일 검증에 실패해 드레스 기록만 복원할 수 있어요.";
    }
  }

  return { assetBytes, faceWarning };
}

export async function inspectPortablePdf(file: File): Promise<ImportPreview> {
  if (file.size > 30 * 1024 * 1024)
    throw new Error("PDF는 30MB 이하만 불러올 수 있어요.");
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (bytesToString(head) !== "%PDF-") throw new Error("PDF 파일이 아니에요.");

  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(await file.arrayBuffer());
  } catch {
    throw new Error("파일을 읽을 수 없어요. 원본 PDF를 다시 선택해 주세요.");
  }

  const entries = extractAttachments(pdf);
  if (!entries.length) throw new Error("복원 가능한 그드레스 PDF가 아니에요.");

  let payload: PortableTourV1;
  let integrityVerified = false;
  let legacyFormat = false;
  let assetBytes = new Map<string, Uint8Array>();
  let faceWarning: string | undefined;

  const manifestEntry = findAttachment(entries, PORTABLE_MANIFEST_FILE_NAME);
  if (manifestEntry) {
    let manifest;
    try {
      manifest = parsePortableManifest(
        parseJsonAttachment(
          manifestEntry,
          "PDF의 복원 매니페스트가 손상됐어요.",
        ),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PDF의 복원 매니페스트가 손상됐어요."
      ) {
        throw error;
      }
      throw new Error("지원하지 않거나 손상된 그드레스 PDF예요.");
    }

    const tourEntry = findAttachment(entries, manifest.tourAttachment);
    if (!tourEntry) throw new Error("PDF의 투어 데이터 파일이 없어요.");
    payload = await verifyPortableTourBytes(manifest, tourEntry[1].content);

    const assets = await collectAssetBytes(
      payload,
      entries,
      manifest.faceAttachment
        ? (bytes) => verifyPortableFaceBytes(manifest, bytes)
        : undefined,
    );
    assetBytes = assets.assetBytes;
    faceWarning = assets.faceWarning;
    integrityVerified = !faceWarning;
  } else {
    const legacyEntry =
      findAttachment(entries, LEGACY_PORTABLE_FILE_NAME) ??
      findAttachment(entries, PORTABLE_TOUR_FILE_NAME);
    if (!legacyEntry) throw new Error("복원 가능한 그드레스 PDF가 아니에요.");

    let raw: unknown;
    try {
      raw = parseJsonAttachment(legacyEntry, "PDF의 복원 데이터가 손상됐어요.");
      payload = parsePortablePayload(raw);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PDF의 복원 데이터가 손상됐어요."
      ) {
        throw error;
      }
      throw new Error("지원하지 않거나 손상된 그드레스 PDF예요.");
    }
    const assets = await collectAssetBytes(payload, entries);
    assetBytes = assets.assetBytes;
    faceWarning = assets.faceWarning;
    legacyFormat = true;
  }

  return {
    payload,
    hasConflict: Boolean(await db.tours.get(payload.sourceTourId)),
    faceIncluded: payload.includeFace && assetBytes.size > 0,
    faceWarning,
    shopCount: payload.shops.length,
    dressCount: payload.dresses.length,
    favoriteCount: payload.dresses.filter((dress) => dress.isFavorite).length,
    assetBytes,
    integrityVerified,
    legacyFormat,
  };
}

export async function importPortablePreview(
  preview: ImportPreview,
  strategy: ImportStrategy,
) {
  const payload = preview.payload;
  const now = new Date().toISOString();
  let faceAssetId = payload.tour.faceAssetId;
  const assets: LocalAsset[] = [];

  for (const reference of payload.assets) {
    const bytes = preview.assetBytes.get(reference.id);
    if (!bytes) {
      if (faceAssetId === reference.id) faceAssetId = undefined;
      continue;
    }
    assets.push({
      id: reference.id,
      tourId: payload.tour.id,
      kind: "face",
      mimeType: reference.mimeType,
      blob: new Blob([toArrayBuffer(bytes)], { type: reference.mimeType }),
      width: reference.width,
      height: reference.height,
      byteLength: reference.byteLength,
      sha256: reference.sha256,
      createdAt: now,
    });
  }

  const snapshot: TourSnapshot = {
    tour: { ...payload.tour, faceAssetId, lastOpenedAt: now, updatedAt: now },
    shops: payload.shops.map((shop) => ({ ...shop })),
    dresses: payload.dresses.map((dress) =>
      faceAssetId ? { ...dress } : { ...dress, faceTransform: undefined },
    ),
    assets,
  };
  return importSnapshot(snapshot, strategy);
}

export async function importPortablePdf(file: File, strategy: ImportStrategy) {
  return importPortablePreview(await inspectPortablePdf(file), strategy);
}
