import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CircleCheck } from "lucide-react";
import Image from "next/image";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input from "../Input";
import Checkbox from "../Checkbox";
import RestartBtn from "@/components/Play/RestartBtn";
import InfoPopover from "../InfoPopover";

interface VoteBoardProps {
  playerSuperpower: Superpower;
}

export default function VoteBoard({ playerSuperpower }: VoteBoardProps) {
  const [voteModal, setVoteModal] = useState(false);
  const [isPassivePowerActivated, setIsPassivePowerActivated] = useState<boolean>(false);
  const [guessWordModal, setGuessWordModal] = useState(false);
  const [guessWord, setGuessWord] = useState<string>("");
  const [allVoted, setAllVoted] = useState<boolean>(false);
  const [winStatus, setWinStatus] = useState<string | null>(null);
  const [superpowerTriggered, setSuperpowerTriggered] = useState<string | null>(null);
  const { setToast } = useToastStore();
  const { socket } = useSocket();
  const { data: session } = useSession();
  const { roomId, roomPlayers, gameData, setRoom } = useRoomStore();

  const isHost = roomPlayers.find((player) => player.playerEmail === session?.user?.email)?.role === "host";
  const isAlive = gameData?.players?.find((player: PlayerWithRole) => player.playerEmail === session?.user?.email)?.isAlive;

  const winStatusImage = (winStatus: string) => {
    switch (winStatus) {
      case "The Shifter":
        return "/images/win-two.webp";
      case "The Unknown Origin":
        return "/images/win-two.webp";
      case "The Agents":
        return "/images/win-one.webp";
      case "":
        return "/images/agent-jellyfish-caught.webp";
      case "The Saboteur":
        return "/images/agent-octopus.webp";
      default:
        return "/images/agent-male.webp";
    }
  }

  const activatedPassiveSuperpower = useCallback((superpowerName: string, value: boolean) => {
    if (!socket) return;
    setIsPassivePowerActivated(value);
    socket.emit("superpower:use-passive-power", {
      playerEmail: session?.user?.email,
      roomId,
      powerName: superpowerName,
      isActive: value,
    }).on("use-passive-power-failed", (response) => {
      setToast(response.message, "error");
      setIsPassivePowerActivated(false);
    }).on("use-passive-power-success", (response) => {
      setToast(response.message, "success");
    })
  }, [socket, roomId, session, setToast])

  useEffect(() => {
    if (!playerSuperpower) return;
    if (playerSuperpower.type === "passive" && playerSuperpower.name === 'saboteur') {
      setIsPassivePowerActivated(true);
      activatedPassiveSuperpower(playerSuperpower.name, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerSuperpower])

  useEffect(() => {
    if (!socket) return;
    socket.on("listen-game-start-vote", (response) => {
      setVoteModal(true);
      setRoom(response.data);
    });

    socket.on("listen-game-vote-response", (response) => {
      setRoom(response.data);
    })

    socket.on("listen-game-all-players-voted", () => {
      setAllVoted(true);
    })

    socket.on("listen-game-calculate-results-failed", (response) => {
      setToast(response.message, "error");
      setIsPassivePowerActivated(false);
    })

    socket.on("listen-game-calculate-results-player", (response) => {
      setRoom({
        ...response.data.room,
      })
    })

    socket.on("listen-game-calculate-results", (response) => {
      const { message, data } = response;
      switch (message) {
        case "Minority is the winner":
          setWinStatus("The Shifter");
          break;
        case "Blind is the winner":
          setWinStatus("The Unknown Origin");
          break;
        case "Majority is the winner":
          setWinStatus("The Agents");
          break;
        case "Blind got caught!":
          setWinStatus("The Unknown Origin Got Caught");
          break;
        case "Saboteur is the winner":
          setWinStatus("The Saboteur");
          break;
        default:
          setWinStatus("none");
          break;
      }
      setRoom(data);
    })

    socket.on("listen-game-superpower-triggered", (response) => {
      const { triggeredEffects } = response.data
      triggeredEffects.forEach((effect: { playerEmail: string, playerName: string, power: string }) => {
        switch (effect.power) {
          case "chief":
            setSuperpowerTriggered(`${effect.playerName} The Chief pulled rank to break the tie.`)
            break;
          case "briber":
            setSuperpowerTriggered(`${effect.playerName}'s money talk! Someone was bought off. One vote disappeared.`)
            break;
        }
      })
    })

    socket.on("listen-game-blind-got-caught", () => {
      setWinStatus("The Unknown Origin Got Caught");
      setGuessWordModal(true);
    })

    socket.on("listen-game-blind-guess-the-word-correctly", () => {
      setGuessWordModal(false);
      setWinStatus("The Unknown Origin");
    })

    socket.on("listen-game-blind-guess-the-word-incorrectly", (response: GameBlindGuessTheWordIncorrectlyResponse) => {
      const { outcomeMessage, room } = response.data;
      switch (outcomeMessage) {
        case "Majority is the winner":
          setWinStatus("The Agents");
          break;
        case "Blind is the winner":
          setWinStatus("The Unknown Origin");
          break;
        case "Minority is the winner":
          setWinStatus("The Shifter");
          break;
        default:
          setWinStatus("none");
          break;
      }
      setGuessWordModal(false);
      setToast("Wrong guess!", "error");
      setRoom(room);
    })

    socket.on("listen-game-continue-success", (response) => {
      setRoom(response.data.room);
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
      setSuperpowerTriggered(null);
      setIsPassivePowerActivated(false);
      if (playerSuperpower && playerSuperpower.type === 'passive' && playerSuperpower.name === 'saboteur') {
        activatedPassiveSuperpower(playerSuperpower.name, true);
      }
    })

    socket.on("listen-game-restart-success", (response) => {
      setRoom(response.data);
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
      setSuperpowerTriggered(null);
    })

    socket.on("listen-game-initialize-success", (response) => {
      setRoom(response.data);
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
      setSuperpowerTriggered(null);
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, setRoom, gameData, session, setToast, playerSuperpower]);

  const voteRequest = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:start-vote", {
      roomId,
      playerEmail: session.user.email,
    }).on("game-start-vote-failed", (response) => {
      setToast(response.message, "error");
    });
  }, [socket, roomId, session, setToast]);

  const voteHandler = useCallback((playerEmail: string) => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:vote-response", {
      roomId,
      playerEmail: session.user.email,
      votedEmail: playerEmail,
    }).on("game-vote-response-failed", (response) => {
      setToast(response.message, "error");
    })
  }, [session, socket, roomId, setToast]);

  const submitVote = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:calculate-results", {
      roomId,
      playerEmail: session.user.email,
      usePassivePower: isPassivePowerActivated,
      passivePowerName: playerSuperpower?.name,
      passivePowerOwnerEmail: session?.user?.email,
    }).on("game-calculate-results-failed", (response) => {
      setToast(response.message, "error");
      setIsPassivePowerActivated(false);
    })
  }, [socket, roomId, session, isPassivePowerActivated, playerSuperpower, setToast])

  const submitGuessWord = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    if (guessWord.length < 3) {
      return;
    }
    console.log("submitGuessWord", guessWord);
    socket.emit("game:blind-guess-the-word", {
      roomId,
      playerEmail: session.user.email,
      guessWord: guessWord.toLowerCase(),
    });
  }, [socket, roomId, session, guessWord])

  const continueGame = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:continue", {
      playerEmail: session.user.email,
      roomId,
    }).on("game-continue-failed", (response) => {
      setToast(response.message, "error");
      setIsPassivePowerActivated(false);
    });
  }, [socket, roomId, session, setToast])

  // replay the game using the same game rules
  const replayGame = useCallback(() => {
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
                <ol className="flex flex-col gap-4 border-t border-zinc-300 py-4">
                  {gameData?.players?.map((player: PlayerWithRole) => (
                    <li key={player.playerEmail} className="grid grid-cols-3 items-center gap-4">
                      <strong className={`font-fredoka text-xl capitalize text-nowrap text-ellipsis overflow-hidden ${player.isAlive ? 'text-white' : 'text-zinc-500 line-through'}`}>
                        {player.playerName}
                      </strong>
                      <ul className="flex-1">
                        {player.voters?.map((voter, index) => (
                          <li key={index} className="text-xs text-white">
                            {voter.playerName}
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-end items-center">
                        {player.playerEmail !== session?.user?.email ? (
                          <>
                            {player.voters?.some((voter) => voter.playerEmail === session?.user?.email) ? (
                              <CircleCheck className="w-6 h-6 text-green-500" />
                            ) : isAlive && player.isAlive && (
                              <Button variant="primary" size="sm" onClick={() => voteHandler(player.playerEmail)}>Vote</Button>
                            )}
                          </>
                        ) : player.isAlive ? (
                          <>
                            {playerSuperpower && playerSuperpower.type === 'passive' && playerSuperpower.name !== "agent" && (
                              <div className="flex items-center">
                                <InfoPopover text={<>{playerSuperpower.description} {player.hasUsedSuperpower ? <span className="text-red-500">(already used)</span> : ''}</>} />
                                &nbsp;
                                <Checkbox id={playerSuperpower.name} label={`use ${playerSuperpower.name}`} color="secondary" checked={playerSuperpower.name === 'saboteur' ? true : isPassivePowerActivated} disabled={player.hasUsedSuperpower} readonly={playerSuperpower.name === 'saboteur'} onChange={(value) => activatedPassiveSuperpower(playerSuperpower.name, value)} />
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
                {isHost && (
                  <div className="flex flex-col gap-4">
                    <Button variant="danger" disabled={!allVoted} onClick={submitVote} className="w-full">Submit Vote</Button>
                    <Button variant="warning" size="sm" onClick={voteRequest} className="w-full">Reload Vote</Button>
                  </div>
                )}
              </>
            ) : winStatus !== null && winStatus !== "none" ? (
              <>
                {winStatus === "The Unknown Origin Got Caught" ? (
                  <p className="text-lg text-center font-bold">
                    The Unknown Origin got caught!
                  </p>
                ) : (
                  <>
                    <p className="text-xl text-center text-white font-fredoka font-bold">
                      The winner is the
                      {' '}
                      <span className="capitalize">{winStatus}!</span>
                    </p>
                    <div className="flex justify-center items-center">
                      <Image src={winStatusImage(winStatus)} alt="Win Status" priority width={150} height={150} />
                    </div>
                    {superpowerTriggered && (
                      <p className="text-center text-red-500">
                        {superpowerTriggered}
                      </p>
                    )}
                    <p className="text-sm text-center leading-relaxed">
                      <span>
                        The correct password was:&nbsp;
                        <strong>
                          {gameData?.wordPairList?.[0]?.majorityWord}
                        </strong>
                      </span>
                      <br />
                      <span>
                        The fake password was:&nbsp;
                        <strong>
                          {gameData?.wordPairList?.[0]?.minorityWord}
                        </strong>
                      </span>
                    </p>
                    {isHost && (
                      <div className="flex justify-between gap-4">
                        <RestartBtn isHost={isHost} />
                        <Button variant="primary" size="md" onClick={replayGame} className="w-full">Replay</Button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-xl text-center font-fredoka font-bold">
                  No winner yet!
                  <br />
                  Vote result is tied!
                </p>
                {superpowerTriggered && (
                  <p className="text-center text-red-500">
                    {superpowerTriggered}
                  </p>
                )}
                <ul className="flex flex-col gap-2 justify-center items-center list-decimal pl-4">
                  {gameData?.players?.filter((player: PlayerWithRole) => !player.isAlive).map((player: PlayerWithRole) => (
                    <li key={player.playerEmail} className="text-white">
                      <strong className="font-semibold">{player.playerName}</strong> Eliminated
                    </li>
                  ))}
                </ul>
                {isHost && (
                  <Button variant="primary" size="md" onClick={continueGame} className="w-full">Continue</Button>
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