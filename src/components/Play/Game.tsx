import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";
import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket from "@/hooks/useSocket";
import CardStack from "@/components/Play/CardStack";
import WordCard from "@/components/Play/WordCard";
import PowerCard from "@/components/Play/PowerCard";
import VoteBoard from "@/components/Play/VoteBoard";
import Modal from "@/components/Modal";

export default function PlayGame() {
  const [gameWord, setGameWord] = useState<string>("");
  const [superpower, setSuperpower] = useState<Superpower | null>(null);
  const [playerData, setPlayerData] = useState<PlayerWithRole | null>(null);
  const [detectiveModal, setDetectiveModal] = useState<boolean>(false);
  const [detectiveOptions, setDetectiveOptions] = useState<Partial<PlayerWithRole>[]>([]);
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { gameData, setRoom } = useRoomStore();
  const { setToast } = useToastStore();

  useEffect(() => {
    if (!socket) return;

    socket.on("listen-game-initialized-player", (response) => {
      // console.log('listen-game-initialized-player', response)
      setGameWord(response.data.gameWord);
      setSuperpower(response.data.superpower ?? null);
    })

    socket.on("use-superpower-interrogator", (response) => {
      console.log('use-superpower-interrogator', response)
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }))
    })

    socket.on("use-superpower-detective", (response) => {
      console.log('use-superpower-detective', response)
      setDetectiveModal(true);
      setDetectiveOptions(response.data);
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }))
    })

    socket.on("listen-use-superpower-detective", (response) => {
      setToast(response.message, "success");
    })

    socket.on("listen-use-superpower-success", (response) => {
      console.log('listen-use-superpower-success', response)
      setToast(response.message, "success");
    })

    socket.on("use-superpower-failed", (response) => {
      setToast(response.message, "error");
    })
  }, [socket, setRoom, setToast]);

  useEffect(() => {
    const player = gameData?.players?.find((player: PlayerWithRole) => player.playerEmail === session?.user?.email);
    setPlayerData(player ?? null);
    // setGameWord(player?.gameWord ?? "");
    // setSuperpower(player?.superpower ?? null);
  }, [gameData, session])

  return (
    <div className="h-[calc(100vh-15rem)] flex flex-col justify-between gap-2">
      {playerData && playerData.isAlive ? (
        <CardStack labels={["Word", "Superpower"]}>
          <WordCard word={gameWord} />
          {superpower && <PowerCard power={superpower} />}
        </CardStack>
      ) : <></>}
      <div className="flex justify-center items-center">
        <VoteBoard />
      </div>
      <Modal isOpen={detectiveModal} onClose={() => setDetectiveModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Choose a player to investigate</h2>
          <ul className="grid grid-cols-2 gap-2">
            {detectiveOptions.map((player) => (
              <li key={player.socketId}>
                <WordCard
                  label={player.playerName}
                  word={player.gameRole ?? ""}
                  orientation="landscape"
                  onFlip={() => {
                    setDetectiveModal(false);
                    const timeout = setTimeout(() => {
                      setDetectiveOptions([]);
                      clearTimeout(timeout);
                    }, 1000);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  )
}