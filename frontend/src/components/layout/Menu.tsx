import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

interface Category {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  category_id: number;
  code: string | null;
  name: string;
  description: string;
  price: number;
  image: string;
}

const Menu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, itemsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/categories'),
          axios.get('http://localhost:8000/api/menu-items?status=ACTIVE')
        ]);

        if (catsRes.data.success) {
          setCategories(catsRes.data.data);
        }
        if (itemsRes.data.success) {
          setMenuItems(itemsRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching menu data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const handleCategoryChange = (categoryId: number | 'ALL') => {
    setActiveCategoryId(categoryId);
    setCurrentPage(1);
  };

  const ITEMS_PER_PAGE = 6;
  const filteredByCategory = activeCategoryId === 'ALL'
    ? menuItems
    : menuItems.filter(item => item.category_id === activeCategoryId);

  const totalPages = Math.ceil(filteredByCategory.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredByCategory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans">
      <Header />

      <main className="flex-grow">
        {/* Title Section */}
        <section className="pt-16 pb-10 text-center px-4">
          <p className="text-[#B4975A] text-xs font-bold tracking-widest uppercase mb-4">Haute Gastronomie</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
            Thực Đơn Ẩm Thực
          </h1>
          <p className="text-gray-500 italic mb-6 text-lg" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
            RESTAURANT
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Mỗi tuyệt tác là sự giao hòa thuần khiết giữa hương vị nguyên bản và kỹ nghệ ẩm thực thủ công đỉnh cao.
          </p>
        </section>

        {/* Categories Filter */}
        <section className="py-6 border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-6 md:gap-10">
            <button
              onClick={() => handleCategoryChange('ALL')}
              className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeCategoryId === 'ALL' ? 'text-gray-900 border-[#B4975A]' : 'text-gray-500 border-transparent hover:text-gray-900'
                }`}
            >
              Tất Cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${activeCategoryId === cat.id ? 'text-gray-900 border-[#B4975A]' : 'text-gray-500 border-transparent hover:text-gray-900'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Menu Items Grid */}
        <section className="py-12 max-w-5xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4975A]"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                {paginatedItems.map(item => (
                  <div key={item.id} className="flex gap-6 items-start group">
                    <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 overflow-hidden relative">
                      {item.image ? (
                        <img
                          src={item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className="text-lg md:text-xl text-gray-900 leading-tight" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
                          {item.name}
                        </h3>
                        <span className="text-base md:text-lg font-medium text-gray-900 whitespace-nowrap">
                          {formatPrice(item.price)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 italic mb-2">
                        {item.code ? item.code : 'Spécialité du Chef'}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {item.description || 'Món ăn đặc biệt từ bếp trưởng, mang hương vị đặc trưng.'}
                      </p>
                    </div>
                  </div>
                ))}

                {paginatedItems.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500">
                    Không có món ăn nào trong danh mục này.
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center border transition-colors text-sm font-medium ${currentPage === page
                        ? 'border-[#B4975A] bg-[#B4975A] text-white'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer CTA Section */}
        <section className="py-20 text-center px-4">
          <p className="text-[#B4975A] text-xs font-bold tracking-widest uppercase mb-4">Bespoke Experience</p>
          <h2 className="text-3xl md:text-4xl text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
            Dịch Vụ Cá Nhân Hóa & Đặt Phòng Riêng
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-8">
            Nhà hàng luôn sẵn sàng tùy biến thực đơn theo chế độ ăn kiêng riêng biệt hoặc<br className="hidden md:block" />kết nối cùng chuyên gia Sommelier cho bữa tiệc của bạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <span className="text-gray-900 text-sm">Hotline VIP Concierge: <strong className="font-semibold">028 3822 8899</strong></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <button className="border border-gray-900 text-gray-900 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
              Yêu Cầu Đặt Bàn VIP
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Menu;
