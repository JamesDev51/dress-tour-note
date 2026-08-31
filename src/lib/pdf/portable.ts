import type { TourSnapshot } from '../../types/domain';
import type { PortableBundle, PortableTourV1 } from '../../types/portable';
import { portableTourV1Schema } from '../validation/schemas';

export const PORTABLE_FILE_NAME='gudress-data-v1.json';
export const PORTABLE_FORMAT='gudress-portable-tour' as const;
export const SCHEMA_VERSION=1 as const;
export const APP_VERSION='1.0.0';

export function buildPortableBundle(snapshot:TourSnapshot,includeFace:boolean):PortableBundle{
  const face=includeFace&&snapshot.tour.faceAssetId?snapshot.assets.find(a=>a.id===snapshot.tour.faceAssetId):undefined;
  const {lastOpenedAt:_,lastExportedAt:__,...baseTour}=snapshot.tour;
  const tour=includeFace?baseTour:{...baseTour,faceAssetId:undefined};
  const dresses=includeFace?snapshot.dresses.map(d=>({...d})):snapshot.dresses.map(({faceTransform:_,...d})=>d);
  const assets=face?[face]:[];
  const payload:PortableTourV1={format:PORTABLE_FORMAT,schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,exportId:crypto.randomUUID(),exportedAt:new Date().toISOString(),sourceTourId:snapshot.tour.id,includeFace:!!face,tour,shops:snapshot.shops.map(s=>({...s})),dresses,assets:assets.map(a=>({id:a.id,kind:'face',fileName:`gudress-asset-${a.id}.${a.mimeType==='image/webp'?'webp':'jpg'}`,mimeType:a.mimeType,byteLength:a.byteLength,width:a.width,height:a.height,sha256:a.sha256}))};
  return{payload:portableTourV1Schema.parse(payload),assets};
}
export function parsePortablePayload(input:unknown){return portableTourV1Schema.parse(input);}
