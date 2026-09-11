export interface NestedReservation {
  id: number;
  customer_name: string;
  guest_count: number;
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
