import { useMemo } from 'react';
import type { SimulatedTask } from '@/stores/simulationStore';

// Room type visual config
const ROOM_STYLES: Record<string, { stroke: string; fill: string; labelFill: string }> = {
  elevator: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.2)', labelFill: '#f59e0b' },
  stairs: { stroke: '#34d399', fill: 'rgba(52,211,153,0.15)', labelFill: '#34d399' },
  storage: { stroke: '#94a3b8', fill: 'rgba(148,163,184,0.15)', labelFill: '#94a3b8' },
  toilet: { stroke: '#c084fc', fill: 'rgba(192,132,252,0.15)', labelFill: '#c084fc' },
  pool: { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.25)', labelFill: '#06b6d4' },
  spa: { stroke: '#f472b6', fill: 'rgba(244,114,182,0.2)', labelFill: '#f472b6' },
  gym: { stroke: '#fb923c', fill: 'rgba(251,146,60,0.2)', labelFill: '#fb923c' },
  restaurant: { stroke: '#86efac', fill: 'rgba(134,239,172,0.18)', labelFill: '#86efac' },
  bar: { stroke: '#fbbf24', fill: 'rgba(251,191,36,0.18)', labelFill: '#fbbf24' },
  coffee: { stroke: '#d97706', fill: 'rgba(161,98,7,0.25)', labelFill: '#fbbf24' },
  buffet: { stroke: '#4ade80', fill: 'rgba(74,222,128,0.18)', labelFill: '#4ade80' },
  lobby: { stroke: '#60a5fa', fill: 'rgba(96,165,250,0.18)', labelFill: '#60a5fa' },
  reception: { stroke: '#f0c040', fill: 'rgba(240,192,64,0.18)', labelFill: '#f0c040' },
  guestroom: { stroke: '#2a8de8', fill: 'rgba(26,110,196,0.12)', labelFill: '#7dd3fc' },
  suite: { stroke: '#f0c040', fill: 'rgba(240,192,64,0.12)', labelFill: '#f0c040' },
  corridor: { stroke: '#0d4a8c', fill: 'rgba(10,37,64,0.5)', labelFill: '#4a7aa0' },
  mechanical: { stroke: '#475569', fill: 'rgba(71,85,105,0.2)', labelFill: '#64748b' },
  office: { stroke: '#7dd3fc', fill: 'rgba(125,211,252,0.12)', labelFill: '#7dd3fc' },
  terrace: { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.1)', labelFill: '#06b6d4' },
};

interface Room {
  x: number; y: number; w: number; h: number;
  type: string; label: string; sublabel: string;
}

interface FloorDef {
  num: string; name: string; desc: string; tag: string;
  rooms: Room[];
}

const PAD = 30;
const W = 1100;

