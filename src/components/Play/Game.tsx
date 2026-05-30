import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

import { useSession } from "next-auth/react";
import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import { alertSound, playSfx } from '@/utils/sounds';
import { IMAGE_ASSETS_URL } from "@/services/const";
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
  const { roomId, gameData } = useRoomStore();
  const { setToast } = useToastStore();
  const setToastRef = useRef(setToast);
  setToastRef.current = setToast;

  useEffect(() => {
    if (!socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameInitializedPlayer = (response: any) => {
      if (!response) return;
      console.log("handleGameInitializedPlayer", response.data.gameWord, response.data.superpower);
      setGameWord(response.data.gameWord);
      setSuperpower(response.data.superpower ?? null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUseSuperpowerInterrogator = (response: any) => {
      if (!response) return;
      setSuperpowerModal(true);
      setSuperpowerOptions(response.data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInterrogatorPickTargetFailed = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "error");
      setOverlayMessage(response.data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInterrogatorPickTargetSuccess = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "success");
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUseSuperpowerDetective = (response: any) => {
      if (!response) return;
      setSuperpowerModal(true);
      setSuperpowerOptions(response.data);
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUseSuperpowerWiretapper = (response: any) => {
      if (!response) return;
      setSuperpowerModal(true);
      setSuperpowerOptions(response.data);
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: true,
      }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUseSuperpowerSuccess = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "success");
      setActiveSuperpower(response.data.superpowerName);
      setOverlayMessage({
        superpowerName: response.data.superpowerName,
        message: response.message,
      });
      setOverlay(true);
      playSfx(alertSound);
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUseSuperpowerFailed = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "error");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleActivatePassivePowerSuccess = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "success");
      setSuperpower((prev) => ({
        ...(prev as Superpower),
        isUsed: response.data.activated,
      }));
    };

    const handleHideOverlaySuccess = () => {
      setOverlay(false);
      setOverlayMessage(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoomRejoinSuccess = (response: any) => {
      if (!response) return;
      setGameWord(response.data.gameData.gameWord);
      setSuperpower(response.data.gameData.superpower);
    }

    const events: [string, (...args: unknown[]) => void][] = [
      ["listen-game-initialized-player", handleGameInitializedPlayer],
      ["use-superpower-interrogator", handleUseSuperpowerInterrogator],
      ["interrogator-pick-target-failed", handleInterrogatorPickTargetFailed],
      ["interrogator-pick-target-success", handleInterrogatorPickTargetSuccess],
      ["use-superpower-detective", handleUseSuperpowerDetective],
      ["use-superpower-wiretapper", handleUseSuperpowerWiretapper],
      ["listen-use-superpower-success", handleUseSuperpowerSuccess],
      ["use-superpower-failed", handleUseSuperpowerFailed],
      ["activate-passive-power-success", handleActivatePassivePowerSuccess],
      ["listen-hide-overlay-success", handleHideOverlaySuccess],
      ["room-rejoin-success", handleRoomRejoinSuccess],
    ];

    events.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      events.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket]);

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
        <VoteBoard playerSuperpower={superpower as Superpower} />
      </div>
      {overlay && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-xl z-40">
          {overlayMessage && (
            <div className="flex flex-col justify-center items-center gap-5">
              <h3 className="text-5xl font-bold uppercase">{overlayMessage.superpowerName}</h3>
              <Image src={`${IMAGE_ASSETS_URL}/images/morf-logo.webp`} alt="morf-logo" width={0} height={0} sizes="100vw" className="w-full h-auto max-w-60" />
              <p className="text-lg text-center">
                {overlayMessage.message}
              </p>
            </div>
          )}
        </div>
      )}
      <Modal isOpen={superpowerModal} dismissible={false} onClose={() => setSuperpowerModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Choose a player</h2>
          <ul className="grid grid-cols-2 gap-2">
            {superpowerOptions.map((player) => (
              <li key={player.socketId}>
                {activeSuperpower === 'interrogator' ? (
                  <div className="w-full h-full">
                    <input type="radio" name="interrogator" id={player.playerName} value={player.playerName} disabled={superpower?.isUsed} onChange={() => handleInterrogatorPickTarget(player.playerEmail ?? "")} className="absolute opacity-0 w-0 h-0 peer" />
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
          {activeSuperpower === 'interrogator' && (
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