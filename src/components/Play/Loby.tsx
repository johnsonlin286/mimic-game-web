"use client";

import { Crown, Wrench } from "lucide-react";
import type { Socket } from "socket.io-client";

import Panel from "@/components/Panel";
import LabelPill from "@/components/LabelPill";
import Container from "@/components/Container";
import CopyInput from "@/components/CopyInput";
import SwitchInput from "@/components/SwitchInput";
import SelectLanguages from "@/components/SelectLanguages";
import CategoriesOption from "@/components/CategoriesOption";
import Modal from "@/components/Modal";
import Button from "@/components/Button";

type SetupKey = keyof Partial<GameRule>;

interface PlayLobyProps {
  roomId: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
  roomData: RoomInfo | null;

  isHost: boolean;
  sessionEmail?: string | null;

  gameSetupData: Partial<GameRule> | null;
  setupFormData: Partial<GameRule>;

  socket: Socket;

  gameSetupModalOpen: boolean;
  setGameSetupModalOpen: (open: boolean) => void;

  onLeave: () => void;
  onKickPlayer: (targetSocketId: string, targetPlayerEmail: string) => void;
  onSetupChange: (key: SetupKey, value: unknown) => void;
  onSaveSetup: () => void;
}

export default function PlayLoby({
  roomId,
  roomMaxPlayers,
  roomPlayers,
  roomData,
  isHost,
  sessionEmail,
  gameSetupData,
  setupFormData,
  socket,
  gameSetupModalOpen,
  setGameSetupModalOpen,
  onLeave,
  onKickPlayer,
  onSetupChange,
  onSaveSetup,
}: PlayLobyProps) {
  const playerCount = roomData?.roomPlayers?.length ?? roomPlayers.length;
  const mimicCount = playerCount >= 9 ? 3 : playerCount >= 7 ? 2 : 1;
  const voidCount = playerCount >= 11 ? 2 : playerCount >= 5 ? 1 : 0;
  const statusVariant =
    roomData?.gameRule.status === "waiting"
      ? "warning"
      : roomData?.gameRule.status === "ready"
        ? "success"
        : "neutral";

  return (
    <Container className="py-4">
      <Panel collapsible title="Room Information" className="flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-zinc-500">
              <strong className="font-bold">Room ID:</strong> {roomId}
            </p>
            <p className="text-sm text-zinc-500">
              <strong className="font-bold">Players:</strong> {roomPlayers.length} / {roomMaxPlayers}
              <LabelPill
                variant={statusVariant}
                className="ml-2"
              />
            </p>
          </div>
          <Button variant="danger" onClick={onLeave}>Leave Room</Button>
        </div>
        {isHost && (
          <CopyInput label="Invite Link" value={`${process.env.NEXT_PUBLIC_BASE_URL}/join/${roomId}`} />
        )}
      </Panel>

      <Panel collapsible title="Game Setup" className="flex flex-col">
        {gameSetupData && (
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col">
              <p className={`flex items-center gap-2 ${gameSetupData.roles?.mimic ? "opacity-100" : "opacity-30"}`}>
                <strong>The Mimic:</strong>
                <strong>{mimicCount}</strong>
              </p>
              <p className={`flex items-center gap-2 ${gameSetupData.roles?.void ? "opacity-100" : "opacity-20"}`}>
                <strong>The Void:</strong>
                <strong>{voidCount}</strong>
              </p>
              <p className="flex items-center gap-2">
                <strong>Language:</strong>
                <strong>{gameSetupData.language === "en" ? "English" : "Indonesian"}</strong>
              </p>
              <p className="flex items-center gap-2">
                <strong>Category:</strong>
                <strong>{gameSetupData.category}</strong>
              </p>
            </div>
            <div>
              {isHost && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setGameSetupModalOpen(true)}
                  className="flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </Panel>

      <Panel collapsible title="Players">
        <ul className="flex flex-col gap-2">
          {roomData?.roomPlayers.map((player, index) => (
            <li key={index} className="flex items-center justify-between gap-2 not-last:border-b border-zinc-200 pb-2">
              <strong className="font-bold flex items-center gap-2">
                {player.playerName}
                {player.role === "host" && <Crown />}
              </strong>
              {isHost && player.playerEmail !== sessionEmail && (
                <Button size="sm" variant="danger" onClick={() => onKickPlayer(player.socketId, player.playerEmail)}>
                  Kick Player
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      {isHost && (
        <Button
          variant="success"
          size="lg"
          disabled={roomData?.gameRule.status === "ready" ? false : true}
          onClick={() => null}
          className="w-full"
        >
          Start Game
        </Button>
      )}

      <Modal isOpen={gameSetupModalOpen} onClose={() => setGameSetupModalOpen(false)}>
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Game Setup</h2>
          <div className="flex flex-col gap-1">
            <SwitchInput
              label="The Mimic"
              checked={roomData?.gameRule.roles.mimic || false}
              disabled
              onCheckedChange={(value) => onSetupChange("roles", { mimic: value })}
            />
            <small className="text-zinc-500">The Mimic is who get different word than other players.</small>
            <SwitchInput
              label="The Void"
              checked={roomData?.gameRule.roles.void || false}
              disabled={roomData?.roomPlayers?.length ? roomData.roomPlayers.length < 5 : false}
              onCheckedChange={(value) => onSetupChange("roles", { void: value })}
            />
            <small className="text-zinc-500">The Void is who not get any word.</small>
          </div>
          <SelectLanguages socket={socket} value={setupFormData.language} onChange={(value) => onSetupChange("language", value)} />
          <h3 className="text-lg font-bold">Categories</h3>
          <CategoriesOption
            socket={socket}
            lang={setupFormData.language || "en"}
            selected={setupFormData.category}
            onChange={(value) => onSetupChange("category", value)}
          />
          <div className="flex justify-end gap-2 w-full">
            <Button variant="primary" size="sm" onClick={onSaveSetup} className="w-full max-w-40">Save</Button>
          </div>
        </div>
      </Modal>

      <pre>{JSON.stringify(roomData, null, 2)}</pre>
    </Container>
  );
}