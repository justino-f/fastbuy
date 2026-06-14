import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/pdv');
    } catch {
      setError('Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🛒</div>
          <h1 style={styles.title}>FastBuy PDV</h1>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f0f2f5',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: 40,
    width: 380,
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  logoArea: {
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    margin: 0,
    fontSize: 24,
    color: '#2196F3',
    fontWeight: 700,
  },
  error: {
    background: '#ffebee',
    color: '#c62828',
    padding: '10px 14px',
    borderRadius: 4,
    fontSize: 14,
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 15,
    outline: 'none',
  },
  button: {
    padding: '12px 0',
    background: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
