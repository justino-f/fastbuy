import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px', background: '#f5f5f5', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
