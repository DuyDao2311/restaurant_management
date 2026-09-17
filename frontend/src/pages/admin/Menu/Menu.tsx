import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowUpDown, RefreshCw, Eye, Pencil, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { menuService } from '../../../services/menuService';
import { categoryService } from '../../../services/categoryService';
import { MenuItem, Category, Pagination } from '../../../types';
import PaginationComponent from '../../../components/common/Pagination';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const MenuPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [viewItem, setViewItem] = useState<MenuItem | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const categoryRes = await categoryService.getCategories(1, 100);
      const fetchedCategories = categoryRes.data?.items || [];

      const fetchedItemsRes = await menuService.getAllMenuItems({
        page: pagination.page,
        limit: pagination.limit,
        category_id: categoryFilter === '' ? undefined : categoryFilter,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined
      });

      setCategories(fetchedCategories);
      setItems(fetchedItemsRes.items);
      setPagination(prev => ({
        ...prev,
        total: fetchedItemsRes.total,
        total_pages: fetchedItemsRes.total_pages
      }));
    } catch (error) {
      console.error("Failed to load data, using mock data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, debouncedSearch, statusFilter, categoryFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)?.name || 'Chưa phân loại';
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    // Optimistic Update
    setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, status: newStatus } : item));

    try {
      await menuService.updateMenuItem(id, { status: newStatus });
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái', error);
      // Revert if failed
      setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, status: currentStatus } : item));
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-normal text-slate-900 mb-2 flex items-center justify-between" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
          Quản lý Thực Đơn
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý danh sách món ăn, giá cả và trạng thái phục vụ
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <button
            onClick={() => navigate('/admin/menu/new')}
            className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider whitespace-nowrap w-full sm:w-auto"
            style={{ backgroundColor: '#B4975A' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Thêm món mới
          </button>

          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] sm:text-sm transition-colors"
              placeholder="Tìm theo tên món, mã món, hoặc nguyên liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
          >
            <option value="">Tất cả các món ăn</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="p-2.5 border border-gray-200 shadow-sm rounded-lg text-gray-500 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  STT
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Món ăn & mô tả thành phần
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Phân loại
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Đơn giá (VND)
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-16 w-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                        {item.image ? (
                          <img className="h-full w-full object-cover" src={item.image} alt={item.name} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-medium text-gray-500">MÃ: {item.code || '#N/A'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{getCategoryName(item.category_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-base text-gray-900">{formatCurrency(item.price)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={async () => {
                        const newAvailable = !item.is_available;
                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newAvailable } : i));
                        try {
                          await menuService.updateMenuItem(item.id, { is_available: newAvailable });
                        } catch (e) {
                          setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: item.is_available } : i));
                        }
                      }}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border hover:opacity-80 transition-opacity focus:outline-none ${item.is_available
                        ? 'bg-gray-50 text-gray-700 border-gray-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-2 ${item.is_available ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                      {item.is_available ? 'Còn hàng' : 'Hết hàng'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setViewItem(item)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigate('/admin/menu/edit/' + item.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`transition-colors ${item.status === 'ACTIVE' ? 'text-gray-400 hover:text-gray-600' : 'text-red-400 hover:text-red-600'}`}
                        title={item.status === 'ACTIVE' ? 'Đang hiển thị' : 'Đang ẩn'}
                      >
                        {item.status === 'ACTIVE' ? <ToggleRight className="h-5 w-5 text-gray-700" /> : <ToggleLeft className="h-5 w-5 text-red-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between mt-auto">
          <div className="mb-4 sm:mb-0">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
              HIỂN THỊ <span className="font-bold text-gray-700">{items.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}</span> - <span className="font-bold text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> TRÊN TỔNG SỐ <span className="font-bold text-gray-700">{pagination.total}</span>
            </p>
          </div>
          <div>
            {pagination.total_pages > 0 && (
              <PaginationComponent
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* View Item Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col md:flex-row overflow-hidden relative">
            <button onClick={() => setViewItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10 bg-white/80 rounded-full p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            {viewItem.image ? (
              <img src={viewItem.image} alt={viewItem.name} className="w-full md:w-1/2 h-64 md:h-auto object-cover" />
            ) : (
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 flex items-center justify-center text-gray-400">Không có ảnh</div>
            )}
            <div className="p-8 md:w-1/2 flex flex-col">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {categories.find(c => c.id === viewItem.category_id)?.name || 'Danh mục trống'}
              </span>
              <h3 className="text-2xl font-serif text-gray-900 mb-1 leading-tight">{viewItem.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{viewItem.code}</p>
              <div className="text-xl font-medium text-gray-900 mb-6">{formatCurrency(viewItem.price)} VNĐ</div>
              <div className="flex-1 overflow-y-auto pr-2">
                <p className="text-gray-600 text-sm leading-relaxed">{viewItem.description || 'Chưa có mô tả cho món ăn này.'}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setViewItem(null); navigate('/admin/menu/edit/' + viewItem.id); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Chỉnh sửa
                </button>
                <button onClick={() => setViewItem(null)} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
