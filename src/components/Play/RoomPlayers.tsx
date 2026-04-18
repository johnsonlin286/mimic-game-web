import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { Crown } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Panel from "@/components/Panel";
import Button from "@/components/Button";

interface RoomPlayersProps {
  isHost: boolean;
}

export default function RoomPlayers({ isHost }: RoomPlayersProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const { roomId, roomPlayers } = useRoomStore();

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
    <Panel collapsible title="Players">
      <ul className="flex flex-col gap-2">
        {roomPlayers.map((player, index) => (
          <li key={index} className="flex items-center justify-between gap-2 not-last:border-b border-zinc-200 pb-2">
            <strong className="font-bold flex items-center gap-2">
              {player.playerName}
              {player.role === "host" && <Crown />}
            </strong>
            {isHost && player.playerEmail !== session?.user?.email && (
              <Button size="sm" variant="danger" onClick={() => emitKickPlayer(player.socketId, player.playerEmail)}>
                Kick Player
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}