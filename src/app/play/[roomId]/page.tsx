"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRoomStore } from "@/store/room-state";
import { useSession } from "next-auth/react";

import useSocket from "@/hooks/useSocket";
import Container from "@/components/Container";

let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

export default function PlayPage() {
  const hasRejoinedRef = useRef(false);
  const router = useRouter();
  const [roomData, setRoomData] = useState<RoomInfo | null>(null);
  const { socket, isConnected, socketConnect, socketDisconnect } = useSocket();
  const { data: session } = useSession();
  const { roomId, roomDisplayName, resetRoom } = useRoomStore();

  const emitLeave = useCallback(() => {
    console.log("emitLeave");
    if (!socket || !isConnected) return;
    if (!session?.user?.email || !roomId) return;

    const payload: RoomLeavePayload = {
      roomId,
      playerEmail: session.user.email,
    };

    socket.emit("room:leave", payload)
     .once("room-leave-success", (response: RoomLeaveResponse) => {
      console.log("room-leave-success", response);
      resetRoom();
      router.push("/");
     })
     .once("room-leave-not-found", (response) => {
      console.error("room-leave-not-found", response);
     });
  }, [socket, isConnected, session, roomId, router, resetRoom]);

  const emitKickPlayer = useCallback((targetSocketId: string, targetPlayerEmail: string) => {
    if (!socket || !socket.id || !isConnected) return;
    if (!session?.user?.email || !roomId) return;

    const payload: RoomKickPlayerPayload = {
      roomId,
      socketId: targetSocketId,
      playerEmail: targetPlayerEmail,
    };

    socket.emit("room:kick", payload)
      .once("room-kick-success", (response: RoomKickPlayerResponse) => {
        console.log("room-kick-success", response);
        const { room } = response.data;
        setRoomData({
          roomId: room.roomId,
          roomDisplayName: room.roomDisplayName,
          roomMaxPlayers: room.roomMaxPlayers,
          roomPlayers: room.roomPlayers,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        });
      })
      .once("room-kick-not-found", (response) => {
        console.error("room-kick-not-found", response);
      });
  }, [socket, isConnected, session, roomId]);

  useEffect(() => {
    hasRejoinedRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.on("listen-room-leave-success", (response: RoomRejoinResponse) => {
      console.log("listen room-leave-success", response);
      const { room } = response.data;
      setRoomData({
        roomId: room.roomId,
        roomDisplayName: room.roomDisplayName,
        roomMaxPlayers: room.roomMaxPlayers,
        roomPlayers: room.roomPlayers,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      });
    });

    socket.on("listen-room-host-left", (response: RoomRejoinResponse) => {
      console.log("listen room-host-left", response);
      const { room } = response.data;
      setRoomData({
        roomId: room.roomId,
        roomDisplayName: room.roomDisplayName,
        roomMaxPlayers: room.roomMaxPlayers,
        roomPlayers: room.roomPlayers,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      });
    })
    
    socket.on("listen-room-kicked-player", (response) => {
      console.log("listen room-kicked-player", response);
      resetRoom();
      router.push("/");
    })

    socket.on("listen-room-kick-player", (response: RoomKickPlayerResponse) => {
      console.log("listen room-kick-player", response);
      const { room } = response.data;
      setRoomData({
        roomId: room.roomId,
        roomDisplayName: room.roomDisplayName,
        roomMaxPlayers: room.roomMaxPlayers,
        roomPlayers: room.roomPlayers,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      });
    })
  }, [socket, isConnected, router, resetRoom]);

  useEffect(() => {
    if (pendingDisconnectTimer) {
      clearTimeout(pendingDisconnectTimer);
      pendingDisconnectTimer = null;
    }

    return () => {
      // Delay slightly so Strict Mode dev remount can cancel this.
      pendingDisconnectTimer = setTimeout(() => {
        resetRoom()
        emitLeave();
        socketDisconnect();
      }, 100);
    };
  }, [resetRoom, emitLeave, socketDisconnect]);

  useEffect(() => {
    if (!session || !roomId || !socket) return;

    // Ensure we only attempt a rejoin once per mount/roomId.
    if (hasRejoinedRef.current) return;

    // If we’re not connected yet, connect first and let this effect re-run.
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
      const { room } = response.data;
      setRoomData({
        roomId: room.roomId,
        roomDisplayName: room.roomDisplayName,
        roomMaxPlayers: room.roomMaxPlayers,
        roomPlayers: room.roomPlayers,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      });
    };

    socket.emit("room:rejoin", {
      roomId,
      socketId: socket.id,
      playerEmail: session.user?.email,
    })
      .on("room-rejoin-success", onSuccess)
      .on("room-rejoin-not-found", onNotFound);
    
  }, [roomId, router, session, socket, isConnected, socketConnect]);

  return (
    <Container>
      PLAY PAGE
      <p>Room ID: {roomId}</p>
      <p>Room Display Name: {roomDisplayName}</p>
      <p>invite link: {`${process.env.NEXT_PUBLIC_BASE_URL}/join/${roomId}`}</p>
      <button onClick={emitLeave} className="text-underline cursor-pointer">Leave Room</button>
      <pre>{JSON.stringify(roomData, null, 2)}</pre>
      {roomData?.roomPlayers.map((player, index) => (
        <div key={index} className="flex items-center justify-between gap-2">
          <p>{player.playerEmail}</p>
          {player.role !== "host" && player.playerEmail !== session?.user?.email && (
            <button onClick={() => emitKickPlayer(player.socketId, player.playerEmail)} className="text-underline cursor-pointer">Kick Player</button>
          )}
        </div>
      ))}
    </Container>
  );
}