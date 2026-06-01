import { ButtonHTMLAttributes, useCallback } from "react";
import useSound from 'use-sound';

import { buttonSound } from '@/utils/sounds';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Button({ variant = "primary", size = "md", disabled = false, className, children, onClick, ...rest }: ButtonProps) {
  const baseClasses = "button ring-4 ring-black rounded-full font-fredoka font-bold uppercase hover:inset-shadow-sm hover:inset-shadow-black/50 cursor-pointer disabled:bg-slate-500/50 disabled:shadow-[inset_0px_-6px_0px_0px_#64748B/50] disabled:text-slate-300/50 disabled:hover:inset-shadow-none disabled:cursor-not-allowed px-4 py-2";

  const variantClasses = {
    primary: "bg-mint text-white shadow-[inset_0px_-6px_0px_0px_#28C795] hover:bg-mint-hover",
    secondary: "bg-grape text-white shadow-[inset_0px_-6px_0px_0px_#942BE0] hover:bg-grape-hover",
    danger: "bg-danger text-white shadow-[inset_0px_-6px_0px_0px_#D6274B] hover:bg-danger-hover",
    warning: "bg-warning text-white shadow-[inset_0px_-6px_0px_0px_#E09C00] hover:bg-warning-hover",
    success: "bg-success text-white shadow-[inset_0px_-6px_0px_0px_#19B360] hover:bg-success-hover",
  }[variant];

  const sizeClasses = {
    sm: "text-base md:text-xl px-2 pt-1 pb-2",
    md: "text-lg md:text-2xl px-4 pt-2 pb-3",
    lg: "text-xl md:text-3xl px-6 pt-3 pb-4",
  }[size];

  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;

  const [playButtonSound] = useSound(buttonSound);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    playButtonSound();
    onClick?.(e);
  }, [onClick, disabled, playButtonSound]);

  return (
    <button {...rest} className={classes} disabled={disabled} onClick={handleClick}>
      {children}
    </button>
  )
}