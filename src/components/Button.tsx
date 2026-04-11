import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
}

export default function Button({ variant = "primary", children, ...props }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-full cursor-pointer";
  
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-sky-500 text-white hover:bg-sky-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  }[variant];
  
  const classes = `${baseClasses} ${variantClasses}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}