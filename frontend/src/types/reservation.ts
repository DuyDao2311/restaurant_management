export type ReservationStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'CANCELLED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'REJECTED';

export interface Reservation {
  id: number;
  user_id: number | null;
  table_id: number | null;
  reservation_code: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  number_of_guests: number;
  customer_name: string;
  customer_phone: string;
  note?: string;
  rejection_reason?: string;
  status: ReservationStatus;
  created_at: string;
  updated_at?: string;
}

export interface ReservationListResponse {
  items: Reservation[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AssignTablePayload {
  table_id: number;
}

export interface RejectReservationPayload {
  reason: string;
}
