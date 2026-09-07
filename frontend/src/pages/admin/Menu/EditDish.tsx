import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, RefreshCw, Save } from 'lucide-react';
import { menuService } from '../../../services/menuService';
import { categoryService } from '../../../services/categoryService';
import { Category } from '../../../types';

const EditDishPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error('Lỗi khi tải danh mục', error);
      }
    };
    
    const fetchDishData = async () => {
      if (!id) return;
      try {
        const data = await menuService.getMenuItemById(Number(id));
        setName(data.name || '');
        setCategoryId(data.category_id || '');
        setCode(data.code || '');
        setDescription(data.description || '');
        setImageUrl(data.image || '');
        setPrice(data.price ? data.price.toString() : '');
      } catch (error) {
        console.error('Lỗi khi tải thông tin món ăn', error);
        alert('Không tìm thấy thông tin món ăn!');
        navigate('/admin/menu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
    fetchDishData();
  }, [id, navigate]);

  const generateCode = () => {
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setCode(`#MN-${randomStr}-${randomNum}`);
  };

  const formatPrice = (val: string) => {
    if (!val) return '';
    const numericValue = val.replace(/\D/g, '');
    return new Intl.NumberFormat('vi-VN').format(Number(numericValue));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setPrice(numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !price) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      await menuService.updateMenuItem(Number(id), {
        name,
        category_id: Number(categoryId),
        code,
        description,
        price: Number(price),
        image: imageUrl
      });
      navigate('/admin/menu');
    } catch (error) {
      console.error('Lỗi khi cập nhật món', error);
      alert('Đã có lỗi xảy ra khi cập nhật món.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/menu')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại Thực đơn
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif text-gray-900 mb-2">Sửa Thông Tin Món Ăn</h1>
            <p className="text-gray-500 text-sm">
              Cập nhật thông tin món ăn, phân loại nguyên liệu thượng hạng và thiết lập cơ chế định giá.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 mb-8" />

      {/* Form Content */}
      <form id="edit-dish-form" onSubmit={handleSubmit} className="flex-1 flex flex-col md:flex-row gap-8">

        {/* Left Column - Core Info */}
        <div className="flex-1 bg-white p-8 border border-gray-200 rounded-sm shadow-sm flex flex-col">
          <h2 className="text-xl font-serif text-gray-800 mb-8">Thông Tin</h2>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Tên món ăn
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 px-4 py-3 text-gray-800 rounded-sm transition-colors text-lg"
              placeholder="Nhập tên món ăn..."
            />
          </div>

          <div className="flex gap-6 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Danh mục thực đơn *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-gray-50 border border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 px-4 py-3 text-gray-800 rounded-sm appearance-none"
              >
                <option value="" disabled>Chọn danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Mã món ăn (SKU Định danh)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  readOnly
                  className="w-full bg-gray-50 border border-transparent px-4 py-3 text-gray-800 font-medium rounded-sm"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase flex items-center"
                >
                  Tạo lại
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Mô tả & Các thành phần món ăn
              </label>
              <span className="text-xs text-gray-400 italic">Gợi ý 80-120 từ</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full flex-1 bg-gray-50 border border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 px-4 py-3 text-gray-700 rounded-sm transition-colors resize-none leading-relaxed"
              placeholder="Nhập mô tả chi tiết, nguồn gốc nguyên liệu..."
              rows={8}
            />
          </div>
        </div>

        {/* Right Column - Image & Pricing */}
        <div className="w-full md:w-96 flex flex-col gap-8">

          {/* Image Upload/Link */}
          <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm flex flex-col">
            <h2 className="text-xl font-serif text-gray-800 mb-6">Ảnh Món Ăn</h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Đường dẫn (URL) hình ảnh
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white focus:ring-0 px-3 py-2 text-sm text-gray-800 rounded-sm transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 bg-gray-50 h-48 rounded-sm flex flex-col items-center justify-center p-4 relative overflow-hidden group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    // Show error text instead
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 text-gray-300 mb-2 flex items-center justify-center">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500">Dán URL vào ô phía trên để xem trước hình ảnh</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 border border-gray-200 rounded-sm shadow-sm">
            <h2 className="text-xl font-serif text-gray-800 mb-6 flex items-center">
              Định Giá & Phí Dịch Vụ
              <span className="text-[10px] text-yellow-600 ml-2 font-sans tracking-wider border border-yellow-600 px-1 py-0.5">VND (VNĐ)</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Giá niêm yết thực khách *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={price ? formatPrice(price) : ''}
                  onChange={handlePriceChange}
                  className="w-full bg-gray-50 border border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 px-4 py-4 text-gray-900 text-xl font-medium rounded-sm"
                  placeholder="0"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                  đ / Khẩu phần
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Footer Action */}
      <div className="mt-8 border-t border-gray-200 pt-6 flex justify-end">
        <button
          type="submit"
          form="edit-dish-form"
          disabled={isSubmitting}
          className="flex items-center px-8 py-3 bg-black hover:bg-gray-800 text-white font-semibold tracking-wide uppercase text-sm rounded-sm transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Check className="h-5 w-5 mr-2" />
          )}
          Cập nhật thông tin
        </button>
      </div>

    </div>
  );
};

export default EditDishPage;
