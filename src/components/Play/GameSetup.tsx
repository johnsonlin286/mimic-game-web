import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Panel from "@/components/Panel";
import Modal from "@/components/Modal";
import SwitchInput from "@/components/SwitchInput";
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
      mimic: true,
      void: false,
    },
    category: "",
    language: "en",
  });
  const { socket } = useSocket();
  const { roomId, roomPlayers, gameRule, setRoom, resetRoom } = useRoomStore();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on("listen-game-rule-update-success", (response: GameRuleUpdateResponse) => {
      console.log("listen game-rule-update-success", response);
      setRoom(response.data as RoomResponseData);
    });
  }, [socket, setRoom]);

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
            mimic: (value as { mimic: boolean }).mimic,
            void: (value as { void: boolean }).void,
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
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col">
            <p className={`flex items-center gap-2 ${gameRule.roles?.mimic ? "opacity-100" : "opacity-30"}`}>
              <strong>
                The Mimic:
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
            <p className={`flex items-center gap-2 ${gameRule.roles?.void ? "opacity-100" : "opacity-20"}`}>
              <strong>
                The Void:
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
        </div>
      </Panel>
      <Modal isOpen={gameSetupModal} onClose={() => setGameSetupModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Game Setup</h2>
          <div className="flex flex-col gap-1">
            <SwitchInput label="The Mimic" checked={gameRule.roles.mimic || false} disabled onCheckedChange={(value) => handleSetupFormChange("roles", { mimic: value })} />
            <small className="text-zinc-500">The Mimic is who get different word than other players.</small>
            <SwitchInput label="The Void" checked={gameRule.roles.void || false} disabled={roomPlayers?.length && roomPlayers?.length < 5 ? true : false} onCheckedChange={(value) => handleSetupFormChange("roles", { void: value })} />
            <small className="text-zinc-500">The Void is who not get any word.</small>
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