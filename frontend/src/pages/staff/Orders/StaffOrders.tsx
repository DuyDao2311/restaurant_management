import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, RefreshCw, Eye, ShoppingCart } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { tableService } from '../../../services/tableService';
import { tableSessionService } from '../../../services/tableSessionService';
import { Order } from '../../../types/order.types';
import { RestaurantTable } from '../../../types/table';
import { TableSession } from '../../../types/table_session.types';
import OrderDetailModal from '../../admin/Orders/OrderDetailModal';

const StaffOrders = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const response = await tableService.getTables();
      const allTables = response.data || [];
      // Show OCCUPIED tables first, then others
      const sorted = [...allTables].sort((a, b) => {
        if (a.status === 'OCCUPIED' && b.status !== 'OCCUPIED') return -1;
        if (a.status !== 'OCCUPIED' && b.status === 'OCCUPIED') return 1;
        return 0;
      });
      setTables(sorted);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTable = async (tableId: number) => {
    setSelectedTable(tableId);
    setActiveSession(null);
    setOrders([]);
    setIsSessionLoading(true);
    try {
      const session = await tableSessionService.getActiveSessionByTable(tableId);
      if (session) {
        setActiveSession(session);
        fetchOrdersForSession(session.id);
      }
    } catch (error) {
      console.error('No active session found or error:', error);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const fetchOrdersForSession = async (sessionId: number) => {
    try {
      const response = await tableSessionService.getOrdersBySession(sessionId);
      setOrders(response.items || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const refreshCurrentSession = () => {
    if (selectedTable) {
      handleSelectTable(selectedTable);
    } else {
      fetchTables();
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    
    // Check if any order is uncompleted
    const uncompleted = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
    if (uncompleted.length > 0) {
      alert('Không thể đóng phiên vì vẫn còn Order chưa hoàn thành.');
      return;
    }

    if (!window.confirm('Bàn đã hoàn tất phục vụ.\nBạn có chắc chắn muốn đóng phiên?')) {
      return;
    }

    try {
      await tableSessionService.closeSession(activeSession.id);
      alert('Đóng phiên bàn thành công.');
      refreshCurrentSession();
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Không thể đóng phiên.');
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

  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  const sessionTotal = activeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const uncompletedOrdersCount = activeOrders.filter(o => o.status !== 'COMPLETED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1">Chọn bàn đang hoạt động để xem và tạo đơn hàng</p>
        </div>
        <button 
          onClick={refreshCurrentSession}
          className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 bg-white"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading || isSessionLoading ? 'animate-spin' : ''}`} />
          <span className="font-medium hidden sm:inline">Làm mới</span>
        </button>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left pane: Tables list */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">Danh sách Bàn</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                  selectedTable === table.id 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{table.table_number}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    table.status === 'OCCUPIED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {table.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right pane: Session & Orders */}
        <div className="w-2/3 flex flex-col gap-4 overflow-hidden">
          {selectedTable ? (
            isSessionLoading ? (
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : activeSession ? (
              <>
                {/* Session Info */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">Bàn {tables.find(t => t.id === selectedTable)?.table_number}</h2>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                        {activeSession.reservation ? (
                          <>
                            <p><span className="font-medium text-gray-800">Khách:</span> {activeSession.reservation.customer_name}</p>
                            <p><span className="font-medium text-gray-800">Số khách:</span> {activeSession.reservation.guest_count} người</p>
                          </>
                        ) : (
                          <>
                            <p><span className="font-medium text-gray-800">Khách:</span> Vãng lai</p>
                            <p></p>
                          </>
                        )}
                        <p><span className="font-medium text-gray-800">Session:</span> <span className="text-green-600 font-semibold">{activeSession.status}</span></p>
                        <p><span className="font-medium text-gray-800">Bắt đầu:</span> {new Date(activeSession.started_at).toLocaleString()}</p>
                        <p><span className="font-medium text-gray-800">Tổng Order:</span> {orders.length}</p>
                        <p><span className="font-medium text-gray-800">Tổng tiền:</span> <span className="font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sessionTotal)}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 border-t border-gray-100 pt-4">
                    {activeSession.status === 'ACTIVE' && (
                      <button
                        onClick={() => navigate('/staff/orders/create')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                      >
                        <Plus size={20} />
                        Tạo Order
                      </button>
                    )}
                    {activeSession.status === 'ACTIVE' && (
                      <button
                        onClick={handleCloseSession}
                        disabled={uncompletedOrdersCount > 0}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors border ${
                          uncompletedOrdersCount > 0 
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-sm'
                        }`}
                        title={uncompletedOrdersCount > 0 ? 'Vẫn còn Order chưa hoàn thành' : 'Đóng phiên phục vụ'}
                      >
                        Đóng Session
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders List */}
                <div className="bg-white flex-1 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Danh sách Order</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {orders.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                        <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-lg font-medium text-gray-600">Chưa có Order nào</p>
                        <p className="text-sm">Hãy nhấn nút "Tạo Order" để bắt đầu order cho khách.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                          <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                            <th className="px-6 py-3 font-semibold">Mã Đơn</th>
                            <th className="px-6 py-3 font-semibold">Source</th>
                            <th className="px-6 py-3 font-semibold">Tổng Tiền</th>
                            <th className="px-6 py-3 font-semibold">Trạng thái</th>
                            <th className="px-6 py-3 font-semibold text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-semibold text-gray-900">{order.order_code}</span>
                                <div className="text-xs text-gray-500 mt-1 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(order.created_at || '').toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">STAFF</span>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.total_amount))}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getStatusColor(order.status)}`}>
                                  {translateStatus(order.status)}
                                </span>
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
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-gray-300">?</span>
                </div>
                <p className="text-lg font-medium text-gray-600 mb-1">Không có phiên hoạt động</p>
                <p className="text-sm text-center">Bàn này chưa được Check-in. <br/>Vui lòng Check-in Booking để tạo phiên bàn.</p>
              </div>
            )
          ) : (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-600">Chọn một bàn để xem chi tiết</p>
            </div>
          )}
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
