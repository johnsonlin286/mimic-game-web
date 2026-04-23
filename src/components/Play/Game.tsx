import { useState, useEffect } from "react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import WordCard from "@/components/Play/WordCard";
import VoteBoard from "@/components/Play/VoteBoard";


export default function PlayGame() {
  const [gameWord, setGameWord] = useState<string>("");
  const { socket } = useSocket();
  const { setRoom } = useRoomStore();

  useEffect(() => {
    if (!socket) return;

    socket.on("listen-game-initialized-player", (response) => {
      console.log("listen game-initialized-player", response);
      setGameWord(response.data.gameWord);
    })
  }, [socket, setRoom]);

  return (
    <div className="h-[calc(100vh-15rem)] flex flex-col justify-between gap-2">
      <WordCard word={gameWord} />
      <div className="flex justify-center items-center">
        <VoteBoard />
      </div>
    </div>
  )
}