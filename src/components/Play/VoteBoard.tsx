import { useState, useEffect, useCallback, useRef } from "react";
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

interface PassivePowerConfirmModalState {
  isOpen: boolean;
  type: 'chief' | 'briber' | 'saboteur' | 'agent' | null;
}

function getAlivePlayers(players: PlayerWithRole[]) {
  return players.filter((player) => player.isAlive);
}

function countVotesCast(players: PlayerWithRole[]) {
  return getAlivePlayers(players).reduce(
    (sum, player) => sum + (player.voters?.length ?? 0),
    0
  );
}

function haveAllAlivePlayersVoted(players: PlayerWithRole[]) {
  const aliveCount = getAlivePlayers(players).length;
  return aliveCount > 0 && countVotesCast(players) >= aliveCount;
}

function isVoteResultTied(players: PlayerWithRole[]) {
  const voteCounts = getAlivePlayers(players).map(
    (player) => player.voters?.length ?? 0
  );
  if (voteCounts.length === 0) return false;

  const maxVotes = Math.max(...voteCounts);
  if (maxVotes === 0) return false;

  return voteCounts.filter((count) => count === maxVotes).length >= 2;
}

export default function VoteBoard({ playerSuperpower }: VoteBoardProps) {
  const [voteModal, setVoteModal] = useState(false);
  const [passivePowerConfirmModal, setPassivePowerConfirmModal] = useState<PassivePowerConfirmModalState>({
    isOpen: false,
    type: null,
  });
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
        return "/images/minority-win.webp";
      case "The Unknown Origin":
        return "/images/minority-win.webp";
      case "The Agents":
        return "/images/majority-win.webp";
      case "The Saboteur":
        return "/images/saboteur-win.webp";
      default:
        return "/images/morf-logo.webp";
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
      setPassivePowerConfirmModal({ isOpen: false, type: null });
    }).on("use-passive-power-success", (response) => {
      setToast(response.message, "success");
      setPassivePowerConfirmModal({ isOpen: false, type: null });
    })
  }, [socket, roomId, session, setToast])

  const updatePassivePowerConfirmModal = useCallback(({ isOpen, type }: PassivePowerConfirmModalState) => {
    setPassivePowerConfirmModal({ isOpen, type });
  }, [])

  const playerSuperpowerRef = useRef(playerSuperpower);
  playerSuperpowerRef.current = playerSuperpower;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const isPassivePowerActivatedRef = useRef(isPassivePowerActivated);
  isPassivePowerActivatedRef.current = isPassivePowerActivated;
  const setRoomRef = useRef(setRoom);
  setRoomRef.current = setRoom;
  const setToastRef = useRef(setToast);
  setToastRef.current = setToast;
  const updatePassivePowerConfirmModalRef = useRef(updatePassivePowerConfirmModal);
  updatePassivePowerConfirmModalRef.current = updatePassivePowerConfirmModal;
  const activatedPassiveSuperpowerRef = useRef(activatedPassiveSuperpower);
  activatedPassiveSuperpowerRef.current = activatedPassiveSuperpower;

  useEffect(() => {
    if (!playerSuperpower) return;
    if (playerSuperpower.name === 'saboteur') {
      setIsPassivePowerActivated(true);
      activatedPassiveSuperpower(playerSuperpower.name, true);
    }
  }, [playerSuperpower, activatedPassiveSuperpower])

  useEffect(() => {
    if (!socket) return;

    const mapOutcomeMessageToWinStatus = (message: string) => {
      switch (message) {
        case "Minority is the winner":
          return "The Shifter";
        case "Blind is the winner":
          return "The Unknown Origin";
        case "Majority is the winner":
          return "The Agents";
        case "Blind got caught!":
          return "The Unknown Origin Got Caught";
        case "Saboteur is the winner":
          return "The Saboteur";
        default:
          return "none";
      }
    };

    const resetVoteBoardUi = () => {
      setVoteModal(false);
      setGuessWordModal(false);
      setAllVoted(false);
      setWinStatus(null);
      setGuessWord("");
      setSuperpowerTriggered(null);
      setIsPassivePowerActivated(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameStartVote = (response: any) => {
      if (!response) return;
      setVoteModal(true);
      setRoomRef.current(response.data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameVoteResponse = (response: any) => {
      if (!response) return;
      setRoomRef.current(response.data);
      const { gameData: { players } } = response.data;
      const player = players.find(
        (p: PlayerWithRole) => p.playerEmail === sessionRef.current?.user?.email
      );
      if (!player) return;
      const superpower = playerSuperpowerRef.current;

      if (superpower?.name === 'chief') {
        if (player.hasUsedSuperpower) return;
        if (
          haveAllAlivePlayersVoted(players) &&
          isVoteResultTied(players) &&
          !isPassivePowerActivatedRef.current
        ) {
          updatePassivePowerConfirmModalRef.current({ isOpen: true, type: 'chief' });
        }
        return;
      }

      if (superpower?.name === 'briber') {
        if (player.hasUsedSuperpower) return;
        const voteCount = player.voters?.length ?? 0;
        if (voteCount >= 2 && !isPassivePowerActivatedRef.current) {
          updatePassivePowerConfirmModalRef.current({ isOpen: true, type: 'briber' });
        }
      }
    };

    const handleGameAllPlayersVoted = () => {
      setAllVoted(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameCalculateResultsFailed = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "error");
      setIsPassivePowerActivated(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameCalculateResultsPlayer = (response: any) => {
      if (!response) return;
      setRoomRef.current({ ...response.data.room });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameCalculateResults = (response: any) => {
      if (!response) return;
      setWinStatus(mapOutcomeMessageToWinStatus(response.message));
      setRoomRef.current(response.data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameSuperpowerTriggered = (response: any) => {
      if (!response) return;
      const { triggeredEffects } = response.data;
      triggeredEffects.forEach((effect: { playerEmail: string; playerName: string; power: string }) => {
        switch (effect.power) {
          case "chief":
            setSuperpowerTriggered(`${effect.playerName} The Chief pulled rank to break the tie.`);
            break;
          case "briber":
            setSuperpowerTriggered(`${effect.playerName}'s money talk! Someone was bought off. One vote disappeared.`);
            break;
        }
      });
    };

    const handleGameBlindGotCaught = () => {
      setWinStatus("The Unknown Origin Got Caught");
      setGuessWordModal(true);
    };

    const handleGameBlindGuessTheWordCorrectly = () => {
      setGuessWordModal(false);
      setWinStatus("The Unknown Origin");
    };

    const handleGameBlindGuessTheWordIncorrectly = (response: GameBlindGuessTheWordIncorrectlyResponse) => {
      if (!response) return;
      const { outcomeMessage, room } = response.data;
      setWinStatus(mapOutcomeMessageToWinStatus(outcomeMessage));
      setGuessWordModal(false);
      setToastRef.current("Wrong guess!", "error");
      setRoomRef.current(room);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameContinueSuccess = (response: any) => {
      if (!response) return;
      setRoomRef.current(response.data.room);
      resetVoteBoardUi();
      setIsPassivePowerActivated(false);
      const superpower = playerSuperpowerRef.current;
      if (superpower?.type === 'passive' && superpower.name === 'saboteur') {
        activatedPassiveSuperpowerRef.current(superpower.name, true);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameRestartSuccess = (response: any) => {
      if (!response) return;
      setRoomRef.current(response.data);
      resetVoteBoardUi();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameInitializeSuccess = (response: any) => {
      if (!response) return;
      setRoomRef.current(response.data);
      resetVoteBoardUi();
    };

    socket.on("listen-game-start-vote", handleGameStartVote);
    socket.on("listen-game-vote-response", handleGameVoteResponse);
    socket.on("listen-game-all-players-voted", handleGameAllPlayersVoted);
    socket.on("listen-game-calculate-results-failed", handleGameCalculateResultsFailed);
    socket.on("listen-game-calculate-results-player", handleGameCalculateResultsPlayer);
    socket.on("listen-game-calculate-results", handleGameCalculateResults);
    socket.on("listen-game-superpower-triggered", handleGameSuperpowerTriggered);
    socket.on("listen-game-blind-got-caught", handleGameBlindGotCaught);
    socket.on("listen-game-blind-guess-the-word-correctly", handleGameBlindGuessTheWordCorrectly);
    socket.on("listen-game-blind-guess-the-word-incorrectly", handleGameBlindGuessTheWordIncorrectly);
    socket.on("listen-game-continue-success", handleGameContinueSuccess);
    socket.on("listen-game-restart-success", handleGameRestartSuccess);
    socket.on("listen-game-initialize-success", handleGameInitializeSuccess);

    return () => {
      socket.off("listen-game-start-vote", handleGameStartVote);
      socket.off("listen-game-vote-response", handleGameVoteResponse);
      socket.off("listen-game-all-players-voted", handleGameAllPlayersVoted);
      socket.off("listen-game-calculate-results-failed", handleGameCalculateResultsFailed);
      socket.off("listen-game-calculate-results-player", handleGameCalculateResultsPlayer);
      socket.off("listen-game-calculate-results", handleGameCalculateResults);
      socket.off("listen-game-superpower-triggered", handleGameSuperpowerTriggered);
      socket.off("listen-game-blind-got-caught", handleGameBlindGotCaught);
      socket.off("listen-game-blind-guess-the-word-correctly", handleGameBlindGuessTheWordCorrectly);
      socket.off("listen-game-blind-guess-the-word-incorrectly", handleGameBlindGuessTheWordIncorrectly);
      socket.off("listen-game-continue-success", handleGameContinueSuccess);
      socket.off("listen-game-restart-success", handleGameRestartSuccess);
      socket.off("listen-game-initialize-success", handleGameInitializeSuccess);
    };
  }, [socket]);

  const confirmUsePassivePower = useCallback(() => {
    if (!playerSuperpower?.name) return;
    setIsPassivePowerActivated(true);
    setPassivePowerConfirmModal({ isOpen: false, type: null });
    // activatedPassiveSuperpower(playerSuperpower.name, true);
    // updatePassivePowerConfirmModal({ isOpen: false, type: null });
  }, [playerSuperpower])

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
      <Modal isOpen={passivePowerConfirmModal.isOpen} dismissible={false} onClose={() => setPassivePowerConfirmModal({ isOpen: false, type: null })}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Confirm Use of Passive Power</h2>
          <p className="text-sm text-center">
            {passivePowerConfirmModal.type === 'chief' && 'The vote result is tied, You are the Chief, will you use your superpower?'}
            {passivePowerConfirmModal.type === 'briber' && 'You get two or more elimination votes, will you use your superpower?'}
            {passivePowerConfirmModal.type === 'saboteur' && 'You are the Saboteur, will you use your superpower?'}
          </p>
          <div className="flex justify-between gap-4">
            <Button
              variant="warning"
              size="sm"
              onClick={() => {
                updatePassivePowerConfirmModal({ isOpen: false, type: null });
                setIsPassivePowerActivated(false);
              }}
              className="w-full"
            >No</Button>
            <Button variant="secondary" size="sm" onClick={confirmUsePassivePower} className="w-full">Yes</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}