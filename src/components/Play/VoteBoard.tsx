import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CircleCheck } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

export default function VoteBoard() {
  const [openModal, setOpenModal] = useState(false);
  const [allVoted, setAllVoted] = useState<boolean>(false);
  const { socket } = useSocket();
  const { data: session } = useSession();
  const { roomId, roomPlayers, gameData, setRoom } = useRoomStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";

  useEffect(() => {
    if (!socket) return;
    socket.on("listen-game-start-vote", (response) => {
      console.log("listen-game-start-vote", response);
      setOpenModal(true);
      setRoom(response.data);
    });

    socket.on("listen-game-vote-response", (response) => {
      console.log("listen-game-vote-response", response);
      setRoom(response.data);
    })

    socket.on("listen-game-all-players-voted", () => {
      console.log("listen-game-all-players-voted");
      setAllVoted(true);
    })
  }, [socket, setRoom]);

  const voteRequest = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:start-vote", {
      roomId,
      playerEmail: session.user.email,
    }).on("game-start-vote-failed", (response) => {
      console.log("game-start-vote-failed", response);
    });
  }, [socket, roomId, session]);

  const voteHandler = useCallback((playerEmail: string) => {
    // if (hasVoted) return;
    if (!session?.user?.email || !socket || !roomId) return;
    console.log("voteHandler", playerEmail);
    socket.emit("game:vote-response", {
      roomId,
      playerEmail: session.user.email,
      votedEmail: playerEmail,
    }).on("game-vote-response-failed", (response) => {
      console.log("game-vote-response-failed", response);  
    })
  }, [session, socket, roomId]);

  return (
    <>
      <Button variant="primary" size="md" onClick={voteRequest}>Vote Board</Button>
      <Modal isOpen={openModal} dismissible={false} onClose={() => setOpenModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Vote Board</h2>
          <ol className="flex flex-col gap-2 border-t border-zinc-300 py-2">
            {gameData?.players?.map((player: PlayerWithRole) => (
              <li key={player.playerEmail} className="flex items-center justify-between gap-2">
                <strong>{player.playerName}</strong>
                <ul className="flex flex-col">
                  {player.voters?.map((voter, index) => (
                    <li key={index} className="text-xs text-zinc-500">
                      {voter.playerName}
                    </li>
                  ))}
                </ul>
                {/* <small>vote count: {player.voters?.length}</small> */}
                {player.playerEmail !== session?.user?.email ? (
                  <>
                    {player.voters?.some((voter) => voter.playerEmail === session?.user?.email) ? (
                      <CircleCheck className="w-6 h-6 text-green-500" />
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => voteHandler(player.playerEmail)}>Vote</Button>
                    )}
                  </>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ol>
          {isHost && (
            <Button variant="danger" size="md" disabled={!allVoted} onClick={() => null} className="w-full">Calculate Vote</Button>
          )}
        </div>
      </Modal>
    </>
  )
}