import type { LocalAsset } from '../../types/domain';

export function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array | Blob) {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data instanceof Uint8Array ? toArrayBuffer(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function isHeicFile(file:File){const type=file.type.toLowerCase();const name=file.name.toLowerCase();return type==='image/heic'||type==='image/heif'||name.endsWith('.heic')||name.endsWith('.heif');}
async function normalizeImageInput(file:File):Promise<Blob>{
  if(!isHeicFile(file)) return file;
  try{
    const { heicTo } = await import('heic-to/csp');
    const converted = await heicTo({ blob:file, type:'image/jpeg', quality:0.92 });
    if(!(converted instanceof Blob)) throw new Error('HEIC 변환 결과가 올바르지 않아요.');
    return converted;
  }catch{throw new Error('이 HEIC/HEIF 사진을 변환하지 못했어요. 다른 사진을 선택해 주세요.');}
}
function loadImage(file:Blob):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('이미지를 열 수 없습니다.'))};img.src=url;});}

export async function processFaceFile(file:File):Promise<Omit<LocalAsset,'id'|'tourId'|'createdAt'>>{
  if(file.size>20*1024*1024) throw new Error('사진은 20MB 이하만 사용할 수 있어요.');
  const accepted=['image/jpeg','image/png','image/webp','image/heic','image/heif'];
  if(!accepted.includes(file.type)&&!isHeicFile(file)) throw new Error('JPEG, PNG, WebP, HEIC/HEIF 사진만 지원해요.');
  const input=await normalizeImageInput(file);const img=await loadImage(input);const max=1600;const ratio=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const width=Math.max(1,Math.round(img.naturalWidth*ratio));const height=Math.max(1,Math.round(img.naturalHeight*ratio));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('사진 처리 기능을 사용할 수 없어요.');ctx.drawImage(img,0,0,width,height);
  const webp=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/webp',0.86));const blob=webp&&webp.type==='image/webp'?webp:await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',0.9));if(!blob)throw new Error('사진을 저장 가능한 형식으로 바꾸지 못했어요.');
  return{kind:'face',mimeType:blob.type==='image/webp'?'image/webp':'image/jpeg',blob,width,height,byteLength:blob.size,sha256:await sha256Hex(blob)};
}
export function blobToDataUrl(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});}
