import React from 'react';
import { Reservation } from '../../../types/reservation';
import { X, Calendar, Clock, Users, User, Phone, FileText, AlertTriangle } from 'lucide-react';

interface ReservationDetailModalProps {
  reservation: Reservation;
  onClose: () => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({ reservation, onClose }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'CHECKED_IN': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Chi tiết đặt bàn</h3>
            <p className="text-sm text-gray-500 mt-1">Mã: <span className="font-mono font-medium">{reservation.reservation_code}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Thông tin khách hàng</h4>
            <div className="flex items-center text-gray-700">
              <User className="w-5 h-5 mr-3 text-gray-400" />
              <span>{reservation.customer_name}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Phone className="w-5 h-5 mr-3 text-gray-400" />
              <span>{reservation.customer_phone}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 border-b pb-2">Thông tin đặt bàn</h4>
            <div className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 mr-3 text-gray-400" />
              <span>{new Date(reservation.reservation_date).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-3 text-gray-400" />
              <span>{reservation.start_time.slice(0,5)} - {reservation.end_time.slice(0,5)}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Users className="w-5 h-5 mr-3 text-gray-400" />
              <span>{reservation.number_of_guests} khách</span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Trạng thái</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                {reservation.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Bàn được xếp</p>
              <span className="font-medium text-gray-900">
                {reservation.table_id ? `Bàn ID: ${reservation.table_id}` : 'Chưa xếp bàn'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-1 flex items-center">
              <FileText className="w-4 h-4 mr-1" /> Ghi chú từ khách
            </p>
            <div className="bg-gray-50 p-3 rounded-md text-gray-700 whitespace-pre-wrap min-h-[60px]">
              {reservation.note || <span className="text-gray-400 italic">Không có ghi chú</span>}
            </div>
          </div>

          {reservation.status === 'REJECTED' && reservation.rejection_reason && (
            <div>
              <p className="text-sm font-medium text-red-600 mb-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" /> Lý do từ chối (Admin)
              </p>
              <div className="bg-red-50 border border-red-100 p-3 rounded-md text-red-700 whitespace-pre-wrap">
                {reservation.rejection_reason}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center text-xs text-gray-400 border-t mt-4">
            <span>Tạo lúc: {new Date(reservation.created_at).toLocaleString('vi-VN')}</span>
            {reservation.updated_at && <span>Cập nhật: {new Date(reservation.updated_at).toLocaleString('vi-VN')}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailModal;
