import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { IMAGE_ASSETS_URL } from "@/services/const";
import { useLongPress } from "@uidotdev/usehooks";
import { useRoomStore } from '@/store/room-state';
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";

interface PowerCardProps {
  power: Superpower;
}

export default function PowerCard({ power }: PowerCardProps) {
  const [isFlipped, setIsFlipped] = useState(true);

  const { data: session } = useSession();
  const { socket } = useSocket();
  const { roomId } = useRoomStore();

  useEffect(() => {
    if (!socket) return;

    const resetFlip = () => setIsFlipped(true);

    socket.on("listen-game-restart-success", resetFlip);
    socket.on("listen-game-initialize-success", resetFlip);

    return () => {
      socket.off("listen-game-restart-success", resetFlip);
      socket.off("listen-game-initialize-success", resetFlip);
    };
  }, [socket]);

  const attrs = useLongPress(() => {
    setIsFlipped(!isFlipped);
  }, {
    threshold: 500,
  });

  const handleUsePower = useCallback((name: string) => {
    if (!socket) return;
    switch (name) {
      case "interrogator":
        socket.emit("superpower:use-power", {
          roomId: roomId,
          playerEmail: session?.user?.email,
          powerName: name,
        });
        break;
      case "detective":
        socket.emit("superpower:use-power", {
          roomId: roomId,
          playerEmail: session?.user?.email,
          powerName: name,
        });
        break;
      case "wiretapper":
        socket.emit("superpower:use-power", {
          roomId: roomId,
          playerEmail: session?.user?.email,
          powerName: name,
        });
        break;
      default:
        break;
    }
  }, [socket, session, roomId]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div role="button" {...attrs} className={`relative w-full h-full md:max-w-60 md:max-h-80 aspect-3/4 perspective-1000 transform-3d transition-all duration-300 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="w-full h-full transform-3d">
          <div className="absolute flex flex-col justify-between items-center gap-2 w-full h-full backface-hidden bg-dark-navy rounded-2xl shadow-lg p-6">
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <h1 className="text-3xl font-bold text-center text-white uppercase">{power.name}</h1>
              <p className="text-sm text-white text-center">{power.description}</p>
            </div>
            {power.type === 'active' && (
              <Button variant="primary" size="sm" disabled={power.isUsed} onClick={() => handleUsePower(power.name)} className="w-full self-end">
                {power.isUsed ? "Power Used" : "Use Power"}
              </Button>
            )}
          </div>
          <div className="absolute flex flex-col justify-between items-center w-full h-full backface-hidden rotate-y-180 bg-dark-navy rounded-2xl shadow-lg p-6">
            <div className="flex-1 flex flex-col gap-3 justify-center items-center">
              <Image src={`${IMAGE_ASSETS_URL}/images/power-card.webp`} alt="morf-blank" width={150} height={150} sizes="100vw" className="pointer-events-none"/>
              <p className="text-sm text-center text-white font-fredoka">
                Tap and hold to reveal your special skill
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}