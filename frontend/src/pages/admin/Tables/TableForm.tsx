import React, { useState, useEffect } from 'react';
import { RestaurantTable, CreateTableRequest, UpdateTableRequest, TableStatus } from '../../../types/table';
import axios from 'axios';
import { tableService } from '../../../services/tableService';
import { X } from 'lucide-react';

interface TableFormProps {
  mode: 'create' | 'edit';
  initialData?: RestaurantTable;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const TableForm: React.FC<TableFormProps> = ({ mode, initialData, onSuccess, onCancel }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<TableStatus>('AVAILABLE');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTableNumber(initialData.table_number);
      setCapacity(initialData.capacity.toString());
      setLocation(initialData.location || '');
      setStatus(initialData.status);
    }
  }, [mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const num = tableNumber.trim();
    if (!num) {
      setError('Mã bàn không được để trống.');
      return;
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      setError('Sức chứa phải là số nguyên lớn hơn 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: CreateTableRequest = {
          table_number: num,
          capacity: cap,
          location: location.trim() || null,
          status: status,
        };
        const res = await tableService.createTable(payload);
        if (res.success) {
          onSuccess('Thêm bàn thành công.');
        } else {
          setError(res.message || 'Có lỗi xảy ra.');
        }
      } else {
        if (!initialData) return;
        const payload: UpdateTableRequest = {
          table_number: num,
          capacity: cap,
          location: location.trim() || null,
          status: status,
        };
        const res = await tableService.updateTable(initialData.id, payload);
        if (res.success) {
          onSuccess('Cập nhật bàn thành công.');
        } else {
          setError(res.message || 'Có lỗi xảy ra.');
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response && err.response.status === 409) {
          setError('Mã bàn đã tồn tại trong hệ thống.');
        } else {
          setError(err.response?.data?.message || 'Có lỗi xảy ra từ máy chủ.');
        }
      } else {
        setError('Có lỗi xảy ra từ máy chủ.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'Thêm Bàn Mới' : 'Cập Nhật Bàn'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Mã bàn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tableNumber"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="VD: B01, VIP1..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Sức chứa (Số khách) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="VD: 4"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Khu vực / Tầng
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="VD: Tầng 1, Ngoài trời..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TableStatus)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white"
              disabled={isSubmitting}
            >
              <option value="AVAILABLE">Trống (Available)</option>
              <option value="OCCUPIED">Có khách (Occupied)</option>
              <option value="RESERVED">Đã đặt (Reserved)</option>
              <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (mode === 'create' ? 'Đang thêm...' : 'Đang cập nhật...') 
                : (mode === 'create' ? 'Thêm bàn' : 'Cập nhật')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableForm;
