import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { LocalAsset, TourSnapshot } from '../../types/domain';
import type { ImportPreview, ImportStrategy, PortableTourV1 } from '../../types/portable';
import { db } from '../../db/database';
import { importSnapshot } from '../../db/repositories';
import { sha256Hex, toArrayBuffer } from '../image/processFace';
import {
  LEGACY_PORTABLE_FILE_NAME,
  parsePortableManifest,
  parsePortablePayload,
  PORTABLE_MANIFEST_FILE_NAME,
  PORTABLE_TOUR_FILE_NAME,
  verifyPortableFaceBytes,
  verifyPortableTourBytes,
} from './portable';

type PdfAttachment = { filename?: string; content: Uint8Array };
type PdfAttachmentEntry = [string, PdfAttachment];

function bytesToString(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

function findAttachment(entries: PdfAttachmentEntry[], fileName: string) {
  return entries.find(([key, value]) => key === fileName || value.filename === fileName);
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
      faceWarning = 'ì–¼êµ´ íŒŒì¼ì´ ì—†ì–´ ë“œë ˆìŠ¤ ê¸°ë¡ë§Œ ë³µì›í•  ìˆ˜ ìˆì–´ìš”.';
      continue;
    }

    const bytes = entry[1].content;
    try {
      if (verifyManifestFace) await verifyManifestFace(bytes);
      const hash = await sha256Hex(bytes);
      if (hash !== reference.sha256 || bytes.byteLength !== reference.byteLength) {
        throw new Error('face asset mismatch');
      }
      assetBytes.set(reference.id, bytes);
    } catch {
      faceWarning = 'ì–¼êµ´ íŒŒì¼ ê²€ì¦ì— ì‹¤íŒ¨í•´ ë“œë ˆìŠ¤ ê¸°ë¡ë§Œ ë³µì›í•  ìˆ˜ ìˆì–´ìš”.';
    }
  }

  return { assetBytes, faceWarning };
}

