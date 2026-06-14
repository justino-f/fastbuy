import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Truck,
  BarChart3,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/categories', label: 'Categorias', icon: Tag },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/suppliers', label: 'Fornecedores', icon: Truck },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '';

  return (
    <nav className="w-60 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6">
        <img src="/fastbuy-logo.png" className="w-full max-w-[180px]" alt="FastBuy" />
      </div>

      {/* Navigation */}
      <div className="px-3 py-2 flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4 space-y-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors w-full"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Modo Claro' : 'Modo Escuro'}
        </button>

        {/* User card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center shrink-0">
            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{initial}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </nav>
  );
}
