import { Edit, Eye, Lock, Unlock, Trash2, MoreVertical, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Category } from '../../../types';
import { useState, useRef, useEffect } from 'react';

interface CategoryTableProps {
  categories: Category[];
  page: number;
  limit: number;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
  onDelete: (category: Category) => void;
  statusLoadingId?: number | null;
}

const CategoryTable = ({ 
  categories, 
  page, 
  limit, 
  onView, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  statusLoadingId 
}: CategoryTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium">STT</th>
              <th className="px-6 py-4 font-medium">Hình ảnh</th>
              <th className="px-6 py-4 font-medium">Tên Category</th>
              <th className="px-6 py-4 font-medium min-w-[200px]">Mô tả</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium">Ngày tạo</th>
              <th className="px-6 py-4 font-medium text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Không tìm thấy Category phù hợp
                </td>
              </tr>
            ) : (
              categories.map((category, index) => (
                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    {category.image ? (
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-12 h-12 rounded object-cover border border-gray-200"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {/* Fallback placeholder */}
                    <div className={`w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 ${category.image ? 'hidden' : ''}`}>
                      <ImageIcon size={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {category.description ? (
                      <span className="line-clamp-2" title={category.description}>{category.description}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(category.created_at)}</td>
                  <td className="px-6 py-4 text-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (statusLoadingId !== category.id) {
                          setOpenMenuId(openMenuId === category.id ? null : category.id);
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                      disabled={statusLoadingId === category.id}
                    >
                      {statusLoadingId === category.id ? (
                        <Loader2 size={18} className="animate-spin text-amber-600" />
                      ) : (
                        <MoreVertical size={18} />
                      )}
                    </button>

                    {openMenuId === category.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-6 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-10 py-1"
                      >
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onView(category);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye size={16} /> Xem chi tiết
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(category);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit size={16} /> Chỉnh sửa
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleStatus(category);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                            category.status === 'ACTIVE' ? 'text-amber-600' : 'text-green-600'
                          }`}
                        >
                          {category.status === 'ACTIVE' ? (
                            <><Lock size={16} /> Ẩn danh mục</>
                          ) : (
                            <><Unlock size={16} /> Hiện danh mục</>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(category);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Xóa
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
