import React, { useState } from 'react';
import { PaymentMethod } from '../../../types/payment.types';
import { Order } from '../../../types/order.types';
import { X, DollarSign, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  order?: Order;
  sessionName?: string;
  paymentAmount: number;
  onConfirm: (paymentMethod: PaymentMethod, transactionCode?: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  sessionName,
  paymentAmount,
  onConfirm,
  onClose,
  isLoading
}) => {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [transactionCode, setTransactionCode] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handleConfirm = () => {
    onConfirm(method, method === 'BANK_TRANSFER' ? transactionCode : undefined);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ede8]">
          <h2 className="text-[18px] font-bold text-[#1a1a1a] font-['Inter']">
            Xác nhận thanh toán
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f3f0] text-[#555] hover:bg-[#e8e5e0] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-[#faf9f7] border border-[#e8e5e0] rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#555]">{order ? 'Order:' : 'Phiên bàn:'}</span>
              <span className="font-bold text-[#1a1a1a]">{order ? order.order_code : sessionName}</span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-[#d4cfc7]">
              <span className="text-sm font-bold text-[#555]">Tổng tiền:</span>
              <span className="text-xl font-extrabold text-[#c44b4b]">{formatCurrency(paymentAmount)} đ</span>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold text-[#1a1a1a] mb-3">
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setMethod('CASH')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                  method === 'CASH'
                    ? 'border-[#c4943a] bg-[#fef9ee] text-[#c4943a]'
                    : 'border-[#e8e5e0] bg-white text-[#555] hover:border-[#d4cfc7]'
                }`}
              >
                <DollarSign className="w-4 h-4" /> Tiền mặt
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setMethod('BANK_TRANSFER')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                  method === 'BANK_TRANSFER'
                    ? 'border-[#3b82f6] bg-[#eff6ff] text-[#3b82f6]'
                    : 'border-[#e8e5e0] bg-white text-[#555] hover:border-[#d4cfc7]'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Chuyển khoản
              </button>
            </div>
          </div>

          {method === 'BANK_TRANSFER' && (
            <div className="mb-5 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                Mã giao dịch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isLoading}
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="Nhập mã giao dịch..."
                className="w-full px-4 py-3 border-[1.5px] border-[#e8e5e0] rounded-xl text-[14px] bg-[#faf9f7] outline-none transition-all focus:border-[#3b82f6] focus:bg-white focus:ring-[3px] focus:ring-[#3b82f6]/10"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-[#f0ede8] bg-[#faf9f7]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-[#555] bg-white border-[1.5px] border-[#e0dcd5] rounded-xl font-semibold hover:bg-[#f5f3f0] hover:text-[#333] transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-[#333] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận thanh toán'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
