import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import PurchasesPage from './pages/PurchasesPage';
import CustomersPage from './pages/CustomersPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import SalesPage from './pages/SalesPage';
import SaleDetailPage from './pages/SaleDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import LoadingSpinner from './components/UI/LoadingSpinner';
import InstallPrompt from './components/UI/InstallPrompt';
import OfflineIndicator from './components/UI/OfflineIndicator';
import OfflinePage from './pages/OfflinePage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="purchases" element={<ProtectedRoute adminOnly><PurchasesPage /></ProtectedRoute>} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerProfilePage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/:id" element={<SaleDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
      </Route>
      <Route path="offline" element={<OfflinePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      // callback when a new service worker is waiting to activate
    },
    onOfflineReady() {
      // callback when the app is ready for offline use
    }
  });

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <OfflineIndicator />
          <InstallPrompt />
          <AppRoutes />
          {needRefresh && (
            <div className="fixed bottom-4 right-4 z-40 rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-lg backdrop-blur transition-all dark:border-blue-700 dark:bg-slate-900/95">
              <p className="mb-2 text-sm text-slate-700 dark:text-slate-200">A new version is ready. Refresh to update.</p>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => updateServiceWorker?.()}
              >
                Refresh App
              </button>
            </div>
          )}
          {offlineReady && (
            <div className="fixed bottom-4 left-4 z-40 rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-sm text-emerald-900 shadow-lg backdrop-blur dark:border-emerald-600 dark:bg-emerald-900/80 dark:text-emerald-100">
              App is ready for offline use.
            </div>
          )}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
