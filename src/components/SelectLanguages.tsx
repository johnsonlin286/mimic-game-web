"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

import SelectInput from "./SelectInput";

interface SelectLanguagesProps {
  socket: Socket;
  value?: string;
  onChange: (value: string) => void;
}

export default function SelectLanguages({ socket, value, onChange }: SelectLanguagesProps) {
  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  useEffect(() => {
    if (!socket) return
    socket.emit("utils:language-options")
      .once("listen-fetch-language-options", (response: LanguageOptionResponse) => {
        setLanguages(response.data.languages);
      });
  }, [socket]);

  return (
    <SelectInput label="Language" options={languages} value={value || ""} onChange={onChange} />
  )
}