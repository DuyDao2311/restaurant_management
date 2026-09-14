import React from 'react';
import { X, Calendar, Image as ImageIcon, Tag, Hash, FileText } from 'lucide-react';
import { Category } from '../../../types';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

const CategoryDetailModal = ({ isOpen, onClose, category }: CategoryDetailModalProps) => {
  if (!isOpen || !category) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Chi tiết Category</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Section */}
            <div className="flex-shrink-0 w-full md:w-1/3">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                    }}
                  />
                ) : (
                  <ImageIcon size={48} className="text-gray-300" />
                )}
              </div>
              <div className="mt-3 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    category.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {category.status}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="flex-grow space-y-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{category.name}</h4>
              </div>

              <div className="grid grid-cols-1 gap-y-3 text-sm">
                <div className="flex gap-2">
                  <Hash size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-gray-500 font-medium">ID</p>
                    <p className="text-gray-900">{category.id}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <FileText size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-gray-500 font-medium">Mô tả</p>
                    <p className="text-gray-900">{category.description || <span className="text-gray-400 italic">Không có mô tả</span>}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Calendar size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-gray-500 font-medium">Ngày tạo</p>
                    <p className="text-gray-900">{formatDate(category.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Calendar size={18} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-gray-500 font-medium">Cập nhật lần cuối</p>
                    <p className="text-gray-900">{formatDate(category.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
