import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CircleCheck } from "lucide-react";

import { useRoomStore } from "@/store/room-state";
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input from "../Input";

export default function VoteBoard() {
  const [voteModal, setVoteModal] = useState(false);
  const [guessWordModal, setGuessWordModal] = useState(false);
  const [guessWord, setGuessWord] = useState<string>("");
  const [allVoted, setAllVoted] = useState<boolean>(false);
  const [winStatus, setWinStatus] = useState<string | null>(null);
  const { socket } = useSocket();
  const { data: session } = useSession();
  const { roomId, roomPlayers, gameData, setRoom } = useRoomStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";
  const isAlive = gameData?.players?.find((player: PlayerWithRole) => player.playerEmail === session?.user?.email)?.isAlive;

  useEffect(() => {
    if (!socket) return;
    socket.on("listen-game-start-vote", (response) => {
      console.log("listen-game-start-vote", response);
      setVoteModal(true);
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

    socket.on("listen-game-calculate-results-failed", (response) => {
      console.log("listen-game-calculate-results-failed", response);
    })

    socket.on("listen-game-calculate-results", (response) => {
      console.log("listen-game-calculate-results", response);
      const { message, data } = response;
      switch (message) {
        case "Mimic is the winner":
          setWinStatus("mimic");
          break;
        case "Void is the winner":
          setWinStatus("void");
          break;
        case "Original is the winner":
          setWinStatus("original");
          break;
        case "Void got caught!":
          setWinStatus("void-caught");
          break;
        default:
          setWinStatus("none");
          break;
      }
      setRoom(data);
    })

    socket.on("listen-game-void-got-caught", () => {
      console.log("listen-game-void-got-caught");
      setGuessWordModal(true);
    })

    socket.on("listen-game-void-guess-the-word-correctly", () => {
      console.log("listen-game-void-guess-the-word-correctly");
      setGuessWordModal(false);
      setWinStatus("void");
    })

    socket.on("listen-game-void-guess-the-word-incorrectly", (response: GameVoidGuessTheWordIncorrectlyResponse) => {
      const { outcomeMessage, room } = response.data;
      switch (outcomeMessage) {
        case "Original is the winner":
          setWinStatus("original");
          break;
        case "Void is the winner":
          setWinStatus("void");
          break;
        case "Mimic is the winner":
          setWinStatus("mimic");
          break;
        default:
          setWinStatus("none");
          break;
      }
      setGuessWordModal(false);
      setRoom(room);
    })

    socket.on("listen-game-continue-success", (response) => {
      console.log("listen game-continue-success", response);
      setRoom(response.data);
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
    })

    socket.on("listen-game-restart-success", (response) => {
      console.log("listen game-restart-success", response);
      setRoom(response.data);
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
    })

    socket.on("listen-game-initialize-success", (response) => {
      console.log("listen game-initialize-success", response);
      setRoom(response.data);
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
    })
  }, [socket, setRoom, gameData, session]);

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

  const submitVote = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:calculate-results", {
      roomId,
      playerEmail: session.user.email,
    }).on("game-calculate-results-failed", (response) => {
      console.log("game-calculate-results-failed", response);
    })
  }, [socket, roomId, session])

  const submitGuessWord = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    if (guessWord.length < 3) {
      return;
    }
    socket.emit("game:void-guess-the-word", {
      roomId,
      playerEmail: session.user.email,
      guessWord: guessWord.toLowerCase(),
    });
  }, [socket, roomId, session, guessWord])

  const continueGame = useCallback(() => {
    console.log("continueGame");
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:continue", {
      playerEmail: session.user.email,
      roomId,
    }).on("game-continue-failed", (response) => {
      console.log("game-continue-failed", response);
    });
  }, [socket, roomId, session])

  // restart the game, change game status to ready
  const restartGame = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    console.log("restartGame", session.user.email, roomId);
    socket.emit("game:restart", {
      playerEmail: session.user.email,
      roomId,
    }).on("game-restart-failed", (response) => {
      console.log("game-restart-failed", response);
    });
  }, [socket, roomId, session])

  // replay the game using the same game rules
  const replayGame = useCallback(() => {
    console.log("replayGame");
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:initialize", {
      playerEmail: session.user.email,
      roomId,
    })
  }, [socket, roomId, session])

  return (
    <>
      {isHost && <Button variant="primary" size="md" onClick={voteRequest}>Vote Board</Button>}
      <Modal isOpen={voteModal} dismissible={false} onClose={() => setVoteModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            {!winStatus ? "Vote Board" : "Game Results"}
          </h2>
          <div className="flex flex-col gap-2">
            {winStatus === null ? (
              <>
                <ol className="flex flex-col gap-2 border-t border-zinc-300 py-2">
                  {gameData?.players?.map((player: PlayerWithRole) => (
                    <li key={player.playerEmail} className="flex items-center justify-between gap-2">
                      <strong className={player.isAlive ? 'text-zinc-900' : 'text-zinc-500 line-through'}>{player.playerName}</strong>
                      <ul className="flex flex-col">
                        {player.voters?.map((voter, index) => (
                          <li key={index} className="text-xs text-zinc-500">
                            {voter.playerName}
                          </li>
                        ))}
                      </ul>
                      {player.playerEmail !== session?.user?.email ? (
                        <>
                          {player.voters?.some((voter) => voter.playerEmail === session?.user?.email) ? (
                            <CircleCheck className="w-6 h-6 text-green-500" />
                          ) : isAlive && player.isAlive && (
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
                  <Button variant="danger" size="md" disabled={!allVoted} onClick={submitVote} className="w-full">Calculate Vote</Button>
                )}
              </>
            ) : winStatus !== null && winStatus !== "none" ? (
              <>
                {winStatus === "void-caught" ? (
                  <p className="text-lg text-center font-bold">
                    The void got caught!
                  </p>
                ) : (
                  <>
                    <p className="text-lg text-center font-bold">
                      The winner is the
                      {' '}
                      <span className="capitalize">{winStatus}!</span>
                      <br/>
                      <strong>The word was: {gameData?.wordPairList[0].originalWord}</strong>
                      <br/>
                      <strong>The mimic word was: {gameData?.wordPairList[0].mimicWord}</strong>
                    </p>
                    {isHost && (
                      <div className="flex justify-between gap-2">
                        <Button variant="secondary" size="md" onClick={restartGame} className="w-full">Restart</Button>
                        <Button variant="primary" size="md" onClick={replayGame} className="w-full">Replay</Button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-lg text-center font-bold">
                  No winner yet!
                </p>
                <p>
                  {/* show the player name who is isAlive = false */}
                  {gameData?.players?.filter((player: PlayerWithRole) => !player.isAlive).map((player: PlayerWithRole) => (
                    <span key={player.playerEmail} className="text-zinc-500 text-sm line-through block">
                      {player.playerName}
                    </span>
                  ))}
                </p>
                {isHost && (
                  <Button variant="secondary" size="md" onClick={continueGame} className="w-full">Continue</Button>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
      <Modal isOpen={guessWordModal} dismissible={false} onClose={() => setGuessWordModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Guess the Word</h2>
          <div className="flex flex-col gap-2">
            <Input label="Guess the Word" value={guessWord} onChange={(e) => setGuessWord(e.target.value)} />
            <Button variant="primary" size="md" onClick={submitGuessWord}>Guess</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}