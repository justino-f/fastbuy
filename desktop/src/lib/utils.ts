// utils.ts — Utilitários compartilhados: merge de classes CSS, formatadores e constantes visuais
// Sincronizado com o frontend web — mesmas funções e classes garantem consistência visual entre plataformas

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utilitário para merge inteligente de classes CSS (Tailwind)
// Combina clsx (condicionais) com twMerge (resolve conflitos de classes Tailwind)
// Exemplo: cn('px-4', condition && 'px-8') → resolve para 'px-8' se condition=true
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatador de moeda brasileira (BRL) — padrão pt-BR com símbolo R$
// Usado em todo o PDV para exibir preços, totais e troco de forma consistente
// Exemplo: fmt(49.90) → "R$ 49,90"
export const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formatador de data/hora — converte ISO string para formato brasileiro legível
// Exemplo: fmtDate('2026-06-28T14:30:00') → "28/06/2026, 14:30:00"
export const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR');

// === Classes CSS compartilhadas (constantes Tailwind) ===
// Centralizadas aqui para garantir visual idêntico em todos os componentes
// Mesmos valores usados no frontend web — alteração aqui reflete em todo o app desktop

// Classe base para inputs de texto — bordas arredondadas, cores dark mode, foco indigo
export const inputCls = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none';

// Classe base para labels de formulário — tamanho pequeno, peso médio, margem inferior
export const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block';

// Botão primário — fundo indigo, texto branco, hover escurecido
export const btnPrimaryCls = 'px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors';

// Botão secundário — fundo cinza claro, texto escuro, variantes dark mode
export const btnSecondaryCls = 'px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors';

// Card padrão — fundo branco, bordas arredondadas 2xl, sombra sutil, borda cinza
export const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700';
