"use client";

import { useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useRoomStore } from "@/store/room-state";
import { useToastStore } from "@/store/toast-state";
import useSocket, { getSocket } from "@/hooks/useSocket";
import Container from "@/components/Container";
import RoomStatus from "@/components/Play/RoomStatus";
import PlayLobby from "@/components/Play/Lobby";
import PlayGame from "@/components/Play/Game";

import { onSound, offSound, startSound, playSfx } from '@/utils/sounds';

let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

export default function PlayPage() {
  const hasRejoinedRef = useRef(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { socket, isConnected, socketConnect } = useSocket();
  const { roomId, roomPlayers, gameRule, setRoom, resetRoom } = useRoomStore();
  const { setToast } = useToastStore();

  const isHost = useMemo(() => {
    if (!roomPlayers) return
    return roomPlayers.find((p) => p.playerEmail === session?.user?.email)?.role === "host";
  }, [roomPlayers, session?.user?.email]);

  // Prevent the screen from sleeping during gameplay.
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (error) {
        console.error('Failed to request wake lock', error);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wakeLock?.release();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Reconnect socket and re-join room when the tab becomes visible again.
    const handleAwake = () => {
      if (document.visibilityState !== 'visible') return;
      if (!socket.connected) socketConnect();
      socket.emit("room:rejoin", {
        roomId,
        socketId: socket.id,
        playerEmail: session?.user?.email,
      })
        .once("room-rejoin-success", (response: RoomRejoinResponse) => {
          // setRoom(response.data.room);
        })
        .once("room-rejoin-not-found", () => {
          resetRoom();
          router.push("/");
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onJoinSuccess = (response: any) => {
      const { player: { playerEmail, playerName }, room } = response.data;
      setRoom(room);
      setToast(
        playerEmail === session?.user?.email
          ? "You have joined the room"
          : `${playerName} has joined the room`,
        "success"
      );
      playSfx(onSound);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onLeaveSuccess = (response: any) => {
      const { player: { playerName }, room } = response.data;
      setRoom(room);
      setToast(`${playerName} has left the room`, "warning");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onHostLeft = (response: any) => {
      setRoom(response.data.room);
      setToast("The host has left the room", "warning");
    };

    const onKickedPlayer = () => {
      playSfx(offSound);
      resetRoom();
      router.push("/");
      setToast("You have been kicked from the room", "warning");
    };

    const onKickPlayer = (response: RoomKickPlayerResponse) => {
      setRoom(response.data.room);
      setToast(response.message, "warning");
    };

    const onGameStartSuccess = (response: GameStartResponse) => {
      setRoom(response.data);
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onGameInitializeSuccess = (response: any) => {
      setRoom(response.data);
      playSfx(startSound);
    };

    const onGameRestartSuccess = () => {
      playSfx(offSound);
    };

    document.addEventListener('visibilitychange', handleAwake);
    socket.on("listen-room-join-success", onJoinSuccess);
    socket.on("listen-room-leave-success", onLeaveSuccess);
    socket.on("listen-room-host-left", onHostLeft);
    socket.on("listen-room-kicked-player", onKickedPlayer);
    socket.on("listen-room-kick-player", onKickPlayer);
    socket.on("listen-game-start-success", onGameStartSuccess);
    socket.on("listen-game-initialize-success", onGameInitializeSuccess);
    socket.on("listen-game-restart-success", onGameRestartSuccess);

    return () => {
      document.removeEventListener('visibilitychange', handleAwake);
      socket.off("listen-room-join-success", onJoinSuccess);
      socket.off("listen-room-leave-success", onLeaveSuccess);
      socket.off("listen-room-host-left", onHostLeft);
      socket.off("listen-room-kicked-player", onKickedPlayer);
      socket.off("listen-room-kick-player", onKickPlayer);
      socket.off("listen-game-start-success", onGameStartSuccess);
      socket.off("listen-game-initialize-success", onGameInitializeSuccess);
      socket.off("listen-game-restart-success", onGameRestartSuccess);
    };
  }, [socket, roomId, session, router, socketConnect, setRoom, resetRoom, setToast]);

  useEffect(() => {
    hasRejoinedRef.current = false;
  }, [roomId]);

  // Emit room:leave and disconnect when navigating away from the page.
  useEffect(() => {
    if (pendingDisconnectTimer) {
      clearTimeout(pendingDisconnectTimer);
      pendingDisconnectTimer = null;
    }

    return () => {
      pendingDisconnectTimer = setTimeout(() => {
        const sock = getSocket();
        const currentRoomId = useRoomStore.getState().roomId;
        if (sock.connected && sock.id && currentRoomId) {
          sock.emit("room:leave", { roomId: currentRoomId, socketId: sock.id, leaveRoom: false });
        }
        resetRoom();
        sock.disconnect();
      }, 100);
    };
  }, [resetRoom]);

  // Initial rejoin on mount / reconnect.
  useEffect(() => {
    if (!session || !roomId || !socket) return;
    if (hasRejoinedRef.current) return;
    if (!isConnected) {
      socketConnect();
      return;
    }

    hasRejoinedRef.current = true;

    const onSuccess = (response: RoomRejoinResponse) => {
      // console.log(response);
      // setRoom(response.data.room);
      setToast("You have rejoined the room", "success");
    };

    const onNotFound = (response: RoomRejoinResponse) => {
      // console.log(response);
      resetRoom();
      router.push("/");
    };

    socket.emit("room:rejoin", {
      roomId,
      socketId: socket.id,
      playerEmail: session.user?.email,
    })
      .once("room-rejoin-success", onSuccess)
      .once("room-rejoin-not-found", onNotFound);
  }, [roomId, router, session, socket, isConnected, socketConnect, resetRoom, setToast, setRoom]);

  return (
    <Container className="py-4">
      <RoomStatus isHost={isHost ?? false} />
      {gameRule.status === "playing" ? (
        <PlayGame />
      ) : gameRule.status !== "finished" ? (
        <PlayLobby />
      ) : null}
    </Container>
  );
}
