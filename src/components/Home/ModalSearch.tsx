import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"

import { searchRoom } from "@/services/rooms"
import useSocketJoin from "@/hooks/useSocketJoin"
import randomAvatar from "@/utils/randomAvatar"
import Modal from "../Modal"
import Input from "../Input"
import Button from "../Button"

interface ModalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  playerName: string;
  playerEmail: string;
}

interface ModalFormData {
  roomId: string;
  playerName: string;
  playerEmail: string;
}

interface ModalFormError {
  roomId?: string;
  playerName?: string;
  playerEmail?: string;
}

interface FormChangeEvent {
  key: keyof ModalFormData;
  value: string;
}

export default function ModalSearch({ isOpen, onClose, roomId, playerName, playerEmail }: ModalSearchProps) {
  const [modalFormData, setModalFormData] = useState<ModalFormData>({
    roomId: "",
    playerName: "",
    playerEmail: "",
  })
  const [modalFormError, setModalFormError] = useState<ModalFormError | null>(null);
  const { joinRoom, joinRoomError } = useSocketJoin()

  useEffect(() => {
    setModalFormData((prev) => ({
      ...prev,
      roomId: roomId || "",
      playerEmail: playerEmail,
    }))
  }, [roomId, playerName, playerEmail]);

  const { mutate: searchRoomMutation, isPending } = useMutation({
    mutationFn: searchRoom,
    onSuccess: () => {
      const playerAvatar = randomAvatar();
      joinRoom(modalFormData.roomId, modalFormData.playerEmail, modalFormData.playerName, playerAvatar);
    },
    onError: (error) => {
      const errorData = JSON.parse(error.message) as ErrorResponse;
      console.log(errorData)
      setModalFormError({
        roomId: errorData.message,
      })
    }
  })

  const handleFormChange = ({ key, value }: FormChangeEvent) => {
    setModalFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handlerRoomValidation = () => {
    const errors: ModalFormError = {};
    const { roomId, playerName } = modalFormData;
    const roomIdRegex = /^[a-zA-Z0-9]+$/;
    const playerNameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!roomId || roomId.trim() === "") {
      errors.roomId = "Room ID is required";
    } else if (!roomIdRegex.test(roomId)) {
      errors.roomId = "Room ID must only contain letters and numbers";
    }
    if (!playerName || playerName.trim() === "") {
      errors.playerName = "Player Name is required";
    } else if (playerName.length < 3) {
      errors.playerName = "Player Name must be at least 3 characters long";
    } else if (playerName.length > 15) {
      errors.playerName = "Player Name must be less than 15 characters long";
    } else if (!playerNameRegex.test(playerName)) {
      errors.playerName = "Player Name must only contain letters, numbers, and spaces";
    }
    setModalFormError(errors);
    if (Object.keys(errors).length > 0) return;
    const sanitizedRoomId = modalFormData.roomId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4);
    searchRoomMutation(sanitizedRoomId);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Search and Join Room</h2>
        {joinRoomError && <p className="text-red-500">{joinRoomError}</p>}
        <Input type="text" label="Room ID" placeholder="Input Room ID" value={modalFormData.roomId} onChange={(e) => handleFormChange({ key: "roomId", value: e.target.value })} error={modalFormError?.roomId} inputClassName="uppercase text-center"/>
        <Input type="text" label="Agent Code" placeholder="Six Seven Eight" value={modalFormData.playerName} autoFocus={true} onChange={(e) => handleFormChange({ key: "playerName", value: e.target.value })} error={modalFormError?.playerName} inputClassName="text-center" />
        <Button variant="success" onClick={handlerRoomValidation} disabled={isPending}>
          Join Room
        </Button>
      </div>
    </Modal>
  )
}