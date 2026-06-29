import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipagem do contexto de tema — expõe estado atual e função de alternância
interface ThemeContextType {
  dark: boolean;     // true = tema escuro ativo, false = tema claro
  toggle: () => void; // alterna entre claro e escuro
}

// Cria contexto com valor padrão (tema claro, toggle noop)
const ThemeContext = createContext<ThemeContextType>({ dark: false, toggle: () => {} });

// Provider de tema — gerencia alternância dark/light em toda a aplicação
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Inicializa tema a partir do localStorage — persiste preferência do usuário entre sessões
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // useEffect reage a mudanças no estado 'dark' e aplica o tema no DOM
  // Três ações simultâneas garantem consistência visual:
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      // 1. Adiciona classe 'dark' no <html> — ativa variantes dark: do Tailwind CSS
      root.classList.add('dark');
      // 2. Aplica cor de fundo e texto diretamente no body — garante cobertura total
      document.body.style.backgroundColor = '#111827';
      document.body.style.color = '#f3f4f6';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f9fafb';
      document.body.style.color = '#111827';
    }
    // 3. Persiste preferência no localStorage para restaurar na próxima visita
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]); // dependência: executa sempre que 'dark' mudar

  // toggle usa updater function (d => !d) para evitar closure stale
  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook customizado para consumir o contexto de tema em qualquer componente
export const useTheme = () => useContext(ThemeContext);
