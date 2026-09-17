import { useState, useEffect } from 'react';
import { Search, CreditCard, Clock, RefreshCw, Eye } from 'lucide-react';
import { Payment } from '../../../types/payment.types';
import { Pagination as PaginationType } from '../../../types';
import { paymentService } from '../../../services/paymentService';
import Pagination from '../../../components/common/Pagination';
import { useToast } from '../../../context/ToastContext';
import StaffPaymentDetailModal from './StaffPaymentDetailModal';

const StaffPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter, appliedSearch, pagination.page]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getPayments({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        payment_method: methodFilter || undefined,
        search: appliedSearch || undefined
      });

      setPayments(response.items || []);
      setPagination({
        page: response.page,
        limit: response.size,
        total: response.total,
        total_pages: Math.ceil(response.total / response.size)
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      showToast('Không thể tải danh sách thanh toán.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev: PaginationType) => ({ ...prev, page: 1 }));
    setAppliedSearch(searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination((prev: PaginationType) => ({ ...prev, page: newPage }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">Chờ thanh toán</span>;
      case 'PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">Đã thanh toán</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Thất bại</span>;
      case 'REFUNDED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">Đã hoàn tiền</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
    }
  };

  const translateMethod = (method: string) => {
    if (method === 'CASH') return 'Tiền mặt';
    if (method === 'BANK_TRANSFER') return 'Chuyển khoản';
    return method;
  };

  const openPaymentDetails = async (id: number) => {
    try {
      const paymentData = await paymentService.getPaymentById(id);
      setSelectedPayment(paymentData);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      showToast('Không thể tải chi tiết thanh toán.', 'error');
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-slate-900 mb-2 flex items-center justify-between" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
          Quản Lý Thanh Toán
        </h1>
        <p className="text-gray-500 text-sm">
          Xem và xác nhận thanh toán của khách hàng
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-white p-4 rounded-xl border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm mã thanh toán, đơn hàng, TXN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] sm:text-sm transition-colors"
              />
            </form>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev: PaginationType) => ({ ...prev, page: 1 }));
              }}
              className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="FAILED">Thất bại</option>
              <option value="REFUNDED">Đã hoàn tiền</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPagination((prev: PaginationType) => ({ ...prev, page: 1 }));
              }}
              className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
            >
              <option value="">Tất cả phương thức</option>
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
            </select>

            <button
              onClick={fetchPayments}
              className="p-2.5 border border-gray-200 shadow-sm rounded-lg text-gray-500 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
              title="Tải lại"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Mã GD</th>
                <th className="px-6 py-4 font-semibold">Mã Đơn</th>
                <th className="px-6 py-4 font-semibold">Số Tiền</th>
                <th className="px-6 py-4 font-semibold">Phương thức</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Thời gian tạo</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                      <p>Đang tải danh sách thanh toán...</p>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">Không có Payment phù hợp.</p>
                      <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{payment.payment_code}</span>
                      {payment.transaction_code && (
                        <p className="text-xs text-gray-500 mt-1">TXN: {payment.transaction_code}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{payment.order_code || `ID: ${payment.order_id}`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(payment.amount))}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600">{translateMethod(payment.payment_method)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {new Date(payment.created_at || '').toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPaymentDetails(payment.id)}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wider">
                HIỂN THỊ <span className="font-medium">{payments.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> TRÊN TỔNG SỐ <span className="font-medium">{pagination.total}</span>
              </p>
            </div>
            <div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>

      {selectedPayment && (
        <StaffPaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default StaffPayments;
