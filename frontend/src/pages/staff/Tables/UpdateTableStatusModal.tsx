import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { RestaurantTable, TableStatus } from '../../../types/table';
import { tableService } from '../../../services/tableService';

interface UpdateTableStatusModalProps {
  table: RestaurantTable;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const STATUS_OPTIONS: { value: TableStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Trống (AVAILABLE)', color: 'text-gray-700 bg-gray-50 border-gray-200' },
  { value: 'OCCUPIED', label: 'Có khách (OCCUPIED)', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'RESERVED', label: 'Đã đặt (RESERVED)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'MAINTENANCE', label: 'Bảo trì (MAINTENANCE)', color: 'text-red-700 bg-red-50 border-red-200' }
];

const UpdateTableStatusModal: React.FC<UpdateTableStatusModalProps> = ({ table, onClose, onSuccess }) => {
  const [status, setStatus] = useState<TableStatus>(table.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (status === table.status) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await tableService.updateTable(table.id, { status });
      if (response.success) {
        onSuccess('Cập nhật trạng thái bàn thành công.');
      } else {
        setError(response.message || 'Không thể cập nhật trạng thái bàn.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setError('Bạn không có quyền cập nhật trạng thái bàn này.');
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Cập nhật trạng thái bàn</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Bàn được chọn:</p>
            <p className="text-2xl font-bold text-gray-900">Bàn {table.table_number}</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Trạng thái mới:</label>
            <div className="grid grid-cols-1 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  disabled={isSaving}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all
                    ${status === option.value
                      ? `ring-2 ring-blue-500 border-transparent ${option.color}`
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {option.label}
                  {status === option.value && (
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || status === table.status}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
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

export default UpdateTableStatusModal;
