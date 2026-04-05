"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
  autoConnect: false,
});

export default function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  useEffect(() => {
    if (!session) {
      socket.disconnect();
    }
  }, [session]);

  const socketConnect = () => {
    if (!session) return;
    socket?.connect();
  };

  const socketDisconnect = () => {
    if (!session) return;
    socket?.disconnect();
  };

  return { isConnected, socketConnect, socketDisconnect };
}