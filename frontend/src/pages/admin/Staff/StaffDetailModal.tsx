import { X } from 'lucide-react';
import { Staff } from '../../../services/staffService';

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

const StaffDetailModal = ({ isOpen, onClose, staff }: StaffDetailModalProps) => {
  if (!isOpen || !staff) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Chi tiết Staff</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Họ và tên</p>
              <p className="font-medium text-gray-900">{staff.full_name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900">{staff.email || '-'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
              <p className="font-medium text-gray-900">{staff.phone}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    staff.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                <p className="font-medium text-gray-900 text-sm">{formatDate(staff.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày cập nhật</p>
                <p className="font-medium text-gray-900 text-sm">{formatDate(staff.updated_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailModal;
