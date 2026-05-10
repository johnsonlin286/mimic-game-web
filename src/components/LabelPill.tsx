interface LabelPillProps {
  label?: string;
  variant?: "success" | "warning" | "danger" | "slate";
  className?: string;
}

export default function LabelPill({ label, variant = "success", className }: LabelPillProps) {
  const variantClasses = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    slate: "bg-slate-500",
  }[variant];

  return (
    <span className={`text-white font-nunito ${label ? 'text-sm py-0.5 px-2.5' : 'inline-block w-2.5 h-2.5'} ${variantClasses} border-2 border-black text-black rounded-full ${className}`}>
      {label}
    </span>
  )
}