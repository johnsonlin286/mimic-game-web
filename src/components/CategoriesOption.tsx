import { useEffect, useId, useState } from "react";
import { Socket } from "socket.io-client";

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
  const groupName = useId();

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
    <div className="flex gap-2 w-full max-w-full overflow-auto pb-3">
      {categories.map((category) => {
        const checked = selected === category.id;
        return (
          <label
            key={category.id}
            className={[
              "shrink-0 flex justify-center items-center w-3/12 rounded-lg p-3 text-center select-none cursor-pointer",
              "border transition-colors",
              checked ? "bg-sky-500 text-white border-sky-500" : "bg-zinc-200 text-zinc-900 border-zinc-300 hover:bg-zinc-300",
            ].join(" ")}
          >
            <input
              type="radio"
              name={groupName}
              value={category.id}
              checked={checked}
              onChange={() => onChange(category.id)}
              className="sr-only"
            />
            {category.label}
          </label>
        );
      })}
    </div>
  )
}