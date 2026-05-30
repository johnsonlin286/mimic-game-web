"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useRoomStore } from "@/store/room-state";
import useSocket from "./useSocket";

import { completeSound, playSfx } from '@/utils/sounds';

export default function useSocketJoin() {
  const router = useRouter();
  const { socket, isConnected, socketConnect } = useSocket();
  const [joinRoomError, setJoinRoomError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false);
  const { setRoom } = useRoomStore();
  const isSubmittingRef = useRef(false);

  const joinRoom = useCallback((roomId: string, playerEmail: string, playerName: string, playerAvatar: string): void => {
    if (!roomId || !playerEmail || !playerName) return;
    if (isSubmittingRef.current || !socket) return;
    if (!isConnected) {
      socketConnect();
    }

    isSubmittingRef.current = true;
    setJoinRoomError(undefined);
    setIsPending(true);
    const sanitizedPlayerName = playerName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 15);
    const payload: RoomJoinPayload = {
      roomId: roomId,
      playerEmail: playerEmail,
      playerName: sanitizedPlayerName,
      playerAvatar: playerAvatar,
    };

    socket.emit("room:join", payload)
      .once("room-join-failed", (response: RoomJoinResponse) => {
        isSubmittingRef.current = false;
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
      .once("room-join-success", (response: RoomJoinResponse) => {
        isSubmittingRef.current = false;
        setIsPending(false);
        const { data } = response;
        setRoom(data.room);
        playSfx(completeSound, 0.3);
        router.push(`/play/${roomId}`);
      });
  }, [isConnected, socket, socketConnect, router, setRoom]);

  return {
    joinRoom,
    joinRoomError,
    isPending,
  }
}
