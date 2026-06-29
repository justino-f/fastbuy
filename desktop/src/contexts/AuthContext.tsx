// AuthContext.tsx — Contexto de autenticação React (Context API)
// Gerencia estado global de login/logout no app desktop
// Mesmo padrão usado no frontend web — garante consistência entre as duas aplicações
// Persiste token JWT e dados do usuário no localStorage para manter sessão entre recarregamentos

import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { login as apiLogin } from '../services/api';

// Tipagem do contexto — define o contrato de dados e funções disponíveis para os consumers
interface AuthContextType {
  user: User | null;           // dados do usuário logado (null se não autenticado)
  token: string | null;        // JWT token (null se não autenticado)
  login: (email: string, password: string) => Promise<void>;  // função de login assíncrona
  logout: () => void;          // função de logout — limpa estado e localStorage
  isAuthenticated: boolean;    // flag derivada — true se token E user existem
}

// Cria o contexto com valor padrão vazio (cast como AuthContextType)
// O valor real é fornecido pelo AuthProvider — nunca se usa o default em runtime
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Provider que encapsula toda a árvore de componentes da aplicação
// Qualquer componente filho pode acessar user, token, login, logout via useAuth()
export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa o estado do usuário a partir do localStorage (persistência entre sessões)
  // Usa lazy initializer (função no useState) para evitar parse desnecessário a cada re-render
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Token JWT também persistido no localStorage — lido na inicialização
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Estado derivado: usuário só está autenticado se ambos token e user existirem
  const isAuthenticated = !!token && !!user;

  // Função de login — chama a API, persiste credenciais e atualiza estado React
  // Diferença do frontend web: chama apiLogin diretamente (sem abstração adicional)
  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    // Constrói objeto User a partir da resposta — id=0 pois a API de login não retorna o ID
    const u: User = { id: 0, name: res.name, email: res.email, role: res.role, active: true };
    // Persiste no localStorage para sobreviver a recarregamentos do app
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(u));
    // Atualiza estado React — dispara re-render em todos os consumers do contexto
    setToken(res.token);
    setUser(u);
  };

  // Função de logout — limpa localStorage e reseta estado React
  // Ao setar null, isAuthenticated se torna false e o app redireciona para login
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Provider distribui o valor do contexto para toda a árvore de componentes filhos
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para consumir o contexto de autenticação
// Uso: const { user, login, logout, isAuthenticated } = useAuth();
export const useAuth = () => useContext(AuthContext);
