"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import useSocket, { getSocket } from "@/hooks/useSocket";
import PlayGame from "@/components/Play/Game";
import PlayLoby from "@/components/Play/Loby";

let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

export default function PlayPage() {
  const hasRejoinedRef = useRef(false);
  const router = useRouter();
  const [roomData, setRoomData] = useState<RoomInfo | null>(null);
  const [gameSetupModal, setGameSetupModal] = useState(false);
  const [gameSetupData, setGameSetupData] = useState<Partial<GameRule>>({
    roles: {
      mimic: true,
      void: false,
    },
    category: "",
    language: "en",
  });
  const [setupFormData, setSetupFormData] = useState<Partial<GameRule>>({
    roles: {
      mimic: true,
      void: false,
    },
    category: "",
    language: "en",
  });
  const [isHost, setIsHost] = useState(false);
  const { socket, isConnected, socketConnect } = useSocket();
  const { data: session } = useSession();
  const { roomId, roomMaxPlayers, roomPlayers, gameRule, isPublic, createdAt, updatedAt, resetRoom } = useRoomStore();

  useEffect(() => {
    setRoomData({
      roomId,
      roomMaxPlayers,
      roomPlayers,
      gameRule,
      isPublic,
      createdAt,
      updatedAt,
    });
    setGameSetupData({
      ...gameRule,
    });
    setSetupFormData({
      ...gameRule,
    });
  }, [roomId, roomMaxPlayers, roomPlayers, gameRule, isPublic, createdAt, updatedAt]);

  useEffect(() => {
    if (!session) return;
    const host = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";
    setIsHost(host || false);
  }, [roomPlayers, session]);

  const emitLeave = useCallback(() => {
    const sock = getSocket();
    const currentRoomId = useRoomStore.getState().roomId;
    if (!sock.connected || !sock.id || !currentRoomId) return;
    const payload: RoomLeavePayload = {
      roomId: currentRoomId,
      socketId: sock.id,
    };
    sock.emit("room:leave", payload)
      .once("room-leave-success", (response: RoomLeaveResponse) => {
        console.log("room-leave-success", response);
        resetRoom();
        router.push("/");
      })
      .once("room-leave-not-found", (response) => {
        console.error("room-leave-not-found", response);
      });
  }, [router, resetRoom]);

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
          roomMaxPlayers: room.roomMaxPlayers,
          roomPlayers: room.roomPlayers,
          gameRule: room.gameRule,
          isPublic: room.isPublic,
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
    const onJoinSuccess = (response: RoomJoinResponse) => {
      console.log("listen room-join-success", response);
      setRoomData(response.data);
    };

    const onLeaveSuccess = (response: RoomRejoinResponse) => {
      console.log("listen room-leave-success", response);
      setRoomData(response.data);
    };

    const onHostLeft = (response: RoomRejoinResponse) => {
      console.log("listen room-host-left", response);
      setRoomData(response.data);
    };

    const onKicked = (response: unknown) => {
      console.log("listen room-kicked-player", response);
      resetRoom();
      router.push("/");
    };

    const onKickPlayer = (response: RoomKickPlayerResponse) => {
      console.log("listen room-kick-player", response);
      const { room } = response.data;
      setRoomData(room);
    };

    socket.on("listen-room-join-success", onJoinSuccess);
    socket.on("listen-room-leave-success", onLeaveSuccess);
    socket.on("listen-room-host-left", onHostLeft);
    socket.on("listen-room-kicked-player", onKicked);
    socket.on("listen-room-kick-player", onKickPlayer);

    return () => {
      socket.off("listen-room-join-success", onJoinSuccess);
      socket.off("listen-room-leave-success", onLeaveSuccess);
      socket.off("listen-room-host-left", onHostLeft);
      socket.off("listen-room-kicked-player", onKicked);
      socket.off("listen-room-kick-player", onKickPlayer);
    };
  }, [socket, isConnected, router, resetRoom]);

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
      setRoomData(response.data);
    };

    socket.emit("room:rejoin", {
      roomId,
      socketId: socket.id,
      playerEmail: session.user?.email,
    })
      .on("room-rejoin-success", onSuccess)
      .on("room-rejoin-not-found", onNotFound);
  }, [roomId, router, session, socket, isConnected, isPublic, socketConnect, resetRoom]);

  const handleSetupFormChange = (key: keyof Partial<GameRule>, value: unknown) => {
    switch (key) {
      case "roles":
        setSetupFormData((prev) => ({
          ...prev,
          roles: {
            mimic: (value as { mimic: boolean }).mimic,
            void: (value as { void: boolean }).void,
          },
        }));
        break;
      case "language":
        setSetupFormData((prev) => ({
          ...prev,
          language: value as string,
        }));
        break;
      case "category":
        setSetupFormData((prev) => ({
          ...prev,
          category: value as string,
        }));
        break;
      default:
    }
  };

  const handleSaveGameSetup = () => {
    setGameSetupData({
      ...setupFormData,
    });
    socket.emit("game:update-rule", {
      roomId,
      gameRule: setupFormData,
    }).on("game-rule-update-success", (response: GameRuleUpdateResponse) => {
      const { data } = response;
      setRoomData(data);
    }).on('game-rule-update-failed', (response: GameRuleUpdateResponse) => {
      const { message } = response;
      switch (message) {
        case "Room not found":
          resetRoom();
          router.push("/");
          break;
        default:
          break;
      }
    });
    setGameSetupModal(false);
  }

  if (roomData?.gameRule.status === "playing") {
    return <PlayGame />;
  }

  return (
    <PlayLoby
      roomId={roomId}
      roomMaxPlayers={roomMaxPlayers}
      roomPlayers={roomPlayers}
      roomData={roomData}
      isHost={isHost}
      sessionEmail={session?.user?.email}
      gameSetupData={gameSetupData}
      setupFormData={setupFormData}
      socket={socket}
      gameSetupModalOpen={gameSetupModal}
      setGameSetupModalOpen={setGameSetupModal}
      onLeave={emitLeave}
      onKickPlayer={emitKickPlayer}
      onSetupChange={handleSetupFormChange}
      onSaveSetup={handleSaveGameSetup}
    />
  );
}
