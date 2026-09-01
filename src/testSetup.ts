import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { TextDecoder, TextEncoder } from 'node:util';

afterEach(() => cleanup());

if (!globalThis.TextEncoder) {
  Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder });
}
if (!globalThis.TextDecoder) {
  Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder });
}

if (!Blob.prototype.arrayBuffer) {
  Object.defineProperty(Blob.prototype, 'arrayBuffer', {
    configurable: true,
    value(this: Blob) {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error('Blob read failed'));
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(this);
      });
    },
  });
}
