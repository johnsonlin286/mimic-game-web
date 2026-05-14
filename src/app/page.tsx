"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { FETCH_ALL_ROOMS } from "@/services/const";
import { fetchAllRooms } from "@/services/rooms";
import { useToastStore } from "@/store/toast-state";
import Container from "@/components/Container";
import GoogleLoginBtn from "@/components/GoogleLoginBtn";
import Panel from "@/components/Panel";
import LabelPill from "@/components/LabelPill";
import Button from "@/components/Button";

import ModalCreate from "@/components/Home/ModalCreate";
import ModalSearch from "@/components/Home/ModalSearch";

export default function Home() {
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchRoomId, setSearchRoomId] = useState<string>("");
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

  const handleJoinRoom = useCallback((roomId: string) => {
    setSearchRoomId(roomId);
    setSearchModalOpen(true);
  }, []);

  return (
    <Container className="flex flex-col gap-4 py-5">
      <div className="flex justify-end w-full">
        <GoogleLoginBtn />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
        <Image src="/images/shift-logo.webp" alt="Shift" width={0} height={0} sizes="100vw" priority className="w-full max-w-xs" />
        <Panel className="w-full max-w-md">
          {!session && (
            <div className="flex justify-center w-full">
              <GoogleLoginBtn className="w-full"/>
            </div>
          )}
          <div className="flex flex-col gap-5">
            {session && (
              <>
                <Button variant="primary" onClick={openCreateRoomModal} className="w-full">
                  Create Room
                </Button>
                <Button variant="success" onClick={openSearchModal} className="w-full">
                  Join Room
                </Button>
              </>
            )}
          </div>
        </Panel>
        {allRooms?.map((room, index) => (
          <Panel key={index} title={`Room ${index + 1}`} className="w-full max-w-md">
            <div className="flex justify-between items-center gap-2">
              <div className="flex flex-col gap-2">
                <small>creator:</small>
                <p className="font-fredoka font-bold text-white text-xl">{room.creatorName}</p>
              </div>
              <div className="flex flex-col gap-2">
                <small>max:</small>
                <p className="font-nunito font-bold text-lg">
                  {`${room.roomPlayers.length} / ${room.roomMaxPlayers}`}
                  <LabelPill label={room.gameRule.status} variant={room.gameRule.status === "waiting" ? "warning" : room.gameRule.status === "ready" ? "success" : room.gameRule.status === "playing" ? "danger" : "slate"} className="ml-2" />
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <small>mode:</small>
                {room.isPublic ? <Button variant="primary" size="sm" disabled={room.gameRule.status === "playing" || room.gameRule.status === "finished"} onClick={() => handleJoinRoom(room.roomId)}>Join</Button> : <span >Offline</span>}
              </div>
            </div>
          </Panel>
        ))}
      </div>
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
            roomId={searchRoomId || ""}
            playerName={session.user?.name || ""}
            playerEmail={session.user?.email || ""}
          />
        </>
      )}
    </Container>
  );
}
