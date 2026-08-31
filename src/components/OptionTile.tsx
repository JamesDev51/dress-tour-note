import { Check } from 'lucide-react';
export function OptionTile({label,technical,selected,disabled,onClick,icon}:{label:string;technical?:string;selected:boolean;disabled?:boolean;onClick:()=>void;icon?:React.ReactNode}){
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={`relative min-h-[108px] rounded-2xl border p-2 text-left transition ${selected?'border-[#b96e63] bg-[#fff2ee] ring-2 ring-[#b96e63]/15':'border-stone-200 bg-white'} ${disabled?'opacity-35':''}`}>
    {selected&&<span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#b96e63] text-white"><Check size={13}/></span>}
    <div className="mb-2 grid h-12 place-items-center rounded-xl bg-[#faf7f5] text-[#8d6c65]">{icon??<span className="text-2xl">⌁</span>}</div>
    <div className="text-[13px] font-semibold leading-tight text-stone-800">{label}</div>{technical&&<div className="mt-1 text-[10px] text-stone-400">{technical}</div>}
  </button>
}
