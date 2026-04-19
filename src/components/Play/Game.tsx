import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";

export default function PlayGame() {
  const [gameWord, setGameWord] = useState<string>("");
  const [playerRole, setPlayerRole] = useState<string>("");
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { roomId, roomPlayers, gameRule, setRoom, resetRoom } = useRoomStore();

  useEffect(() => {
    if (!socket) return;

    socket.emit("game:initialize", {
      roomId,
    }).on("game-initialize-failed", (response) => {
      console.log("game-initialize-failed", response);
    });

    socket.on("listen-game-initialized-player", (response) => {
      console.log("listen game-initialized-player", response);
      setPlayerRole(response.data.gameRole);
      setGameWord(response.data.gameWord);
    })

  }, [socket, roomId]);

  return (
    <>
      <h1>Game Started</h1>
      <strong>role: {playerRole}</strong>
      <br />
      <strong>word: {gameWord}</strong>
    </>
  )
}