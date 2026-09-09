import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, RefreshCw, Bell, Wifi, ArrowRight } from 'lucide-react';
import { tableService } from '../services/tableService';
import { staffCallService } from '../services/staffCallService';
import { TablePublicQRResponse } from '../types/table';

const TablePage = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<TablePublicQRResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<'INVALID' | 'NETWORK' | null>(null);
  
  // Call Staff States
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [hasPendingCall, setHasPendingCall] = useState(false);

  const handleCallStaff = async () => {
    if (!table) return;
    setIsCalling(true);
    try {
      await staffCallService.createCall(table.table_id, 'CALL_STAFF');
      setHasPendingCall(true);
      setShowCallModal(false);
      alert('Đã gọi nhân viên thành công. Vui lòng đợi trong giây lát!');
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response.data.detail);
        setHasPendingCall(true);
        setShowCallModal(false);
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } finally {
      setIsCalling(false);
    }
  };

  const fetchTableData = async () => {
    if (!qrToken) {
      setErrorType('INVALID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorType(null);

    try {
      const response = await tableService.validateQRToken(qrToken);
      if (response.success && response.data) {
        setTable(response.data);
      } else {
        setErrorType('INVALID');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setErrorType('INVALID');
        } else {
          setErrorType('NETWORK');
        }
      } else {
        setErrorType('NETWORK');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [qrToken]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-6 h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A]"></div>
          <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin bàn...</p>
        </div>
      );
    }

    if (errorType === 'INVALID') {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full mx-auto mt-20">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Mã QR không hợp lệ</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Mã QR này không tồn tại hoặc đã hết hạn.<br />
            Vui lòng liên hệ nhân viên để được hỗ trợ.
          </p>
        </div>
      );
    }

    if (errorType === 'NETWORK') {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full mx-auto mt-20">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 mb-6">
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Lỗi kết nối</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Không thể kết nối đến hệ thống nhà hàng.
          </p>
          <button
            onClick={fetchTableData}
            className="w-full flex items-center justify-center px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-black transition-colors focus:outline-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </button>
        </div>
      );
    }

    if (table) {
      return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto animate-in fade-in duration-700 mt-6 pb-32">
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-white/50">
              {/* Simple Fork & Knife icon substitution */}
              <div className="text-[#D4AF37] font-serif text-2xl tracking-tighter italic font-light">Y-I</div>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
              Kính chào quý khách tại
            </p>
            <h1 className="text-2xl font-serif tracking-widest text-[#1A1A1A]">
              RESTAURANT
            </h1>
          </div>

          {/* Main Card */}
          <div className="w-full bg-white rounded-[2rem] p-6 mb-8 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EAE6DF]">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#EAE6DF] rounded-tl"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#EAE6DF] rounded-tr"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#EAE6DF] rounded-bl"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#EAE6DF] rounded-br"></div>

            <div className="flex flex-col items-center text-center mt-2">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mb-4">
                Quý khách đang kết nối tại
              </p>

              <div className="w-full bg-gradient-to-b from-[#FDFCFB] to-[#F5F3F0] border border-[#EAE6DF] rounded-2xl py-5 mb-6 shadow-sm">
                <h2 className="text-3xl font-serif text-[#1A1A1A] tracking-wide">
                  BÀN {table.table_number}
                </h2>
              </div>

              <div className="w-full flex justify-between items-center px-2 mb-2">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Số lượng</span>
                  <span className="text-[13px] text-[#1A1A1A] font-medium">{table.capacity} Khách</span>
                </div>

                <div className="w-[1px] h-8 bg-[#EAE6DF]"></div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Trạng thái</span>
                  <div className="bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-[11px] font-medium">
                    {table.status === 'AVAILABLE' ? 'Sẵn sàng' :
                      table.status === 'OCCUPIED' ? 'Có khách' :
                        table.status === 'RESERVED' ? 'Đã đặt' : 'Bảo trì'}
                  </div>
                </div>

                <div className="w-[1px] h-8 bg-[#EAE6DF]"></div>

                <div className="flex flex-col items-center flex-1">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1">Khu vực</span>
                  <span className="text-[13px] text-[#1A1A1A] font-medium">{table.location || 'Chung'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subtext */}
          <div className="text-center px-4 mb-8">
            <p className="italic text-gray-600 font-serif mb-2 text-[15px]">
              "Bàn của quý khách đã được chuẩn bị chu toàn."
            </p>
            <p className="text-gray-400 text-xs font-light">
              Chúc quý khách có trải nghiệm ẩm thực thăng hoa và trọn vẹn.
            </p>
          </div>

          {/* Button */}
          <div className="w-full px-2 flex flex-col items-center">
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-[#231F20] text-[#F3E5AB] py-4 rounded-2xl text-sm font-semibold tracking-widest uppercase flex justify-center items-center gap-3 hover:bg-black transition-colors shadow-xl"
            >
              Khám phá thực đơn
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-gray-400 mt-3 font-light">
              Xem ẩm thực cao cấp & gọi món trực tuyến tức thì tại bàn
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F6] font-sans selection:bg-[#EAE6DF]">
      {/* Top Bar */}
      <div className="w-full p-5 flex justify-between items-center max-w-md mx-auto">
        <div className="bg-[#E8F5E9] border border-[#C8E6C9] px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
          <span className="text-[#2E7D32] text-[10px] font-bold tracking-wider">TRỰC TUYẾN</span>
        </div>
      </div>

      <div className="w-full px-4">
        {renderContent()}
      </div>

      {/* Bottom Action Bar */}
      {table && !isLoading && (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#FBF9F6] via-[#FBF9F6] to-transparent pb-6 pt-10 px-4">
          <div className="max-w-md mx-auto flex gap-3">
            <button 
              onClick={() => setShowCallModal(true)}
              disabled={hasPendingCall}
              className={`flex-1 bg-white border border-[#EAE6DF] py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[#1A1A1A] text-[13px] font-medium shadow-[0_4px_15px_rgb(0,0,0,0.03)] transition-colors ${hasPendingCall ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              <Bell className={`w-4 h-4 ${hasPendingCall ? 'text-gray-400' : 'text-[#D4AF37]'}`} />
              {hasPendingCall ? 'Đang đợi NV...' : 'Yêu cầu phục vụ'}
            </button>
            <button className="flex-1 bg-white border border-[#EAE6DF] py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[#1A1A1A] text-[13px] font-medium shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:bg-gray-50 transition-colors">
              <Wifi className="w-4 h-4 text-[#D4AF37]" />
              Wi-Fi Nhà Hàng
            </button>
          </div>
        </div>
      )}

      {/* Call Staff Confirmation Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gọi nhân viên</h3>
            <p className="text-gray-500 text-sm mb-6">Bạn có chắc chắn muốn gọi nhân viên phục vụ đến bàn này không?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCallModal(false)}
                disabled={isCalling}
                className="flex-1 py-3 px-4 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleCallStaff}
                disabled={isCalling}
                className="flex-1 py-3 px-4 rounded-xl font-medium bg-[#1A1A1A] text-white hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                {isCalling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablePage;
