# Option catalog provenance

This directory contains 61 local-only bridal option reference images. Every catalog image is a 512×512 WebP and is intended only for side-by-side option comparison in the mobile editor.

## Generated expansion

On 2026-09-04, 52 options were generated with Codex's built-in image generation tool, one call per final option. All prompts used the `product-mockup` use case and locked the category-specific crop, a warm light-gray studio background, soft diffused lighting, an ivory garment or textile sample, and these exclusions: people, faces, hands, text, labels, logos, watermarks, remote references, unrelated props, dramatic shadows, and alternate views.

Generated choices: all nine `top` choices, all eight `neckline` choices, all seven `silhouette` choices, `fabric/tulle`, `fabric/glitterBeaded`, all four `waistline` choices, all six `back` choices, all four `train` choices, and all twelve `detail` choices. The complete `top`, `neckline`, `silhouette`, and `detail` sets were regenerated together after contact-sheet review. Silhouettes use the same full-length mannequin scale, straight-on crop, and studio background. Details use one isolated product-specimen treatment with a common background and lighting, varying the crop only as needed to make the named detail legible.

The generated PNG sources remain in the local Codex generated-image cache identified in the task evidence. Project copies were center-cropped, resized to 512×512, and encoded as WebP at quality 78 using Pillow 10.2.0. The cache is not referenced at runtime.

## Retained catalog

The nine pre-existing catalog compositions that met the final comparison contract were retained: six `fabric` and three `color` choices. Two retained fabric files (`lace` and `ornateBeaded`) were lossily re-encoded at quality 76 solely to meet the 120 KiB per-file limit.

`manifest.json` records byte sizes, dimensions, MIME type, and SHA-256 for every known choice. `contact-sheet.png` is review-only and is not a selectable option image.

## Retained-image usage rights

The nine retained compositions are recorded below as original local project assets or generated/owned project material with permission for use in this project. This is a project usage statement, not an external-license attribution or a legal guarantee. No third-party source URL or author is asserted. The project team is responsible for confirming and maintaining this usage basis for continued project use.

```json
{
  "recordVersion": 1,
  "recordedAt": "2026-09-04",
  "retention": {
    "date": "2026-09-04",
    "scope": "The nine pre-existing fabric and color compositions retained in the local option catalog after the comparison-contract review.",
    "count": 9
  },
  "rightsBasis": {
    "basis": "original-local-project-asset-or-generated-owned-project-material",
    "permission": "permission for use in this project",
    "thirdPartySourceUrls": [],
    "authors": [],
    "trademarksPresent": false,
    "personLikenessPresent": false,
    "projectResponsibility": "The project team is responsible for confirming and maintaining this usage basis for continued project use."
  },
  "retainedImages": [
    {
      "path": "color/champagne.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "color/ivory.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "color/pureWhite.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "fabric/floral3D.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "fabric/lace.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "fabric/mikadoSatin.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "fabric/organzaChiffon.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "fabric/ornateBeaded.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    },
    {
      "path": "fabric/subtleBeaded.webp",
      "origin": "original-local-project-asset-or-generated-owned-project-material",
      "usageRightsBasis": "permission for use in this project"
    }
  ]
}
```
