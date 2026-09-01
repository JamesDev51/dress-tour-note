import personBaseUrl from "../../assets/dress-person-base.webp?url";
import { blobToDataUrl } from "./processFace";

export class DressPersonBaseLoadError extends Error {
  readonly name = "DressPersonBaseLoadError";

  constructor(cause?: unknown) {
    super("인물 베이스 이미지를 불러오지 못했어요.", { cause });
  }
}

let cachedPersonBase: Promise<string> | undefined;

export function loadDressPersonBase(): Promise<string> {
  cachedPersonBase ??= fetch(personBaseUrl)
    .then(async (response) => {
      if (!response.ok) throw new DressPersonBaseLoadError();
      return blobToDataUrl(await response.blob());
    })
    .catch((error: unknown) => {
      if (error instanceof DressPersonBaseLoadError) throw error;
      throw new DressPersonBaseLoadError(error);
    });
  return cachedPersonBase;
}
