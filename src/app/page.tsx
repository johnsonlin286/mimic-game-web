"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import { FETCH_ALL_ROOMS } from "@/services/const";
import { fetchAllRooms } from "@/services/rooms";
import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Container from "@/components/Container";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";

interface CreateRoomFormData {
  playerName: string;
  roomName: string;
  roomMaxPlayers: number;
  roomPin: string;
}

interface CreateRoomError {
  playerName?: string;
  roomName?: string;
  roomMaxPlayers?: string;
  roomPin?: string;
  generalError?: string;
}

export default function Home() {
  const router = useRouter();
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [createRoomFormData, setCreateRoomFormData] = useState<CreateRoomFormData>({
    playerName: "",
    roomName: "",
    roomMaxPlayers: 3,
    roomPin: "",
  });
  const [createRoomError, setCreateRoomError] = useState<CreateRoomError | null>(null);
  const { data: session } = useSession();
  const { socket, isConnected, socketConnect } = useSocket();
  const { setRoom } = useRoomStore();

  const { data: allRooms } = useQuery({
    queryKey: [FETCH_ALL_ROOMS],
    queryFn: fetchAllRooms,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!session) return;
    setCreateRoomFormData((prev) => ({
      ...prev,
      playerName: session.user?.name || "",
    }));
  }, [session]);

  const openCreateRoomModal = useCallback(() => {
    if (!session) return;
    setCreateRoomModalOpen(true);
  }, [session]);

  const handleCreateRoom = useCallback(() => {
    if (!session?.user?.email) return;
    if (!isConnected) {
      socketConnect();
    }
    const { playerName, roomName, roomMaxPlayers, roomPin } = createRoomFormData;
    setCreateRoomError(null);
    const payload: RoomCreatePayload = {
      playerName: playerName,
      creatorEmail: session.user.email,
      roomName: roomName,
      roomMaxPlayers: roomMaxPlayers,
      roomPin: roomPin,
    }
    socket?.emit("room:create", payload)
      .on("room-created", (response: RoomCreateResponse) => {
        const { roomId, roomDisplayName } = response.data;
        setRoom({ roomId, roomDisplayName } as RoomState);
        setCreateRoomFormData({
          playerName: "",
          roomName: "",
          roomMaxPlayers: 3,
          roomPin: "",
        });
        setCreateRoomModalOpen(false);
        router.push(`/play/${roomId}`);
      })
      .on("room-create-failed", (response: RoomCreateResponse) => {
        const { message } = response;
        switch (message) {
          case "Creator email is required!":
            setCreateRoomError({ ...createRoomError, generalError: "Creator email is required!" });
            break;
          case "Room name is required!":
            setCreateRoomError({ ...createRoomError, roomName: "Room name is required!" });
          case "Room name must be between 3 and 20 characters!":
            setCreateRoomError({ ...createRoomError, roomName: "Room name must be between 3 and 20 characters!" });
            break;
          case "Room max players is required!":
            setCreateRoomError({ ...createRoomError, roomMaxPlayers: "Room max players is required!" });
            break;
          case "Room max players must be between 3 and 10!":
            setCreateRoomError({ ...createRoomError, roomMaxPlayers: "Room max players must be between 3 and 10!" });
            break;
          case "Room pin is required!":
            setCreateRoomError({ ...createRoomError, roomPin: "Room pin is required!" });
            break;
          case "Room pin must be 4 characters!":
            setCreateRoomError({ ...createRoomError, roomPin: "Room pin must be 4 characters!" });
            break;
          default:
            setCreateRoomError({ ...createRoomError, generalError: "An error occurred while creating the room" });
            break;
        }
      });
  }, [session, isConnected, createRoomFormData, createRoomError, socket, socketConnect, setRoom, router]);

  const formValidation = useCallback(() => {
    setCreateRoomError(null);
    const errors: CreateRoomError = {};
    const roomNameRegex = /^[a-zA-Z0-9_]+$/;
    const roomPinRegex = /^[0-9]{4}$/;
    const { playerName, roomName, roomMaxPlayers, roomPin } = createRoomFormData;
    if (!playerName || playerName.trim() === "") {
      errors.playerName = "Player name is required";
    } else if (playerName.length < 3) {
      errors.playerName = "Player name must be at least 3 characters long";
    }
    if (!roomName || roomName.trim() === "") {
      errors.roomName = "Room name is required";
    } else if (roomName.length < 3) {
      errors.roomName = "Room name must be at least 3 characters long";
    } else if (roomName.length > 20) {
      errors.roomName = "Room name must be less than 20 characters long";
    } else if (!roomNameRegex.test(roomName)) {
      errors.roomName = "Room name must be alphanumeric without spaces, special characters, and allow underscore";
    }
    if (!roomMaxPlayers || roomMaxPlayers < 3 || roomMaxPlayers > 10) {
      errors.roomMaxPlayers = "Room max players must be between 3 and 10";
    }
    if (!roomPin || roomPin.trim() === "") {
      errors.roomPin = "Room pin is required";
    } else if (!roomPinRegex.test(roomPin)) {
      errors.roomPin = "Room pin must be 4 characters long and numbers only";
    }
    setCreateRoomError(errors);
    if (Object.keys(errors).length > 0) return;
    handleCreateRoom();
  }, [createRoomFormData, handleCreateRoom]);

  return (
    <Container>
      HOME PAGE
      <Button onClick={openCreateRoomModal}>Create Room</Button>
      <pre>{JSON.stringify(allRooms, null, 2)}</pre>
      {allRooms?.map((room, index) => (
        <div key={index} className="flex items-center justify-between gap-2">
          <p>{`creator: ${room.creatorEmail}`}</p>
          <p>{`name: ${room.roomDisplayName}`}</p>
          <p>{`max players: ${room.roomPlayers.length} / ${room.roomMaxPlayers}`}</p>
          <Button variant="secondary" onClick={() => router.push(`/join/${room.roomId}`)}>Join Room</Button>
        </div>
      ))}
      <Modal isOpen={createRoomModalOpen} onClose={() => setCreateRoomModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Create Room</h2>
          {createRoomError?.generalError && <p className="text-red-500">{createRoomError.generalError}</p>}
          <Input type="text" placeholder="Player Name" value={createRoomFormData.playerName} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, playerName: e.target.value.toLowerCase() })} error={createRoomError?.playerName} />
          <Input placeholder="Room Name" value={createRoomFormData.roomName} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, roomName: e.target.value.toLowerCase() })} error={createRoomError?.roomName} />
          <Input type="number" placeholder="Room Max Players" min={3} max={10} value={createRoomFormData.roomMaxPlayers} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, roomMaxPlayers: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 3 })} error={createRoomError?.roomMaxPlayers} />
          <Input type="password" placeholder="Room Pin" value={createRoomFormData.roomPin} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, roomPin: e.target.value })} error={createRoomError?.roomPin} />
          <Button onClick={formValidation}>Create Room</Button>
        </div>
      </Modal>
    </Container>
  );
}