// ============ FLOOR DATA ============
export const FLOOR_DATA: FloorDef[] = [
  // B1 - Basement
  {
    num: 'B1', name: 'Basement Level', desc: 'MECHANICAL / PARKING / STAFF', tag: 'BASEMENT',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: 'ELEVATOR' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: 'ELEVATOR' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: 'ELEVATOR' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: 'ELEVATOR' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: 'STAIRWELL' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: 'STAIRWELL' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: 'STAIRWELL' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: 'STAIRWELL' },
      { x: 50, y: 100, w: 130, h: 160, type: 'mechanical', label: 'MECH-1', sublabel: 'BOILER ROOM' },
      { x: 50, y: 280, w: 130, h: 120, type: 'mechanical', label: 'MECH-2', sublabel: 'HVAC' },
      { x: 50, y: 420, w: 130, h: 100, type: 'mechanical', label: 'MECH-3', sublabel: 'ELECTRICAL' },
      { x: 50, y: 540, w: 130, h: 110, type: 'mechanical', label: 'MECH-4', sublabel: 'WATER PLANT' },
      { x: 200, y: 160, w: 680, h: 300, type: 'corridor', label: 'PARKING ZONE A', sublabel: '40 SPACES' },
      { x: 200, y: 480, w: 140, h: 120, type: 'storage', label: 'ST-1', sublabel: 'LINEN STORAGE' },
      { x: 360, y: 480, w: 140, h: 120, type: 'storage', label: 'ST-2', sublabel: 'F&B STORAGE' },
      { x: 520, y: 480, w: 140, h: 120, type: 'storage', label: 'ST-3', sublabel: 'EQUIP STORE' },
      { x: 680, y: 480, w: 130, h: 120, type: 'storage', label: 'ST-4', sublabel: 'WINE CELLAR' },
      { x: 830, y: 160, w: 200, h: 100, type: 'office', label: 'STAFF ROOM', sublabel: 'LOCKER ROOM' },
      { x: 830, y: 280, w: 200, h: 100, type: 'office', label: 'MANAGER', sublabel: 'CHIEF ENGINEER' },
      { x: 830, y: 400, w: 200, h: 80, type: 'toilet', label: 'WC-B1', sublabel: 'STAFF WC' },
      { x: 830, y: 500, w: 200, h: 100, type: 'storage', label: 'ST-5', sublabel: 'GENERAL STORE' },
      { x: 200, y: 620, w: 200, h: 50, type: 'mechanical', label: 'LOADING DOCK', sublabel: 'DELIVERY' },
      { x: 420, y: 620, w: 180, h: 50, type: 'storage', label: 'LAUNDRY', sublabel: 'COMMERCIAL' },
    ],
  },
  // G - Ground Floor
  {
    num: 'G', name: 'Ground Floor — Lobby & Dining', desc: 'RECEPTION / COFFEE / RESTAURANT / BAR', tag: 'GROUND',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: 'ELEVATOR' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: 'ELEVATOR' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: 'ELEVATOR' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: 'ELEVATOR' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: 'STAIRWELL' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: 'STAIRWELL' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: 'STAIRWELL' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: 'STAIRWELL' },
      { x: 350, y: 140, w: 440, h: 220, type: 'lobby', label: 'GRAND LOBBY', sublabel: 'MAIN ENTRANCE' },
      { x: 440, y: 140, w: 260, h: 60, type: 'reception', label: 'RECEPTION', sublabel: 'CHECK-IN / OUT' },
      { x: 440, y: 220, w: 120, h: 60, type: 'reception', label: 'CONCIERGE', sublabel: '' },
      { x: 580, y: 220, w: 100, h: 60, type: 'office', label: 'BELL DESK', sublabel: 'LUGGAGE' },
      { x: 350, y: 300, w: 200, h: 80, type: 'lobby', label: 'LOBBY LOUNGE', sublabel: 'SEATING' },
      { x: 50, y: 140, w: 200, h: 140, type: 'coffee', label: 'COFFEE SHOP', sublabel: 'LE CAFÉ AZURE' },
      { x: 50, y: 300, w: 90, h: 60, type: 'storage', label: 'COFFEE ST.', sublabel: '' },
      { x: 160, y: 300, w: 90, h: 60, type: 'toilet', label: 'WC-G1', sublabel: '' },
      { x: 800, y: 140, w: 240, h: 300, type: 'restaurant', label: 'AZURE', sublabel: 'FINE DINING — 80' },
      { x: 570, y: 300, w: 210, h: 140, type: 'bar', label: 'BLUE BAR', sublabel: 'COCKTAIL LOUNGE' },
      { x: 350, y: 420, w: 100, h: 80, type: 'toilet', label: 'WC-M', sublabel: "MEN'S" },
      { x: 470, y: 420, w: 100, h: 80, type: 'toilet', label: 'WC-W', sublabel: "WOMEN'S" },
      { x: 590, y: 420, w: 80, h: 80, type: 'toilet', label: 'WC-A', sublabel: 'ACCESSIBLE' },
      { x: 50, y: 400, w: 160, h: 80, type: 'office', label: 'ADMIN', sublabel: 'MANAGEMENT' },
      { x: 50, y: 500, w: 100, h: 80, type: 'office', label: 'GM OFFICE', sublabel: '' },
      { x: 170, y: 500, w: 80, h: 80, type: 'storage', label: 'SAFE', sublabel: 'VALUABLES' },
      { x: 350, y: 530, w: 480, h: 20, type: 'corridor', label: 'MAIN CORRIDOR', sublabel: '' },
      { x: 700, y: 460, w: 180, h: 120, type: 'mechanical', label: 'KITCHEN', sublabel: 'MAIN KITCHEN' },
      { x: 690, y: 300, w: 90, h: 140, type: 'office', label: 'GIFT SHOP', sublabel: 'BOUTIQUE' },
      { x: 700, y: 600, w: 140, h: 70, type: 'pool', label: 'POOL ACCESS', sublabel: 'TO OUTDOOR' },
      { x: 350, y: 600, w: 120, h: 70, type: 'mechanical', label: 'SECURITY', sublabel: 'GUARD ROOM' },
      { x: 490, y: 600, w: 100, h: 70, type: 'storage', label: 'LUGGAGE', sublabel: 'STORAGE' },
    ],
  },
  // L1 - Amenities
  {
    num: 'L1', name: 'Level 1 — Wellness & Amenities', desc: 'SPA / GYM / BUFFET / MEETINGS', tag: 'AMENITIES',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: '' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: '' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: '' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: '' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: '' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: '' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: '' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: '' },
      { x: 50, y: 100, w: 380, h: 280, type: 'spa', label: 'AZURE SPA', sublabel: 'WELLNESS CENTER' },
      { x: 60, y: 110, w: 110, h: 80, type: 'spa', label: 'TREATMENT 1', sublabel: 'MASSAGE' },
      { x: 190, y: 110, w: 110, h: 80, type: 'spa', label: 'TREATMENT 2', sublabel: 'FACIAL' },
      { x: 60, y: 210, w: 110, h: 80, type: 'spa', label: 'HAMMAM', sublabel: 'TURKISH BATH' },
      { x: 190, y: 210, w: 110, h: 80, type: 'spa', label: 'SAUNA', sublabel: 'FINNISH' },
      { x: 320, y: 110, w: 100, h: 80, type: 'spa', label: 'STEAM', sublabel: '' },
      { x: 320, y: 210, w: 100, h: 80, type: 'spa', label: 'RELAX', sublabel: 'QUIET ROOM' },
      { x: 60, y: 310, w: 180, h: 60, type: 'reception', label: 'SPA RECEPTION', sublabel: '' },
      { x: 260, y: 310, w: 160, h: 60, type: 'toilet', label: 'SPA WC', sublabel: 'CHANGING' },
      { x: 50, y: 400, w: 380, h: 260, type: 'gym', label: 'FITNESS CENTER', sublabel: '200m²' },
      { x: 60, y: 410, w: 180, h: 120, type: 'gym', label: 'CARDIO', sublabel: 'TREADMILL / CYCLE' },
      { x: 260, y: 410, w: 160, h: 120, type: 'gym', label: 'WEIGHTS', sublabel: 'FREE WEIGHTS' },
      { x: 60, y: 550, w: 120, h: 100, type: 'gym', label: 'YOGA', sublabel: 'STUDIO' },
      { x: 200, y: 550, w: 120, h: 100, type: 'gym', label: 'PT STUDIO', sublabel: '' },
      { x: 340, y: 550, w: 80, h: 100, type: 'toilet', label: 'GYM WC', sublabel: 'SHOWERS' },
      { x: 460, y: 100, w: 580, h: 240, type: 'buffet', label: 'GRAND BUFFET', sublabel: '120 COVERS' },
      { x: 470, y: 110, w: 140, h: 80, type: 'buffet', label: 'HOT', sublabel: 'LIVE COOKING' },
      { x: 630, y: 110, w: 140, h: 80, type: 'buffet', label: 'COLD', sublabel: 'SALADS' },
      { x: 790, y: 110, w: 130, h: 80, type: 'buffet', label: 'PASTRY', sublabel: 'DESSERTS' },
      { x: 940, y: 110, w: 90, h: 80, type: 'buffet', label: 'JUICE', sublabel: '' },
      { x: 470, y: 210, w: 200, h: 120, type: 'buffet', label: 'DINING A', sublabel: '60 SEATS' },
      { x: 690, y: 210, w: 200, h: 120, type: 'buffet', label: 'DINING B', sublabel: '60 SEATS' },
      { x: 910, y: 210, w: 120, h: 120, type: 'mechanical', label: 'KITCHEN', sublabel: 'BOH' },
      { x: 460, y: 360, w: 200, h: 120, type: 'office', label: 'MEETING A', sublabel: '20 PAX' },
      { x: 680, y: 360, w: 180, h: 120, type: 'office', label: 'MEETING B', sublabel: '16 PAX' },
      { x: 880, y: 360, w: 160, h: 120, type: 'office', label: 'MEETING C', sublabel: '10 PAX' },
      { x: 460, y: 490, w: 580, h: 20, type: 'corridor', label: 'CORRIDOR L1', sublabel: '' },
      { x: 460, y: 520, w: 100, h: 80, type: 'toilet', label: 'WC-M', sublabel: '' },
      { x: 580, y: 520, w: 100, h: 80, type: 'toilet', label: 'WC-W', sublabel: '' },
      { x: 700, y: 520, w: 120, h: 80, type: 'storage', label: 'LINEN L1', sublabel: '' },
      { x: 840, y: 520, w: 100, h: 80, type: 'storage', label: 'EQUIP', sublabel: '' },
      { x: 960, y: 520, w: 80, h: 80, type: 'storage', label: 'CLEANING', sublabel: '' },
    ],
  },
  // L2 - Standard Guest Rooms
  {
    num: 'L2', name: 'Level 2 — Standard Guest Rooms', desc: '18 ROOMS / SERVICE CORE', tag: 'ROOMS',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: '' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: '' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: '' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: '' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: '' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: '' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: '' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: '' },
      { x: 420, y: 120, w: 220, h: 70, type: 'lobby', label: 'ELEVATOR LOBBY', sublabel: 'LEVEL 2' },
      { x: PAD + 10, y: 320, w: W - PAD * 2 - 20, h: 28, type: 'corridor', label: 'MAIN CORRIDOR — L2', sublabel: '' },
      // North wing rooms
      ...Array.from({ length: 9 }, (_, i) => ({
        x: 50 + i * 110, y: 140, w: 100, h: 170,
        type: 'guestroom' as const, label: `2${String(i + 1).padStart(2, '0')}`, sublabel: i % 3 === 0 ? 'STD DBL' : 'STD TWIN',
      })),
      // South wing rooms
      ...Array.from({ length: 9 }, (_, i) => ({
        x: 50 + i * 110, y: 360, w: 100, h: 170,
        type: 'guestroom' as const, label: `2${String(i + 10).padStart(2, '0')}`, sublabel: i % 4 === 0 ? 'SUP DBL' : 'STD TWIN',
      })),
      { x: 50, y: 555, w: 100, h: 80, type: 'storage', label: 'LINEN L2', sublabel: '' },
      { x: 170, y: 555, w: 80, h: 80, type: 'storage', label: 'ICE/VEND', sublabel: '' },
      { x: 270, y: 555, w: 80, h: 80, type: 'toilet', label: 'STAFF WC', sublabel: '' },
      { x: 870, y: 555, w: 100, h: 80, type: 'storage', label: 'LINEN E', sublabel: '' },
    ],
  },
  // L3 - Standard Guest Rooms
  {
    num: 'L3', name: 'Level 3 — Standard Guest Rooms', desc: '18 ROOMS / SERVICE CORE', tag: 'ROOMS',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: '' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: '' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: '' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: '' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: '' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: '' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: '' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: '' },
      { x: 420, y: 120, w: 220, h: 70, type: 'lobby', label: 'ELEVATOR LOBBY', sublabel: 'LEVEL 3' },
      { x: PAD + 10, y: 320, w: W - PAD * 2 - 20, h: 28, type: 'corridor', label: 'MAIN CORRIDOR — L3', sublabel: '' },
      ...Array.from({ length: 9 }, (_, i) => ({
        x: 50 + i * 110, y: 140, w: 100, h: 170,
        type: 'guestroom' as const, label: `3${String(i + 1).padStart(2, '0')}`, sublabel: i % 3 === 0 ? 'STD DBL' : 'STD TWIN',
      })),
      ...Array.from({ length: 9 }, (_, i) => ({
        x: 50 + i * 110, y: 360, w: 100, h: 170,
        type: 'guestroom' as const, label: `3${String(i + 10).padStart(2, '0')}`, sublabel: i % 4 === 0 ? 'SUP DBL' : 'STD TWIN',
      })),
      { x: 50, y: 555, w: 100, h: 80, type: 'storage', label: 'LINEN L3', sublabel: '' },
      { x: 170, y: 555, w: 80, h: 80, type: 'storage', label: 'ICE/VEND', sublabel: '' },
      { x: 270, y: 555, w: 80, h: 80, type: 'toilet', label: 'STAFF WC', sublabel: '' },
      { x: 870, y: 555, w: 100, h: 80, type: 'storage', label: 'LINEN E', sublabel: '' },
    ],
  },
  // L4 - Superior Rooms
  {
    num: 'L4', name: 'Level 4 — Superior Rooms', desc: '16 SUPERIOR ROOMS', tag: 'ROOMS',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: '' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: '' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: '' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: '' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: '' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: '' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: '' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: '' },
      { x: 420, y: 120, w: 220, h: 70, type: 'lobby', label: 'ELEVATOR LOBBY', sublabel: 'LEVEL 4' },
      { x: PAD + 10, y: 320, w: W - PAD * 2 - 20, h: 28, type: 'corridor', label: 'MAIN CORRIDOR — L4', sublabel: '' },
      ...Array.from({ length: 8 }, (_, i) => ({
        x: 50 + i * 125, y: 140, w: 115, h: 170,
        type: 'guestroom' as const, label: `4${String(i + 1).padStart(2, '0')}`, sublabel: 'SUPERIOR DBL',
      })),
      ...Array.from({ length: 8 }, (_, i) => ({
        x: 50 + i * 125, y: 360, w: 115, h: 170,
        type: 'guestroom' as const, label: `4${String(i + 9).padStart(2, '0')}`, sublabel: 'SUPERIOR DBL',
      })),
      { x: 50, y: 555, w: 120, h: 80, type: 'storage', label: 'LINEN L4', sublabel: '' },
      { x: 190, y: 555, w: 80, h: 80, type: 'storage', label: 'ICE/VEND', sublabel: '' },
      { x: 290, y: 555, w: 80, h: 80, type: 'toilet', label: 'STAFF WC', sublabel: '' },
      { x: 860, y: 555, w: 100, h: 80, type: 'storage', label: 'LINEN E', sublabel: '' },
    ],
  },
  // L5 - Deluxe Rooms
  {
    num: 'L5', name: 'Level 5 — Deluxe Rooms', desc: '14 DELUXE ROOMS', tag: 'ROOMS',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: '' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: '' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: '' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: '' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: '' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: '' },
      { x: 200, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-C', sublabel: '' },
      { x: 880, y: 580, w: 50, h: 70, type: 'stairs', label: 'ST-D', sublabel: '' },
      { x: 420, y: 120, w: 220, h: 70, type: 'lobby', label: 'ELEVATOR LOBBY', sublabel: 'LEVEL 5' },
      { x: PAD + 10, y: 320, w: W - PAD * 2 - 20, h: 28, type: 'corridor', label: 'MAIN CORRIDOR — L5', sublabel: '' },
      ...Array.from({ length: 7 }, (_, i) => ({
        x: 50 + i * 143, y: 130, w: 133, h: 180,
        type: 'guestroom' as const, label: `5${String(i + 1).padStart(2, '0')}`, sublabel: 'DELUXE DBL',
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        x: 50 + i * 143, y: 360, w: 133, h: 180,
        type: 'guestroom' as const, label: `5${String(i + 8).padStart(2, '0')}`, sublabel: 'DELUXE DBL',
      })),
      { x: 50, y: 565, w: 120, h: 80, type: 'storage', label: 'LINEN L5', sublabel: '' },
      { x: 200, y: 565, w: 80, h: 80, type: 'storage', label: 'ICE/VEND', sublabel: '' },
      { x: 300, y: 565, w: 80, h: 80, type: 'toilet', label: 'STAFF WC', sublabel: '' },
      { x: 860, y: 565, w: 100, h: 80, type: 'storage', label: 'LINEN E', sublabel: '' },
    ],
  },
  // L6 - Suites & Rooftop Pool
  {
    num: 'L6', name: 'Level 6 — Suites & Rooftop Pool', desc: '6 LUXURY SUITES / SKY BAR', tag: 'SUITES+POOL',
    rooms: [
      { x: 456, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-1', sublabel: '' },
      { x: 496, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-2', sublabel: '' },
      { x: 536, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-3', sublabel: '' },
      { x: 576, y: 56, w: 36, h: 44, type: 'elevator', label: 'EL-4', sublabel: '' },
      { x: 200, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-A', sublabel: '' },
      { x: 880, y: 56, w: 50, h: 70, type: 'stairs', label: 'ST-B', sublabel: '' },
      { x: 200, y: 540, w: 50, h: 60, type: 'stairs', label: 'ST-C', sublabel: '' },
      { x: 880, y: 540, w: 50, h: 60, type: 'stairs', label: 'ST-D', sublabel: '' },
      { x: 420, y: 120, w: 220, h: 70, type: 'lobby', label: 'PRIVATE LOBBY', sublabel: 'SUITE LEVEL' },
      { x: 50, y: 140, w: 200, h: 220, type: 'suite', label: '601', sublabel: 'PRESIDENTIAL' },
      { x: 270, y: 140, w: 170, h: 220, type: 'suite', label: '602', sublabel: 'GRAND SUITE' },
      { x: 660, y: 140, w: 170, h: 220, type: 'suite', label: '603', sublabel: 'GRAND SUITE' },
      { x: 850, y: 140, w: 190, h: 220, type: 'suite', label: '604', sublabel: 'PENTHOUSE' },
      { x: PAD + 10, y: 370, w: 620, h: 26, type: 'corridor', label: 'SUITE CORRIDOR', sublabel: '' },
      { x: 50, y: 410, w: 200, h: 200, type: 'suite', label: '605', sublabel: 'JUNIOR SUITE' },
      { x: 270, y: 410, w: 170, h: 200, type: 'suite', label: '606', sublabel: 'JUNIOR SUITE' },
      { x: 660, y: 380, w: 380, h: 200, type: 'pool', label: 'INFINITY POOL', sublabel: 'HEATED 25m' },
      { x: 660, y: 380, w: 180, h: 60, type: 'bar', label: 'SKY BAR', sublabel: 'ROOFTOP' },
      { x: 660, y: 440, w: 380, h: 80, type: 'terrace', label: 'SUN TERRACE', sublabel: 'DECK / CABANAS' },
      { x: 660, y: 528, w: 120, h: 50, type: 'toilet', label: 'POOL WC', sublabel: '' },
      { x: 800, y: 528, w: 100, h: 50, type: 'storage', label: 'POOL EQ.', sublabel: '' },
      { x: 920, y: 528, w: 120, h: 50, type: 'mechanical', label: 'POOL PLANT', sublabel: '' },
      { x: 50, y: 628, w: 120, h: 50, type: 'storage', label: 'BUTLER', sublabel: 'PANTRY' },
      { x: 190, y: 628, w: 80, h: 50, type: 'storage', label: 'LINEN L6', sublabel: '' },
      { x: 290, y: 628, w: 80, h: 50, type: 'toilet', label: 'STAFF WC', sublabel: '' },
    ],
  },
];

// ============ FLOOR PLAN RENDERER ============

interface BlueprintFloorPlanProps {
  floorIndex: number;
  hoveredRoom: string | null;
  onRoomHover: (id: string | null) => void;
  tasks: SimulatedTask[];
}

export function BlueprintFloorPlan({ floorIndex, hoveredRoom, onRoomHover, tasks }: BlueprintFloorPlanProps) {
  const floor = FLOOR_DATA[floorIndex];
  if (!floor) return null;

  // Map tasks to room labels for indicators
  const taskRoomLabels = new Set(tasks.map(t => t.roomLabel).filter(Boolean));

  return (
    <g>
      {floor.rooms.map((room, i) => {
        const style = ROOM_STYLES[room.type] || ROOM_STYLES.corridor;
        const id = `room-${floorIndex}-${i}`;
        const cx = room.x + room.w / 2;
        const cy = room.y + room.h / 2;
        const isHovered = hoveredRoom === id;
        const hasTask = taskRoomLabels.has(room.label);
        const isHatchType = room.type === 'stairs' || room.type === 'mechanical';
        const isDashed = room.type === 'corridor' || room.type === 'terrace';

        return (
          <g
            key={id}
            onMouseEnter={() => onRoomHover(id)}
            onMouseLeave={() => onRoomHover(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Room rectangle */}
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              stroke={style.stroke}
              strokeWidth={isHovered ? 2.5 : 2}
              fill={isHovered ? style.fill.replace(/[\d.]+\)$/, '0.4)') : style.fill}
              rx={2}
              strokeDasharray={isDashed ? '4 2' : undefined}
              style={{ transition: 'fill 0.2s, stroke-width 0.15s' }}
            />

            {/* Hatch pattern overlay */}
            {isHatchType && (
              <rect
                x={room.x}
                y={room.y}
                width={room.w}
                height={room.h}
                fill="url(#hash)"
                rx={2}
              />
            )}

            {/* Room label */}
            {room.label && (
              <text
                x={cx}
                y={room.h > 50 ? cy - 4 : cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="monospace"
                fontSize={room.w > 150 ? 11 : room.w > 80 ? 9 : 7}
                fontWeight={room.type === 'suite' || room.type === 'lobby' ? 'bold' : 'normal'}
                fill={style.labelFill}
              >
                {room.label}
              </text>
            )}

            {/* Sublabel */}
            {room.sublabel && room.h > 40 && (
              <text
                x={cx}
                y={cy + (room.h > 80 ? 12 : 8)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="monospace"
                fontSize={6}
                fill={style.labelFill}
                opacity={0.6}
              >
                {room.sublabel}
              </text>
            )}

            {/* Task indicator */}
            {hasTask && (
              <g>
                <circle cx={room.x + room.w - 8} cy={room.y + 8} r={5} fill="hsl(0,84%,60%)" stroke="hsl(210,60%,6%)" strokeWidth={1.5} />
                <circle cx={room.x + room.w - 8} cy={room.y + 8} r={5} fill="hsl(0,84%,60%)" opacity={0.6}>
                  <animate attributeName="r" values="5;9;5" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {/* Hover tooltip overlay */}
            {isHovered && room.label && (
              <g>
                <rect
                  x={cx - 50}
                  y={room.y - 24}
                  width={100}
                  height={18}
                  fill="hsl(210,60%,6%)"
                  stroke="hsl(195,90%,50%)"
                  strokeWidth={1}
                  rx={2}
                />
                <text
                  x={cx}
                  y={room.y - 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="monospace"
                  fontSize={8}
                  fill="hsl(195,90%,50%)"
                >
                  {room.label} — {room.sublabel || room.type.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
