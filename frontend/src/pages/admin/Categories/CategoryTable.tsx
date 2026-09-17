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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase font-medium bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-center w-16">STT</th>
              <th className="px-6 py-5">Hình ảnh</th>
              <th className="px-6 py-5">Tên Category</th>
              <th className="px-6 py-5 min-w-[300px]">Mô tả</th>
              <th className="px-6 py-5 text-center">Số món</th>
              <th className="px-6 py-5 text-center">Trạng thái</th>
              <th className="px-6 py-5 text-center">Ngày tạo</th>
              <th className="px-6 py-5 text-center">Thao tác</th>
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
                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors bg-white">
                  <td className="px-6 py-6 text-gray-500 text-center">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-6 py-6">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center text-amber-500 border border-orange-100 ${category.image ? 'hidden' : ''}`}>
                      <ImageIcon size={24} strokeWidth={1.5} />
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 text-base">{category.name}</span>
                        {/* {category.name.toLowerCase().includes('chính') && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded uppercase tracking-wider">
                            Bestseller
                          </span>
                        )}
                        {category.name.toLowerCase().includes('tasting') && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded uppercase tracking-wider">
                            Signature
                          </span>
                        )} */}
                      </div>
                      <div className="flex items-center text-xs text-gray-400 gap-2">
                        <span className="uppercase tracking-wider">CAT-{String(category.id).padStart(2, '0')}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="italic">{category.name} Menu</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    {category.description ? (
                      <span className="line-clamp-2 text-gray-500 text-sm leading-relaxed" title={category.description}>{category.description}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-6 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-gray-700">{category.items_count ?? 0}</span>
                      <span className="text-xs">món</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${category.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${category.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {category.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center text-gray-500 text-sm">{formatDate(category.created_at)}</td>
                  <td className="px-6 py-6 text-center relative">
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
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${category.status === 'ACTIVE' ? 'text-amber-600' : 'text-green-600'
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
