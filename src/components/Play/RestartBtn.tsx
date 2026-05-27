import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { RefreshCcwIcon } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket from "@/hooks/useSocket";

interface RestartBtnProps {
  isHost: boolean;
  size?: "sm" | "md" | "lg";
}

export default function RestartBtn({ isHost, size = "md" }: RestartBtnProps) {
  const { data: session} = useSession();
  const { socket } = useSocket();
  const { roomId } = useRoomStore();
  const { setToast } = useToastStore();

  const baseClasses = "button ring-4 ring-black rounded-xl font-fredoka font-bold uppercase bg-warning text-white shadow-[inset_0px_-6px_0px_0px_#E09C00] hover:bg-warning-hover hover:inset-shadow-sm hover:inset-shadow-black/50 cursor-pointer disabled:bg-slate-500/50 disabled:shadow-[inset_0px_-6px_0px_0px_#64748B/50] disabled:text-slate-300/50 disabled:hover:inset-shadow-none disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "text-xl px-2 pt-1 pb-2",
    md: "text-2xl px-4 pt-2 pb-3",
    lg: "text-3xl px-6 pt-3 pb-4",
  }[size];

  const restartGame = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:restart", {
      playerEmail: session.user.email,
      roomId,
    }).once("game-restart-failed", (response) => {
      setToast(response.message, "error");
    });
  }, [socket, roomId, session, setToast])

  if (!isHost) return null;

  return (
    <button onClick={restartGame} className={`${baseClasses} ${sizeClasses}`}>
      <RefreshCcwIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
    </button>
  )
}