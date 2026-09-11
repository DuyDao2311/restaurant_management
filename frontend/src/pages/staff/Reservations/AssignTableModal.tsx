import React, { useState, useEffect } from 'react';
import { Reservation } from '../../../types/reservation';
import { staffReservationService } from '../../../services/staffReservationService';
import { Table, Check, X, AlertCircle } from 'lucide-react';
import { tableService } from '../../../services/tableService';

import { RestaurantTable } from '../../../types/table';

interface AssignTableModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignTableModal: React.FC<AssignTableModalProps> = ({ reservation, onClose, onSuccess }) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch tables to assign, you might want to fetch available tables only
    const fetchTables = async () => {
      try {
        // Fetching all tables, let admin decide or backend validate
        const responseData = await tableService.getTables({ size: 100 } as any);
        // Only show tables that have capacity >= guests
        setTables(responseData.data.filter((t: RestaurantTable) => t.capacity >= reservation.number_of_guests && t.status !== 'MAINTENANCE'));
      } catch (err) {
        console.error("Failed to fetch tables", err);
      }
    };
    fetchTables();
  }, [reservation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      setError('Vui lòng chọn bàn');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await staffReservationService.assignTable(reservation.id, { table_id: Number(selectedTable) });
      onSuccess();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Bàn đã bị đặt trùng thời gian. Vui lòng chọn bàn khác.');
      } else {
        setError(err.response?.data?.detail || 'Có lỗi xảy ra khi gán bàn');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Gán bàn cho {reservation.reservation_code}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-3 rounded-md flex items-start text-red-700">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn bàn (Số khách: {reservation.number_of_guests})
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">-- Chọn bàn --</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>
                  Bàn {t.table_number} (Sức chứa: {t.capacity}) - {t.status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận gán bàn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTableModal;
