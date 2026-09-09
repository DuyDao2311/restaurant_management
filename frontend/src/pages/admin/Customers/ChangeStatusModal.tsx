import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../../../services/userService';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: number, newStatus: 'ACTIVE' | 'INACTIVE') => Promise<void>;
}

const ChangeStatusModal = ({ isOpen, onClose, user, onConfirm }: ChangeStatusModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  const isCurrentlyActive = user.status === 'ACTIVE';
  const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(user.id, newStatus);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isCurrentlyActive ? 'Vô hiệu hóa Tài khoản' : 'Kích hoạt Tài khoản'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${isCurrentlyActive ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-gray-800 mb-2">
                Bạn có chắc chắn muốn <span className="font-bold">{isCurrentlyActive ? 'vô hiệu hóa' : 'kích hoạt'}</span> tài khoản của người dùng:
              </p>
              <p className="font-bold text-lg mb-1">{user.full_name}</p>
              <p className="text-sm text-gray-500 mb-3">{user.email || user.phone}</p>

              {isCurrentlyActive ? (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">Tài khoản này sẽ không thể đăng nhập hoặc sử dụng hệ thống cho đến khi được kích hoạt lại.</p>
              ) : (
                <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-md">Tài khoản sẽ được hoạt động trở lại bình thường.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${isCurrentlyActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              isCurrentlyActive ? 'Vô hiệu hóa' : 'Kích hoạt'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
