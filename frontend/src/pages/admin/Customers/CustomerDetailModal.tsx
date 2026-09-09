import { X, User as UserIcon, Mail, Phone, Calendar, Clock, Shield } from 'lucide-react';
import { User } from '../../../services/userService';
import { Role } from '../../../services/roleService';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
}

const CustomerDetailModal = ({ isOpen, onClose, user, roles }: CustomerDetailModalProps) => {
  if (!isOpen || !user) return null;

  const roleName = roles.find(r => r.id === user.role_id)?.name || 'UNKNOWN';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserIcon size={20} className="text-gray-500" />
            Chi tiết Người dùng
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-inner">
              <UserIcon size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${roleName === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    roleName === 'STAFF' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                  }`}>
                  {roleName}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-md flex items-center gap-1 ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Phone size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">Số điện thoại</span>
                </div>
                <p className="font-semibold text-gray-900">{user.phone}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Mail size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">Email</span>
                </div>
                <p className="font-semibold text-gray-900 break-all">{user.email || '—'}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Shield size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Mã ID (Hệ thống)</span>
              </div>
              <p className="font-semibold text-gray-900">#{user.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">Ngày tạo</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(user.created_at)}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">Cập nhật lần cuối</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(user.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
