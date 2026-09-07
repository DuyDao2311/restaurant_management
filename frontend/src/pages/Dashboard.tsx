import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <h1 className="text-xl font-bold text-slate-800">
              Restaurant Management
            </h1>
          </div>
          
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Xin chào, {user?.full_name || 'Người dùng'}
              </h2>
              <p className="text-slate-500">
                Role: <span className="font-semibold text-amber-600">{user?.role || 'Unknown'}</span>
              </p>
            </div>
          </div>
          
          <div className="prose text-slate-600">
            <p>
              Đây là trang Dashboard cơ bản (placeholder) để kiểm tra tính năng Authentication.
              Các module chức năng khác như quản lý menu, bàn, đơn hàng sẽ được phát triển trong các Step tiếp theo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
