import { useState, useEffect } from 'react';

interface SwitchInputProps {
  id: string;
  labelLeft?: string;
  labelRight?: string;
  checked: boolean;
  disabled?: boolean;
  className?: string;
  onCheckedChange: (checked: boolean) => void;
}

export default function SwitchInput({ id, labelLeft, labelRight, checked, disabled, className, onCheckedChange }: SwitchInputProps) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleCheckedChange = (value: boolean) => {
    if (disabled) return;
    setIsChecked(value);
    onCheckedChange(value);
  }
  
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      {labelLeft && (
        <label htmlFor={id} className={`text-md font-nunito font-bold ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
          {labelLeft}
        </label>
      )}
      <div role="button" onClick={() => handleCheckedChange(!isChecked)} className={`w-12 h-6 bg-zinc-300/20 rounded-full shadow-inner p-1 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <div className={`w-4 h-4 rounded-full shadow-md transition-all duration-300 ${isChecked ? "translate-x-6 bg-mint" : "translate-x-0 bg-white"}`} aria-hidden="true" />
      </div>
      {labelRight && (
        <label htmlFor={id} className={`text-md font-nunito font-bold ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
          {labelRight}
        </label>
      )}
      <input type="checkbox" id={id} checked={isChecked} disabled={disabled} onChange={(e) => handleCheckedChange(e.target.checked)} className="hidden" />
    </div>
  )
}