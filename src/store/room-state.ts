import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomId: "",
      creatorEmail: "",
      roomMaxPlayers: 0,
      roomPlayers: [],
      gameRule: {
        roles: {
          mimic: true,
          void: false,
        },
        category: "",
        language: "en",
        status: "waiting",
      },
      gameData: {
        players: [],
      },
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      setRoom: (room: Partial<RoomResponseData>) => set(() => ({
        roomId: room.roomId,
        creatorEmail: room.creatorEmail,
        roomMaxPlayers: room.roomMaxPlayers,
        roomPlayers: room.roomPlayers,
        gameRule: room.gameRule,
        gameData: room.gameData,
        isPublic: room.isPublic,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      })),
      resetRoom: () => set({ roomId: "" }),
    }),
    { name: "room-state" }
  )
);