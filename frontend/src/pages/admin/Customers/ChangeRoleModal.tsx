import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { User } from '../../../services/userService';
import { Role } from '../../../services/roleService';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
  onConfirm: (userId: number, newRoleId: number) => Promise<void>;
}

const ChangeRoleModal = ({ isOpen, onClose, user, roles, onConfirm }: ChangeRoleModalProps) => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setSelectedRoleId(user.role_id);
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const currentRole = roles.find((r) => r.id === user.role_id);
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleSubmit = async () => {
    if (selectedRoleId === '' || selectedRoleId === user.role_id) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(user.id, selectedRoleId);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi đổi quyền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWarning = () => {
    if (!selectedRole || selectedRole.id === user.role_id) return null;

    if (selectedRole.name === 'ADMIN') {
      return (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 text-sm">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold mb-1">Cảnh báo nghiêm trọng</p>
            <p>Bạn đang cấp quyền Quản trị viên (ADMIN) cho tài khoản này. Người dùng sẽ có quyền truy cập vào tất cả các tính năng quản lý hệ thống. Bạn có chắc chắn không?</p>
          </div>
        </div>
      );
    }

    if (selectedRole.name === 'STAFF') {
      return (
        <div className="mt-4 p-4 bg-amber-50 text-amber-700 rounded-lg flex items-start gap-3 text-sm">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold mb-1">Thay đổi quyền</p>
            <p>Tài khoản này sẽ có quyền truy cập vào các tính năng dành cho Nhân viên (STAFF). Bạn có chắc chắn muốn thay đổi?</p>
          </div>
        </div>
      );
    }

    if (selectedRole.name === 'CUSTOMER') {
      return (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-start gap-3 text-sm">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold mb-1">Hạ quyền</p>
            <p>Bạn đang đưa tài khoản này về nhóm Khách hàng (CUSTOMER). Họ sẽ mất quyền truy cập Admin/Staff.</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Thay đổi Quyền Người dùng</h3>
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

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Người dùng</p>
            <p className="font-medium text-gray-900">{user.full_name}</p>
            <p className="text-xs text-gray-500">{user.email || user.phone}</p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Quyền hiện tại</p>
            <div className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
              {currentRole?.name || 'UNKNOWN'}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quyền mới</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-black focus:border-black outline-none"
              disabled={isSubmitting}
            >
              <option value="" disabled>Chọn quyền</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {renderWarning()}
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
            disabled={isSubmitting || selectedRoleId === '' || selectedRoleId === user.role_id}
            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
