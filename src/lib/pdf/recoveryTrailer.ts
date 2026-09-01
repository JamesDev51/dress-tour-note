import { db } from "../../db/database";
import { getTourSnapshot } from "../../db/repositories";
import type { ImportPreview } from "../../types/portable";
import { sha256Hex, toArrayBuffer } from "../image/processFace";
import {
  buildPortableBundle,
  parsePortableManifest,
  serializePortableBundle,
  verifyPortableFaceBytes,
  verifyPortableTourBytes,
} from "./portable";

const PREFIX = "%GUDRESS-RECOVERY-V1:";
const PREFIX_BYTES = new TextEncoder().encode(PREFIX);

type RecoveryEnvelopeV1 = {
  format: "gudress-fast-recovery";
  version: 1;
  manifest: string;
  tour: string;
  face?: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function lastIndexOfBytes(haystack: Uint8Array, needle: Uint8Array) {
  outer: for (let index = haystack.length - needle.length; index >= 0; index -= 1) {
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[index + offset] !== needle[offset]) continue outer;
    }
    return index;
  }
  return -1;
}

function concatBytes(...parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

export async function appendRecoveryTrailer(
  pdfBlob: Blob,
  tourId: string,
  includeFace: boolean,
) {
  const snapshot = await getTourSnapshot(tourId);
  const serialized = await serializePortableBundle(
    buildPortableBundle(snapshot, includeFace),
  );
  const envelope: RecoveryEnvelopeV1 = {
    format: "gudress-fast-recovery",
    version: 1,
    manifest: bytesToBase64(serialized.manifestBytes),
    tour: bytesToBase64(serialized.tourBytes),
    face: serialized.faceBytes ? bytesToBase64(serialized.faceBytes) : undefined,
  };
  const envelopeBytes = new TextEncoder().encode(JSON.stringify(envelope));
  const line = new TextEncoder().encode(
    `\n${PREFIX}${bytesToBase64(envelopeBytes)}\n`,
  );
  const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
  const output = concatBytes(pdfBytes, line);
  return new Blob([toArrayBuffer(output)], { type: "application/pdf" });
}

function extractEnvelope(fileBytes: Uint8Array): RecoveryEnvelopeV1 | undefined {
  const markerIndex = lastIndexOfBytes(fileBytes, PREFIX_BYTES);
  if (markerIndex < 0) return undefined;
  const payloadStart = markerIndex + PREFIX_BYTES.length;
  let payloadEnd = payloadStart;
  while (
    payloadEnd < fileBytes.length &&
    fileBytes[payloadEnd] !== 0x0a &&
    fileBytes[payloadEnd] !== 0x0d
  ) {
    payloadEnd += 1;
  }
  if (payloadEnd === payloadStart) throw new Error("PDF의 빠른 복원 데이터가 비어 있어요.");
  try {
    const encoded = new TextDecoder().decode(fileBytes.subarray(payloadStart, payloadEnd));
    const raw = JSON.parse(new TextDecoder().decode(base64ToBytes(encoded))) as RecoveryEnvelopeV1;
    if (raw.format !== "gudress-fast-recovery" || raw.version !== 1) {
      throw new Error("unsupported recovery trailer");
    }
    return raw;
  } catch {
    throw new Error("PDF의 빠른 복원 데이터가 손상됐어요.");
  }
}

export async function inspectRecoveryTrailer(file: File): Promise<ImportPreview | undefined> {
  if (file.size > 30 * 1024 * 1024) throw new Error("PDF는 30MB 이하만 불러올 수 있어요.");
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(fileBytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("PDF 파일이 아니에요.");
  }
  const envelope = extractEnvelope(fileBytes);
  if (!envelope) return undefined;

  let manifestBytes: Uint8Array;
  let tourBytes: Uint8Array;
  let faceBytes: Uint8Array | undefined;
  try {
    manifestBytes = base64ToBytes(envelope.manifest);
    tourBytes = base64ToBytes(envelope.tour);
    faceBytes = envelope.face ? base64ToBytes(envelope.face) : undefined;
  } catch {
    throw new Error("PDF의 빠른 복원 데이터가 손상됐어요.");
  }

  let manifest;
  try {
    manifest = parsePortableManifest(
      JSON.parse(new TextDecoder().decode(manifestBytes)) as unknown,
    );
  } catch {
    throw new Error("PDF의 복원 매니페스트가 손상됐어요.");
  }
  const payload = await verifyPortableTourBytes(manifest, tourBytes);
  const assetBytes = new Map<string, Uint8Array>();
  let faceWarning: string | undefined;

  const faceReference = payload.assets[0];
  if (manifest.faceAttachment && faceReference) {
    if (!faceBytes) {
      faceWarning = "얼굴 파일이 없어 드레스 기록만 복원할 수 있어요.";
    } else {
      try {
        await verifyPortableFaceBytes(manifest, faceBytes);
        const hash = await sha256Hex(faceBytes);
        if (
          hash !== faceReference.sha256 ||
          faceBytes.byteLength !== faceReference.byteLength
        ) {
          throw new Error("face asset mismatch");
        }
        assetBytes.set(faceReference.id, faceBytes);
      } catch {
        faceWarning = "얼굴 파일 검증에 실패해 드레스 기록만 복원할 수 있어요.";
      }
    }
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
    integrityVerified: !faceWarning,
    legacyFormat: false,
  };
}
