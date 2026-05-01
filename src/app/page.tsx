"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import { FETCH_ALL_ROOMS } from "@/services/const";
import { fetchAllRooms } from "@/services/rooms";
import { useToastStore } from "@/store/toast-state";
import Container from "@/components/Container";
import Panel from "@/components/Panel";
import LabelPill from "@/components/LabelPill";
import Button from "@/components/Button";

import ModalCreate from "@/components/Home/ModalCreate";
import ModalSearch from "@/components/Home/ModalSearch";

export default function Home() {
  const router = useRouter();
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { setToast } = useToastStore();
  const { data: session } = useSession();
  const { data: allRooms } = useQuery({
    queryKey: [FETCH_ALL_ROOMS],
    queryFn: fetchAllRooms,
    refetchInterval: 5000,
  });

  const openCreateRoomModal = useCallback(() => {
    if (!session) {
      setToast("Please login to create a room", "warning");
      return;
    }
    setCreateRoomModalOpen(true);
  }, [session, setToast]);

  const openSearchModal = useCallback(() => {
    if (!session) {
      setToast("Please login to join a room", "warning");
      return;
    }
    setSearchModalOpen(true);
  }, [session, setToast]);

  return (
    <Container className="flex flex-col gap-4 py-5">
      <div className="justify-end flex gap-2">
        <Button variant="secondary" onClick={openCreateRoomModal}>Create Room</Button>
        <Button variant="success" onClick={openSearchModal}>Join Room</Button>
      </div>
      {allRooms?.map((room, index) => (
        <Panel key={index} title={`Room ${index + 1}`}>
          <div className="flex justify-between items-center gap-2">
            <p>{`creator: ${room.creatorName}`}</p>
            <p>
              {`max players: ${room.roomPlayers.length} / ${room.roomMaxPlayers}`}
              <LabelPill label={room.gameRule.status} variant={room.gameRule.status === "waiting" ? "warning" : room.gameRule.status === "ready" ? "success" : room.gameRule.status === "playing" ? "danger" : "neutral"} className="ml-2" />
            </p>
            {room.isPublic && room.gameRule.status === "waiting" ? <Button variant="success" onClick={() => router.push(`/join/${room.roomId}`)}>Join Room</Button> : <span className="block w-2.5 h-2.5" />}
          </div>
        </Panel>
      ))}
      {session && (
        <>
          <ModalCreate
            isOpen={createRoomModalOpen}
            onClose={() => setCreateRoomModalOpen(false)}
            playerName={session.user?.name || ""}
            playerEmail={session.user?.email || ""}
          />
          <ModalSearch
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            playerName={session.user?.name || ""}
            playerEmail={session.user?.email || ""}
          />
        </>
      )}
    </Container>
  );
}
