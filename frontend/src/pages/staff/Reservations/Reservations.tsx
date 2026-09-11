import React, { useState, useEffect } from 'react';
import { staffReservationService } from '../../../services/staffReservationService';
import { Reservation, ReservationStatus } from '../../../types/reservation';
import { Search, Filter, Eye, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import AssignTableModal from './AssignTableModal';
import RejectReservationModal from './RejectReservationModal';
import ReservationDetailModal from './ReservationDetailModal';

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');

  // Modals state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [modalType, setModalType] = useState<'DETAIL' | 'ASSIGN' | 'REJECT' | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffReservationService.getReservations({
        page,
        size: 10,
        status: statusFilter || undefined,
        reservation_date: dateFilter || undefined,
        table_id: tableFilter ? Number(tableFilter) : undefined
      });
      setReservations(data.items);
      setTotalPages(data.pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi tải danh sách đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page, statusFilter, dateFilter, tableFilter]);

  const handleActionSuccess = () => {
    setModalType(null);
    setSelectedReservation(null);
    fetchReservations();
  };

  const openModal = (reservation: Reservation, type: 'DETAIL' | 'ASSIGN' | 'REJECT') => {
    setSelectedReservation(reservation);
    setModalType(type);
  };

  const handleCheckIn = async (reservation: Reservation) => {
    if (!window.confirm(`Xác nhận Check-in cho đơn đặt bàn ${reservation.reservation_code}?`)) return;
    
    try {
      await staffReservationService.checkInReservation(reservation.id);
      // Fetch again to update table status
      fetchReservations();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi Check-in');
    }
  };

  const getStatusColor = (status: ReservationStatus) => {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt Bàn</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo trạng thái</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CHECKED_IN">CHECKED_IN</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="NO_SHOW">NO_SHOW</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo ngày</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo mã bàn</label>
            <input
              type="number"
              placeholder="VD: 1, 2..."
              className="w-full border border-gray-300 rounded-md p-2"
              value={tableFilter}
              onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setStatusFilter(''); setDateFilter(''); setTableFilter(''); setPage(1); }}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" /> Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-700 text-sm">Mã Đặt Bàn</th>
                <th className="p-4 font-semibold text-gray-700 text-sm">Khách hàng</th>
                <th className="p-4 font-semibold text-gray-700 text-sm">Số người</th>
                <th className="p-4 font-semibold text-gray-700 text-sm">Thời gian</th>
                <th className="p-4 font-semibold text-gray-700 text-sm">Bàn</th>
                <th className="p-4 font-semibold text-gray-700 text-sm">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-700 text-sm text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Không có dữ liệu đặt bàn</td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{res.reservation_code}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{res.customer_name}</div>
                      <div className="text-xs text-gray-500">{res.customer_phone}</div>
                    </td>
                    <td className="p-4 text-gray-600">{res.number_of_guests}</td>
                    <td className="p-4">
                      <div className="text-gray-800">{new Date(res.reservation_date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-xs text-gray-500">{res.start_time.slice(0,5)} - {res.end_time.slice(0,5)}</div>
                    </td>
                    <td className="p-4">
                      {res.table_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Bàn ID: {res.table_id}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Chưa xếp</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(res, 'DETAIL')}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {res.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openModal(res, 'ASSIGN')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Gán bàn"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => openModal(res, 'REJECT')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Từ chối"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {res.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCheckIn(res)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Check-in (Khách đến)"
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-center items-center gap-2 bg-gray-50">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded bg-white disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      {modalType === 'DETAIL' && selectedReservation && (
        <ReservationDetailModal 
          reservation={selectedReservation} 
          onClose={() => setModalType(null)} 
        />
      )}
      
      {modalType === 'ASSIGN' && selectedReservation && (
        <AssignTableModal 
          reservation={selectedReservation} 
          onClose={() => setModalType(null)}
          onSuccess={handleActionSuccess}
        />
      )}
      
      {modalType === 'REJECT' && selectedReservation && (
        <RejectReservationModal 
          reservation={selectedReservation} 
          onClose={() => setModalType(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};

export default Reservations;
