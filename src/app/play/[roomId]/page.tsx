"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crown } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Panel from "@/components/Panel";
import LabelPill from "@/components/LabelPill";
import Container from "@/components/Container";
import CopyInput from "@/components/CopyInput";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Button from "@/components/Button";

let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

export default function PlayPage() {
  const hasRejoinedRef = useRef(false);
  const router = useRouter();
  const [roomData, setRoomData] = useState<RoomInfo | null>(null);
  const [gameSetupModal, setGameSetupModal] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { socket, isConnected, socketConnect, socketDisconnect } = useSocket();
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
  }, [roomId, roomMaxPlayers, roomPlayers, gameRule, isPublic, createdAt, updatedAt]);

  useEffect(() => {
    if (!session) return;
    const host = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";
    setIsHost(host || false);
  }, [roomPlayers, session]);

  const emitLeave = useCallback(() => {
    if (!socket || !isConnected || !socket.id) return;
    if (!roomId) return;
    const payload: RoomLeavePayload = {
      roomId,
      socketId: socket.id,
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
  }, [socket, isConnected, roomId, router, resetRoom]);

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
    })

    socket.on("listen-room-kicked-player", (response) => {
      console.log("listen room-kicked-player", response);
      resetRoom();
      router.push("/");
    })

    socket.on("listen-room-kick-player", (response: RoomKickPlayerResponse) => {
      console.log("listen room-kick-player", response);
      const { room } = response.data;
      setRoomData(room);
    })
  }, [socket, isConnected, router, isPublic, resetRoom]);

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
        <></>
      </Modal>
      <pre>{JSON.stringify(roomData, null, 2)}</pre>
    </Container>
  );
}