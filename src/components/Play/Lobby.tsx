import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import PlayRoomStatus from "@/components/Play/RoomStatus";
import PlayGameSetup from "@/components/Play/GameSetup";
import RoomPlayers from "@/components/Play/RoomPlayers";

export default function PlayLobby() {
  const { data: session } = useSession();
  const { roomPlayers } = useRoomStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";

  return (
    <>
      <PlayRoomStatus isHost={isHost} />
      <PlayGameSetup isHost={isHost} />
      <RoomPlayers isHost={isHost} />
    </>
  )
}