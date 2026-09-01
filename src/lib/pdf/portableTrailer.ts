import type { PortableSerializedFiles, PortableTourV1 } from '../../types/portable';
import {
  parsePortableManifest,
  verifyPortableFaceBytes,
  verifyPortableTourBytes,
} from './portable';

const START_MARKER = new TextEncoder().encode('\n%GUDRESS-PORTABLE-V1\n');
const END_MARKER = new TextEncoder().encode('\n%GUDRESS-END\n');

type TrailerEnvelope = {
  version: 1;
  manifest: unknown;
  tourBase64: string;
  faceBase64?: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
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
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

export function appendPortableTrailer(
  pdfBytes: Uint8Array,
  serialized: PortableSerializedFiles,
) {
  const envelope: TrailerEnvelope = {
    version: 1,
    manifest: serialized.manifest,
    tourBase64: bytesToBase64(serialized.tourBytes),
    faceBase64: serialized.faceBytes
      ? bytesToBase64(serialized.faceBytes)
      : undefined,
  };
  const envelopeBytes = new TextEncoder().encode(JSON.stringify(envelope));
  return concatBytes(pdfBytes, START_MARKER, envelopeBytes, END_MARKER);
}

export async function inspectPortableTrailer(bytes: Uint8Array): Promise<
  | {
      payload: PortableTourV1;
      assetBytes: Map<string, Uint8Array>;
      faceWarning?: string;
      integrityVerified: boolean;
    }
  | undefined
> {
  const start = lastIndexOfBytes(bytes, START_MARKER);
  if (start < 0) return undefined;
  const payloadStart = start + START_MARKER.length;
  const endRelative = lastIndexOfBytes(bytes.subarray(payloadStart), END_MARKER);
  if (endRelative < 0) throw new Error('PDF의 빠른 복원 데이터가 손상됐어요.');

  let envelope: TrailerEnvelope;
  try {
    envelope = JSON.parse(
      new TextDecoder().decode(bytes.subarray(payloadStart, payloadStart + endRelative)),
    ) as TrailerEnvelope;
  } catch {
    throw new Error('PDF의 빠른 복원 데이터를 읽을 수 없어요.');
  }
  if (envelope.version !== 1 || !envelope.tourBase64) {
    throw new Error('지원하지 않는 그드레스 PDF 버전이에요.');
  }

  const manifest = parsePortableManifest(envelope.manifest);
  const tourBytes = base64ToBytes(envelope.tourBase64);
  const payload = await verifyPortableTourBytes(manifest, tourBytes);
  const assetBytes = new Map<string, Uint8Array>();
  let faceWarning: string | undefined;

  if (manifest.faceAttachment) {
    if (!envelope.faceBase64) {
      faceWarning = '얼굴 파일이 없어 드레스 기록만 복원할 수 있어요.';
    } else {
      const faceBytes = base64ToBytes(envelope.faceBase64);
      try {
        await verifyPortableFaceBytes(manifest, faceBytes);
        const faceReference = payload.assets[0];
        if (faceReference) assetBytes.set(faceReference.id, faceBytes);
      } catch {
        faceWarning = '얼굴 파일 검증에 실패해 드레스 기록만 복원할 수 있어요.';
      }
    }
  }

  return {
    payload,
    assetBytes,
    faceWarning,
    integrityVerified: !faceWarning,
  };
}
