import { X, Clock, MapPin, CheckCircle, Package } from 'lucide-react';
import { Order } from '../../../types/order.types';
import { orderService } from '../../../services/orderService';
import { useState } from 'react';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdated: (updatedOrder: Order) => void;
}

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];

const OrderDetailModal = ({ order, onClose, onStatusUpdated }: OrderDetailModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const updated = await orderService.updateOrderStatus(order.id, { status: newStatus });
      onStatusUpdated(updated);
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Cập nhật trạng thái thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy Order này?")) return;
    setIsUpdating(true);
    try {
      const updated = await orderService.cancelOrder(order.id);
      onStatusUpdated(updated);
      alert("Hủy Order thành công");
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Hủy Order thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PREPARING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'READY': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SERVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const canCancel = ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden m-4">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{order.order_code}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                {translateStatus(order.status)}
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-sm gap-4">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(order.created_at || '').toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Session #{order.table_session_id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 rounded-xl border border-gray-100 bg-gray-50 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Thay đổi Trạng thái</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={isUpdating || s === order.status}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${s === order.status
                        ? getStatusColor(s)
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                      }`}
                  >
                    {translateStatus(s)}
                  </button>
                ))}
              </div>
            </div>
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors"
              >
                Hủy Order
              </button>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-500" />
            Danh sách Món
          </h3>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Mã Món</th>
                  <th className="px-4 py-3 text-right">Đơn giá</th>
                  <th className="px-4 py-3 text-center">SL</th>
                  <th className="px-4 py-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.order_items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">Món #{item.menu_item_id}</span>
                      {item.note && <p className="text-xs text-gray-500 mt-0.5">Ghi chú: {item.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.unit_price))}</td>
                    <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(item.subtotal))}</td>
                  </tr>
                ))}
                {(!order.order_items || order.order_items.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Đơn hàng chưa có món nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.subtotal))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between items-center mb-2 text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.discount_amount))}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
              <span className="font-bold text-gray-900">Tổng cộng</span>
              <span className="text-xl font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailModal;
