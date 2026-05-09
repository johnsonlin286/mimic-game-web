interface LabelPillProps {
  label?: string;
  variant?: "success" | "warning" | "danger" | "slate";
  className?: string;
}

export default function LabelPill({ label, variant = "success", className }: LabelPillProps) {
  const variantClasses = {
    success: "bg-success text-white",
    warning: "bg-warning text-white",
    danger: "bg-danger text-white",
    slate: "bg-slate-500 text-white",
  }[variant];

  return (
    <span className={`${label ? 'text-sm text-white py-0.5 px-2.5' : 'inline-block w-2.5 h-2.5'} ${variantClasses} rounded-full ${className}`}>
      {label}
    </span>
  )
}