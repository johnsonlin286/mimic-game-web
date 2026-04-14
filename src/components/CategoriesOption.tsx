import { useEffect, useId, useState } from "react";
import { Socket } from "socket.io-client";

interface CategoriesOptionProps {
  socket: Socket;
  lang: string;
  selected?: string;
  onChange: (value: string) => void;
}

export default function CategoriesOption({ lang = "en", socket, selected, onChange }: CategoriesOptionProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const groupName = useId();

  useEffect(() => {
    if (!socket) return;

    setCategories([]);

    const isEnglish = lang === "en";
    const emitEvent = isEnglish ? "utils:categories-options-en" : "utils:categories-options-id";
    const listenEvent = isEnglish ? "listen-fetch-categories-options-en" : "listen-fetch-categories-options-id";

    socket
      .emit(emitEvent)
      .once(listenEvent, (response: { data?: { categories?: string[] } }) => {
        setCategories(response?.data?.categories ?? []);
      });
  }, [socket, lang]);

  return (
    <div className="flex gap-2 w-full max-w-full overflow-auto pb-3">
      {categories.map((category) => {
        const checked = selected === category;
        return (
          <label
            key={category}
            className={[
              "shrink-0 flex justify-center items-center w-3/12 rounded-lg p-3 text-center select-none cursor-pointer",
              "border transition-colors",
              checked ? "bg-sky-500 text-white border-sky-500" : "bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-zinc-300",
            ].join(" ")}
          >
            <input
              type="radio"
              name={groupName}
              value={category}
              checked={checked}
              onChange={() => onChange(category)}
              className="sr-only"
            />
            {category}
          </label>
        );
      })}
    </div>
  )
}