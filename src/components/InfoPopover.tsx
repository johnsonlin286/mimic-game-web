"use client";

import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { InfoIcon } from "lucide-react";

const MARGIN = 8;
const GAP = 6;
const MAX_POPOVER_W = 320; // max-w-xs

interface InfoPopoverProps {
  label?: string;
  text: string;
}

export default function InfoPopover({ label, text }: InfoPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !btnRef.current) return;

    const updatePosition = () => {
      const btn = btnRef.current!.getBoundingClientRect();
      const pop = popoverRef.current?.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxW = Math.min(MAX_POPOVER_W, vw - MARGIN * 2);
      const w = pop?.width ?? maxW;
      const h = pop?.height ?? 0;

      let left = btn.left + btn.width / 2 - w / 2;
      left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN));

      let top = btn.bottom + GAP;
      if (h > 0 && top + h > vh - MARGIN) {
        const above = btn.top - GAP - h;
        if (above >= MARGIN) top = above;
        else top = Math.max(MARGIN, vh - h - MARGIN);
      }

      setPos({ top, left });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, text]);

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1.5">
      {label && <strong className="font-nunito">{label}</strong>}
      <button ref={btnRef} type="button" onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        <InfoIcon className="w-5 h-5 text-mint hover:text-mint-hover" />
      </button>
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed z-40 max-w-xs rounded-2xl border-2 border-black bg-light-navy p-2 shadow-lg"
          style={{
            top: pos.top,
            left: pos.left,
            maxWidth: `min(${MAX_POPOVER_W}px, calc(100vw - ${MARGIN * 2}px))`,
          }}
        >
          <p className="text-sm font-nunito">{text}</p>
        </div>
      )}
    </div>
  );
}
