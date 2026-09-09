import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Copy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { tableService } from '../../../services/tableService';
import { RestaurantTable, TableQRCode } from '../../../types/table';
import TableStatusBadge from './TableStatusBadge';

const TableDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [qrData, setQrData] = useState<TableQRCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQRLoading, setIsQRLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const fetchTable = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await tableService.getTable(parseInt(id, 10));
      if (response.success) {
        setTable(response.data);
      } else {
        setError('Không thể tải thông tin bàn.');
      }
    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra khi tải thông tin bàn.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQR = async () => {
    if (!id) return;
    setIsQRLoading(true);
    setQrError(null);
    try {
      const response = await tableService.getTableQR(parseInt(id, 10));
      if (response.success && response.data) {
        setQrData(response.data);
      } else {
        setQrError('Không có dữ liệu QR hợp lệ.');
      }
    } catch (err) {
      console.error(err);
      setQrError('Unable to load QR Code.');
    } finally {
      setIsQRLoading(false);
    }
  };

  useEffect(() => {
    fetchTable();
    fetchQR();
  }, [id]);

  const handleCopy = async () => {
    if (!qrData?.qr_url) return;
    try {
      await navigator.clipboard.writeText(qrData.qr_url);
      setCopySuccess(true);
      setCopyError(false);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      setCopyError(true);
      setCopySuccess(false);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full flex flex-col bg-gray-50/50">
        <div className="flex items-center space-x-2 text-gray-500 mb-6 cursor-pointer hover:text-gray-900 w-fit" onClick={() => navigate('/admin/tables')}>
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại Tables</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="p-6 h-full flex flex-col bg-gray-50/50">
        <div className="flex items-center space-x-2 text-gray-500 mb-6 cursor-pointer hover:text-gray-900 w-fit" onClick={() => navigate('/admin/tables')}>
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại Tables</span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">{error || 'Không tìm thấy bàn'}</p>
          <button
            onClick={fetchTable}
            className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50 relative overflow-y-auto">
      {/* Notifications */}
      {copySuccess && (
        <div className="fixed top-4 right-4 z-[60] p-4 rounded-md shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">QR URL copied successfully.</span>
        </div>
      )}
      {copyError && (
        <div className="fixed top-4 right-4 z-[60] p-4 rounded-md shadow-lg border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Unable to copy QR URL.</span>
        </div>
      )}

      <div className="flex items-center space-x-2 text-gray-500 mb-6 cursor-pointer hover:text-gray-900 w-fit" onClick={() => navigate('/admin/tables')}>
        <ArrowLeft className="w-5 h-5" />
        <span>Quay lại Tables</span>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bàn {table.table_number}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center border-b pb-4">
            Thông tin bàn
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm text-gray-500 font-medium">Mã bàn</div>
              <div className="col-span-2 text-base font-medium text-gray-900">{table.table_number}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm text-gray-500 font-medium">Số lượng khách</div>
              <div className="col-span-2 text-base text-gray-900">{table.capacity} people</div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm text-gray-500 font-medium">Khu vực</div>
              <div className="col-span-2 text-base text-gray-900">{table.location || <span className="italic text-gray-400">Not assigned</span>}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm text-gray-500 font-medium">Trạng thái</div>
              <div className="col-span-2">
                <TableStatusBadge status={table.status} />
              </div>
            </div>

            {table.created_at && (
              <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
                <div className="text-sm text-gray-500 font-medium">Ngày tạo</div>
                <div className="col-span-2 text-sm text-gray-700">{new Date(table.created_at).toLocaleString()}</div>
              </div>
            )}

            {table.updated_at && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500 font-medium">Ngày cập nhật</div>
                <div className="col-span-2 text-sm text-gray-700">{new Date(table.updated_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* QR Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">Table QR Code</h2>
            <button
              onClick={fetchQR}
              className="text-gray-500 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Refresh QR"
            >
              <RefreshCw className={`w-4 h-4 ${isQRLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            {isQRLoading ? (
              <div className="flex flex-col items-center text-gray-500 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p>Loading QR Code...</p>
              </div>
            ) : qrError || !qrData?.qr_url || !qrData?.qr_token ? (
              <div className="flex flex-col items-center text-red-500 space-y-4 p-6 bg-red-50 rounded-lg w-full">
                <AlertCircle className="w-10 h-10" />
                <p className="font-medium text-center">{qrError || 'QR Code is unavailable.'}</p>
                <button
                  onClick={fetchQR}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full max-w-sm mx-auto">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                  <QRCodeSVG
                    value={qrData.qr_url}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="w-full space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">QR URL</label>
                  <div className="flex mt-1">
                    <input
                      type="text"
                      readOnly
                      value={qrData.qr_url}
                      className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-md text-gray-600 sm:text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none transition-colors"
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
    </div>
  );
};

export default TableDetail;
