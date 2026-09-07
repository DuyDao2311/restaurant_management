import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import authService from '../services/authService';
import type { User, LoginResponse, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('access_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (phone: string, password: string): Promise<LoginResponse> => {
    const data = await authService.login(phone, password);
    if (data.success && data.access_token) {
      sessionStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const logout = (): void => {
    handleLogout();
  };

  const handleLogout = (): void => {
    sessionStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
