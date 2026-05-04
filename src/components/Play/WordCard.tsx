import { useState } from "react";
import { useLongPress } from "@uidotdev/usehooks";

interface WordCardProps {
  label?: string;
  word: string;
  orientation?: "portrait" | "landscape";
  onFlip?: () => void;
}

export default function WordCard({ label, word, orientation = "portrait", onFlip }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(true);
  const attrs = useLongPress(() => {
    setIsFlipped(!isFlipped);
  }, {
    threshold: 500,
    onFinish: () => {
      setIsFlipped(!isFlipped);
      onFlip?.();
    },
    onCancel: () => {
      onFlip?.();
    },
  });

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div role="button" {...attrs} className={`relative w-full h-full ${orientation === "portrait" ? "md:max-w-60 md:max-h-80 aspect-3/4" : "md:max-w-80 md:max-h-60 aspect-4/3"} perspective-1000 transform-3d transition-all duration-300 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="w-full h-full transform-3d">
          <div className="absolute flex flex-col justify-center items-center gap-2 w-full h-full backface-hidden bg-white border border-zinc-100 rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-center">{word ? word : "You are the Blind"}</h1>
            {!word && (
              <p className="text-sm text-zinc-500 text-center">
                Collect information from other players to guess the word.
              </p>
            )}
          </div>
          <div className="absolute flex flex-col justify-between items-center w-full h-full backface-hidden rotate-y-180 bg-amber-900 rounded-2xl shadow-lg p-6">
            <div className="flex-1 flex flex-col gap-3 justify-center items-center">
              <strong className="text-white text-2xl font-bold">{label ?? "GAME LOGO"}</strong>
              <p className="text-sm text-center text-zinc-100">
                Tap and hold to reveal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}