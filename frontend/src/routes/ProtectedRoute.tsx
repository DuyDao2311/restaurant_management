import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-medium shadow-sm">
          <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Chuyển hướng về trang đăng nhập, lưu lại URL hiện tại để quay lại sau
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.role) {
    const isAuthorized = allowedRoles.includes(user.role);
    if (!isAuthorized) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
            <p className="text-gray-500 mb-8">
              Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
            </p>

            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white hover:bg-gray-800 font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft size={18} />
              Quay lại trang trước
            </button>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
