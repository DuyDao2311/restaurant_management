import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RestaurantTable, TableQRCode } from '../../../types/table';
import { tableService } from '../../../services/tableService';
import TableStatusBadge from '../../admin/Tables/TableStatusBadge';

interface StaffTableDetailModalProps {
  table: RestaurantTable;
  onClose: () => void;
}

const StaffTableDetailModal: React.FC<StaffTableDetailModalProps> = ({ table, onClose }) => {
  const [qrData, setQrData] = useState<TableQRCode | null>(null);
  const [isQRLoading, setIsQRLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchQR = async () => {
    setIsQRLoading(true);
    setQrError(null);
    try {
      const response = await tableService.getTableQR(table.id);
      if (response.success && response.data) {
        setQrData(response.data);
      } else {
        setQrError('Không có dữ liệu QR hợp lệ.');
      }
    } catch (err) {
      console.error(err);
      setQrError('Không thể tải mã QR.');
    } finally {
      setIsQRLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
  }, [table.id]);

  const handleCopy = async () => {
    if (!qrData?.qr_url) return;
    try {
      await navigator.clipboard.writeText(qrData.qr_url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Chi tiết Bàn {table.table_number}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {copySuccess && (
          <div className="mx-6 mt-4 p-3 rounded-md border flex items-center gap-3 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Đã sao chép link QR thành công!</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Thông tin bàn */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Thông tin</h3>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Mã bàn</span>
                  <span className="text-base font-bold text-gray-900">{table.table_number}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Sức chứa</span>
                  <span className="text-base text-gray-900">{table.capacity} khách</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Khu vực</span>
                  <span className="text-base text-gray-900">{table.location || <span className="italic text-gray-400">Chưa xếp</span>}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-500 mb-1">Trạng thái</span>
                  <TableStatusBadge status={table.status} />
                </div>
                {table.created_at && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Ngày tạo</span>
                    <span className="text-sm text-gray-700">{new Date(table.created_at).toLocaleString()}</span>
                  </div>
                )}
                {table.updated_at && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Lần cuối cập nhật</span>
                    <span className="text-sm text-gray-700">{new Date(table.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Mã QR Khách Hàng</h3>
                <button
                  onClick={fetchQR}
                  className="text-gray-500 hover:text-gray-900 p-2 rounded-md hover:bg-gray-200 transition-colors"
                  title="Tải lại QR"
                >
                  <RefreshCw className={`w-4 h-4 ${isQRLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isQRLoading ? (
                <div className="flex-1 flex flex-col justify-center items-center py-10 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p>Đang tải mã QR...</p>
                </div>
              ) : qrError || !qrData?.qr_url ? (
                <div className="flex-1 flex flex-col justify-center items-center py-10 text-red-500 text-center w-full">
                  <AlertCircle className="w-10 h-10 mb-2" />
                  <p className="font-medium">{qrError || 'Mã QR không khả dụng.'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <QRCodeSVG
                      value={qrData.qr_url}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 block">Link đặt món</label>
                    <div className="flex w-full">
                      <input
                        type="text"
                        readOnly
                        value={qrData.qr_url}
                        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-l-md text-gray-600 text-sm focus:outline-none"
                      />
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffTableDetailModal;
