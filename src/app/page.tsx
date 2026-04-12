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
import SwitchInput from "@/components/SwitchInput";
import Button from "@/components/Button";

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

export default function Home() {
  const router = useRouter();
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [createRoomFormData, setCreateRoomFormData] = useState<CreateRoomFormData>({
    playerName: "",
    roomMaxPlayers: 3,
    isPublic: true,
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
    const { playerName, roomMaxPlayers, isPublic } = createRoomFormData;
    setCreateRoomError(null);
    const payload: RoomCreatePayload = {
      playerName: playerName,
      creatorEmail: session.user.email,
      roomMaxPlayers: roomMaxPlayers,
      isPublic: isPublic,
    }
    socket?.emit("room:create", payload)
      .on("room-created", (response: RoomCreateResponse) => {
        const { data } = response;
        console.log("room-created", data);
        setRoom({
          roomId: data.roomId,
          roomMaxPlayers: data.roomMaxPlayers,
          roomPlayers: data.roomPlayers,
          gameRule: data.gameRule,
          isPublic: data.isPublic,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as RoomState);
        setCreateRoomFormData({
          playerName: "",
          roomMaxPlayers: 3,
          isPublic: true,
        });
        setCreateRoomModalOpen(false);
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
      });
  }, [session, isConnected, createRoomFormData, createRoomError, socket, socketConnect, setRoom, router]);

  const formValidation = useCallback(() => {
    setCreateRoomError(null);
    const errors: CreateRoomError = {};
    const { playerName, roomMaxPlayers } = createRoomFormData;
    if (!playerName || playerName.trim() === "") {
      errors.playerName = "Player name is required";
    } else if (playerName.length < 3) {
      errors.playerName = "Player name must be at least 3 characters long";
    }
    if (!roomMaxPlayers || roomMaxPlayers < 3 || roomMaxPlayers > 10) {
      errors.roomMaxPlayers = "Room max players must be between 3 and 10";
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
          <p>{`max players: ${room.roomPlayers.length} / ${room.roomMaxPlayers}`}</p>
          {room.isPublic && <Button variant="secondary" onClick={() => router.push(`/join/${room.roomId}`)}>Join Room</Button>}
        </div>
      ))}
      <Modal isOpen={createRoomModalOpen} onClose={() => setCreateRoomModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Create Room</h2>
          {createRoomError?.generalError && <p className="text-red-500">{createRoomError.generalError}</p>}
          <Input type="text" label="Player Name" placeholder="Player Name" value={createRoomFormData.playerName} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, playerName: e.target.value.toLowerCase() })} error={createRoomError?.playerName} />
          <Input type="number" label="Max Players" placeholder="Max Players" min={3} max={10} value={createRoomFormData.roomMaxPlayers} onChange={(e) => setCreateRoomFormData({ ...createRoomFormData, roomMaxPlayers: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 3 })} error={createRoomError?.roomMaxPlayers} />
          <SwitchInput label="Public" checked={createRoomFormData.isPublic} onCheckedChange={(checked) => setCreateRoomFormData({ ...createRoomFormData, isPublic: checked })} className="w-fit" />
          <Button onClick={formValidation}>Create Room</Button>
        </div>
      </Modal>
    </Container>
  );
}
