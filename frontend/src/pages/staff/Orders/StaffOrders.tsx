import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ShoppingCart, Clock, RefreshCw, Eye } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { Order } from '../../../types/order.types';
import OrderDetailModal from '../../admin/Orders/OrderDetailModal';

const StaffOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getOrders(1, 50, statusFilter || undefined);
      setOrders(response.items || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
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
      alert('Không thể tải chi tiết đơn hàng.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1">Quản lý và theo dõi các đơn hàng của nhà hàng</p>
        </div>
        <button
          onClick={() => navigate('/staff/orders/create')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          Tạo Đơn Mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý (Pending)</option>
                <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                <option value="PREPARING">Đang chuẩn bị (Preparing)</option>
                <option value="READY">Đã sẵn sàng (Ready)</option>
                <option value="SERVED">Đã phục vụ (Served)</option>
                <option value="COMPLETED">Hoàn thành (Completed)</option>
                <option value="CANCELLED">Đã hủy (Cancelled)</option>
              </select>
            </div>
            <button 
              onClick={fetchOrders}
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
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
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                        Bàn {order.table_id}
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

export default StaffOrders;
