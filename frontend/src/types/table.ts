export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';

export interface RestaurantTable {
  id: number;
  table_number: string;
  capacity: number;
  location?: string | null;
  status: TableStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TableQRCode {
  table_id: number;
  table_number: string;
  qr_token: string;
  qr_url: string;
  status: string;
}

export interface CreateTableRequest {
  table_number: string;
  capacity: number;
  location?: string | null;
  status?: TableStatus;
}

export interface UpdateTableRequest {
  table_number?: string;
  capacity?: number;
  location?: string | null;
  status?: TableStatus;
}

export interface TablePublicQRResponse {
  table_id: number;
  table_number: string;
  capacity: number;
  location?: string | null;
  status: TableStatus;
}

export interface TableResponse {
  success: boolean;
  message: string;
  data: RestaurantTable;
}

export interface TableListResponse {
  success: boolean;
  message: string;
  data: RestaurantTable[];
}

export interface TableQRManagementResponse {
  success: boolean;
  message: string;
  data: TableQRCode;
}

export interface TablePublicQRDataResponse {
  success: boolean;
  message: string;
  data: TablePublicQRResponse;
}

export interface DeleteTableResponse {
  success: boolean;
  message: string;
}
