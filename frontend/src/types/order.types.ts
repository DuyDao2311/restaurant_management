export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  note?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: number;
  order_code: string;
  table_session_id: number;
  status: string;
  subtotal: number;
  discount_amount?: number;
  total_amount: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
  order_items: OrderItem[];
}

export interface OrderItemCreate {
  menu_item_id: number;
  quantity: number;
  note?: string;
}

export interface OrderCreate {
  table_session_id: number;
  note?: string;
  items: OrderItemCreate[];
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  size: number;
}

export interface OrderStatusUpdate {
  status: string;
}
