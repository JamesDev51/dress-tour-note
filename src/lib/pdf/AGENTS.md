# PORTABLE PDF PROTOCOL

## OVERVIEW

Recoverable and view-only PDF generation/import. This directory defines a versioned transfer protocol, not general-purpose PDF parsing.

## STRUCTURE

| File                                           | Role                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `portable.ts`                                  | Canonical JSON, manifest/payload creation, hashes, byte verification |
| `portableTrailer.ts`                           | Fast custom trailer append/inspection                                |
| `exportPdf.ts`                                 | A4 rendering, attachments, trailer, download/share                   |
| `importPdf.ts`                                 | Trailer/attachment inspection, preview, validation, restore          |
| `portable.test.ts`                             | Bundle and face-exclusion invariants                                 |
| `portableTrailer.test.ts`, `importPdf.test.ts` | Round-trip, corruption, compatibility checks                         |

## PROTOCOL CONTRACT

- Current payload is `gudress-portable-tour`, `schemaVersion: 1`.
- Current PDF envelope is `gudress-portable-pdf`, `formatVersion: 1`, app ID `kr.gudress.web`.
- Canonical serialization sorts object keys before hashing and embedding.
- Manifest tour and face hashes are SHA-256 and must match exact attachment bytes.
- Recoverable PDFs carry manifest/tour data and optionally one face asset; view-only PDFs carry none.
- Face exclusion removes the asset ref, tour `faceAssetId`, every dress `faceTransform`, and attachment bytes.
- `backStyle` remains optional to accept PDFs produced before that v1 field was introduced.
- Import validates untrusted JSON through Zod before it reaches `src/db/importSnapshot`.

## CONVENTIONS

- Keep shared protocol types in `src/types/portable.ts` and schemas in `src/lib/validation/schemas.ts` synchronized.
- Prefer the fast trailer path, while retaining valid attachment-based recovery implemented here.
- Lazy-load PDF implementation from feature pages; these modules materially affect bundle size.
- User-facing corruption/version errors remain specific and Korean.
- Copy import must preserve content while remapping identity; overwrite must replace the whole aggregate.

## ANTI-PATTERNS

- Do not import arbitrary PDFs, infer records from rendered pages, or add OCR recovery.
- Do not accept a payload whose manifest, schema version, hashes, filenames, or face metadata disagree.
- Do not silently change v1 constants, filenames, canonicalization, or trailer layout.
- Do not leak face bytes into view-only or face-excluded exports.
- Do not make visual PDF layout the source of truth for recoverable data.

## VALIDATION

- Run `npm test -- src/lib/pdf` for protocol and import tests.
- Cover round-trip, tampered hashes, missing/mismatched face data, legacy v1 payloads, and view-only rejection as applicable.
- Run `npm run typecheck` and `npm run build`; PDF work also requires the Playwright export/import journey.
