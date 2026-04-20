import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import WordCard from "@/components/Play/WordCard";
import VoteBoard from "@/components/Play/VoteBoard";

interface PlaGameProps {
  isHost: boolean;
}

export default function PlayGame({ isHost }: PlaGameProps) {
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

    socket.on("listen-game-initialize-success", (response) => {
      console.log("listen game-initialize-success", response);
      
    })

    socket.on("listen-game-initialized-player", (response) => {
      console.log("listen game-initialized-player", response);
      setPlayerRole(response.data.gameRole);
      setGameWord(response.data.gameWord);
    })

  }, [socket, roomId]);

  return (
    <div className="h-[calc(100vh-15rem)] flex flex-col justify-between gap-2">
      <WordCard word={gameWord} />
      {/* {isHost && (
        <div className="flex justify-center items-center">
          <VoteBoard />
        </div>
      )} */}
      <div className="flex justify-center items-center">
        <VoteBoard />
      </div>
    </div>
  )
}