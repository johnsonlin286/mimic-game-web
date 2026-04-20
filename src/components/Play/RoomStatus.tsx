import { useCallback } from "react";
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
  const { roomId, roomMaxPlayers, roomPlayers, gameRule, resetRoom } = useRoomStore();

  const emitLeave = useCallback(() => {
    if (!socket.connected || !socket.id || !roomId) return;
    const payload: RoomLeavePayload = {
      roomId: roomId,
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
  }, [resetRoom, router, socket, roomId]);

  return (
    <Panel collapsible title="Room Information" className="flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-zinc-500">
            <strong className="font-bold">Room ID:</strong> {roomId}
          </p>
          <p className="text-sm text-zinc-500">
            <strong className="font-bold">Players:</strong> {roomPlayers.length} / {roomMaxPlayers}
            <LabelPill variant={gameRule.status === "waiting" ? "warning" : gameRule.status === "ready" ? "success" : gameRule.status === "playing" ? "danger" : "neutral"} className="ml-2" />
          </p>
        </div>
        <Button variant="danger" onClick={emitLeave}>Leave Room</Button>
      </div>
      {isHost && gameRule.status === "waiting" && (
        <CopyInput label="Invite Link" value={`${process.env.NEXT_PUBLIC_BASE_URL}/join/${roomId}`} />
      )}
    </Panel>
  )
}