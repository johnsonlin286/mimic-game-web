import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"

import useSocket from "@/hooks/useSocket"
import { useRoomStore } from "@/store/room-state"
import { useToastStore } from "@/store/toast-state"
import randomAvatar from "@/utils/randomAvatar"
import Modal from "../Modal"
import Input from "../Input"
import InputNumber from "../InputNumber"
import SwitchInput from "../SwitchInput"
import Button from "../Button"

interface ModalCreateProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  playerEmail: string;
}

interface CreateRoomFormData {
  playerName: string;
  roomMaxPlayers: number;
  isPublic: boolean;
}

interface CreateRoomError {
  playerName?: string;
  roomMaxPlayers?: string;
  generalError?: string;
}

export default function ModalCreate({ isOpen, onClose, playerName, playerEmail }: ModalCreateProps) {
  const router = useRouter();
  const [createRoomFormData, setCreateRoomFormData] = useState<CreateRoomFormData>({
    playerName: "",
    roomMaxPlayers: 3,
    isPublic: false,
  })
  const [createRoomError, setCreateRoomError] = useState<CreateRoomError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected, socketConnect, socketDisconnect } = useSocket();
  const { setRoom } = useRoomStore();
  const { setToast } = useToastStore();

  useEffect(() => {
    setCreateRoomFormData((prev) => ({
      ...prev,
      playerEmail: playerEmail,
    }))
  }, [playerName, playerEmail]);

  const handleCreateRoom = useCallback(() => {
    if (!isConnected) {
      socketConnect();
    }
    setIsLoading(true);
    const { playerName, roomMaxPlayers, isPublic } = createRoomFormData;
    setCreateRoomError(null);
    const sanitizedPlayerName = playerName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
    const creatorAvatar = randomAvatar();
    const payload: RoomCreatePayload = {
      playerName: sanitizedPlayerName,
      creatorEmail: playerEmail,
      creatorAvatar: creatorAvatar,
      roomMaxPlayers: roomMaxPlayers,
      isPublic: isPublic,
    }
    socket?.emit("room:create", payload)
      .on("room-created", (response: RoomCreateResponse) => {
        const { data } = response;
        setToast(`Room ${data.roomId} created`, "success");
        setRoom({
          roomId: data.roomId,
          creatorName: data.creatorName,
          roomMaxPlayers: data.roomMaxPlayers,
          roomPlayers: data.roomPlayers,
          gameRule: data.gameRule,
          isPublic: data.isPublic,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as RoomResponseData);
        // onClose();
        router.push(`/play/${data.roomId}`);
      })
      .on("room-create-failed", (response: RoomCreateResponse) => {
        const { message } = response;
        switch (message) {
          case "Creator email is required!":
            setCreateRoomError({ ...createRoomError, generalError: "Creator email is required!" });
            break;
          case "Creator email already exists!":
            setCreateRoomError({ ...createRoomError, generalError: "Creator email already exists!" });
            break;
          case "Room max players is required!":
            setCreateRoomError({ ...createRoomError, roomMaxPlayers: "Room max players is required!" });
            break;
          case "Room max players must be between 3 and 10!":
            setCreateRoomError({ ...createRoomError, roomMaxPlayers: "Room max players must be between 3 and 10!" });
            break;
          default:
            setCreateRoomError({ ...createRoomError, generalError: "An error occurred while creating the room" });
            break;
        }
        socketDisconnect();
      });
  }, [playerEmail, isConnected, createRoomFormData, createRoomError, socket, socketConnect, socketDisconnect, setRoom, router, setToast]);

  const formValidation = useCallback(() => {
    setCreateRoomError(null);
    const errors: CreateRoomError = {};
    const { playerName, roomMaxPlayers } = createRoomFormData;
    const playerNameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!playerName || playerName.trim() === "") {
      errors.playerName = "Player name is required";
    } else if (playerName.length < 3) {
      errors.playerName = "Player name must be at least 3 characters long";
    } else if (!playerNameRegex.test(playerName)) {
      errors.playerName = "Player name must only contain letters, numbers, and spaces";
    } else if (playerName.length > 15) {
      errors.playerName = "Player name must be less than 15 characters long";
    }
    if (!roomMaxPlayers || roomMaxPlayers < 3 || roomMaxPlayers > 10) {
      errors.roomMaxPlayers = "Room max players must be between 3 and 10";
    }
    if (!playerEmail) {
      errors.generalError = "Player email is required";
    }
    setCreateRoomError(errors);
    if (Object.keys(errors).length > 0) return;
    handleCreateRoom();
  }, [createRoomFormData, playerEmail, handleCreateRoom]);

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()}>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Create Room</h2>
        {createRoomError?.generalError && <p className="text-red-500">{createRoomError.generalError}</p>}
        <Input type="text" label="Agent Code" placeholder="Six Seven Eight" value={createRoomFormData.playerName} autoFocus={true} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, playerName: e.target.value })} error={createRoomError?.playerName} />
        <InputNumber label="Max Players" min={3} max={10} value={createRoomFormData.roomMaxPlayers.toString()} onChange={(value) => setCreateRoomFormData({ ...createRoomFormData, roomMaxPlayers: parseInt(value) > 0 ? parseInt(value) : 3 })} error={createRoomError?.roomMaxPlayers} />
        <SwitchInput id="room-public" labelLeft="Offline" labelRight="Online" checked={createRoomFormData.isPublic} onCheckedChange={(checked) => setCreateRoomFormData({ ...createRoomFormData, isPublic: checked })} className="w-fit" />
        <Button disabled={isLoading} onClick={formValidation}>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Create Room"}
        </Button>
      </div>
    </Modal>
  )
}