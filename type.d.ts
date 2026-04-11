interface RoomCreatePayload {
  playerName: string;
  creatorEmail: string;
  roomName: string;
  roomMaxPlayers: number;
  roomPin: string;
}

interface RoomResponseData {
  creatorEmail: string;
  roomDisplayName: string;
  roomId: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
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
  roomPin: string;
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
  roomId: string;
  roomDisplayName: string;
  setRoom: (room: RoomState) => void;
  resetRoom: () => void;
}

interface AllRoomsResponse {
  success: boolean;
  data: RoomData[];
}

interface RoomPlayerData {
  socketId: string;
  playerEmail: string;
  role: string;
}

interface RoomData {
  creatorEmail: string;
  roomDisplayName: string;
  roomId: string;
  roomMaxPlayers: number;
  roomPin: string;
  roomPlayers: RoomPlayerData[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoomInfo {
  roomId: string;
  roomDisplayName: string;
  roomMaxPlayers: number;
  roomPlayers: RoomPlayerData[];
  createdAt: Date;
  updatedAt: Date;
}