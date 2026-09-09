import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { LogOut, LogIn } from 'lucide-react';

const Header = () => {
  const goldColor = '#B4975A';
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full bg-[#FAF9F5] border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="text-2xl sm:text-3xl tracking-[0.2em] text-gray-900"
              style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
            >
              RESTAURANT
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            <Link
              to="/"
              className={`text-xs font-bold uppercase tracking-wider py-1 transition-colors ${
                isActive('/') ? 'text-gray-900 border-b-2' : 'text-gray-500 hover:text-gray-900'
              }`}
              style={isActive('/') ? { borderColor: goldColor } : {}}
            >
              Trang chủ
            </Link>
            <Link 
              to="/menu" 
              className={`text-xs font-bold uppercase tracking-wider py-1 transition-colors ${
                isActive('/menu') ? 'text-gray-900 border-b-2' : 'text-gray-500 hover:text-gray-900'
              }`}
              style={isActive('/menu') ? { borderColor: goldColor } : {}}
            >
              Thực đơn
            </Link>
            <Link to="/story" className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 py-1 transition-colors">
              Câu chuyện
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-red-600 transition-colors focus:outline-none"
                title="Đăng xuất"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                title="Đăng nhập"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
            <Link
              to="/booking"
              className="hidden sm:inline-flex bg-[#111] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors items-center justify-center rounded-sm"
            >
              Đặt bàn ngay
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
