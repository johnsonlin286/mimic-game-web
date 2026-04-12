import { useState, useEffect } from 'react';

interface SwitchInputProps {
  label: string;
  checked: boolean;
  className?: string;
  onCheckedChange: (checked: boolean) => void;
}

export default function SwitchInput({ label, checked, className, onCheckedChange }: SwitchInputProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleCheckedChange = (value: boolean) => {
    setIsChecked(value);
    onCheckedChange(value);
  }
  
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <label htmlFor={label} className="font-medium cursor-pointer">{label}</label>
      <div role="button" onClick={() => handleCheckedChange(!isChecked)} className="w-12 h-6 bg-zinc-300/20 rounded-full shadow-inner p-1 cursor-pointer">
        <div className={`w-4 h-4 rounded-full shadow-md transition-all duration-300 ${isChecked ? "translate-x-6 bg-sky-500" : "translate-x-0 bg-white"}`} aria-hidden="true" />
      </div>
      <input type="checkbox" id={label} checked={isChecked} onChange={(e) => handleCheckedChange(e.target.checked)} className="hidden" />
    </div>
  )
}