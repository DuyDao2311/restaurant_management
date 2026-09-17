import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Clock, RefreshCw, Eye } from 'lucide-react';
import { Order } from '../../../types/order.types';
import { Pagination as PaginationType } from '../../../types';
import { orderService } from '../../../services/orderService';
import OrderDetailModal from './OrderDetailModal';
import Pagination from '../../../components/common/Pagination';
import { useToast } from '../../../context/ToastContext';

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, pagination.page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getOrders(pagination.page, pagination.limit, statusFilter || undefined);
      if (response.success) {
        setOrders(response.data.items || []);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-purple-100 text-purple-800';
      case 'READY': return 'bg-indigo-100 text-indigo-800';
      case 'SERVED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PREPARING': return 'Đang chuẩn bị';
      case 'READY': return 'Đã sẵn sàng';
      case 'SERVED': return 'Đã phục vụ';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
  };

  const openOrderDetails = async (id: number) => {
    try {
      const orderData = await orderService.getOrderById(id);
      setSelectedOrder(orderData);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      showToast('Không thể tải chi tiết đơn hàng.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-slate-900 mb-2 flex items-center justify-between" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
          Quản Lý Đơn Hàng
        </h1>
        <p className="text-gray-500 text-sm">
          Xem và quản lý tất cả đơn hàng của nhà hàng
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-white p-4 rounded-xl border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm mã đơn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PREPARING">Đang chuẩn bị</option>
              <option value="READY">Đã sẵn sàng</option>
              <option value="SERVED">Đã phục vụ</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <button 
              onClick={fetchOrders}
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
                <th className="px-6 py-4 font-semibold">Mã Đơn</th>
                <th className="px-6 py-4 font-semibold">Bàn</th>
                <th className="px-6 py-4 font-semibold">Tổng Tiền</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold">Thời gian</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                      <p>Đang tải đơn hàng...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">Không tìm thấy đơn hàng</p>
                      <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{order.order_code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium border border-gray-200">
                        Session #{order.table_session_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.total_amount))}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {new Date(order.created_at || '').toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openOrderDetails(order.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Xem Chi Tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wider">
                HIỂN THỊ <span className="font-medium">{orders.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> TRÊN TỔNG SỐ <span className="font-medium">{pagination.total}</span> ĐƠN HÀNG
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

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
};

export default OrdersPage;
