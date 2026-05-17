import { useState, useEffect } from "react";
import { CircleOff, Circle, CircleCheck } from "lucide-react";

interface CheckboxProps {
  id: string;
  label?: string;
  color?: "primary" | "secondary" | "danger" | "warning" | "success";
  disabled?: boolean;
  readonly?: boolean;
  checked?: boolean;
  className?: string;
  labelClassName?: string;
  onChange?: (checked: boolean) => void;
}

export default function Checkbox({ id, label, color = "primary", disabled = false, readonly = false, checked = false, className, labelClassName, onChange }: CheckboxProps) {
  const [isChecked, setIsChecked] = useState(false);

  const colorClasses = {
    primary: "text-mint",
    secondary: "text-grape",
    danger: "text-danger",
    warning: "text-warning",
    success: "text-success",
  }[color];

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleChange = (value: boolean) => {
    if (disabled || readonly) return;
    setIsChecked(value);
    onChange?.(value);
  }

  return (
    <label htmlFor={id} className={`flex items-center gap-2 ${disabled || readonly ? "cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <span className={`text-sm font-nunito font-bold text-nowrap ${isChecked ? colorClasses : "text-slate-500"} ${labelClassName}`}>{label}</span>
      {disabled && <CircleOff className="w-6 h-6 text-slate-500" />}
      {!disabled && !isChecked && <Circle className="w-6 h-6 text-slate-500" />}
      {!disabled && isChecked && <CircleCheck className={`w-6 h-6 ${colorClasses}`} />}
      <input id={id} type="checkbox" defaultChecked={checked} disabled={disabled || readonly} onChange={(e) => handleChange(e.target.checked)} className="hidden" />
    </label>
  )
}