import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

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
    socket.on("listen-game-restart-success", () => {
      setIsFlipped(true);
    })

    socket.on("listen-game-initialize-success", () => {
      setIsFlipped(true);
    })
  }, [socket])

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
      default:
        break;
    }
  }, [socket, session, roomId]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div role="button" {...attrs} className={`relative w-full h-full md:max-w-60 md:max-h-80 aspect-3/4 perspective-1000 transform-3d transition-all duration-300 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
        <div className="w-full h-full transform-3d">
          <div className="absolute flex flex-col justify-between items-center gap-2 w-full h-full backface-hidden bg-white border border-zinc-100 rounded-2xl shadow-lg p-6">
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <h1 className="text-2xl font-bold text-center">{power.name}</h1>
              <p className="text-sm text-zinc-500 text-center">{power.description}</p>
            </div>
            {power.type === 'active' && (
              <Button variant="primary" size="sm" disabled={power.isUsed} onClick={() => handleUsePower(power.name)} className="w-full self-end">
                {power.isUsed ? "Power Used" : "Use Power"}
              </Button>
            )}
          </div>
          <div className="absolute flex flex-col justify-between items-center w-full h-full backface-hidden rotate-y-180 bg-orange-500 rounded-2xl shadow-lg p-6">
            <div className="flex-1 flex flex-col gap-3 justify-center items-center">
              <strong className="text-white text-2xl font-bold">GAME LOGO</strong>
              <p className="text-sm text-center text-zinc-100">
                Tap and hold to reveal your superpower
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}