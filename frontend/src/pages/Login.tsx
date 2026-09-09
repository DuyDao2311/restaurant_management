import { useState, type FormEvent, type CSSProperties } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';

const StarIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    if (user?.role?.toUpperCase() === 'CUSTOMER') {
      return <Navigate to="/" replace />;
    } else if (user?.role?.toUpperCase() === 'STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(phone, password);
      if (result.user.role?.toUpperCase() === 'CUSTOMER') {
        navigate('/');
      } else if (result.user.role?.toUpperCase() === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goldColor = '#B4975A';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full pt-8 pb-12 px-4 sm:px-8">

        {/* Header Section */}
        <div className="mb-10 text-left relative">
          <div className="flex items-center gap-2 mb-4">
            <StarIcon className="w-5 h-5" style={{ color: goldColor }} />
            <span
              className="uppercase tracking-[0.2em] text-xs font-semibold"
              style={{ color: goldColor }}
            >
              Club Privilèges
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl mb-4 font-normal tracking-tight text-slate-900 leading-tight"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Đăng Nhập Restaurant
          </h1>

          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-lg">
            Chào mừng quý khách trở lại với không gian ẩm thực tinh hoa và các đặc quyền hội viên tối thượng.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          {/* Phone */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              {/* <span className="text-xs text-gray-400">
                Định dạng di động quốc gia
              </span> */}
            </div>
            <div className="relative flex items-center border-b border-gray-200 pb-2 focus-within:border-gray-800 transition-colors">
              <PhoneIcon className="w-5 h-5 text-gray-400 absolute left-0" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-8 py-2 bg-transparent focus:outline-none text-gray-800 placeholder-gray-300"
                placeholder="VD: 0901 234 567"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <Link to="#" className="text-xs font-medium hover:underline transition-all" style={{ color: goldColor }}>
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative flex items-center border-b border-gray-200 pb-2 focus-within:border-gray-800 transition-colors">
              <LockIcon className="w-5 h-5 text-gray-400 absolute left-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-transparent focus:outline-none text-gray-800 placeholder-gray-300"
                placeholder="Nhập mật khẩu"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center mb-8">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 bg-white border border-gray-300 rounded-sm focus:ring-0 checked:bg-black checked:border-black cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDYgOSAxNyA0IDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==')] bg-center bg-no-repeat bg-[length:70%_70%]"
              disabled={isSubmitting}
            />
            <label htmlFor="remember" className="ml-3 text-sm text-gray-600 cursor-pointer select-none">
              Ghi nhớ đăng nhập trên thiết bị này
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-sm text-white text-sm font-bold uppercase tracking-[0.15em] flex items-center justify-center transition-all ${isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ĐANG XỬ LÝ...
              </span>
            ) : (
              <>
                ĐĂNG NHẬP <span className="ml-2 text-lg leading-none">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="w-full h-px bg-gray-100 my-8"></div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-bold hover:opacity-80 transition-opacity underline underline-offset-4 ml-1"
              style={{ color: goldColor }}
            >
              ĐĂNG KÝ NGAY
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
