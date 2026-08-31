import type { Dress, DressColor, DressDetail, Fabric, Neckline, QuickTag, Silhouette, TopStyle, Train, Waistline } from '../../types/domain';

export type Option<T extends string> = { id: T; label: string; technical?: string };

export const topStyleOptions: Option<TopStyle>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'strapless', label:'끈 없음', technical:'Strapless' },
  { id:'offShoulder', label:'오프숄더', technical:'Off-shoulder' }, { id:'spaghetti', label:'얇은 끈', technical:'Spaghetti strap' },
  { id:'wideStrap', label:'넓은 끈', technical:'Wide strap' }, { id:'halter', label:'목에 거는 형태', technical:'Halter' },
  { id:'oneShoulder', label:'한쪽 어깨', technical:'One-shoulder' }, { id:'shortSleeve', label:'짧은 소매', technical:'Short/Cap sleeve' },
  { id:'longSleeve', label:'긴 소매', technical:'Long sleeve' }
];
export const necklineOptions: Option<Neckline>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'straight', label:'일자형', technical:'Straight' }, { id:'sweetheart', label:'하트형', technical:'Sweetheart' },
  { id:'v', label:'브이형', technical:'V-neck' }, { id:'square', label:'네모형', technical:'Square' }, { id:'scoop', label:'둥근형', technical:'Scoop' },
  { id:'high', label:'목까지 올라옴', technical:'High neck' }, { id:'illusion', label:'시스루 목선', technical:'Illusion' }, { id:'asymmetric', label:'사선형', technical:'Asymmetric' }
];
export const silhouetteOptions: Option<Silhouette>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'aLine', label:'A라인', technical:'A-line' }, { id:'ballGown', label:'풍성한 벨라인', technical:'Ball gown' },
  { id:'fitAndFlare', label:'허벅지부터 퍼짐', technical:'Fit-and-flare' }, { id:'mermaid', label:'무릎부터 크게 퍼짐', technical:'Mermaid' },
  { id:'sheath', label:'일자로 슬림', technical:'Sheath' }, { id:'teaLength', label:'발목 위 짧은 길이', technical:'Tea length' }
];
export const trainOptions: Option<Train>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'none', label:'거의 없음', technical:'None' }, { id:'sweep', label:'짧게 끌림', technical:'Sweep' },
  { id:'chapel', label:'보통 길이', technical:'Chapel' }, { id:'cathedral', label:'아주 길게 끌림', technical:'Cathedral' }
];
export const fabricOptions: Option<Fabric>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'mikadoSatin', label:'매끈한 실크', technical:'Mikado/Satin' }, { id:'lace', label:'레이스', technical:'Lace' },
  { id:'tulle', label:'가벼운 망사', technical:'Tulle' }, { id:'organzaChiffon', label:'하늘하늘', technical:'Organza/Chiffon' },
  { id:'glitterBeaded', label:'반짝이·비즈', technical:'Glitter/Beaded' }, { id:'floral3D', label:'입체 꽃', technical:'3D Floral' }
];
export const colorOptions: Option<DressColor>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'pureWhite', label:'새하얀 화이트', technical:'Pure white' }, { id:'ivory', label:'아이보리', technical:'Ivory' },
  { id:'champagne', label:'샴페인 베이지', technical:'Champagne' }
];
export const waistlineOptions: Option<Waistline>[] = [
  { id:'unknown', label:'기억 안 남' }, { id:'natural', label:'자연 허리선', technical:'Natural' }, { id:'basque', label:'V자 허리선', technical:'Basque' },
  { id:'drop', label:'낮은 허리선', technical:'Drop waist' }, { id:'empire', label:'높은 허리선', technical:'Empire' }
];
export const detailOptions: Option<DressDetail>[] = [
  ['corset','코르셋'],['draping','드레이핑'],['waistBow','허리 리본'],['backBow','등 리본'],['pearl','진주'],['sequin','스팽글'],['floral','꽃 장식'],['slit','슬릿'],['sheer','시스루'],['detachableSleeve','탈착 소매'],['overskirt','오버스커트'],['buttons','버튼']
].map(([id,label]) => ({ id: id as DressDetail, label }));
export const quickTagOptions: Option<QuickTag>[] = ['상체 예쁨','허리 예쁨','얼굴이 살아남','날씬해 보임','사진빨','무거움','불편함','신부 픽','동행인 픽'].map(id => ({id:id as QuickTag,label:id}));

const compatible: Record<TopStyle, Neckline[]> = {
  strapless:['straight','sweetheart'], offShoulder:['straight','sweetheart','v'], spaghetti:['sweetheart','v','square','scoop'],
  wideStrap:['v','square','scoop'], halter:['v','high'], oneShoulder:['asymmetric'], shortSleeve:['v','square','scoop','high','illusion'],
  longSleeve:['v','square','scoop','high','illusion'], unknown:['unknown','straight','sweetheart','v','square','scoop','high','illusion','asymmetric']
};
const fallback: Record<TopStyle, Neckline> = { strapless:'sweetheart', offShoulder:'sweetheart', spaghetti:'v', wideStrap:'square', halter:'high', oneShoulder:'asymmetric', shortSleeve:'scoop', longSleeve:'illusion', unknown:'unknown' };

export function isNecklineCompatible(topStyle: TopStyle, neckline: Neckline) {
  return neckline === 'unknown' || compatible[topStyle].includes(neckline);
}
export function normalizeUpper(topStyle: TopStyle, neckline: Neckline): { neckline: Neckline; changed: boolean } {
  if (isNecklineCompatible(topStyle, neckline)) return { neckline, changed:false };
  return { neckline:fallback[topStyle], changed:true };
}
export function summarizeDress(dress: Dress) {
  const find = <T extends string>(options: Option<T>[], id:T) => options.find(o=>o.id===id)?.label ?? id;
  return [find(topStyleOptions,dress.topStyle),find(necklineOptions,dress.neckline),find(silhouetteOptions,dress.silhouette),find(fabricOptions,dress.fabric),find(trainOptions,dress.train)].filter(x=>x!=='기억 안 남');
}
export const colorHex: Record<DressColor,string> = { unknown:'#f7f5f3', pureWhite:'#ffffff', ivory:'#fffaf0', champagne:'#f4e6d1' };
