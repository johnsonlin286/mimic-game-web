import { useState, useEffect, useCallback } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";

interface InputNumberProps {
  label?: string;
  value?: string;
  min?: number;
  max?: number;
  onChange?: (value: string) => void;
  error?: string;
}

export default function InputNumber({ label, value, min, max, onChange, error }: InputNumberProps) {
  const [inputValue, setInputValue] = useState<string>('0');

  useEffect(() => {
    setInputValue(value || '0');
  }, [value]);

  useEffect(() => {
    onChange?.(inputValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const clamp = useCallback((n: number) => {
    let next = n;
    if (typeof min === "number") next = Math.max(next, min);
    if (typeof max === "number") next = Math.min(next, max);
    return next;
  }, [min, max]);

  const handleChange = useCallback((type: 'increment' | 'decrement') => {
    const current = Number(inputValue) || 0;
    const delta = type === "increment" ? 1 : -1;
    const next = clamp(current + delta);
    if (next === current) return;
    setInputValue(String(next));
  }, [clamp, inputValue]);

  return (
    <div className="flex flex-col gap-0.5">
      {label && <label htmlFor={label} className="text-sm font-nunito font-medium">{label}</label>}
      <div className="w-full flex justify-between items-center border border-mint/50 rounded-full font-nunito font-medium text-lg p-2 focus:outline-none focus:ring-1 focus:ring-mint transition-all duration-300">
        <button type="button" className="cursor-pointer" onClick={() => handleChange('decrement')}>
        <CircleMinus className="w-6 h-6 hover:text-mint"/>
        </button>
        <input
          type="number"
          id={label}
          value={inputValue}
          disabled
          min={min}
          max={max}
          onChange={(e) => setInputValue(String(clamp(Number(e.target.value) || 0)))}
          className="w-full focus:outline-none text-center"
        />
        <button type="button" className="cursor-pointer" onClick={() => handleChange('increment')}>
          <CirclePlus className="w-6 h-6 hover:text-mint"/>
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}