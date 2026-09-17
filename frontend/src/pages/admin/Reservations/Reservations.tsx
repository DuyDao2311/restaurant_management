import React, { useState, useEffect } from 'react';
import { adminReservationService } from '../../../services/adminReservationService';
import { Reservation, ReservationStatus } from '../../../types/reservation';
import { Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';
import AssignTableModal from './AssignTableModal';
import RejectReservationModal from './RejectReservationModal';
import ReservationDetailModal from './ReservationDetailModal';
import Pagination from '../../../components/common/Pagination';

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
      const data = await adminReservationService.getReservations(
        page,
        10,
        {
          status: statusFilter || undefined,
          reservation_date: dateFilter || undefined,
          table_id: tableFilter ? Number(tableFilter) : undefined
        }
      );
      setReservations(data.data.items);
      setTotalPages(data.data.pagination.total_pages);
      setTotalItems(data.data.pagination.total);
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
    <div className="p-6 md:p-8 bg-[#F9FAFB] min-h-screen">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-slate-900 mb-2 flex items-center justify-between" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
          Quản Lý Đặt Bàn
        </h1>
        <p className="text-gray-500 text-sm">
          Điều phối, phê duyệt và theo dõi lịch đặt bàn
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="VD: 1, 2, Bàn 5, VIP..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] sm:text-sm transition-colors"
              value={tableFilter}
              onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã nhận bàn</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="NO_SHOW">Không đến</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
          <input
            type="date"
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          />
          <button
            onClick={() => { setStatusFilter(''); setDateFilter(''); setTableFilter(''); setPage(1); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" /> Xóa Lọc
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-8 border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Mã Đặt Bàn</th>
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Khách hàng</th>
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Số người</th>
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Thời gian</th>
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Bàn</th>
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider">Trạng thái</th>
                <th className="py-5 px-6 font-bold text-gray-400 text-[11px] uppercase tracking-wider text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">Đang tải dữ liệu...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">Không có dữ liệu đặt bàn</td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-5 px-6">
                      <span className="font-bold text-gray-800">{res.reservation_code}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-bold text-gray-800 mb-0.5">{res.customer_name}</div>
                      <div className="text-[13px] text-gray-400 font-medium">{res.customer_phone}</div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="inline-flex items-center gap-1.5 bg-gray-50/80 text-gray-600 rounded-lg px-3 py-1.5 font-bold text-[13px]">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        {res.number_of_guests}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-bold text-gray-800 mb-0.5">{new Date(res.reservation_date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-[13px] text-gray-400 font-medium">{res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)}</div>
                    </td>
                    <td className="py-5 px-6">
                      {res.table_id ? (
                        <div className="inline-flex items-center bg-gray-50/80 text-gray-600 rounded-lg px-3 py-1.5 font-bold text-[13px]">
                          Bàn ID: {res.table_id}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm font-medium">--</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {res.status === 'CONFIRMED' ? (
                        <div className="inline-flex items-center gap-2 border border-blue-200 bg-blue-50/50 text-blue-600 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          ĐÃ XÁC NHẬN
                        </div>
                      ) : res.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50/50 text-amber-500 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          CHỜ XỬ LÝ
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50/50 text-gray-500 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {res.status === 'CHECKED_IN' ? 'ĐÃ NHẬN BÀN' : 
                           res.status === 'CANCELLED' ? 'ĐÃ HỦY' : 
                           res.status === 'REJECTED' ? 'ĐÃ TỪ CHỐI' : 
                           res.status === 'NO_SHOW' ? 'KHÔNG ĐẾN' : 
                           res.status === 'COMPLETED' ? 'HOÀN THÀNH' : res.status}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(res, 'DETAIL')}
                          className="w-[34px] h-[34px] rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors bg-white shadow-sm"
                          title="Xem chi tiết"
                        >
                          <Eye size={15} strokeWidth={2} />
                        </button>
                        {res.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openModal(res, 'ASSIGN')}
                              className="w-[34px] h-[34px] rounded-full border border-green-200 flex items-center justify-center text-green-500 hover:bg-green-50 transition-colors bg-white shadow-sm"
                              title="Gán bàn"
                            >
                              <CheckCircle size={15} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => openModal(res, 'REJECT')}
                              className="w-[34px] h-[34px] rounded-full border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors bg-white shadow-sm"
                              title="Từ chối"
                            >
                              <XCircle size={15} strokeWidth={2} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <div className="text-[13px] text-gray-400 font-medium">
              Hiển thị <span className="font-bold text-gray-700">{totalItems > 0 ? (page - 1) * 10 + 1 : 0}</span> đến <span className="font-bold text-gray-700">{Math.min(page * 10, totalItems)}</span> của <span className="font-bold text-gray-700">{totalItems}</span> đặt bàn
            </div>

            <div className="flex items-center gap-2">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
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
