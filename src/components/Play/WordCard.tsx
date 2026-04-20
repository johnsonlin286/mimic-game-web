import { useState } from "react";
import { useLongPress } from "@uidotdev/usehooks";

interface WordCardProps {
  word: string;
}

export default function WordCard({ word }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(true);
  const attrs = useLongPress(() => {
    setIsFlipped(!isFlipped);
  }, {
    threshold: 300,
    onFinish: () => {
      setIsFlipped(!isFlipped);
    },
  });

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div role="button" {...attrs} className={`relative w-full h-full md:max-w-60 md:max-h-80 aspect-3/4 perspective-1000 transform-3d transition-all duration-300 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="w-full h-full transform-3d">
          <div className="absolute flex justify-center items-center w-full h-full backface-hidden bg-white border border-zinc-100 rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold">{word}</h1>
          </div>
          <div className="absolute flex flex-col justify-between items-center w-full h-full backface-hidden rotate-y-180 bg-neutral-500 rounded-2xl shadow-lg p-6">
            <div className="flex-1 flex justify-center items-center">
              <strong>LOGO MIMIC</strong>
            </div>
            <p className="text-sm text-zinc-100">Click and hold to flip</p>
          </div>
        </div>
      </div>
    </div>
  )
}