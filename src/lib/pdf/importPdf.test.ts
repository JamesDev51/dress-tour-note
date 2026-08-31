import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import type { TourSnapshot } from '../../types/domain';
import { sha256Hex } from '../image/processFace';
import { inspectPortablePdf } from './importPdf';
import {
  buildPortableBundle,
  PORTABLE_MANIFEST_FILE_NAME,
  serializePortableBundle,
} from './portable';

const now = '2026-08-31T00:00:00.000Z';

function snapshot(): TourSnapshot {
  return {
    tour: {
      id: 'tour-roundtrip',
      title: 'PDF 왕복 테스트',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    },
    shops: [
      {
        id: 'shop-roundtrip',
        tourId: 'tour-roundtrip',
        name: '테스트 브라이덜',
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    dresses: [
      {
        id: 'dress-roundtrip',
        tourId: 'tour-roundtrip',
        shopId: 'shop-roundtrip',
        order: 0,
        label: 'Dress 01',
        topStyle: 'offShoulder',
        neckline: 'sweetheart',
        silhouette: 'aLine',
        waistline: 'natural',
        backStyle: 'buttonBack',
        fabric: 'lace',
        color: 'ivory',
        train: 'chapel',
        details: [],
        quickTags: ['신부 픽'],
        memo: '왕복 보존 메모',
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    assets: [],
  };
}

function fileFrom(bytes: Uint8Array, name = 'gudress.pdf') {
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new File([arrayBuffer], name, { type: 'application/pdf' });
}

async function makePortablePdf(source: TourSnapshot, includeFace: boolean) {
  const serialized = await serializePortableBundle(
    buildPortableBundle(source, includeFace),
  );
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  await pdf.attach(serialized.manifestBytes, PORTABLE_MANIFEST_FILE_NAME, {
    mimeType: 'application/json',
  });
  await pdf.attach(serialized.tourBytes, serialized.manifest.tourAttachment, {
    mimeType: 'application/json',
  });
  if (serialized.faceBytes && serialized.manifest.faceAttachment) {
    await pdf.attach(serialized.faceBytes, serialized.manifest.faceAttachment, {
      mimeType: 'image/webp',
    });
  }
  return fileFrom(await pdf.save());
}

describe('inspectPortablePdf', () => {
  it('reads the manifest and tour attachment written by pdf-lib', async () => {
    const result = await inspectPortablePdf(await makePortablePdf(snapshot(), false));
    expect(result.snapshot.tour.title).toBe('PDF 왕복 테스트');
    expect(result.snapshot.dresses[0].memo).toBe('왕복 보존 메모');
    expect(result.snapshot.assets).toHaveLength(0);
  });

  it('round-trips the optional local face attachment', async () => {
    const source = snapshot();
    const faceBytes = new TextEncoder().encode('test-face-bytes');
    const faceBlob = new Blob([faceBytes], { type: 'image/webp' });
    source.tour.faceAssetId = 'face-roundtrip';
    source.dresses[0].faceTransform = { x: 0.25, y: -0.1, scale: 1.3, rotation: 2 };
    source.assets.push({
      id: 'face-roundtrip',
      tourId: source.tour.id,
      kind: 'face',
      mimeType: 'image/webp',
      blob: faceBlob,
      width: 20,
      height: 20,
      byteLength: faceBytes.byteLength,
      sha256: await sha256Hex(faceBytes),
      createdAt: now,
    });

    const result = await inspectPortablePdf(await makePortablePdf(source, true));
    expect(result.snapshot.assets).toHaveLength(1);
    expect(result.snapshot.tour.faceAssetId).toBe('face-roundtrip');
    expect(result.snapshot.dresses[0].faceTransform?.scale).toBe(1.3);
    expect(await result.snapshot.assets[0].blob.text()).toBe('test-face-bytes');
  });

  it('rejects a normal PDF without the recovery manifest', async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 300]);
    await expect(inspectPortablePdf(fileFrom(await pdf.save(), 'view-only.pdf'))).rejects.toThrow(
      '복원 가능한 그드레스 PDF가 아니에요.',
    );
  });
});
