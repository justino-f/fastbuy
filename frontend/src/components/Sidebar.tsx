import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Produtos' },
  { to: '/categories', label: 'Categorias' },
  { to: '/clients', label: 'Clientes' },
  { to: '/suppliers', label: 'Fornecedores' },
  { to: '/stock', label: 'Estoque' },
  { to: '/pdv', label: 'PDV' },
  { to: '/sales', label: 'Vendas' },
  { to: '/cash-register', label: 'Caixa' },
  { to: '/reports', label: 'Relatórios' },
  { to: '/data-structures', label: 'Estruturas de Dados' },
];

const sidebarStyle: React.CSSProperties = {
  width: 250,
  minHeight: '100vh',
  backgroundColor: '#1a1a2e',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 0',
};

const logoStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 'bold',
  textAlign: 'center',
  padding: '0 20px 20px',
  borderBottom: '1px solid #333',
  marginBottom: 10,
};

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '12px 24px',
  color: '#ccc',
  textDecoration: 'none',
  fontSize: 14,
  transition: 'background 0.2s',
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  backgroundColor: '#1976d2',
  color: '#fff',
};

export default function Sidebar() {
  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>FastBuy SGS</div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
