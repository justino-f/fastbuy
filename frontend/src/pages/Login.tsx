import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou senha inválidos');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#fff',
          padding: 40,
          borderRadius: 8,
          width: 360,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#1976d2' }}>FastBuy SGS</h2>
        {error && (
          <div style={{ color: '#e53935', marginBottom: 16, textAlign: 'center', fontSize: 14 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
