"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { useRoomStore } from "@/store/room-state";
import useSocket from "./useSocket";

export default function useSocketJoin() {
  const router = useRouter();
  const { socket, isConnected, socketConnect } = useSocket();
  const [joinRoomError, setJoinRoomError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false);
  const { setRoom } = useRoomStore();

  const joinRoom = useCallback((roomId: string, playerEmail: string, playerName: string, playerAvatar: string): void => {
    if (!roomId || !playerEmail || !playerName) return;
    if (!isConnected) {
      socketConnect();
    }
    setIsPending(true);
    const sanitizedPlayerName = playerName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
    const payload: RoomJoinPayload = {
      roomId: roomId,
      playerEmail: playerEmail,
      playerName: sanitizedPlayerName,
      playerAvatar: playerAvatar,
    }
    socket?.emit("room:join", payload)
      .on("room-join-failed", (response: RoomJoinResponse) => {
        setIsPending(false);
        const { message } = response;
        switch (message) {
          case "Room not found!":
            setJoinRoomError("Room not found");
            break;
          case "Room is full!":
            setJoinRoomError("Room is full!");
            break;
          case "Player already in another room!":
            setJoinRoomError("Player already in another room!");
            break;
          default:
            setJoinRoomError("An error occurred while joining the room");
            break;
        }
      })
      .on("room-join-success", (response: RoomJoinResponse) => {
        const { data } = response;
        setRoom(data.room);
        router.push(`/play/${roomId}`);
      });
  }, [isConnected, socket, socketConnect, router, setRoom]);

  return {
    joinRoom,
    joinRoomError,
    isPending,
  }
}