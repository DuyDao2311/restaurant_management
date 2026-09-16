import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { publicReservationService } from '../services/publicReservationService';

const ReservationLookup = () => {
  const goldColor = '#B4975A';

  // Form State
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<{code?: string, phone?: string}>({});
  
  // API State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reservation, setReservation] = useState<any>(null);

  // Cancel State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'PENDING': return { text: 'Đang chờ xác nhận', color: 'bg-orange-100 text-orange-800' };
      case 'CONFIRMED': return { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' };
      case 'CHECKED_IN': return { text: 'Đã check-in', color: 'bg-green-100 text-green-800' };
      case 'CANCELLED': return { text: 'Đã hủy', color: 'bg-red-100 text-red-800' };
      case 'COMPLETED': return { text: 'Hoàn thành', color: 'bg-teal-100 text-teal-800' };
      case 'REJECTED': return { text: 'Đã từ chối', color: 'bg-red-800 text-white' };
      case 'NO_SHOW': return { text: 'Không đến', color: 'bg-gray-800 text-white' };
      default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setFormError({});
    setErrorMsg(null);
    setReservation(null);
    setCancelSuccess(false);

    let hasError = false;
    const errors: any = {};
    
    if (!code.trim()) {
      errors.code = 'Mã đặt bàn không được để trống.';
      hasError = true;
    } else if (!/^RSV-\d{8}-\d{3,}$/.test(code.trim())) {
      errors.code = 'Mã đặt bàn không đúng định dạng.';
      hasError = true;
    }

    if (!phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống.';
      hasError = true;
    } else if (!/^\+?[0-9]{9,15}$/.test(phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ.';
      hasError = true;
    }

    if (hasError) {
      setFormError(errors);
      return;
    }

    setIsLoading(true);
    try {
      const data = await publicReservationService.lookupReservation(code.trim(), phone.trim());
      setReservation(data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setErrorMsg('Không tìm thấy thông tin đặt bàn với mã và số điện thoại này.');
      } else {
        setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const data = await publicReservationService.cancelGuestReservation(code.trim(), phone.trim());
      setReservation(data);
      setShowCancelModal(false);
      setCancelSuccess(true);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
         setErrorMsg('Không tìm thấy thông tin đặt bàn với mã và số điện thoại này.');
      } else if (err.response && err.response.status === 400) {
         setErrorMsg('Không thể hủy đặt bàn ở trạng thái hiện tại.');
      } else {
         setErrorMsg('Không thể hủy đặt bàn. Vui lòng thử lại sau.');
      }
      setShowCancelModal(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-white min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24 pb-12 bg-[#FAF9F5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: goldColor }}>
              Guest Services
            </h3>
            <h2
              className="text-4xl sm:text-5xl mb-4 font-normal tracking-tight text-slate-900"
              style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
            >
              Tra cứu đặt bàn
            </h2>
            <p className="text-gray-500 text-sm">
              Xem chi tiết, trạng thái đặt bàn hoặc hủy đặt bàn (nếu chưa đến giờ).
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 shadow-sm border border-gray-100 mb-8">
            <form onSubmit={handleLookup} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Mã đặt bàn</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="Nhập mã đặt bàn (VD: RSV-...)"
                  />
                  {formError.code && <p className="text-red-500 text-xs mt-2">{formError.code}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="Nhập số điện thoại"
                  />
                  {formError.phone && <p className="text-red-500 text-xs mt-2">{formError.phone}</p>}
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`bg-[#111] text-white px-10 py-4 text-xs font-bold uppercase tracking-widest transition-colors inline-block ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                >
                  {isLoading ? 'Đang tra cứu...' : '🔍 Tra cứu'}
                </button>
              </div>
            </form>
          </div>

          {reservation && (
            <div className="bg-white p-8 sm:p-12 shadow-sm border border-gray-100">
              <h3 className="text-xl font-normal text-slate-900 mb-6 border-b pb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                THÔNG TIN ĐẶT BÀN
              </h3>
              
              {cancelSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                  Hủy đặt bàn thành công.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                <div>
                  <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Mã đặt bàn</span>
                  <span className="font-medium text-gray-900">{reservation.reservation_code}</span>
                </div>
                
                <div>
                  <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Khách hàng</span>
                  <span className="font-medium text-gray-900">{reservation.customer_name}</span>
                </div>

                <div>
                  <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Số điện thoại</span>
                  <span className="font-medium text-gray-900">{reservation.customer_phone.replace(/.(?=.{3})/g, '*')}</span>
                </div>

                <div>
                  <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Ngày dùng bữa</span>
                  <span className="font-medium text-gray-900">{reservation.reservation_date}</span>
                </div>

                <div>
                  <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Thời gian</span>
                  <span className="font-medium text-gray-900">{reservation.start_time.substring(0, 5)} - {reservation.end_time.substring(0, 5)}</span>
                </div>

                <div>
                  <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Số khách</span>
                  <span className="font-medium text-gray-900">{reservation.number_of_guests} người</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-gray-500 mb-2 text-xs uppercase tracking-wider">Trạng thái</span>
                  {(() => {
                    const statusObj = getStatusDisplay(reservation.status);
                    return (
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${statusObj.color}`}>
                        {statusObj.text}
                      </span>
                    );
                  })()}
                </div>

                {reservation.note && (
                  <div className="sm:col-span-2">
                    <span className="block text-gray-500 mb-1 text-xs uppercase tracking-wider">Ghi chú</span>
                    <span className="font-medium text-gray-900 whitespace-pre-line">{reservation.note}</span>
                  </div>
                )}

                {reservation.status === 'REJECTED' && reservation.rejection_reason && (
                  <div className="sm:col-span-2 bg-red-50 p-4 rounded border border-red-100">
                    <span className="block text-red-800 mb-1 text-xs font-bold uppercase tracking-wider">Lý do từ chối</span>
                    <span className="text-red-700">{reservation.rejection_reason}</span>
                  </div>
                )}
              </div>

              {/* Table Info */}
              <div className="mt-8 pt-8 border-t">
                 <h4 className="text-md font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs" style={{ color: goldColor }}>
                   THÔNG TIN BÀN
                 </h4>
                 {reservation.table ? (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded">
                       <div>
                         <span className="block text-gray-500 mb-1 text-xs">Bàn</span>
                         <span className="font-medium text-gray-900">{reservation.table.table_number || reservation.table.name || 'N/A'}</span>
                       </div>
                       <div>
                         <span className="block text-gray-500 mb-1 text-xs">Sức chứa</span>
                         <span className="font-medium text-gray-900">{reservation.table.capacity} người</span>
                       </div>
                    </div>
                 ) : (
                    <div className="text-sm bg-gray-50 p-4 rounded">
                       <span className="font-medium text-gray-500">Chưa được phân bàn</span>
                    </div>
                 )}
              </div>

              {/* Actions */}
              {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                <div className="mt-8 pt-6 border-t flex justify-end">
                   <button
                     onClick={() => setShowCancelModal(true)}
                     className="bg-white text-red-600 border border-red-200 px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                   >
                     Hủy đặt bàn
                   </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      
      <Footer />

      {/* Cancel Confirm Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 max-w-md w-full mx-4 rounded-sm shadow-xl relative text-center">
             <h3 className="text-2xl font-normal text-slate-900 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                Xác nhận hủy
             </h3>
             <p className="text-gray-600 mb-6">
               Bạn có chắc chắn muốn hủy đặt bàn này không?
             </p>
             <div className="text-left bg-gray-50 p-4 mb-6 rounded text-sm space-y-2">
                <div><span className="text-gray-500 w-24 inline-block">Mã đặt bàn:</span> <span className="font-medium">{reservation.reservation_code}</span></div>
                <div><span className="text-gray-500 w-24 inline-block">Ngày:</span> <span className="font-medium">{reservation.reservation_date}</span></div>
                <div><span className="text-gray-500 w-24 inline-block">Thời gian:</span> <span className="font-medium">{reservation.start_time.substring(0,5)} - {reservation.end_time.substring(0,5)}</span></div>
             </div>
             
             <div className="flex justify-between gap-4">
               <button
                 onClick={() => setShowCancelModal(false)}
                 disabled={isCancelling}
                 className="flex-1 bg-gray-100 text-gray-800 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
               >
                 Quay lại
               </button>
               <button
                 onClick={handleCancel}
                 disabled={isCancelling}
                 className="flex-1 bg-red-600 text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
               >
                 {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationLookup;
