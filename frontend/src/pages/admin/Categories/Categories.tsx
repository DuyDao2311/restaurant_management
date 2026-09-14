import { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { categoryService, Pagination, CreateCategoryData, UpdateCategoryData } from '../../../services/categoryService';
import { Category } from '../../../types';
import CategoryTable from './CategoryTable';
import CategoryFormModal from './CategoryFormModal';
import DeleteCategoryModal from './DeleteCategoryModal';
import CategoryDetailModal from './CategoryDetailModal';

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, total_pages: 0 });
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
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await categoryService.getCategories(
        pagination.page,
        pagination.limit,
        debouncedSearch
      );
      if (res.success) {
        setCategories(res.data.items);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError('Không thể tải danh sách Category. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [pagination.page, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Category</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={18} />
          Thêm Category
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            placeholder="Tìm kiếm Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          {pagination.total_pages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      p === pagination.page
                        ? 'bg-amber-600 text-white border border-amber-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </nav>
            </div>
          )}
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

export default CategoriesPage;
