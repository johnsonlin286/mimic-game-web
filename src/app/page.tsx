"use client";

import { useEffect } from "react";
import useSocket from "@/hooks/useSocket";

export default function Home() {
  const { isConnected, socketConnect, socketDisconnect } = useSocket();

  useEffect(() => {
    console.log(isConnected);
  }, [isConnected]);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <button onClick={socketConnect}>Connect</button>
        <button onClick={socketDisconnect}>Disconnect</button>
      </main>
    </div>
  );
}
