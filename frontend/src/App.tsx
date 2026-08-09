import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/Layout/PrivateRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersListPage from './pages/customers/CustomersListPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import ProductsListPage from './pages/products/ProductsListPage';
import ProductFormPage from './pages/products/ProductFormPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import ChallansListPage from './pages/challans/ChallansListPage';
import ChallanFormPage from './pages/challans/ChallanFormPage';
import ChallanDetailPage from './pages/challans/ChallanDetailPage';
import UsersPage from './pages/users/UsersPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — All roles */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

            {/* Customers — ADMIN, SALES */}
            <Route path="/customers" element={<PrivateRoute roles={['ADMIN', 'SALES']}><CustomersListPage /></PrivateRoute>} />
            <Route path="/customers/new" element={<PrivateRoute roles={['ADMIN', 'SALES']}><CustomerFormPage /></PrivateRoute>} />
            <Route path="/customers/:id" element={<PrivateRoute roles={['ADMIN', 'SALES']}><CustomerDetailPage /></PrivateRoute>} />
            <Route path="/customers/:id/edit" element={<PrivateRoute roles={['ADMIN', 'SALES']}><CustomerFormPage mode="edit" /></PrivateRoute>} />

            {/* Products — All staff */}
            <Route path="/products" element={<PrivateRoute><ProductsListPage /></PrivateRoute>} />
            <Route path="/products/new" element={<PrivateRoute roles={['ADMIN', 'WAREHOUSE']}><ProductFormPage /></PrivateRoute>} />
            <Route path="/products/:id" element={<PrivateRoute><ProductDetailPage /></PrivateRoute>} />
            <Route path="/products/:id/edit" element={<PrivateRoute roles={['ADMIN', 'WAREHOUSE']}><ProductFormPage /></PrivateRoute>} />

            {/* Challans — ADMIN, SALES, ACCOUNTS */}
            <Route path="/challans" element={<PrivateRoute><ChallansListPage /></PrivateRoute>} />
            <Route path="/challans/new" element={<PrivateRoute roles={['ADMIN', 'SALES']}><ChallanFormPage /></PrivateRoute>} />
            <Route path="/challans/:id" element={<PrivateRoute><ChallanDetailPage /></PrivateRoute>} />

            {/* Users — ADMIN only */}
            <Route path="/users" element={<PrivateRoute roles={['ADMIN']}><UsersPage /></PrivateRoute>} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
