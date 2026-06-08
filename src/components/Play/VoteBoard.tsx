import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { CircleCheck } from "lucide-react";
import Image from "next/image";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import { winSound, alertSound, playSfx } from '@/utils/sounds';
import { IMAGE_ASSETS_URL } from "@/services/const";
import useSocket from "@/hooks/useSocket";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input from "../Input";
import Checkbox from "../Checkbox";
import RestartBtn from "@/components/Play/RestartBtn";
import InfoPopover from "../InfoPopover";

interface VoteBoardProps {
  playerRole: string;
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

export default function VoteBoard({ playerRole, playerSuperpower }: VoteBoardProps) {
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
      case "The MORF":
        return `${IMAGE_ASSETS_URL}/images/minority-win.webp`;
      case "The ROGUE":
        return `${IMAGE_ASSETS_URL}/images/minority-win.webp`;
      case "The Agents":
        return `${IMAGE_ASSETS_URL}/images/majority-win.webp`;
      case "The Saboteur":
        return `${IMAGE_ASSETS_URL}/images/saboteur-win.webp`;
      default:
        return `${IMAGE_ASSETS_URL}/images/morf-logo.webp`;
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
      if (message !== 'Blind got caught!') {
        playSfx(winSound);
      }
      switch (message) {
        case "Minority is the winner":
          return "The MORF";
        case "Blind is the winner":
          return "The ROGUE";
        case "Majority is the winner":
          return "The Agents";
        case "Blind got caught!":
          return "The ROGUE Got Caught";
        case "Saboteur is the winner":
          return "The Saboteur";
        case "Blind got eliminated":
          return "The ROGUE Eliminated";
        case "Minority got eliminated":
          return "The MORF Eliminated";
        case "Vote tied":
          return "The Vote is Tied";
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
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          } else {
            playSfx(alertSound);
          }
        }
        return;
      }

      if (superpower?.name === 'briber') {
        if (player.hasUsedSuperpower) return;
        const voteCount = player.voters?.length ?? 0;
        if (voteCount >= 2 && !isPassivePowerActivatedRef.current) {
          updatePassivePowerConfirmModalRef.current({ isOpen: true, type: 'briber' });
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          } else {
            playSfx(alertSound);
          }
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
      setWinStatus("The ROGUE Got Caught");
      if (playerRole !== "blind") return;
      setGuessWordModal(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleReGuessTheWordSuccess = (response: any) => {
      if (!response) return;
      setGuessWordModal(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleReGuessTheWordFailed = (response: any) => {
      if (!response) return;
      setToastRef.current(response.message, "error");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGameBlindGuessTheWordCorrectly = (response: any) => {
      if (!response) return;
      const { outcomeMessage, room } = response.data;
      setWinStatus(mapOutcomeMessageToWinStatus(outcomeMessage));
      setGuessWordModal(false);
      setRoomRef.current(room);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRoomRejoinSuccess = (response: any) => {
      if (!response) return;
      // setRoomRef.current(response.data);
      console.log("handleRoomRejoinSuccess: ", response);
      const { gamePhase, voteResult } = response.data;
      if (gamePhase === 'vote' || gamePhase === 'vote-result') {
        setVoteModal(true);
        if (gamePhase === 'vote-result') {
          setWinStatus(mapOutcomeMessageToWinStatus(voteResult));
        }
      } else if (gamePhase === 'guess') {
        // TODO: handle guess phase
      }
    };

    socket.on("listen-game-start-vote", handleGameStartVote);
    socket.on("listen-game-vote-response", handleGameVoteResponse);
    socket.on("listen-game-all-players-voted", handleGameAllPlayersVoted);
    socket.on("listen-game-calculate-results-failed", handleGameCalculateResultsFailed);
    socket.on("listen-game-calculate-results-player", handleGameCalculateResultsPlayer);
    socket.on("listen-game-calculate-results", handleGameCalculateResults);
    socket.on("listen-game-superpower-triggered", handleGameSuperpowerTriggered);
    socket.on("listen-game-blind-got-caught", handleGameBlindGotCaught);
    socket.on("listen-game-re-guess-success", handleReGuessTheWordSuccess);
    socket.on("listen-game-re-guess-failed", handleReGuessTheWordFailed)
    socket.on("listen-game-blind-guess-the-word-correctly", handleGameBlindGuessTheWordCorrectly);
    socket.on("listen-game-blind-guess-the-word-incorrectly", handleGameBlindGuessTheWordIncorrectly);
    socket.on("listen-game-continue-success", handleGameContinueSuccess);
    socket.on("listen-game-restart-success", handleGameRestartSuccess);
    socket.on("listen-game-initialize-success", handleGameInitializeSuccess);
    socket.on("room-rejoin-success", handleRoomRejoinSuccess);

    return () => {
      socket.off("listen-game-start-vote", handleGameStartVote);
      socket.off("listen-game-vote-response", handleGameVoteResponse);
      socket.off("listen-game-all-players-voted", handleGameAllPlayersVoted);
      socket.off("listen-game-calculate-results-failed", handleGameCalculateResultsFailed);
      socket.off("listen-game-calculate-results-player", handleGameCalculateResultsPlayer);
      socket.off("listen-game-calculate-results", handleGameCalculateResults);
      socket.off("listen-game-superpower-triggered", handleGameSuperpowerTriggered);
      socket.off("listen-game-blind-got-caught", handleGameBlindGotCaught);
      socket.off("listen-game-re-guess-failed", handleReGuessTheWordFailed);
      socket.off("listen-game-re-guess-success", handleReGuessTheWordSuccess);
      socket.off("listen-game-blind-guess-the-word-correctly", handleGameBlindGuessTheWordCorrectly);
      socket.off("listen-game-blind-guess-the-word-incorrectly", handleGameBlindGuessTheWordIncorrectly);
      socket.off("listen-game-continue-success", handleGameContinueSuccess);
      socket.off("listen-game-restart-success", handleGameRestartSuccess);
      socket.off("listen-game-initialize-success", handleGameInitializeSuccess);
      socket.off("room-rejoin-success", handleRoomRejoinSuccess);
    };
  }, [guessWordModal, playerRole, socket]);

  const confirmUsePassivePower = useCallback(() => {
    if (!playerSuperpower?.name) return;
    setIsPassivePowerActivated(true);
    setPassivePowerConfirmModal({ isOpen: false, type: null });
    activatedPassiveSuperpower(playerSuperpower.name, true);
  }, [playerSuperpower, activatedPassiveSuperpower])

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

  const openGuessWordModal = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    socket.emit("game:re-guess-the-word", {
      roomId,
      playerEmail: session.user.email,
    });
  }, [socket, roomId, session])

  const submitGuessWord = useCallback(() => {
    if (!session?.user?.email || !socket || !roomId) return;
    const sanitizedGuessWord = guessWord.replace(/[^a-zA-Z]/g, '').trim().replace(/^\s+|\s+$/g, '').toLowerCase();
    if (sanitizedGuessWord.length < 3) {
      return;
    }
    socket.emit("game:blind-guess-the-word", {
      roomId,
      playerEmail: session.user.email,
      guessWord: sanitizedGuessWord,
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
      {isHost && <Button variant="danger" size="lg" onClick={voteRequest}>Vote Board</Button>}
      <Modal isOpen={voteModal} dismissible={false} onClose={() => setVoteModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-mint text-2xl md:text-4xl text-center font-bold">
            {!winStatus ? "Vote Board" : "Game Results"}
          </h2>
          <div className="flex flex-col gap-2">
            {winStatus === null ? (
              <>
                <ol className="flex flex-col gap-4 border-t border-zinc-300 py-4">
                  {gameData?.players?.map((player: PlayerWithRole) => (
                    <li key={player.playerEmail} className="grid grid-cols-3 items-center gap-4">
                      <strong className={`font-fredoka capitalize text-base md:text-2xl text-nowrap text-ellipsis overflow-hidden ${player.isAlive ? 'text-white' : 'text-zinc-500 line-through'}`}>
                        {player.playerName}
                      </strong>
                      <ul className={player.voters && player.voters?.length > 0 ? '' : 'h-0 overflow-hidden'}>
                        {player.voters?.map((voter, index) => (
                          <li key={index} className="text-xs md:text-base text-white">
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
                    <Button variant="danger" size="md" disabled={!allVoted} onClick={submitVote} className="w-full">Submit Vote</Button>
                    <Button variant="warning" size="md" onClick={voteRequest} className="w-full">Reload Vote</Button>
                  </div>
                )}
              </>
            ) : winStatus !== "none" ? (
              <>
                {winStatus === "The ROGUE Got Caught" ? (
                  <>
                    <p className="text-lg md:text-xl text-center font-bold">
                      {playerRole === "blind" ? "You got caught!" : "The ROGUE got caught!"}
                    </p>
                    {!isHost && playerRole === "blind" && (
                      <Button variant="primary" size="md" onClick={openGuessWordModal} className="w-full">
                        Guess the word
                      </Button>
                    )}
                    {isHost && playerRole !== "blind" && (
                      <div className="flex justify-between gap-4">
                        <RestartBtn isHost={isHost} />
                        <Button variant="primary" size="md" onClick={openGuessWordModal} className="w-full">
                          Ask to guess the word
                        </Button>
                      </div>
                    )}
                  </>
                ) : winStatus === "The ROGUE Eliminated" || winStatus === "The MORF Eliminated" || winStatus === "The Vote is Tied" ? (
                  <>
                    <p className="text-2xl md:text-4xl text-center font-fredoka font-bold mx-auto">
                      No winner yet!
                      <br />
                      {winStatus}!
                    </p>
                    <ul className="flex flex-col gap-2 justify-center items-center list-decimal pl-4">
                      {gameData?.players?.filter((player: PlayerWithRole) => !player.isAlive).map((player: PlayerWithRole) => (
                        <li key={player.playerEmail} className="text-white">
                          <strong className="font-semibold">{player.playerName}</strong> Eliminated
                        </li>
                      ))}
                    </ul>
                    {isHost && (
                      <div className="flex justify-between gap-4">
                        <RestartBtn isHost={isHost} />
                        <Button variant="primary" size="md" onClick={continueGame} className="w-full max-w-sm mx-auto">Continue</Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xl md:text-2xl text-center text-white font-fredoka font-bold">
                      The winner is the
                      {' '}
                      <span className="capitalize">{winStatus}!</span>
                    </p>
                    <div className="flex justify-center items-center">
                      <Image src={winStatusImage(winStatus)} alt="Win Status" priority width={0} height={0} sizes="100vw" className="w-40 h-auto md:w-60 md:h-auto" />
                    </div>
                    {superpowerTriggered && (
                      <p className="text-lg md:text-xl text-center text-danger max-w-3xs mx-auto">
                        {superpowerTriggered}
                      </p>
                    )}
                    <p className="text-sm md:text-base text-center leading-relaxed">
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
                <p className="text-2xl md:text-4xl text-center font-fredoka font-bold mx-auto">
                  No winner yet!
                  <br />
                  Agent got eliminated!
                </p>
                {superpowerTriggered && (
                  <p className="text-lg md:text-xl text-center text-danger max-w-3xs mx-auto">
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
                  <div className="flex justify-between gap-4">
                    <RestartBtn isHost={isHost} />
                    <Button variant="primary" size="md" onClick={continueGame} className="w-full max-w-sm mx-auto">Continue</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
      <Modal isOpen={guessWordModal} dismissible={false} onClose={() => setGuessWordModal(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-bold">Guess the Word</h2>
          <p>You got caught! Guess the word correctly to win the game.</p>
          <div className="flex flex-col gap-4">
            <Input value={guessWord} onChange={(e) => setGuessWord(e.target.value)} inputClassName="text-center uppercase"/>
            <Button variant="primary" size="md" onClick={submitGuessWord}>Guess</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={passivePowerConfirmModal.isOpen} dismissible={false} onClose={() => setPassivePowerConfirmModal({ isOpen: false, type: null })}>
        <div className="flex flex-col gap-4">
          <h2 className="text-warning text-xl md:text-4xl text-center font-bold">WARNING!</h2>
          <p className="text-base md:text-2xl text-center">
            {passivePowerConfirmModal.type === 'chief' && `The vote result is tied, You are the Chief, will you use your ${playerSuperpower?.name.toUpperCase()} skill?`}
            {passivePowerConfirmModal.type === 'briber' && `You get two or more elimination votes, will you use your ${playerSuperpower?.name.toUpperCase()} skill?`}
            {passivePowerConfirmModal.type === 'saboteur' && `You are the Saboteur, will you use your ${playerSuperpower?.name.toUpperCase()} skill?`}
          </p>
          <div className="flex justify-between gap-4">
            <Button
              variant="warning"
              size="md"
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