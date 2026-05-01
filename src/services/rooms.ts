import { API_URL, FETCH_ALL_ROOMS, FETCH_ROOM, POST_SEARCH_ROOM } from './url';

export const fetchAllRooms = async (): Promise<RoomResponseData[]> => {
  const response = await fetch(`${API_URL}${FETCH_ALL_ROOMS}`);
  const data = await response.json();
  return data.data;
}

export const fetchRoom = async (roomId: string): Promise<RoomResponseData | ErrorResponse> => {
  const response = await fetch(`${API_URL}${FETCH_ROOM}/${roomId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data.data;
}

export const searchRoom = async (roomId: string): Promise<RoomResponseData | ErrorResponse> => {
  const response = await fetch(`${API_URL}${POST_SEARCH_ROOM}`, {
    method: 'POST',
    body: JSON.stringify({ roomId }),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data.data;
}