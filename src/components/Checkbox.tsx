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

export default function Checkbox({
  id,
  label,
  color = "primary",
  disabled = false,
  readonly = false,
  checked = false,
  className,
  labelClassName,
  onChange,
}: CheckboxProps) {
  const colorClasses = {
    primary: "text-mint",
    secondary: "text-grape",
    danger: "text-danger",
    warning: "text-warning",
    success: "text-success",
  }[color];

  const handleChange = (value: boolean) => {
    if (disabled || readonly) return;
    onChange?.(value);
  };

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 ${disabled || readonly ? "cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      <span className={`text-sm font-nunito font-bold text-nowrap ${checked ? colorClasses : "text-slate-500"} ${labelClassName}`}>
        {label}
      </span>
      {disabled && <CircleOff className="w-6 h-6 text-slate-500" />}
      {!disabled && !checked && <Circle className="w-6 h-6 text-slate-500" />}
      {!disabled && checked && <CircleCheck className={`w-6 h-6 ${colorClasses}`} />}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled || readonly}
        onChange={(e) => handleChange(e.target.checked)}
        className="hidden"
      />
    </label>
  );
}
