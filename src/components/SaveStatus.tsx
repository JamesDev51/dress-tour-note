import { CheckCircle2, CloudOff, LoaderCircle } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
export function SaveStatus(){const s=useUIStore(x=>x.saveStatus);if(s==='saving')return <span className="inline-flex items-center gap-1 text-xs text-stone-400"><LoaderCircle className="animate-spin" size={13}/>저장 중</span>;if(s==='error')return <span className="inline-flex items-center gap-1 text-xs text-red-500"><CloudOff size={13}/>저장 실패</span>;return <span className="inline-flex items-center gap-1 text-xs text-stone-400"><CheckCircle2 size={13}/>자동 저장됨</span>}
