import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import Suppliers from './pages/Suppliers';
import SupplierForm from './pages/SupplierForm';
import Stock from './pages/Stock';
import PDV from './pages/PDV';
import Sales from './pages/Sales';
import CashRegister from './pages/CashRegister';
import Reports from './pages/Reports';
import DataStructures from './pages/DataStructures';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id/edit" element={<ProductForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id/edit" element={<ClientForm />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/new" element={<SupplierForm />} />
            <Route path="/suppliers/:id/edit" element={<SupplierForm />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/cash-register" element={<CashRegister />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/data-structures" element={<DataStructures />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
