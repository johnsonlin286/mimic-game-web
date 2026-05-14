import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

import { useSession } from "next-auth/react";
import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket from "@/hooks/useSocket";
import CardStack from "@/components/Play/CardStack";
import WordCard from "@/components/Play/WordCard";
import PowerCard from "@/components/Play/PowerCard";
import VoteBoard from "@/components/Play/VoteBoard";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

interface OverlayMessage {
  superpowerName: string;
  userName?: string;
  message?: string;
}

export default function PlayGame() {
  const [playerData, setPlayerData] = useState<PlayerWithRole | null>(null);
  const [gameWord, setGameWord] = useState<string>("");
  const [superpower, setSuperpower] = useState<Superpower | null>(null);
  const [activeSuperpower, setActiveSuperpower] = useState<string | null>(null);
  const [superpowerModal, setSuperpowerModal] = useState<boolean>(false);
  const [superpowerOptions, setSuperpowerOptions] = useState<Partial<PlayerWithRole>[]>([]);
  const [overlay, setOverlay] = useState<boolean>(false);
  const [overlayMessage, setOverlayMessage] = useState<OverlayMessage | null>(null);
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { roomId, gameData, setRoom } = useRoomStore();
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
      setSuperpowerModal(true);
      setSuperpowerOptions(response.data);
    })

    socket.on("interrogator-pick-target-failed", (response) => {
      setToast(response.message, "error");
      setOverlayMessage(response.data);
    })

    socket.on("interrogator-pick-target-success", (response) => {
      setToast(response.message, "success");
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }))
    })

    socket.on("listen-interrogator-pick-target-success", (response) => {
      setActiveSuperpower(response.data.superpowerName);
      setOverlayMessage(response.data);
      // const timeout = setTimeout(() => {
      //   setSuperpowerOptions([]);
      //   setActiveSuperpower(null);
      //   socket.emit("game:hide-overlay", roomId);
      //   clearTimeout(timeout);
      // }, 5000);
    })

    socket.on("use-superpower-detective", (response) => {
      console.log('use-superpower-detective', response)
      setSuperpowerModal(true);
      setSuperpowerOptions(response.data);
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }))
    })

    socket.on("use-superpower-wiretapper", (response) => {
      console.log('use-superpower-wiretapper', response)
      setSuperpowerModal(true);
      setSuperpowerOptions(response.data);
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }))
    })

    socket.on("listen-use-superpower-success", (response) => {
      setToast(response.message, "success");
      setActiveSuperpower(response.data.superpowerName);
      setOverlayMessage({
        superpowerName: response.data.superpowerName,
        message: response.message,
      })
      setOverlay(true);
    })

    socket.on("use-superpower-failed", (response) => {
      setToast(response.message, "error");
    })

    socket.on("listen-hide-overlay-success", (response) => {
      console.log('listen-hide-overlay-success', response)
      setOverlay(false);
      setOverlayMessage(null);
    })
  }, [socket, roomId, setRoom, setToast, setOverlay, setOverlayMessage, setActiveSuperpower, setSuperpowerOptions]);

  const handleInterrogatorPickTarget = useCallback((targetPlayerEmail: string) => {
    if (!socket || !roomId || !targetPlayerEmail) return;
    socket.emit("superpower:interrogator-pick-target", {
      roomId,
      playerEmail: session?.user?.email,
      targetPlayerEmail,
    })
  }, [socket, roomId, session?.user?.email])

  useEffect(() => {
    const player = gameData?.players?.find((player: PlayerWithRole) => player.playerEmail === session?.user?.email);
    setPlayerData(player ?? null);
    // setGameWord(player?.gameWord ?? "");
    // setSuperpower(player?.superpower ?? null);
  }, [gameData, session])

  return (
    <div className="flex flex-col justify-between gap-2 h-[calc(100vh-100px)]">
      {playerData && playerData.isAlive ? (
        <CardStack labels={["Word", "Superpower"]}>
          <WordCard word={gameWord} />
          {superpower && <PowerCard power={superpower} />}
        </CardStack>
      ) : <></>}
      <div className="flex flex-col justify-center items-center">
        <VoteBoard />
      </div>
      {overlay && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-xl z-40">
          {overlayMessage && (
            <div className="flex flex-col justify-center items-center gap-5">
              <h3 className="text-5xl font-bold uppercase">{overlayMessage.superpowerName}</h3>
              <Image src={'/images/shift-logo.webp'} alt={overlayMessage.superpowerName} width={0} height={0} sizes="100vw" className="w-full h-auto max-w-60" />
              <p className="text-lg text-center">
                {overlayMessage.message}
              </p>
            </div>
          )}
        </div>
      )}
      <Modal isOpen={superpowerModal} onClose={() => setSuperpowerModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Choose a player</h2>
          <ul className="grid grid-cols-2 gap-2">
            {superpowerOptions.map((player) => (
              <li key={player.socketId}>
                {activeSuperpower === 'interrogator' ? (
                  <div className="w-full h-full">
                    <input type="radio" name="interrogator" id={player.playerName} value={player.playerName} onChange={() => handleInterrogatorPickTarget(player.playerEmail ?? "")} className="absolute opacity-0 w-0 h-0 peer" />
                    <label htmlFor={player.playerName} className="flex justify-center items-center w-full h-full font-fredoka font-bold text-white text-2xl text-center rounded-2xl shadow-lg bg-slate-500 peer-checked:bg-mint p-6">
                      {player.playerName}
                    </label>
                  </div>
                ) : (
                  <WordCard
                    label={player.playerName}
                    word={player.gameRole || player.gameWord || ""}
                    orientation="landscape"
                    onFlip={() => {
                      setSuperpowerModal(false);
                      socket.emit("game:hide-overlay", roomId);
                      const timeout = setTimeout(() => {
                        setSuperpowerOptions([]);
                        clearTimeout(timeout);
                      }, 1000);
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
          {activeSuperpower === 'interrogator' && overlayMessage?.userName === playerData?.playerName && (
            <Button variant="primary" size="sm" className="w-full" onClick={() => {
              socket.emit("game:hide-overlay", roomId);
              setSuperpowerModal(false);
              setOverlay(false);
              setSuperpowerOptions([]);
              setActiveSuperpower(null);
              setOverlayMessage(null);
            }}>
              Ok
            </Button>
          )}
        </div>
      </Modal>
    </div>
  )
}