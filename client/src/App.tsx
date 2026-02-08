import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { POSLayout } from './layouts/POSLayout';
import { POS } from './pages/POS';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { ProductList } from './pages/admin/ProductList';
import { UserList } from './pages/admin/UserList';
import { CustomerList } from './pages/admin/CustomerList';
import { CustomerProfilePage } from './pages/admin/CustomerProfilePage';
import { TransactionsPage } from './pages/admin/TransactionsPage';
import { SaleDetailPage } from './pages/admin/SaleDetailPage';
import { SupplierManager } from './components/admin/SupplierManager';
import { PurchaseHistory } from './pages/admin/PurchaseHistory';
import { PurchasePage } from './pages/admin/PurchasePage';
import { LowStockReport } from './pages/admin/LowStockReport';
import { SettingsPage } from './pages/admin/SettingsPage';
import { ReceiptSettingsPage } from './pages/admin/ReceiptSettingsPage';
import { HelpPage } from './pages/admin/HelpPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SubscriptionPlans } from './pages/admin/SubscriptionPlans';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* ... other routes ... */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route
              path="/pos"
              element={
                <POSLayout>
                  <POS />
                </POSLayout>
              }
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'super_admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin/products" element={<ProductList />} />
              <Route path="/admin/customers" element={<CustomerList />} />
              <Route path="/admin/customers/:id" element={<CustomerProfilePage />} />
              <Route path="/admin/transactions" element={<TransactionsPage />} />
              <Route path="/admin/transactions/:id" element={<SaleDetailPage />} />
              <Route path="/admin/suppliers" element={<SupplierManager />} />
              <Route path="/admin/purchases" element={<PurchaseHistory />} />
              <Route path="/admin/purchases/new" element={<PurchasePage />} />
              <Route path="/admin/low-stock" element={<LowStockReport />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/receipts" element={<ReceiptSettingsPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/help" element={<HelpPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<UserList />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/plans" element={<SubscriptionPlans />} />
            </Route>
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
