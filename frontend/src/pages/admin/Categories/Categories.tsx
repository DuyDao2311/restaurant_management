import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import { categoryService, CreateCategoryData, UpdateCategoryData } from '../../../services/categoryService';
import { Category, Pagination as PaginationType } from '../../../types';
import CategoryTable from './CategoryTable';
import CategoryFormModal from './CategoryFormModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import CategoryDetailModal from './CategoryDetailModal';
import Pagination from '../../../components/common/Pagination';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToView, setCategoryToView] = useState<Category | null>(null);

  // Delete & Toggle states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [filterOptions, setFilterOptions] = useState<string[]>([]);

  // Fetch categories
  const fetchCategories = async (
    pageToFetch: number = pagination.page,
    search: string = debouncedSearch,
    status: string = statusFilter,
    type: string = typeFilter
  ) => {
    setIsLoading(true);
    try {
      setError('');
      let finalSearch = search;
      if (type !== 'ALL') {
        finalSearch = search ? `${search} ${type}` : type;
      }
      const response = await categoryService.getCategories(pageToFetch, pagination.limit, finalSearch, status);
      if (response.success) {
        setCategories(response.data.items);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError('Không thể tải danh sách Category. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await categoryService.getCategories(1, 100);
        if (res.success) {
          const names = res.data.items.map(c => c.name);
          setFilterOptions(Array.from(new Set(names)));
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách lọc", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchCategories(1, debouncedSearch, statusFilter, typeFilter);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchCategories(newPage, debouncedSearch, statusFilter, typeFilter);
    }
  };

  // Actions
  const handleOpenAddModal = () => {
    setSelectedCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = async (category: Category) => {
    try {
      // Show some global loading if necessary, but here we can just use simple state or let it freeze slightly
      // Using prompt/alert or loading state. We will use a quick try-catch
      const res = await categoryService.getCategoryById(category.id);
      if (res.success && res.data) {
        setSelectedCategory(res.data);
        setIsFormModalOpen(true);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert('Category không tồn tại hoặc đã bị xóa.');
      } else {
        alert('Không thể tải thông tin Category. Vui lòng thử lại.');
      }
    }
  };

  const handleSubmitForm = async (data: CreateCategoryData | UpdateCategoryData) => {
    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, data as UpdateCategoryData);
        alert('Cập nhật Category thành công');
      } else {
        await categoryService.createCategory(data as CreateCategoryData);
        alert('Thêm Category thành công');
      }
      setIsFormModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      throw err; // Let modal catch and show the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetailModal = (category: Category) => {
    setCategoryToView(category);
    setIsDetailModalOpen(true);
  };

  const handleToggleStatus = async (category: Category) => {
    if (statusLoadingId) return;
    setStatusLoadingId(category.id);
    const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await categoryService.updateCategoryStatus(category.id, newStatus);
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái Category');
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleOpenDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      alert('Xóa Category thành công');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);

      // Handle pagination if deleting the last item on the current page
      if (categories.length === 1 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa Category');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Title */}
      <div className="mb-2">
        <h1 className="text-3xl font-normal text-slate-900 mb-2 flex items-center justify-between" style={{ fontFamily: '"Playfair Display", "Times New Roman", serif' }}>
          Danh Mục Thực Đơn
          <span className="text-gray-400 border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-sans">i</span>
        </h1>
        <p className="text-gray-500 text-sm">
          Hệ thống phân tầng danh mục ẩm thực chuẩn Fine Dining của RESTAURANT
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider whitespace-nowrap w-full sm:w-auto"
            style={{ backgroundColor: '#B4975A' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Thêm Category
          </button>

          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] sm:text-sm transition-colors"
              placeholder="Tìm kiếm Category (tên, mã món, mô tả)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang phục vụ (Active)</option>
            <option value="INACTIVE">Ngừng phục vụ (Inactive)</option>
          </select>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto border border-gray-200 rounded-lg text-sm px-4 py-2.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#B4975A] focus:border-[#B4975A] transition-colors cursor-pointer outline-none shadow-sm"
          >
            <option value="ALL">Tất cả loại thực đơn</option>
            {filterOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-100">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
          <p className="text-gray-500">Đang tải danh sách Category...</p>
        </div>
      ) : (
        <>
          <CategoryTable
            categories={categories}
            page={pagination.page}
            limit={pagination.limit}
            onView={handleOpenDetailModal}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleOpenDeleteModal}
            statusLoadingId={statusLoadingId}
          />

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-4 sm:mb-0">
              Hiển thị <span className="font-semibold text-gray-900">{categories.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span> trên tổng số <span className="font-semibold text-gray-900">{pagination.total}</span> danh mục
            </div>
            {pagination.total_pages > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSubmitForm}
        category={selectedCategory}
        isLoading={isSubmitting}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        category={categoryToDelete}
        isLoading={isDeleting}
      />

      <CategoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        category={categoryToView}
      />
    </div>
  );
};

export default Categories;
