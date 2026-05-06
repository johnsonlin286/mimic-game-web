import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";

interface RestartBtnProps {
  isHost: boolean;
}

export default function RestartBtn({ isHost }: RestartBtnProps) {
  const { data: session} = useSession();
  const { socket } = useSocket();
  const { roomId } = useRoomStore();
  const { setToast } = useToastStore();

  const restartGame = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    console.log("restartGame", session.user.email, roomId);
    socket.emit("game:restart", {
      playerEmail: session.user.email,
      roomId,
    }).on("game-restart-failed", (response) => {
      console.log("game-restart-failed", response);
      setToast(response.message, "error");
    });
  }, [socket, roomId, session, setToast])

  if (!isHost) return null;

  return (
    <Button variant="secondary" size="md" onClick={restartGame} className="w-full">Restart</Button>
  )
}