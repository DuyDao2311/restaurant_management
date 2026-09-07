import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowUpDown, RefreshCw, Eye, Pencil, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import { menuService } from '../../../services/menuService';
import { categoryService } from '../../../services/categoryService';
import { MenuItem, Category } from '../../../types';

const mockMenuItems: MenuItem[] = [
  {
    id: 1,
    category_id: 1,
    code: '#WGY-001',
    name: 'Bò Wagyu A5 Miyazaki Than Binchotan',
    description: 'Thịt bò Wagyu vân mỡ cẩm thạch A5, muối...',
    price: 2750000,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=150&auto=format&fit=crop',
    status: 'ACTIVE',
    is_available: true,
  },
  {
    id: 2,
    category_id: 2,
    code: '#SCL-014',
    name: 'Sò Điệp Hokkaido Khói Trầm Hương',
    description: 'Sò điệp tươi sống từ đảo Hokkaido, xông...',
    price: 890000,
    image: 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?q=80&w=150&auto=format&fit=crop',
    status: 'ACTIVE',
    is_available: true,
  },
  {
    id: 3,
    category_id: 2,
    code: '#FOI-008',
    name: 'Gan Ngỗng Béo Áp Chảo Sốt Vang Port',
    description: 'Foie Gras nhập khẩu Pháp, bánh mì Brioch...',
    price: 1150000,
    image: 'https://images.unsplash.com/photo-1626082895617-2c6b4121d1ee?q=80&w=150&auto=format&fit=crop',
    status: 'ACTIVE',
    is_available: true,
  },
  {
    id: 4,
    category_id: 3,
    code: '#LOB-022',
    name: 'Tôm Hùm Nha Trang Nướng Bơ Tỏi Đen',
    description: 'Tôm hùm bông loại 1, tỏi đen Lý Sơn lên m...',
    price: 2450000,
    image: 'https://images.unsplash.com/photo-1559742811-822873691df8?q=80&w=150&auto=format&fit=crop',
    status: 'ACTIVE',
    is_available: false,
  },
  {
    id: 5,
    category_id: 3,
    code: '#TRF-005',
    name: 'Nấm Truffle Trắng Alba Kèm Pasta Tươi',
    description: 'Pasta Tagliolini tươi cán tay mỗi sáng, nấm...',
    price: 1890000,
    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=150&auto=format&fit=crop',
    status: 'ACTIVE',
    is_available: true,
  },
  {
    id: 6,
    category_id: 4,
    code: '#DES-031',
    name: 'Bánh Soufflé Grand Marnier',
    description: 'Rượu mùi Grand Marnier hảo hạng, kem...',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=150&auto=format&fit=crop',
    status: 'ACTIVE',
    is_available: true,
  }
];

const mockCategories: Category[] = [
  { id: 1, name: 'Hải sản & Bò thượng hạng', status: 'ACTIVE' },
  { id: 2, name: 'Khai vị', status: 'ACTIVE' },
  { id: 3, name: 'Món chính', status: 'ACTIVE' },
  { id: 4, name: 'Tráng miệng', status: 'ACTIVE' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const MenuPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewItem, setViewItem] = useState<MenuItem | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Bật mock data tạm thời nếu API chưa có data để test UI
      const fetchedCategories = await categoryService.getAllCategories().catch(() => mockCategories);
      const fetchedItems = await menuService.getAllMenuItems().catch(() => mockMenuItems);

      setCategories(fetchedCategories.length ? fetchedCategories : mockCategories);
      setItems(fetchedItems.length ? fetchedItems : mockMenuItems);
    } catch (error) {
      console.error("Failed to load data, using mock data", error);
      setCategories(mockCategories);
      setItems(mockMenuItems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-4">

        <div className="flex items-center space-x-4 flex-1 max-w-2xl mr-4">
          <button
            onClick={() => navigate('/admin/menu/new')}
            className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black whitespace-nowrap uppercase"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm món mới
          </button>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Tìm theo tên món, mã món, hoặc nguyên liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {/* <span className="text-sm font-medium text-gray-700 uppercase">Trạng thái:</span> */}
            <div className="relative">
              <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none border bg-white">
                <option>Tất cả trạng thái</option>
                <option>Còn hàng</option>
                <option>Hết hàng</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="relative">
            <select className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none border bg-white">
              <option value="">Tất cả các món ăn</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <button
            onClick={fetchData}
            className="p-2 border border-gray-300 shadow-sm rounded-md text-gray-500 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <RefreshCw className="h-5 w-5" />
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
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between mt-auto">
          <div>
            <p className="text-sm text-gray-700">
              Đang hiển thị <span className="font-medium">1</span> - <span className="font-medium">{items.length}</span> trên tổng số <span className="font-medium">{items.length}</span> món ăn
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button disabled className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-300">
                <span className="sr-only">Previous</span>
                <span aria-hidden="true">&lt;</span>
              </button>
              {Array.from({ length: Math.max(1, Math.ceil(items.length / 10)) }).map((_, i) => (
                <button 
                  key={i} 
                  aria-current={i === 0 ? "page" : undefined} 
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${i === 0 ? 'z-10 bg-black text-white border-black' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-300">
                <span className="sr-only">Next</span>
                <span aria-hidden="true">&gt;</span>
              </button>
            </nav>
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
