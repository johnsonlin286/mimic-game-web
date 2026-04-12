"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";

let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io(process.env.NEXT_PUBLIC_API_URL!, {
      autoConnect: false,
    });
  }
  return socketSingleton;
}

export default function useSocket() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      getSocket().disconnect();
    }
  }, [session, router]);

  const socketConnect = useCallback(() => {
    if (!session) return;
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }, [session]);

  const socketDisconnect = useCallback(() => {
    if (!session) return;
    const socket = getSocket();
    if (socket.connected) {
      socket.disconnect();
    }
  }, [session]);

  return {
    socket: getSocket(),
    isConnected,
    socketConnect,
    socketDisconnect,
  };
}
