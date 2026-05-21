import { ROOM_TYPES } from '@/lib/roomTypes';

export type RoomStatus = 'vacant_clean' | 'vacant_dirty' | 'occupied' | 'out_of_order' | 'maintenance';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'authorized';
export type PaymentMethod = 'visa' | 'mastercard' | 'amex' | 'cash' | 'direct_bill' | 'comp';
export type BookingSource = 'direct' | 'walk_in' | 'expedia' | 'booking_com' | 'corporate' | 'travel_agent';
export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'no_show' | 'cancelled';

export interface Room {
  number: string;
  floor: number;
  typeCode: string;
  status: RoomStatus;
  note?: string;
}

export interface Reservation {
  id: string;            // confirmation #
  folioId: string;
  guestName: string;
  roomNumber?: string;
  typeCode: string;
  arrival: string;       // ISO date
  departure: string;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  source: BookingSource;
  rate: number;
  balance: number;
  vip?: boolean;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const offsetISO = (d: number) => {
  const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10);
};

// Generate 60 rooms across 6 floors
export const ROOMS: Room[] = (() => {
  const out: Room[] = [];
  const types = ROOM_TYPES.map(r => r.code);
  for (let f = 1; f <= 6; f++) {
    for (let n = 1; n <= 10; n++) {
      const num = `${f}${n.toString().padStart(2, '0')}`;
      const r = Math.random();
      let status: RoomStatus = 'occupied';
      if (r < 0.18) status = 'vacant_clean';
      else if (r < 0.28) status = 'vacant_dirty';
      else if (r < 0.32) status = 'out_of_order';
      else if (r < 0.36) status = 'maintenance';
      out.push({
        number: num,
        floor: f,
        typeCode: types[(f + n) % types.length],
        status,
        note: status === 'out_of_order' ? 'AC compressor failure' :
              status === 'maintenance' ? 'Carpet replacement' : undefined,
      });
    }
  }
  return out;
})();

const GUEST_NAMES = [
  'Smith, John', 'García, María', 'Chen, Wei', 'Patel, Aarav', 'Johnson, Emma',
  'Williams, Robert', 'Müller, Klaus', 'Tanaka, Yuki', 'Brown, Olivia', 'Davis, Liam',
  'Rossi, Sofia', 'Nguyen, Minh', 'Khan, Ahmed', 'Anderson, Sarah', 'Wilson, James',
  'Martin, Camille', 'O\'Brien, Sean', 'Petrov, Anna', 'Kim, Jisoo', 'Lopez, Diego',
];

const SOURCES: BookingSource[] = ['direct', 'walk_in', 'expedia', 'booking_com', 'corporate', 'travel_agent'];
const METHODS: PaymentMethod[] = ['visa', 'mastercard', 'amex', 'cash', 'direct_bill'];

export const RESERVATIONS: Reservation[] = GUEST_NAMES.map((name, i) => {
  const arrivalOffset = i < 6 ? 0 : i < 10 ? -1 - (i % 3) : (i % 5) + 1;
  const nights = 1 + (i % 4);
  const arrival = offsetISO(arrivalOffset);
  const departure = offsetISO(arrivalOffset + nights);
  const type = ROOM_TYPES[i % ROOM_TYPES.length];
  const rate = type.baseRate;
  const isToday = arrivalOffset === 0;
  const isInHouse = arrivalOffset < 0 && (arrivalOffset + nights) > 0;
  const isDeparting = arrivalOffset < 0 && (arrivalOffset + nights) === 0;
  let status: ReservationStatus = 'confirmed';
  if (isInHouse) status = 'checked_in';
  else if (isDeparting) status = 'checked_in';
  const assigned = (isInHouse || isDeparting || (isToday && i % 2 === 0))
    ? ROOMS.find(r => r.typeCode === type.code && r.status === 'occupied')?.number
    : undefined;
  const pay = i % 5;
  const paymentStatus: PaymentStatus = pay === 0 ? 'unpaid' : pay === 1 ? 'partial' : pay === 2 ? 'authorized' : 'paid';
  return {
    id: `RES-${(100000 + i).toString()}`,
    folioId: `FOL-${(200000 + i).toString()}`,
    guestName: name,
    roomNumber: assigned,
    typeCode: type.code,
    arrival, departure, nights,
    adults: 1 + (i % 2),
    children: i % 3 === 0 ? 1 : 0,
    status,
    paymentStatus,
    paymentMethod: METHODS[i % METHODS.length],
    source: SOURCES[i % SOURCES.length],
    rate,
    balance: paymentStatus === 'paid' ? 0 : Math.round(rate * nights * (paymentStatus === 'partial' ? 0.5 : 1)),
    vip: i % 7 === 0,
  };
});

export const TODAY = todayISO();

export const getArrivals = () => RESERVATIONS.filter(r => r.arrival === TODAY);
export const getDepartures = () => RESERVATIONS.filter(r => r.departure === TODAY);
export const getInHouse = () => RESERVATIONS.filter(r => r.status === 'checked_in' && r.departure > TODAY);
export const getVacantRooms = () => ROOMS.filter(r => r.status === 'vacant_clean' || r.status === 'vacant_dirty');
export const getOutOfOrder = () => ROOMS.filter(r => r.status === 'out_of_order' || r.status === 'maintenance');
export const getThirdPartyBookings = () =>
  RESERVATIONS.filter(r => ['expedia', 'booking_com', 'travel_agent'].includes(r.source));
