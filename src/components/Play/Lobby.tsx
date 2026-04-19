import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import PlayGameSetup from "@/components/Play/GameSetup";
import RoomPlayers from "@/components/Play/RoomPlayers";
import Button from "@/components/Button";

export default function PlayLobby() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { roomId, roomPlayers } = useRoomStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";

  const handleStartGame = useCallback(() => {
    if (!socket) return;
    socket.emit("game:start", {
      roomId,
    }).on("game-start-failed", (response: GameStartErrorResponse) => {
      console.log("game-start-failed", response);
    });
  }, [socket, roomId]);

  return (
    <>
      <PlayGameSetup isHost={isHost} />
      <RoomPlayers isHost={isHost} />
      {isHost && (
        <Button variant="success" size="lg" /*disabled={gameRule.status !== "ready"}*/ onClick={handleStartGame} className="w-full">
          Start Game
        </Button>
      )}
    </>
  )
}