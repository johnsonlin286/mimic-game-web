import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { CircleArrowLeft, CopyIcon } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import { offSound, playSfx } from '@/utils/sounds';
import useSocket from "@/hooks/useSocket";
import RestartBtn from "@/components/Play/RestartBtn";

interface PlayRoomStatusProps {
  isHost: boolean;
}

export default function PlayRoomStatus({ isHost }: PlayRoomStatusProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const { roomId, gameRule, resetRoom } = useRoomStore();
  const { setToast } = useToastStore();

  const handleCopy = useCallback((value: string) => {
    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL}/join/${value}`);
    setToast("Copied to clipboard", "success");
  }, [setToast]);

  const emitLeave = useCallback(() => {
    if (!socket.connected || !socket.id || !roomId) {
      router.push("/");
      return;
    };
    const payload: RoomLeavePayload = {
      roomId: roomId,
      socketId: socket.id,
      leaveRoom: true,
    };
    socket.emit("room:leave", payload)
      .once("room-leave-success", () => {
        playSfx(offSound);
        resetRoom();
        router.push("/");
      })
      .once("room-leave-not-found", (response) => {
        console.error("room-leave-not-found", response);
      });
  }, [resetRoom, router, socket, roomId]);

  return (
    <nav className="flex justify-between items-center gap-2.5 py-2">
      <div className="flex justify-start items-center">
        <button className="cursor-pointer" onClick={emitLeave}>
          <CircleArrowLeft className="w-8 h-8 text-mint hover:text-mint-hover" />
        </button>
      </div>
      <div className="flex-1 flex justify-center items-center gap-2.5">
        <h2 className="flex items-center gap-2 font-fredoka text-2xl md:text-4xl text-white font-bold uppercase">
          Room: {roomId}
        </h2>
        <button onClick={() => handleCopy(roomId)} className="cursor-pointer">
          <CopyIcon className="w-6 h-6 text-mint hover:text-mint-hover" />
        </button>
      </div>
      <div>
        {isHost && gameRule.status === 'playing' && (
          <RestartBtn isHost={isHost} />
        )}
      </div>
    </nav>
  )
}