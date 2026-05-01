import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"

import { searchRoom } from "@/services/rooms"
import useSocketJoin from "@/hooks/useSocketJoin"
import Modal from "../Modal"
import Input from "../Input"
import Button from "../Button"

interface ModalSearchProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function ModalSearch({ isOpen, onClose, playerName, playerEmail }: ModalSearchProps) {
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
      playerName: playerName,
      playerEmail: playerEmail,
    }))
  }, [playerName, playerEmail]);

  const { mutate: searchRoomMutation, isPending } = useMutation({
    mutationFn: searchRoom,
    onSuccess: () => {
      joinRoom(modalFormData.roomId, modalFormData.playerEmail, modalFormData.playerName);
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
    if (!roomId || roomId.trim() === "") {
      errors.roomId = "Room ID is required";
    }
    if (!playerName || playerName.trim() === "") {
      errors.playerName = "Player Name is required";
    } else if (playerName.length < 3) {
      errors.playerName = "Player Name must be at least 3 characters long";
    }
    setModalFormError(errors);
    if (Object.keys(errors).length > 0) return;
    searchRoomMutation(modalFormData.roomId);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Search and Join Room</h2>
        {joinRoomError && <p className="text-red-500">{joinRoomError}</p>}
        <Input type="text" placeholder="Input Room ID" onChange={(e) => handleFormChange({ key: "roomId", value: e.target.value })} error={modalFormError?.roomId} />
        <Input type="text" placeholder="Input Player Name" value={modalFormData.playerName} onChange={(e) => handleFormChange({ key: "playerName", value: e.target.value })} error={modalFormError?.playerName} />
        <Button variant="success" onClick={handlerRoomValidation} disabled={isPending}>
          Join Room
        </Button>
      </div>
    </Modal>
  )
}