import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <label htmlFor={label} className="text-sm font-medium">{label}</label>}
      <input type="text" id={label} {...props} className="w-full border border-zinc-300/20 rounded-full shadow-inner p-2 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-300" />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}