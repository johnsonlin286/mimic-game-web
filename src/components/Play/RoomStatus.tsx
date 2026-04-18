import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import useSocket from "@/hooks/useSocket";
import { useRoomStore } from "@/store/room-state";
import Panel from "@/components/Panel";
import LabelPill from "@/components/LabelPill";
import Button from "@/components/Button";
import CopyInput from "@/components/CopyInput";

interface PlayRoomStatusProps {
  isHost: boolean;
}

export default function PlayRoomStatus({ isHost }: PlayRoomStatusProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const { roomId, roomMaxPlayers, roomPlayers, gameRule, setRoom, resetRoom } = useRoomStore();

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

  }, [socket, router, setRoom, resetRoom]);

  const emitLeave = useCallback(() => {
    const currentRoomId = useRoomStore.getState().roomId;
    if (!socket.connected || !socket.id || !currentRoomId) return;
    const payload: RoomLeavePayload = {
      roomId: currentRoomId,
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
  }, [router, resetRoom, socket]);

  return (
    <Panel collapsible title="Room Information" className="flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-zinc-500">
            <strong className="font-bold">Room ID:</strong> {roomId}
          </p>
          <p className="text-sm text-zinc-500">
            <strong className="font-bold">Players:</strong> {roomPlayers.length} / {roomMaxPlayers}
            <LabelPill variant={gameRule.status === "waiting" ? "warning" : gameRule.status === "ready" ? "success" : "neutral"} className="ml-2" />
          </p>
        </div>
        <Button variant="danger" onClick={emitLeave}>Leave Room</Button>
      </div>
      {isHost && (
        <CopyInput label="Invite Link" value={`${process.env.NEXT_PUBLIC_BASE_URL}/join/${roomId}`} />
      )}
    </Panel>
  )
}