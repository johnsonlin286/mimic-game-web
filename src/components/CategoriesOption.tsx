import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

import SelectInput from "./SelectInput";
interface CategoriesOptionProps {
  socket: Socket;
  lang: string;
  selected?: string;
  onChange: (value: string) => void;
}

interface CategoriesType {
  id: string;
  label: string;
}

export default function CategoriesOption({ lang = "en", socket, selected, onChange }: CategoriesOptionProps) {
  const [categories, setCategories] = useState<CategoriesType[]>([]);

  useEffect(() => {
    if (!socket) return;

    setCategories([]);

    const isEnglish = lang === "en";
    const emitEvent = isEnglish ? "utils:categories-options-en" : "utils:categories-options-id";
    const listenEvent = isEnglish ? "listen-fetch-categories-options-en" : "listen-fetch-categories-options-id";

    socket
      .emit(emitEvent)
      .once(listenEvent, (response: { data?: { categories?: CategoriesType[] } }) => {
        console.log("listen-fetch-categories-options", response);
        setCategories(response.data?.categories || []);
      });
  }, [socket, lang]);

  return (
    <SelectInput label="Categories" options={categories.map((category) => ({ label: category.label, value: category.id }))} value={selected || ""} onChange={onChange} className="w-full" />
  )
}