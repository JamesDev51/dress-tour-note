export function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array | Blob) {
  const buffer =
    data instanceof Blob
      ? await data.arrayBuffer()
      : data instanceof Uint8Array
        ? toArrayBuffer(data)
        : data;
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
