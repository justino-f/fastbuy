import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utilitário para mesclar classes CSS condicionais com Tailwind
// clsx: resolve classes condicionais (ex: { 'bg-red': isError })
// twMerge: resolve conflitos de classes Tailwind (ex: 'px-2 px-4' → 'px-4')
// Combinação garante classes limpas e sem duplicatas
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatador de moeda brasileira — converte número para formato R$ 1.234,56
export const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formatador de data brasileira — converte ISO 8601 para dd/mm/aaaa hh:mm:ss
export const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

// Constantes CSS compartilhadas entre todas as páginas CRUD
// Centraliza estilos para garantir consistência visual e facilitar manutenção
// Qualquer mudança aqui reflete automaticamente em todos os formulários do sistema

// Classe de input padrão — campo de formulário com suporte a dark mode e focus ring
export const inputCls = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none';

// Classe de label padrão — rótulo de campo com tipografia consistente
export const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block';

// Classe de botão primário — ação principal (salvar, confirmar)
export const btnPrimaryCls = 'px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors';

// Classe de botão secundário — ação secundária (cancelar, voltar)
export const btnSecondaryCls = 'px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';

// Classe de card padrão — container com sombra e borda para seções de conteúdo
export const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700';
