import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

// Admin Pages
import DashboardPage from './pages/admin/Dashboard/Dashboard';
import MenuPage from './pages/admin/Menu/Menu';
import NewDishPage from './pages/admin/Menu/NewDish';
import EditDishPage from './pages/admin/Menu/EditDish';
import CategoriesPage from './pages/admin/Categories/Categories';
import TablesPage from './pages/admin/Tables/Tables';
import ReservationsPage from './pages/admin/Reservations/Reservations';
import OrdersPage from './pages/admin/Orders/Orders';
import CustomersPage from './pages/admin/Customers/Customers';
import StaffPage from './pages/admin/Staff/Staff';
import PromotionsPage from './pages/admin/Promotions/Promotions';
import ReportsPage from './pages/admin/Reports/Reports';
import NotificationsPage from './pages/admin/Notifications/Notifications';
import SettingsPage from './pages/admin/Settings/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="menu/new" element={<NewDishPage />} />
              <Route path="menu/edit/:id" element={<EditDishPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
