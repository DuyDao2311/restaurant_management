import React, { useState } from 'react';
import { X, CreditCard, Clock, Calendar, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Payment, PaymentMethod } from '../../../types/payment.types';
import { paymentService } from '../../../services/paymentService';
import { useToast } from '../../../context/ToastContext';

interface StaffPaymentDetailModalProps {
  payment: Payment;
  onClose: () => void;
}

const StaffPaymentDetailModal: React.FC<StaffPaymentDetailModalProps> = ({
  payment,
  onClose,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PAID': return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
      case 'REFUNDED': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'FAILED': return 'Thất bại';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const translateMethod = (m: string) => {
    if (m === 'CASH') return 'Tiền mặt';
    if (m === 'BANK_TRANSFER') return 'Chuyển khoản';
    return m;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
                Chi Tiết Thanh Toán
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <div className="space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Mã Giao Dịch</p>
                  <p className="text-xl font-bold text-gray-900">{payment.payment_code}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center ${getStatusColor(payment.status)}`}>
                  {payment.status === 'PAID' && <CheckCircle className="w-4 h-4 mr-1.5" />}
                  {payment.status === 'FAILED' && <AlertTriangle className="w-4 h-4 mr-1.5" />}
                  {getStatusText(payment.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">Đơn hàng</p>
                  <p className="font-semibold text-gray-800 mt-1">{payment.order_code || `ID: ${payment.order_id}`}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <p className="text-xs font-medium text-indigo-500 uppercase">Tổng tiền</p>
                  <p className="font-bold text-indigo-700 mt-1 text-lg">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(payment.amount))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 flex items-center mb-1"><Calendar className="w-4 h-4 mr-1" /> Ngày tạo</p>
                  <p className="font-medium text-gray-900">{new Date(payment.created_at || '').toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center mb-1"><Clock className="w-4 h-4 mr-1" /> Thời gian xử lý</p>
                  <p className="font-medium text-gray-900">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleString('vi-VN') : '---'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Phương thức</p>
                    <p className="font-semibold text-gray-900">{translateMethod(payment.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Mã đối soát (TXN)</p>
                    <p className="font-semibold text-gray-900">{payment.transaction_code || 'Không có'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPaymentDetailModal;
