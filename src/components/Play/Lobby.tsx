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
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:start", {
      roomId,
      playerEmail: session.user.email,
    }).on("game-start-failed", (response: GameStartErrorResponse) => {
      console.log("game-start-failed", response);
    }).on("initialize-game", () => {
      console.log("initialize-game");
      socket.emit("game:initialize", {
        roomId,
      }).on("game-initialize-failed", (response) => {
        console.log("game-initialize-failed", response);
      });
    });
  }, [socket, roomId, session]);

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