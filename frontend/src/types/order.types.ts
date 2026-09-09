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
  user_id?: number;
  table_id: number;
  order_type: string;
  status: string;
  subtotal: number;
  discount?: number;
  tax?: number;
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
  table_id: number;
  order_type?: string;
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
