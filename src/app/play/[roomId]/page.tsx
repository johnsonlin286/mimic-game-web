"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import useSocket, { getSocket } from "@/hooks/useSocket";
import Container from "@/components/Container";
import RoomStatus from "@/components/Play/RoomStatus";
import PlayLobby from "@/components/Play/Lobby";
import PlayGame from "@/components/Play/Game";

let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

export default function PlayPage() {
  const hasRejoinedRef = useRef(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { socket, isConnected, socketConnect } = useSocket();
  const { roomId, roomPlayers, gameRule, setRoom, resetRoom } = useRoomStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";

  useEffect(() => {
    if (!socket) return;

    socket.on("listen-room-join-success", (response: RoomJoinResponse) => {
      console.log("listen room-join-success", response);
      setRoom(response.data);
    });

    socket.on("listen-room-leave-success", (response: RoomRejoinResponse) => {
      console.log("listen room-leave-success", response);
      setRoom(response.data);
    });

    socket.on("listen-room-host-left", (response: RoomRejoinResponse) => {
      console.log("listen room-host-left", response);
      setRoom(response.data);
    });

    socket.on("listen-room-kicked-player", (response) => {
      console.log("listen room-kicked-player", response);
      resetRoom();
      router.push("/");
    })

    socket.on("listen-room-kick-player", (response: RoomKickPlayerResponse) => {
      console.log("listen room-kick-player", response);
      const { room } = response.data;
      setRoom(room);
    });

    socket.on("listen-game-start-success", (response: GameStartResponse) => {
      console.log("listen game-start-success", response);
      setRoom(response.data);
    });

    socket.on("listen-game-initialize-success", (response) => {
      console.log("listen game-initialize-success", response);
      setRoom(response.data);
    })

  }, [socket, router, setRoom, resetRoom]);

  useEffect(() => {
    hasRejoinedRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (pendingDisconnectTimer) {
      clearTimeout(pendingDisconnectTimer);
      pendingDisconnectTimer = null;
    }

    return () => {
      pendingDisconnectTimer = setTimeout(() => {
        const sock = getSocket();
        const currentRoomId = useRoomStore.getState().roomId;
        if (sock.connected && sock.id && currentRoomId) {
          sock.emit("room:leave", { roomId: currentRoomId, socketId: sock.id });
        }
        resetRoom();
        sock.disconnect();
      }, 100);
    };
  }, [resetRoom]);

  useEffect(() => {
    if (!session || !roomId || !socket) return;

    if (hasRejoinedRef.current) return;

    if (!isConnected) {
      socketConnect();
      return;
    }

    hasRejoinedRef.current = true;

    const onNotFound = (response: RoomRejoinResponse) => {
      const { message } = response;
      switch (message) {
        case "Room not found":
          resetRoom();
          router.push("/");
          break;
        case "Player not found":
          resetRoom();
          router.push(`/join/${roomId}`);
          break;
        default:
          break;
      }
    };

    const onSuccess = (response: RoomRejoinResponse) => {
      console.log("room-rejoin-success", response);
      useRoomStore.getState().setRoom(response.data);
    };

    socket.emit("room:rejoin", {
      roomId,
      socketId: socket.id,
      playerEmail: session.user?.email,
    })
      .on("room-rejoin-success", onSuccess)
      .on("room-rejoin-not-found", onNotFound);
  }, [roomId, router, session, socket, isConnected, socketConnect, resetRoom]);

  

  return (
    <Container className="py-4">
      <RoomStatus isHost={isHost} />
      {gameRule.status === "playing" ? (
        <PlayGame isHost={isHost} />
      ) : gameRule.status === 'finished' ? (
        <></>
      ) : (
        <PlayLobby/>
      )}
    </Container>
  );
}
