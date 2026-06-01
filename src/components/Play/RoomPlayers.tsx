import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import Image from "next/image";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";
import LabelPill from "../LabelPill";

interface RoomPlayersProps {
  isHost: boolean;
}

export default function RoomPlayers({ isHost }: RoomPlayersProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const { roomId, roomPlayers, roomMaxPlayers, gameRule } = useRoomStore();

  const emitKickPlayer = useCallback((targetSocketId: string, targetPlayerEmail: string) => {
    if (!socket || !socket.id || !isConnected) return;
    if (!session?.user?.email || !roomId) return;

    const payload: RoomKickPlayerPayload = {
      roomId,
      socketId: targetSocketId,
      playerEmail: targetPlayerEmail,
    };

    socket.emit("room:kick", payload)
      .on("room-kick-failed", (response) => {
        console.error("room-kick-failed", response);
      });
  }, [socket, isConnected, session, roomId]);

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold">
        Players:
        <span className="text-lg md:text-xl">
          {roomPlayers.length} / {roomMaxPlayers}
        </span>
        <LabelPill label={gameRule.status} variant={gameRule.status === "waiting" ? "warning" : gameRule.status === "ready" ? "success" : gameRule.status === "playing" ? "danger" : "slate"} />
      </h3>
      <ul className="flex flex-col gap-2.5">
        {roomPlayers.map((player, index) => (
          <li key={index} className="flex items-center justify-between gap-4 bg-slate-500 border-4 border-black rounded-2xl p-2.5">
            <Image src={player.playerAvatar} alt={player.playerName} width={0} height={0} sizes="100vw" className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black" />
            <h2 className="flex items-center gap-2 flex-1 font-fredoka font-bold text-xl md:text-2xl capitalize">
              {player.playerName}
            </h2>
            {player.role === "host" && <Star className="w-8 h-8 text-warning rotate-90" />}
            {isHost && player.playerEmail !== session?.user?.email && (
              <Button size="sm" variant="danger" onClick={() => emitKickPlayer(player.socketId, player.playerEmail)}>
                Kick
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}