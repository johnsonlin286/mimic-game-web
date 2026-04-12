import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Button({ variant = "primary", size = "md", children, ...props }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-full cursor-pointer";
  
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-sky-500 text-white hover:bg-sky-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  }[variant];

  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  }[size];
  
  const classes = `${baseClasses} ${variantClasses} ${sizeClasses}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}