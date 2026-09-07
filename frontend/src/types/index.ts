// ==================== User ====================

export interface User {
  id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  role: string;
  status?: string;
}

// ==================== Auth ====================

export interface RegisterRequest {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: User;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phone: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

// ==================== Category ====================

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// ==================== Menu Item ====================

export interface MenuItem {
  id: number;
  category_id: number;
  code?: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  status: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
  category?: Category; // For frontend display
}
