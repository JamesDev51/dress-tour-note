import { useEffect, useMemo, useState } from 'react';
import type { Dress, LocalAsset } from '../types/domain';
import { blobToDataUrl } from '../lib/image/processFace';
import { dressSvgMarkup } from '../lib/renderer/dressSvg';

export function DressPreview({dress,faceAsset,className=''}:{dress:Dress;faceAsset?:LocalAsset;className?:string}){
  const [face,setFace]=useState<string>();
  useEffect(()=>{let active=true;if(faceAsset)blobToDataUrl(faceAsset.blob).then(x=>active&&setFace(x));else setFace(undefined);return()=>{active=false}},[faceAsset]);
  const svg=useMemo(()=>dressSvgMarkup(dress,face,true),[dress,face]);
  return <div className={`dress-preview overflow-hidden rounded-[28px] border border-stone-200 bg-[#fbf8f6] ${className}`} dangerouslySetInnerHTML={{__html:svg}}/>;
}
