import { useState, useEffect, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { publicReservationService } from '../services/publicReservationService';

const Home = () => {
  const goldColor = '#B4975A';
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#booking') {
      setTimeout(() => {
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  // Booking Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleBooking = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên.");
      return;
    }
    const phoneRegex = /^\+?[0-9]{9,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMsg("Số điện thoại không hợp lệ.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    if (selectedDate < today) {
      setErrorMsg("Ngày dùng bữa không được ở trong quá khứ.");
      return;
    }

    if (!date || !time || !guests) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Tính end_time: start_time + 2 tiếng
      const [hours, minutes] = time.split(':');
      const startHours = parseInt(hours);
      const endHours = (startHours + 2) % 24;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;

      const payload = {
        reservation_date: date,
        start_time: `${time}:00`,
        end_time: `${endTime}:00`,
        number_of_guests: parseInt(guests),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        note: notes.trim() || null
      };

      const res = await publicReservationService.createReservation(payload);

      setSuccessData({
        code: res.reservation_code,
        name: res.customer_name,
        date: res.reservation_date,
        time: `${res.start_time.substring(0, 5)} - ${res.end_time.substring(0, 5)}`,
        guests: res.number_of_guests,
        status: res.status
      });

    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.detail;
      if (typeof message === 'string') {
        setErrorMsg(message);
      } else if (Array.isArray(message)) {
        setErrorMsg(message[0]?.msg || "Dữ liệu không hợp lệ.");
      } else {
        setErrorMsg("Có lỗi xảy ra khi đặt bàn. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-white">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop")' }}
        >
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center">
          <div
            className="inline-block border rounded-full px-6 py-2 mb-8 text-xs font-bold tracking-[0.2em] uppercase"
            style={{ borderColor: goldColor, color: goldColor }}
          >
            MICHELIN GUIDE 3 STARS 2024
          </div>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl mb-6 font-normal tracking-tight text-slate-900"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Nghệ Thuật Ẩm Thực Đỉnh Cao
          </h1>

          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Trải nghiệm hành trình vị giác thăng hoa kết hợp tinh hoa ẩm thực Pháp cổ điển và nguyên liệu thượng hạng Việt Nam dưới bàn tay tài hoa của bếp trưởng.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/menu"
              className="w-full sm:w-auto bg-[#111] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Trải nghiệm thực đơn
            </Link>
            <Link
              to="/#booking"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', '/#booking');
              }}
              className="w-full sm:w-auto bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors border"
              style={{ color: goldColor, borderColor: goldColor }}
            >
              Đặt bàn trực tuyến
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Story / Philosophy Section */}
      <section className="py-24 bg-[#FAF9F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="pr-0 lg:pr-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: goldColor }}>
                Triết Lý Ẩm Thực
              </h3>
              <h2
                className="text-4xl sm:text-5xl mb-6 font-normal tracking-tight text-slate-900 leading-tight"
                style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
              >
                Giao Thoa Văn Hóa Pháp - Việt Qua Ngôn Ngữ Fine Dining
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Được dẫn dắt bởi Executive Chef Pierre Lambert, từng phục vụ tại các nhà hàng 3 sao Michelin danh tiếng tại Paris, L'Étoile Gastronomie thổi một làn gió mới vào nghệ thuật ẩm thực. Chúng tôi kết hợp kỹ thuật chế biến kinh điển của Pháp với nguồn nông sản tươi ngon, tinh túy từ các vùng miền đất Việt.
              </p>

              <div className="w-full h-px bg-gray-200 mb-8"></div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-8">
                <div>
                  <h4 className="text-xl font-normal text-slate-900 mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>Pierre Lambert</h4>
                  <p className="text-sm text-gray-500">Executive Chef & Founder</p>
                </div>
                <div className="hidden sm:block w-px h-10 bg-gray-200"></div>
                <div>
                  <h4 className="text-xl font-normal text-slate-900 mb-1" style={{ fontFamily: '"Playfair Display", serif' }}>15+ Năm</h4>
                  <p className="text-sm text-gray-500">Kinh nghiệm Michelin 3 Sao</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop"
                alt="Chef Pierre Lambert"
                className="w-full h-auto object-cover grayscale"
                style={{ aspectRatio: '3/4' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Signature Menu Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: goldColor }}>
              Thực Đơn Thử Món Cao Cấp
            </h3>
            <h2
              className="text-4xl sm:text-5xl mb-6 font-normal tracking-tight text-slate-900"
              style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
            >
              Bộ Sưu Tập Signature
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Những tuyệt tác ẩm thực được thiết kế riêng cho mùa này, đánh thức mọi giác quan của thực khách.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Menu Item 1 */}
            <div className="bg-[#FAF9F5] border border-gray-100 flex flex-col h-full">
              <img src="https://images.unsplash.com/photo-1544025162-8316c0db4a9b?q=80&w=600&auto=format&fit=crop" alt="Bò Wagyu" className="w-full h-64 object-cover" />
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-[#EAE6DF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800">Món Chính</span>
                  <span className="text-sm font-medium" style={{ color: goldColor }}>2.450.000đ</span>
                </div>
                <h4 className="text-xl font-normal text-slate-900 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Bò Wagyu A5 Miyazaki</h4>
                <p className="text-sm text-gray-500 mb-8 flex-grow">Thăn nội bò Wagyu Nhật Bản nướng than binchotan, sốt nấm truffle đen và măng tây trắng Đà Lạt.</p>
                <button className="w-full py-3 text-xs font-bold uppercase tracking-widest border transition-colors hover:bg-gray-50" style={{ color: goldColor, borderColor: goldColor }}>
                  Thử thực đơn này
                </button>
              </div>
            </div>

            {/* Menu Item 2 */}
            <div className="bg-[#FAF9F5] border border-gray-100 flex flex-col h-full">
              <img src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600&auto=format&fit=crop" alt="Sò Điệp Hokkaido" className="w-full h-64 object-cover" />
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-[#EAE6DF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800">Món Khai Vị</span>
                  <span className="text-sm font-medium" style={{ color: goldColor }}>1.850.000đ</span>
                </div>
                <h4 className="text-xl font-normal text-slate-900 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Sò Điệp Hokkaido Khói Trầm</h4>
                <p className="text-sm text-gray-500 mb-8 flex-grow">Sò điệp Hokkaido áp chảo dùng kèm kem súp lơ trắng, trứng cá tầm Oscietra và dầu hẹ tây.</p>
                <button className="w-full py-3 text-xs font-bold uppercase tracking-widest border transition-colors hover:bg-gray-50" style={{ color: goldColor, borderColor: goldColor }}>
                  Thử thực đơn này
                </button>
              </div>
            </div>

            {/* Menu Item 3 */}
            <div className="bg-[#FAF9F5] border border-gray-100 flex flex-col h-full">
              <img src="https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=600&auto=format&fit=crop" alt="Gan Ngỗng Béo" className="w-full h-64 object-cover" />
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-[#EAE6DF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-800">Món Đặc Biệt</span>
                  <span className="text-sm font-medium" style={{ color: goldColor }}>1.650.000đ</span>
                </div>
                <h4 className="text-xl font-normal text-slate-900 mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Gan Ngỗng Béo Áp Chảo</h4>
                <p className="text-sm text-gray-500 mb-8 flex-grow">Gan ngỗng áp chảo ăn kèm mứt vả Huế, bánh mì brioche nướng bơ Pháp và sốt vang đỏ Port.</p>
                <button className="w-full py-3 text-xs font-bold uppercase tracking-widest border transition-colors hover:bg-gray-50" style={{ color: goldColor, borderColor: goldColor }}>
                  Thử thực đơn này
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Facilities Section */}
      <section className="bg-white pb-24">
        {/* Wine Cellar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative shadow-xl">
              <img src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop" alt="Wine Cellar" className="w-full h-auto object-cover grayscale" />
            </div>
            <div className="order-1 lg:order-2 pl-0 lg:pl-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: goldColor }}>
                Trải Nghiệm Sommelier Đỉnh Cao
              </h3>
              <h2
                className="text-4xl sm:text-5xl mb-6 font-normal tracking-tight text-slate-900 leading-tight"
                style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
              >
                Hầm Rượu Với Hơn 1.500 Nhãn Thượng Hạng
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Được tuyển chọn kỹ lưỡng bởi chuyên gia thử rượu quốc gia, hầm rượu của chúng tôi sở hữu những chai vang từ các điền trang danh tiếng tại Bordeaux, Burgundy cùng các dòng sưu tập giới hạn hiếm có trên thế giới.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start text-gray-600">
                  <svg className="w-5 h-5 mr-3 mt-0.5" style={{ color: goldColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tư vấn pairing riêng biệt cho từng món ăn
                </li>
                <li className="flex items-start text-gray-600">
                  <svg className="w-5 h-5 mr-3 mt-0.5" style={{ color: goldColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sưu tập Grand Cru Classé từ Pháp
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* VIP Room */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="pr-0 lg:pr-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: goldColor }}>
                Không Gian Riêng Tư Đẳng Cấp
              </h3>
              <h2
                className="text-4xl sm:text-5xl mb-6 font-normal tracking-tight text-slate-900 leading-tight"
                style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
              >
                Không Gian Riêng Tư Đẳng Cấp VIP
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Phòng tiệc riêng tư mang phong cách hoàng gia Pháp kết hợp nét đương đại tinh tế, trang bị hệ thống âm thanh riêng, quản gia túc trực và tầm nhìn toàn cảnh thành phố lung linh về đêm.
              </p>
            </div>
            <div className="relative shadow-xl">
              <img src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=800&auto=format&fit=crop" alt="VIP Room" className="w-full h-auto object-cover grayscale" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Booking Section */}
      <section id="booking" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAF9F5] p-10 sm:p-16 shadow-sm border border-gray-100">
            {successData ? (
              <div className="text-center p-8 bg-white border border-green-200 rounded shadow-sm">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-normal text-slate-900 mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>Đặt bàn thành công!</h3>
                <p className="text-gray-500 mb-8">Nhà hàng sẽ xác nhận đặt bàn của quý khách trong thời gian sớm nhất.</p>

                <div className="text-left bg-[#FAF9F5] p-6 rounded-lg mb-8 max-w-sm mx-auto">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-gray-500">Mã đặt bàn:</div>
                    <div className="font-bold text-gray-900">{successData.code}</div>

                    <div className="text-gray-500">Khách:</div>
                    <div className="font-medium text-gray-900">{successData.name}</div>

                    <div className="text-gray-500">Ngày:</div>
                    <div className="font-medium text-gray-900">{successData.date}</div>

                    <div className="text-gray-500">Giờ:</div>
                    <div className="font-medium text-gray-900">{successData.time}</div>

                    <div className="text-gray-500">Số khách:</div>
                    <div className="font-medium text-gray-900">{successData.guests}</div>

                    <div className="text-gray-500">Trạng thái:</div>
                    <div className="font-medium text-amber-600">
                      {successData.status === 'PENDING' ? 'Đang chờ xác nhận (PENDING)' : successData.status}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSuccessData(null);
                    setName('');
                    setPhone('');
                    setDate('');
                    setTime('');
                    setGuests('2');
                    setNotes('');
                  }}
                  className="bg-[#111] text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  Đặt bàn khác
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: goldColor }}>
                    Đặt Bàn Trực Tuyến
                  </h3>
                  <h2
                    className="text-4xl sm:text-5xl mb-4 font-normal tracking-tight text-slate-900"
                    style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
                  >
                    Trải Nghiệm Tại RESTAURANT
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Vui lòng điền thông tin bên dưới để chúng tôi chuẩn bị đón tiếp quý khách chu đáo nhất.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Họ và Tên</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                        placeholder="Nguyễn Văn A"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                        placeholder="0901 234 567"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ngày dùng bữa</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={getTodayString()}
                        className="w-full bg-white border border-gray-200 p-4 text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Khung giờ</label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-4 text-gray-800 focus:outline-none focus:border-gray-400 transition-colors appearance-none"
                        required
                      >
                        <option value="" disabled>Chọn giờ</option>
                        <option value="11:30">11:30 (Trưa)</option>
                        <option value="12:00">12:00 (Trưa)</option>
                        <option value="18:30">18:30 (Tối)</option>
                        <option value="19:00">19:00 (Tối)</option>
                        <option value="19:30">19:30 (Tối)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Số lượng khách</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full bg-white border border-gray-200 p-4 text-gray-800 focus:outline-none focus:border-gray-400 transition-colors appearance-none"
                      >
                        <option value="1">1 Khách</option>
                        <option value="2">2 Khách (Bàn đôi)</option>
                        <option value="4">3 - 4 Khách</option>
                        <option value="8">5 - 8 Khách</option>
                        <option value="10">Từ 9 Khách trở lên</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ghi chú dị ứng hoặc sở thích ẩm thực</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors h-32 resize-none"
                      placeholder="Ví dụ: Dị ứng hải sản, kỷ niệm ngày cưới, yêu cầu ghế trẻ em..."
                    ></textarea>
                  </div>

                  <div className="pt-4 text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`bg-[#111] text-white px-10 py-4 text-xs font-bold uppercase tracking-widest transition-colors inline-block ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt bàn'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
