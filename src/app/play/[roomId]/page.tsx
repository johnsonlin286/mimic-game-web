"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crown, Wrench } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import useSocket, { getSocket } from "@/hooks/useSocket";
import Panel from "@/components/Panel";
import LabelPill from "@/components/LabelPill";
import Container from "@/components/Container";
import CopyInput from "@/components/CopyInput";
import SwitchInput from "@/components/SwitchInput";
import SelectLanguages from "@/components/SelectLanguages";
import CategoriesOption from "@/components/CategoriesOption";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

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
    socket.on("listen-room-join-success", (response: RoomJoinResponse) => {
      console.log("listen room-join-success", response);
      setRoomData(response.data);
    });

    socket.on("listen-room-leave-success", (response: RoomRejoinResponse) => {
      console.log("listen room-leave-success", response);
      setRoomData(response.data);
    });

    socket.on("listen-room-host-left", (response: RoomRejoinResponse) => {
      console.log("listen room-host-left", response);
      setRoomData(response.data);
    });

    socket.on("listen-room-kicked-player", (response) => {
      console.log("listen room-kicked-player", response);
      resetRoom();
      router.push("/");
    });

    socket.on("listen-room-kick-player", (response: RoomKickPlayerResponse) => {
      console.log("listen room-kick-player", response);
      const { room } = response.data;
      setRoomData(room);
    });
  }, [socket, isConnected, router, isPublic, resetRoom]);

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
    // update room data
    setRoomData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        gameRule: {
          ...prev.gameRule,
          ...setupFormData,
        },
      };
    });
    setGameSetupModal(false);
  }

  return (
    <Container className="py-4">
      <Panel collapsible title="Room Information" className="flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-zinc-500">
              <strong className="font-bold">Room ID:</strong> {roomId}
            </p>
            <p className="text-sm text-zinc-500">
              <strong className="font-bold">Players:</strong> {roomPlayers.length} / {roomMaxPlayers}
              <LabelPill variant={roomData?.gameRule.status === "waiting" ? "warning" : roomData?.gameRule.status === "ready" ? "success" : roomData?.gameRule.status === "playing" ? "success" : "neutral"} className="ml-2" />
            </p>
          </div>
          <Button variant="danger" onClick={emitLeave}>Leave Room</Button>
        </div>
        {isHost && (
          <CopyInput label="Invite Link" value={`${process.env.NEXT_PUBLIC_BASE_URL}/join/${roomId}`} />
        )}
      </Panel>
      <Panel collapsible title="Game Setup" className="flex flex-col">
        {gameSetupData && (
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col">
              <p className={`flex items-center gap-2 ${gameSetupData.roles?.mimic ? "opacity-100" : "opacity-30"}`}>
                <strong>
                  The Mimic:
                </strong>
                <strong>
                  {(() => {
                    const n = roomData?.roomPlayers?.length ?? 0;
                    if (n >= 9) return "3";
                    if (n >= 7) return "2";
                    return "1";
                  })()}
                </strong>
              </p>
              <p className={`flex items-center gap-2 ${gameSetupData.roles?.void ? "opacity-100" : "opacity-20"}`}>
                <strong>
                  The Void:
                </strong>
                <strong>
                  {(() => {
                    const n = roomData?.roomPlayers?.length ?? 0;
                    if (n >= 5) return "1";
                    if (n >= 11) return "2";
                    return "0";
                  })()}
                </strong>
              </p>
              <p className="flex items-center gap-2">
                <strong>
                  Language:
                </strong>
                <strong>
                  {gameSetupData.language === "en" ? "English" : "Indonesian"}
                </strong>
              </p>
              <p className="flex items-center gap-2">
                <strong>
                  Category:
                </strong>
                <strong>
                  {gameSetupData.category}
                </strong>
              </p>
            </div>
            <div>
              {isHost && (
                <Button variant="secondary" size="sm" onClick={() => setGameSetupModal(true)} className="flex items-center justify-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </Panel>
      <Panel collapsible title="Players">
        <ul className="flex flex-col gap-2">
          {roomData?.roomPlayers.map((player, index) => (
            <li key={index} className="flex items-center justify-between gap-2 not-last:border-b border-zinc-200 pb-2">
              <strong className="font-bold flex items-center gap-2">
                {player.playerName}
                {isHost && <Crown />}
              </strong>
              {isHost && player.playerEmail !== session?.user?.email && (
                <Button size="sm" variant="danger" onClick={() => emitKickPlayer(player.socketId, player.playerEmail)}>Kick Player</Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
      <Modal isOpen={gameSetupModal} onClose={() => setGameSetupModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Game Setup</h2>
          <div className="flex flex-col gap-1">
            <SwitchInput label="The Mimic" checked={roomData?.gameRule.roles.mimic || false} disabled onCheckedChange={(value) => handleSetupFormChange("roles", { mimic: value })} />
            <small className="text-zinc-500">The Mimic is who get different word than other players.</small>
            <SwitchInput label="The Void" checked={roomData?.gameRule.roles.void || false} disabled={roomData?.roomPlayers?.length && roomData?.roomPlayers?.length < 5 ? true : false} onCheckedChange={(value) => handleSetupFormChange("roles", { void: value })} />
            <small className="text-zinc-500">The Void is who not get any word.</small>
          </div>
          <SelectLanguages socket={socket} value={setupFormData.language} onChange={(value) => handleSetupFormChange("language", value)} />
          <h3 className="text-lg font-bold">Categories</h3>
          <CategoriesOption socket={socket} lang={setupFormData.language || "en"} selected={setupFormData.category} onChange={(value) => handleSetupFormChange("category", value)} />
          <div className="flex justify-end gap-2 w-full">
            <Button variant="primary" size="sm" onClick={handleSaveGameSetup} className="w-full max-w-40">Save</Button>
          </div>
        </div>
      </Modal>
      <pre>{JSON.stringify(roomData, null, 2)}</pre>
    </Container>
  );
}
