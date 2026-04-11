import { API_URL, FETCH_ALL_ROOMS } from './url';

export const fetchAllRooms = async (): Promise<RoomResponseData[]> => {
  const response = await fetch(`${API_URL}${FETCH_ALL_ROOMS}`);
  const data = await response.json();
  return data.data;
}