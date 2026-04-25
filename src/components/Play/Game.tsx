import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";
import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import WordCard from "@/components/Play/WordCard";
import VoteBoard from "@/components/Play/VoteBoard";


export default function PlayGame() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { gameData, setRoom } = useRoomStore();
  const [gameWord, setGameWord] = useState<string>("");
  const [playerData, setPlayerData] = useState<PlayerWithRole | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("listen-game-initialized-player", (response) => {
      console.log("listen game-initialized-player", response);
      setGameWord(response.data.gameWord);
    })
  }, [socket, setRoom]);

  useEffect(() => {
    const player = gameData?.players?.find((player: PlayerWithRole) => player.playerEmail === session?.user?.email);
    setPlayerData(player ?? null);
  }, [gameData, session])

  return (
    <div className="h-[calc(100vh-15rem)] flex flex-col justify-between gap-2">
      {playerData && playerData.isAlive ? <WordCard word={gameWord} /> : <></>}
      <div className="flex justify-center items-center">
        <VoteBoard />
      </div>
    </div>
  )
}