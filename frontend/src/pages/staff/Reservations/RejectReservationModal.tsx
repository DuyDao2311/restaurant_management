import React, { useState } from 'react';
import { Reservation } from '../../../types/reservation';
import { staffReservationService } from '../../../services/staffReservationService';
import { X, AlertCircle } from 'lucide-react';

interface RejectReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

const RejectReservationModal: React.FC<RejectReservationModalProps> = ({ reservation, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Lý do từ chối không được để trống');
      return;
    }
    if (trimmedReason.length > 500) {
      setError('Lý do từ chối không được vượt quá 500 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await staffReservationService.rejectReservation(reservation.id, { reason: trimmedReason });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi từ chối đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-red-600">Từ chối đặt bàn {reservation.reservation_code}</h3>
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
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
              placeholder="VD: Nhà hàng đã hết bàn trống trong khung giờ này..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{reason.trim().length}/500</p>
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
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectReservationModal;
