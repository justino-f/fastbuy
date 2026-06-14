import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { isOnline } from '../services/offlineStore';
import { Monitor, ShoppingCart, History, LogOut, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

const navItems = [
  { to: '/pdv', label: 'PDV', icon: ShoppingCart },
  { to: '/cash-register', label: 'Caixa', icon: Monitor },
  { to: '/sales', label: 'Vendas', icon: History },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [online, setOnline] = useState(true);
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '';

  useEffect(() => {
    const check = () => isOnline().then(setOnline);
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-60 min-h-screen bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col">
      <div className="px-5 py-6">
        <img src="/fastbuy-logo.png" alt="FastBuy" className="w-full max-w-[180px]" />
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-4 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 text-sm">
          {online ? (
            <><Wifi className="h-4 w-4 text-green-500" /><span className="text-green-600 dark:text-green-400">Online</span></>
          ) : (
            <><WifiOff className="h-4 w-4 text-red-500" /><span className="text-red-600 dark:text-red-400">Offline</span></>
          )}
        </div>

        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors w-full"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Modo Claro' : 'Modo Escuro'}
        </button>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center shrink-0">
            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{initial}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.role}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