export async function inspectPortablePdf(file: File): Promise<ImportPreview> {
  if (file.size > 30 * 1024 * 1024) throw new Error('PDFëŠ” 30MB ì´í•˜ë§Œ ë¶ˆëŸ¬ì˜¬ ìˆ˜ ìˆì–´ìš”.');
  const head = new Uint8Array(await file.slice(0, 5).arayBuffer());
  if (bytesToString(head) !== '%PDF-') throw new Error('PDF íŒŒì¼ì´ ì•„ë‹ˆë°”ìš”.');

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  let documentProxy;
  try {
    documentProxy = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch {
    throw new Error('íŒŒì¼ì„ ì½ì„ ìˆ˜ ì—†ì–´ìš”. ì›ë³¸ PDF®Š   ë‹¤ì‹œ ì„ íƒí•´ ì£¼ì„¸ìš”.');
  }

  try {
    const attachments = await documentProxy.getAttachments();
    if (!attachments) throw new Error('ë³µì› ê°€ëŠ¥í•œ ê·¸ë“œë ˆìŠ¤ PDFê¬ ;%a:ââ;%ä;&¥‰ÊNÂˆÛÛœİ[šY\ÈHØš™Xİ™[šY\Ê]XÚY[ÊH\È]XÚY[[V×NÂ‚ˆ]^[ØYˆÜX›Uİ\•ŒNÂˆ][YÜš]U™\šYšYYH˜[ÙNÂˆ]YØXŞQ›Ü›X]H˜[ÙNÂˆ]\ÜÙ]]\ÈH™]ÈX\İš[™ËZ[\œ˜^OŠ
NÂˆ]˜XÙUØ\›š[™Îˆİš[™È[™Yš[™YÂ‚ˆÛÛœİX[šY™\İ[HHš[™]XÚY[
[šY\ËÔ•P“WÓPS’Q‘TÕÑ’SWÓSQJNÂˆYˆ
X[šY™\İ[JHÂˆ]X[šY™\İÂˆHÂˆX[šY™\İH\œÙTÜX›SX[šY™\İ
\œÙRœÛÛ]XÚY[
X[šY™\İ[K	Ô»'f:ìí{&ä:éé:ââ;c¦;"©;b®:¬ ;!¤; àzä&;%­;&)‰ÊNÂˆHØ]Ú
\œ›ÜŠHÂˆYˆ
\œ›Üˆ[œİ[˜Ù[Ùˆ\œ›Üˆ	‰ˆ\œ›Ü‹›Y\ÜØYÙHOOH	Ô»'f:ìí{&ä:éâ:ââ;c¦;"©;b®:¬ ;!¤; àzä$;%­;&¥‰ÊH›İÈ\œ›ÜÂˆ›İÈ™]È\œ›ÜŠ	û)à{&ä;ef;)à;%b»ä¨:¬l:à§;!¤; àzä$:­î:äç:è";"©»'m;%â;&¥‰ÊNÂˆB‚ˆÛÛœİİ\‘[HHš[™]XÚY[
[šY\ËX[šY™\İİ\]XÚY[
NÂˆYˆ
]İ\‘[JH›İÈ™]È\œ›ÜŠ	Ô»'f;b+;%­:­î:äç:è";"©«¢‡È;%á»%­;&¥‰ÊNÂˆ^[ØYH]ØZ]™\šYTÜX›Uİ\]\ÊX[šY™\İİ\‘[VÌWK˜ÛÛ[
NÂ‚ˆÛÛœİ\ÜÙ]ÈH]ØZ]ÛÛXİ\ÜÙ]]\Êˆ^[ØYˆ[šY\ËˆX[šY™\İ™˜XÙP]XÚY[È
]\ÊHOˆ™\šYTÜX›Q˜XÙP]\ÊX[šY™\İ]\ÊHˆ[™Yš[™Yˆ
NÂˆ\ÜÙ]]\ÈH\ÜÙ]Ë˜\ÜÙ]]\ÎÂˆ˜XÙUØ\›š[™ÈH\ÜÙ]Ë™˜XÙUØ\›š[™ÎÂˆ[YÜš]U™\šYšYYHY˜XÙUØ\›š[™ÎÂˆH[ÙHÂˆÛÛœİYØXŞQ[HBˆš[™]XÚY[
[šY\ËQĞPÖWÔÔ•P“WÑ’SWÓSQJHÏÂˆš[™]XÚY[
[šY\ËÔ•P“WÕÕT—Ñ’SWÓSQJNÂˆYˆ
[YØXŞQ[JH›İÈ™]È\œ›ÜŠ	úìí{&ä:¬ :â©{eg:­î:äç:è";"©«¢‡È;%a:ââ;%ä;&¥‰ÊNÂ‚ˆ]˜]Èˆ[šÛ›İÛÂˆHÂˆ˜]ÈH\œÙRœÛÛ]XÚY[
YØXŞQ[K	Ô»'f:ìí{&ä:ãl;'m;a,:¬ ;!¤; àzä$;%­;&¥‰ÊNÂˆ^[ØYH\œÙTÜX›T^[ØY
˜]ÊNÂˆHØ]Ú
\œ›ÜŠHÂˆYˆ
\œ›Üˆ[œİ[˜Ù[Ùˆ\œ›Üˆ	‰ˆ\œ›Ü‹›Y\ÜØYÙHOOH	Ô»'f:ìí{&ä:ãl;'m;a,:¬ ;!¤; àzä$;%­;&¥‰ÊH›İÈ\œ›ÜÂˆ›İÈ™]È\œ›ÜŠ	û)à;&ä;ef;)à;%bº¬l:à¦;!¤; àzä':­î:äç:è";"©»&";&¥‰ÊNÂˆBˆÛÛœİ\ÜÙ]ÈH]ØZ]ÛÛXİ\ÜÙ]]\Ê^[ØY[šY\ÊNÂˆ\ÜÙ]]\ÈH\ÜÙ]Ë˜\ÜÙ]]\ÎÂˆ˜XÙUØ\›š[™ÈH\ÜÙ]Ë™˜XÙUØ\›š[™ÎÂˆYØXŞQ›Ü›X]HYNÂˆB‚ˆ™]\›ˆÂˆ^[ØYˆ\ĞÛÛ™›Xİˆ›ÛÛX[Š]ØZ]‹İ\œË™Ù]
^[ØYœÛİ\˜ÙUİ\’Y
JKˆ˜XÙR[˜ÛYYˆ^[ØYš[˜ÛYQ˜XÙH	‰ˆ\ÜÙ]]\ËœÚ^™Hˆˆ˜XÙUØ\›š[™ËˆÚÜÛİ[ˆ^[ØYœÚÜË›[™İˆ™\ÜĞÛİ[ˆ^[ØY™™\ÜÙ\Ë›[™İˆ˜]›Üš]PÛİ[ˆ^[ØY™™\ÜÙ\Ë™š[\Š
™\ÜÊHOˆ™\ÜËš\Ñ˜]›Üš]JK›[™İˆ\ÜÙ]]\Ëˆ[YÜš]U™\šYšYYˆYØXŞQ›Ü›X]ˆNÂˆHš[˜[HÂˆ]ØZ]Øİ[Y[›ŞK™\İ›ŞJ
NÂˆBŸB‚™^Ü\Ş[˜È[˜İ[Ûˆ[\ÜÜX›TŠš[Nˆš[Kİ˜]YŞNˆ[\Üİ˜]YŞJHÂˆÛÛœİ™]šY]ÈH]ØZ][œÜXİÜX›TŠš[JNÂˆÛÛœİ^[ØYH™]šY]Ëœ^[ØYÂˆÛÛœİ›İÈH™]È]J
KÒTÓÔİš[™Ê
NÂˆ]˜XÙP\ÜÙ]YH^[ØYİ\‹™˜XÙP\ÜÙ]YÂˆÛÛœİ\ÜÙ]ÎˆØØ[\ÜÙ]×HH×NÂ‚ˆ›Üˆ
ÛÛœİ™Y™\™[˜ÙHÙˆ^[ØY˜\ÜÙ]ÊHÂˆÛÛœİ]\ÈH™]šY]Ë˜\ÜÙ]]\Ë™Ù]
™Y™\™[˜ÙKšY
NÂˆYˆ
X]\ÊHÂˆYˆ
˜XÙP\ÜÙ]YOOH™Y™\™[˜ÙKšY
H˜XÙP\ÜÙ]YH[™Yš[™YÂˆÛÛ[YNÂˆBˆ\ÜÙ]Ëœ\Ú
ÂˆYˆ™Y™\™[˜ÙKšYˆİ\’Yˆ^[ØYİ\‹šYˆÚ[™ˆ	Ù˜XÙIËˆZ[YU\Nˆ™Y™\™[˜ÙK›Z[YU\Kˆ›Øˆ™]È›ØŠİĞ\œ˜^PY™™\Š]\ÊWKÈ\Nˆ™Y™\™[˜ÙK›Z[YU\HJKˆÚYˆ™Y™\™[˜ÙKÚYˆZYÚˆ™Y™\™[˜ÙKšZYÚˆ]S[™İˆ™Y™\™[˜ÙK˜]S[™İˆÚLMˆ™Y™\™[˜ÙKœÚLM‹ˆÜ™X]Y]ˆ›İËˆJNÂˆB‚ˆÛÛœİÛ˜\Úİˆİ\”Û˜\ÚİHÂˆİ\ˆÈ‹‹œ^[ØYİ\‹˜XÙP\ÜÙ]Y\İÜ[™Y]ˆ›İË\]Y]ˆ›İÈKˆÚÜÎˆ^[ØYœÚÜË›X\

ÚÜ
HOˆ
È‹‹œÚÜJJKˆ™\ÜÙ\Îˆ^[ØY™™\ÜÙ\Ë›X\

™\ÜÊHOˆ
˜XÙP\ÜÙ]YÈÈ‹‹™™\ÜÈHˆÈ‹‹™™\ÜË˜XÙU˜[œÙ›Ü›Nˆ[™Yš[™YJJKˆ\ÜÙ]ËˆNÂˆ™]\›ˆ[\ÜÛ˜\Úİ
Û˜\Úİİ˜]YŞJNÂŸB