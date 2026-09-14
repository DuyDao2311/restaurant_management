export interface NestedReservation {
  id: number;
  customer_name: string;
  number_of_guests: number;
  customer_phone?: string;
}

export interface TableSession {
  id: number;
  table_id: number;
  reservation_id?: number;
  status: string; // ACTIVE, COMPLETED, CANCELLED
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  reservation?: NestedReservation;
}
