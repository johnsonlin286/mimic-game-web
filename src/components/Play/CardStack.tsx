import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import useSocket from '@/hooks/useSocket';

/** Horizontal distance (px) to commit a swipe. */
const SWIPE_DISTANCE = 56;
/** Movement before a gesture is treated as horizontal swipe (not tap / long-press). */
const HORIZONTAL_LOCK_PX = 18;

type CardStackProps = {
  /** Shown in `aria-label` for the swipe area. */
  labels?: [string, string];
  children: ReactNode;
};

export default function CardStack({
  labels = ["Word", "Superpower"],
  children,
}: CardStackProps) {
  const { socket } = useSocket();
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const dragOffsetRef = useRef(0);
  const swipeModeRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on("listen-game-restart-success", () => {
      setActiveIndex(0);
    })

    socket.on("listen-game-initialize-success", () => {
      setActiveIndex(0);
    })
  }, [socket]);

  const syncOffset = useCallback((v: number) => {
    dragOffsetRef.current = v;
    setDragOffset(v);
  }, []);

  const endTracking = useCallback(() => {
    const c = cleanupRef.current;
    cleanupRef.current = null;
    c?.();
  }, []);

  const handleFrontPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      endTracking();

      const pointerId = e.pointerId;
      startRef.current = { x: e.clientX, y: e.clientY };
      swipeModeRef.current = false;
      syncOffset(0);

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        const dx = ev.clientX - startRef.current.x;
        const dy = ev.clientY - startRef.current.y;

        if (!swipeModeRef.current) {
          const horizontal =
            Math.abs(dx) >= HORIZONTAL_LOCK_PX &&
            Math.abs(dx) > Math.abs(dy) * 0.65;
          if (!horizontal) return;
          swipeModeRef.current = true;
        }

        syncOffset(dx);
      };

      const onEnd = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        endTracking();

        if (
          swipeModeRef.current &&
          Math.abs(dragOffsetRef.current) >= SWIPE_DISTANCE
        ) {
          setActiveIndex((i) => 1 - i);
        }
        swipeModeRef.current = false;
        syncOffset(0);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);

      cleanupRef.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
      };
    },
    [endTracking, syncOffset],
  );

  useEffect(() => () => endTracking(), [endTracking]);

  const cards = useMemo(
    () => Children.toArray(children).filter(isValidElement),
    [children],
  );

  const first = cards[0];
  const second = cards[1];

  if (cards.length === 0) return null;
  if (cards.length === 1) {
    return <div className="w-full">{first}</div>;
  }

  const aria =
    labels.length >= 2
      ? `Swipe horizontally on the front card to switch between ${labels[0]} and ${labels[1]}.`
      : "Swipe horizontally on the front card to switch cards.";

  return (
    <div
      className="flex flex-col items-center w-full"
      role="group"
      aria-label={aria}
    >
      <div className="relative w-full max-w-60 mx-auto aspect-3/4 min-h-[280px]">
        {[0, 1].map((i) => {
          const card = i === 0 ? first : second;
          const isFront = activeIndex === i;
          const dragging = isFront && dragOffset !== 0;
          return (
            <div
              key={i}
              className={`absolute inset-0 flex justify-center items-center ease-out ${
                isFront
                  ? `z-20 scale-100 translate-x-0 translate-y-0 rotate-0 touch-pan-y ${
                      dragging ? "select-none" : "transition-all duration-300"
                    }`
                  : "z-10 scale-[0.93] translate-x-2 translate-y-3 rotate-12 opacity-[0.92] transition-all duration-300"
              }`}
              onPointerDown={isFront ? handleFrontPointerDown : undefined}
              style={
                isFront && dragging
                  ? {
                      transform: `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset * 0.02}deg) scale(1)`,
                      transition: "none",
                    }
                  : undefined
              }
            >
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
