import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { AxiosError } from 'axios';

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

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (!agreedToTerms) {
      setError('Vui lòng đồng ý với Điều khoản Hội viên & Chính sách Bảo mật.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.register({
        full_name: fullName,
        phone,
        email: email || undefined,
        password
      });

      if (response.success) {
        setSuccessMsg('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
        // Clear form
        setFullName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setAgreedToTerms(false);

        // Wait 2 seconds then redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goldColor = '#B4975A';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full pt-8 pb-12 px-4 sm:px-8">

        {/* Header Section */}
        <div className="mb-10 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12" style={{ backgroundColor: goldColor }}></div>
            <span
              className="uppercase tracking-[0.2em] text-xs font-semibold"
              style={{ color: goldColor }}
            >
              Club Privilèges
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl mb-4 font-normal tracking-tight text-slate-900"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Gia Nhập Restaurant
          </h1>

          <p
            className="text-gray-500 italic text-lg sm:text-xl"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Đặc quyền trải nghiệm nghệ thuật ẩm thực tinh hoa
          </p>
        </div>

        <div className="w-full h-px bg-gray-100 mb-8"></div>

        {error && (
          <div className="mb-6 p-4 rounded bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm text-center">
            {successMsg}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#F9F9F9] border border-gray-100 rounded-sm p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
              placeholder="VD: Nguyễn Văn A"
              required
              disabled={isSubmitting || !!successMsg}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F9F9F9] border border-gray-100 rounded-sm p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                placeholder="VD: 0901 234 567"
                required
                disabled={isSubmitting || !!successMsg}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F9F9F9] border border-gray-100 rounded-sm p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                placeholder="VD: abc@gmail.com"
                required
                disabled={isSubmitting || !!successMsg}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Password */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F9F9F9] border border-gray-100 rounded-sm p-4 pr-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                  placeholder="•••••••••••"
                  required
                  disabled={isSubmitting || !!successMsg}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
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

            {/* Confirm Password */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F9F9F9] border border-gray-100 rounded-sm p-4 pr-12 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                  placeholder="•••••••••••"
                  required
                  disabled={isSubmitting || !!successMsg}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start mb-8">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 bg-white border border-gray-300 rounded-sm focus:ring-0 checked:bg-black checked:border-black cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDYgOSAxNyA0IDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==')] bg-center bg-no-repeat bg-[length:70%_70%]"
                disabled={isSubmitting || !!successMsg}
              />
            </div>
            <div className="ml-3 text-sm text-gray-600">
              <label htmlFor="terms" className="cursor-pointer">
                Tôi đồng ý với <a href="#" className="text-gray-800 font-medium hover:underline">Điều khoản Thành viên</a> & <a href="#" className="text-gray-800 font-medium hover:underline">Chính sách Bảo mật Thông tin Cá nhân</a>.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !!successMsg}
            className={`w-full py-4 px-6 rounded-sm text-white text-sm font-bold uppercase tracking-[0.15em] flex items-center justify-center transition-all ${(isSubmitting || !!successMsg)
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
                ĐĂNG KÝ <span className="ml-2 text-lg leading-none">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-600">
            Bạn đã là thành viên?{' '}
            <Link
              to="/login"
              className="font-medium hover:opacity-80 transition-opacity underline underline-offset-4"
              style={{ color: goldColor }}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;

