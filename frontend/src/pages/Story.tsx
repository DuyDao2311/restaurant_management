import { Link, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const Story = () => {
  const goldColor = '#B4975A';
  const location = useLocation();

  return (
    <div className="font-sans text-gray-800 bg-white">
      <Header />

      {/* ============================================
          SECTION 1: Notre Histoire & Philosophie
          ============================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* French subtitle */}
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] mb-6"
            style={{ color: goldColor }}
          >
            NOTRE HISTOIRE & PHILOSOPHIE
          </p>

          {/* Main title - decorative serif */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl mb-6 font-normal tracking-tight text-slate-900 leading-tight"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Câu Chuyện Của Chúng Tôi
          </h1>

          {/* Italic tagline */}
          <p
            className="text-lg sm:text-xl mb-12 md:mb-16 text-gray-500"
            style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
          >
            "Nơi mỗi món ăn kể một câu chuyện"
          </p>

          {/* Hero image */}
          <div className="mb-12 md:mb-16">
            <img
              src="/restaurant_dining.png"
              alt="Không gian nhà hàng - khách thưởng thức bữa tối"
              className="w-full h-auto object-cover"
              style={{ aspectRatio: '16/9' }}
            />
          </div>

          {/* Story paragraphs */}
          <div className="max-w-3xl mx-auto space-y-6">
            <p
              className="text-gray-600 text-base sm:text-lg leading-relaxed"
              style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
            >
              Từ những ngày đầu tiên, chúng tôi luôn tin rằng một bữa ăn ngon không chỉ nằm ở hương
              vị, mà còn ở cảm xúc được tạo nên trong từng khoảnh khắc.
            </p>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Nhà hàng được xây dựng với mong muốn mang đến một không gian nơi mọi người có thể tạm rời xa nhịp
              sống bận rộn, cùng nhau thưởng thức những món ăn được chuẩn bị bằng sự tận tâm và chia sẻ những câu
              chuyện của riêng mình.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: Từ Nguyên Liệu Đến Bàn Ăn
          ============================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Text content */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-4"
                style={{ color: goldColor }}
              >
                DE LA TERRE À LA TABLE
              </p>

              <h2
                className="text-3xl sm:text-4xl md:text-[2.75rem] mb-8 font-normal tracking-tight text-slate-900 leading-tight"
                style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
              >
                Từ nguyên liệu đến bàn ăn
              </h2>

              <div className="space-y-5 mb-10">
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                  Chúng tôi lựa chọn nguyên liệu với sự cẩn trọng, ưu tiên những
                  nguyên liệu tươi ngon, chất lượng và có nguồn gốc rõ ràng.
                </p>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                  Mỗi món ăn được chuẩn bị bởi đội ngũ đầu bếp với sự chú ý đến
                  từng chi tiết — từ cách lựa chọn nguyên liệu, kết hợp hương vị cho
                  đến cách trình bày.
                </p>
              </div>

              {/* Quote with left border */}
              <div
                className="border-l-4 pl-6 py-2"
                style={{ borderColor: goldColor }}
              >
                <p
                  className="text-base sm:text-lg text-gray-700 leading-relaxed"
                  style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
                >
                  "Chúng tôi không chỉ phục vụ một món ăn. Chúng tôi
                  muốn mang đến một trải nghiệm đáng nhớ."
                </p>
              </div>
            </div>

            {/* Right: Chef image */}
            <div>
              <img
                src="/chef_cooking.png"
                alt="Đầu bếp đang chế biến món ăn"
                className="w-full h-auto object-cover"
                style={{ aspectRatio: '4/3' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: Hơn Cả Một Bữa Ăn
          ============================================ */}
      <section className="py-20 md:py-28 bg-[#F5F4F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] mb-6"
            style={{ color: goldColor }}
          >
            L'ETOILE EXPÉRIENCE
          </p>

          <h2
            className="text-3xl sm:text-4xl md:text-[2.75rem] mb-6 font-normal tracking-tight text-slate-900"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Hơn cả một bữa ăn
          </h2>

          {/* Decorative divider */}
          <div className="flex justify-center mb-10">
            <div className="w-12 h-px bg-gray-400"></div>
          </div>

          <div className="space-y-6">
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Đối với chúng tôi, nhà hàng không chỉ là nơi để thưởng thức món ăn.
            </p>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Đó có thể là một bữa tối bên gia đình, một cuộc gặp gỡ cùng bạn bè, một buổi hẹn đặc
              biệt hay đơn giản là một khoảng thời gian để bạn dành cho chính mình.
            </p>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Vì vậy, chúng tôi luôn cố gắng tạo nên một không gian ấm áp, tinh tế và gần gũi, nơi mỗi
              vị khách khi rời đi đều mang theo một trải nghiệm đẹp.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: Giá Trị Chúng Tôi Theo Đuổi
          ============================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-[0.25em] mb-6"
              style={{ color: goldColor }}
            >
              NOS VALEURS FONDAMENTALES
            </p>

            <h2
              className="text-3xl sm:text-4xl md:text-[2.75rem] mb-6 font-normal tracking-tight text-slate-900"
              style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
            >
              Giá trị chúng tôi theo đuổi
            </h2>

            {/* Decorative divider */}
            <div className="flex justify-center">
              <div className="w-12 h-px bg-gray-400"></div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Value 1: Chất lượng */}
            <div className="bg-[#FAFAF8] rounded-xl p-8 text-left shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-5">✅</div>
              <h3
                className="text-xl sm:text-2xl mb-3 font-normal text-slate-900"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Chất lượng
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Luôn đặt chất lượng nguyên liệu và món ăn lên hàng đầu.
              </p>
              <p
                className="text-xs font-bold uppercase tracking-wider text-gray-400"
              >
                01 / EXCELLENCE
              </p>
            </div>

            {/* Value 2: Tận tâm */}
            <div className="bg-[#FAFAF8] rounded-xl p-8 text-left shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-5">🤝</div>
              <h3
                className="text-xl sm:text-2xl mb-3 font-normal text-slate-900"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Tận tâm
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Chăm chút từng món ăn và từng trải nghiệm của khách hàng.
              </p>
              <p
                className="text-xs font-bold uppercase tracking-wider text-gray-400"
              >
                02 / DÉVOUEMENT
              </p>
            </div>

            {/* Value 3: Tinh tế */}
            <div className="bg-[#FAFAF8] rounded-xl p-8 text-left shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-5">✨</div>
              <h3
                className="text-xl sm:text-2xl mb-3 font-normal text-slate-900"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Tinh tế
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Từ không gian, món ăn đến cách phục vụ đều được quan tâm đến từng chi tiết.
              </p>
              <p
                className="text-xs font-bold uppercase tracking-wider text-gray-400"
              >
                03 / ÉLÉGANCE
              </p>
            </div>

            {/* Value 4: Kết nối */}
            <div className="bg-[#FAFAF8] rounded-xl p-8 text-left shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-5">❤️</div>
              <h3
                className="text-xl sm:text-2xl mb-3 font-normal text-slate-900"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Kết nối
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Tạo nên những khoảnh khắc để mọi người cùng thưởng thức, trò chuyện và kết nối.
              </p>
              <p
                className="text-xs font-bold uppercase tracking-wider text-gray-400"
              >
                04 / HARMONIE
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: Invitation / CTA
          ============================================ */}
      <section className="py-20 md:py-28 bg-[#F5F4F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p
            className="text-xs font-bold uppercase tracking-[0.25em] mb-6"
            style={{ color: goldColor }}
          >
            INVITATION EXCLUSIVE
          </p>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl mb-8 font-normal tracking-tight text-slate-900"
            style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}
          >
            Một bàn ăn, một câu chuyện
          </h2>

          <div className="space-y-5 mb-10">
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Mỗi vị khách đến với chúng tôi đều có một câu chuyện riêng.
            </p>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Có người đến để gặp gỡ những người thân yêu. Có người đến để kỷ niệm một ngày đặc
              biệt. Và cũng có người chỉ đơn giản muốn tìm một nơi để thưởng thức một bữa ăn thật ngon.
            </p>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Chúng tôi rất vui khi được trở thành một phần trong những câu chuyện ấy.
            </p>
          </div>

          {/* Italic closing */}
          <p
            className="text-lg sm:text-xl mb-12 text-gray-600"
            style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
          >
            Hẹn gặp bạn tại bàn ăn.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/menu"
              className="w-full sm:w-auto bg-transparent px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
            >
              Khám phá thực đơn
            </Link>
            <Link
              to="/#booking"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                  window.history.pushState(null, '', '/#booking');
                }
              }}
              className="w-full sm:w-auto bg-[#111] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              Đặt bàn ngay
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Story;
