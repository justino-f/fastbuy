import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { login as apiLogin } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading] = useState(false);

  const isAuthenticated = !!token && !!user;

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    const u: User = { id: 0, name: res.name, email: res.email, role: res.role, active: true };
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(res.token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
