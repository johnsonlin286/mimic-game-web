import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import { alertSound, playSfx } from '@/utils/sounds';
import useSocket from "@/hooks/useSocket";
import Panel from "@/components/Panel";
import Modal from "@/components/Modal";
import SwitchInput from "@/components/SwitchInput";
import InfoPopover from "@/components/InfoPopover";
import SelectLanguages from "@/components/SelectLanguages";
import CategoriesOption from "@/components/CategoriesOption";
import Button from "@/components/Button";

interface PlayGameSetupProps {
  isHost: boolean;
}

export default function PlayGameSetup({ isHost }: PlayGameSetupProps) {
  const router = useRouter();
  const [gameSetupModal, setGameSetupModal] = useState(false);
  const [setupFormData, setSetupFormData] = useState<Partial<GameRule>>({
    roles: {
      minority: true,
      blind: false,
    },
    superpowers: false,
    category: "",
    language: "en",
  });
  const { setToast } = useToastStore();
  const { socket } = useSocket();
  const { roomId, roomPlayers, gameRule, setRoom, resetRoom } = useRoomStore();
  
  useEffect(() => {
    if (!socket) return;

    const handleGameRuleUpdateSuccess = (response: GameRuleUpdateResponse) => {
      setToast("Game rule updated", "success");
      setRoom(response.data as RoomResponseData);
      playSfx(alertSound);
    };
    
    socket.on("listen-game-rule-update-success", handleGameRuleUpdateSuccess);

    return () => {
      socket.off("listen-game-rule-update-success", handleGameRuleUpdateSuccess);
    };
  }, [socket, setRoom, setToast]);

  useEffect(() => {
    setSetupFormData({
      ...gameRule,
    });
  }, [gameRule]);

  const handleSetupFormChange = (key: keyof Partial<GameRule>, value: unknown) => {
    switch (key) {
      case "roles":
        setSetupFormData((prev) => ({
          ...prev,
          roles: {
            minority: setupFormData.roles?.minority as boolean,
            blind: (value as { blind: boolean }).blind,
          },
        }));
        break;
      case "language":
        setSetupFormData((prev) => ({
          ...prev,
          language: value as string,
        }));
        break;
      case "category":
        setSetupFormData((prev) => ({
          ...prev,
          category: value as string,
        }));
        break;
      case "superpowers":
        setSetupFormData((prev) => ({
          ...prev,
          superpowers: value as boolean,
        }));
        break;
      default:
    }
  };

  const handleSaveGameSetup = () => {  
    socket.emit("game:update-rule", {
      roomId,
      gameRule: setupFormData,
    }).on('game-rule-update-failed', (response: GameRuleUpdateResponse) => {
      const { message } = response;
      switch (message) {
        case "Room not found":
          resetRoom();
          router.push("/");
          break;
        default:
          break;
      }
    });
    setGameSetupModal(false);
  }

  return (
    <>
      <Panel collapsible title="Game Setup" className="flex flex-col">
        <div className="flex flex-col gap-2.5">
          {isHost ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <strong>{(() => {
                    const n = roomPlayers?.length ?? 0;
                    if (n >= 9) return "3";
                    if (n >= 7) return "2";
                    return "1";
                  })()}x</strong>
                  <InfoPopover label="MORF Agent" text={`MORF Agent is who get different word.`} />
                </div>
                <SwitchInput id="minority" checked={setupFormData.roles?.minority || false} disabled onCheckedChange={(value) => handleSetupFormChange("roles", { minority: value })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(() => {
                    const n = roomPlayers?.length ?? 0;
                    if (n >= 5) return <strong>1x </strong>;
                    if (n >= 11) return <strong>2x </strong>;
                    return "";
                  })()}
                  <InfoPopover label="Rogue Agent" text={`Rogue Agent is who don't get any word. Minimum 5 players to enable. `} />
                </div>
                <SwitchInput id="blind" checked={setupFormData.roles?.blind || false} disabled={roomPlayers?.length && roomPlayers?.length < 5 ? true : false} onCheckedChange={(value) => handleSetupFormChange("roles", { blind: value })} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <InfoPopover label="Specialist" text="Player will randomly receive a special role. Minimum 5 players to enable." />
                <SwitchInput id="superpower" checked={setupFormData.superpowers || false} /*disabled={roomPlayers?.length && roomPlayers?.length < 5 ? true : false}*/ onCheckedChange={(value) => handleSetupFormChange("superpowers", value)} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <InfoPopover label="Image Mode" text="Show secret image instead of word."/>
                <SwitchInput id="mode" disabled checked={false} onCheckedChange={() => null}/>
              </div>
              <div className="flex items-center gap-2 w-full">
                <SelectLanguages socket={socket} value={setupFormData?.language} onChange={(value) => handleSetupFormChange("language", value)} />
              </div>
              <div className="flex items-center gap-2 w-full">
                <CategoriesOption socket={socket} lang={setupFormData?.language || "en"} selected={setupFormData?.category} onChange={(value) => handleSetupFormChange("category", value)} />
              </div>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="primary" size="sm" onClick={handleSaveGameSetup} className="w-full max-w-40">Save</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <strong>{(() => {
                    const n = roomPlayers?.length ?? 0;
                    if (n >= 9) return "3";
                    if (n >= 7) return "2";
                    return "1";
                  })()}x</strong>
                  <InfoPopover label="False Agent" text="False Agent is who get different word." />
                </div>
                <strong className={`${gameRule.roles?.minority ? 'text-mint' : ''}`}>
                  {gameRule.roles?.minority ? "Enabled" : "Disabled"}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  {(() => {
                    const n = roomPlayers?.length ?? 0;
                    if (n >= 5) return <strong>1x </strong>;
                    if (n >= 11) return <strong>2x </strong>;
                    return "";
                  })()}
                  <InfoPopover label="Unknown Origin" text="Unknown Origin is who don't get any word. Minimum 5 players to enable." />
                </div>
                <strong className={`${gameRule.roles?.blind ? 'text-mint' : ''}`}>
                  {gameRule.roles?.blind ? "Enabled" : "Disabled"}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <InfoPopover label="Specialist" text="Player will randomly receive a special role. Minimum 5 players to enable." />
                <strong className={`${gameRule.superpowers ? 'text-mint' : ''}`}>
                  {gameRule.superpowers ? "Enabled" : "Disabled"}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                <InfoPopover label="Image Mode" text="Show secret image instead of word."/>
                <strong>
                  Disabled
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2 w-full">
                <strong>Language</strong>
                <strong>
                  {gameRule.language === "en" ? "English" : "Indonesian"}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2 w-full">
                <strong>Categories</strong>
                <strong className="capitalize">
                  {gameRule.category}
                </strong>
              </div>
            </>
          )}
        </div>
        {/* <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col">
            <p className={`flex items-center gap-2 ${gameRule.roles?.minority ? "opacity-100" : "opacity-30"}`}>
              <strong>
                The Minority:
              </strong>
              <strong>
                {(() => {
                  const n = roomPlayers?.length ?? 0;
                  if (n >= 9) return "3";
                  if (n >= 7) return "2";
                  return "1";
                })()}
              </strong>
            </p>
            <p className={`flex items-center gap-2 ${gameRule.roles?.blind ? "opacity-100" : "opacity-20"}`}>
              <strong>
                The Blind:
              </strong>
              <strong>
                {(() => {
                  const n = roomPlayers?.length ?? 0;
                  if (n >= 5) return "1";
                  if (n >= 11) return "2";
                  return "0";
                })()}
              </strong>
            </p>
            <p className="flex items-center gap-2">
              <strong>
                Superpower:
              </strong>
              <strong>
                {gameRule.superpowers ? "Yes" : "No"}
              </strong>
            </p>
            <p className="flex items-center gap-2">
              <strong>
                Language:
              </strong>
              <strong>
                {gameRule.language === "en" ? "English" : "Indonesian"}
              </strong>
            </p>
            <p className="flex items-center gap-2">
              <strong>
                Category:
              </strong>
              <strong>
                {gameRule.category}
              </strong>
            </p>
          </div>
          <div>
            {isHost && (
              <Button variant="secondary" size="sm" onClick={() => setGameSetupModal(true)} className="flex items-center justify-center gap-2">
                <Wrench className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div> */}
      </Panel>
      <Modal isOpen={gameSetupModal} onClose={() => setGameSetupModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Game Setup</h2>
          <div className="flex flex-col gap-1">
            <SwitchInput id="minority" labelLeft="The Minority" checked={setupFormData.roles?.minority || false} disabled onCheckedChange={(value) => handleSetupFormChange("roles", { minority: value })} />
            <small className="text-zinc-500">The Minority is who get different word than other players.</small>
            <SwitchInput id="blind" labelLeft="The Blind" checked={setupFormData.roles?.blind || false} disabled={roomPlayers?.length && roomPlayers?.length < 5 ? true : false} onCheckedChange={(value) => handleSetupFormChange("roles", { blind: value })} />
            <small className="text-zinc-500">The Blind is who not get any word.</small>
            <SwitchInput id="superpower" labelLeft="Superpower" checked={setupFormData.superpowers || false} /*disabled={roomPlayers?.length && roomPlayers?.length < 5 ? true : false}*/ onCheckedChange={(value) => handleSetupFormChange("superpowers", value)} />
          </div>
          <SelectLanguages socket={socket} value={setupFormData?.language} onChange={(value) => handleSetupFormChange("language", value)} />
          <h3 className="text-lg font-bold">Categories</h3>
          <CategoriesOption socket={socket} lang={setupFormData?.language || "en"} selected={setupFormData?.category} onChange={(value) => handleSetupFormChange("category", value)} />
          <div className="flex justify-end gap-2 w-full">
            <Button variant="primary" size="sm" onClick={handleSaveGameSetup} className="w-full max-w-40">Save</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}