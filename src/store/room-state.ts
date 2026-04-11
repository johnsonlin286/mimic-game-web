import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomId: "",
      roomDisplayName: "",
      setRoom: (room: RoomState) => set(() => ({ roomId: room.roomId, roomDisplayName: room.roomDisplayName })),
      resetRoom: () => set({ roomId: "", roomDisplayName: "" }),
    }),
    { name: "room-state" }
  )
);