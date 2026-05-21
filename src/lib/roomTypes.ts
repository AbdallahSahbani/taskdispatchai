// Room type code list (hospitality industry standard codes)
export interface RoomTypeDef {
  code: string;
  name: string;
  beds: string;
  maxOccupancy: number;
  baseRate: number;
}

export const ROOM_TYPES: RoomTypeDef[] = [
  { code: 'SKG', name: 'Standard King',        beds: '1 King',          maxOccupancy: 2, baseRate: 189 },
  { code: 'SQN', name: 'Standard Queen',       beds: '1 Queen',         maxOccupancy: 2, baseRate: 169 },
  { code: 'DQQ', name: 'Double Queen',         beds: '2 Queen',         maxOccupancy: 4, baseRate: 209 },
  { code: 'DDB', name: 'Double Double',        beds: '2 Double',        maxOccupancy: 4, baseRate: 179 },
  { code: 'DLK', name: 'Deluxe King',          beds: '1 King',          maxOccupancy: 2, baseRate: 249 },
  { code: 'JST', name: 'Junior Suite',         beds: '1 King + Sofa',   maxOccupancy: 3, baseRate: 329 },
  { code: 'EXS', name: 'Executive Suite',      beds: '1 King + Living', maxOccupancy: 4, baseRate: 489 },
  { code: 'PRS', name: 'Presidential Suite',   beds: '1 King + Parlor', maxOccupancy: 4, baseRate: 1290 },
  { code: 'ACC', name: 'Accessible King',      beds: '1 King (ADA)',    maxOccupancy: 2, baseRate: 189 },
  { code: 'CNT', name: 'Connecting Queens',    beds: '2 Queen x2 rms',  maxOccupancy: 6, baseRate: 379 },
];

export const getRoomType = (code: string) => ROOM_TYPES.find(r => r.code === code);
