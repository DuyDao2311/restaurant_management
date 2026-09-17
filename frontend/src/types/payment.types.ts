export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: number;
  order_id: number;
  order_code?: string;
  payment_code: string;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_code?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentConfirmRequest {
  payment_method: PaymentMethod;
  transaction_code?: string | null;
}

export interface PaymentListResponse {
  items: Payment[];
  total: number;
  page: number;
  size: number;
}
