"use client";

import { useState, useRef, useEffect, useId, useCallback, type KeyboardEvent } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectInputProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

interface Option {
  label: string;
  value: string;
}

export default function SelectInput({
  label,
  options,
  value,
  onChange,
  error,
  disabled,
  placeholder = "Select…",
  className = "",
}: SelectInputProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const displayLabel = options.find((option) => option.value === value)?.label || placeholder;

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(Math.max(0, selectedIndex));
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (open) setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  const selectOption = (option: Option) => {
    onChange(option.value);
    setOpen(false);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[highlightedIndex];
      if (opt) selectOption(opt);
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlightedIndex(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlightedIndex(options.length - 1);
    }
  };

  const triggerClasses = [
    "w-full flex items-center justify-between gap-2 border border-mint/50 rounded-full bg-transparent px-3 py-2 text-left",
    "focus:outline-none focus:ring-1 focus:ring-mint transition-all duration-300",
    disabled ? "cursor-not-allowed bg-slate-500/50 text-slate-300/50" : "cursor-pointer bg-transparent",
    value && "font-nunito font-bold",
    error && "border-danger focus:ring-danger",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={`relative flex flex-col gap-0.5 ${className}`}>
      {label && (
        <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        className={triggerClasses}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label ? undefined : "Select option"}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-mint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={0}
          autoFocus
          aria-labelledby={label ? `${id}-label` : id}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-auto rounded-2xl bg-light-navy py-1 shadow-lg ring-2 ring-black outline-none"
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={[
                  "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm text-white transition-colors",
                  isHighlighted && "bg-mint-hover/50 text-baby! font-bold",
                ].join(" ")}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-baby" strokeWidth={2.5} aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
