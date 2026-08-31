import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { LocalAsset, TourSnapshot } from '../../types/domain';
import type { ImportPreview, ImportStrategy } from '../../types/portable';
import { db } from '../../db/database';
import { importSnapshot } from '../../db/repositories';
import { sha256Hex, toArrayBuffer } from '../image/processFace';
import { parsePortablePayload, PORTABLE_FILE_NAME } from './portable';

function bytesToString(bytes:Uint8Array){return new TextDecoder().decode(bytes)}
export async function inspectPortablePdf(file:File):Promise<ImportPreview>{
  if(file.size>30*1024*1024)throw new Error('PDF는 30MB 이하만 불러올 수 있어요.');const head=new Uint8Array(await file.slice(0,5).arrayBuffer());if(bytesToString(head)!=='%PDF-')throw new Error('PDF 파일이 아니에요.');
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;let doc;try{doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),enableScripting:false,isEvalSupported:false}).promise}catch{throw new Error('파일을 읽을 수 없어요. 원본 PDF를 다시 선택해 주세요.');}
  const attachments=await doc.getAttachments();if(!attachments)throw new Error('복원 가능한 그드레스 PDF가 아니에요.');const entries=Object.entries(attachments) as [string,{filename?:string;content:Uint8Array}][];const dataEntry=entries.find(([key,val])=>key===PORTABLE_FILE_NAME||val.filename===PORTABLE_FILE_NAME);if(!dataEntry)throw new Error('복원 가능한 그드레스 PDF가 아니에요.');
  let raw:unknown;try{raw=JSON.parse(bytesToString(dataEntry[1].content))}catch{throw new Error('PDF의 복원 데이터가 손상됐어요.');}
  let payload;try{payload=parsePortablePayload(raw)}catch{throw new Error('지원하지 않거나 손상된 그드레스 PDF예요.');}
  const assetBytes=new Map<string,Uint8Array>();let faceWarning:string|undefined;for(const ref of payload.assets){const e=entries.find(([key,val])=>key===ref.fileName||val.filename===ref.fileName);if(!e){faceWarning='얼굴 파일이 없어 드레스 기록만 복원할 수 있어요.';continue}const bytes=e[1].content;const hash=await sha256Hex(bytes);if(hash!==ref.sha256||bytes.byteLength!==ref.byteLength){faceWarning='얼굴 파일 검증에 실패해 드레스 기록만 복원할 수 있어요.';continue}assetBytes.set(ref.id,bytes)}
  return{payload,hasConflict:!!(await db.tours.get(payload.sourceTourId)),faceIncluded:payload.includeFace&&assetBytes.size>0,faceWarning,shopCount:payload.shops.length,dressCount:payload.dresses.length,favoriteCount:payload.dresses.filter(d=>d.isFavorite).length,assetBytes};
}

export async function importPortablePdf(file:File,strategy:ImportStrategy){const preview=await inspectPortablePdf(file);const p=preview.payload;const now=new Date().toISOString();let faceAssetId=p.tour.faceAssetId;const assets:LocalAsset[]=[];for(const ref of p.assets){const bytes=preview.assetBytes.get(ref.id);if(!bytes){if(faceAssetId===ref.id)faceAssetId=undefined;continue}assets.push({id:ref.id,tourId:p.tour.id,kind:'face',mimeType:ref.mimeType,blob:new Blob([toArrayBuffer(bytes)],{type:ref.mimeType}),width:ref.width,height:ref.height,byteLength:ref.byteLength,sha256:ref.sha256,createdAt:now});}
  const snapshot:TourSnapshot={tour:{...p.tour,faceAssetId,lastOpenedAt:now,updatedAt:now},shops:p.shops.map(s=>({...s})),dresses:p.dresses.map(d=>faceAssetId?{...d}:{...d,faceTransform:undefined}),assets};return importSnapshot(snapshot,strategy);
}
