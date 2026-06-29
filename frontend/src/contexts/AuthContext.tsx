import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../services/api';

// Tipagem do contexto de autenticação — define o contrato que todos os consumidores seguem
interface AuthContextType {
  user: User | null;       // dados do usuário logado (null se deslogado)
  token: string | null;    // JWT armazenado (null se deslogado)
  login: (email: string, password: string) => Promise<void>;  // função de login
  logout: () => void;      // função de logout
  isAuthenticated: boolean; // flag derivada: true quando token E user estão presentes
}

// Cria o contexto React com valor padrão vazio (será sobrescrito pelo Provider)
// Padrão Context API: permite compartilhar estado global sem prop drilling
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Provider de autenticação — envolve toda a aplicação para fornecer estado de auth global
export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa estado do usuário a partir do localStorage (persistência entre reloads)
  // Usa lazy initialization (função no useState) para evitar leitura desnecessária do localStorage
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Inicializa token a partir do localStorage — mesmo padrão de lazy initialization
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Flag derivada: usuário está autenticado APENAS se token E user existem
  // Dupla verificação evita estado inconsistente (ex: token sem user)
  const isAuthenticated = !!token && !!user;

  // Fluxo de login:
  // 1. Chama API de autenticação com credenciais
  // 2. Extrai token JWT e dados do usuário da resposta
  // 3. Persiste ambos no localStorage (sobrevive a reload/fechamento de aba)
  // 4. Atualiza estado React (dispara re-render em todos os consumidores)
  const login = async (email: string, password: string) => {
    const res = await auth.login({ email, password });
    const data = res.data as any;
    const t = data.token;
    // Constrói objeto User a partir da resposta — id=0 pois o backend retorna dados parciais
    const u: User = { id: 0, name: data.name, email: data.email, role: data.role, active: true };
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  // Fluxo de logout:
  // 1. Remove credenciais do localStorage (limpa persistência)
  // 2. Reseta estado React para null (dispara re-render → redireciona para login)
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Provider injeta o estado e as funções de auth em toda a árvore de componentes
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para consumir o contexto de autenticação
// Simplifica o uso: ao invés de useContext(AuthContext), basta chamar useAuth()
export const useAuth = () => useContext(AuthContext);
