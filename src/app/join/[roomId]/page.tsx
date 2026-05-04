"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query"; 
import { useSession } from "next-auth/react";

import { fetchRoom } from "@/services/rooms";
import useSocketJoin from "@/hooks/useSocketJoin";
import Container from "@/components/Container";
import GoogleLoginBtn from "@/components/GoogleLoginBtn";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import LabelPill from "@/components/LabelPill";
import Button from "@/components/Button";

interface JoinRoomFormData {
  playerName: string;
}

export default function JoinPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [joinRoomModalOpen, setJoinRoomModalOpen] = useState(false);
  const [joinRoomFormData, setJoinRoomFormData] = useState<JoinRoomFormData>({
    playerName: "",
  });
  const [formError, setFormError] = useState<string | undefined>();
  const { joinRoom, joinRoomError } = useSocketJoin();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;
    setJoinRoomFormData((prev) => ({
      ...prev,
      playerName: session.user?.name || "",
    }));
  }, [session]);

  const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useQuery({
    queryKey: ['FETCH_ROOM', roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!roomId,
    retry: 3,
  });

  const formValidation = useCallback(() => {
    let errors: string = "";
    const { playerName } = joinRoomFormData;
    if (!playerName || playerName.trim() === "") {
      errors = "Player name is required";
    } else if (playerName.length < 3) {
      errors = "Player name must be at least 3 characters long";
    }
    setFormError(errors);
    if (errors) return;
    joinRoom(roomId, session?.user?.email || "", joinRoomFormData.playerName);
  }, [joinRoomFormData, session, roomId, joinRoom]);

  return (
    <Container>
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-md w-full max-w-md p-4">
          {isLoadingRoom ? (
            <div className="flex flex-col items-center gap-2 justify-center w-full">
              <p className="text-sm text-gray-500 animate-pulse">Loading room data...</p>
            </div>
          ) : roomError ? (
            <div className="flex flex-col items-center gap-2 justify-center w-full">
              {(() => {
                const errorData = JSON.parse(roomError.message) as ErrorResponse;
                return <p className="text-red-500">{errorData.message}</p>
              })()}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold w=full">Join Room</h2>
              {roomData as RoomResponseData && (
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-sm text-gray-500">room ID: {(roomData as RoomResponseData)?.roomId}</p>
                  <p className="text-sm text-gray-500">creator: {(roomData as RoomResponseData)?.creatorName}</p>
                  <p className="text-sm text-gray-500">
                    max: {(roomData as RoomResponseData)?.roomPlayers.length } / {(roomData as RoomResponseData)?.roomMaxPlayers}
                    <LabelPill label={(roomData as RoomResponseData)?.gameRule.status} variant={(roomData as RoomResponseData)?.gameRule.status === "waiting" ? "warning" : (roomData as RoomResponseData)?.gameRule.status === "ready" ? "success" : (roomData as RoomResponseData)?.gameRule.status === "playing" ? "danger" : "neutral"} className="ml-2" />
                  </p>
                  <p className="text-sm text-gray-500">mode: {(roomData as RoomResponseData)?.isPublic ? "public" : "offline"}</p>
                  {!session ? (
                    <>
                      <p className="text-xs text-gray-500">Please login to join the room</p>
                    </>
                  ) : (
                    <>
                      {joinRoomError && <p className="text-red-500">{joinRoomError}</p>}
                      <Input placeholder="Player Name" value={joinRoomFormData.playerName} onChange={(e) => setJoinRoomFormData({ ...joinRoomFormData, playerName: e.target.value })} error={formError} />
                      <Button variant="success" onClick={formValidation}>Join Room</Button>
                    </>
                  )}
                  <GoogleLoginBtn />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Modal isOpen={joinRoomModalOpen} onClose={() => setJoinRoomModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Join Room</h2>
          {joinRoomError && <p className="text-red-500">{joinRoomError}</p>}
          <Input placeholder="Player Name" value={joinRoomFormData.playerName} onChange={(e) => setJoinRoomFormData({ ...joinRoomFormData, playerName: e.target.value })} error={formError} />
          <Button variant="success" onClick={formValidation}>Join Room</Button>
        </div>
      </Modal>
    </Container>
  )
}