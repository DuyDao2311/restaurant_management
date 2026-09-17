import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Clock, RefreshCw, Eye, ShoppingCart, Search,
  Home, Check, Users, Timer, Utensils, CheckCircle
} from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { tableService } from '../../../services/tableService';
import { tableSessionService } from '../../../services/tableSessionService';
import { Order } from '../../../types/order.types';
import { RestaurantTable } from '../../../types/table';
import { TableSession } from '../../../types/table_session.types';
import { Payment } from '../../../types/payment.types';
import OrderDetailModal from '../../admin/Orders/OrderDetailModal';
import PaymentModal from './PaymentModal';
import { useToast } from '../../../context/ToastContext';
import { paymentService } from '../../../services/paymentService';
import ConfirmModal from '../../../components/common/ConfirmModal';

const StaffOrders = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Record<number, Payment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCloseSessionConfirm, setShowCloseSessionConfirm] = useState(false);
  const [isPayingSession, setIsPayingSession] = useState(false);
  const [isConfirmingSessionPayment, setIsConfirmingSessionPayment] = useState(false);

  // Per-table running order counts (table_id -> {count, total})
  const [tableOrderInfo, setTableOrderInfo] = useState<Record<number, { count: number; total: number }>>({});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const response = await tableService.getTables(1, 100);
      if (response.success) {
        const allTables = response.data.items || [];
        // Sort: OCCUPIED first, then RESERVED, then AVAILABLE, then others
        const statusOrder: Record<string, number> = { OCCUPIED: 0, RESERVED: 1, AVAILABLE: 2, MAINTENANCE: 3 };
        const sorted = [...allTables].sort((a, b) => {
          return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
        });
        setTables(sorted);
        // Fetch order info for OCCUPIED tables
        fetchTableOrderInfoBatch(sorted.filter(t => t.status === 'OCCUPIED'));
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableOrderInfoBatch = async (occupiedTables: RestaurantTable[]) => {
    const info: Record<number, { count: number; total: number }> = {};
    for (const table of occupiedTables) {
      try {
        const session = await tableSessionService.getActiveSessionByTable(table.id);
        if (session) {
          const response = await tableSessionService.getOrdersBySession(session.id);
          const sessionOrders: Order[] = response.items || [];
          const activeOrders = sessionOrders.filter((o: Order) => o.status !== 'CANCELLED');
          info[table.id] = {
            count: activeOrders.length,
            total: activeOrders.reduce((sum: number, o: Order) => sum + Number(o.total_amount), 0),
          };
        }
      } catch {
        // ignore per-table errors
      }
    }
    setTableOrderInfo(info);
  };

  const handleSelectTable = async (tableId: number) => {
    setSelectedTable(tableId);
    setActiveSession(null);
    setOrders([]);
    setExpandedOrderId(null);
    setStatusFilter('');
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
      const fetchedOrders: Order[] = response.items || [];
      setOrders(fetchedOrders);

      // Fetch payments for these orders
      const paymentsMap: Record<number, Payment> = {};
      await Promise.all(
        fetchedOrders.map(async (order) => {
          if (order.status !== 'CANCELLED') {
            try {
              const payment = await paymentService.getPaymentByOrderId(order.id);
              if (payment) {
                paymentsMap[order.id] = payment;
              }
            } catch (err) {
              console.error(`Failed to fetch payment for order ${order.id}`);
            }
          }
        })
      );
      setPayments(paymentsMap);
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

    const uncompleted = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
    if (uncompleted.length > 0) {
      showToast('Không thể đóng phiên vì vẫn còn Order chưa hoàn thành.', 'warning');
      return;
    }

    if (pendingAmount > 0) {
      setIsPayingSession(true);
    } else {
      setShowCloseSessionConfirm(true);
    }
  };

  const handleConfirmSessionPayment = async (method: string, transactionCode?: string) => {
    if (method === 'BANK_TRANSFER' && (!transactionCode || !transactionCode.trim())) {
      showToast('Vui lòng nhập mã giao dịch.', 'warning');
      return;
    }

    setIsConfirmingSessionPayment(true);
    try {
      // Find all unpaid payments
      const unpaidPayments = activeOrders
        .map(o => payments[o.id])
        .filter(p => p && p.status !== 'PAID' && p.status !== 'REFUNDED');

      // Pay them all
      await Promise.all(
        unpaidPayments.map(p => 
          paymentService.confirmPayment(p.id, {
            payment_method: method as any,
            transaction_code: transactionCode
          })
        )
      );

      // Close session
      await tableSessionService.closeSession(activeSession!.id);
      showToast('Thanh toán và đóng phiên thành công!', 'success');
      
      setIsPayingSession(false);
      refreshCurrentSession();
      fetchTables();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Lỗi khi thanh toán phiên';
      showToast(msg, 'error');
    } finally {
      setIsConfirmingSessionPayment(false);
    }
  };

  const executeCloseSession = async () => {
    setShowCloseSessionConfirm(false);
    try {
      await tableSessionService.closeSession(activeSession!.id);
      showToast('Đóng phiên bàn thành công.', 'success');
      refreshCurrentSession();
      fetchTables();
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Không thể đóng phiên.', 'error');
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

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-[#fffbeb] text-[#c4943a] border-[#f5dfa0]';
      case 'CONFIRMED': return 'bg-[#eff6ff] text-[#3b82f6] border-[#bfdbfe]';
      case 'PREPARING': return 'bg-[#f5f3ff] text-[#8b5cf6] border-[#ddd6fe]';
      case 'READY': return 'bg-[#eef2ff] text-[#6366f1] border-[#c7d2fe]';
      case 'SERVED': return 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]';
      case 'COMPLETED': return 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]';
      case 'CANCELLED': return 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]';
      default: return '';
    }
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSelectedOrder(updatedOrder);
    if (updatedOrder.status === 'CANCELLED' && payments[updatedOrder.id]) {
      setPayments(prev => ({
        ...prev,
        [updatedOrder.id]: { ...prev[updatedOrder.id], status: 'FAILED' }
      }));
    }
  };

  const handleConfirmPayment = async (method: string, transactionCode?: string) => {
    if (!payingOrder || !payments[payingOrder.id]) return;

    if (method === 'BANK_TRANSFER' && (!transactionCode || !transactionCode.trim())) {
      showToast('Vui lòng nhập mã giao dịch.', 'warning');
      return;
    }
    
    setIsConfirmingPayment(true);
    try {
      const paymentId = payments[payingOrder.id].id;
      const updatedPayment = await paymentService.confirmPayment(paymentId, {
        payment_method: method as any,
        transaction_code: transactionCode
      });
      
      showToast('Thanh toán thành công!', 'success');
      
      setPayments(prev => ({
        ...prev,
        [payingOrder.id]: updatedPayment
      }));
      setPayingOrder(null);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Không thể xác nhận thanh toán';
      showToast(msg, 'error');
      if (msg.includes('đã được thanh toán')) {
         if (activeSession) fetchOrdersForSession(activeSession.id);
         setPayingOrder(null);
      }
    } finally {
      setIsConfirmingPayment(false);
    }
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

  const toggleExpandOrder = (orderId: number) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  // Computed values
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  const sessionTotal = activeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const uncompletedOrdersCount = activeOrders.filter(o => o.status !== 'COMPLETED').length;

  const paidAmount = activeOrders.reduce((sum, o) => {
    const p = payments[o.id];
    return p && p.status === 'PAID' ? sum + Number(p.amount) : sum;
  }, 0);
  const pendingAmount = sessionTotal - paidAmount;

  const filteredTables = useMemo(() => {
    if (!searchTerm) return tables;
    return tables.filter(t =>
      t.table_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tables, searchTerm]);

  const availableTablesCount = tables.filter(t => t.status === 'AVAILABLE').length;

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const selectedTableData = tables.find(t => t.id === selectedTable);

  const getTableStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-[#fef2f2] text-[#c44b4b]';
      case 'RESERVED': return 'bg-[#fef9ee] text-[#c4943a]';
      case 'AVAILABLE': return 'bg-[#f0faf0] text-[#4b8f4b]';
      case 'MAINTENANCE': return 'bg-[#f3f4f6] text-[#6b7280]';
      default: return '';
    }
  };

  const getTableStatusDotClass = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'bg-[#c44b4b]';
      case 'RESERVED': return 'bg-[#c4943a]';
      case 'AVAILABLE': return 'bg-[#4b8f4b]';
      case 'MAINTENANCE': return 'bg-[#6b7280]';
      default: return '';
    }
  };

  const translateTableStatus = (status: string) => {
    switch (status) {
      case 'OCCUPIED': return 'Đang phục vụ';
      case 'RESERVED': return 'Đã đặt';
      case 'AVAILABLE': return 'Sẵn sàng';
      case 'MAINTENANCE': return 'Bảo trì';
      default: return status;
    }
  };

  const getStatusMessage = (order: Order) => {
    switch (order.status) {
      case 'PENDING': return 'Đang chờ xác nhận từ nhà bếp';
      case 'CONFIRMED': return 'Đã xác nhận, đang chờ chuẩn bị';
      case 'PREPARING': return 'Đã chuyển thông tin tới Trạm Bếp Nóng & Quầy Pha Chế';
      case 'READY': return 'Món đã sẵn sàng, chờ phục vụ';
      case 'SERVED': return 'Đã phục vụ cho khách';
      case 'COMPLETED': return 'Đơn hàng đã hoàn thành';
      case 'CANCELLED': return 'Đơn hàng đã bị hủy';
      default: return '';
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#faf9f7] overflow-hidden">
      {/* ===== LEFT PANEL: Table List ===== */}
      <div className="w-[320px] min-w-[320px] bg-white border-r border-[#e8e5e0] flex flex-col overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#f0ede8]">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 text-base font-bold text-[#1a1a1a] font-['Inter']">
              <Home className="w-[18px] h-[18px] text-[#8b7355]" /> Danh Sách Bàn
            </div>
            <span className="text-[11px] font-semibold text-[#6b8f5e] bg-[#ecf5e7] px-2.5 py-[3px] rounded-full tracking-[0.02em]">
              {availableTablesCount} bàn khả dụng
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5b0a8]" />
            <input
              type="text"
              className="w-full py-2.5 pr-3.5 pl-[38px] border-[1.5px] border-[#e8e5e0] rounded-[10px] text-[13px] text-[#555] bg-[#faf9f7] outline-none transition-all duration-200 font-['Inter'] focus:border-[#c4a87c] focus:bg-white focus:ring-[3px] focus:ring-[#c4a87c]/10 placeholder:text-[#b5b0a8]"
              placeholder="Tìm theo số bàn (B01, VIP01...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ddd] [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <RefreshCw className="w-8 h-8 text-[#c4a87c] animate-spin" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="p-6 text-center text-[#999] text-[13px]">
              Không tìm thấy bàn nào
            </div>
          ) : (
            filteredTables.map(table => {
              const isSelected = selectedTable === table.id;
              const orderInfo = tableOrderInfo[table.id];
              return (
                <div
                  key={table.id}
                  className={`relative px-4 py-3.5 border-2 rounded-xl mb-2 cursor-pointer transition-all duration-200 bg-white hover:border-[#d4cfc7] hover:bg-[#fdfcfb] ${
                    isSelected ? 'border-[#c4a87c] bg-[#fdf8f0] shadow-[0_2px_12px_rgba(196,168,124,0.15)]' : 'border-[#f0ede8]'
                  }`}
                  onClick={() => handleSelectTable(table.id)}
                >
                  <div className={`absolute top-3 right-3 w-[22px] h-[22px] rounded-full bg-[#c4a87c] flex items-center justify-center text-white ${isSelected ? 'flex' : 'hidden'}`}>
                    <Check className="w-[13px] h-[13px]" />
                  </div>

                  <div className="text-[15px] font-bold text-[#1a1a1a] mb-0.5 font-['Inter']">
                    Bàn {table.table_number}
                    {table.location && <span className="text-xs font-normal text-[#999] ml-1.5">{table.location}</span>}
                  </div>

                  {table.capacity > 6 && (
                    <div className={`absolute top-3.5 right-3.5 text-xs font-semibold text-[#c44b4b] ${isSelected ? 'right-10' : ''}`}>
                      Tối đa {table.capacity} Khách
                    </div>
                  )}
                  {table.capacity <= 6 && !isSelected && (
                    <div className="absolute top-3.5 right-3.5 text-xs font-semibold text-[#999]">
                      {table.capacity} Khách
                    </div>
                  )}

                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-[3px] rounded uppercase tracking-[0.05em] mt-1.5 ${getTableStatusBadgeClass(table.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getTableStatusDotClass(table.status)}`}></span>
                    {translateTableStatus(table.status)}
                  </span>

                  {table.status === 'OCCUPIED' && (
                    <>
                      <div className="text-xs text-[#999] mt-1.5 leading-relaxed">
                        <span className="text-[#555] font-medium">Khách đang dùng bữa</span>
                      </div>
                      {orderInfo && orderInfo.count > 0 && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-[#e8e5e0] text-xs">
                          <span className="text-[#888]">{orderInfo.count} Order đang chạy</span>
                          <span className="font-bold text-[#1a1a1a] text-[14px]">{formatCurrency(orderInfo.total)} đ</span>
                        </div>
                      )}
                    </>
                  )}

                  {table.status === 'RESERVED' && (
                    <div className="text-xs text-[#999] mt-1.5 leading-relaxed">
                      Bàn đã được đặt trước
                    </div>
                  )}

                  {table.status === 'AVAILABLE' && (
                    <div className="text-xs text-[#999] mt-1.5 leading-relaxed">
                      Bàn tiêu chuẩn ({table.capacity} chỗ)
                    </div>
                  )}

                  {table.status === 'MAINTENANCE' && (
                    <div className="text-xs text-[#999] mt-1.5 leading-relaxed">
                      Bàn đang bảo trì
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== RIGHT PANEL: Session Detail ===== */}
      <div className="flex-1 overflow-y-auto px-8 py-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#ddd] [&::-webkit-scrollbar-thumb]:rounded-full">
        {selectedTable ? (
          isSessionLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-[#aaa]">
              <RefreshCw className="w-16 h-16 opacity-20 mb-4 animate-spin" />
            </div>
          ) : activeSession ? (
            <>
              {/* Session Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[28px] font-extrabold text-[#1a1a1a] font-['Inter']">
                    Bàn {selectedTableData?.table_number}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md text-xs font-bold tracking-[0.03em] bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#43a047] animate-pulse"></span>
                    Session: {activeSession.status}
                  </span>
                  {selectedTableData?.location && (
                    <span className="text-[13px] text-[#999] ml-auto font-medium">
                      Khu Vực {selectedTableData.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Session Info Grid */}
              <div className="grid grid-cols-5 gap-0 bg-white border border-[#e8e5e0] rounded-xl mb-5 overflow-hidden">
                <div className="px-5 py-[18px] border-r border-[#f0ede8]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] mb-1.5">Khách Hàng</div>
                  <div className="text-[15px] font-bold text-[#1a1a1a]">
                    {activeSession.reservation?.customer_name || 'Vãng lai'}
                  </div>
                </div>
                <div className="px-5 py-[18px] border-r border-[#f0ede8]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] mb-1.5">Số Khách</div>
                  <div className="text-[15px] font-bold text-[#1a1a1a]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#aaa]" />
                      {activeSession.reservation?.number_of_guests || '–'} người
                    </span>
                  </div>
                </div>
                <div className="px-5 py-[18px] border-r border-[#f0ede8]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] mb-1.5">Bắt Đầu</div>
                  <div className="text-[15px] font-bold text-[#1a1a1a]">
                    {formatTime(activeSession.started_at)}
                  </div>
                </div>
                <div className="px-5 py-[18px] border-r border-[#f0ede8]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] mb-1.5">Đã Thanh Toán</div>
                  <div className="text-[18px] font-extrabold text-[#16a34a]">
                    {formatCurrency(paidAmount)} <span className="text-[13px] font-medium">đ</span>
                  </div>
                </div>
                <div className="px-5 py-[18px]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] mb-1.5">Còn Phải Thanh Toán</div>
                  <div className="text-[18px] font-extrabold text-[#c44b4b]">
                    {formatCurrency(pendingAmount)} <span className="text-[13px] font-medium">đ</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {activeSession.status === 'ACTIVE' && (
                <div className="grid grid-cols-2 gap-3.5 mb-7">
                  <button
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-[#d4a843] to-[#c49032] text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-[0_2px_8px_rgba(196,144,50,0.3)] hover:from-[#c49832] hover:to-[#b48028] hover:shadow-[0_4px_16px_rgba(196,144,50,0.4)] hover:-translate-y-[1px] font-['Inter']"
                    onClick={() => navigate('/staff/orders/create')}
                  >
                    <Plus className="w-[18px] h-[18px]" /> Tạo Order / Gọi Thêm Món
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#555] border-[1.5px] border-[#e0dcd5] rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[#faf9f7] hover:border-[#c4a87c] hover:text-[#333] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#e0dcd5] disabled:hover:text-[#555] font-['Inter']"
                    onClick={handleCloseSession}
                    disabled={uncompletedOrdersCount > 0}
                    title={uncompletedOrdersCount > 0 ? 'Vẫn còn Order chưa hoàn thành' : 'Thanh toán & Đóng phiên phục vụ'}
                  >
                    <Timer className="w-[18px] h-[18px]" /> Đóng Session / Thanh Toán Bàn
                  </button>
                </div>
              )}

              {/* Orders List */}
              <div className="bg-white border border-[#e8e5e0] rounded-xl overflow-hidden mb-6">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede8]">
                  <div className="flex items-center gap-2.5 text-base font-bold text-[#1a1a1a] font-['Inter']">
                    Danh Sách Order
                    <span className="text-[11px] font-semibold text-[#c4943a] bg-[#fef9ee] px-2.5 py-0.5 rounded-full">
                      {orders.length} đơn hàng
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-[#999]">Bộ lọc:</span>
                    <select
                      className="py-1.5 pl-3 pr-8 border border-[#e0dcd5] rounded-lg text-xs text-[#555] bg-white cursor-pointer outline-none appearance-none font-['Inter'] focus:border-[#c4a87c] bg-[url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'m6 9 6 6 6-6\'/></svg>')] bg-no-repeat bg-[right_10px_center]"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
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
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-[#ddd] mx-auto mb-3" />
                    <p className="text-sm text-[#999] font-medium">
                      {orders.length === 0 ? 'Chưa có Order nào' : 'Không có Order phù hợp bộ lọc'}
                    </p>
                    {orders.length === 0 && (
                      <p className="text-xs text-[#bbb] mt-1">
                        Nhấn nút "Tạo Order / Gọi Thêm Món" để bắt đầu.
                      </p>
                    )}
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="bg-[#faf9f7]">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] text-left border-b border-[#f0ede8]">Mã Đơn</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] text-left border-b border-[#f0ede8]">Source (Nguồn)</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] text-left border-b border-[#f0ede8]">Tổng Tiền</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] text-left border-b border-[#f0ede8]">Trạng Thái</th>
                        <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#999] text-center border-b border-[#f0ede8]">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr
                            className={`transition-colors duration-150 hover:bg-[#fdfcfb] cursor-pointer ${expandedOrderId === order.id ? 'bg-[#fdfcfb]' : ''}`}
                            onClick={() => toggleExpandOrder(order.id)}
                          >
                            <td className="px-5 py-3.5 text-[13px] text-[#333] border-b border-[#f5f3f0] align-middle">
                              <div className="font-bold text-[#1a1a1a] font-['Inter']">{order.order_code}</div>
                              <div className="flex items-center gap-1 text-[11px] text-[#aaa] mt-[3px]">
                                <Clock className="w-3 h-3" /> {formatTime(order.created_at || '')}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-[#333] border-b border-[#f5f3f0] align-middle">
                              <span className={`inline-flex px-2.5 py-[3px] rounded font-bold text-[11px] uppercase tracking-[0.05em] ${(order.order_type || 'STAFF').toLowerCase() === 'staff' ? 'bg-[#eef2ff] text-[#6366f1]' : 'bg-[#fef3c7] text-[#d97706]'}`}>
                                {order.order_type || 'STAFF'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-[#333] border-b border-[#f5f3f0] align-middle">
                              <div className="font-bold text-[#1a1a1a]">
                                {formatCurrency(Number(order.total_amount))} đ
                                <span className="block text-[10px] font-normal text-[#bbb] mt-0.5">Bao gồm thuế VAT (8%)</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-[#333] border-b border-[#f5f3f0] align-middle">
                              <span className={`inline-flex items-center px-3.5 py-[5px] rounded-md text-[11px] font-bold tracking-[0.03em] border-[1.5px] ${getStatusClasses(order.status)}`}>
                                {translateStatus(order.status).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-[#333] border-b border-[#f5f3f0] align-middle">
                              <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e5e0] bg-white text-[#888] cursor-pointer transition-colors duration-150 hover:bg-[#f5f3f0] hover:text-[#555] hover:border-[#d4cfc7]"
                                  title="Xem Chi Tiết"
                                  onClick={() => openOrderDetails(order.id)}
                                >
                                  <Eye className="w-[15px] h-[15px]" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          {expandedOrderId === order.id && (
                            <tr className="bg-[#faf9f7] border-t border-dashed border-[#e8e5e0]">
                              <td colSpan={5} className="p-0">
                                <div className="p-5 px-6">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#555]">
                                      <Utensils className="w-4 h-4 text-[#c4a87c]" />
                                      MÓN ĂN TRONG ĐƠN {order.order_code}
                                    </div>
                                    {order.user_id && (
                                      <div className="text-xs text-[#aaa] italic">
                                        Nhân viên ghi order: Staff #{order.user_id}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-3.5 flex-wrap mb-4">
                                    {order.order_items?.map((item) => (
                                      <div key={item.id} className="flex-1 min-w-[260px] max-w-[380px] bg-white border border-[#e8e5e0] rounded-[10px] px-4 py-3.5 flex gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 min-w-[32px] bg-[#f5f3f0] rounded-lg text-[13px] font-bold text-[#c4943a]">
                                          {item.quantity}×
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-[13px] font-bold text-[#1a1a1a] mb-[3px]">
                                            {item.menu_item_name || `Món #${item.menu_item_id}`}
                                          </div>
                                          {item.menu_item_description && (
                                            <div className="text-[11px] text-[#aaa] leading-[1.4]">
                                              {item.menu_item_description}
                                            </div>
                                          )}
                                          {item.note && (
                                            <div className="text-[11px] text-[#c4943a] mt-[3px] italic">
                                              Ghi chú: "{item.note}"
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-[14px] font-bold text-[#1a1a1a] whitespace-nowrap self-start">
                                          {formatCurrency(Number(item.subtotal))} đ
                                        </div>
                                      </div>
                                    ))}
                                    {(!order.order_items || order.order_items.length === 0) && (
                                      <div className="p-4 text-[#aaa] text-[13px]">
                                        Đơn hàng chưa có món nào.
                                      </div>
                                    )}
                                  </div>

                                  {/* PAYMENT INFO BLOCK */}
                                  {payments[order.id] && (
                                    <div className="bg-[#fcfaf8] border border-[#e8e5e0] rounded-[10px] p-4 mb-4 flex flex-col sm:flex-row justify-between gap-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-[13px]">
                                        <div className="flex">
                                          <span className="text-[#888] w-[110px]">Trạng thái:</span>
                                          {payments[order.id].status === 'PAID' ? (
                                            <span className="font-bold text-[#16a34a]">✓ Đã thanh toán</span>
                                          ) : payments[order.id].status === 'FAILED' ? (
                                            <span className="font-bold text-[#dc2626]">✕ Thanh toán thất bại</span>
                                          ) : payments[order.id].status === 'REFUNDED' ? (
                                            <span className="font-bold text-[#dc2626]">↩ Đã hoàn tiền</span>
                                          ) : (
                                            <span className="font-bold text-[#c4943a]">● Chờ thanh toán</span>
                                          )}
                                        </div>
                                        <div className="flex">
                                          <span className="text-[#888] w-[110px]">Số tiền:</span>
                                          <span className="font-bold text-[#1a1a1a]">{formatCurrency(Number(payments[order.id].amount))} đ</span>
                                        </div>
                                        <div className="flex">
                                          <span className="text-[#888] w-[110px]">Phương thức:</span>
                                          <span className="font-medium text-[#1a1a1a]">
                                            {payments[order.id].status === 'PENDING' ? '—' : (payments[order.id].payment_method === 'CASH' ? 'Tiền mặt' : payments[order.id].payment_method === 'BANK_TRANSFER' ? 'Chuyển khoản' : payments[order.id].payment_method)}
                                          </span>
                                        </div>
                                        <div className="flex">
                                          <span className="text-[#888] w-[110px]">Thanh toán lúc:</span>
                                          <span className="font-medium text-[#1a1a1a]">
                                            {payments[order.id].paid_at ? new Date(payments[order.id].paid_at!).toLocaleString('vi-VN') : '—'}
                                          </span>
                                        </div>
                                        {payments[order.id].payment_method === 'BANK_TRANSFER' && payments[order.id].transaction_code && (
                                          <div className="flex">
                                            <span className="text-[#888] w-[110px]">Mã giao dịch:</span>
                                            <span className="font-medium text-[#1a1a1a]">{payments[order.id].transaction_code}</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-end">
                                        {payments[order.id].status === 'PENDING' && (
                                          <button
                                            className="px-[18px] py-2 border-[1.5px] border-[#c4a87c] bg-[#c4a87c] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors duration-150 font-['Inter'] hover:bg-[#b4986c] hover:border-[#b4986c]"
                                            onClick={() => setPayingOrder(order)}
                                          >
                                            [Đã thanh toán]
                                          </button>
                                        )}
                                        {payments[order.id].status === 'PAID' && (
                                          <button
                                            disabled
                                            className="px-[18px] py-2 border-[1.5px] border-[#e8e5e0] bg-[#f5f3f0] text-[#16a34a] rounded-lg text-xs font-bold cursor-not-allowed font-['Inter']"
                                          >
                                            [✓ Đã thanh toán]
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-3.5 border-t border-dashed border-[#e8e5e0]">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1.5 text-xs text-[#6b8f5e]">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        {getStatusMessage(order)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="px-[18px] py-2 border-[1.5px] border-[#1a1a1a] rounded-lg bg-white text-[#1a1a1a] text-xs font-bold cursor-pointer transition-colors duration-150 font-['Inter'] hover:bg-[#1a1a1a] hover:text-white"
                                        onClick={() => openOrderDetails(order.id)}
                                      >
                                        Cập Nhật Trạng Thái Món
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            /* No active session */
            <div className="flex flex-col items-center justify-center h-full text-[#aaa]">
              <div className="w-20 h-20 rounded-full bg-[#f5f3f0] flex items-center justify-center mb-4">
                <span className="text-[32px] text-[#ccc]">?</span>
              </div>
              <h3 className="text-lg font-semibold text-[#666] mb-2">Không có phiên hoạt động</h3>
              <p className="text-sm text-[#999] text-center">
                Bàn này chưa được Check-in.<br />
                Vui lòng Check-in Booking để tạo phiên bàn.
              </p>
            </div>
          )
        ) : (
          /* No table selected */
          <div className="flex flex-col items-center justify-center h-full text-[#aaa]">
            <ShoppingCart className="w-16 h-16 opacity-20 mb-4" />
            <h3 className="text-lg font-semibold text-[#666] mb-2">Chọn một bàn để xem chi tiết</h3>
            <p className="text-sm text-[#999] text-center">Chọn bàn từ danh sách bên trái để xem thông tin phiên và đơn hàng.</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleOrderUpdated}
        />
      )}

      {/* Payment Modal for individual order */}
      {payingOrder && payments[payingOrder.id] && (
        <PaymentModal
          order={payingOrder}
          paymentAmount={Number(payments[payingOrder.id].amount)}
          isLoading={isConfirmingPayment}
          onClose={() => setPayingOrder(null)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* Payment Modal for entire session */}
      {isPayingSession && activeSession && selectedTableData && (
        <PaymentModal
          sessionName={`Bàn ${selectedTableData.table_number}`}
          paymentAmount={pendingAmount}
          isLoading={isConfirmingSessionPayment}
          onClose={() => setIsPayingSession(false)}
          onConfirm={handleConfirmSessionPayment}
        />
      )}

      <ConfirmModal
        isOpen={showCloseSessionConfirm}
        title="Xác nhận đóng phiên"
        message="Bàn đã hoàn tất phục vụ. Bạn có chắc chắn muốn đóng phiên và thanh toán?"
        onConfirm={executeCloseSession}
        onCancel={() => setShowCloseSessionConfirm(false)}
        variant="warning"
        confirmText="Đóng phiên"
      />
    </div>
  );
};

export default StaffOrders;
