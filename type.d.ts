interface RoomCreatePayload {
  playerName: string;
  creatorEmail: string;
  roomMaxPlayers: number;
  isPublic: boolean;
}

interface GameRule {
  roles: {
    mimic: boolean;
    void: boolean;
  }
  category: string;
  language: string;
  status: "waiting" | "ready" | "playing" | "finished";
}

interface RoomResponseData {
  creatorEmail: string;
  roomId: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
  gameRule: GameRule;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomCreateResponse {
  success: boolean;
  message: string;
  data: RoomResponseData;
}

interface RoomJoinPayload {
  roomId: string;
  playerEmail: string;
  playerName: string;
}

interface RoomJoinResponse {
  success: boolean;
  message: string;
  data: RoomResponseData;
}

interface RoomRejoinResponse {
  success: boolean;
  message: string;
  data: RoomResponseData;
}

interface RoomLeavePayload {
  roomId: string;
  socketId: string;
}

interface RoomLeaveResponse {
  success: boolean;
  message: string;
  data: {
    roomId: string;
    players: {
      playerEmail: string;
      role: string;
    }[];
  };
}

interface RoomKickPlayerPayload {
  roomId: string;
  socketId: string;
  playerEmail: string;
}

interface RoomKickPlayerResponse {
  success: boolean;
  message: string;
  data: {
    room: RoomInfo;
  }
}

interface RoomHostLeftResponse {
  success: boolean;
  message: string;
  data: {
    roomId: string;
    players: {
      playerEmail: string;
      role: string;
    }[];
  };
}

interface RoomState {
  creatorEmail: string;
  roomId: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
  gameRule: GameRule;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  setRoom: (room: RoomResponseData) => void;
  resetRoom: () => void;
}

interface AllRoomsResponse {
  success: boolean;
  data: RoomData[];
}

interface RoomPlayerData {
  socketId: string;
  playerEmail: string;
  playerName: string;
  role: string;
}

interface RoomData {
  creatorEmail: string;
  roomId: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
  gameRule: GameRule;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomInfo {
  roomId: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
  gameRule: GameRule;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}