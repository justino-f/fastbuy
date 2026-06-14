import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 56,
            backgroundColor: '#fff',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 14, color: '#555' }}>{user?.name}</span>
          <button
            onClick={logout}
            style={{
              padding: '6px 16px',
              backgroundColor: '#e53935',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Sair
          </button>
        </header>
        <main style={{ flex: 1, padding: 24, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
