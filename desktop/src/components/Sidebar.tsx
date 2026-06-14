import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isOnline } from '../services/offlineStore';

const navItems = [
  { to: '/pdv', label: 'PDV' },
  { to: '/cash-register', label: 'Caixa' },
  { to: '/sales', label: 'Vendas' },
  { to: '/data-structures', label: 'Estruturas de Dados' },
  { to: '/sync', label: 'Sincronizar' },
];

const sidebarStyle: React.CSSProperties = {
  width: 220,
  minHeight: '100vh',
  background: '#1a1a2e',
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  margin: 0,
};

const logoStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: 22,
  fontWeight: 700,
  padding: '28px 20px 24px',
  letterSpacing: 1,
};

const linkBase: React.CSSProperties = {
  display: 'block',
  color: '#ccc',
  textDecoration: 'none',
  padding: '12px 20px',
  fontSize: 15,
  transition: 'background 0.15s',
};

const linkActive: React.CSSProperties = {
  ...linkBase,
  background: '#2a2a4a',
  color: '#fff',
  fontWeight: 600,
};

const statusDot = (online: boolean): React.CSSProperties => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: online ? '#4caf50' : '#f44336',
  display: 'inline-block',
  marginRight: 8,
});

export default function Sidebar() {
  const { logout } = useAuth();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const check = () => isOnline().then(setOnline);
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>FastBuy PDV</div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => (isActive ? linkActive : linkBase)}
          >
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={logout}
          style={{
            ...linkBase,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }}
        >
          Sair
        </button>
      </nav>
      <div style={{ padding: '16px 20px', color: '#aaa', fontSize: 13 }}>
        <span style={statusDot(online)} />
        {online ? 'Online' : 'Offline'}
      </div>
    </aside>
  );
}
