import { Link } from 'react-router-dom';
import { type CSSProperties } from 'react';

const GlobeIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.974 0-5.748.536-8.22 1.487m16.44.226a12.08 12.08 0 0 1-3.6 7.64M3.56 12.213a12.08 12.08 0 0 0 3.6 7.64m11.28-7.64A12.08 12.08 0 0 1 12 10.5M3.56 12.213A12.08 12.08 0 0 0 12 10.5" />
  </svg>
);

const CameraIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const EnvelopeIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const MapPinIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const PhoneIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const Footer = () => {
  const goldColor = '#B4975A';
  
  return (
    <footer className="bg-[#FAF9F5] text-slate-800 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand & Address */}
          <div>
            <Link 
              to="/" 
              className="inline-block text-3xl tracking-[0.1em] text-slate-900 mb-6 uppercase" 
              style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
            >
              L'ÉTOILE
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 pr-4">
              Nhà hàng Fine Dining đạt chuẩn 3 sao Michelin, mang đến trải nghiệm ẩm thực đỉnh cao giữa lòng thành phố.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#EAE6DF] flex items-center justify-center text-gray-800 hover:bg-gray-300 transition-colors">
                <GlobeIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#EAE6DF] flex items-center justify-center text-gray-800 hover:bg-gray-300 transition-colors">
                <CameraIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#EAE6DF] flex items-center justify-center text-gray-800 hover:bg-gray-300 transition-colors">
                <EnvelopeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Hours */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: goldColor }}>
              Giờ Mở Cửa
            </h3>
            <ul className="space-y-4 text-sm text-gray-500">
              <li>
                Thứ Ba - Chủ Nhật
              </li>
              <li>
                Bữa trưa: 11:30 - 14:00
              </li>
              <li>
                Bữa tối: 18:00 - 22:30
              </li>
              <li>
                Nghỉ thứ Hai hàng tuần
              </li>
            </ul>
          </div>
          
          {/* Dress code */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: goldColor }}>
              Chính Sách Trang Phục
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed pr-2">
              <span className="font-semibold text-gray-800">Lịch sự & Trang nhã (Smart Elegant):</span> Chúng tôi khuyến khích quý khách mặc trang phục lịch sự, trang nhã. Trang phục thể thao hoặc dép lê không phù hợp với không gian nhà hàng.
            </p>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: goldColor }}>
              Liên Hệ
            </h3>
            <ul className="space-y-5 text-sm text-gray-500">
              <li className="flex items-start">
                <MapPinIcon className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" style={{ color: goldColor }} />
                <span>88 Lê Thánh Tôn, Quận 1,<br/>TP.HCM</span>
              </li>
              <li className="flex items-center">
                <PhoneIcon className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: goldColor }} />
                <span>+84 (0) 28 3822 9999</span>
              </li>
              <li className="flex items-center">
                <EnvelopeIcon className="w-4 h-4 mr-3 flex-shrink-0" style={{ color: goldColor }} />
                <span>reservation@letoile.vn</span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
