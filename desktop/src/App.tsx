import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import PDV from './pages/PDV';
import CashRegister from './pages/CashRegister';
import Sales from './pages/Sales';
import DataStructures from './pages/DataStructures';
import SyncPage from './pages/SyncPage';
import './App.css';

export default function App() {
  return (
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
          <Route
            path="/data-structures"
            element={
              <PrivateRoute>
                <Layout>
                  <DataStructures />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sync"
            element={
              <PrivateRoute>
                <Layout>
                  <SyncPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/pdv" replace />} />
          <Route path="*" element={<Navigate to="/pdv" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
