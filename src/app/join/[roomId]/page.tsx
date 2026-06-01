"use client";

import { use, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query"; 
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react"
import Image from "next/image";

import { fetchRoom } from "@/services/rooms";
import { IMAGE_ASSETS_URL } from "@/services/const";
import useSocketJoin from "@/hooks/useSocketJoin";
import randomAvatar from "@/utils/randomAvatar";
import Container from "@/components/Container";
import Panel from "@/components/Panel";
import GoogleLoginBtn from "@/components/GoogleLoginBtn";
import Input from "@/components/Input";
import LabelPill from "@/components/LabelPill";
import Button from "@/components/Button";

interface JoinRoomFormData {
  playerName: string;
}

export default function JoinPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [joinRoomFormData, setJoinRoomFormData] = useState<JoinRoomFormData>({
    playerName: "",
  });
  const [formError, setFormError] = useState<string | undefined>();
  const { joinRoom, isPending } = useSocketJoin();
  const { data: session } = useSession();

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
    const playerAvatar = randomAvatar();
    joinRoom(roomId, session?.user?.email || "", joinRoomFormData.playerName, playerAvatar);
  }, [joinRoomFormData, session, roomId, joinRoom]);

  return (
    <Container className="flex flex-col items-center gap-4 w-full h-full py-5">
      <Image src={`${IMAGE_ASSETS_URL}/images/invitation.webp`} alt="morf-invitation" width={0} height={0} sizes="100vw" priority className="w-full max-w-sm" />
      <Panel className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 justify-center w-full">
        {isLoadingRoom ? (
            <p className="text-sm md:text-base font-fredoka text-mint animate-pulse">creating invitation...</p>
          ) : roomError ? (
            <p className="text-sm md:text-base font-nunito text-danger">{(() => {
              const errorData = JSON.parse(roomError.message) as ErrorResponse;
              return errorData.message;
            })()}</p>
        ) :  (
          <>
            <h2 className="text-3xl md:text-4xl font-fredoka font-bold text-warning uppercase">Invitation</h2>
            <p className="text-base md:text-lg font-nunito text-white text-center font-semibold">
              Agent, you are invited to a classified MORF briefing. Bring your best bluff—trust no one.
            </p>
            {roomData &&  (
              <>
                <div className="flex items-center gap-2 w-full">
                  <p className="flex flex-col gap-1 font-fredoka text-white w-1/2">
                    <small className="text-sm md:text-base font-nunito text-white">creator:</small>
                    <strong>{(roomData as RoomResponseData)?.creatorName}</strong>
                  </p>
                  <p className="flex flex-col gap-1 font-fredoka text-white w-1/2">
                    <small className="text-sm md:text-base font-nunito text-white">max:</small>
                    <span className="flex items-center gap-2">
                      <span>{(roomData as RoomResponseData)?.roomPlayers.length} / {(roomData as RoomResponseData)?.roomMaxPlayers}</span>
                      <LabelPill label={(roomData as RoomResponseData)?.gameRule.status} variant={(roomData as RoomResponseData)?.gameRule.status === "waiting" ? "warning" : (roomData as RoomResponseData)?.gameRule.status === "ready" ? "success" : (roomData as RoomResponseData)?.gameRule.status === "playing" ? "danger" : "slate"} />
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-4 w-full mt-4">
                  {session ? (
                    <>
                      <Input type="text" label="Room ID" placeholder="Input Room ID" value={roomId} disabled onChange={() => null} inputClassName="text-center font-fredoka font-bold uppercase text-lg" />
                      <Input type="text" label="Agent Code" placeholder="Six Seven Eight" autoFocus={true} onChange={(e) => setJoinRoomFormData({ ...joinRoomFormData, playerName: e.target.value })} error={formError} inputClassName="text-center" />
                      <Button variant="success" onClick={formValidation} disabled={isPending}>
                        {isPending ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Join Room"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm md:text-base font-nunito text-white text-center">Please sign in to join the room</span>
                      <GoogleLoginBtn />
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
        </div>
      </Panel>
    </Container>
  )
}