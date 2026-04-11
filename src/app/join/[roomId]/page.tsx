"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Container from "@/components/Container";
import GoogleLoginBtn from "@/components/GoogleLoginBtn";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";

interface JoinRoomFormData {
  playerName: string;
  roomPin: string;
}

interface JoinRoomError {
  playerName?: string;
  roomPin?: string;
  generalError?: string;
}

let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

export default function JoinPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const leftAfterJoinSuccessRef = useRef(false);
  const { roomId } = use(params);
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false);
  const [joinRoomFormData, setJoinRoomFormData] = useState<JoinRoomFormData>({
    playerName: "",
    roomPin: "",
  });
  const [joinRoomError, setJoinRoomError] = useState<JoinRoomError | null>(null);
  const { data: session } = useSession();
  const { socket, isConnected, socketConnect, socketDisconnect } = useSocket();
  const { setRoom, resetRoom } = useRoomStore();

  useEffect(() => {
    leftAfterJoinSuccessRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!session) return;
    setJoinRoomFormData((prev) => ({
      ...prev,
      playerName: session.user?.name || "",
    }));
  }, [session]);

  useEffect(() => {
    if (pendingDisconnectTimer) {
      clearTimeout(pendingDisconnectTimer);
      pendingDisconnectTimer = null;
    }

    return () => {
      pendingDisconnectTimer = setTimeout(() => {
        if (leftAfterJoinSuccessRef.current) return;
        resetRoom();
        socketDisconnect();
      }, 100);
    };
  }, [resetRoom, socketDisconnect]);

  const handleJoinRoom = useCallback(() => {
    if (!roomId || !session?.user?.email) return;
    if (!isConnected) {
      socketConnect();
    }
    const { playerName, roomPin } = joinRoomFormData;
    const payload: RoomJoinPayload = {
      roomId: roomId,
      playerName: playerName,
      playerEmail: session.user.email,
      roomPin: roomPin,
    }
    socket?.emit("room:join", payload)
      .on("room-join-failed", (response: RoomJoinResponse) => {
        const { message } = response;
        switch (message) {
          case "Room not found!":
            setJoinRoomError({ ...joinRoomError, generalError: "Room not found" });
            break;
          case "Room is full!":
            setJoinRoomError({ ...joinRoomError, generalError: "Player not found" });
            break;
          case "Invalid room pin!":
            setJoinRoomError({ ...joinRoomError, roomPin: "Invalid room pin!" });
            break;
          default:
            setJoinRoomError({ ...joinRoomError, generalError: "An error occurred while joining the room" });
            break;
        }
      })
      .on("room-join-success", (response: RoomJoinResponse) => {
        const { roomId, roomDisplayName } = response.data;
        setRoom({ roomId, roomDisplayName } as RoomState);
        setJoinRoomFormData({
          playerName: "",
          roomPin: "",
        });
        setJoinRoomModalOpen(false);
        leftAfterJoinSuccessRef.current = true;
        router.push(`/play/${roomId}`);
      });
  }, [session, isConnected, joinRoomFormData, joinRoomError, roomId, socket, socketConnect, setRoom, router]);
  
  const formValidation = useCallback(() => {
    setJoinRoomError(null);
    const errors: JoinRoomError = {};
    const { playerName, roomPin } = joinRoomFormData;
    if (!playerName || playerName.trim() === "") {
      errors.playerName = "Player name is required";
    } else if (playerName.length < 3) {
      errors.playerName = "Player name must be at least 3 characters long";
    }
    if (!roomPin || roomPin.trim() === "") {
      errors.roomPin = "Room pin is required";
    } else if (roomPin.length !== 4) {
      errors.roomPin = "Invalid room pin!";
    }
    setJoinRoomError(errors);
    if (Object.keys(errors).length > 0) return;
    handleJoinRoom();
  }, [joinRoomFormData, handleJoinRoom]);

  return (
    <Container>
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="flex flex-col items-center gap-2 justify-center bg-white rounded-lg shadow-md p-4">
          {!session ? (
            <>
              <h2 className="text-2xl font-bold">Join Room</h2>
              <p className="text-sm text-gray-500">Please login to join the room</p>
              <GoogleLoginBtn />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Join Room</h2>
              <p className="text-sm text-gray-500">Hello {session.user?.name}</p>
              <p className="text-sm text-gray-500">Room ID: {roomId}</p>
              <Button onClick={() => setJoinRoomModalOpen(true)}>
                Join Room
              </Button>
            </>
          )}
        </div>
      </div>
      <Modal isOpen={joinRoomModalOpen} onClose={() => setJoinRoomModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Join Room</h2>
          {joinRoomError?.generalError && <p className="text-red-500">{joinRoomError.generalError}</p>}
          <Input placeholder="Player Name" value={joinRoomFormData.playerName} onChange={(e) => setJoinRoomFormData({ ...joinRoomFormData, playerName: e.target.value.toLowerCase() })} error={joinRoomError?.playerName} />
          <Input type="password" placeholder="Room Pin" value={joinRoomFormData.roomPin} onChange={(e) => setJoinRoomFormData({ ...joinRoomFormData, roomPin: e.target.value })} error={joinRoomError?.roomPin} />
          <Button onClick={formValidation}>Join Room</Button>
        </div>
      </Modal>
    </Container>
  )
}