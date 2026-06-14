import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import PDV from './pages/PDV';
import CashRegister from './pages/CashRegister';
import Sales from './pages/Sales';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/pdv"
              element={
                <PrivateRoute>
                  <Layout>
                    <PDV />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/cash-register"
              element={
                <PrivateRoute>
                  <Layout>
                    <CashRegister />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <PrivateRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/pdv" replace />} />
            <Route path="*" element={<Navigate to="/pdv" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
