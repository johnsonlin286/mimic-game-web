import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket from "@/hooks/useSocket";
import PlayGameSetup from "@/components/Play/GameSetup";
import RoomPlayers from "@/components/Play/RoomPlayers";
import Button from "@/components/Button";

export default function PlayLobby() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { roomId, roomPlayers, gameRule } = useRoomStore();
  const { setToast } = useToastStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";

  const handleStartGame = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:start", {
      roomId,
      playerEmail: session.user.email,
    }).once("game-start-failed", (response: GameStartErrorResponse) => {
      setToast(response.message, "error");
    }).once("initialize-game", () => {
      socket.emit("game:initialize", {
        roomId,
      }).once("game-initialize-failed", (response) => {
        setToast(response.message, "error");
      });
    });
  }, [socket, roomId, session, setToast]);

  return (
    <>
      <PlayGameSetup isHost={isHost} />
      <RoomPlayers isHost={isHost} />
      {isHost ? (
        <Button variant="success" disabled={gameRule.status !== "ready"} onClick={handleStartGame} className="w-full my-5">
          Start Game
        </Button>
      ) : (
        <p className="text-center text-baby text-xl md:text-2xl font-bold mt-5">Waiting for host to start the game...</p>
      )}
    </>
  )
}