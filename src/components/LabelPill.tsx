interface LabelPillProps {
  label?: string;
  variant?: "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export default function LabelPill({ label, variant = "success", className }: LabelPillProps) {
  const variantClasses = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    danger: "bg-red-500 text-white",
    neutral: "bg-zinc-500 text-white",
  }[variant];

  return (
    <span className={`${label ? 'text-sm text-white py-0.5 px-2.5' : 'inline-block w-2.5 h-2.5'} ${variantClasses} rounded-full ${className}`}>
      {label}
    </span>
  )
}