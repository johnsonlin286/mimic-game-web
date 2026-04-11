import { CopyIcon } from "lucide-react";

interface CopyInputProps {
  label: string;
  value: string;
}

export default function CopyInput({ label, value }: CopyInputProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <label htmlFor={label} className="text-sm font-medium">{label}</label>}
      <div className="flex items-center justify-between gap-2 w-full border border-zinc-300/20 rounded-full shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300">
        <input type="text" id={label} value={value} readOnly className="w-full focus:outline-none" />
        <button onClick={() => navigator.clipboard.writeText(value)} className="cursor-pointer">
          <CopyIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}