import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  return token ? <>{children}</> : <Navigate to="/login" />;
}
